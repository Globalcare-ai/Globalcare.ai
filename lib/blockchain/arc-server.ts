/**
 * SERVER ONLY. Holds the Arc trustee signer that releases milestones and refunds.
 * ESCROW_PRIVATE_KEY has no NEXT_PUBLIC_ prefix, so it is never bundled for the browser.
 * Imported exclusively by route handlers under app/api/.
 */
import { createWalletClient, createPublicClient, http, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_CHAIN, ARC_RPC_URL, ARC_USDC_ADDRESS, ARC_ESCROW_ADDRESS, journeyKey } from "./arc";
import { ESCROW_ABI, decodeEscrow, type OnChainEscrow } from "./escrow";

const RAW_KEY = process.env.ESCROW_PRIVATE_KEY?.trim();
const KEY = (RAW_KEY ? (RAW_KEY.startsWith("0x") ? RAW_KEY : `0x${RAW_KEY}`) : undefined) as `0x${string}` | undefined;

/** Stay under the serverless execution cap (Netlify 60s) so we fail loudly, not silently. */
const RECEIPT_TIMEOUT_MS = 45_000;

export function arcConfigured(): boolean {
  return !!KEY && /^0x[0-9a-fA-F]{64}$/.test(KEY) && !!ARC_ESCROW_ADDRESS;
}

function clients() {
  if (!arcConfigured()) throw new Error("Arc escrow is not configured on the server (ESCROW_PRIVATE_KEY / NEXT_PUBLIC_ARC_ESCROW_ADDRESS).");
  const account = privateKeyToAccount(KEY!);
  const pub = createPublicClient({ chain: ARC_CHAIN, transport: http(ARC_RPC_URL) }) as PublicClient;
  const wallet = createWalletClient({ account, chain: ARC_CHAIN, transport: http(ARC_RPC_URL) });
  return { account, pub, wallet, contract: ARC_ESCROW_ADDRESS as `0x${string}` };
}

/** Blockchain is the source of truth — read it before trusting any database row. */
export async function readArcEscrow(journeyId: string): Promise<OnChainEscrow> {
  const { pub, contract } = clients();
  const raw = await pub.readContract({ address: contract, abi: ESCROW_ABI, functionName: "getEscrow", args: [journeyKey(journeyId)] });
  return decodeEscrow(raw as never);
}

export async function readMilestoneAmount(journeyId: string, milestone: number): Promise<bigint> {
  const { pub, contract } = clients();
  return pub.readContract({ address: contract, abi: ESCROW_ABI, functionName: "milestoneAmount", args: [journeyKey(journeyId), milestone] }) as Promise<bigint>;
}

/** Release one milestone on-chain. Throws unless the receipt confirms success. */
export async function releaseMilestoneOnArc(journeyId: string, milestone: number): Promise<{ hash: string; amount: bigint }> {
  const { pub, wallet, contract } = clients();
  if (milestone < 0 || milestone > 2) throw new Error("Invalid milestone index");

  const onChain = await readArcEscrow(journeyId);
  if (onChain.status === "none") throw new Error("No escrow funded on Arc for this journey");
  if (onChain.released[milestone]) throw new Error("Milestone already released on-chain");
  const amount = await readMilestoneAmount(journeyId, milestone);
  if (amount <= BigInt(0)) throw new Error("Milestone amount is zero");
  if (amount > onChain.remaining) throw new Error("Milestone exceeds remaining escrow balance");

  const hash = await wallet.writeContract({
    address: contract, abi: ESCROW_ABI, functionName: "releaseMilestone",
    args: [journeyKey(journeyId), milestone], chain: ARC_CHAIN, account: wallet.account!,
  });
  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: RECEIPT_TIMEOUT_MS }).catch(() => null);
  if (!receipt) {
    // the transaction is live on Arc; only our wait gave up. Surface the hash so the
    // release can be reconciled instead of silently disappearing.
    throw new Error(`Release broadcast but not confirmed within ${RECEIPT_TIMEOUT_MS / 1000}s — tx ${hash}. Check the explorer before retrying.`);
  }
  if (receipt.status !== "success") throw new Error(`Release reverted on Arc — ${hash}`);
  return { hash, amount };
}

/** Refund the unreleased remainder. Throws unless the receipt confirms success. */
export async function refundOnArc(journeyId: string, toPatient: bigint, toBeneficiary: bigint): Promise<string> {
  const { pub, wallet, contract } = clients();
  const onChain = await readArcEscrow(journeyId);
  if (onChain.status === "none") throw new Error("No escrow funded on Arc for this journey");
  if (toPatient + toBeneficiary > onChain.remaining) throw new Error("Refund exceeds remaining escrow balance");

  const hash = await wallet.writeContract({
    address: contract, abi: ESCROW_ABI, functionName: "refund",
    args: [journeyKey(journeyId), toPatient, toBeneficiary], chain: ARC_CHAIN, account: wallet.account!,
  });
  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: RECEIPT_TIMEOUT_MS }).catch(() => null);
  if (!receipt) {
    throw new Error(`Refund broadcast but not confirmed within ${RECEIPT_TIMEOUT_MS / 1000}s — tx ${hash}. Check the explorer before retrying.`);
  }
  if (receipt.status !== "success") throw new Error(`Refund reverted on Arc — ${hash}`);
  return hash;
}

export { ARC_USDC_ADDRESS };
