"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Consultation } from "@/lib/types";

// DEMO doctor console — no auth (RLS is open for the hackathon). Lets you play the
// doctor: pick a scheduled consultation, submit the treatment plan. That marks the
// consultation completed and flips the patient's journey to "payment".
type Form = {
  diagnosis: string;
  recommendations: string;
  prescription: string;
  recommended_hospital: string;
  estimated_cost_usd: string;
};
type Patient = { privy_user_id: string; name: string | null; email: string | null; avatar_url: string | null; blood_group: string | null; allergies: string | null; conditions: string | null; medications: string | null };
type JLite = { id: string; condition: string | null; treatment: string | null; destination_city: string | null; destination_country: string | null };

const EMPTY: Form = { diagnosis: "", recommendations: "", prescription: "", recommended_hospital: "", estimated_cost_usd: "" };

const when = (d?: string | null) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const usd = (n?: number | null) => (n == null ? "—" : `$${Number(n).toLocaleString()}`);

export default function DoctorConsole() {
  const [rows, setRows] = useState<Consultation[]>([]);
  const [done, setDone] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [journeys, setJourneys] = useState<JLite[]>([]);
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"waiting" | "completed">("waiting");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const [s, c, p, j] = await Promise.all([
        supabase.from("consultations").select("*").eq("status", "scheduled").order("created_at", { ascending: false }),
        supabase.from("consultations").select("*").eq("status", "completed").order("completed_at", { ascending: false }).limit(25),
        supabase.from("patients").select("privy_user_id,name,email,avatar_url,blood_group,allergies,conditions,medications"),
        supabase.from("journeys").select("id,condition,treatment,destination_city,destination_country"),
      ]);
      const scheduled = (s.data as Consultation[]) ?? [];
      setRows(scheduled);
      setDone((c.data as Consultation[]) ?? []);
      setPatients((p.data as Patient[]) ?? []);
      setJourneys((j.data as JLite[]) ?? []);
      setOpenId((cur) => cur ?? scheduled[0]?.id ?? null);
    } catch {} finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patientOf = useCallback((pid: string) => patients.find((p) => p.privy_user_id === pid), [patients]);
  const nameOf = useCallback((pid: string) => patientOf(pid)?.name || patientOf(pid)?.email || `Patient ${pid.slice(-6)}`, [patientOf]);
  const journeyOf = useCallback((id?: string | null) => journeys.find((x) => x.id === id), [journeys]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const doneToday = done.filter((c) => c.completed_at && new Date(c.completed_at).toDateString() === today).length;
    const costs = done.map((c) => c.estimated_cost_usd).filter((x): x is number => typeof x === "number");
    const avg = costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : null;
    const seen = new Set([...rows, ...done].map((c) => c.privy_user_id)).size;
    return { waiting: rows.length, doneToday, seen, avg };
  }, [rows, done]);

  function set(id: string, key: keyof Form, val: string) {
    setForms((f) => ({ ...f, [id]: { ...(f[id] ?? EMPTY), [key]: val } }));
  }

  async function submit(c: Consultation) {
    const f = forms[c.id] ?? EMPTY;
    setSavingId(c.id);
    try {
      const supabase = createClient();
      const cost = f.estimated_cost_usd ? Number(f.estimated_cost_usd) : null;
      await supabase.from("consultations").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        diagnosis: f.diagnosis || null,
        recommendations: f.recommendations || null,
        prescription: f.prescription || null,
        recommended_hospital: f.recommended_hospital || null,
        estimated_cost_usd: cost,
      }).eq("id", c.id);

      if (c.journey_id) {
        await supabase.from("journeys").update({
          status: "payment",
          total_cost_usd: cost,
          hospital_name: f.recommended_hospital || null,
          updated_at: new Date().toISOString(),
        }).eq("id", c.journey_id);
      }
      await load();
    } catch {} finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2fb] text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v5a4 4 0 0 0 8 0V3M12 12v3a5 5 0 0 0 10 0v-1" /><circle cx="22" cy="11" r="1.6" /></svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Doctor console</h1>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Demo</span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">Review a booked consultation and file the treatment plan — that moves the patient to payment.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" /></svg>
              Refresh
            </button>
            <Link href="/dashboard" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-600">Patient dashboard →</Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Awaiting plan" v={String(stats.waiting)} tone={stats.waiting > 0 ? "amber" : undefined} />
          <Kpi label="Filed today" v={String(stats.doneToday)} />
          <Kpi label="Patients seen" v={String(stats.seen)} />
          <Kpi label="Avg. estimate" v={stats.avg != null ? usd(stats.avg) : "—"} />
        </div>

        {/* tabs */}
        <div className="mt-7 flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:w-fit">
          {([["waiting", `Waiting (${rows.length})`], ["completed", `Completed (${done.length})`]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 rounded-full px-5 py-2 text-sm font-medium transition sm:flex-none ${tab === k ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {!loaded ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : tab === "waiting" ? (
            rows.length === 0 ? (
              <Empty>No scheduled consultations. Book one from the patient chat first.</Empty>
            ) : (
              rows.map((c) => {
                const f = forms[c.id] ?? EMPTY;
                const pat = patientOf(c.privy_user_id);
                const jn = journeyOf(c.journey_id);
                const open = openId === c.id;
                const filled = [f.diagnosis, f.recommendations, f.prescription, f.recommended_hospital, f.estimated_cost_usd].filter(Boolean).length;
                return (
                  <div key={c.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
                    <button onClick={() => setOpenId(open ? null : c.id)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50/70">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <Avatar url={pat?.avatar_url} name={nameOf(c.privy_user_id)} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{nameOf(c.privy_user_id)}</p>
                          <p className="truncate text-xs text-slate-400">
                            {c.reason || jn?.condition || "Consultation"} · booked {when(c.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-700 sm:inline">Awaiting plan</span>
                        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-slate-100 px-6 py-5">
                        {/* patient chart */}
                        <div className="mb-5 rounded-2xl bg-slate-50 px-5 py-4">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Patient chart</p>
                          <div className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
                            <Chart k="Condition" v={jn?.condition || c.reason} />
                            <Chart k="Destination" v={[jn?.destination_city, jn?.destination_country].filter(Boolean).join(", ")} />
                            <Chart k="Blood group" v={pat?.blood_group} />
                            <Chart k="Allergies" v={pat?.allergies} />
                            <Chart k="Existing conditions" v={pat?.conditions} />
                            <Chart k="Medications" v={pat?.medications} />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Text label="Diagnosis / condition" v={f.diagnosis} on={(x) => set(c.id, "diagnosis", x)} area placeholder="What you found on the call" />
                          <Text label="Recommendations" v={f.recommendations} on={(x) => set(c.id, "recommendations", x)} area placeholder="Procedure, technique, timeline" />
                          <Text label="Prescription" v={f.prescription} on={(x) => set(c.id, "prescription", x)} area placeholder="Medication and dosage" />
                          <Text label="Recommended hospital" v={f.recommended_hospital} on={(x) => set(c.id, "recommended_hospital", x)} placeholder="e.g. Vera Clinic, Istanbul" />
                          <Text label="Estimated cost (USD)" v={f.estimated_cost_usd} on={(x) => set(c.id, "estimated_cost_usd", x)} type="number" placeholder="4000" />
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                          <p className="text-xs text-slate-400">
                            {filled}/5 filled · the patient sees this plan on their dashboard and can pay from it.
                          </p>
                          <button
                            onClick={() => submit(c)}
                            disabled={savingId === c.id || !f.diagnosis || !f.estimated_cost_usd}
                            title={!f.diagnosis || !f.estimated_cost_usd ? "Diagnosis and estimated cost are required" : ""}
                            className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40"
                          >
                            {savingId === c.id ? "Submitting…" : "File treatment plan →"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : done.length === 0 ? (
            <Empty>No completed consultations yet.</Empty>
          ) : (
            done.map((c) => {
              const pat = patientOf(c.privy_user_id);
              return (
                <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <Avatar url={pat?.avatar_url} name={nameOf(c.privy_user_id)} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{nameOf(c.privy_user_id)}</p>
                        <p className="truncate text-xs text-slate-400">Filed {when(c.completed_at)}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-700">Completed</span>
                  </div>
                  <div className="mt-4 grid gap-x-8 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                    <Chart k="Diagnosis" v={c.diagnosis} />
                    <Chart k="Recommendations" v={c.recommendations} />
                    <Chart k="Prescription" v={c.prescription} />
                    <Chart k="Recommended hospital" v={c.recommended_hospital} />
                    <Chart k="Estimated cost" v={c.estimated_cost_usd != null ? usd(c.estimated_cost_usd) : null} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

function Avatar({ url, name }: { url?: string | null; name: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function Kpi({ label, v, tone }: { label: string; v: string; tone?: "amber" }) {
  return (
    <div className={`rounded-2xl border bg-white px-4 py-3.5 text-center shadow-sm transition hover:shadow-md ${tone === "amber" ? "border-amber-200" : "border-slate-200 hover:border-slate-300"}`}>
      <p className={`text-lg font-semibold tracking-tight ${tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>{v}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}

function Chart({ k, v }: { k: string; v?: string | null }) {
  return (
    <p className="text-slate-700">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{k}</span>
      <br />
      {v || "—"}
    </p>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center shadow-sm">
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7h8M8 12h6M5 4h14v16l-3-2-2 2-2-2-2 2-3-2z" /></svg>
      </span>
      <p className="text-sm text-slate-400">{children}</p>
    </div>
  );
}

function Text({ label, v, on, area, type, placeholder }: { label: string; v: string; on: (x: string) => void; area?: boolean; type?: string; placeholder?: string }) {
  const cls = "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:bg-white";
  return (
    <div className={area ? "sm:col-span-2" : ""}>
      <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</label>
      {area ? (
        <textarea value={v} onChange={(e) => on(e.target.value)} rows={2} placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input type={type ?? "text"} value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
