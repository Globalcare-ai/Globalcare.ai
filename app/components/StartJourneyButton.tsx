"use client";

import StartChatButton from "./StartChatButton";

/**
 * Hero CTA. Login is handled by StartChatButton — this only supplies the label
 * and the hero styling.
 */
export default function StartJourneyButton() {
  return (
    <StartChatButton className="group inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60">
      Start your journey
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </StartChatButton>
  );
}
