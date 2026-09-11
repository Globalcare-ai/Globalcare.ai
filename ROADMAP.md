# GlobalCare.ai — Roadmap

**Focus:** the AI + travel layer is built. The remaining work is the **payment layer**: Privy wallet → (optional) Uniswap swap to USDC → Arc medical escrow with milestone releases. See [prizes.md](./prizes.md) for the sponsor details, [BLUEPRINT.md](./BLUEPRINT.md) for the technical spec.

## Locked scope — 3 bounties only

| Bounty | Value | Job in GlobalCare | Confidence |
|--------|-------|-------------------|------------|
| 🔥 **Privy** — Best financial flow | $2,500 | Patient embedded wallet → approve/pay USDC | 8/10 |
| 🔥 **Arc** — Launch/Mainnet | $3,500 | USDC medical escrow → milestone payments to hospital | 8/10 |
| 🦄 **Uniswap** — Stack contribution | $1,000 | Patient's ETH/other token → USDC before escrow (only if we support non-USDC funding) | 4–5/10 |

**Dropped (ignore for now):** ENS, The Graph, World, Chainlink, Hedera, Bazantic, 1inch. Reasons in [prizes.md](./prizes.md); short version — each either doesn't solve a real GlobalCare problem or would bend the product into something we don't need.

## Core story

```
AI finds the treatment + hospital + trip
        ↓
(optional) Uniswap converts patient's crypto → USDC
        ↓
Privy gives the patient a simple wallet / payment experience
        ↓
Arc holds USDC in medical escrow
        ↓
Milestones release money to the hospital
```

## Build order (locked)

1. **✅ Gemini AI flow** — medical intake → country/hospital recommendation → flights + hotels + total. *(built)*
2. **👛 Privy** — login (email / Google / wallet) + embedded self-custodial wallet, no seed phrase. → Privy bounty.
3. **🦄 Uniswap (optional)** — swap patient ETH/other → USDC on a supported testnet (Sepolia). Only if we allow non-USDC funding; otherwise skip. → Uniswap bounty.
4. **💵 Arc escrow (Arc Testnet)** — deploy `GlobalCareEscrow`, deposit test USDC, release milestones to the hospital. **This is the last layer we build** — product first, then plug escrow in once the rest of the flow works.
5. **✨ Polish** — complete the end-to-end demo; UI polish (globe/animations already in stack). Optional UX: 🗣️ multilingual voice chat (browser Web Speech API + Gemini), 📅 one-tap `.ics` itinerary.
6. **🟣 Arc Mainnet** — deploy / deployment-ready on Arc mainnet. Final step, for the Arc bounty. **Deadline: Sep 30.**

## Testnet vs Mainnet (clearing the confusion)

- Testnet and mainnet are **separate environments** — you do NOT convert/bridge test USDC into real USDC. Don't build cross-network token movement; it just complicates the demo.
- **Arc Testnet** = a safe practice copy of Arc Mainnet. Escrow holds *test* USDC (no real value) so you can prove the payment logic works.
- **Arc Mainnet** = the same contracts/architecture deployed (or deploy-ready) with real USDC — this is what satisfies the Arc Launch/Mainnet bounty.
- Each tech has one job: **Uniswap** = patient's ETH → USDC · **Privy** = wallet + tx approval · **Arc** = hold/settle USDC for the medical payment.

## Guardrails

- Arc mainnet bounty needs: working frontend + backend + architecture diagram + demo video, deploy/deploy-ready by **Sep 30**.
- Privy: create/use a Privy wallet + one functional financial flow (the USDC payment), working demo + source.
- Uniswap (if entered): public repo + **FEEDBACK.md** + the feedback form.
- Don't add features beyond this. Ship Privy → (Uniswap) → Arc, then stop.
