"use client";

import { useEffect, useRef, useState } from "react";
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
} {
  const empty = {
    options: null,
    flightQuery: null,
    hotelQuery: null,
  };
  const kinds = ["destinations", "flightsearch", "hotelsearch"] as const;
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
  const [attachNote, setAttachNote] = useState(false);
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
    <div className="flex h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-blue-100 bg-white/80 px-6 py-4 backdrop-blur">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AI_AVATAR}
          alt="Globalcare.ai"
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            Globalcare<span className="text-blue-600">.ai</span>
          </h1>
          <p className="text-sm text-zinc-500">Your medical travel assistant</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
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

            const { before, options, flightQuery, hotelQuery, after, streamingBlock } =
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
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-5 pt-2">
        <div className="mx-auto max-w-3xl">
          {/* Quick action chips */}
          <div className="mb-3 flex flex-nowrap items-center gap-2 overflow-x-auto">
            {[
              { icon: "📄", label: "Analyze medical report", prompt: "I'd like you to analyze my medical report" },
              { icon: "💱", label: "Compare prices", prompt: "Compare prices for my treatment across countries" },
              { icon: "🩺", label: "Second opinion", prompt: "I'd like a second opinion on my diagnosis" },
              { icon: "🛂", label: "Visa requirements", prompt: "What are the visa requirements for my medical trip?" },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => sendMessage(chip.prompt)}
                disabled={loading}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-100 bg-white px-4 py-2 text-[15px] font-medium text-zinc-700 shadow-sm transition-all hover:border-blue-300 hover:shadow disabled:opacity-40"
              >
                <span className="text-xs">{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>

          {attachNote && (
            <p className="mb-2 pl-2 text-xs text-blue-500">
              📎 Document upload is coming in the next update
            </p>
          )}

          {/* Glow-border input */}
          <div className="rounded-3xl bg-gradient-to-r from-amber-200 via-pink-200 to-blue-300 p-[2px] shadow-[0_4px_24px_rgba(147,197,253,0.45)]">
            <div className="rounded-[22px] bg-white px-4 pb-3 pt-2">
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
                    onClick={() => {
                      setAttachNote(true);
                      setTimeout(() => setAttachNote(false), 3000);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300"
                  >
                    🔗 Attach
                  </button>
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
  );
}
