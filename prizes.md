# Hackathon Prizes

A single place to track sponsor prizes, tracks, and qualification requirements for GlobalCare.ai.


> ## 🔒 Locked scope (decided Sep 9)
> Going all-in on **3 bounties only** — everything else below is kept as research reference but **not** being pursued.
>
> | Bounty | Value | Job | Confidence |
> |--------|-------|-----|------------|
> | 🔥 **Privy** — Best financial flow | $2,500 | Patient embedded wallet → pay USDC | 8/10 |
> | 🔥 **Arc** — Launch/Mainnet | $3,500 | USDC medical escrow → milestone payments | 8/10 |
> | 🦄 **Uniswap** — Stack contribution | $1,000 | ETH → USDC before escrow (optional) | 4–5/10 |
>
> **Dropped:** ENS (hospital .eth feels cosmetic), The Graph (RPC already reads escrow), World (not core to the journey), Chainlink (no strong impl yet), Hedera (x402 agent payments bend the product), Bazantic (extra agent layer, low value), 1inch/Aqua (DeFi too far from GlobalCare). See [ROADMAP.md](./ROADMAP.md) / [BLUEPRINT.md](./BLUEPRINT.md).

## Sponsors at a glance

| Sponsor | Total pool | Best-fit track for GlobalCare.ai |
|---------|-----------|----------------------------------|
| [The Graph](#the-graph--15000) | $15,000 | AI Use Case (From Scratch) — agent uses Subgraph MCP as live data |
| [Hedera](#hedera--15000) | $15,000 | AI & Agentic Payments — x402-gated escrow/payments |
| [Arc](#arc--10000) | $10,000 | DeFi / Launch-to-Mainnet — USDC escrow settlement |
| [Privy](#privy--5000) | $5,000 | Best financial flow — embedded wallet + escrow transfer |
| [Uniswap Foundation](#uniswap-foundation--5000) | $5,000 | Stack Contribution — swap to USDC before escrow |
| [ENS](#ens--5000) | $5,000 | Best Use of ENSv2 — clinic subnames + agent identity |
| [1inch](#1inch--7000) | $7,000 | Build an Aqua App — SwapVM DeFi position (narrower fit) |
| [World](#world--7000) | $7,000 | Selfie Check — verify a real patient before consult/escrow |
| [Bazantic](#bazantic--3000) | $3,000 | Agentify a New API — wrap your flight/hotel API for agents |

> ⚠️ Hard rules to remember: **The Graph & Hedera require LIVE data** (no mocks); **Arc mainnet tracks close Sep 30**. Every track needs a **public repo + demo video** (2–5 min).

---

## The Graph — $15,000

- **Website:** https://thegraph.com/
- **X / Twitter:** https://x.com/graphprotocol

**About:** The Graph is blockchain data infrastructure spanning 50+ networks, serving developers, analysts, AI agents, and enterprises with structured, real-time data. Products include Subgraphs, Firehose, Substreams, and Amp. As of 2026: 1.27T+ queries served to 75,000+ projects via independent Indexers.

### Prize breakdown

| Track | Total | 🥇 1st | 🥈 2nd | 🥉 3rd |
|-------|-------|--------|--------|--------|
| 🧩 Best Use of Composable or Standardized Graph Products | $5,000 | $2,500 | $1,500 | $1,000 |
| 🤖 Best AI Tooling or AI Use Case (From Scratch) | $5,000 | $2,500 | $1,500 | $1,000 |
| 🤖 Best AI Tooling or AI Use Case (Continuity) | $5,000 | $2,500 | $1,500 | $1,000 |

---

### 🧩 Best Use of Composable or Standardized Graph Products — $5,000

Build on The Graph's composable and standardized data products. Use Standardized Subgraphs (one shared schema across every protocol of a type) to run a single query across many protocols, compose reusable Substreams packages into new pipelines, or layer the Subgraph MCP on top for cross-protocol analysis. Contributing a new composable Substreams module for an emerging standard, such as ERC-4626 tokenized-vault flows, also counts. The best submissions show the leverage of standards: one query pattern spanning many protocols, or one pipeline reused across chains.

**Qualification requirements**

- Either compose two or more of The Graph's products, or build meaningfully on a standardized schema (for example the Messari Standardized Subgraphs).
- Consume live data from a Graph provider, for example Subgraph Studio for Subgraphs or The Graph Market for Substreams. Mocked, local-only, or static datasets do not qualify.
- Simply querying one Subgraph with no composition or standardization does not qualify; consider the Best AI Use Case track instead.
- Authoring or extending a Standardized Subgraph, or contributing a reusable composable Substreams module, is in scope.
- Make the standards leverage clear: show what became easier because a shared schema or composed product was used.
- Submit a public repository and a short demo video (two to four minutes).

**Links and resources**

- Messari Standardized Subgraph — https://thegraph.com/docs/en/subgraphs/existing-subgraphs/standard-subgraphs/
- Agent0 / ERC-8004 Subgraphs — https://thegraph.com/docs/en/subgraphs/existing-subgraphs/agent0/
- Standardized Substreams — https://github.com/streamingfast/substreams-chain-modules
- Pinax Primitives for EVM Substreams — https://github.com/pinax-network/substreams-evm

---

### 🤖 Best AI Tooling or AI Use Case with The Graph (From Scratch) — $5,000

> **THIS TRACK IS THE FROM SCRATCH TRACK**

One AI track, two ways to build. It rewards both the tooling that makes The Graph easier to use from AI environments like Claude, Cursor, and ChatGPT (new or extended MCP servers, agent SKILLs, x402 payment tooling, A2A integrations, framework plugins, or client configs) and the AI agents or apps that use The Graph as their live source of blockchain data (research assistants, trading and execution agents, portfolio copilots, risk monitors, and more).

- Query 15,000+ Subgraphs through the Subgraph MCP in natural language, stream data with Substreams, or let your agent pay per query autonomously with x402.
- **Featured Substreams challenge:** use the Substreams SKILLs to go from a single natural-language prompt to a working, deployed Substreams pipeline.

**Two eligibility pools** (judged separately, so you compete against projects built the same way):

- **Net-new (Start Fresh):** projects begun and built during the hackathon. Open-source starter kits are fine; project-specific prior code is not.
- **Continuity (Extend Open Source / Ship a Feature):** projects that extend an existing open-source repo or ship a new feature on an existing product. Document the pre-existing work; only work done during the event is judged. Extending The Graph's own AI Suite (for example improving an existing MCP server or SKILL) fits the Continuity pool.

**Qualification requirements**

- Use The Graph as a load-bearing part of the project: either the AI tooling targets The Graph's products or AI Suite, or the agent/app uses The Graph (Subgraphs, the Subgraph MCP, or Substreams) as its source of blockchain data.
- Consume live data from a Graph provider, for example querying Subgraphs with an API key from Subgraph Studio, or streaming Substreams via The Graph Market. Mocked, local-only, or static datasets do not qualify.
- Do meaningful work with the data: reasoning, decisions, automation, or a natural-language interface, not just printing a raw query result. Tooling submissions must be reusable infrastructure, not a single end-user app.
- Open-source the code with a clear README or SKILL.md so judges can run it, and submit a public repository plus a short demo video (two to four minutes).
- Select the pool that matches how you built: Start Fresh for net-new, Continuity for extending an existing repo or product. Follow that pool's ETHGlobal rules and document any pre-existing work.
- For the Substreams one-prompt deployment challenge: demonstrate deploying a working Substreams pipeline from a single prompt using the Substreams SKILLs.

**Links and resources**

- Subgraph MCP — https://thegraph.com/docs/en/subgraphs/tooling/subgraph-mcp/introduction/
- Subgraph SKILLs — https://github.com/graphprotocol/subgraphs-skills
- Substreams SKILLs — https://github.com/streamingfast/substreams-skills

---

### 🤖 Best AI Tooling or AI Use Case with The Graph (Continuity) — $5,000

> **THIS TRACK IS THE CONTINUITY TRACK** — only available to Continuity Track participants.
> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Same description, pools, qualification requirements, and resources as the From Scratch track above — the difference is the pool you enter. Choose Continuity when you extend an existing open-source repo or ship a new feature on an existing product; document the pre-existing work, and only work done during the event is judged.

**Links and resources**

- Subgraph MCP — https://thegraph.com/docs/en/subgraphs/tooling/subgraph-mcp/introduction/
- Subgraph SKILLs — https://github.com/graphprotocol/subgraphs-skills
- Substreams SKILLs — https://github.com/streamingfast/substreams-skills

---

### How this could fit GlobalCare.ai

- The **From Scratch AI track** is the natural fit — GlobalCare.ai's chat agent could use the **Subgraph MCP** as a live blockchain-data source (e.g. verifying escrow/USDC transactions, reading clinic attestations, or surfacing on-chain trust signals), doing real reasoning on that data rather than printing raw results.
- Remember the hard rule across every track: **live data from a Graph provider** (Subgraph Studio API key or The Graph Market). Mocked/static data disqualifies — worth wiring in before the demo.
- Deliverables to prep regardless of track: **public repo**, clear **README/SKILL.md**, and a **2–4 minute demo video**.

## Hedera — $15,000

- **Website:** https://hedera.com/
- **X / Twitter:** https://x.com/hedera
- **Community:** Telegram t.me/hederahashgraph · Discord https://hedera.com/discord · Whitepaper https://hedera.com/papers

**About:** Hedera is a leading EVM blockchain with a distinctive developer experience — build with Solidity or the JavaScript SDK (also Java, Python, Rust, Go, Swift). Its open-source codebase is managed by Linux Foundation Decentralized Trust as Project Hiero, including the hashgraph consensus algorithm: 10,000+ TPS, 3s finality, low USD-priced fees, and aBFT-grade security. The public network is governed by a council of leading global institutions. Hedera targets real-world use across DeFi, tokenization, AI, and digital identity.

### Prize breakdown

| Track | Total | Payout |
|-------|-------|--------|
| 🤖 AI & Agentic Payments on Hedera | $6,000 | Up to 3 teams × $2,000 |
| 🛠️ Open Source — Improve the Hedera Harness | $2,000 | Up to 2 teams × $1,000 |
| 🪙 Tokenization of Anything | $6,000 | Up to 3 teams × $2,000 |
| ♻️ Continuity | $1,000 | Continuity Track only |

---

### 🤖 AI & Agentic Payments on Hedera — $6,000 (up to 3 teams × $2,000)

The agentic economy needs payment rails at machine speed: sub-second finality, predictable sub-cent fees, and native token operations without smart contract overhead. Hedera is built for this, but x402 on Hedera is still short of one thing: actual services you can pay for. The challenge: stand up a real x402-gated service on Hedera and build the platform that consumes it. Wrap an API, sell inference by the call, meter data or compute, then show an agent discovering it and paying for it without an API key or a subscription.

**Ideas**

- Pay-per-call inference endpoint. Host a model behind x402 and build an agent that budgets across providers.
- Metered data feed. Price by query, settle per request, no seats or subscriptions.
- Agent marketplace. Services register, agents discover and pay, all in HBAR or HTS tokens.
- Micropayment streaming. Settle every few seconds for compute or bandwidth in use.

**Qualification requirements**

- Host a live x402-gated service on Hedera testnet or mainnet, settled through the Blocky402 facilitator.
- Build a platform or agent that consumes that service and completes at least one real paid request end to end.
- Public GitHub repo with a README covering setup, architecture, and the payment flow.
- Demo video of five minutes or less showing the paid request executing.

**Extra points**

- Pay-per-call inference, data, or compute metering rather than a flat per-request charge
- Multi-agent negotiation and settlement via A2A or ACP
- On-chain agent identity using ERC-8004 or HCS-14
- Agent discovery via UCP, or a directory that makes your service findable by other agents
- HTS tokens or custom fee schedules in the settlement path
- Verifiable payment audit trails on HCS
- Recurring or streamed payments using Scheduled Transactions

**Links and resources**

- Hedera Code Snippets — https://github.com/hedera-dev/hedera-code-snippets
- Hedera Discord — https://hedera.com/discord
- Hedera and the x402 payment standard — https://hedera.com/blog/hedera-and-the-x402-payment-standard/
- Blocky402 facilitator — https://blocky402.com/
- x402 pay-per-request inference PoC — https://github.com/hedera-dev/x402-inference-pay-per-request-poc
- Hedera Agent Kit — https://github.com/hashgraph/hedera-agent-kit-js
- Hedera developer docs — https://docs.hedera.com/
- Starter template (scaffold-hbar) — https://github.com/hedera-dev/scaffold-hbar
- x402 Protocol — https://github.com/x402-foundation/x402

---

### 🛠️ Open Source — Improve the Hedera Harness — $2,000 (up to 2 teams × $1,000)

The Hedera Harness is the tool layer developers reach for first, which makes it the highest-leverage thing in the ecosystem to improve. This track rewards contribution over greenfield: make the harness better, or build a new one on its foundations.

**Ideas**

- Extend service coverage into areas the harness handles thinly today
- Port the harness to another language or runtime
- Fix the rough edges you personally hit in your first hour with Hedera
- Add a testing or local-development mode that removes testnet round trips

**Qualification requirements**

- Either submit a meaningful contribution to the Hedera Harness (open PR, not merged is fine) or build a new harness that extends or takes direct inspiration from it.
- Public GitHub repo or PR link, with a README or PR description explaining the problem you solved and how to run it.
- Demo video of five minutes or less showing the improvement working.

**Extra points**

- New service coverage, better ergonomics, or fewer lines of code to a working transaction
- Tests, documentation, or examples alongside the code
- A harness targeting a language or framework the current one does not cover
- Clear before and after evidence of the developer experience gain

**Links and resources**

- Hedera Harness — https://github.com/hedera-dev/hedera-harness
- Hedera Skills — https://github.com/hedera-dev/hedera-skills
- Getting started with the Hedera SDKs — https://docs.hedera.com/hedera/getting-started-sdk-developers
- Hedera developer tooling overview — https://hedera.com/developer-tooling/
- Hedera code snippets — https://github.com/hedera-dev/hedera-code-snippets
- Hedera Discord — https://hedera.com/discord

---

### 🪙 Tokenization of Anything — $6,000 (up to 3 teams × $2,000)

Institutional adoption is the dominant market narrative, and tokenised collateral is its sharpest edge. Post tokenised treasuries against a repo agreement and the collateral leg becomes programmatic and provable instead of a parallel paper process. Build an enterprise finance application on Hedera using the Asset Tokenization Studio (ATS). Use the SDK as-is, adapt it, extend the web app, or improve it. ATS supports ERC-3643 alongside ERC-1400, with compliance controls, corporate actions, and coupon handling in the box. Real asset classes and real lifecycle management are favoured over a token with a name on it.

**Ideas**

- Tokenised collateral for repo. Post tokenised treasuries as collateral with programmatic proof and release.
- Bonds with a lifecycle. Issuance, coupon payments, and redemption at maturity, all on-chain.
- Secondary market for ATS assets. Order book or auction with compliance enforced at transfer.
- Tokenised equities. KYC-gated register with automated corporate actions.
- Cashflow tokenisation. Invoices, receivables, or royalty streams sold at a discount and settled on maturity.

**Qualification requirements**

- Use the Asset Tokenization Studio (SDK, contracts, web application, or a combination) to issue or manage a tokenised asset.
- Deploy and demonstrate on Hedera testnet.
- Public GitHub repo, with contracts verified on HashScan where applicable.
- Demo video of five minutes or less showing issuance, configuration, and at least one lifecycle operation (transfer, compliance check, or distribution).

**Extra points**

- A secondary market for ATS-issued assets, which the Studio does not have today
- Compliance controls in use: KYC grants, freezes, transfer restrictions, pauses
- Custom fee schedules, coupon or dividend distributions, royalty flows
- Oracle integration for asset pricing or NAV
- Scheduled Transactions for vesting, coupon payments, or maturity settlement
- Contributions back upstream to ATS

**Links and resources**

- Asset Tokenization Studio monorepo — https://github.com/hashgraph/asset-tokenization-studio
- ATS SDK on npm — https://www.npmjs.com/package/@hashgraph/asset-tokenization-sdk
- Starter templates (scaffold-hbar) — https://github.com/hedera-dev/scaffold-hbar
- Hedera Discord — https://hedera.com/discord
- Hedera developer tooling — https://hedera.com/developer-tooling/
- Hedera developer docs — https://docs.hedera.com/
- ATS product overview and tutorials — https://hedera.com/product/asset-tokenization-studio/
- ATS documentation — https://docs.hedera.com/hedera/open-source-solutions/asset-tokenization-studio-ats

---

### ♻️ Continuity — $1,000 (Continuity Track participants only)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Bringing back a project you have already built on Hedera? This track wants to see it move forward, not resubmitted.

**Qualification requirements**

- The project must have been built for a previous hackathon or already exist in some form on Hedera.
- Demonstrate substantive new work completed during this event: new features, new Hedera services integrated, or a significant architectural change. Polish and bug fixes alone will not qualify.
- Public GitHub repo with a README that clearly separates what existed before from what is new, ideally with commit history or a diff.
- Demo video of five minutes or less focused on the new work.

**Extra points**

- Evidence of real users, traction, or deployment beyond the demo
- Newly integrated Hedera services that were not in the original build
- A clear roadmap for what comes after the hackathon

**Links and resources**

- Start building on Hedera — https://hedera.com/start-building/
- Hedera developer docs — https://docs.hedera.com/
- Hedera developer tooling — https://hedera.com/developer-tooling/
- Hedera developers code repository — https://docs.hedera.com/solutions/tools/code-repo
- Hedera code snippets — https://github.com/hedera-dev/hedera-code-snippets
- Hedera Discord — https://hedera.com/discord
- Workshop video — https://www.youtube.com/watch?v=-nkd3aorELM

---

### How Hedera could fit GlobalCare.ai

- **AI & Agentic Payments ($6,000)** is the strongest match — GlobalCare.ai's escrow/booking flow could settle through an **x402-gated service on Hedera**, letting the AI agent pay per call (e.g. clinic quotes, flight/hotel data) with sub-cent HBAR fees and no API keys. Fits the "agent discovers and pays for a service" brief directly.
- **Verifiable audit trails on HCS** map cleanly onto the escrow trust story — every payment/booking milestone logged immutably.
- Hard rule: needs a **live x402 service via the Blocky402 facilitator** on testnet/mainnet + one real paid request end-to-end, plus a ≤5-min demo video.

---

## Arc — $10,000

- **Website:** https://www.arc.network/
- **X / Twitter:** https://x.com/Arc

**About:** Arc is the purpose-built L1 blockchain from Circle — EVM-compatible, serving as the "Economic OS for the internet": a programmable trust layer and transaction engine where capital, humans, and machines coordinate. Arc enables onchain lending, capital markets, FX, and payments, igniting liquidity across currencies and asset classes.

**Core products:** Arc, USDC, EURC, App Kits, Circle Wallets, Circle Contracts, CCTP, Gateway, StableFX, Agent Stack, Nanopayments, Paymaster.

### Prize breakdown

| Track | Payout |
|-------|--------|
| 🏆 Best DeFi / Onchain Finance Application | $1,667 |
| 🏆 Best Agentic Economy Application with Circle Agent Stack | $1,667 |
| 🏆 Best DeFi or Agentic Application (Continuity only) | $1,666 |
| 🏆 Launch on Arc Testnet & Push to Mainnet | $3,500 (🥇 $2,500 · 🥈 $1,000) |
| 🏆 Launch on Arc Testnet & Push to Mainnet (Continuity only) | $1,500 |

> **Common submission requirements (all tracks):** working frontend + backend, an architecture diagram, a video demo + presentation covering core functions and use of Circle's developer tools with detailed documentation, and a link to a public GitHub/Replit repo. State clearly which bounty/track you are submitting for.

---

### 🏆 Best DeFi / Onchain Finance Application — $1,667

Build stablecoin-native DeFi on Arc — lending, borrowing, swaps, liquidity, FX, yield, payments, treasury, or fintech infrastructure using Arc and USDC.

**What they're looking for**

- Meaningful use of Arc and USDC
- Advanced programmable money flows such as conditional payments, onchain automation, or multi-step settlement
- Payment, liquidity, or treasury workflows using App Kits where relevant
- Applications that show why stablecoin-native infrastructure changes what is possible

**Core products:** Arc, USDC, App Kits, Circle Wallets, Circle Contracts, CCTP, Gateway, StableFX.

---

### 🏆 Best Agentic Economy Application with Circle Agent Stack — $1,667

Build autonomous AI agents that hold wallets, make payments, manage risk, settle jobs, or transact with other agents using USDC on Arc.

**What they're looking for**

- Agents with clear decision logic tied to real signals
- Autonomous spending, payments, or settlement flows using USDC
- Use of Agent Stack to connect agents to wallets, USDC payments, and onchain actions
- Use of Nanopayments, Paymaster, or App Kits where relevant for agent-to-agent or service payments

**Core products:** Arc, USDC, Agent Stack, App Kits, Circle Wallets, Circle Contracts, Nanopayments, Paymaster.

---

### 🏆 Best DeFi or Agentic Application — $1,666 (Continuity Track participants only)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Combines the two tracks above (DeFi/onchain finance **or** agentic economy) for continuity projects. Same "what we're looking for" and core products as those tracks. Must be registered as a Continuity Project under the Continuity Track.

---

### 🏆 Launch on Arc Testnet & Push to Mainnet — $3,500 (🥇 $2,500 · 🥈 $1,000)

Add a working Arc integration — not just a prototype, something ready to ship to mainnet.

**What they're looking for**

- USDC or EURC payment flows on Arc added to a commerce, fintech, or wallet product
- Crosschain transfers or unified balance integrated into a production project, with Arc as the core settlement layer
- Agentic payments shipped into an AI agent or API monetization tool
- Stablecoin settlement or escrow logic on Arc added to a DeFi protocol or marketplace
- Arc-powered treasury or FX features built into a multi-chain product

**Note:** Projects must be deployed or deployment-ready on **Arc mainnet by September 30**.

---

### 🏆 Launch on Arc Testnet & Push to Mainnet — $1,500 (Continuity Track participants only)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Take a project you own — an existing MVP, open-source repo, or live product — and add a working Arc integration, ready to ship to mainnet. Same criteria as the $3,500 track, applied to an existing project.

**Note:** Projects must be deployed or deployment-ready on **Arc mainnet by September 30**.

---

### Resources

- Arc Docs — https://docs.arc.io/
- App Kits — https://docs.arc.io/app-kit
- Circle Dev Docs — https://developers.circle.com/
- Agent Stack Starter Kit — https://github.com/circlefin/agent-stack-starter-kits

---

### How Arc could fit GlobalCare.ai

- Strong fit — GlobalCare.ai already plans **USDC escrow**. Building that escrow/payment leg on **Arc with USDC** targets the **Best DeFi/Onchain Finance** track directly, and "stablecoin settlement or escrow logic on a marketplace" is called out explicitly under the **Launch on Arc → Mainnet ($3,500)** track.
- The AI chat agent paying for services (quotes, flights/hotels) with USDC via **Agent Stack + Nanopayments** maps to the **Agentic Economy** track — and could double-dip conceptually with the Hedera x402 idea.
- Watch the deadline: mainnet tracks require **deploy / deploy-ready on Arc mainnet by Sep 30**. Every Arc track needs a **frontend + backend + architecture diagram + video demo**.

---

## Privy — $5,000

- **Website:** https://www.privy.io/
- **X / Twitter:** https://x.com/privy_io

**About:** Privy helps developers build secure, seamless onchain experiences. Use Privy's SDKs and APIs to add flexible authentication, create embedded self-custodial wallets, and power wallet interactions across web and mobile — without requiring users to manage seed phrases.

### Prize breakdown

| Track | Payout |
|-------|--------|
| 🏢 Best B2B financial product | $2,500 |
| 💸 Best financial flow | $2,500 |

---

### 🏢 Best B2B financial product — $2,500

Build a product that helps businesses manage digital assets and financial operations with Privy — treasury platforms, business accounts, payroll, spend management, payment operations, or shared organization wallets. Strong submissions use Privy for secure business workflows: organization wallets, policies, team permissions, quorum approvals, intents, automated transactions, or event-driven operations.

**Qualification requirements**

- Integrate Privy as a core part of the product
- Create or use at least one Privy wallet
- Demonstrate a business or organization use case
- Implement at least one functional B2B workflow — payment, approval, treasury operation, or wallet administration flow
- Use at least one Privy control — policies, signers, key quorums, or intents
- Provide a working demo and access to the project's source code
- Clearly explain how Privy enables the product

---

### 💸 Best financial flow — $2,500

Build a seamless experience for funding, moving, trading, growing, or spending digital assets with Privy — payments, remittances, cross-chain transfers, stablecoin conversions, swaps, savings, payouts, or card-like spending products. Strong submissions use Privy wallet actions or funding tools to simplify a real flow and hide onchain complexity.

**Qualification requirements**

- Integrate Privy as a core part of the product
- Create or use at least one Privy wallet
- Complete at least one functional financial flow using a generally available Privy feature
- Eligible flows: transfers, bridging, stablecoin conversions, swaps, self-service Earn vaults, onramps, or other supported wallet actions
- Provide a working demo and access to the project's source code
- Clearly explain how Privy improves the user experience
- Features requiring commercial/guided onboarding may be mocked but do not count as the required functional integration
- Note: Privy Cards currently needs guided Privy + Bridge onboarding — a mocked card experience is allowed but another live Privy flow is required for eligibility

**Links and resources**

- Privy documentation — https://docs.privy.io/
- Privy quickstart — https://docs.privy.io/basics/get-started/quickstart

---

### How Privy could fit GlobalCare.ai

- Direct fit — Privy is already your preferred wallet. The **embedded self-custodial wallet** (no seed phrases) is ideal for non-crypto medical patients, and using it as the wallet layer for your escrow flow can target **Best financial flow** (a real transfer/stablecoin flow that hides onchain complexity).
- Escrow release governed by **policies / key quorums / intents** (patient + trustees) maps onto the **B2B / organization wallet** controls.

---

## Uniswap Foundation — $5,000

- **Website:** https://www.uniswapfoundation.org/build
- **X / Twitter:** https://x.com/UniswapFND

**About:** The Uniswap Protocol is one of the largest decentralized exchange protocols for swapping value onchain across Ethereum and other chains. The ecosystem is a full-stack platform for onchain finance — smart contracts (v2, v3, v4), developer tools, APIs, and emerging infrastructure like Unichain — letting developers build on shared, permissionless liquidity.

### Prize breakdown

| Track | Total | Payout |
|-------|-------|--------|
| 🦄 Best Uniswap Stack Contribution | $3,000 | Up to 3 teams × $1,000 |
| 🦄 Best Uniswap Stack Contribution (Continuity only) | $2,000 | 🥇 $1,000 · 🥈 $1,000 |

> **Required for every Uniswap submission:** a public GitHub repo with open-source code, a **FEEDBACK.md** file, and a completed **Uniswap Developer Feedback Form** (https://developers.uniswap.org/hackathon-feedback) linking to your FEEDBACK.md. README must clearly point to the relevant contracts/lines of code so judges can verify the integration. Submissions without this are audited before winners are finalized.

---

### 🦄 Best Uniswap Stack Contribution — $3,000 (up to 3 teams × $1,000)

Build on or integrate any part of the Uniswap stack — the Uniswap API, the AMM (v2, v3, or v4), CCA, or any other Uniswap protocol. Includes new v4 hooks, extensions/improvements to official Uniswap repos, and tooling or solutions for the broader ecosystem.

---

### 🦄 Best Uniswap Stack Contribution (Continuity) — $2,000 (🥇 $1,000 · 🥈 $1,000)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Same scope as above, for continuity projects extending an existing repo/product.

**Links and resources**

- Uniswap Docs — https://developers.uniswap.org/docs
- Uniswap Developer Platform — https://developers.uniswap.org/dashboard
- Uniswap Developer Support — https://developers.uniswap.org/docs?form=help
- Uniswap Hackathon Feedback — https://developers.uniswap.org/hackathon-feedback
- Uniswap AI — https://github.com/Uniswap/uniswap-ai

---

### How Uniswap could fit GlobalCare.ai

- Fits your existing plan to **swap to USDC before escrow**. Using the **Uniswap API or v4** to convert whatever token the patient holds into USDC at booking time is a clean, load-bearing integration for **Best Uniswap Stack Contribution**.
- Bonus leverage: a **v4 hook** around the swap (e.g. fee routing to GlobalCare, or slippage guard for medical payments) scores higher than a plain swap. Don't forget the **FEEDBACK.md + feedback form** — it's mandatory.

---

## ENS — $5,000

- **Website:** https://ens.domains/
- **X / Twitter:** https://x.com/ensdomains

**About:** ENS is the universal pointer for anything on the internet — turning wallet addresses into human-readable names like yourname.eth: a portable, onchain profile that works across every app, chain, and wallet. Developers use ENS to replace raw addresses with real identities, build decentralized websites, and create scalable subname ecosystems. As AI agents become onchain actors, ENS gives them a name, a reputation, and a place to be found.

### Prize breakdown

| Track | Total | Payout |
|-------|-------|--------|
| 🧬 Best Use of ENSv2 | $4,500 | 🥇 $1,500 · 🥈 $1,500 · 🥉 $1,000 · 🏅 Runner-up $500 |
| 🔗 Best Integration of ENSv2 into an Existing Project (Continuity only) | $500 | $500 |

> **Note:** ENSv2 beta is live on **Sepolia** — every track requires building on ENSv2 (Sepolia), with ENSv2 features central (not cosmetic), a functional demo (no hard-coded values), open-source code, and a video and/or live demo link.

---

### 🧬 Best Use of ENSv2 — $4,500 (🥇 $1,500 · 🥈 $1,500 · 🥉 $1,000 · 🏅 $500)

Be among the first to build on ENSv2. Explore the new hierarchical registry: resolve subnames off a parent's resolver with wildcard resolution, or deploy your own subname registry to tokenize and manage subnames under your own rules. Use **Enhanced Access Control** (shared, role-based permissions behind registries and resolvers) to delegate specific rights — e.g. letting an account edit only certain text records. Give subnames their own **Permissioned Resolver**, mix in record aliasing or namespace aliasing, and build expiring, revocable, non-transferable, or forever subname setups. **Bonus points for AI agents** — agents as namespaces, each with their own identity and permissions.

**Qualification requirements**

- Built on ENSv2 (Sepolia); ENSv2 features central, not cosmetic
- Functional demo, no hard-coded values
- Video recording and/or live demo link
- Open-source code on GitHub or similar

**Links and resources**

- Permissioned Registry docs — https://docs.ens.domains/ensv2/permissioned-registry
- Permissioned Resolver docs — https://docs.ens.domains/ensv2/permissioned-resolver
- Enhanced Access Control docs — https://docs.ens.domains/ensv2/enhanced-access-control
- Guide for Contract Developers — https://docs.ens.domains/ensv2/tutorial-contract-developers

---

### 🔗 Best Integration of ENSv2 into an Existing Project — $500 (Continuity only)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Integrate ENSv2's feature set (registry hierarchy, Enhanced Access Control, Permissioned Resolvers, record/namespace aliasing) into an existing project's testnet deployment to improve UX or unlock new use cases. Pairs well with AI agent identity — give agents their own namespace and delegated permissions.

**Qualification requirements**

- Uses ENSv2 on Sepolia, targeting an existing project's testnet deployment
- Clear how ENSv2 improves the project (not cosmetic)
- Functional demo, no hard-coded values; video and/or live demo; open-source code

**Additional resources**

- Guide for App Developers — https://docs.ens.domains/ensv2/tutorial-app-developers
- ENSv2 Docs — https://docs.ens.domains/ensv2/overview
- Building with AI — https://docs.ens.domains/building-with-ai/
- Agent-native CLI — https://github.com/ensdomains/ens-cli
- AI Agent Registry ENS Name Verification (ENSIP-25) — https://docs.ens.domains/ensip/25/
- Agent Text Records (ENSIP-26) — https://docs.ens.domains/ensip/26/

---

### How ENS could fit GlobalCare.ai

- Give each **clinic/hospital a subname** (e.g. `acibadem.globalcare.eth`) with a Permissioned Resolver holding its verified profile — a clean trust/identity layer patients can read.
- Strong AI-agent angle: name your **GlobalCare AI agent as an ENS namespace** with delegated permissions (ties into the Hedera/Arc agentic tracks). Remember it must be on **ENSv2 Sepolia** and central to the product.

---

## 1inch — $7,000

- **Website:** https://1inch.com/
- **X / Twitter:** https://x.com/1inch

**About:** 1inch is a network of decentralized protocols unifying DeFi liquidity — best known for its DEX aggregator (launched 2019). Its latest release, **Aqua**, reimagines DEX design with self-custodial liquidity provisioning, letting users earn yield on their tokens without depositing them into another contract.

### Prize breakdown

| Track | Total | Payout |
|-------|-------|--------|
| 💧 Build an Aqua App | $5,000 | 🥇 $2,500 · 🥈 $1,500 · 🥉 $1,000 |
| 💦 Build an Aqua App (Continuity only) | $2,000 | 🥇 $1,500 · 🥈 $500 |

> **Note:** Both tracks favour projects that use **SwapVM** (higher scoring). Official Aqua/SwapVM contracts must be used; onchain token-transfer execution must be shown in the demo (local forks OK); proper Git commit history required (no single final-day commit).

---

### 💧 Build an Aqua App — $5,000 (🥇 $2,500 · 🥈 $1,500 · 🥉 $1,000)

Create a custom Aqua app that implements a sophisticated DeFi position. If you use SwapVM, you may modify SwapVM opcodes and define your own instructions. Final positions must be demonstrated via test scripts or a UI. Projects using SwapVM score higher.

**Qualification requirements**

- Official Aqua/SwapVM contracts must be used (redeployments of a modified SwapVM contract allowed)
- Onchain execution of token transfers presented during the demo (local forks OK)
- Proper Git commit history (no single-commit entries on the final day)

---

### 💦 Build an Aqua App — Continuity Track — $2,000 (🥇 $1,500 · 🥈 $500)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Same challenge and qualification requirements as above, for continuity projects.

**Links and resources**

- SwapVM Smart Contracts — https://github.com/1inch/swap-vm/tree/main
- Aqua Smart Contracts — https://github.com/1inch/aqua
- Aqua SDK — https://github.com/1inch/sdks/tree/master/typescript/aqua
- SwapVM Whitepaper — https://github.com/1inch/swap-vm/blob/release/1.1/docs/whitepaper-swap-vm-1.0.pdf
- Aqua Whitepaper — https://github.com/1inch/aqua/blob/main/docs/whitepaper-aqua-1.0.pdf

---

### How 1inch could fit GlobalCare.ai

- Narrower fit — this track is specifically about **Aqua/SwapVM DeFi positions**, which is further from a medical-tourism payment flow. Viable only if you frame the token→USDC conversion (or a yield-on-idle-escrow position) as an **Aqua app using SwapVM** — otherwise the Uniswap track is the easier swap integration.
- If you do pursue it, SwapVM usage + real onchain transfers in the demo are what score.

---

## World — $7,000

- **Website:** https://world.org/
- **X / Twitter:** https://x.com/worldnetwork
- **Developer Portal:** https://developer.world.org/ · Sandbox access form: https://forms.gle/mqbaiwMvX5MzmKdY8

**About:** World's developer stack helps builders create products for verified humans and AI-assisted interactions. **World ID** confirms someone is a unique human without revealing their identity. **AgentKit** identifies when agents are backed by real humans (not bots/scripts), so products can grant access, authorization, or execution rights on that basis. **Selfie Check** is a low-friction, selfie-based credential confirming a real, live person is behind the screen — no Orb required.

### Prize breakdown

| Track | Total | Payout |
|-------|-------|--------|
| 🤖 AgentKit (Continuity only) | $3,500 | Up to 3 teams × $1,166 |
| 🤳 Selfie Check | $3,500 | Up to 3 teams × $1,166 |

> **Note:** Both tracks require a **feedback document** covering the docs/integration flow, Developer Portal navigation, and Sandbox App states/proof flows/errors — what was confusing, missing, broken, or hard to test. Use the **World ID Sandbox App** to test remotely.

---

### 🤖 AgentKit — $3,500 (Continuity only, up to 3 teams × $1,166)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Extend an existing project with AgentKit to distinguish a bot from an agent acting on behalf of a real, unique human. Explore durable human-backed agent authorization for access, commerce, rate limits, trust, and continuity across services.

**Qualification requirements**

- Uses AgentKit in a meaningful way
- Shows a working app
- Registers or resolves agents through AgentBook where relevant
- Uses the World ID Sandbox App to test remotely
- Includes the feedback document (AgentKit docs/flow, Portal navigation, Sandbox states/errors, what was confusing/broken)

**Links and resources**

- AgentKit — https://docs.world.org/agents/agent-kit/integrate
- AgentKit Repo — https://github.com/worldcoin/agentkit
- AgentBook registration — https://docs.world.org/agents/agent-kit/integrate#step-2-register-the-agent-in-agentbook

---

### 🤳 Selfie Check — $3,500 (up to 3 teams × $1,166)

Build and demo a realistic Selfie Check flow that validates where a low-friction, low-assurance biometric credential is useful for risk, eligibility, fairness, continuity, or abuse prevention.

**Qualification requirements**

- Uses Selfie Check (or a Selfie Check-compatible World ID credential flow) in a meaningful way
- Treats Selfie Check as a risk, eligibility, fairness, continuity, or abuse-prevention signal
- Includes the feedback document (Selfie Check docs/flow, Portal navigation, Sandbox states/errors, what was confusing/broken)
- Shows a working app

**Links and resources**

- Selfie Check — https://docs.world.org/world-id/credentials/11
- Selfie Check Sandbox Testing — https://docs.world.org/world-id/sandbox/testing-selfie-check
- Selfie Check (Beta) — https://docs.world.org/world-id/idkit/credentials#selfie-check-beta

---

### How World could fit GlobalCare.ai

- **Selfie Check** is the cleaner fit (open track, not Continuity-only): confirm a real, live patient is behind the screen before a virtual consult or before escrow release — a natural **abuse-prevention / eligibility** signal for a medical platform, and it needs no Orb so it stays low-friction for patients.
- **AgentKit** would prove your GlobalCare AI agent is acting on behalf of a real, verified human — but that track is **Continuity-only**, so it only applies if you register GlobalCare as a continuity project. Don't forget the mandatory **feedback document** either way.

---

## Bazantic — $3,000

- **Website:** https://bazantic.com/
- **X / Twitter:** https://x.com/bazantic

**About:** Bazantic simplifies AI development so developers build around outcomes, not integrations. With one integration, API providers turn their APIs into services agents can understand, use, and pay for. Developers pre-wire services into reusable building blocks. Bazantic lets you: deploy an **x402/MPP Gateway** for an API, deploy an **MCP Server** for an API, create custom domains for the gateway and MCP server, and create custom tool calls called **"Recipes"** that explain when, why, and how to use your service.

### Prize breakdown

| Track | Total | Payout |
|-------|-------|--------|
| 🤖 Help an Agent Use Your Hackathon Project (Continuity only) | $1,000 | Up to 2 teams × $500 |
| 🍳 Best Recipe using ETHGlobal Sponsor APIs | $1,000 | 🥇 $500 · 🥈 $300 · 🥉 $200 |
| 👨‍🍳 Agentify a New API | $1,000 | 🥇 $500 · 🥈 $300 · 🥉 $200 |

> **Common to all tracks:** create an account on bazantic.com, create an **x402/MPP Gateway** for your project, build a **Recipe**, provide your Bazantic username (email or GitHub handle) for attribution, and include a screen recording/video.

---

### 🤖 Help an Agent Use Your Hackathon Project — $1,000 (Continuity only, up to 2 teams × $500)

> Announcement: https://x.com/ETHGlobal/status/2056399209767866682

Can an agent use your project without you there to explain it? Give an agent clear, reusable guidance (a Recipe) about when your API service is useful, what it needs, and how to use the result — then prove it works. Give the same task to the same model twice: first with only raw API info, then with your Recipe. Show a meaningful, repeatable improvement.

**Qualification requirements**

- Create a Bazantic account and an x402/MPP Gateway for your project
- Create a Recipe explaining when/why/how to use your service
- Same prompt, model, settings, and API access in both tests; the Recipe is the only difference
- Show both results and identify the improvement (share inputs and results)
- Record a video walking through the difference in outcomes
- Provide the Bazantic account username for attribution

---

### 🍳 Best Recipe that uses ETHGlobal Hackathon Sponsor APIs — $1,000 (🥇 $500 · 🥈 $300 · 🥉 $200)

Real jobs rarely fit in one API call. Create a set of recipes using multiple APIs your project uses — a repeatable workflow that moves from one service to the next and completes a task neither could solve alone. (Example: Uniswap API `GET /swap` → feed the returned transactions into the 1inch Trace API to get logs by block number and tx hash.)

**Qualification requirements**

- Create a Bazantic account and an x402/MPP Gateway for your project
- Use at least one other service already on Bazantic OR from an ETHGlobal Online sponsor
- Create a recipe that uses both services in one working flow
- Final result must depend meaningfully on both services
- Demonstrate the completed task start-to-finish in a screen recording
- Provide the Bazantic account username for attribution

---

### 👨‍🍳 Agentify a New API — $1,000 (🥇 $500 · 🥈 $300 · 🥉 $200)

Bring a useful new API service into Bazantic, connect it with your hackathon project, and demonstrate something agents could not do before. Strongest submissions add a reusable new API service (not a one-off demo connection) and bring it into a recipe others can reuse.

**Qualification requirements**

- Create a Bazantic account and an x402/MPP Gateway for your project
- Add a service not previously on Bazantic AND not available via other sponsors when the event began
- Create a working Gateway for that service on Bazantic
- Create a recipe that uses both services in one working flow within your project
- Explain how other builders/agents could use the new service, shown in a screen recording
- Provide the Bazantic account username for attribution

---

### How Bazantic could fit GlobalCare.ai

- You already have internal APIs (`/api/flights`, `/api/hotels`, `/api/chat`). Wrapping one behind a **Bazantic x402/MPP Gateway + Recipe** turns it into something an agent can discover and pay for — a low-lift path to the **Agentify a New API** track.
- The **Best Recipe using Sponsor APIs** track stacks beautifully with your other integrations: e.g. a recipe chaining your flight/hotel API with a sponsor API (Uniswap/1inch swap, or a Graph subgraph query) into one booking-and-settlement flow — and it pairs with the x402 idea on Hedera.

---

---

_ETHGlobal — [Rules & Conduct](https://ethglobal.com/rules) · [Faucet](https://ethglobal.com/faucet)_
