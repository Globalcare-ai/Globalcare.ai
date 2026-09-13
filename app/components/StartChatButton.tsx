"use client";

import { useRouter } from "next/navigation";
import { usePrivy, useLogin } from "@privy-io/react-auth";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

type Props = { className?: string; children: React.ReactNode };

/**
 * Landing CTA that always ends up in the chat, but never lets an anonymous
 * visitor in: unauthenticated clicks open the Privy modal first and only land
 * on /chatbox once login completes.
 *
 * usePrivy()/useLogin() throw when no PrivyProvider is mounted (which is the
 * case when APP_ID is unset), so the two cases are split into separate
 * components — that keeps the hook calls unconditional inside the component
 * that actually has the provider above it.
 */
export default function StartChatButton({ className, children }: Props) {
  return APP_ID ? (
    <WithPrivy className={className}>{children}</WithPrivy>
  ) : (
    <PlainButton className={className}>{children}</PlainButton>
  );
}

function WithPrivy({ className, children }: Props) {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  // onComplete also fires for an already-authenticated user, so this is the
  // single place that decides where a successful login lands.
  const { login } = useLogin({ onComplete: () => router.push("/chatbox") });

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => (authenticated ? router.push("/chatbox") : login())}
      className={className}
    >
      {children}
    </button>
  );
}

function PlainButton({ className, children }: Props) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.push("/chatbox")} className={className}>
      {children}
    </button>
  );
}
