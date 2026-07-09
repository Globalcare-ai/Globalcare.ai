// Hotel search via SerpAPI (Google Hotels data). Falls back to mock data
// if SERPAPI_KEY is missing or the request fails.

type HotelQuery = {
  query: string; // e.g. "hotels near Cosmedica Clinic Istanbul"
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults?: number;
};

export type HotelOffer = {
  id: string;
  name: string;
  rating: number | null;
  reviews: number | null;
  hotelClass: string | null;
  pricePerNight: string;
  totalPrice: string | null;
  image: string | null;
};

function mockHotels(): HotelOffer[] {
  return [
    {
      id: "h1",
      name: "Wyndham Grand Istanbul Levent",
      rating: 4.5,
      reviews: 3821,
      hotelClass: "5-star hotel",
      pricePerNight: "$95",
      totalPrice: "$855",
      image: null,
    },
    {
      id: "h2",
      name: "Mercure Istanbul Bomonti",
      rating: 4.3,
      reviews: 2510,
      hotelClass: "4-star hotel",
      pricePerNight: "$68",
      totalPrice: "$612",
      image: null,
    },
    {
      id: "h3",
      name: "Radisson Blu Sisli",
      rating: 4.4,
      reviews: 1968,
      hotelClass: "5-star hotel",
      pricePerNight: "$82",
      totalPrice: "$738",
      image: null,
    },
  ];
}

export async function POST(req: Request) {
  try {
    const q: HotelQuery = await req.json();
    if (!q.query || !q.checkIn || !q.checkOut) {
      return Response.json({ error: "Missing hotel parameters" }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return Response.json({ hotels: mockHotels(), source: "mock" });
    }

    const params = new URLSearchParams({
      engine: "google_hotels",
      q: q.query,
      check_in_date: q.checkIn,
      check_out_date: q.checkOut,
      adults: String(q.adults ?? 1),
      currency: "USD",
      api_key: apiKey,
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) {
      console.error("SerpAPI hotels failed:", res.status, await res.text());
      return Response.json({ hotels: mockHotels(), source: "mock-fallback" });
    }

    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hotels: HotelOffer[] = (json.properties ?? [])
      .slice(0, 3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any, idx: number) => ({
        id: `h${idx}`,
        name: p.name ?? "Hotel",
        rating: p.overall_rating ?? null,
        reviews: p.reviews ?? null,
        hotelClass: p.hotel_class ?? null,
        pricePerNight: p.rate_per_night?.lowest ?? "—",
        totalPrice: p.total_rate?.lowest ?? null,
        image: p.images?.[0]?.thumbnail ?? null,
      }));

    if (!hotels.length) {
      return Response.json({ hotels: mockHotels(), source: "mock-fallback" });
    }

    return Response.json({ hotels, source: "live" });
  } catch (err) {
    console.error("Hotels API error:", err);
    return Response.json({ error: "Hotel search failed" }, { status: 500 });
  }
}
