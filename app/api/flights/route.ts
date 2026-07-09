// Flight search via SerpAPI (Google Flights data). Falls back to mock data
// if SERPAPI_KEY is missing or the request fails, so the demo never breaks.

type FlightQuery = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
};

export type FlightOffer = {
  id: string;
  airline: string;
  price: string;
  currency: string;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
};

type FlightLeg = {
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  duration: string;
  stops: number;
};

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function mockFlights(q: FlightQuery): FlightOffer[] {
  const d = q.departureDate;
  const r = q.returnDate ?? q.departureDate;
  const mk = (
    id: string,
    airline: string,
    price: string,
    dep: string,
    arr: string,
    dur: string,
    stops: number
  ): FlightOffer => ({
    id,
    airline,
    price,
    currency: "USD",
    outbound: {
      from: q.origin,
      to: q.destination,
      departAt: `${d}T${dep}:00`,
      arriveAt: `${d}T${arr}:00`,
      duration: dur,
      stops,
    },
    inbound: q.returnDate
      ? {
          from: q.destination,
          to: q.origin,
          departAt: `${r}T14:20:00`,
          arriveAt: `${r}T19:45:00`,
          duration: dur,
          stops,
        }
      : null,
  });
  return [
    mk("m1", "Turkish Airlines", "874", "19:05", "12:10", "10h 5m", 0),
    mk("m2", "Lufthansa", "756", "16:40", "11:30", "13h 50m", 1),
    mk("m3", "Qatar Airways", "913", "21:30", "17:20", "14h 50m", 1),
  ];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseSerpFlights(json: any, q: FlightQuery): FlightOffer[] {
  const raw = [...(json.best_flights ?? []), ...(json.other_flights ?? [])];
  return raw.slice(0, 4).map((offer: any, idx: number) => {
    const segs = offer.flights ?? [];
    const first = segs[0];
    const last = segs[segs.length - 1];
    return {
      id: `s${idx}`,
      airline: first?.airline ?? "Multiple airlines",
      price: String(offer.price ?? "—"),
      currency: "USD",
      outbound: {
        from: first?.departure_airport?.id ?? q.origin,
        to: last?.arrival_airport?.id ?? q.destination,
        departAt: (first?.departure_airport?.time ?? "").replace(" ", "T"),
        arriveAt: (last?.arrival_airport?.time ?? "").replace(" ", "T"),
        duration: fmtDuration(offer.total_duration ?? 0),
        stops: Math.max(segs.length - 1, 0),
      },
      // Google Flights returns the return leg via a second token-based request;
      // for the MVP the shown price is already the round-trip total.
      inbound: null,
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function POST(req: Request) {
  try {
    const q: FlightQuery = await req.json();
    if (!q.origin || !q.destination || !q.departureDate) {
      return Response.json({ error: "Missing flight parameters" }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return Response.json({ flights: mockFlights(q), source: "mock" });
    }

    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: q.origin,
      arrival_id: q.destination,
      outbound_date: q.departureDate,
      currency: "USD",
      adults: String(q.adults ?? 1),
      api_key: apiKey,
      type: q.returnDate ? "1" : "2", // 1 = round trip, 2 = one way
    });
    if (q.returnDate) params.set("return_date", q.returnDate);

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) {
      console.error("SerpAPI failed:", res.status, await res.text());
      return Response.json({ flights: mockFlights(q), source: "mock-fallback" });
    }

    const json = await res.json();
    const flights = parseSerpFlights(json, q);

    if (!flights.length) {
      return Response.json({ flights: mockFlights(q), source: "mock-fallback" });
    }

    return Response.json({ flights, source: "live" });
  } catch (err) {
    console.error("Flights API error:", err);
    return Response.json({ error: "Flight search failed" }, { status: 500 });
  }
}
