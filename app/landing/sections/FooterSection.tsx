import Image from "next/image";
import Link from "next/link";

const TREATMENTS = [
  "Hair transplant",
  "Dental & veneers",
  "Orthopedic surgery",
  "Cardiac surgery",
  "Oncology care",
];

const DESTINATIONS = ["Istanbul, Turkey", "Bangkok, Thailand", "Mumbai, India", "Dubai, UAE", "Kraków, Poland"];

export default function FooterSection() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand */}
          <div>
            <Image src="/gll.png" alt="GlobalCare.ai" width={1955} height={578} className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Healthcare without borders. One AI plans the treatment, the hospital, the flights and the
              hotel — and your money stays in escrow until each step is actually delivered.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Escrow secured
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-600">
                Sepolia testnet
              </span>
            </div>
          </div>

          {/* platform */}
          <FooterCol title="Platform">
            <FooterLink href="/chatbox">Start a journey</FooterLink>
            <FooterLink href="/dashboard">Patient dashboard</FooterLink>
            <FooterLink href="/chatbox">Second opinion</FooterLink>
            <FooterLink href="/chatbox">Video consultation</FooterLink>
          </FooterCol>

          {/* treatments */}
          <FooterCol title="Treatments">
            {TREATMENTS.map((t) => (
              <FooterLink key={t} href="/chatbox">
                {t}
              </FooterLink>
            ))}
          </FooterCol>

          {/* destinations */}
          <FooterCol title="Destinations">
            {DESTINATIONS.map((d) => (
              <span key={d} className="block py-1 text-sm text-slate-500">
                {d}
              </span>
            ))}
          </FooterCol>
        </div>

        {/* how the money moves — the one thing worth repeating */}
        <div className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 text-xs text-slate-500">
          <span className="font-medium text-slate-700">How your payment moves:</span>
          <Step>Your wallet</Step>
          <Arrow />
          <Step>GlobalCare escrow</Step>
          <Arrow />
          <Step>Released per milestone</Step>
          <span className="text-slate-400">· full refund before fulfilment</span>
        </div>

        {/* built-with */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Like this UI? It&apos;s built with Zepa UI —{" "}
          <a
            href="https://zepa.design"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-600 underline decoration-blue-200 underline-offset-4 transition hover:decoration-blue-500"
          >
            try Zepa at zepa.design
          </a>
        </p>

        {/* bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 GlobalCare.ai — built for ETHGlobal Online</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Plane model:{" "}
              <a
                href="https://sketchfab.com/vendol21"
                target="_blank"
                rel="nofollow noreferrer"
                className="text-slate-500 transition hover:text-blue-600"
              >
                chroma3d on Sketchfab
              </a>
            </span>
            <span className="text-slate-300">·</span>
            <span>Demo only — not medical advice</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block py-1 text-sm text-slate-500 transition hover:text-blue-600">
      {children}
    </Link>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600">{children}</span>;
}

function Arrow() {
  return <span className="text-slate-300">→</span>;
}
