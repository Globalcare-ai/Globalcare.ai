"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { arcTestnet, sepolia } from "viem/chains";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
// Arc is the default once its escrow contract is configured; Sepolia stays supported
// so existing journeys funded there still work.
const ARC_READY = !!process.env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS;

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
        defaultChain: ARC_READY ? arcTestnet : sepolia,
        supportedChains: [arcTestnet, sepolia],
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
