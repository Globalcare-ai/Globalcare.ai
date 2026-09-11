"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@/utils/supabase/client";
import { STATUS_META, type Journey, type Consultation } from "@/lib/types";
import MedicalProfile from "@/app/components/MedicalProfile";
import MedicalDocuments from "@/app/components/MedicalDocuments";
import ConsultationHistory from "@/app/components/ConsultationHistory";

const CALENDLY = "https://calendly.com/shaiksameer8921/meet-with-your-doctor";

const PROGRESS: Record<string, number> = { intake: 20, recommendation: 45, travel: 70, payment: 90, confirmed: 100, cancelled: 0 };
const TONES = [
  { bg: "bg-amber-50", bar: "bg-amber-400", ring: "border-amber-100" },
  { bg: "bg-blue-50", bar: "bg-blue-500", ring: "border-blue-100" },
  { bg: "bg-rose-50", bar: "bg-rose-400", ring: "border-rose-100" },
  { bg: "bg-emerald-50", bar: "bg-emerald-500", ring: "border-emerald-100" },
];

function shorten(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}
function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const [loading, setLoading] = useState(true);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dismissedPlan, setDismissedPlan] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const privyId = user?.id;
  const wallet = user?.wallet?.address;
  const email = user?.email?.address ?? user?.google?.email;
  const name = (user?.google?.name as string | undefined) ?? email?.split("@")[0] ?? "there";
  const initial = name.charAt(0).toUpperCase();

  async function copyWallet() {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !privyId) return;
    try {
      const supabase = createClient();
      const path = `${privyId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type || "image/png", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("patients").update({ avatar_url: data.publicUrl }).eq("privy_user_id", privyId);
      setAvatarUrl(data.publicUrl);
    } catch {}
  }

  const loadData = useCallback(async () => {
    if (!privyId) return;
    setLoading(true);
    setDbError(null);
    try {
      const supabase = createClient();
      await supabase.from("patients").upsert({ privy_user_id: privyId, name, email }, { onConflict: "privy_user_id" });
      const [{ data: j, error: je }, { data: c }, { data: pat }] = await Promise.all([
        supabase.from("journeys").select("*").eq("privy_user_id", privyId).order("created_at", { ascending: false }),
        supabase.from("consultations").select("*").eq("privy_user_id", privyId).order("created_at", { ascending: false }),
        supabase.from("patients").select("avatar_url").eq("privy_user_id", privyId).maybeSingle(),
      ]);
      if (je) throw je;
      setJourneys((j as Journey[]) ?? []);
      setConsultations((c as Consultation[]) ?? []);
      setAvatarUrl((pat as { avatar_url?: string | null } | null)?.avatar_url ?? null);
    } catch (e: unknown) {
      setDbError(e instanceof Error ? e.message : "Could not reach the database yet.");
    } finally {
      setLoading(false);
    }
  }, [privyId, name, email]);

  useEffect(() => {
    if (ready && authenticated) loadData();
    if (ready && !authenticated) setLoading(false);
  }, [ready, authenticated, loadData]);

  async function demoCompleteConsult(cn: Consultation) {
    try {
      const supabase = createClient();
      const jr = journeys.find((j) => j.id === cn.journey_id);
      const cost = jr?.total_cost_usd ?? 18000;
      const now = new Date().toISOString();
      await supabase.from("consultations").update({
        status: "completed",
        completed_at: now,
        diagnosis: jr?.condition ? `${jr.condition} — confirmed suitable for treatment after review` : "Reviewed — suitable for the planned treatment",
        recommendations: "Proceed with the recommended treatment. Standard pre-operative labs advised before travel.",
        prescription: "Per clinic protocol; full details provided at intake.",
        recommended_hospital: jr?.hospital_name ?? "Recommended partner hospital",
        estimated_cost_usd: cost,
      }).eq("id", cn.id);
      if (cn.journey_id) {
        await supabase.from("journeys").update({ status: "payment", total_cost_usd: cost, updated_at: now }).eq("id", cn.journey_id);
      }
      await loadData();
    } catch {}
  }

  async function deleteJourney(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this journey and its consultation history? This can't be undone.")) return;
    try {
      const supabase = createClient();
      await supabase.from("journeys").delete().eq("id", id);
      await loadData();
    } catch {}
  }

  async function cancelJourney(id: string) {
    try {
      const supabase = createClient();
      await supabase.from("journeys").update({ status: "cancelled" }).eq("id", id);
      await loadData();
    } catch {}
  }

  // --- gates -------------------------------------------------------
  if (!ready || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eaeef7] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Loading your dashboard…
        </div>
      </main>
    );
  }
  if (!authenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#eaeef7] px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Please log in</h1>
        <p className="max-w-sm text-sm text-slate-500">Log in to view your medical journeys, consultations, and treatment plans.</p>
        <button onClick={login} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-600">Log in →</button>
      </main>
    );
  }

  // --- derived -----------------------------------------------------
  const upcoming = consultations.find((c) => c.status === "scheduled");
  const activePlan = consultations.find(
    (c) => c.status === "completed" && !dismissedPlan &&
      !["cancelled", "confirmed"].includes(journeys.find((j) => j.id === c.journey_id)?.status ?? "")
  );
  const planJourney = activePlan ? journeys.find((j) => j.id === activePlan.journey_id) : undefined;
  const activeJourneys = journeys.filter((j) => j.status !== "cancelled").length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e7ecf6] via-[#eef2fa] to-[#e7ecf6] text-slate-900">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 cursor-pointer rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white shadow-lg" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}

      {/* top nav */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/gll.png" alt="GlobalCare.ai" width={1955} height={578} priority className="h-7 w-auto" />
          </Link>
          <nav className="hidden items-center gap-1 rounded-full bg-slate-100/80 p-1 md:flex">
            {[["Overview", "#top"], ["Journeys", "#journeys"], ["Records", "#records"], ["Consultations", "#consultations"]].map(([l, h]) => (
              <a key={l} href={h} className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <button onClick={logout} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-500 transition hover:border-red-200 hover:text-red-600">Log out</button>
          </div>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {/* two-panel grid */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* LEFT: identity + details + wallet */}
          <div className="flex flex-col gap-5">
            <section className="rounded-3xl border border-slate-200/70 bg-white p-6 text-center shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
              <label className="group relative mx-auto flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-semibold text-white shadow-md">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
                <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-[11px] font-medium group-hover:flex">Change</span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
              <h1 className="mt-4 text-xl font-semibold tracking-tight">{name}</h1>
              <p className="text-sm text-slate-500">{email}</p>
              <div className="mt-5 flex flex-col gap-2">
                <Link href="/chatbox?new=1" className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600">
                  <Svg d="M4 5h16v11H8l-4 4z" /> New consultation chat
                </Link>
                <div className="flex gap-2">
                  <a href="#consultations" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
                    <Svg d="M7 3v4M17 3v4M3 9h18M5 5h14v16H5z" /> Consults
                  </a>
                  <a href="#records" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
                    <Svg d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /> Records
                  </a>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <MiniStat label="Journeys" value={String(activeJourneys)} />
                <MiniStat label="Consults" value={String(consultations.length)} />
              </div>
            </section>

            {/* wallet */}
            {wallet && (
              <section className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Embedded wallet</p>
                <code className="mt-2 block break-all font-mono text-xs text-slate-700">{wallet}</code>
                <button onClick={copyWallet} className="mt-3 w-full rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-600">
                  {copied ? "Copied ✓" : "Copy address"}
                </button>
                <p className="mt-2 text-[11px] text-slate-500">Fund with Sepolia test ETH &amp; USDC for a test payment.</p>
              </section>
            )}

            {/* medical profile (details + edit) */}
            <div id="records" className="scroll-mt-24">
              {privyId && <MedicalProfile privyId={privyId} email={email} />}
            </div>
          </div>

          {/* RIGHT: reminders, plan, journeys, records */}
          <div className="flex flex-col gap-5">
            {dbError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Database not fully set up — run <code>schema.sql</code>, <code>002_messages.sql</code>, <code>003_medical.sql</code>.
              </div>
            )}

            {(upcoming || activePlan) && (
              <div className="flex flex-col gap-3">
                {upcoming && (
                  <Banner tone="blue" kicker="Upcoming" icon="📅"
                    text={<>Video consultation with {upcoming.doctor_name || "your specialist"}{upcoming.scheduled_at ? ` · ${new Date(upcoming.scheduled_at).toLocaleString()}` : " · check your email for the time"}</>}
                    action={<a href={upcoming.meeting_url || CALENDLY} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700">Join</a>} />
                )}
                {activePlan && (
                  <Banner tone="amber" kicker="Action required" icon="🩺"
                    text={<>Doctor completed your treatment plan{activePlan.estimated_cost_usd != null ? ` · est. $${activePlan.estimated_cost_usd.toLocaleString()}` : ""}.</>}
                    action={<a href="#treatment-plan" className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-amber-600">View plan</a>} />
                )}
              </div>
            )}

            {/* treatment plan */}
            {activePlan && (
              <section id="treatment-plan" className="scroll-mt-24 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-6 py-4">
                  <h2 className="text-lg font-semibold">Treatment plan</h2>
                  <span className="text-xs text-slate-400">{activePlan.completed_at ? new Date(activePlan.completed_at).toLocaleString() : ""}</span>
                </div>
                <div className="p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Plan label="Diagnosis / condition" value={activePlan.diagnosis} />
                    <Plan label="Doctor recommendations" value={activePlan.recommendations} />
                    <Plan label="Prescription" value={activePlan.prescription} />
                    <Plan label="Recommended hospital" value={activePlan.recommended_hospital} />
                  </div>
                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white">
                    <span className="text-sm text-white/70">Estimated cost</span>
                    <span className="text-2xl font-semibold">{activePlan.estimated_cost_usd != null ? `$${activePlan.estimated_cost_usd.toLocaleString()}` : "—"}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => setToast("💳 Payment is the next milestone — the crypto/escrow layer isn't wired yet, so no funds move.")} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700">
                      Pay {activePlan.estimated_cost_usd != null ? `$${activePlan.estimated_cost_usd.toLocaleString()}` : ""}
                    </button>
                    <button onClick={() => setDismissedPlan(true)} className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300">Not ready</button>
                    {planJourney && (
                      <button onClick={() => cancelJourney(planJourney.id)} className="rounded-full border border-rose-200 px-6 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50">Cancel journey</button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ongoing journeys */}
            <section id="journeys" className="scroll-mt-24 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your journeys</h2>
                <Link href="/chatbox?new=1" className="rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600">+ New journey</Link>
              </div>
              {journeys.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-500">No journeys yet — start your first one.</div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {journeys.map((j, i) => {
                    const s = STATUS_META[j.status ?? "intake"] ?? STATUS_META.intake;
                    const tone = j.status === "cancelled" ? { bg: "bg-slate-50", bar: "bg-slate-300", ring: "border-slate-100" } : TONES[i % TONES.length];
                    const place = [j.destination_city, j.destination_country].filter(Boolean).join(", ");
                    const prog = PROGRESS[j.status ?? "intake"] ?? 20;
                    return (
                      <Link key={j.id} href={`/chatbox?journey=${j.id}`} className={`group relative flex flex-col rounded-2xl border ${tone.ring} ${tone.bg} p-4 transition hover:shadow-md`}>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteJourney(j.id); }}
                          title="Delete journey"
                          className="absolute -right-2 -top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transition hover:bg-rose-600 group-hover:flex"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                        </button>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-500">{fmtDate(j.created_at)}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
                        </div>
                        <p className="mt-3 truncate font-semibold text-slate-900">{j.condition || j.treatment || "New medical journey"}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{[j.hospital_name, place].filter(Boolean).join(" · ") || "Continue where you left off"}</p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${prog}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{j.total_cost_usd ? `$${j.total_cost_usd.toLocaleString()}` : "—"}</span>
                          <span>{timeAgo(j.updated_at ?? j.created_at)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* consultations + documents */}
            <div id="consultations" className="grid scroll-mt-24 gap-5 xl:grid-cols-2">
              <ConsultationHistory consultations={consultations} onComplete={demoCompleteConsult} />
              {privyId && <MedicalDocuments privyId={privyId} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Svg({ d }: { d: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-center">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function Banner({ tone, kicker, icon, text, action }: { tone: "blue" | "amber"; kicker: string; icon: string; text: React.ReactNode; action: React.ReactNode }) {
  const tones = tone === "blue" ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50";
  const kick = tone === "blue" ? "text-blue-700" : "text-amber-700";
  return (
    <div className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${tones}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${kick}`}>{kicker}</p>
          <p className="mt-0.5 text-sm text-slate-700">{text}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Plan({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}
