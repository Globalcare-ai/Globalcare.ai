"use client";

import Link from "next/link";
import ProfileMenu from "@/app/components/ProfileMenu";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

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

  return <ProfileMenu />;
}
