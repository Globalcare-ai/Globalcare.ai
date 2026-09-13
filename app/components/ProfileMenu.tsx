"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@/utils/supabase/client";

const ADMINS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);

export function shorten(address?: string | null) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** anonymous silhouette shown before login */
export function AnonAvatar() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#e6ecf7" />
      <circle cx="20" cy="16" r="6.4" fill="#a9b7cd" />
      <path d="M6.5 36c1.8-7.2 7.4-11 13.5-11s11.7 3.8 13.5 11" fill="#a9b7cd" />
    </svg>
  );
}

/**
 * Round profile photo that opens a small account panel:
 * identity → Dashboard → Admin (allowlisted only) → wallet (copy) → Log out.
 */
export default function ProfileMenu({
  avatarUrl: avatarOverride,
  name: nameOverride,
  currentPage,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  currentPage?: "dashboard" | "admin";
}) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState<{ avatar_url?: string | null; name?: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const privyId = user?.id;
  const email = user?.email?.address ?? user?.google?.email ?? null;

  const addrs = [
    user?.wallet?.address,
    ...((user?.linkedAccounts ?? []).map((a) => (a.type === "wallet" ? (a as { address?: string }).address : undefined))),
  ].filter(Boolean) as string[];
  const isAdmin = addrs.some((a) => ADMINS.includes(a.toLowerCase()));

  const embedded = (user?.linkedAccounts ?? []).find(
    (a) => a.type === "wallet" && (a as { walletClientType?: string }).walletClientType === "privy"
  ) as { address?: string } | undefined;
  const wallet = embedded?.address ?? user?.wallet?.address ?? null;

  const avatarUrl = avatarOverride ?? fetched?.avatar_url ?? null;
  const displayName = nameOverride || fetched?.name || email || (wallet ? shorten(wallet) : "GlobalCare patient");
  const initial = (displayName || "G").slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!authenticated || !privyId || (avatarOverride !== undefined && nameOverride)) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("patients").select("avatar_url,name").eq("privy_user_id", privyId).maybeSingle();
        if (!cancelled) setFetched((data as { avatar_url?: string | null; name?: string | null } | null) ?? null);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [authenticated, privyId, avatarOverride, nameOverride]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copyWallet = useCallback(async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }, [wallet]);

  if (!ready) return <span className="block h-10 w-10 animate-pulse rounded-full bg-slate-200/80" />;

  if (!authenticated) {
    return (
      <button
        onClick={login}
        title="Log in"
        aria-label="Log in"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-blue-400"
      >
        <AnonAvatar />
      </button>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm shadow-sm ring-1 transition hover:shadow-md ${open ? "ring-2 ring-blue-500" : "ring-slate-200 hover:ring-blue-400"}`}
      >
        <Avatar size="h-full w-full text-sm" url={avatarUrl} initial={initial} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2.5 w-[264px] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_-12px_rgba(15,23,42,0.28)]"
          style={{ animation: "gcMenuIn .16s cubic-bezier(.22,1,.36,1) both" }}
        >
          <style>{`@keyframes gcMenuIn{from{opacity:0;transform:translateY(-5px) scale(.97)}to{opacity:1;transform:none}}`}</style>

          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
            <Avatar size="h-10 w-10 text-sm" url={avatarUrl} initial={initial} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="truncate text-[11px] text-slate-400">{email ?? "Signed in"}</p>
            </div>
          </div>

          <div className="p-1.5">
            <Item href="/dashboard" onClick={() => setOpen(false)} active={currentPage === "dashboard"}
              icon={<path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z" />}>
              Dashboard
            </Item>

            {isAdmin && (
              <Item href="/admin" onClick={() => setOpen(false)} active={currentPage === "admin"}
                icon={<path d="m14.7 6.3 3 3M3 21l1-4 11-11 3 3-11 11zM17 3.5 20.5 7" />}>
                Admin console
              </Item>
            )}

            <button
              role="menuitem"
              onClick={copyWallet}
              disabled={!wallet}
              title={wallet ?? ""}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Glyph><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M16 11h4v4h-4z" /></Glyph>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs text-slate-600">{shorten(wallet) || "No wallet"}</span>
                <span className="block text-[10px] text-slate-400">{copied ? "Copied ✓" : "Wallet · click to copy"}</span>
              </span>
            </button>

            <div className="my-1.5 h-px bg-slate-100" />

            <button
              role="menuitem"
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <Glyph tone="rose"><path d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></Glyph>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ size, url, initial }: { size: string; url: string | null; initial: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

function Item({ href, onClick, active, icon, children }: { href: string; onClick: () => void; active?: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}
    >
      <Glyph>{icon}</Glyph>
      {children}
      {active && <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-slate-400">Here</span>}
    </Link>
  );
}

function Glyph({ children, tone }: { children: React.ReactNode; tone?: "rose" }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] shrink-0 ${tone === "rose" ? "text-rose-400" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}
