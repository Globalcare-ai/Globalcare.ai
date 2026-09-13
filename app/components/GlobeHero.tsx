"use client";

import { Globe } from "@/components/ui/cobe-globe";

// [lat, lng] — cobe is lat-first
const MARKERS = [
  { id: "nyc", location: [40.7128, -74.006] as [number, number], label: "New York" },
  { id: "delhi", location: [28.6139, 77.209] as [number, number], label: "New Delhi" },
  { id: "london", location: [51.5072, -0.1276] as [number, number], label: "London" },
  { id: "bangkok", location: [13.7563, 100.5018] as [number, number], label: "Bangkok" },
  { id: "toronto", location: [43.6532, -79.3832] as [number, number], label: "Toronto" },
  { id: "mexico", location: [19.4326, -99.1332] as [number, number], label: "Mexico City" },
  { id: "istanbul", location: [41.0082, 28.9784] as [number, number], label: "Istanbul" },
  { id: "singapore", location: [1.3521, 103.8198] as [number, number], label: "Singapore" },
  { id: "sydney", location: [-33.8688, 151.2093] as [number, number], label: "Sydney" },
  { id: "dubai", location: [25.2048, 55.2708] as [number, number], label: "Dubai" },
];

const ARCS = [
  {
    id: "nyc-delhi",
    from: [40.7128, -74.006] as [number, number],
    to: [28.6139, 77.209] as [number, number],
    label: "NYC → New Delhi",
  },
  {
    id: "london-bangkok",
    from: [51.5072, -0.1276] as [number, number],
    to: [13.7563, 100.5018] as [number, number],
    label: "London → Bangkok",
  },
  {
    id: "toronto-mexico",
    from: [43.6532, -79.3832] as [number, number],
    to: [19.4326, -99.1332] as [number, number],
    label: "Toronto → Mexico City",
  },
  {
    id: "istanbul-dubai",
    from: [41.0082, 28.9784] as [number, number],
    to: [25.2048, 55.2708] as [number, number],
    label: "Istanbul → Dubai",
  },
  {
    id: "singapore-sydney",
    from: [1.3521, 103.8198] as [number, number],
    to: [-33.8688, 151.2093] as [number, number],
    label: "Singapore → Sydney",
  },
  {
    id: "nyc-london",
    from: [40.7128, -74.006] as [number, number],
    to: [51.5072, -0.1276] as [number, number],
    label: "NYC → London",
  },
];

export default function GlobeHero() {
  return (
    <div className="relative z-[5] mx-auto mt-6 w-[92vw] max-w-[820px] sm:-mt-14">
      {/* light-blue glow — sized/centered to hug the sphere (sphere ≈ 85% of the canvas) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[100%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.35)_0%,rgba(147,197,253,0.22)_38%,rgba(191,219,254,0.12)_52%,transparent_66%)] blur-2xl" />
      {/* soft horizon accent at the top edge of the sphere */}
      <div className="pointer-events-none absolute left-1/2 top-[9%] h-20 w-[70%] -translate-x-1/2 rounded-[100%] bg-sky-400/25 blur-3xl" />
      <Globe
        className="w-full"
        markers={MARKERS}
        arcs={ARCS}
        arcIcon="/plane.glb"
        markerColor={[0.15, 0.39, 0.92]}
        baseColor={[0.91, 0.91, 0.91]} // #e8e8e8 so it reads against the white page
        arcColor={[0.15, 0.39, 0.92]}
        glowColor={[0.82, 0.85, 0.9]}
        dark={0}
        mapBrightness={10}
        markerSize={0.04}
        markerElevation={0.01}
      />
    </div>
  );
}
