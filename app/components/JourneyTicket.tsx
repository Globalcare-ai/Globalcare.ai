"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Journey = {
  id: string;
  condition: string | null;
  treatment: string | null;
  destination_city: string | null;
  origin_city: string | null;
  hospital_name: string | null;
  flight_from: string | null;
  flight_to: string | null;
  flight_depart: string | null;
  flight_return: string | null;
  status: string | null;
  escrow_status: string | null;
};
type Cons = { doctor_name: string | null };

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function fmtDate(dt?: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(dt?: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// deterministic QR-looking grid (finder squares + pseudo-random modules)
function QR({ seed, size = 108 }: { seed: string; size?: number }) {
  const n = 21;
  const cells = useMemo(() => {
    let h = hash(seed) || 1;
    const rnd = () => ((h = (h * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const finder = (r: number, c: number) => {
      const inR = r < 7 && c < 7, tr = r < 7 && c >= n - 7, bl = r >= n - 7 && c < 7;
      if (!(inR || tr || bl)) return null;
      const rr = r % (n - 7 === r ? 1 : 1);
      const lr = inR ? r : tr ? r : r - (n - 7);
      const lc = inR ? c : tr ? c - (n - 7) : c;
      const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6;
      const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
      void rr;
      return ring || core;
    };
    const grid: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      grid[r] = [];
      for (let c = 0; c < n; c++) {
        const f = finder(r, c);
        grid[r][c] = f !== null ? f : rnd() > 0.55;
      }
    }
    return grid;
  }, [seed]);
  const m = size / n;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((row, r) => row.map((on, c) => on ? <rect key={`${r}-${c}`} x={c * m} y={r * m} width={m} height={m} fill="#0f172a" /> : null))}
    </svg>
  );
}

export default function JourneyTicket({ journeyId, passenger }: { journeyId: string; passenger?: string }) {
  const [j, setJ] = useState<Journey | null>(null);
  const [cons, setCons] = useState<Cons | null>(null);

  // the notches are cut out of the card itself, so they have to sit exactly on
  // the dashed line — measure it rather than guessing a fixed offset
  const cardRef = useRef<HTMLDivElement>(null);
  const perfRef = useRef<HTMLDivElement>(null);
  const [cutY, setCutY] = useState<number | null>(null);

  const measure = useCallback(() => {
    const card = cardRef.current, perf = perfRef.current;
    if (!card || !perf) return;
    const y = perf.getBoundingClientRect().top - card.getBoundingClientRect().top + perf.offsetHeight / 2;
    setCutY(Math.round(y));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = createClient();
        const { data } = await s.from("journeys").select("id,condition,treatment,destination_city,origin_city,hospital_name,flight_from,flight_to,flight_depart,flight_return,status,escrow_status").eq("id", journeyId).single();
        setJ((data as Journey) ?? null);
        const { data: c } = await s.from("consultations").select("doctor_name").eq("journey_id", journeyId).eq("status", "completed").order("completed_at", { ascending: false }).limit(1);
        setCons((c?.[0] as Cons) ?? null);
      } catch {}
    })();
  }, [journeyId]);

  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined" || !cardRef.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [measure, j]);

  if (!j) return null;
  const h = hash(j.id);
  const from = j.flight_from || "\u2014";
  const to = j.flight_to || (j.destination_city ? j.destination_city.slice(0, 3).toUpperCase() : "\u2014");
  const flightNo = `GC ${100 + (h % 899)}`;
  const seat = `${12 + (h % 26)}${"ABCDEF"[h % 6]}`;
  const days = j.flight_depart && j.flight_return
    ? Math.max(1, Math.round((new Date(j.flight_return).getTime() - new Date(j.flight_depart).getTime()) / 86400000))
    : null;

  const cancelled = j.status === "cancelled";
  const R = 15; // notch radius

  // two circles punched out of the card's alpha, so whatever is behind the
  // ticket shows through the bites — not a painted-on background colour
  const mask = cutY == null
    ? undefined
    : `radial-gradient(circle ${R}px at 0px ${cutY}px, transparent ${R}px, #000 ${R + 0.5}px), radial-gradient(circle ${R}px at 100% ${cutY}px, transparent ${R}px, #000 ${R + 0.5}px)`;

  return (
    <div className="relative" style={{ filter: "drop-shadow(0 18px 34px rgba(15,23,42,0.22))" }}>
      {/* the stack of tickets behind this one */}
      <div aria-hidden className="absolute inset-x-10 -top-5 h-12 rounded-[20px] bg-slate-300/70" />
      <div aria-hidden className="absolute inset-x-5 -top-2.5 h-12 rounded-[22px] bg-slate-200" />

      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[26px] bg-white"
        style={mask ? { WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: "source-in", maskComposite: "intersect" } : undefined}
      >
        {cancelled && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/35">
            <span className="-rotate-12 rounded-xl border-4 border-rose-500/80 px-5 sm:px-7 py-2.5 text-4xl font-extrabold uppercase tracking-[0.28em] text-rose-500/80">Cancelled</span>
          </div>
        )}

        {/* airline strip */}
        <div className="flex items-center justify-between px-5 sm:px-7 pt-5">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-600" fill="currentColor" aria-hidden>
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
            </svg>
            GlobalCare Pass
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-300">{j.id.slice(0, 8)}</span>
        </div>

        {/* route */}
        <div className="px-5 sm:px-7 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-5xl">{from}</span>
            <svg width="34" height="20" viewBox="0 0 34 20" fill="none" className="text-blue-600"><path d="M2 10h28m0 0-7-7m7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="text-4xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-5xl">{to}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-sm text-slate-400">
            <span>{j.origin_city || "Home"}</span>
            <span>{j.destination_city || "Destination"}</span>
          </div>
        </div>

        {/* passenger */}
        <div className="px-5 sm:px-7 pt-6">
          <Label>Passenger</Label>
          <p className="mt-0.5 truncate text-xl font-semibold text-slate-900">{passenger || "Patient"}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 px-5 sm:px-7 pb-5 pt-4">
          <Field label="Treatment" value={j.condition || j.treatment || "\u2014"} wide />
          <Field label="Flight" value={flightNo} />
        </div>
        <div className="grid grid-cols-3 gap-4 px-5 sm:px-7 pb-7">
          <Field label="Date" value={fmtDate(j.flight_depart)} />
          <Field label="Departs" value={fmtTime(j.flight_depart)} />
          <Field label="Class" value="Care+" />
        </div>

        {/* perforation */}
        <div ref={perfRef} className="relative h-0">
          <div className="absolute inset-x-0 top-0 mx-6 border-t-2 border-dashed border-slate-200" />
        </div>

        {/* stub */}
        <div className="flex items-start justify-between gap-5 px-5 sm:px-7 pb-7 pt-7">
          <div className="min-w-0 space-y-3.5">
            <Field label="Hospital" value={j.hospital_name || "To be confirmed"} />
            <Field label="Doctor" value={cons?.doctor_name || "GlobalCare Specialist"} />
            <div className="flex gap-8">
              <Field label="Duration" value={days ? `${days} days` : "\u2014"} />
              <Field label="Seat" value={seat} />
            </div>
          </div>
          <div className="shrink-0 text-center">
            <QR seed={j.id} size={104} />
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-300">Scan at check-in</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">{children}</p>;
}
function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <Label>{label}</Label>
      <p className="mt-0.5 truncate text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
