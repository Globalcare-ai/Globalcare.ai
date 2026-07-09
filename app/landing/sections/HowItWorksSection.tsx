const steps = [
  {
    number: "01",
    title: "Tell our AI what you need",
    description:
      "Describe your treatment and upload medical reports. The AI understands your case in minutes, not weeks.",
  },
  {
    number: "02",
    title: "Compare real costs worldwide",
    description:
      "See honest prices across 3 destination countries vs. your home city — hospitals, flights, and hotels included.",
  },
  {
    number: "03",
    title: "Book with escrow protection",
    description:
      "Your payment is held in secure escrow and only released when your tickets and bookings are delivered.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="w-full py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            From first question to booked treatment
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            >
              <span className="text-5xl font-extrabold text-gray-100 leading-none">
                {step.number}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-3 text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
