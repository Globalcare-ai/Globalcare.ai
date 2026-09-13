import { parseEther, toHex } from "viem";
import { USDC_SEPOLIA, usdcTransferData } from "@/lib/payments";

const SEPOLIA_HEX = "0xaa36a7"; // 11155111

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
function getEth(): Eth | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: Eth }).ethereum ?? null;
}

// Pay from the user's MetaMask (external wallet, not the Privy embedded one).
// token 'eth' sends native ETH value; 'usdc' sends a USDC.transfer.
export async function metaMaskPay(to: string, token: "eth" | "usdc", amount: number): Promise<{ hash: string; from: string }> {
  const eth = getEth();
  if (!eth) throw new Error("MetaMask not found — install or enable the MetaMask extension.");
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  const from = accounts?.[0];
  if (!from) throw new Error("No MetaMask account connected.");
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX }] });
  } catch (e: unknown) {
    if ((e as { code?: number })?.code === 4902) {
      await eth.request({ method: "wallet_addEthereumChain", params: [{
        chainId: SEPOLIA_HEX, chainName: "Sepolia",
        nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://rpc.sepolia.org"], blockExplorerUrls: ["https://sepolia.etherscan.io"],
      }] });
    } else { throw e; }
  }
  const tx = token === "eth"
    ? { from, to, value: toHex(parseEther(String(amount))) }
    : { from, to: USDC_SEPOLIA, data: usdcTransferData(to, amount), value: "0x0" };
  const hash = (await eth.request({ method: "eth_sendTransaction", params: [tx] })) as string;
  return { hash, from };
}
