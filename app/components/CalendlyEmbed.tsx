"use client";

import { useEffect, useRef } from "react";

const CALENDLY_URL = "https://calendly.com/shaiksameer8921/meet-with-your-doctor";
const SCRIPT_ID = "calendly-widget-script";

type CalendlyGlobal = {
  initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
};

// Inline Calendly scheduler. Loads the widget script once, then (re)initialises
// into our container — reliable inside a client-side SPA / modal.
export default function CalendlyEmbed({ name, email }: { name?: string; email?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (email) params.set("email", email);
    const url = params.toString() ? `${CALENDLY_URL}?${params}` : CALENDLY_URL;

    function init() {
      const w = window as unknown as { Calendly?: CalendlyGlobal };
      if (!el || !w.Calendly) return;
      el.innerHTML = "";
      w.Calendly.initInlineWidget({ url, parentElement: el });
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      init();
    } else {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      s.onload = init;
      document.body.appendChild(s);
    }
  }, [name, email]);

  return <div ref={ref} style={{ minWidth: 320, height: 700 }} />;
}
