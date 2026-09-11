"use client";

import { useState } from "react";
import type { Consultation } from "@/lib/types";

function fmt(dt?: string | null) {
  if (!dt) return "";
  return new Date(dt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const CS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function ConsultationHistory({ consultations, onComplete }: { consultations: Consultation[]; onComplete?: (c: Consultation) => void }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Medical consultations</h2>
      <div className="mt-4 flex flex-col gap-3">
        {consultations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
            No consultations yet. Book a free one from the chat.
          </p>
        ) : (
          consultations.map((c) => {
            const isOpen = open === c.id;
            return (
              <div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <p className="truncate font-semibold text-slate-900">{c.reason || "Consultation"}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${CS[c.status ?? "scheduled"] ?? CS.scheduled}`}>
                        {c.status ?? "scheduled"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {c.doctor_name || "GlobalCare Specialist"}
                      {c.scheduled_at ? ` · ${fmt(c.scheduled_at)}` : ` · booked ${fmt(c.created_at)}`}
                    </p>
                  </div>
                  {c.status === "completed" && (
                    <button onClick={() => setOpen(isOpen ? null : c.id)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:border-blue-300">
                      {isOpen ? "Hide" : "View consultation"}
                    </button>
                  )}
                  {c.status === "scheduled" && onComplete && (
                    <button onClick={() => onComplete(c)} className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700" title="Demo: simulate the doctor submitting the treatment plan">
                      Mark completed (demo)
                    </button>
                  )}
                </div>

                {isOpen && c.status === "completed" && (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 text-sm sm:grid-cols-2">
                    <Field label="Diagnosis" value={c.diagnosis} />
                    <Field label="Recommendation" value={c.recommendations} />
                    <Field label="Prescription" value={c.prescription} />
                    <Field label="Recommended hospital" value={c.recommended_hospital} />
                    {c.estimated_cost_usd != null && <Field label="Estimated cost" value={`$${c.estimated_cost_usd}`} />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-slate-800">{value || "—"}</p>
    </div>
  );
}
