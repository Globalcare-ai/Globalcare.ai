/** GlobalCareEscrow (Arc Testnet) — ABI subset the app actually calls, plus shared types. */

export const ESCROW_ABI = [
  {
    type: "function", name: "fund", stateMutability: "nonpayable",
    inputs: [{ name: "journeyId", type: "bytes32" }, { name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function", name: "releaseMilestone", stateMutability: "nonpayable",
    inputs: [{ name: "journeyId", type: "bytes32" }, { name: "milestone", type: "uint8" }],
    outputs: [{ name: "amount", type: "uint256" }],
  },
  {
    type: "function", name: "refund", stateMutability: "nonpayable",
    inputs: [{ name: "journeyId", type: "bytes32" }, { name: "toPatient", type: "uint256" }, { name: "toBeneficiary", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function", name: "getEscrow", stateMutability: "view",
    inputs: [{ name: "journeyId", type: "bytes32" }],
    outputs: [
      { name: "patient", type: "address" },
      { name: "beneficiary", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "releasedAmount", type: "uint256" },
      { name: "refundedAmount", type: "uint256" },
      { name: "remaining", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "released", type: "bool[3]" },
    ],
  },
  {
    type: "function", name: "milestoneAmount", stateMutability: "view",
    inputs: [{ name: "journeyId", type: "bytes32" }, { name: "milestone", type: "uint8" }],
    outputs: [{ type: "uint256" }],
  },
  { type: "function", name: "trustee", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "usdc", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] as const;

/** Contract Status enum. */
export const ESCROW_STATUS = ["none", "funded", "active", "completed", "refunded"] as const;
export type EscrowChainStatus = (typeof ESCROW_STATUS)[number];

export type OnChainEscrow = {
  patient: `0x${string}`;
  beneficiary: `0x${string}`;
  totalAmount: bigint;
  releasedAmount: bigint;
  refundedAmount: bigint;
  remaining: bigint;
  status: EscrowChainStatus;
  released: readonly [boolean, boolean, boolean];
};

export function decodeEscrow(
  raw: readonly [`0x${string}`, `0x${string}`, bigint, bigint, bigint, bigint, number, readonly boolean[]]
): OnChainEscrow {
  return {
    patient: raw[0],
    beneficiary: raw[1],
    totalAmount: raw[2],
    releasedAmount: raw[3],
    refundedAmount: raw[4],
    remaining: raw[5],
    status: ESCROW_STATUS[raw[6]] ?? "none",
    released: [raw[7][0] ?? false, raw[7][1] ?? false, raw[7][2] ?? false] as const,
  };
}
