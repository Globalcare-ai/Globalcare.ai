"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

function shorten(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function PrivyAuthButton() {
  // Privy isn't configured yet — keep the old behavior so nothing breaks.
  if (!APP_ID) {
    return (
      <Link
        href="/chatbox"
        className="rounded-full border border-slate-200 bg-white/70 px-5 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-300 hover:text-blue-700"
      >
        Open the AI →
      </Link>
    );
  }

  return <AuthButtonInner />;
}

function AuthButtonInner() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <span className="rounded-full border border-slate-200 bg-white/70 px-5 py-2 text-sm font-medium text-slate-400 shadow-sm backdrop-blur">
        Loading…
      </span>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
      >
        Log in →
      </button>
    );
  }

  const wallet = user?.wallet?.address;
  const label = wallet ? shorten(wallet) : user?.email?.address ?? "Signed in";

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
      >
        Dashboard →
      </Link>
      <span
        title={wallet ?? user?.email?.address ?? ""}
        className="hidden rounded-full border border-slate-200 bg-white/70 px-3.5 py-2 font-mono text-xs text-slate-600 shadow-sm backdrop-blur sm:inline"
      >
        {label}
      </span>
      <button
        onClick={logout}
        className="rounded-full border border-slate-200 bg-white/70 px-3.5 py-2 text-sm font-medium text-slate-500 shadow-sm backdrop-blur transition hover:border-red-200 hover:text-red-600"
      >
        Log out
      </button>
    </div>
  );
}
