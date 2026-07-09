import Image from "next/image";
import Link from "next/link";
import GlobeHero from "@/app/components/GlobeHero";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#f6f9ff] pb-10">
      {/* soft fade at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-32 bg-gradient-to-t from-white to-transparent" />

      {/* nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Image
          src="/gll.png"
          alt="GlobalCare.ai"
          width={1955}
          height={578}
          priority
          className="h-9 w-auto sm:h-10"
        />
        <Link
          href="/chatbox"
          className="rounded-full border border-slate-200 bg-white/70 px-5 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-300 hover:text-blue-700"
        >
          Open the AI →
        </Link>
      </header>

      {/* headline */}
      <div className="relative z-0 mt-[0.5vh] px-6 text-center">
        <p className="mx-auto mb-3 inline-block rounded-full border border-blue-200/80 bg-white/70 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 shadow-[0_0_16px_rgba(59,130,246,0.35)] backdrop-blur">
          AI medical tourism · escrow secured
        </p>
        <h1 className="text-[clamp(3.2rem,8.5vw,7.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-slate-950">
          Healthcare
          <br />
          without borders.
        </h1>
        <div className="mt-5">
          <Link
            href="/chatbox"
            className="group inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            Start your journey
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>

      {/* globe */}
      <GlobeHero />

      {/* corner meta */}
      <div className="pointer-events-none absolute bottom-6 left-8 z-10 hidden font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 sm:block">
        60–90% lower cost · same quality
      </div>
      <div className="pointer-events-none absolute bottom-6 right-8 z-10 hidden font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 sm:block">
        Flights · hotels · treatment — one plan
      </div>
    </section>
  );
}
