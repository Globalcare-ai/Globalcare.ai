"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@/utils/supabase/client";
import JourneyTicket from "@/app/components/JourneyTicket";

type J = { id: string; status: string | null; escrow_status: string | null; flight_from: string | null; condition: string | null; hospital_name: string | null };
type MS = { idx: number; status: string };
type Pay = { amount_usdc: number | null; tx_hash: string | null };

export default function TrackPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const name = (user?.google?.name as string | undefined) ?? user?.email?.address?.split("@")[0] ?? "Patient";

  const [j, setJ] = useState<J | null>(null);
  const [ms, setMs] = useState<MS[]>([]);
  const [pay, setPay] = useState<Pay | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const jid = new URLSearchParams(window.location.search).get("journey");
      setId(jid);
      if (!jid) return;
      const s = createClient();
      const { data } = await s.from("journeys").select("id,status,escrow_status,flight_from,condition,hospital_name").eq("id", jid).single();
      setJ((data as J) ?? null);
      const { data: e } = await s.from("escrow").select("id").eq("journey_id", jid).order("created_at", { ascending: false }).limit(1);
      const escId = (e?.[0] as { id: string } | undefined)?.id;
      if (escId) {
        const { data: m } = await s.from("escrow_milestones").select("idx,status").eq("escrow_id", escId).order("idx");
        setMs((m as MS[]) ?? []);
      }
      const { data: p } = await s.from("payments").select("amount_usdc,tx_hash").eq("journey_id", jid).order("created_at", { ascending: false }).limit(1);
      setPay((p?.[0] as Pay) ?? null);
    } catch {} finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (ready && authenticated) load();
    if (ready && !authenticated) setLoading(false);
  }, [ready, authenticated, load]);

  if (!ready || loading) return <Center>Loading your journey…</Center>;
  if (!authenticated) return <Center><button onClick={login} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white hover:bg-blue-600">Log in →</button></Center>;
  if (!id || !j) return <Center>Journey not found. <Link href="/dashboard" className="text-blue-600 underline">Dashboard</Link></Center>;

  const rel = (i: number) => ms.find((m) => m.idx === i)?.status === "released";
  const cancelled = j.status === "cancelled";
  const steps: { title: string; desc: string; done: boolean; rose?: boolean }[] = [
    { title: "Payment secured", desc: "Funds secured in GlobalCare escrow", done: !!(j.escrow_status || pay) },
    { title: "Flight booked", desc: j.flight_from ? "Your flights are confirmed" : "Choosing your flights", done: !!j.flight_from },
    { title: "Hotel & transfers arranged", desc: "Stay, airport pickup & local transport", done: rel(1) },
    { title: "Treatment", desc: j.hospital_name ? `At ${j.hospital_name}` : "Procedure & hospital care", done: rel(2) },
    { title: "Aftercare & completion", desc: "Recovery support — journey complete", done: rel(3) || j.status === "confirmed" },
  ];
  if (cancelled) steps.push({ title: "Journey cancelled — deposit refunded", desc: "The remaining escrow balance was returned to your GlobalCare wallet", done: true, rose: true });
  const activeIdx = cancelled ? -1 : steps.findIndex((s) => !s.done);

  return (
    <main className="min-h-screen bg-[#eef2fb] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← Dashboard</Link>
          <p className="text-sm font-medium text-slate-400">Journey tracker</p>
        </div>

        <JourneyTicket journeyId={id} passenger={name} />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your journey — step by step</h2>
          <ol className="mt-5">
            {steps.map((s, i) => {
              const active = i === activeIdx;
              const last = i === steps.length - 1;
              return (
                <li key={s.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${s.done ? (s.rose ? "bg-rose-500 text-white" : "bg-emerald-500 text-white") : active ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-200 text-slate-400"}`}>
                      {s.done ? (s.rose ? "↩" : "✓") : i + 1}
                    </span>
                    {!last && <span className={`my-1 w-0.5 flex-1 ${s.done ? "bg-emerald-400" : "bg-slate-200"}`} style={{ minHeight: 28 }} />}
                  </div>
                  <div className={`pb-6 ${active ? "" : ""}`}>
                    <p className={`font-semibold ${s.done || active ? "text-slate-900" : "text-slate-400"}`}>{s.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{s.desc}</p>
                    {s.done && <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${s.rose ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{s.rose ? "Refunded" : "Completed"}</span>}
                    {active && <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">In progress</span>}
                  </div>
                </li>
              );
            })}
          </ol>
          {pay?.tx_hash && <p className="mt-2 truncate font-mono text-[11px] text-slate-400">Payment tx: <a href={`https://sepolia.etherscan.io/tx/${pay.tx_hash}`} target="_blank" rel="noreferrer" className="text-blue-500 underline decoration-dotted hover:text-blue-600">{pay.tx_hash}</a></p>}
        </div>
      </div>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center gap-2 bg-[#eef2fb] px-6 text-center text-sm text-slate-500">{children}</main>;
}
