"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chips = [
  { label: "Flights",          bg: "#4A6FA5", rotate: "-12deg", float: "chip-float-a",
    style: { top: "calc(50% - 240px)", left:  "calc(50% - 300px)" } },
  { label: "Treatments",       bg: "#6B7F5E", rotate: "10deg",  float: "chip-float-b",
    style: { top: "calc(50% - 250px)", right: "calc(50% - 280px)" } },
  { label: "Hotels",           bg: "#8C6B52", rotate: "-14deg", float: "chip-float-c",
    style: { top: "calc(50% - 40px)",  left:  "calc(50% - 500px)" } },
  { label: "World Class Care", bg: "#B07070", rotate: "8deg",   float: "chip-float-a",
    style: { top: "calc(50% - 30px)",  right: "calc(50% - 480px)" } },
  { label: "Lower Cost",       bg: "#5B7FA6", rotate: "11deg",  float: "chip-float-d",
    style: { top: "calc(50% + 210px)", left:  "calc(50% - 320px)" } },
  { label: "Escrow Protected", bg: "#7A6B8A", rotate: "-9deg",  float: "chip-float-b",
    style: { top: "calc(50% + 220px)", right: "calc(50% - 300px)" } },
];

export default function SecondaryHeroSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chipRefs   = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const els     = chipRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!wrapper || els.length === 0) return;

    // hide all chips to start
    gsap.set(els, { opacity: 0, y: 40, scale: 0.85 });

    // timeline: each chip is one step
    const tl = gsap.timeline();
    els.forEach((el) => {
      tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" });
    });

    // ScrollTrigger on the wrapper — NO pin (CSS sticky handles that)
    // scrub maps scroll progress through the wrapper to the timeline
    const st = ScrollTrigger.create({
      trigger:   wrapper,
      start:     "top top",
      end:       "bottom bottom",
      scrub:     0.6,
      animation: tl,
    });

    return () => {
      st.kill();
      tl.kill();
    };
  }, []);

  return (
    // Wrapper: tall = sticky stage height (100vh) + scroll room for all chips
    <div ref={wrapperRef} style={{ height: `calc(100vh + ${chips.length * 130}px)` }}>

      {/* CSS sticky — stays in view while wrapper scrolls, zero DOM side effects */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-white flex flex-col items-center justify-center text-center"
      >
        {/* dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize:  "28px 28px",
          }}
        />

        {/* chips — GSAP animates opacity/y/scale */}
        {chips.map((chip, i) => (
          <div
            key={chip.label}
            ref={(el) => { chipRefs.current[i] = el; }}
            className="absolute hidden lg:block"
            style={{ ...chip.style, transform: `rotate(${chip.rotate})` }}
          >
            <span
              className={`inline-flex items-center px-5 py-2.5 rounded-full select-none whitespace-nowrap ${chip.float}`}
              style={{
                backgroundColor: chip.bg,
                color:           "#fff",
                fontSize:        "14px",
                fontWeight:      500,
                letterSpacing:   "0.01em",
              }}
            >
              {chip.label}
            </span>
          </div>
        ))}

        {/* center content */}
        <div className="relative z-10 max-w-2xl">
          <h2
            style={{
              fontFamily:    "var(--font-clash)",
              fontWeight:    500,
              fontSize:      "56px",
              lineHeight:    "64px",
              color:         "rgb(27, 27, 27)",
              letterSpacing: "-0.02em",
            }}
          >
            Your treatment shouldn&apos;t cost 10&times; more
            <br className="hidden sm:block" /> because of where you live.
          </h2>

          <p
            className="mt-5"
            style={{
              fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize:   "18px",
              lineHeight: "28px",
              color:      "rgb(94, 97, 110)",
            }}
          >
            Get a free, honest estimate in one conversation.
          </p>

          <Link
            href="/chatbox"
            className="mt-8 inline-block bg-slate-950 text-white text-sm font-medium tracking-wide px-8 py-4 rounded-full hover:bg-slate-800 transition-colors"
          >
            Talk to the AI — it&apos;s free
          </Link>
        </div>
      </div>
    </div>
  );
}
