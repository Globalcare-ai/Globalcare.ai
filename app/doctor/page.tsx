"use client";

import { useCallback, useEffect, useState } from "react";
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
const EMPTY: Form = { diagnosis: "", recommendations: "", prescription: "", recommended_hospital: "", estimated_cost_usd: "" };

export default function DoctorConsole() {
  const [rows, setRows] = useState<Consultation[]>([]);
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("consultations")
        .select("*")
        .eq("status", "scheduled")
        .order("created_at", { ascending: false });
      setRows((data as Consultation[]) ?? []);
    } catch {} finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    <main className="min-h-screen bg-[#0b1220] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">👨‍⚕️ Doctor console <span className="text-sm font-normal text-slate-400">(demo)</span></h1>
          <Link href="/dashboard" className="text-sm text-blue-300 hover:underline">← Patient dashboard</Link>
        </div>
        <p className="mt-2 text-sm text-slate-400">Scheduled consultations waiting for a treatment plan. Submitting one completes it and moves the patient to payment.</p>

        <div className="mt-8 flex flex-col gap-5">
          {!loaded ? (
            <p className="text-slate-500">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 text-center text-sm text-slate-400">
              No scheduled consultations. Book one from the patient chat first.
            </div>
          ) : (
            rows.map((c) => {
              const f = forms[c.id] ?? EMPTY;
              return (
                <div key={c.id} className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5">
                  <p className="font-semibold">{c.reason || "Consultation"}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Patient {c.privy_user_id.slice(0, 14)}… · booked {new Date(c.created_at).toLocaleString()}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Text label="Diagnosis / condition" v={f.diagnosis} on={(x) => set(c.id, "diagnosis", x)} area />
                    <Text label="Recommendations" v={f.recommendations} on={(x) => set(c.id, "recommendations", x)} area />
                    <Text label="Prescription" v={f.prescription} on={(x) => set(c.id, "prescription", x)} area />
                    <Text label="Recommended hospital" v={f.recommended_hospital} on={(x) => set(c.id, "recommended_hospital", x)} />
                    <Text label="Estimated cost (USD)" v={f.estimated_cost_usd} on={(x) => set(c.id, "estimated_cost_usd", x)} type="number" />
                  </div>
                  <button
                    onClick={() => submit(c)}
                    disabled={savingId === c.id}
                    className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {savingId === c.id ? "Submitting…" : "Submit consultation record"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

function Text({ label, v, on, area, type }: { label: string; v: string; on: (x: string) => void; area?: boolean; type?: string }) {
  return (
    <div className={area ? "sm:col-span-2" : ""}>
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {area ? (
        <textarea value={v} onChange={(e) => on(e.target.value)} rows={2} className="mt-1 w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
      ) : (
        <input type={type ?? "text"} value={v} onChange={(e) => on(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
      )}
    </div>
  );
}
