/** Minimal ERC-20 surface + USDC decimal handling (read from the token, never assumed). */
import { createPublicClient, http, type PublicClient } from "viem";
import { ARC_CHAIN, ARC_RPC_URL, ARC_USDC_ADDRESS } from "./arc";

export const ERC20_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export function arcPublicClient(): PublicClient {
  return createPublicClient({ chain: ARC_CHAIN, transport: http(ARC_RPC_URL) }) as PublicClient;
}

let cachedDecimals: number | null = null;

/** Reads decimals() off the token. Arc's USDC ERC-20 interface reports 6. */
export async function usdcDecimals(client?: PublicClient): Promise<number> {
  if (cachedDecimals != null) return cachedDecimals;
  const pc = client ?? arcPublicClient();
  const d = await pc.readContract({ address: ARC_USDC_ADDRESS, abi: ERC20_ABI, functionName: "decimals" });
  cachedDecimals = Number(d);
  return cachedDecimals;
}

export async function usdcBalance(owner: `0x${string}`, client?: PublicClient): Promise<bigint> {
  const pc = client ?? arcPublicClient();
  return pc.readContract({ address: ARC_USDC_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: [owner] });
}

export async function usdcAllowance(owner: `0x${string}`, spender: `0x${string}`, client?: PublicClient): Promise<bigint> {
  const pc = client ?? arcPublicClient();
  return pc.readContract({ address: ARC_USDC_ADDRESS, abi: ERC20_ABI, functionName: "allowance", args: [owner, spender] });
}

/** USD number -> token units, using the token's real decimals. */
export function toUnits(amountUsd: number, decimals: number): bigint {
  const [w, f = ""] = amountUsd.toFixed(decimals).split(".");
  return BigInt(w + (f + "0".repeat(decimals)).slice(0, decimals));
}
export function fromUnits(units: bigint, decimals: number): number {
  return Number(units) / 10 ** decimals;
}
export function formatUsdc(units: bigint, decimals: number): string {
  return fromUnits(units, decimals).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
