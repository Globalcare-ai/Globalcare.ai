export default function ConsultationSection() {
  return (
    <section
      className="w-full py-24 px-6 flex flex-col items-center text-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 70% at 50% 50%, #dce8ff 0%, #eef3ff 40%, #ffffff 75%)",
      }}
    >
      {/* pill chip */}
      <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-medium tracking-wide mb-6">
        Consult Online
      </span>

      {/* headline */}
      <h2 className="max-w-2xl" style={{ fontFamily: "var(--font-clash)" }}>
        <span
          className="block"
          style={{
            fontWeight: 400,
            fontSize: "clamp(28px, 4vw, 52px)",
            lineHeight: 1.2,
            color: "#6b7280",
          }}
        >
          Get a Free Consultation
        </span>
        <span
          className="block"
          style={{
            fontWeight: 600,
            fontSize: "clamp(30px, 4.5vw, 56px)",
            lineHeight: 1.15,
            color: "#0f172a",
          }}
        >
          Before You Pay Anything
        </span>
      </h2>

      <p
        className="mt-4 max-w-md"
        style={{
          fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: "18px",
          lineHeight: "28px",
          color: "rgb(94, 97, 110)",
        }}
      >
        Speak with world-class doctors from top clinics worldwide — completely
        free, before any commitment or payment.
      </p>

      {/* video call card */}
      <div
        className="relative mt-12 w-full overflow-hidden shadow-2xl"
        style={{
          maxWidth: "780px",
          borderRadius: "20px",
          boxShadow: "0 32px 80px rgba(37, 99, 235, 0.18), 0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* video */}
        <video
          src="/doctor.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full block"
          style={{ aspectRatio: "16/9", objectFit: "cover", display: "block" }}
        />

        {/* doctor name badge — bottom left */}
        <div
          className="absolute bottom-5 left-5 flex items-center gap-2.5 px-3 py-2 rounded-full"
          style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}
        >
          {/* avatar */}
          <div
            className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0 overflow-hidden"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <span className="text-white text-sm font-medium" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
            Dr. Samuel Kim
          </span>
        </div>

        {/* call controls — bottom center */}
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3"
        >
          {/* video off */}
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(12px)" }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </button>

          {/* mute */}
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(12px)" }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/>
            </svg>
          </button>

          {/* end call — red */}
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "#ef4444" }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5" style={{ transform: "rotate(135deg)" }}>
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
            </svg>
          </button>
        </div>

        {/* right icons — bottom right */}
        <div className="absolute bottom-5 right-5 flex items-center gap-3">
          {/* face scan */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>

          {/* heart */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          {/* plus */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
