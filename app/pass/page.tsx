"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@/utils/supabase/client";

type Journey = {
  id: string;
  condition: string | null;
  treatment: string | null;
  destination_city: string | null;
  destination_country: string | null;
  hospital_name: string | null;
  flight_airline: string | null;
  flight_from: string | null;
  flight_to: string | null;
  flight_depart: string | null;
  flight_return: string | null;
};
type Consultation = { doctor_name: string | null; estimated_cost_usd: number | null; completed_at: string | null };
type Payment = { amount_usdc: number | null; tx_hash: string | null; created_at: string };

// deterministic demo flight details from the journey id
function detail(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const rows = "ABCDEF";
  return {
    flightNo: `GC ${100 + (h % 899)}`,
    seat: `${1 + (h % 32)}${rows[h % 6]}`,
    gate: `${1 + (h % 40)}`,
    terminal: `${1 + (h % 3)}${["A", "B", "C"][h % 3]}`,
  };
}
function fmt(dt?: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PassPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [cons, setCons] = useState<Consultation | null>(null);
  const [pay, setPay] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const name = (user?.google?.name as string | undefined) ?? user?.email?.address?.split("@")[0] ?? "Patient";

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const id = new URLSearchParams(window.location.search).get("journey");
      if (!id) return;
      const supabase = createClient();
      const { data: j } = await supabase.from("journeys").select("*").eq("id", id).single();
      setJourney((j as Journey) ?? null);
      const { data: c } = await supabase.from("consultations").select("doctor_name,estimated_cost_usd,completed_at").eq("journey_id", id).eq("status", "completed").order("completed_at", { ascending: false }).limit(1);
      setCons((c?.[0] as Consultation) ?? null);
      const { data: p } = await supabase.from("payments").select("amount_usdc,tx_hash,created_at").eq("journey_id", id).order("created_at", { ascending: false }).limit(1);
      setPay((p?.[0] as Payment) ?? null);
    } catch {} finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (ready && authenticated) load();
    if (ready && !authenticated) setLoading(false);
  }, [ready, authenticated, load]);

  if (!ready || loading) return <Center>Loading your pass…</Center>;
  if (!authenticated) return <Center><button onClick={login} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white hover:bg-blue-600">Log in →</button></Center>;
  if (!journey) return <Center>Pass not found. <Link href="/dashboard" className="text-teal-600 underline">Dashboard</Link></Center>;

  const d = detail(journey.id);
  const from = journey.flight_from || "———";
  const to = journey.flight_to || (journey.destination_city ? journey.destination_city.slice(0, 3).toUpperCase() : "———");
  const cost = cons?.estimated_cost_usd ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1a2b] via-[#0e2136] to-[#0b1a2b] px-4 py-10 text-slate-100 print:bg-white">
      <style>{`@media print { .no-print { display:none } body { background:#fff } }`}</style>
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between no-print">
          <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">← Dashboard</Link>
          <button onClick={() => window.print()} className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-[#06202f] transition hover:bg-teal-400">Download / Print</button>
        </div>

        {/* ticket */}
        <div className="overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl">
          {/* header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0e2136] to-[#123a52] px-5 py-4 text-white sm:px-6">
            <p className="text-sm font-semibold tracking-[0.2em]">GLOBALCARE PASS</p>
            <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal-300">Confirmed</span>
          </div>

          {/* route */}
          <div className="flex items-center justify-between px-5 pt-6 sm:px-6">
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{from}</p>
              <p className="text-xs text-slate-500">Home</p>
            </div>
            <div className="flex flex-1 items-center px-3 text-teal-500">
              <span className="h-px flex-1 bg-teal-200" />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5L21 16z" /></svg>
              <span className="h-px flex-1 bg-teal-200" />
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{to}</p>
              <p className="text-xs text-slate-500">{journey.destination_city || "Destination"}</p>
            </div>
          </div>

          {/* flight grid */}
          <div className="grid grid-cols-2 gap-3 px-5 py-5 text-center sm:grid-cols-4 sm:px-6">
            <Cell label="Passenger" value={name} wide />
            <Cell label="Flight" value={d.flightNo} />
            <Cell label="Seat" value={d.seat} />
            <Cell label="Depart" value={fmt(journey.flight_depart)} />
            <Cell label="Return" value={fmt(journey.flight_return)} />
            <Cell label="Gate" value={d.gate} />
            <Cell label="Terminal" value={d.terminal} />
          </div>

          {/* perforation */}
          <div className="relative">
            <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0e2136]" />
            <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0e2136]" />
            <div className="mx-5 border-t-2 border-dashed border-slate-200 sm:mx-6" />
          </div>

          {/* treatment block */}
          <div className="px-5 py-5 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">Treatment</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Cell label="Condition" value={journey.condition || "—"} />
              <Cell label="Procedure" value={journey.treatment || "—"} />
              <Cell label="Hospital" value={journey.hospital_name || "—"} wide />
              <Cell label="Doctor" value={cons?.doctor_name || "GlobalCare Specialist"} />
              <Cell label="Treatment date" value={fmt(cons?.completed_at)} />
            </div>
          </div>

          {/* footer / payment */}
          <div className="flex items-center justify-between bg-slate-50 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Paid (escrow)</p>
              <p className="text-lg font-semibold text-slate-900">
                {pay?.amount_usdc != null ? `${pay.amount_usdc} USDC` : "—"}
                {cost != null && <span className="ml-2 text-xs font-normal text-slate-400">covers ${cost.toLocaleString()}</span>}
              </p>
              {pay?.tx_hash && <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{pay.tx_hash}</p>}
            </div>
            {/* faux barcode */}
            <div className="flex h-10 items-end gap-[2px]">
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} className="w-[2px] bg-slate-800" style={{ height: `${8 + ((i * 7) % 26)}px` }} />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 no-print">Your funds are held safely and released to the hospital by milestone.</p>
      </div>
    </main>
  );
}

function Cell({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 text-left" : "text-left"}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center gap-2 bg-[#0e2136] px-6 text-center text-sm text-slate-300">{children}</main>;
}
