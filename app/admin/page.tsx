"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@/utils/supabase/client";
import ProfileMenu from "@/app/components/ProfileMenu";

type Patient = { id: string; privy_user_id: string; name: string | null; email: string | null; avatar_url: string | null; phone: string | null; date_of_birth: string | null; blood_group: string | null; allergies: string | null; conditions: string | null; medications: string | null; medical_history: string | null };
type Journey = { id: string; privy_user_id: string; condition: string | null; treatment: string | null; destination_country: string | null; destination_city: string | null; hospital_name: string | null; status: string | null; escrow_status: string | null; total_cost_usd: number | null; flight_airline: string | null; flight_from: string | null; flight_to: string | null; flight_depart: string | null; flight_return: string | null; flight_price: number | null; origin_city: string | null; created_at: string };
type Consult = { id: string; journey_id: string | null; privy_user_id: string; doctor_name: string | null; reason: string | null; scheduled_at: string | null; meeting_url: string | null; status: string; diagnosis: string | null; recommendations: string | null; prescription: string | null; recommended_hospital: string | null; estimated_cost_usd: number | null; completed_at: string | null; created_at: string };
type Escrow = { id: string; journey_id: string; privy_user_id: string; patient_wallet: string | null; escrow_wallet: string | null; company_wallet: string | null; deposited_amount: number; released_amount: number; refunded_amount: number; status: string; deposit_tx_hash: string | null; token: string | null; created_at: string };
type MS = { id: string; escrow_id: string; idx: number; name: string; percentage: number; amount: number; status: string; release_tx_hash: string | null };
type Refund = { id: string; journey_id: string; reason: string | null; amount: number; to_company: number; status: string; refund_tx_hash: string | null; created_at: string };
type Payment = { id: string; journey_id: string | null; privy_user_id: string; amount_usd: number | null; tx_hash: string | null; created_at: string };
type Doc = { id: string; journey_id: string | null; privy_user_id: string; file_name: string | null; title: string | null; ai_analysis: string | null; created_at: string };

const ADMINS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
const short = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");
const when = (d?: string | null) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
const usd = (n?: number | null) => (n == null ? "—" : `$${Number(n).toLocaleString()}`);
const amt = (n: number) => String(Number(n.toFixed(6)));
const scan = (h: string) => `https://sepolia.etherscan.io/tx/${h}`;

const SECTIONS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "patients", label: "Patients", icon: "🧑" },
  { key: "journeys", label: "Journeys", icon: "🧳" },
  { key: "consults", label: "Consultations", icon: "🩺" },
  { key: "payments", label: "Payments & Escrow", icon: "🔐" },
  { key: "travel", label: "Travel / Bookings", icon: "✈️" },
] as const;
type TabKey = (typeof SECTIONS)[number]["key"];

const BLURB: Record<TabKey, string> = {
  overview: "Everything that needs attention today, across every patient.",
  patients: "Profiles, medical history, documents and journey history.",
  journeys: "Every journey and where it has got to.",
  consults: "Scheduled calls and the notes doctors filed afterwards.",
  payments: "Escrow custody, milestone releases and refunds.",
  travel: "Flights, hotels, transfers and booking status.",
};

