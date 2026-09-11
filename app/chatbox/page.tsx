"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@/utils/supabase/client";
import CalendlyEmbed from "@/app/components/CalendlyEmbed";
import { countryImage } from "@/lib/countryImages";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

type DestinationOption = {
  country: string;
  city?: string;
  image?: string;
  cost?: string;
  savings?: string;
  points?: string[];
};

type FlightLeg = {
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  duration: string;
  stops: number;
};

type FlightOffer = {
  id: string;
  airline: string;
  price: string;
  currency: string;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
};

type FlightQuery = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
};

type HotelQuery = {
  query: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
};

type HotelOffer = {
  id: string;
  name: string;
  rating: number | null;
  reviews: number | null;
  hotelClass: string | null;
  pricePerNight: string;
  totalPrice: string | null;
  image: string | null;
};

type ConsultationOffer = { reason?: string; doctor?: string };

type JourneyPatch = {
  condition?: string;
  treatment?: string;
  destination_country?: string;
  destination_city?: string;
  hospital_name?: string;
  status?: string;
  total_cost_usd?: number;
};

// Pulls hidden ```journey metadata blocks out of a model message so they never
// render, and returns the parsed patch for persistence.
function extractJourney(text: string): { patch: JourneyPatch | null; cleaned: string } {
  let patch: JourneyPatch | null = null;
  let cleaned = text.replace(/```journey\s*([\s\S]*?)```/g, (_m, body: string) => {
    try {
      const parsed = JSON.parse(body.trim());
      if (parsed && typeof parsed === "object") patch = { ...(patch ?? {}), ...parsed };
    } catch {}
    return "";
  });
  // Hide a still-streaming (unterminated) journey block too.
  const open = cleaned.indexOf("```journey");
  if (open !== -1) cleaned = cleaned.slice(0, open);
  return { patch, cleaned: cleaned.trim() };
}

