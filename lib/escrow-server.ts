import { createWalletClient, createPublicClient, http, parseUnits, parseEther, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { USDC_SEPOLIA, USDC_DECIMALS } from "@/lib/payments";

// ESCROW_PRIVATE_KEY is server-only (NO NEXT_PUBLIC_) — never shipped to the browser.
// Accept the key with or without a 0x prefix.
const RAW_KEY = process.env.ESCROW_PRIVATE_KEY?.trim();
const KEY = (RAW_KEY ? (RAW_KEY.startsWith("0x") ? RAW_KEY : `0x${RAW_KEY}`) : undefined) as `0x${string}` | undefined;
const RPC = `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? ""}`;

const ERC20 = [
  { name: "transfer", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export function escrowConfigured(): boolean {
  return !!KEY && /^0x[0-9a-fA-F]{64}$/.test(KEY);
}

// Sign + broadcast a USDC transfer FROM the escrow wallet, wait for the receipt,
// and return the tx hash. Throws on revert. Amount is a plain USD/USDC number.
export async function sendUsdcFromEscrow(to: string, amountUsd: number): Promise<string> {
  if (!escrowConfigured()) throw new Error("ESCROW_PRIVATE_KEY is not configured on the server.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error("Invalid destination address.");
  const account = privateKeyToAccount(KEY!);
  const wallet = createWalletClient({ account, chain: sepolia, transport: http(RPC) });
  const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
  const data = encodeFunctionData({
    abi: ERC20, functionName: "transfer",
    args: [to as `0x${string}`, parseUnits(String(amountUsd), USDC_DECIMALS)],
  });
  const hash = await wallet.sendTransaction({ to: USDC_SEPOLIA as `0x${string}`, data, value: BigInt(0) });
  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 45_000 });
  if (receipt.status !== "success") throw new Error("Escrow transfer reverted on-chain.");
  return hash;
}

// Token-aware transfer from the escrow wallet: 'ETH' sends native value, else USDC.
export async function sendFromEscrow(to: string, amount: number, token: string): Promise<string> {
  if (!escrowConfigured()) throw new Error("ESCROW_PRIVATE_KEY is not configured on the server.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error("Invalid destination address.");
  const account = privateKeyToAccount(KEY!);
  const wallet = createWalletClient({ account, chain: sepolia, transport: http(RPC) });
  const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
  let hash: `0x${string}`;
  if ((token || "USDC").toUpperCase() === "ETH") {
    hash = await wallet.sendTransaction({ to: to as `0x${string}`, value: parseEther(String(amount)) });
  } else {
    const data = encodeFunctionData({ abi: ERC20, functionName: "transfer", args: [to as `0x${string}`, parseUnits(String(amount), USDC_DECIMALS)] });
    hash = await wallet.sendTransaction({ to: USDC_SEPOLIA as `0x${string}`, data, value: BigInt(0) });
  }
  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 45_000 });
  if (receipt.status !== "success") throw new Error("Escrow transfer reverted on-chain.");
  return hash;
}

export function adminAuthorized(req: Request): boolean {
  const secret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_API_SECRET && secret === process.env.ADMIN_API_SECRET;
}
