import { encodeFunctionData, parseUnits } from "viem";

// Circle USDC on Ethereum Sepolia (6 decimals).
export const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;
export const USDC_DECIMALS = 6;

// 99.99% "GlobalCare demo credit" — applied ONLY at checkout, never shown in chat.
export const DEMO_RATE = 0.0001;
export function payableUsd(total: number): number {
  return Math.max(0.01, Math.round(total * DEMO_RATE * 100) / 100);
}

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

// Calldata for USDC.transfer(recipient, amount) — sent to the USDC contract with value 0.
export function usdcTransferData(recipient: string, amountUsd: number): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [recipient as `0x${string}`, parseUnits(String(amountUsd), USDC_DECIMALS)],
  });
}

// ----- Escrow (Phase 1: a GlobalCare-controlled wallet holds the USDC on-chain) -----
export const COMPANY_WALLET = process.env.NEXT_PUBLIC_GLOBALCARE_WALLET;
export const ESCROW_WALLET = process.env.NEXT_PUBLIC_ESCROW_WALLET;
export const PAYMENT_MODE = (process.env.NEXT_PUBLIC_PAYMENT_MODE ?? "escrow") as "escrow" | "direct";

function set(a?: string) {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}
export function isEscrowMode(): boolean {
  return PAYMENT_MODE === "escrow" && set(ESCROW_WALLET);
}
// Where the patient's deposit is sent: escrow custody if configured, else company (direct fallback).
export function paymentRecipient(): string | null {
  if (isEscrowMode()) return ESCROW_WALLET as string;
  return set(COMPANY_WALLET) ? (COMPANY_WALLET as string) : null;
}

// Default milestone template — release schedule for the escrowed service package.
export const DEFAULT_MILESTONES = [
  { idx: 1, name: "Coordination & travel", description: "Flights, hotel, transfers & consultation coordination", percentage: 20 },
  { idx: 2, name: "Treatment / core service", description: "Hospital and treatment fulfilment", percentage: 60 },
  { idx: 3, name: "Aftercare & completion", description: "Recovery support and journey completion", percentage: 20 },
] as const;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ----- Payment token (eth for demo w/o USDC, or usdc) -----
export const PAYMENT_TOKEN = (process.env.NEXT_PUBLIC_PAYMENT_TOKEN ?? "eth") as "eth" | "usdc";
export const TOKEN_SYMBOL = PAYMENT_TOKEN === "usdc" ? "USDC" : "ETH";
export const ESCROW_ETH_TOTAL = Number(process.env.NEXT_PUBLIC_ESCROW_ETH_TOTAL ?? "0.003");

export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
// On-chain amount actually moved: USDC = the discounted $ payable; ETH = a fixed tiny amount.
export function onchainAmount(displayTotalUsd: number): number {
  return PAYMENT_TOKEN === "usdc" ? payableUsd(displayTotalUsd) : ESCROW_ETH_TOTAL;
}
