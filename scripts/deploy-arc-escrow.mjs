/**
 * Deploy GlobalCareEscrow to Arc Testnet.
 *
 *   node scripts/deploy-arc-escrow.mjs
 *
 * Reads from .env.local:
 *   ARC_DEPLOYER_PRIVATE_KEY   deployer + contract owner (server-side only, never NEXT_PUBLIC_)
 *   ESCROW_PRIVATE_KEY         server signer that will release/refund  -> becomes the trustee
 *   NEXT_PUBLIC_ARC_USDC_ADDRESS, NEXT_PUBLIC_ARC_RPC_URL (optional overrides)
 *
 * The deployer pays gas in USDC (Arc's native token), so fund it from https://faucet.circle.com first.
 */
import fs from "node:fs";
import path from "node:path";
import { createWalletClient, createPublicClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

const root = process.cwd();

// --- tiny .env.local reader (no extra dependency) ---------------------------
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const need = (k) => {
  const v = (env[k] ?? process.env[k] ?? "").trim();
  if (!v) throw new Error(`Missing ${k} in .env.local`);
  return v;
};
const hexKey = (k) => {
  const v = need(k);
  const withPrefix = v.startsWith("0x") ? v : `0x${v}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(withPrefix)) throw new Error(`${k} must be a 32-byte hex private key`);
  return withPrefix;
};

const RPC = (env.NEXT_PUBLIC_ARC_RPC_URL || arcTestnet.rpcUrls.default.http[0]).trim();
const USDC = (env.NEXT_PUBLIC_ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000").trim();
const EXPLORER = (env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app").replace(/\/$/, "");

const deployer = privateKeyToAccount(hexKey("ARC_DEPLOYER_PRIVATE_KEY"));
const trustee = privateKeyToAccount(hexKey("ESCROW_PRIVATE_KEY")).address;

const abi = JSON.parse(fs.readFileSync(path.join(root, "contracts/GlobalCareEscrow.abi.json"), "utf8"));
const bytecode = fs.readFileSync(path.join(root, "contracts/GlobalCareEscrow.bytecode.txt"), "utf8").trim();

const publicClient = createPublicClient({ chain: arcTestnet, transport: http(RPC) });
const wallet = createWalletClient({ account: deployer, chain: arcTestnet, transport: http(RPC) });

console.log("Network    :", arcTestnet.name, `(chainId ${arcTestnet.id})`);
console.log("RPC        :", RPC);
console.log("Deployer   :", deployer.address);
console.log("Trustee    :", trustee);
console.log("USDC       :", USDC);

const chainId = await publicClient.getChainId();
if (chainId !== arcTestnet.id) throw new Error(`RPC reports chainId ${chainId}, expected ${arcTestnet.id}`);

const gasBalance = await publicClient.getBalance({ address: deployer.address });
console.log("Gas balance:", formatUnits(gasBalance, 18), "USDC (native)");
if (gasBalance === 0n) throw new Error(`Deployer has no gas. Fund ${deployer.address} at https://faucet.circle.com (Arc Testnet).`);

console.log("\nDeploying GlobalCareEscrow…");
const hash = await wallet.deployContract({ abi, bytecode, args: [USDC, trustee] });
console.log("Deploy tx  :", hash);
console.log("            ", `${EXPLORER}/tx/${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") throw new Error("Deployment reverted");
const address = receipt.contractAddress;

// sanity-check the deployed state
const onChainTrustee = await publicClient.readContract({ address, abi, functionName: "trustee" });
const onChainUsdc = await publicClient.readContract({ address, abi, functionName: "usdc" });

console.log("\n✅ Deployed");
console.log("Contract   :", address);
console.log("            ", `${EXPLORER}/address/${address}`);
console.log("Block      :", receipt.blockNumber.toString());
console.log("Trustee ok :", onChainTrustee.toLowerCase() === trustee.toLowerCase());
console.log("USDC ok    :", onChainUsdc.toLowerCase() === USDC.toLowerCase());

fs.writeFileSync(
  path.join(root, "contracts/deployment.arc-testnet.json"),
  JSON.stringify(
    { network: "arc-testnet", chainId: arcTestnet.id, contract: address, deployTx: hash, block: receipt.blockNumber.toString(), usdc: USDC, trustee, deployer: deployer.address, deployedAt: new Date().toISOString() },
    null, 2
  ) + "\n"
);

console.log("\nAdd this to .env.local and restart the dev server:\n");
console.log(`NEXT_PUBLIC_ARC_ESCROW_ADDRESS=${address}`);
