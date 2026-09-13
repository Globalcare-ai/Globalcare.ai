"use client";

import { useEffect, useState } from "react";

/**
 * The GlobalCare bot face. c1 while it types, c2 while it thinks, and at rest it
 * cycles through every avatar. The idle frame is derived from the wall clock, so
 * every avatar on the page shows the same one no matter when it mounted.
 */
const FRAMES = ["/c1.gif", "/c2.gif", "/c3.gif", "/c4.gif", "/c5.gif"];
const TYPING = "/c1.gif";
const THINKING = "/c2.gif";
const EVERY_MS = 5000;

const frameNow = () => Math.floor(Date.now() / EVERY_MS) % FRAMES.length;

export type BotState = "idle" | "typing" | "thinking";

export default function BotAvatar({ state = "idle", className = "" }: { state?: BotState; className?: string }) {
  const [i, setI] = useState(0);

  // warm the cache so the first switch doesn't flash
  useEffect(() => {
    FRAMES.forEach((src) => { const img = new window.Image(); img.src = src; });
  }, []);

  useEffect(() => {
    if (state !== "idle") return;
    setI(frameNow());
    const id = setInterval(() => setI(frameNow()), 1000);
    return () => clearInterval(id);
  }, [state]);

  const src = state === "typing" ? TYPING : state === "thinking" ? THINKING : FRAMES[i];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="GlobalCare AI" className={className} draggable={false} />
  );
}