export default function AdminPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const addrs = [
    user?.wallet?.address,
    ...((user?.linkedAccounts ?? []).map((a) => (a.type === "wallet" ? (a as { address?: string }).address : undefined))),
  ].filter(Boolean).map((a) => (a as string).toLowerCase());
  const isAdmin = addrs.some((a) => ADMINS.includes(a));

  const [secret, setSecret] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [consults, setConsults] = useState<Consult[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [ms, setMs] = useState<MS[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [refundIn, setRefundIn] = useState<Record<string, { p: string; c: string }>>({});
  const [openPatient, setOpenPatient] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { try { setSecret(localStorage.getItem("gc_admin_secret") ?? ""); } catch {} }, []);

  const load = useCallback(async () => {
    try {
      const s = createClient();
      const [p, j, c, e, m, r, pay, d] = await Promise.all([
        s.from("patients").select("*").order("created_at", { ascending: false }),
        s.from("journeys").select("*").order("created_at", { ascending: false }),
        s.from("consultations").select("*").order("created_at", { ascending: false }),
        s.from("escrow").select("*").order("created_at", { ascending: false }),
        s.from("escrow_milestones").select("*").order("idx"),
        s.from("refunds").select("*").order("created_at", { ascending: false }),
        s.from("payments").select("id,journey_id,privy_user_id,amount_usd,tx_hash,created_at").order("created_at", { ascending: false }),
        s.from("medical_reports").select("id,journey_id,privy_user_id,file_name,title,ai_analysis,created_at").order("created_at", { ascending: false }),
      ]);
      setPatients((p.data as Patient[]) ?? []);
      setJourneys((j.data as Journey[]) ?? []);
      setConsults((c.data as Consult[]) ?? []);
      setEscrows((e.data as Escrow[]) ?? []);
      setMs((m.data as MS[]) ?? []);
      setRefunds((r.data as Refund[]) ?? []);
      setPayments((pay.data as Payment[]) ?? []);
      setDocs((d.data as Doc[]) ?? []);
    } catch {} finally { setLoaded(true); }
  }, []);

  useEffect(() => { if (ready && authenticated && isAdmin) load(); }, [ready, authenticated, isAdmin, load]);

  async function callApi(path: string, body: Record<string, unknown>, busyKey: string) {
    if (!secret) { setMsg("Enter the admin secret first."); return; }
    setBusy(busyKey); setMsg("Submitting on-chain… (waiting for Sepolia confirmation)");
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setMsg("⚠ " + (data.error ?? "Failed")); return; }
      setMsg("✓ Done" + (data.hash ? ` · ${String(data.hash).slice(0, 14)}…` : ""));
      await load();
    } catch (e) { setMsg("⚠ " + (e instanceof Error ? e.message : "Request failed")); }
    finally { setBusy(null); }
  }

  // ---- lookups -------------------------------------------------------
  const patientOf = (pid: string) => patients.find((p) => p.privy_user_id === pid);
  const nameOf = (pid: string) => patientOf(pid)?.name || patientOf(pid)?.email || `Patient ${pid.slice(-6)}`;
  const journeyOf = (id?: string | null) => journeys.find((j) => j.id === id);
  const msOf = (escId: string) => ms.filter((m) => m.escrow_id === escId);
  const pendingRefunds = refunds.filter((r) => r.status === "requested");
  const cancelRequested = journeys.filter((j) => j.escrow_status === "refund_requested");
  const activeJourneys = journeys.filter((j) => j.status !== "cancelled");
  const scheduled = consults.filter((c) => c.status === "scheduled");
  const upcomingTrips = journeys.filter((j) => j.flight_depart && new Date(j.flight_depart) > new Date());
  const tokenTotals: Record<string, { dep: number; rem: number }> = {};
  escrows.forEach((e) => {
    const t = e.token ?? "USDC";
    tokenTotals[t] ??= { dep: 0, rem: 0 };
    tokenTotals[t].dep += Number(e.deposited_amount);
    tokenTotals[t].rem += Number(e.deposited_amount) - Number(e.released_amount) - Number(e.refunded_amount);
  });
  const counts: Record<TabKey, number> = {
    overview: pendingRefunds.length + cancelRequested.length,
    patients: patients.length,
    journeys: activeJourneys.length,
    consults: scheduled.length,
    payments: escrows.length,
    travel: journeys.filter((j) => j.flight_from).length,
  };

  if (!ready) return <Center>Loading…</Center>;
  if (!authenticated) return <Center><button onClick={login} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-600">Log in →</button></Center>;
  if (!isAdmin) return <Center><div><p className="text-lg font-semibold text-slate-900">Not authorized</p><p className="mt-1 text-sm text-slate-500">Wallet {short(addrs[0])} isn&apos;t in the GlobalCare admin allowlist.</p><Link href="/dashboard" className="mt-3 inline-block text-blue-600 underline">Back to dashboard</Link></div></Center>;

  return (
    <main className="min-h-screen bg-[#eef2fb] text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        {/* sidebar */}
        <aside className="w-64 shrink-0">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm text-white">🛠️</span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">GlobalCare</p>
                <h1 className="text-base font-semibold tracking-tight">Ops console</h1>
              </div>
            </div>
            <nav className="mt-5 flex flex-col gap-1.5">
              {SECTIONS.map((sct) => (
                <button key={sct.key} onClick={() => setTab(sct.key)}
                  className={`flex items-center justify-between rounded-full px-4 py-2.5 text-left text-sm transition ${tab === sct.key ? "bg-slate-950 font-medium text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
                  <span>{sct.icon}&ensp;{sct.label}</span>
                  {counts[sct.key] > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sct.key === "overview" ? "bg-rose-100 text-rose-600" : tab === sct.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{counts[sct.key]}</span>}
                </button>
              ))}
            </nav>
            <Link href="/dashboard" className="mt-6 block px-1 text-xs text-slate-400 transition hover:text-slate-700">← Patient dashboard</Link>
          </div>
        </aside>

        {/* content */}
        <section className="min-w-0 flex-1">
          {/* content header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{SECTIONS.find((x) => x.key === tab)?.label}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{BLURB[tab]}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {secret && (
                <button
                  onClick={load}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" /></svg>
                  Refresh
                </button>
              )}
              <ProfileMenu currentPage="admin" />
            </div>
          </div>

          {!secret ? (
            <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">Enter admin secret</p>
              <p className="mt-1 text-xs text-slate-500">Matches ADMIN_API_SECRET on the server. Stored only in this browser.</p>
              <div className="mt-4 flex gap-2">
                <input type="password" value={secretInput} onChange={(e) => setSecretInput(e.target.value)} className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white" placeholder="admin secret" />
                <button onClick={() => { try { localStorage.setItem("gc_admin_secret", secretInput); } catch {} setSecret(secretInput); }} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600">Save</button>
              </div>
            </div>
          ) : !loaded ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <>
              {msg && <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm">{msg}</div>}

              {tab === "overview" && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <Kpi label="Active journeys" v={String(activeJourneys.length)} />
                    <Kpi label="Pending consults" v={String(scheduled.length)} />
                    <Kpi label="Deposited" v={Object.entries(tokenTotals).map(([t, x]) => `${amt(x.dep)} ${t}`).join(" · ") || "0"} />
                    <Kpi label="In escrow" v={Object.entries(tokenTotals).map(([t, x]) => `${amt(x.rem)} ${t}`).join(" · ") || "0"} />
                    <Kpi label="Upcoming trips" v={String(upcomingTrips.length)} />
                  </div>

                  {(pendingRefunds.length > 0 || cancelRequested.length > 0) && (
                    <Card title="⚠️ Alerts">
                      {cancelRequested.map((j) => (
                        <div key={j.id} className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm">
                          <span className="text-slate-700"><b>{nameOf(j.privy_user_id)}</b> requested cancellation · {j.condition || "journey"}</span>
                          <button onClick={() => setTab("payments")} className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-rose-700">Review →</button>
                        </div>
                      ))}
                      {pendingRefunds.map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm">
                          <span className="text-slate-700"><b>{nameOf(journeyOf(r.journey_id)?.privy_user_id ?? "")}</b> · refund requested{r.reason ? ` — ${r.reason}` : ""}</span>
                          <button onClick={() => setTab("payments")} className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600">Review →</button>
                        </div>
                      ))}
                    </Card>
                  )}

                  <Card title="Recent payments">
                    {payments.length === 0 ? <Empty>No payments yet.</Empty> : payments.slice(0, 8).map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
                        <span className="text-slate-700"><b>{nameOf(p.privy_user_id)}</b> · {journeyOf(p.journey_id)?.condition || "journey"} · {usd(p.amount_usd)}</span>
                        <span className="flex items-center gap-3 text-xs text-slate-400">
                          {p.tx_hash && <a href={scan(p.tx_hash)} target="_blank" rel="noreferrer" className="font-mono text-blue-600 underline decoration-dotted hover:text-blue-700">{p.tx_hash.slice(0, 12)}…</a>}
                          {when(p.created_at)}
                        </span>
                      </div>
                    ))}
                  </Card>

                  <Card title="Escrow snapshot">
                    {escrows.length === 0 ? <Empty>No escrows yet.</Empty> : escrows.map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
                        <span className="text-slate-700"><b>{nameOf(e.privy_user_id)}</b> · {journeyOf(e.journey_id)?.condition || "journey"}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{amt(Number(e.deposited_amount))} {e.token ?? "USDC"}</span>
                          <StatusChip s={e.status} />
                        </span>
                      </div>
                    ))}
                  </Card>
                </div>
              )}

              {tab === "patients" && (
                <div className="flex flex-col gap-4">
                  {patients.length === 0 ? <EmptyCard>No patients yet.</EmptyCard> : patients.map((p) => {
                    const js = journeys.filter((j) => j.privy_user_id === p.privy_user_id);
                    const cs = consults.filter((c) => c.privy_user_id === p.privy_user_id);
                    const ds = docs.filter((d) => d.privy_user_id === p.privy_user_id);
                    const open = openPatient === p.id;
                    return (
                      <div key={p.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
                        <button onClick={() => setOpenPatient(open ? null : p.id)} className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-slate-50/70">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                              {p.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                (p.name || p.email || "P").slice(0, 1).toUpperCase()
                              )}
                            </span>
                            <div>
                              <p className="font-semibold">{p.name || p.email || "Unnamed patient"}</p>
                              <p className="text-xs text-slate-400">{p.email || "—"} · id {p.privy_user_id.slice(0, 18)}…</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">{js.length} journeys</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">{cs.length} consults</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">{ds.length} docs</span>
                            <span>{open ? "▲" : "▼"}</span>
                          </div>
                        </button>
                        {open && (
                          <div className="border-t border-slate-100 px-6 py-5">
                            <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                              <Field k="Phone" v={p.phone} /><Field k="Date of birth" v={p.date_of_birth ? day(p.date_of_birth) : null} />
                              <Field k="Blood group" v={p.blood_group} /><Field k="Allergies" v={p.allergies} />
                              <Field k="Existing conditions" v={p.conditions} /><Field k="Medications" v={p.medications} />
                              <Field k="Medical history" v={p.medical_history} />
                            </div>
                            {ds.length > 0 && (
                              <div className="mt-5">
                                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">Documents & AI reports</p>
                                {ds.map((d) => (
                                  <p key={d.id} className="mt-2 text-sm text-slate-600">📄 {d.title || d.file_name || "Report"}{d.ai_analysis ? <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">AI analysed</span> : null}<span className="ml-2 text-xs text-slate-400">{day(d.created_at)}</span></p>
                                ))}
                              </div>
                            )}
                            {js.length > 0 && (
                              <div className="mt-5">
                                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">Journey history</p>
                                {js.map((j) => (
                                  <div key={j.id} className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{j.condition || j.treatment || "Journey"} · {j.hospital_name || "—"}</span>
                                    <span className="flex items-center gap-2"><StatusChip s={j.status ?? "intake"} /><Link href={`/track?journey=${j.id}`} className="text-xs font-medium text-blue-600 hover:underline">track →</Link></span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "journeys" && (
                <div className="flex flex-col gap-4">
                  {journeys.length === 0 ? <EmptyCard>No journeys yet.</EmptyCard> : journeys.map((j) => (
                    <div key={j.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{j.condition || j.treatment || "Journey"} <span className="ml-1 text-sm font-normal text-slate-400">· {nameOf(j.privy_user_id)}</span></p>
                          <p className="mt-0.5 text-xs text-slate-400">{j.hospital_name || "—"} · {[j.destination_city, j.destination_country].filter(Boolean).join(", ") || "destination TBC"}</p>
                        </div>
                        <div className="flex items-center gap-2"><StatusChip s={j.status ?? "intake"} />{j.escrow_status && <StatusChip s={j.escrow_status} />}</div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400 sm:grid-cols-4">
                        <span>Est. cost <b className="block text-sm font-semibold text-slate-800">{usd(j.total_cost_usd)}</b></span>
                        <span>Flight <b className="block text-sm font-semibold text-slate-800">{j.flight_from ? `${j.flight_from} → ${j.flight_to}` : "—"}</b></span>
                        <span>Departs <b className="block text-sm font-semibold text-slate-800">{when(j.flight_depart)}</b></span>
                        <span>Created <b className="block text-sm font-semibold text-slate-800">{day(j.created_at)}</b></span>
                      </div>
                      <Link href={`/track?journey=${j.id}`} className="mt-4 inline-block rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-600">Open journey tracker →</Link>
                    </div>
                  ))}
                </div>
              )}

              {tab === "consults" && (
                <div className="flex flex-col gap-4">
                  {consults.length === 0 ? <EmptyCard>No consultations yet.</EmptyCard> : consults.map((c) => (
                    <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{nameOf(c.privy_user_id)} <span className="text-sm font-normal text-slate-400">· {c.doctor_name || "GlobalCare Specialist"}</span></p>
                          <p className="mt-0.5 text-xs text-slate-400">{c.reason || journeyOf(c.journey_id)?.condition || "Consultation"} · {c.scheduled_at ? when(c.scheduled_at) : "time TBC"}</p>
                        </div>
                        <StatusChip s={c.status} />
                      </div>
                      {c.status === "completed" && (
                        <div className="mt-4 grid gap-x-8 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                          <Field k="Diagnosis" v={c.diagnosis} /><Field k="Recommendations" v={c.recommendations} />
                          <Field k="Prescription" v={c.prescription} /><Field k="Recommended hospital" v={c.recommended_hospital} />
                          <Field k="Final estimate" v={c.estimated_cost_usd != null ? usd(c.estimated_cost_usd) : null} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {tab === "payments" && (
                <div className="flex flex-col gap-5">
                  {escrows.length === 0 ? <EmptyCard>No escrow-funded journeys yet.</EmptyCard> : escrows.map((esc) => {
                    const j = journeyOf(esc.journey_id);
                    const rows = msOf(esc.id);
                    const remaining = Number(esc.deposited_amount) - Number(esc.released_amount) - Number(esc.refunded_amount);
                    const req = pendingRefunds.find((r) => r.journey_id === esc.journey_id);
                    const wantsCancel = j?.escrow_status === "refund_requested";
                    const ri = refundIn[esc.id] ?? { p: amt(remaining), c: "0" };
                    const tok = esc.token ?? "USDC";
                    const refunded = esc.status.includes("refund");
                    const releasedAll = esc.status === "released";
                    return (
                      <div key={esc.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{nameOf(esc.privy_user_id)} <span className="text-sm font-normal text-slate-400">· {j?.condition || j?.treatment || "Journey"}</span></p>
                            <p className="mt-0.5 text-xs text-slate-400">{j?.hospital_name || "—"} · patient {short(esc.patient_wallet)} · escrow {short(esc.escrow_wallet)} · company {short(esc.company_wallet)}</p>
                          </div>
                          <StatusChip s={esc.status} />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <Kpi label="Deposited" v={`${amt(Number(esc.deposited_amount))} ${tok}`} />
                          <Kpi label="Released" v={`${amt(Number(esc.released_amount))} ${tok}`} />
                          <Kpi label="Remaining" v={`${amt(remaining)} ${tok}`} />
                        </div>

                        {(wantsCancel || req) && <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">↩︎ Patient requested cancellation{req?.reason ? ` — ${req.reason}` : ""} · process a refund below.</p>}

                        {/* multi-step escrow rail (same as patient view) */}
                        <div className="mt-5 space-y-2">
                          <Step done label="Payment deposited" trailing={esc.deposit_tx_hash ? <a href={scan(esc.deposit_tx_hash)} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-blue-600 underline decoration-dotted hover:text-blue-700">{esc.deposit_tx_hash.slice(0, 12)}…</a> : undefined} />
                          <Step done={!refunded} active={!releasedAll && !refunded} label={refunded ? "Funds returned to patient" : "Funds secured in escrow"} />
                          {rows.map((m) => (
                            <Step key={m.id} done={m.status === "released"} active={m.status !== "released" && remaining + 1e-9 >= Number(m.amount) && !refunded}
                              label={`${m.name} · ${m.percentage}% (${amt(Number(m.amount))} ${tok})`}
                              trailing={m.status === "released" ? (
                                <span className="flex items-center gap-2 text-xs font-medium text-emerald-600">✓ Released{m.release_tx_hash && <a href={scan(m.release_tx_hash)} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-blue-600 underline decoration-dotted hover:text-blue-700">{m.release_tx_hash.slice(0, 12)}…</a>}</span>
                              ) : refunded ? (
                                <span className="text-[10px] uppercase tracking-wide text-slate-400">n/a</span>
                              ) : (
                                <button disabled={busy !== null || remaining + 1e-9 < Number(m.amount)} onClick={() => callApi("/api/admin/release", { milestoneId: m.id }, m.id)} className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40">
                                  {busy === m.id ? "Releasing…" : "Complete & release"}
                                </button>
                              )} />
                          ))}
                          <Step done={releasedAll} label="Fully released to GlobalCare" />
                        </div>

                        {remaining > 1e-9 && !refunded && (
                          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <p className="text-xs font-semibold text-slate-700">Refund / cancel</p>
                            <div className="mt-3 flex flex-wrap items-end gap-3 text-xs">
                              <label className="flex flex-col gap-1 text-slate-500">To patient ({tok})
                                <input value={ri.p} onChange={(e) => setRefundIn((st) => ({ ...st, [esc.id]: { ...ri, p: e.target.value } }))} className="w-32 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400" /></label>
                              <label className="flex flex-col gap-1 text-slate-500">To GlobalCare ({tok})
                                <input value={ri.c} onChange={(e) => setRefundIn((st) => ({ ...st, [esc.id]: { ...ri, c: e.target.value } }))} className="w-32 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400" /></label>
                              <button disabled={busy !== null} onClick={() => callApi("/api/admin/refund", { journeyId: esc.journey_id, refundId: req?.id, toPatient: Number(ri.p), toCompany: Number(ri.c) }, `refund-${esc.id}`)} className="rounded-full bg-rose-600 px-5 py-2 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-40">
                                {busy === `refund-${esc.id}` ? "Refunding…" : "Process refund"}
                              </button>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400">To patient + to GlobalCare must be ≤ {amt(remaining)} {tok}.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "travel" && (
                <div className="flex flex-col gap-4">
                  {journeys.filter((j) => j.flight_from || j.escrow_status).length === 0 ? <EmptyCard>No bookings yet.</EmptyCard> : journeys.filter((j) => j.flight_from || j.escrow_status).map((j) => {
                    const esc = escrows.find((e) => e.journey_id === j.id);
                    const rows = esc ? msOf(esc.id) : [];
                    const coord = rows.find((m) => m.idx === 1);
                    return (
                      <div key={j.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{nameOf(j.privy_user_id)} <span className="text-sm font-normal text-slate-400">· {j.condition || "Journey"}</span></p>
                            <p className="mt-0.5 text-xs text-slate-400">{j.origin_city || "—"} → {[j.destination_city, j.destination_country].filter(Boolean).join(", ") || "—"}</p>
                          </div>
                          <div className="text-right text-xs text-slate-400">{j.flight_airline || "GlobalCare Air"}{j.flight_price != null ? ` · ${usd(j.flight_price)}` : ""}</div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400 sm:grid-cols-4">
                          <span>Route <b className="block text-sm font-semibold text-slate-800">{j.flight_from ? `${j.flight_from} → ${j.flight_to}` : "—"}</b></span>
                          <span>Departs <b className="block text-sm font-semibold text-slate-800">{when(j.flight_depart)}</b></span>
                          <span>Return <b className="block text-sm font-semibold text-slate-800">{when(j.flight_return)}</b></span>
                          <span>Hospital <b className="block text-sm font-semibold text-slate-800">{j.hospital_name || "—"}</b></span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                          <Chip ok={!!j.flight_from} label={j.flight_from ? "✓ Flight booked" : "○ Flight pending"} />
                          <Chip ok={coord?.status === "released"} label={coord?.status === "released" ? "✓ Hotel & transfers arranged" : "○ Hotel & transfers pending"} />
                          <Chip ok={!!esc} label={esc ? "✓ Payment in escrow" : "○ Awaiting payment"} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Kpi({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-center shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <p className="truncate text-lg font-semibold tracking-tight text-slate-900">{v}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="mb-4 text-base font-semibold">{title}</p><div className="flex flex-col gap-2.5">{children}</div></div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">{children}</p>;
}
function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center shadow-sm">
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h10M4 17h7" /></svg>
      </span>
      <p className="text-sm text-slate-400">{children}</p>
    </div>
  );
}
function Field({ k, v }: { k: string; v?: string | null }) {
  return <p className="text-slate-700"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">{k}</span><br />{v || "—"}</p>;
}
function StatusChip({ s }: { s: string }) {
  const tone = ["released", "confirmed", "completed"].includes(s) ? "bg-emerald-100 text-emerald-700"
    : ["cancelled", "refunded", "partially_refunded", "refund_requested"].includes(s) ? "bg-rose-100 text-rose-700"
    : ["funded", "payment", "releasing", "scheduled"].includes(s) ? "bg-blue-100 text-blue-700"
    : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${tone}`}>{s.replaceAll("_", " ")}</span>;
}
function Step({ done, active, label, trailing }: { done?: boolean; active?: boolean; label: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 text-sm">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-slate-200 text-slate-400"}`}>{done ? "✓" : active ? "●" : "○"}</span>
      <span className={done || active ? "font-medium text-slate-800" : "text-slate-400"}>{label}</span>
      <span className="ml-auto">{trailing}</span>
    </div>
  );
}
function Chip({ ok, label }: { ok?: boolean; label: string }) {
  return <span className={`rounded-full px-3 py-1.5 font-medium ${ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{label}</span>;
}
function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#eef2fb] px-6 text-center text-sm text-slate-500">{children}</main>;
}