// Splits a model message into text and card blocks
// (destinations / flightsearch / hotelsearch).
// While a block is still streaming in (no closing fence), hide it.
function parseModelMessage(text: string): {
  before: string;
  options: DestinationOption[] | null;
  flightQuery: FlightQuery | null;
  hotelQuery: HotelQuery | null;
  after: string;
  streamingBlock: boolean;
  journeyPatch: JourneyPatch | null;
  consultation: ConsultationOffer | null;
} {
  const extracted = extractJourney(text);
  const journeyPatch = extracted.patch;
  text = extracted.cleaned;
  const empty = {
    options: null,
    flightQuery: null,
    hotelQuery: null,
    journeyPatch,
    consultation: null,
  };
  const kinds = ["destinations", "flightsearch", "hotelsearch", "consultation"] as const;
  let fenceStart = -1;
  let kind: (typeof kinds)[number] | null = null;
  for (const k of kinds) {
    const idx = text.indexOf("```" + k);
    if (idx !== -1 && (fenceStart === -1 || idx < fenceStart)) {
      fenceStart = idx;
      kind = k;
    }
  }
  if (fenceStart === -1 || !kind)
    return { before: text, ...empty, after: "", streamingBlock: false };

  const before = text.slice(0, fenceStart).trim();
  const rest = text.slice(fenceStart + ("```" + kind).length);
  const fenceEnd = rest.indexOf("```");

  if (fenceEnd === -1)
    return { before, ...empty, after: "", streamingBlock: true };

  const jsonRaw = rest.slice(0, fenceEnd).trim();
  const after = rest.slice(fenceEnd + 3).trim();

  try {
    const parsed = JSON.parse(jsonRaw);
    if (kind === "consultation") {
      return {
        before,
        ...empty,
        consultation: (parsed ?? {}) as ConsultationOffer,
        after,
        streamingBlock: false,
      };
    }
    if (kind === "destinations") {
      const options: DestinationOption[] = parsed?.options ?? [];
      return {
        before,
        ...empty,
        options: options.length ? options : null,
        after,
        streamingBlock: false,
      };
    }
    if (kind === "flightsearch") {
      return {
        before,
        ...empty,
        flightQuery: parsed as FlightQuery,
        after,
        streamingBlock: false,
      };
    }
    return {
      before,
      ...empty,
      hotelQuery: parsed as HotelQuery,
      after,
      streamingBlock: false,
    };
  } catch {
    return { before, ...empty, after, streamingBlock: false };
  }
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TicketLeg({ leg }: { leg: FlightLeg }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-900">
          {leg.from}
        </p>
        <p className="text-xs text-zinc-500">
          {fmtTime(leg.departAt)} · {fmtDate(leg.departAt)}
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center px-4">
        <div className="flex w-full items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
          <div className="flex-1 border-t border-dashed border-blue-300" />
          <span className="mx-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm text-blue-600">
            ✈
          </span>
          <div className="flex-1 border-t border-dashed border-blue-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">
          {leg.duration} ·{" "}
          {leg.stops === 0
            ? "Direct"
            : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold tracking-tight text-zinc-900">
          {leg.to}
        </p>
        <p className="text-xs text-zinc-500">{fmtTime(leg.arriveAt)}</p>
      </div>
    </div>
  );
}

function HotelCards({
  hotels,
  source,
  onSelect,
  disabled,
}: {
  hotels: HotelOffer[];
  source: string;
  onSelect: (h: HotelOffer) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      {source !== "live" && (
        <p className="pl-1 text-[10px] uppercase tracking-wide text-zinc-400">
          Sample hotel data
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {hotels.map((h) => (
          <div
            key={h.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
          >
            {h.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={h.image}
                alt={h.name}
                className="h-28 w-full object-cover"
              />
            ) : (
              <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl">
                🏨
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <h3 className="text-sm font-semibold leading-tight text-zinc-900">
                {h.name}
              </h3>
              <p className="text-xs text-zinc-500">
                {h.rating != null && <>⭐ {h.rating}</>}
                {h.reviews != null && ` (${h.reviews.toLocaleString()})`}
                {h.hotelClass && ` · ${h.hotelClass}`}
              </p>
              <div className="mt-auto pt-2">
                <p className="text-sm font-bold text-zinc-900">
                  {h.pricePerNight}
                  <span className="font-normal text-zinc-500"> /night</span>
                </p>
                {h.totalPrice && (
                  <p className="text-xs text-zinc-500">
                    {h.totalPrice} total stay
                  </p>
                )}
                <button
                  onClick={() => onSelect(h)}
                  disabled={disabled}
                  className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlightCards({
  flights,
  source,
  onSelect,
  disabled,
}: {
  flights: FlightOffer[];
  source: string;
  onSelect: (f: FlightOffer) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {source !== "live" && (
        <p className="pl-1 text-[10px] uppercase tracking-wide text-zinc-400">
          Sample flight data
        </p>
      )}
      {flights.map((f) => (
        <div
          key={f.id}
          className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
        >
          {/* Airline header */}
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="text-sm font-semibold text-zinc-900">{f.airline}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">
              {f.inbound ? "Round trip" : "One way"}
            </p>
          </div>

          <TicketLeg leg={f.outbound} />
          {f.inbound && (
            <div className="border-t border-blue-50">
              <TicketLeg leg={f.inbound} />
            </div>
          )}

          {/* Perforated ticket divider */}
          <div className="relative">
            <div className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-blue-100 bg-blue-50" />
            <div className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border border-blue-100 bg-blue-50" />
            <div className="border-t border-dashed border-blue-200" />
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <p className="text-sm text-zinc-500">Economy Class</p>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-zinc-900">
                ${Math.round(Number(f.price))}
              </p>
              <button
                onClick={() => onSelect(f)}
                disabled={disabled}
                className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DestinationCards({
  options,
  onSelect,
  disabled,
}: {
  options: DestinationOption[];
  onSelect: (country: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
      {options.map((opt) => (
        <div
          key={opt.country}
          className="flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={countryImage(opt.image)}
            alt={opt.country}
            className="h-32 w-full object-cover"
          />
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div>
              <h3 className="font-semibold text-zinc-900">
                {opt.country}
              </h3>
              {opt.city && (
                <p className="text-xs text-zinc-500">{opt.city}</p>
              )}
            </div>
            {opt.points && (
              <ul className="flex flex-col gap-1 text-xs text-zinc-600">
                {opt.points.map((p, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-blue-500">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto pt-2">
              {opt.cost && (
                <p className="text-sm font-semibold text-zinc-900">
                  {opt.cost}
                </p>
              )}
              {opt.savings && (
                <p className="text-xs font-medium text-green-600">
                  {opt.savings}
                </p>
              )}
              <button
                onClick={() => onSelect(opt.country)}
                disabled={disabled}
                className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              >
                Select {opt.country}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Renders **bold** inline
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  );
}

// Minimal markdown renderer: ### headings, * / - bullets, numbered lists, **bold**
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-1">
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        const trimmed = line.trim();

        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith("###")) {
          return (
            <p key={i} className="mt-1 font-semibold">
              {renderInline(trimmed.replace(/^#+\s*/, ""), `h-${i}`)}
            </p>
          );
        }

        const bullet = trimmed.match(/^[*-]\s+(.*)/);
        if (bullet) {
          const indent = raw.length - raw.trimStart().length;
          return (
            <p key={i} className={indent > 2 ? "pl-8" : "pl-4"}>
              <span className="mr-2">•</span>
              {renderInline(bullet[1], `b-${i}`)}
            </p>
          );
        }

        const numbered = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numbered) {
          return (
            <p key={i} className="pl-4">
              <span className="mr-2 font-medium">{numbered[1]}.</span>
              {renderInline(numbered[2], `n-${i}`)}
            </p>
          );
        }

        return <p key={i}>{renderInline(line, `p-${i}`)}</p>;
      })}
    </div>
  );
}

const WELCOME: ChatMessage = {
  role: "model",
  text: "Hi! I'm GlobalCare AI 👋 I help you find world-class medical treatment abroad — and plan the whole trip. What brings you here today?",
};

const AI_AVATAR = "/globe.png";
const USER_AVATAR =
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781518882/WhatsApp_Image_2024-12-11_at_14.19.21_mpsdlf.jpg";

export default function Chatbox() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [docNote, setDocNote] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [showCalendly, setShowCalendly] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const consultReasonRef = useRef<string | null>(null);
  const router = useRouter();

  // Detect when the doctor has completed the plan (journey moved to payment).
  const checkPlan = useCallback(async () => {
    const id = journeyIdRef.current;
    if (!id) return;
    try {
      const supabase = createClient();
      const { data } = await supabase.from("journeys").select("status").eq("id", id).single();
      const st = (data as { status?: string } | null)?.status;
      if (st === "payment" || st === "confirmed") setPlanReady(true);
    } catch {}
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autosize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }
  const [flightResults, setFlightResults] = useState<
    Record<number, { flights: FlightOffer[]; source: string } | "loading">
  >({});
  const [hotelResults, setHotelResults] = useState<
    Record<number, { hotels: HotelOffer[]; source: string } | "loading">
  >({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- persist the journey to Supabase, keyed by the Privy user id ----------
  const { authenticated, user, logout } = usePrivy();
  const acctEmail = user?.email?.address ?? (user?.google?.email as string | undefined);
  const acctName = (user?.google?.name as string | undefined) ?? acctEmail?.split("@")[0] ?? "Patient";
  const acctInitial = acctName.charAt(0).toUpperCase();
  const [sideJourneys, setSideJourneys] = useState<{ id: string; condition: string | null; treatment: string | null }[]>([]);
  useEffect(() => {
    if (!authenticated || !user?.id) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("journeys").select("id,condition,treatment")
          .eq("privy_user_id", user.id).order("created_at", { ascending: false }).limit(30);
        setSideJourneys((data as { id: string; condition: string | null; treatment: string | null }[]) ?? []);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user?.id, planReady]);

  async function deleteSideJourney(id: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this chat and its history? This can't be undone.")) return;
    try {
      const supabase = createClient();
      await supabase.from("journeys").delete().eq("id", id);
      setSideJourneys((prev) => prev.filter((x) => x.id !== id));
      if (journeyIdRef.current === id) router.push("/chatbox?new=1");
    } catch {}
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!authenticated || !user?.id) {
      setDocNote("Please log in to upload documents.");
      return;
    }
    setUploadingDoc(true);
    setDocNote(null);
    try {
      const supabase = createClient();
      const jid = await ensureJourney();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${jid ?? "general"}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage
        .from("medical-reports")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) throw upErr;
      await supabase.from("medical_reports").insert({
        privy_user_id: user.id,
        journey_id: jid,
        file_url: path,
        file_name: file.name,
        content_type: file.type,
        title: file.name,
      });
      setDocNote(`\uD83D\uDCCE “${file.name}” saved to your medical records.`);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `\uD83D\uDCCE Got it — I’ve saved **${file.name}** to your private medical records. You can view it anytime on your dashboard under Medical Documents.` },
      ]);
    } catch {
      setDocNote("Upload failed — make sure the medical-reports bucket exists (run 003_medical.sql).");
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  }
  const journeyIdRef = useRef<string | null>(null);
  const appliedRef = useRef<string>("");
  const ensuringRef = useRef<Promise<string | null> | null>(null);

  async function ensureJourney(): Promise<string | null> {
    if (journeyIdRef.current) return journeyIdRef.current;
    if (!authenticated || !user?.id) return null;
    if (ensuringRef.current) return ensuringRef.current;
    ensuringRef.current = (async () => {
      try {
        const supabase = createClient();
        const privyId = user.id;
        const email = user.email?.address ?? (user.google?.email as string | undefined) ?? null;
        const name =
          (user.google?.name as string | undefined) ?? email?.split("@")[0] ?? null;
        await supabase
          .from("patients")
          .upsert({ privy_user_id: privyId, name, email }, { onConflict: "privy_user_id" });
        // Reuse an existing unfinished journey if there is one.
        const { data: existing } = await supabase
          .from("journeys")
          .select("id")
          .eq("privy_user_id", privyId)
          .neq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(1);
        let id = existing?.[0]?.id as string | undefined;
        if (!id) {
          const { data: created } = await supabase
            .from("journeys")
            .insert({ privy_user_id: privyId, status: "intake" })
            .select("id")
            .single();
          id = created?.id as string | undefined;
        }
        journeyIdRef.current = id ?? null;
        return journeyIdRef.current;
      } catch {
        return null;
      } finally {
        ensuringRef.current = null;
      }
    })();
    return ensuringRef.current;
  }

  async function saveJourney(patch: JourneyPatch & { messages?: ChatMessage[] }) {
    if (!authenticated || !user?.id) return;
    const id = await ensureJourney();
    if (!id) return;
    try {
      const supabase = createClient();
      await supabase
        .from("journeys")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch {}
  }

  // When a Calendly booking completes, record the consultation on the journey.
  useEffect(() => {
    async function onMsg(e: MessageEvent) {
      const data = e.data as { event?: string } | null;
      if (!data || data.event !== "calendly.event_scheduled") return;
      setShowCalendly(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "\u2705 Your free video consultation is booked. You'll get the details by email, and it now shows on your dashboard.",
        },
      ]);
      if (!authenticated || !user?.id) return;
      try {
        const id = await ensureJourney();
        const supabase = createClient();
        await supabase.from("consultations").insert({
          journey_id: id,
          privy_user_id: user.id,
          doctor_name: "GlobalCare Specialist",
          reason: consultReasonRef.current,
          status: "scheduled",
        });
      } catch {}
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user?.id]);

  useEffect(() => {
    const h = () => checkPlan();
    window.addEventListener("focus", h);
    document.addEventListener("visibilitychange", h);
    return () => {
      window.removeEventListener("focus", h);
      document.removeEventListener("visibilitychange", h);
    };
  }, [checkPlan]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, flightResults]);

  // When a finished model message contains a flightsearch/hotelsearch block,
  // fetch the results once
  useEffect(() => {
    if (loading) return;
    messages.forEach((m, i) => {
      if (m.role !== "model") return;
      const { flightQuery, hotelQuery } = parseModelMessage(m.text);

      if (flightQuery && !flightResults[i]) {
        setFlightResults((prev) => ({ ...prev, [i]: "loading" }));
        fetch("/api/flights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(flightQuery),
        })
          .then((r) => r.json())
          .then((data) => {
            setFlightResults((prev) => ({
              ...prev,
              [i]: { flights: data.flights ?? [], source: data.source ?? "mock" },
            }));
          })
          .catch(() => {
            setFlightResults((prev) => ({ ...prev, [i]: { flights: [], source: "error" } }));
          });
      }

      if (hotelQuery && !hotelResults[i]) {
        setHotelResults((prev) => ({ ...prev, [i]: "loading" }));
        fetch("/api/hotels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hotelQuery),
        })
          .then((r) => r.json())
          .then((data) => {
            setHotelResults((prev) => ({
              ...prev,
              [i]: { hotels: data.hotels ?? [], source: data.source ?? "mock" },
            }));
          })
          .catch(() => {
            setHotelResults((prev) => ({ ...prev, [i]: { hotels: [], source: "error" } }));
          });
      }
    });
  }, [messages, loading, flightResults, hotelResults]);

  // Once the user starts chatting, make sure a journey row exists, and keep it
  // updated as the AI learns the condition / hospital / country / status / cost.
  useEffect(() => {
    if (!authenticated || !user?.id) return;
    if (loading) return; // only persist completed turns (not mid-stream)
    if (!messages.some((m) => m.role === "user")) return;

    let derived: JourneyPatch = {};
    let statusFloor = "intake";
    messages.forEach((m) => {
      if (m.role !== "model") return;
      const { options, flightQuery, hotelQuery, journeyPatch } = parseModelMessage(m.text);
      if (options) statusFloor = "recommendation";
      if (flightQuery || hotelQuery) statusFloor = "travel";
      if (journeyPatch) derived = { ...derived, ...journeyPatch };
    });

    const rank = ["intake", "recommendation", "travel", "payment", "confirmed"];
    const aiStatus = derived.status;
    const best =
      rank.indexOf(aiStatus ?? "") > rank.indexOf(statusFloor)
        ? (aiStatus as string)
        : statusFloor;
    const merged: JourneyPatch = { ...derived, status: best };

    const sig =
      JSON.stringify(merged) +
      "|msgs:" + messages.length + ":" + (messages[messages.length - 1]?.text.length ?? 0);
    if (sig === appliedRef.current) return;
    appliedRef.current = sig;
    void saveJourney({ ...merged, messages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading, authenticated, user?.id]);

  // On mount: resume an existing journey (and its saved chat) or start a new one,
  // based on ?journey=<id> / ?new=1 query params.
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (!authenticated || !user?.id) return;
    initRef.current = true;
    (async () => {
      try {
        const supabase = createClient();
        const params = new URLSearchParams(window.location.search);
        const journeyParam = params.get("journey");
        const isNew = params.get("new");
        const privyId = user.id;
        const email = user.email?.address ?? (user.google?.email as string | undefined) ?? null;
        const name = (user.google?.name as string | undefined) ?? email?.split("@")[0] ?? null;
        await supabase
          .from("patients")
          .upsert({ privy_user_id: privyId, name, email }, { onConflict: "privy_user_id" });

        const applyLoaded = (id?: string, msgs?: unknown) => {
          if (id) journeyIdRef.current = id;
          if (Array.isArray(msgs) && msgs.length) {
            setMessages(msgs as ChatMessage[]);
            appliedRef.current = "loaded"; // avoid an immediate redundant re-save
          }
        };

        if (journeyParam) {
          const { data } = await supabase
            .from("journeys").select("id,messages").eq("id", journeyParam).single();
          if (data) applyLoaded(data.id as string, (data as { messages?: unknown }).messages);
        } else if (isNew) {
          const { data } = await supabase
            .from("journeys").insert({ privy_user_id: privyId, status: "intake" })
            .select("id").single();
          if (data) journeyIdRef.current = data.id as string;
        } else {
          const { data } = await supabase
            .from("journeys").select("id,messages").eq("privy_user_id", privyId)
            .neq("status", "confirmed").order("created_at", { ascending: false }).limit(1);
          const j = data?.[0] as { id: string; messages?: unknown } | undefined;
          if (j) applyLoaded(j.id, j.messages);
        }
        await checkPlan();
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user?.id]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setTimeout(autosize, 0);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, deepThink }),
      });

      if (!res.ok || !res.body) {
        let msg = "Request failed";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      // Add an empty model message and fill it as chunks stream in
      setMessages((prev) => [...prev, { role: "model", text: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "model", text: acc };
          return next;
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            err instanceof Error && err.message !== "Request failed"
              ? `⚠️ ${err.message}`
              : "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#f6f7f9] text-zinc-900">
      {showCalendly && (
        <div
          data-gc-native
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCalendly(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
              <p className="text-sm font-semibold text-zinc-900">Book your free video consultation</p>
              <button
                onClick={() => setShowCalendly(false)}
                className="rounded-full px-3 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto">
              <CalendlyEmbed />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex items-center gap-2 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gll.png" alt="GlobalCare.ai" className="h-7 w-auto" />
        </div>
        <div className="px-3">
          <button onClick={() => router.push("/chatbox?new=1")} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600">
            <span className="text-base leading-none">+</span> New chat
          </button>
        </div>
        <nav className="mt-3 flex flex-col gap-0.5 px-3 text-sm">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-zinc-600 transition hover:bg-zinc-100">🏠 Dashboard</button>
          <button onClick={() => { consultReasonRef.current = "Free consultation"; setShowCalendly(true); }} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-zinc-600 transition hover:bg-zinc-100">📅 Book consultation</button>
        </nav>
        <div className="mt-4 flex-1 overflow-y-auto px-3">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Your journeys</p>
          <div className="flex flex-col gap-0.5">
            {sideJourneys.length === 0 ? (
              <p className="px-2 py-2 text-xs text-zinc-400">No journeys yet</p>
            ) : (
              sideJourneys.map((j) => (
                <div key={j.id} className="group relative flex items-center">
                  <Link href={`/chatbox?journey=${j.id}`} className="flex-1 truncate rounded-lg px-2 py-2 pr-9 text-sm text-zinc-600 transition hover:bg-zinc-100">
                    {j.condition || j.treatment || "New medical journey"}
                  </Link>
                  <button
                    onClick={() => deleteSideJourney(j.id)}
                    title="Delete chat"
                    className="absolute right-1 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow transition hover:bg-rose-600 group-hover:flex"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="border-t border-zinc-200 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">{acctInitial}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-800">{acctName}</p>
              <p className="truncate text-xs text-zinc-400">{acctEmail || "Patient"}</p>
            </div>
            <button onClick={logout} title="Log out" className="rounded-lg px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-500">⎋</button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-800">GlobalCare AI</span>
          <span className="hidden text-xs text-zinc-400 sm:inline">medical travel assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { consultReasonRef.current = "Free consultation"; setShowCalendly(true); }} className="hidden rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-emerald-300 hover:text-emerald-600 sm:inline">Book consultation</button>
          <button onClick={() => router.push("/dashboard")} className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-blue-300 hover:text-blue-600">Dashboard</button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {!messages.some((m) => m.role === "user") ? (
            <div className="flex flex-col items-center gap-6 py-12 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={AI_AVATAR} alt="GlobalCare AI" className="h-14 w-14 rounded-2xl object-cover shadow-sm" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Let’s start your medical journey</h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-zinc-500">Tell me your condition and I’ll find the best hospitals, honest cost comparisons, travel, and a free doctor consultation.</p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-3">
                {([
                  { t: "Explore treatment", s: "Describe your condition and see options.", p: "I'd like to explore treatment options for my condition" },
                  { t: "Compare prices", s: "Costs across top destinations.", p: "Compare prices for my treatment across countries" },
                  { t: "Free consultation", s: "Talk to a specialist at no cost.", calendly: true },
                ] as { t: string; s: string; p?: string; calendly?: boolean }[]).map((card) => (
                  <button
                    key={card.t}
                    onClick={() => {
                      if (card.calendly) { consultReasonRef.current = "Free consultation"; setShowCalendly(true); }
                      else if (card.p) sendMessage(card.p);
                    }}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold text-zinc-900">{card.t}</p>
                    <p className="mt-1 text-xs text-zinc-500">{card.s}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
          <>
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="flex items-end justify-end gap-2.5">
                  <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-white shadow-sm">
                    {m.text}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={USER_AVATAR}
                    alt="You"
                    className="h-8 w-8 shrink-0 rounded-full border border-blue-100 object-cover"
                  />
                </div>
              );
            }

            const { before, options, flightQuery, hotelQuery, after, streamingBlock, consultation } =
              parseModelMessage(m.text);
            const flightState = flightQuery ? flightResults[i] : undefined;
            const hotelState = hotelQuery ? hotelResults[i] : undefined;

            return (
              <div key={i} className="flex w-full items-start gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={AI_AVATAR}
                  alt="GlobalCare AI"
                  className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-blue-100 bg-white object-cover"
                />
                <div className="flex w-full flex-col gap-3">
                {(before || !m.text) && (
                  <div className="max-w-[85%] self-start rounded-2xl rounded-tl-md border border-blue-100 bg-white px-4 py-2.5 text-zinc-800 shadow-sm">
                    {m.text ? (
                      <Markdown text={before} />
                    ) : (
                      <span className="inline-flex gap-1 text-blue-400">
                        <span className="animate-bounce">·</span>
                        <span className="animate-bounce [animation-delay:150ms]">·</span>
                        <span className="animate-bounce [animation-delay:300ms]">·</span>
                      </span>
                    )}
                  </div>
                )}
                {streamingBlock && (
                  <p className="pl-1 text-xs text-zinc-400 animate-pulse">
                    Preparing your options…
                  </p>
                )}
                {options && (
                  <DestinationCards
                    options={options}
                    onSelect={(country) =>
                      sendMessage(`Let's go with ${country}`)
                    }
                    disabled={loading}
                  />
                )}
                {consultation && (
                  <div className="max-w-[85%] self-start rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                    <p className="text-sm font-semibold text-emerald-900">🩺 Free video consultation available</p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      {consultation.reason ? consultation.reason + " — " : ""}Talk to a specialist at no cost. Pick a time that suits you.
                    </p>
                    <button
                      onClick={() => {
                        consultReasonRef.current = consultation.reason ?? "Free consultation";
                        setShowCalendly(true);
                      }}
                      className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                    >
                      Book Free Consultation →
                    </button>
                  </div>
                )}
                {flightQuery && flightState === "loading" && (
                  <p className="pl-1 text-xs text-zinc-400 animate-pulse">
                    Searching live flights…
                  </p>
                )}
                {flightQuery &&
                  flightState &&
                  flightState !== "loading" &&
                  (flightState.flights.length ? (
                    <FlightCards
                      flights={flightState.flights}
                      source={flightState.source}
                      onSelect={(f) =>
                        sendMessage(
                          `I'll take the ${f.airline} flight for $${Math.round(
                            Number(f.price)
                          )} round-trip (${f.outbound.from} → ${f.outbound.to}, departing ${fmtDate(
                            f.outbound.departAt
                          )}${f.inbound ? `, returning ${fmtDate(f.inbound.departAt)}` : ""})`
                        )
                      }
                      disabled={loading}
                    />
                  ) : (
                    <p className="pl-1 text-xs text-zinc-400">
                      No flights found for those dates — tell me different dates.
                    </p>
                  ))}
                {hotelQuery && hotelState === "loading" && (
                  <p className="pl-1 text-xs text-zinc-400 animate-pulse">
                    Searching hotels near the clinic…
                  </p>
                )}
                {hotelQuery &&
                  hotelState &&
                  hotelState !== "loading" &&
                  (hotelState.hotels.length ? (
                    <HotelCards
                      hotels={hotelState.hotels}
                      source={hotelState.source}
                      onSelect={(h) =>
                        sendMessage(
                          `I'll stay at ${h.name} (${h.pricePerNight}/night${
                            h.totalPrice ? `, ${h.totalPrice} total` : ""
                          })`
                        )
                      }
                      disabled={loading}
                    />
                  ) : (
                    <p className="pl-1 text-xs text-zinc-400">
                      No hotels found — tell me a different area or dates.
                    </p>
                  ))}
                {after && (
                  <div className="max-w-[85%] self-start rounded-2xl rounded-tl-md border border-blue-100 bg-white px-4 py-2.5 text-zinc-800 shadow-sm">
                    <Markdown text={after} />
                  </div>
                )}
                </div>
              </div>
            );
          })}
          </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-5 pt-2">
        <div className="mx-auto max-w-3xl">
          {planReady && (
            <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-emerald-900">✅ Your treatment plan is ready.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/dashboard#treatment-plan")}
                  className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Pay
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-full bg-rose-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  End chat
                </button>
              </div>
            </div>
          )}

          {/* Quick action chips */}
          {messages.some((m) => m.role === "user") && (
          <div className="mb-3 flex flex-nowrap items-center gap-2 overflow-x-auto">
            {([
              { icon: "📄", label: "Analyze medical report", prompt: "I'd like you to analyze my medical report" },
              { icon: "💱", label: "Compare prices", prompt: "Compare prices for my treatment across countries" },
              { icon: "🩺", label: "Second opinion", prompt: "", calendly: true },
              { icon: "🛂", label: "Visa requirements", prompt: "What are the visa requirements for my medical trip?" },
            ] as { icon: string; label: string; prompt: string; calendly?: boolean }[]).map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  if (chip.calendly) {
                    consultReasonRef.current = "Second opinion on my diagnosis";
                    setShowCalendly(true);
                  } else {
                    sendMessage(chip.prompt);
                  }
                }}
                disabled={loading}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-100 bg-white px-4 py-2 text-[15px] font-medium text-zinc-700 shadow-sm transition-all hover:border-blue-300 hover:shadow disabled:opacity-40"
              >
                <span className="text-xs">{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>
          )}

          {docNote && (
            <p className="mb-2 pl-2 text-xs text-blue-600">{docNote}</p>
          )}

          {/* Input box */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm transition focus-within:border-blue-300 focus-within:shadow-md">
            <div className="px-4 pb-3 pt-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autosize();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask me anything…"
                className="max-h-40 w-full resize-none bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDoc}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 disabled:opacity-50"
                  >
                    📎 {uploadingDoc ? "Uploading…" : "Attach"}
                  </button>
                  <input
                    ref={docInputRef}
                    type="file"
                    className="hidden"
                    onChange={uploadDoc}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  />
                  <button
                    onClick={() => setDeepThink((v) => !v)}
                    className={
                      deepThink
                        ? "flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 transition-colors"
                        : "flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300"
                    }
                  >
                    💡 Deep Think
                  </button>
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                >
                  ➤ Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
