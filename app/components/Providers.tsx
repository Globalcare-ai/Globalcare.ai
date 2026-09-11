"use client";

import { PrivyProvider } from "@privy-io/react-auth";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function Providers({ children }: { children: React.ReactNode }) {
  // Without an app id Privy can't initialize — render the app unwrapped so the
  // landing page still works. The auth button shows a "set up Privy" state.
  if (!APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#2563eb",
          logo: "/gll.png",
          walletChainType: "ethereum-only",
        },
        // Email + Google create an embedded wallet for non-crypto patients;
        // "wallet" lets crypto-native users connect MetaMask / their own wallet.
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
