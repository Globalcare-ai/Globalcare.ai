"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Patient } from "@/lib/types";

const FIELDS: { key: keyof Patient; label: string; type?: string; area?: boolean }[] = [
  { key: "name", label: "Full name" },
  { key: "phone", label: "Phone" },
  { key: "date_of_birth", label: "Date of birth", type: "date" },
  { key: "blood_group", label: "Blood group" },
  { key: "allergies", label: "Allergies", area: true },
  { key: "conditions", label: "Existing conditions", area: true },
  { key: "medications", label: "Current medications", area: true },
  { key: "medical_history", label: "Medical history", area: true },
];

export default function MedicalProfile({ privyId, email }: { privyId: string; email?: string | null }) {
  const [patient, setPatient] = useState<Partial<Patient>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("patients").select("*").eq("privy_user_id", privyId).single();
        if (data) setPatient(data as Patient);
      } catch {}
    })();
  }, [privyId]);

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("patients")
        .upsert({ ...patient, privy_user_id: privyId, email: patient.email ?? email ?? null }, { onConflict: "privy_user_id" });
      setEditing(false);
    } catch {} finally {
      setSaving(false);
    }
  }

  const filled = (v: unknown) => (v ? String(v) : "—");

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-0">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Medical profile</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="rounded-full px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving} className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.area ? "sm:col-span-2" : ""}>
            <label className="text-xs font-medium text-slate-400">{f.label}</label>
            {editing ? (
              f.area ? (
                <textarea
                  value={(patient[f.key] as string) ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, [f.key]: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              ) : (
                <input
                  type={f.type ?? "text"}
                  value={(patient[f.key] as string) ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              )
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{filled(patient[f.key])}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
