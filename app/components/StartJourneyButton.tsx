"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/**
 * usePrivy() must not be called conditionally — and it throws when no
 * PrivyProvider is mounted (which is the case when APP_ID is unset). Splitting
 * the two cases into separate components keeps the hook call unconditional
 * inside the component that actually has the provider above it.
 */
export default function StartJourneyButton() {
  return APP_ID ? <WithPrivy /> : <PlainLink />;
}

function WithPrivy() {
  const router = useRouter();
  const privy = usePrivy();

  return (
    <Button
      onClick={() => {
        if (privy.authenticated) router.push("/dashboard");
        else privy.login(); // logging in lands them on the dashboard
      }}
    />
  );
}

function PlainLink() {
  const router = useRouter();
  return <Button onClick={() => router.push("/chatbox")} />;
}

function Button({ onClick }: { onClick: () => void }) {
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
