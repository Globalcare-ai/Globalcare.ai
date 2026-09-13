"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { networkLabel, txUrl } from "@/lib/blockchain/arc";

type Escrow = { id: string; deposited_amount: number; released_amount: number; refunded_amount: number; status: string; deposit_tx_hash: string | null; escrow_wallet: string | null; token: string | null; network: string | null };
type MS = { idx: number; name: string; percentage: number; amount: number; status: string };

const short = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

export default function EscrowStatus({ journeyId }: { journeyId: string }) {
  const [esc, setEsc] = useState<Escrow | null>(null);
  const [ms, setMs] = useState<MS[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const s = createClient();
        const { data: e } = await s.from("escrow").select("*").eq("journey_id", journeyId).order("created_at", { ascending: false }).limit(1);
        const row = (e?.[0] as Escrow) ?? null;
        setEsc(row);
        if (row) {
          const { data: m } = await s.from("escrow_milestones").select("idx,name,percentage,amount,status").eq("escrow_id", row.id).order("idx");
          setMs((m as MS[]) ?? []);
        }
      } catch {}
    })();
  }, [journeyId]);

  if (!esc) return null;
  const refunded = esc.status.includes("refund") && esc.status !== "funded";
  const releasedAll = esc.status === "released";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment · escrow</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">{esc.token === "USDC" ? `$${Number(esc.deposited_amount).toFixed(2)} USDC` : `${esc.deposited_amount} ${esc.token ?? "USDC"}`}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${refunded ? "bg-rose-100 text-rose-700" : releasedAll ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
          {refunded ? "↩ Refunded" : releasedAll ? "✓ Released to GlobalCare" : "🔒 Secured in escrow"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Step done label="Payment deposited" />
        <Step done={!refunded} active={!releasedAll && !refunded} label={refunded ? "Funds returned to you" : "Funds secured in escrow"} />
        {ms.map((m) => (
          <Step key={m.idx} done={m.status === "released"} active={m.status === "completed"} label={`${m.name} · ${m.percentage}% (${esc.token === "USDC" ? `$${Number(m.amount).toFixed(2)}` : `${m.amount} ${esc.token ?? "USDC"}`})`} sub={m.status} />
        ))}
        <Step done={releasedAll} label="Released to GlobalCare" />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>Escrow {short(esc.escrow_wallet)} · {networkLabel(esc.network)}</span>
        {esc.deposit_tx_hash && <a href={txUrl(esc.deposit_tx_hash, esc.network)} target="_blank" rel="noreferrer" className="ml-2 max-w-[45%] truncate font-mono text-blue-500 underline decoration-dotted hover:text-blue-600">{esc.deposit_tx_hash}</a>}
      </div>
    </div>
  );
}

function Step({ done, active, label, sub }: { done?: boolean; active?: boolean; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-400"}`}>
        {done ? "✓" : active ? "●" : "○"}
      </span>
      <span className={done || active ? "text-slate-800" : "text-slate-400"}>{label}</span>
      {sub && sub !== "pending" && <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400">{sub}</span>}
    </div>
  );
}
