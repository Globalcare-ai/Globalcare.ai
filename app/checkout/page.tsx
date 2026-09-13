"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
import { createPublicClient, encodeFunctionData, formatEther, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { ARC_CHAIN_ID, ARC_ESCROW_ADDRESS, ARC_FAUCET_URL, ARC_USDC_ADDRESS, isArcActive, journeyKey, txUrl } from "@/lib/blockchain/arc";
import { ERC20_ABI, arcPublicClient, formatUsdc, toUnits, usdcAllowance, usdcBalance, usdcDecimals } from "@/lib/blockchain/usdc";
import { ESCROW_ABI } from "@/lib/blockchain/escrow";
import { createClient } from "@/utils/supabase/client";
import { USDC_SEPOLIA, usdcTransferData, payableUsd, paymentRecipient, isEscrowMode, COMPANY_WALLET, DEFAULT_MILESTONES, round6, PAYMENT_TOKEN, TOKEN_SYMBOL, onchainAmount } from "@/lib/payments";

type J = { id: string; condition: string | null; hospital_name: string | null; total_cost_usd: number | null; status: string | null };

const RPC = `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? ""}`;
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) });

export default function CheckoutPage() {
  const router = useRouter();
  const { ready, authenticated, user, login } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const embedded = user?.linkedAccounts?.find(
    (a) => a.type === "wallet" && (a as { walletClientType?: string }).walletClientType === "privy"
  ) as { address?: string } | undefined;
  const wallet = embedded?.address ?? user?.wallet?.address;

  const [journey, setJourney] = useState<J | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const { wallets } = useWallets();
  const ARC = isArcActive();
  const [usdcBal, setUsdcBal] = useState<{ units: bigint; decimals: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payable = payableUsd(total);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const id = new URLSearchParams(window.location.search).get("journey");
      const supabase = createClient();
      if (id) {
        const { data: j } = await supabase.from("journeys").select("id,condition,hospital_name,total_cost_usd,status").eq("id", id).single();
        setJourney((j as J) ?? null);
        const { data: cons } = await supabase.from("consultations").select("estimated_cost_usd").eq("journey_id", id).eq("status", "completed").order("completed_at", { ascending: false }).limit(1);
        const cost = (cons?.[0]?.estimated_cost_usd as number | undefined) ?? (j as J | null)?.total_cost_usd ?? 0;
        setTotal(Number(cost) || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (ready && authenticated) load();
    if (ready && !authenticated) setLoading(false);
  }, [ready, authenticated, load]);

  // live USDC balance straight from Arc — never a cached or invented number
  useEffect(() => {
    if (!ARC || !wallet) return;
    let off = false;
    (async () => {
      try {
        const pc = arcPublicClient();
        const [d, units] = await Promise.all([usdcDecimals(pc), usdcBalance(wallet as `0x${string}`, pc)]);
        if (!off) setUsdcBal({ units, decimals: d });
      } catch { if (!off) setUsdcBal(null); }
    })();
    return () => { off = true; };
  }, [ARC, wallet]);

  /** Ensure the Privy embedded wallet is actually on Arc before signing anything. */
  async function ensureArcNetwork() {
    const w = wallets.find((x) => x.address?.toLowerCase() === wallet?.toLowerCase()) ?? wallets[0];
    if (!w) throw new Error("No wallet available — log in again so your GlobalCare wallet loads.");
    const current = Number(String(w.chainId).replace("eip155:", ""));
    if (current !== ARC_CHAIN_ID) {
      setStage("Switching to Arc Testnet…");
      try {
        await w.switchChain(ARC_CHAIN_ID);
      } catch {
        throw new Error("Your wallet isn't on Arc Testnet and the switch was declined. Approve the network switch and try again.");
      }
    }
  }

  /** Arc Testnet: approve USDC, then fund the escrow contract. Two real transactions. */
  async function payOnArc() {
    if (!journey || !user?.id || !wallet) return;
    if (!ARC_ESCROW_ADDRESS) throw new Error("Arc escrow contract is not configured yet (NEXT_PUBLIC_ARC_ESCROW_ADDRESS).");
    if (!COMPANY_WALLET) throw new Error("Set NEXT_PUBLIC_GLOBALCARE_WALLET — it receives milestone releases.");

    const pc = arcPublicClient();
    const decimals = await usdcDecimals(pc);
    const amountUnits = toUnits(payable, decimals);
    if (amountUnits <= BigInt(0)) throw new Error("Nothing to pay for this journey.");

    await ensureArcNetwork();

    // 1) real balance check on Arc
    setStage("Checking your USDC balance…");
    const bal = await usdcBalance(wallet as `0x${string}`, pc);
    setUsdcBal({ units: bal, decimals });
    if (bal < amountUnits) {
      throw new Error(`Your GlobalCare wallet holds $${formatUsdc(bal, decimals)} USDC but this payment needs $${payable.toFixed(2)}. Top up at ${ARC_FAUCET_URL} (Arc Testnet) and try again.`);
    }

    const escrowAddr = ARC_ESCROW_ADDRESS as `0x${string}`;
    const key = journeyKey(journey.id);

    // 2) approve — skipped only when a sufficient allowance already exists on-chain
    let approvalHash: string | null = null;
    const allowance = await usdcAllowance(wallet as `0x${string}`, escrowAddr, pc);
    if (allowance < amountUnits) {
      setStage("Step 1 of 2 · approve USDC in your wallet…");
      const approveRes = await sendTransaction(
        { to: ARC_USDC_ADDRESS, value: 0, data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [escrowAddr, amountUnits] }) },
        { address: wallet }
      );
      approvalHash = approveRes.hash;
      setStage("Waiting for the approval to confirm on Arc…");
      const approveReceipt = await pc.waitForTransactionReceipt({ hash: approveRes.hash as `0x${string}`, timeout: 180_000 });
      if (approveReceipt.status !== "success") throw new Error(`USDC approval reverted — nothing was charged. ${txUrl(approveRes.hash, "arc-testnet")}`);
    }

    // 3) fund the escrow contract
    setStage("Step 2 of 2 · confirm the escrow deposit…");
    const fundRes = await sendTransaction(
      { to: escrowAddr, value: 0, data: encodeFunctionData({ abi: ESCROW_ABI, functionName: "fund", args: [key, COMPANY_WALLET as `0x${string}`, amountUnits] }) },
      { address: wallet }
    );
    setStage("Waiting for Arc confirmation…");
    const receipt = await pc.waitForTransactionReceipt({ hash: fundRes.hash as `0x${string}`, timeout: 180_000 });
    if (receipt.status !== "success") throw new Error(`Escrow funding reverted — payment NOT recorded. ${txUrl(fundRes.hash, "arc-testnet")}`);

    // 4) confirmed on-chain — mirror it into Supabase
    setStage("Recording payment…");
    const supabase = createClient();
    const amountUsd = Number(payable.toFixed(2));
    const { data: esc } = await supabase.from("escrow").insert({
      journey_id: journey.id, privy_user_id: user.id, patient_wallet: wallet,
      escrow_wallet: escrowAddr, company_wallet: COMPANY_WALLET, token: "USDC",
      network: "arc-testnet", chain_id: ARC_CHAIN_ID, contract_address: escrowAddr,
      deposited_amount: amountUsd, amount_raw: amountUnits.toString(),
      status: "funded", deposit_tx_hash: fundRes.hash, approval_tx_hash: approvalHash,
    }).select("id").single();

    const escrowId = (esc as { id: string } | null)?.id;
    if (escrowId) {
      await supabase.from("escrow_milestones").insert(DEFAULT_MILESTONES.map((m) => ({
        journey_id: journey.id, escrow_id: escrowId, idx: m.idx, name: m.name, description: m.description,
        percentage: m.percentage, amount: round6((amountUsd * m.percentage) / 100), status: "pending",
      })));
    }
    await supabase.from("payments").insert({
      journey_id: journey.id, privy_user_id: user.id, amount_usd: amountUsd, amount_usdc: amountUsd,
      tx_hash: fundRes.hash, approval_tx_hash: approvalHash, escrow_status: "funded",
      network: "arc-testnet", chain_id: ARC_CHAIN_ID, payment_asset: "USDC",
    });
    await supabase.from("journeys").update({ status: "payment", escrow_status: "funded", updated_at: new Date().toISOString() }).eq("id", journey.id);
    router.push(`/dashboard?paid=1`);
  }

  async function pay() {
    setError(null);
    if (!wallet) { setError("No wallet found — log in so your GlobalCare wallet is created."); return; }
    if (!journey || !user?.id) return;
    setPaying(true);
    try {
      // 0) Never double-charge: refuse if this journey already has an escrow deposit
      {
        const sb = createClient();
        const { data: existing } = await sb.from("escrow").select("id").eq("journey_id", journey.id).limit(1);
        if (existing && existing.length > 0) {
          throw new Error("This journey is already funded \u2014 the payment is in escrow. Check your dashboard.");
        }
      }

      if (ARC) { await payOnArc(); return; }

      // ---- legacy Sepolia rail (kept working until Arc is configured) ----
      const recipient = paymentRecipient();
      if (!recipient) throw new Error("Set NEXT_PUBLIC_ESCROW_WALLET (or NEXT_PUBLIC_GLOBALCARE_WALLET) in .env.local, then restart.");
      const amount = onchainAmount(total);
      if (PAYMENT_TOKEN === "eth") {
        const bal = await publicClient.getBalance({ address: wallet as `0x${string}` });
        const need = parseEther(String(amount)) + parseEther("0.0002");
        if (bal < need) {
          throw new Error(`Your GlobalCare wallet holds ${Number(formatEther(bal)).toFixed(5)} Sepolia ETH but this payment needs ${amount} ETH + gas. Send more Sepolia ETH to ${wallet} and try again.`);
        }
      }
      setStage("Confirm in your wallet…");
      let hash: `0x${string}`;
      if (PAYMENT_TOKEN === "eth") {
        const res = await sendTransaction({ to: recipient, value: parseEther(String(amount)) }, { address: wallet });
        hash = res.hash as `0x${string}`;
      } else {
        const res = await sendTransaction({ to: USDC_SEPOLIA, value: 0, data: usdcTransferData(recipient, amount) }, { address: wallet });
        hash = res.hash as `0x${string}`;
      }
      setStage("Waiting for on-chain confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000 });
      if (receipt.status !== "success") {
        throw new Error(`Transaction was mined but reverted — payment NOT recorded. Check https://sepolia.etherscan.io/tx/${hash}`);
      }
      setStage("Recording payment…");
      const from = wallet;
      const supabase = createClient();
      const payRow = { journey_id: journey.id, privy_user_id: user.id, amount_usd: payable, amount_usdc: PAYMENT_TOKEN === "usdc" ? amount : null, tx_hash: hash, escrow_status: "funded", network: "sepolia", chain_id: 11155111, payment_asset: TOKEN_SYMBOL };
      if (isEscrowMode()) {
        const { data: esc } = await supabase.from("escrow").insert({
          journey_id: journey.id, privy_user_id: user.id, patient_wallet: from, escrow_wallet: recipient,
          company_wallet: COMPANY_WALLET ?? null, token: TOKEN_SYMBOL, deposited_amount: amount, status: "funded", deposit_tx_hash: hash,
          network: "sepolia", chain_id: 11155111,
        }).select("id").single();
        const escrowId = (esc as { id: string } | null)?.id;
        if (escrowId) {
          await supabase.from("escrow_milestones").insert(DEFAULT_MILESTONES.map((m) => ({
            journey_id: journey.id, escrow_id: escrowId, idx: m.idx, name: m.name, description: m.description,
            percentage: m.percentage, amount: round6((amount * m.percentage) / 100), status: "pending",
          })));
        }
        await supabase.from("payments").insert(payRow);
        await supabase.from("journeys").update({ status: "payment", escrow_status: "funded", updated_at: new Date().toISOString() }).eq("id", journey.id);
        router.push(`/dashboard?paid=1`);
      } else {
        await supabase.from("payments").insert(payRow);
        await supabase.from("journeys").update({ status: "confirmed", updated_at: new Date().toISOString() }).eq("id", journey.id);
        router.push(`/pass?journey=${journey.id}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment failed.";
      if (/User rejected|rejected the request|denied/i.test(msg)) {
        setError("You cancelled the transaction — nothing was charged.");
      } else if (/timed out|timeout/i.test(msg)) {
        setError("The transaction was broadcast but not confirmed in time, so nothing was recorded. Check your wallet and try again once it settles.");
      } else if (/insufficient|balance|exceeds|funds/i.test(msg) && !/GlobalCare wallet holds/.test(msg)) {
        setError(ARC ? "Not enough USDC in your GlobalCare wallet on Arc Testnet." : `Not enough test ${TOKEN_SYMBOL} in your GlobalCare wallet.`);
      } else {
        setError(msg);
      }
      setStage(null);
      setPaying(false);
    }
  }

  if (!ready || loading) return <Center>Loading checkout…</Center>;
  if (!authenticated) return <Center><button onClick={login} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white hover:bg-blue-600">Log in to pay →</button></Center>;
  if (!journey) return <Center>Journey not found. <Link href="/dashboard" className="text-blue-600 underline">Back to dashboard</Link></Center>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2fb] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">Checkout</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{journey.condition || "Treatment"}</h1>
        {journey.hospital_name && <p className="text-sm text-slate-500">{journey.hospital_name}</p>}

        <div className="mt-6 space-y-2.5 text-sm">
          <Row label="Treatment plan" value={`$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
          <Row label="Hackathon demo testing credit" value={`−$${(total - payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} muted />
          <div className="my-2 border-t border-dashed border-slate-200" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Amount to pay</span>
            <span className="text-2xl font-semibold text-slate-900">${payable.toFixed(2)}</span>
          </div>
          <p className="text-right text-xs text-slate-400">
            {ARC ? `paid in USDC on Arc Testnet` : `= ${onchainAmount(total)} ${TOKEN_SYMBOL} on Sepolia`}
          </p>
        </div>

        <div className="mt-5 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>Wallet</span>
            <span className="font-mono text-slate-700">{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Network</span>
            <span className="font-medium text-slate-700">{ARC ? "Arc Testnet" : "Ethereum Sepolia"}</span>
          </div>
          {ARC && (
            <div className="flex items-center justify-between">
              <span>USDC balance</span>
              <span className={`font-medium ${usdcBal && usdcBal.units < toUnits(payable, usdcBal.decimals) ? "text-rose-600" : "text-slate-700"}`}>
                {usdcBal ? `$${formatUsdc(usdcBal.units, usdcBal.decimals)}` : "checking…"}
              </span>
            </div>
          )}
          {ARC && usdcBal && usdcBal.units < toUnits(payable, usdcBal.decimals) && (
            <p className="pt-1 text-rose-600">
              Not enough USDC. Top up this wallet on Arc Testnet at{" "}
              <a href={ARC_FAUCET_URL} target="_blank" rel="noreferrer" className="underline">faucet.circle.com</a>.
            </p>
          )}
        </div>
        {isEscrowMode() && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            🔒 Your ${payable.toFixed(2)} is held in the <b>GlobalCare escrow{ARC ? " smart contract on Arc" : ""}</b> and released only as each service milestone is completed. Full refund of whatever is unreleased if you cancel.
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

        <button onClick={pay} disabled={paying} className="mt-5 w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
          {paying ? (stage ?? "Confirm in your wallet…") : ARC ? `Pay $${payable.toFixed(2)} USDC into escrow` : `Pay ${onchainAmount(total)} ${TOKEN_SYMBOL}${isEscrowMode() ? " into escrow" : ""}`}
        </button>
        <Link href="/dashboard" className="mt-3 block text-center text-xs text-slate-400 hover:text-slate-600">Cancel</Link>
      </div>
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={muted ? "text-emerald-600" : "text-slate-800"}>{value}</span>
    </div>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center gap-2 bg-[#eef2fb] px-6 text-center text-sm text-slate-500">{children}</main>;
}
