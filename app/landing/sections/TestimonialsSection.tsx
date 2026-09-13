"use client";

import { useEffect, useRef } from "react";

const TESTIMONIALS = [
  {
    quote: "I saved over $18,000 on my hair transplant in Turkey. Same surgeon credentials, half the recovery time.",
    name: "Marcus T.",
    detail: "Hair Transplant \u00b7 Istanbul",
    img: "/x2.webp",
    ratio: "1",
    zig: -5,
    rot: -4,
  },
  {
    quote: "The AI planned my entire trip \u2014 treatment, hotel, flights \u2014 in one conversation. I couldn't believe it.",
    name: "Priya S.",
    detail: "Spinal Surgery \u00b7 Bangkok",
    img: "/x1.avif",
    ratio: "3 / 4",
    zig: 6,
    rot: 3,
  },
  {
    quote: "World-class oncology care in India at 12% of what the US quoted me. GlobalCare made it happen.",
    name: "Linda K.",
    detail: "Cancer Treatment \u00b7 Mumbai",
    img: "/x3.avif",
    ratio: "1",
    zig: -4,
    rot: -2,
  },
  {
    quote: "Escrow protection gave me peace of mind. My money was safe until every step was actually confirmed.",
    name: "Daniel K.",
    detail: "FUE Hair Restoration \u00b7 Istanbul",
    img: "/x4.jpg",
    ratio: "3 / 2",
    zig: 7,
    rot: 4,
  },
  {
    quote: "I was skeptical at first. Now I tell everyone: your zip code shouldn't determine your healthcare.",
    name: "Ahmed F.",
    detail: "Cardiac Surgery \u00b7 Dubai",
    img: "/x5.jpg",
    ratio: "16 / 9",
    zig: -5,
    rot: -3,
  },
];

const PITCH   = 37;     // vw between cards
const START_X = 110;    // train at p=0 — all cards off right, text visible
const END_X   = -89;    // train at p=1 — cards slide in and cover

export default function TestimonialsSection() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf: number;
    let cur = 0;
    let sectionTop = 0;

    const root = document.getElementById("testimonials-root");
    if (root) sectionTop = root.getBoundingClientRect().top + window.scrollY;

    const tick = () => {
      const vh       = window.innerHeight;
      const scrolled = Math.max(0, window.scrollY - sectionTop);
      const target   = scrolled;

      cur += (target - cur) * 0.08;
      if (Math.abs(target - cur) < 0.05) cur = target;

      const p      = Math.min(1, Math.max(0, cur / (vh * 4)));
      const trainX = START_X + (END_X - START_X) * p;

      TESTIMONIALS.forEach((c, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        const x   = i * PITCH + trainX;
        const rot = c.rot + (x - 35) * 0.045;
        const bob = Math.sin((x / 30) * Math.PI) * 1.4;
        el.style.transform = `translate3d(${x}vw, calc(${c.zig + bob}vh), 0) rotate(${rot}deg)`;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div id="testimonials-root" className="gc-stories relative">
      {/* The card train is a desktop scroll animation: its cards are sized in vw,
          which collapses to ~6px text on a phone. Phones get the stacked list
          below instead — the train and its 500vh of scroll are lg-only. */}
      <style>{`
        .gc-stories { height: auto; }
        @media (min-width: 1024px) { .gc-stories { height: 500vh; } }
      `}</style>

      <div className="sticky top-0 hidden h-screen overflow-hidden lg:block"
        style={{ background: "#f8f6f1" }}
      >
        {/* warm glows */}
        <div className="absolute rounded-full pointer-events-none"
          style={{
            width: "60vw", height: "44vw", left: "-12vw", top: "-16vw",
            background: "radial-gradient(closest-side, rgba(37,99,235,0.12), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div className="absolute rounded-full pointer-events-none"
          style={{
            width: "70vw", height: "56vw", right: "-16vw", top: "4vw",
            background: "radial-gradient(closest-side, rgba(37,99,235,0.08), transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* label */}
        <p className="absolute top-10 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
          Patient Stories
        </p>

        {/* reveal text behind the cards */}
        <h2
          className="absolute left-1/2 top-1/2 z-[1] m-0 whitespace-nowrap text-blue-600 font-semibold"
          style={{
            transform: "translate(-50%, -56%)",
            fontFamily: "var(--font-clash)",
            fontSize: "clamp(40px, 5.8vw, 110px)",
            letterSpacing: "-0.035em",
            lineHeight: 1,
          }}
        >
          Real People. Real Savings.
        </h2>

        {/* card train */}
        {TESTIMONIALS.map((c, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="absolute left-0 z-[5] flex flex-col"
            style={{
              top: "50%",
              marginTop: "-19vw",
              width: "28vw",
              padding: "1.8vw",
              rowGap: "1.2vw",
              background: "rgba(255,255,255,0.80)",
              borderRadius: "2vw",
              boxShadow: "0 2vw 5vw rgba(0,0,0,0.10)",
              backdropFilter: "blur(8px)",
              willChange: "transform",
            }}
          >
            {/* quote */}
            <p
              className="m-0 text-slate-800"
              style={{
                fontWeight: 500,
                fontSize: "1.55vw",
                lineHeight: "130%",
                letterSpacing: "-0.03em",
              }}
            >
              &ldquo;{c.quote}&rdquo;
            </p>

            {/* photo */}
            <img
              src={c.img}
              alt={c.name}
              draggable={false}
              className="w-full block object-cover"
              style={{ aspectRatio: c.ratio, borderRadius: "1.4vw" }}
            />

            {/* name + detail */}
            <div>
              <p className="m-0 text-slate-900 font-semibold" style={{ fontSize: "1.1vw" }}>
                {c.name}
              </p>
              <p className="m-0 text-slate-400" style={{ fontSize: "0.95vw" }}>
                {c.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ---- phones & tablets: a plain, readable stack ---- */}
      <div className="px-5 py-16 lg:hidden" style={{ background: "#f8f6f1" }}>
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
          Patient Stories
        </p>
        <h2
          className="mt-3 text-center font-semibold text-blue-600"
          style={{ fontFamily: "var(--font-clash)", fontSize: "clamp(28px, 8vw, 44px)", lineHeight: 1.05, letterSpacing: "-0.035em" }}
        >
          Real People. Real Savings.
        </h2>

        <div className="mx-auto mt-8 flex max-w-md flex-col gap-5">
          {TESTIMONIALS.map((c) => (
            <figure key={c.name} className="m-0 overflow-hidden rounded-3xl bg-white/80 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur">
              <img
                src={c.img}
                alt={c.name}
                draggable={false}
                className="block w-full object-cover"
                style={{ aspectRatio: c.ratio }}
              />
              <figcaption className="p-5">
                <p className="m-0 text-[15px] font-medium leading-snug tracking-tight text-slate-800">
                  &ldquo;{c.quote}&rdquo;
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-400">{c.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
