// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GlobalCareEscrow
 * @notice Milestone escrow for GlobalCare.ai medical journeys, denominated in USDC.
 *
 * Flow:
 *   patient approves USDC  ->  patient calls fund()  ->  USDC is custodied here
 *   trustee (GlobalCare server signer) calls releaseMilestone() per completed milestone
 *   trustee calls refund() to return the unreleased remainder to the patient
 *
 * Milestones are fixed at 20% / 60% / 20% in basis points. No floating point anywhere.
 * Only the trustee can move money out; neither the patient nor the beneficiary can.
 */
contract GlobalCareEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        None, // 0 - never created
        Funded, // 1 - USDC held, nothing released
        Active, // 2 - at least one milestone released
        Completed, // 3 - fully released
        Refunded // 4 - remainder returned to the patient
    }

    struct Escrow {
        address patient;
        address beneficiary;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 refundedAmount;
        uint8 releasedMask; // bit i set => milestone i released
        Status status;
    }

    uint16 private constant BPS_DENOMINATOR = 10_000;
    uint8 public constant MILESTONE_COUNT = 3;

    /// @dev 20% / 60% / 20%
    uint16[3] public milestoneBps = [uint16(2000), uint16(6000), uint16(2000)];

    IERC20 public immutable usdc;

    /// @notice server-side signer allowed to release milestones and refund
    address public trustee;

    mapping(bytes32 => Escrow) private _escrows;

    event TrusteeChanged(address indexed previousTrustee, address indexed newTrustee);
    event EscrowFunded(bytes32 indexed journeyId, address indexed patient, address indexed beneficiary, uint256 amount);
    event MilestoneReleased(bytes32 indexed journeyId, uint8 indexed milestone, address indexed beneficiary, uint256 amount);
    event EscrowRefunded(bytes32 indexed journeyId, address indexed patient, uint256 toPatient, uint256 toBeneficiary);

    error NotTrustee();
    error ZeroAddress();
    error ZeroAmount();
    error EscrowExists();
    error EscrowMissing();
    error EscrowClosed();
    error BadMilestone();
    error MilestoneAlreadyReleased();
    error ExceedsRemaining();

    modifier onlyTrustee() {
        if (msg.sender != trustee) revert NotTrustee();
        _;
    }

    constructor(address usdcToken, address initialTrustee) Ownable(msg.sender) {
        if (usdcToken == address(0) || initialTrustee == address(0)) revert ZeroAddress();
        usdc = IERC20(usdcToken);
        trustee = initialTrustee;
        emit TrusteeChanged(address(0), initialTrustee);
    }

    /// @notice Owner can rotate the server signer without redeploying.
    function setTrustee(address newTrustee) external onlyOwner {
        if (newTrustee == address(0)) revert ZeroAddress();
        emit TrusteeChanged(trustee, newTrustee);
        trustee = newTrustee;
    }

    /**
     * @notice Patient funds a journey. Requires a prior USDC approve() for `amount`.
     * @param journeyId opaque reference to the GlobalCare journey (uuid -> bytes32)
     * @param beneficiary the GlobalCare company wallet that receives milestone releases
     * @param amount USDC amount in token units (6 decimals on Arc)
     */
    function fund(bytes32 journeyId, address beneficiary, uint256 amount) external nonReentrant {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        Escrow storage e = _escrows[journeyId];
        if (e.status != Status.None) revert EscrowExists();

        // effects before interaction
        e.patient = msg.sender;
        e.beneficiary = beneficiary;
        e.totalAmount = amount;
        e.status = Status.Funded;

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit EscrowFunded(journeyId, msg.sender, beneficiary, amount);
    }

    /**
     * @notice Trustee releases one milestone to the beneficiary.
     * @param milestone 0 = coordination (20%), 1 = treatment (60%), 2 = aftercare (20%)
     */
    function releaseMilestone(bytes32 journeyId, uint8 milestone) external nonReentrant onlyTrustee returns (uint256 amount) {
        if (milestone >= MILESTONE_COUNT) revert BadMilestone();

        Escrow storage e = _escrows[journeyId];
        if (e.status == Status.None) revert EscrowMissing();
        if (e.status == Status.Completed || e.status == Status.Refunded) revert EscrowClosed();

        uint8 bit = uint8(1) << milestone;
        if (e.releasedMask & bit != 0) revert MilestoneAlreadyReleased();

        uint256 remaining = e.totalAmount - e.releasedAmount - e.refundedAmount;
        amount = (e.totalAmount * milestoneBps[milestone]) / BPS_DENOMINATOR;

        // last milestone with no refunds sweeps any integer-division dust
        if (milestone == MILESTONE_COUNT - 1 && e.refundedAmount == 0) {
            amount = remaining;
        }
        if (amount == 0) revert ZeroAmount();
        if (amount > remaining) revert ExceedsRemaining();

        // effects
        e.releasedMask |= bit;
        e.releasedAmount += amount;
        e.status = (e.releasedAmount + e.refundedAmount == e.totalAmount) ? Status.Completed : Status.Active;

        // interaction
        usdc.safeTransfer(e.beneficiary, amount);

        emit MilestoneReleased(journeyId, milestone, e.beneficiary, amount);
    }

    /**
     * @notice Trustee refunds the unreleased remainder. Money already released is untouchable.
     * @param toPatient USDC returned to the patient
     * @param toBeneficiary optional cancellation fee kept by GlobalCare
     */
    function refund(bytes32 journeyId, uint256 toPatient, uint256 toBeneficiary) external nonReentrant onlyTrustee {
        Escrow storage e = _escrows[journeyId];
        if (e.status == Status.None) revert EscrowMissing();
        if (e.status == Status.Completed || e.status == Status.Refunded) revert EscrowClosed();
        if (toPatient == 0 && toBeneficiary == 0) revert ZeroAmount();

        uint256 remaining = e.totalAmount - e.releasedAmount - e.refundedAmount;
        if (toPatient + toBeneficiary > remaining) revert ExceedsRemaining();

        // effects
        e.refundedAmount += toPatient;
        e.releasedAmount += toBeneficiary;
        e.status = Status.Refunded;

        // interactions
        if (toPatient > 0) usdc.safeTransfer(e.patient, toPatient);
        if (toBeneficiary > 0) usdc.safeTransfer(e.beneficiary, toBeneficiary);

        emit EscrowRefunded(journeyId, e.patient, toPatient, toBeneficiary);
    }

    /// @notice Full escrow state. `released` is one bool per milestone.
    function getEscrow(bytes32 journeyId)
        external
        view
        returns (
            address patient,
            address beneficiary,
            uint256 totalAmount,
            uint256 releasedAmount,
            uint256 refundedAmount,
            uint256 remaining,
            Status status,
            bool[3] memory released
        )
    {
        Escrow storage e = _escrows[journeyId];
        patient = e.patient;
        beneficiary = e.beneficiary;
        totalAmount = e.totalAmount;
        releasedAmount = e.releasedAmount;
        refundedAmount = e.refundedAmount;
        remaining = e.totalAmount - e.releasedAmount - e.refundedAmount;
        status = e.status;
        for (uint8 i = 0; i < MILESTONE_COUNT; i++) {
            released[i] = (e.releasedMask & (uint8(1) << i)) != 0;
        }
    }

    /// @notice Amount a given milestone would pay out for a funded escrow.
    function milestoneAmount(bytes32 journeyId, uint8 milestone) external view returns (uint256) {
        if (milestone >= MILESTONE_COUNT) revert BadMilestone();
        Escrow storage e = _escrows[journeyId];
        uint256 remaining = e.totalAmount - e.releasedAmount - e.refundedAmount;
        if (milestone == MILESTONE_COUNT - 1 && e.refundedAmount == 0) return remaining;
        return (e.totalAmount * milestoneBps[milestone]) / BPS_DENOMINATOR;
    }
}
