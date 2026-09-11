"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { MedicalReport } from "@/lib/types";

const BUCKET = "medical-reports";

export default function MedicalDocuments({ privyId }: { privyId: string }) {
  const [docs, setDocs] = useState<MedicalReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("privy_user_id", privyId)
        .order("created_at", { ascending: false });
      setDocs((data as MedicalReport[]) ?? []);
    } catch {}
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privyId]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `${privyId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) throw upErr;
      await supabase.from("medical_reports").insert({
        privy_user_id: privyId,
        file_url: path,
        file_name: file.name,
        content_type: file.type,
        title: file.name,
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Did you run 003_medical.sql (bucket + policies)?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function view(doc: MedicalReport) {
    if (!doc.file_url) return;
    try {
      const supabase = createClient();
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_url, 60 * 10);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } catch {}
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Medical documents</h2>
        <label className="shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-slate-950 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600">
          {uploading ? "Uploading…" : "Upload document"}
          <input ref={fileRef} type="file" className="hidden" onChange={onFile} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" />
        </label>
      </div>
      <p className="mt-1 text-xs text-slate-400">Private — stored securely and opened via short-lived links only.</p>

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {docs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
            No documents yet — upload scans, prescriptions, or reports.
          </p>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">📄 {d.title || d.file_name || "Document"}</p>
                {d.ai_analysis && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">AI: {d.ai_analysis}</p>}
              </div>
              <button onClick={() => view(d)} className="ml-3 shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:border-blue-300">
                View
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
