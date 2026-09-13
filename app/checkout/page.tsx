"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import { createPublicClient, formatEther, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
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

  async function pay() {
    setError(null);
    const recipient = paymentRecipient();
    if (!recipient) { setError("Set NEXT_PUBLIC_ESCROW_WALLET (or NEXT_PUBLIC_GLOBALCARE_WALLET) in .env.local, then restart."); return; }
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
      const amount = onchainAmount(total);
      // 1) Balance pre-check on Sepolia so we never broadcast a doomed tx
      if (PAYMENT_TOKEN === "eth") {
        const bal = await publicClient.getBalance({ address: wallet as `0x${string}` });
        const need = parseEther(String(amount)) + parseEther("0.0002");
        if (bal < need) {
          throw new Error(`Your GlobalCare wallet holds ${Number(formatEther(bal)).toFixed(5)} Sepolia ETH but this payment needs ${amount} ETH + gas. Send more Sepolia ETH to ${wallet} and try again.`);
        }
      }
      // 2) Sign & broadcast from the Privy embedded wallet — hash comes from the chain, never generated here
      setStage("Confirm in your wallet…");
      let hash: `0x${string}`;
      if (PAYMENT_TOKEN === "eth") {
        const res = await sendTransaction({ to: recipient, value: parseEther(String(amount)) }, { address: wallet });
        hash = res.hash as `0x${string}`;
      } else {
        const res = await sendTransaction({ to: USDC_SEPOLIA, value: 0, data: usdcTransferData(recipient, amount) }, { address: wallet });
        hash = res.hash as `0x${string}`;
      }
      // 3) Wait for the REAL on-chain receipt. Nothing is written to the database until Sepolia confirms.
      setStage("Waiting for on-chain confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000 });
      if (receipt.status !== "success") {
        throw new Error(`Transaction was mined but reverted — payment NOT recorded. Check https://sepolia.etherscan.io/tx/${hash}`);
      }
      // 4) Confirmed on-chain — only now record it
      setStage("Recording payment…");
      const from = wallet;
      const supabase = createClient();
      const payRow = { journey_id: journey.id, privy_user_id: user.id, amount_usd: payable, amount_usdc: PAYMENT_TOKEN === "usdc" ? amount : null, tx_hash: hash, escrow_status: "funded" };
      if (isEscrowMode()) {
        const { data: esc } = await supabase.from("escrow").insert({
          journey_id: journey.id, privy_user_id: user.id, patient_wallet: from, escrow_wallet: recipient,
          company_wallet: COMPANY_WALLET ?? null, token: TOKEN_SYMBOL, deposited_amount: amount, status: "funded", deposit_tx_hash: hash,
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
      if (/timed out|timeout/i.test(msg)) {
        setError("The transaction was broadcast but not confirmed within 3 minutes, so nothing was recorded. Check your wallet on sepolia.etherscan.io and try again once it settles.");
      } else if (/insufficient|balance|exceeds|funds/i.test(msg) && !/GlobalCare wallet holds/.test(msg)) {
        setError(`Not enough test ${TOKEN_SYMBOL} in your GlobalCare wallet. Send a little Sepolia ${TOKEN_SYMBOL} to ${wallet ?? "your wallet"} first.`);
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
          <Row label="GlobalCare demo credit" value={`−$${(total - payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} muted />
          <div className="my-2 border-t border-dashed border-slate-200" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Amount to pay</span>
            <span className="text-2xl font-semibold text-slate-900">${payable.toFixed(2)}</span>
          </div>
          <p className="text-right text-xs text-slate-400">= {onchainAmount(total)} {TOKEN_SYMBOL} on Sepolia, paid from your GlobalCare wallet</p>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Pays from your <b>GlobalCare (Privy) wallet</b> <span className="font-mono">{wallet ? `${wallet.slice(0,6)}…${wallet.slice(-4)}` : "—"}</span> on Sepolia. Fund it first by sending a little test {TOKEN_SYMBOL} to that address from MetaMask.
        </div>
        {isEscrowMode() && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            🔒 Your {onchainAmount(total)} {TOKEN_SYMBOL} is held in <b>GlobalCare escrow</b> and released only as each service milestone is completed. Full refund if you cancel before fulfilment.
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

        <button onClick={pay} disabled={paying} className="mt-5 w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
          {paying ? (stage ?? "Confirm in your wallet…") : `Pay ${onchainAmount(total)} ${TOKEN_SYMBOL}${isEscrowMode() ? " into escrow" : ""}`}
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
