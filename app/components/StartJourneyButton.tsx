"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function StartJourneyButton() {
  const router = useRouter();
  const privy = APP_ID ? usePrivy() : null;

  const onClick = () => {
    // No Privy configured → just open the app.
    if (!privy) {
      router.push("/chatbox");
      return;
    }
    if (privy.authenticated) {
      router.push("/dashboard");
    } else {
      // Log in first, then land on the dashboard.
      privy.login();
    }
  };

  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-blue-600"
    >
      Start your journey
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </button>
  );
}
