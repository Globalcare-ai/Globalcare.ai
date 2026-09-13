/**
 * Arc Testnet configuration — Circle's L1 where USDC is BOTH the native gas token
 * (18 decimals) and an ERC-20 (6 decimals at the address below).
 *
 * Verified against https://docs.arc.io (Sept 2026):
 *   chain id  5042002
 *   explorer  https://testnet.arcscan.app
 *   USDC      0x3600000000000000000000000000000000000000
 *   faucet    https://faucet.circle.com
 * viem ships `arcTestnet` as a built-in chain, so we use it rather than hand-rolling one.
 */
import { arcTestnet } from "viem/chains";

export const ARC_CHAIN = arcTestnet;
export const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? arcTestnet.id);
export const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || arcTestnet.rpcUrls.default.http[0];
export const ARC_EXPLORER =
  (process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app").replace(/\/$/, "");

/** Canonical USDC ERC-20 on Arc Testnet. Overridable, but never taken from the client. */
export const ARC_USDC_ADDRESS = (process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ||
  "0x3600000000000000000000000000000000000000") as `0x${string}`;

/** GlobalCareEscrow deployment. Empty until the contract is deployed. */
export const ARC_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS || "") as `0x${string}` | "";

export const ARC_FAUCET_URL = "https://faucet.circle.com";

/** "arc-testnet" once the escrow contract is configured, otherwise the legacy Sepolia rail. */
export function activeNetwork(): "arc-testnet" | "sepolia" {
  return ARC_ESCROW_ADDRESS ? "arc-testnet" : "sepolia";
}
export function isArcActive(): boolean {
  return activeNetwork() === "arc-testnet";
}

/** Explorer links are per-network — an Arc tx is NOT on Etherscan. */
export function txUrl(hash: string, network?: string | null): string {
  return (network ?? activeNetwork()) === "arc-testnet"
    ? `${ARC_EXPLORER}/tx/${hash}`
    : `https://sepolia.etherscan.io/tx/${hash}`;
}
export function addressUrl(address: string, network?: string | null): string {
  return (network ?? activeNetwork()) === "arc-testnet"
    ? `${ARC_EXPLORER}/address/${address}`
    : `https://sepolia.etherscan.io/address/${address}`;
}
export function networkLabel(network?: string | null): string {
  return (network ?? activeNetwork()) === "arc-testnet" ? "Arc Testnet" : "Ethereum Sepolia";
}

/** A Supabase journey uuid as the contract's bytes32 key. */
export function journeyKey(journeyId: string): `0x${string}` {
  const hex = journeyId.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error("Invalid journey id");
  return `0x${hex}${"0".repeat(32)}` as `0x${string}`;
}
