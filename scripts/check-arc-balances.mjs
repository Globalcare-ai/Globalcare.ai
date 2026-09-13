/**
 * Pre-flight for the Arc demo:  node scripts/check-arc-balances.mjs
 *
 * Prints, for each of the three roles, the NATIVE balance (gas) and the USDC
 * ERC-20 balance. On Arc these should track each other because USDC is the
 * native asset — if the ERC-20 reads 0 while native is funded, the token needs
 * a different path and checkout would fail, so check this BEFORE demoing.
 */
import fs from "node:fs";
import path from "node:path";
import { createPublicClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

const env = {};
for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const RPC = env.NEXT_PUBLIC_ARC_RPC_URL || arcTestnet.rpcUrls.default.http[0];
const USDC = env.NEXT_PUBLIC_ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const addr = (k) => (k?.startsWith("0x") ? k : `0x${k}`);

const ERC20 = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
];

const pc = createPublicClient({ chain: arcTestnet, transport: http(RPC) });
console.log("RPC:", RPC, "| chainId:", await pc.getChainId(), "\n");

let dec = 6, sym = "USDC";
try {
  dec = Number(await pc.readContract({ address: USDC, abi: ERC20, functionName: "decimals" }));
  sym = await pc.readContract({ address: USDC, abi: ERC20, functionName: "symbol" });
  console.log(`USDC token ${USDC} -> symbol ${sym}, decimals ${dec}\n`);
} catch (e) {
  console.log(`⚠️  Could not read the USDC ERC-20 at ${USDC}: ${e.shortMessage || e.message}\n`);
}

const roles = [
  ["Deployer / owner", env.ARC_DEPLOYER_PRIVATE_KEY ? privateKeyToAccount(addr(env.ARC_DEPLOYER_PRIVATE_KEY)).address : null],
  ["Trustee (server signer)", env.ESCROW_PRIVATE_KEY ? privateKeyToAccount(addr(env.ESCROW_PRIVATE_KEY)).address : null],
  ["Company (beneficiary)", env.NEXT_PUBLIC_GLOBALCARE_WALLET || null],
  ["Patient (Privy embedded)", (/^0x[0-9a-fA-F]{40}$/.test(process.argv[2] ?? "") ? process.argv[2] : "0x70CEb8d6d5C9Dc555A32301BCd550EDe2CafEFB7")],
];

for (const [label, address] of roles) {
  if (!address) { console.log(`${label.padEnd(26)} — not configured`); continue; }
  const native = await pc.getBalance({ address });
  let token = null;
  try { token = await pc.readContract({ address: USDC, abi: ERC20, functionName: "balanceOf", args: [address] }); } catch {}
  console.log(
    `${label.padEnd(26)} ${address}\n` +
    `  native (gas) : ${formatUnits(native, 18)}\n` +
    `  ${sym} ERC-20 : ${token == null ? "unreadable" : formatUnits(token, dec)}` +
    (token != null && token === 0n && native > 0n ? "   ⚠️  funded natively but ERC-20 reads 0" : "")
  );
}

if (env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS) {
  const code = await pc.getBytecode({ address: env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS });
  console.log(`\nEscrow contract ${env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS}: ${code && code !== "0x" ? "deployed ✅" : "NO CODE AT THIS ADDRESS ❌"}`);
  console.log(`  holds: ${formatUnits(await pc.getBalance({ address: env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS }), 18)} USDC`);

  // optional 2nd arg: node scripts/check-arc-balances.mjs <patientAddr> <journeyUuid>
  const journey = process.argv[3];
  if (journey) {
    const key = `0x${journey.replace(/-/g, "").toLowerCase()}${"0".repeat(32)}`;
    const ESCROW_ABI = [{
      type: "function", name: "getEscrow", stateMutability: "view",
      inputs: [{ name: "journeyId", type: "bytes32" }],
      outputs: [
        { name: "patient", type: "address" }, { name: "beneficiary", type: "address" },
        { name: "totalAmount", type: "uint256" }, { name: "releasedAmount", type: "uint256" },
        { name: "refundedAmount", type: "uint256" }, { name: "remaining", type: "uint256" },
        { name: "status", type: "uint8" }, { name: "released", type: "bool[3]" },
      ],
    }];
    const e = await pc.readContract({ address: env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: "getEscrow", args: [key] });
    const STATUS = ["none", "funded", "active", "completed", "refunded"];
    console.log(`\nOn-chain escrow for journey ${journey}:`);
    console.log(`  total     : ${formatUnits(e[2], dec)}`);
    console.log(`  released  : ${formatUnits(e[3], dec)}`);
    console.log(`  refunded  : ${formatUnits(e[4], dec)}`);
    console.log(`  REMAINING : ${formatUnits(e[5], dec)}   <- max refundable`);
    console.log(`  status    : ${STATUS[Number(e[6])]}`);
    console.log(`  milestones: ${e[7].map((r, i) => `${i + 1}:${r ? "released" : "pending"}`).join("  ")}`);
  }
} else {
  console.log("\nEscrow contract: not deployed yet (NEXT_PUBLIC_ARC_ESCROW_ADDRESS is empty)");
}
