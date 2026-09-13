import Image from "next/image";

/**
 * Each step renders either a still or a looping clip. Modelling this as a
 * discriminated union is what makes the `type === "video"` branch below valid:
 * with `type: "image" as const` on every entry TypeScript narrowed the field to
 * the single literal "image", so the video branch was provably dead code.
 */
type StepMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; alt?: string };

type Step = {
  number: string;
  title: string;
  description: string;
  media: StepMedia;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Tell our AI what you need",
    description:
      "Describe your treatment and upload medical reports. The AI understands your case in minutes, not weeks.",
    media: { type: "image", src: "/mkp.png", alt: "AI chat interface" },
  },
  {
    number: "02",
    title: "Compare real costs worldwide",
    description:
      "See honest prices across 3 destination countries vs. your home city — hospitals, flights, and hotels included.",
    media: { type: "image", src: "/gmp.png", alt: "Cost comparison" },
  },
  {
    number: "03",
    title: "Book with escrow protection",
    description:
      "Your payment is held in secure escrow and only released when your tickets and bookings are delivered.",
    media: { type: "image", src: "/glp.png", alt: "Escrow payment" },
  },
];

export default function HowItWorksSection() {
  return (
    <section className="w-full py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* heading */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400 mb-4">
            How it works
          </p>
          <h2
            style={{
              fontFamily: "Geist, 'Geist Fallback', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: "clamp(30px, 6.5vw, 56px)",
              lineHeight: "clamp(38px, 8vw, 70px)",
              letterSpacing: "-0.03em",
              color: "#0a0a0a",
            }}
          >
            From first question to{" "}
            <span className="text-blue-500">booked treatment</span>
          </h2>
          <p
            style={{
              fontFamily: "Geist, 'Geist Fallback', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: "clamp(15px, 4vw, 20px)",
              lineHeight: "clamp(22px, 5.6vw, 28px)",
              color: "rgb(94, 97, 110)",
              marginTop: "12px",
            }}
          >
            Compare treatments, flights, and hotels across countries — the Kayak of medical tourism.
          </p>
        </div>

        {/* 4-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-1">

              {/* media card */}
              <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{
                  aspectRatio: "4/5",
                }}
              >
                {step.media.type === "video" ? (
                  <video
                    src={step.media.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={step.media.src}
                    alt={step.media.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )}
              </div>

              {/* text below card */}
              <div>
                <h3
                  style={{
                    fontFamily: "Geist, 'Geist Fallback', ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(16px, 4.4vw, 18px)",
                    lineHeight: "26px",
                    color: "#0a0a0a",
                    marginBottom: "4px",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "Geist, 'Geist Fallback', ui-sans-serif, system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(15px, 4.2vw, 20px)",
                    lineHeight: "28px",
                    color: "rgb(94, 97, 110)",
                  }}
                >
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
