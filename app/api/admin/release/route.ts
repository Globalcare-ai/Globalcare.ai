import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/server";
import { sendFromEscrow, escrowConfigured, adminAuthorized } from "@/lib/escrow-server";
import { arcConfigured, readArcEscrow, releaseMilestoneOnArc } from "@/lib/blockchain/arc-server";
import { usdcDecimals, fromUnits, arcPublicClient } from "@/lib/blockchain/usdc";

const EPS = 1e-9;

export async function POST(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { milestoneId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const { milestoneId } = body;
  if (!milestoneId) return NextResponse.json({ error: "milestoneId required" }, { status: 400 });

  const s = createServerClient();
  const { data: ms } = await s.from("escrow_milestones").select("*").eq("id", milestoneId).single();
  if (!ms) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (ms.status === "released") return NextResponse.json({ ok: true, already: true, hash: ms.release_tx_hash });

  const { data: esc } = await s.from("escrow").select("*").eq("id", ms.escrow_id).single();
  if (!esc) return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  if (!esc.company_wallet) return NextResponse.json({ error: "Company wallet not set on escrow" }, { status: 400 });

  const remaining = Number(esc.deposited_amount) - Number(esc.released_amount) - Number(esc.refunded_amount);
  let amount = Number(ms.amount);
  if (amount > remaining + EPS) return NextResponse.json({ error: "Release exceeds remaining escrow balance" }, { status: 400 });

  const isArc = esc.network === "arc-testnet";
  let hash: string;

  if (isArc) {
    // Arc: the contract is the authority — verify on-chain state before signing anything.
    if (!arcConfigured()) return NextResponse.json({ error: "Arc escrow is not configured on the server." }, { status: 500 });
    try {
      const idx = Number(ms.idx) - 1; // DB milestones are 1-based, the contract is 0-based
      if (idx < 0 || idx > 2) return NextResponse.json({ error: "Invalid milestone index" }, { status: 400 });
      const onChain = await readArcEscrow(esc.journey_id);
      if (onChain.status === "none") return NextResponse.json({ error: "No escrow funded on Arc for this journey" }, { status: 400 });
      if (onChain.released[idx]) return NextResponse.json({ error: "Milestone already released on-chain" }, { status: 400 });
      const out = await releaseMilestoneOnArc(esc.journey_id, idx);
      hash = out.hash;
      const decimals = await usdcDecimals(arcPublicClient());
      // record what the chain ACTUALLY paid, at full precision. Rounding to cents here
      // makes the DB's "remaining" drift above the contract's, and a later refund of
      // that inflated remainder would revert with ExceedsRemaining.
      amount = Number(fromUnits(out.amount, decimals).toFixed(6));
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Arc release failed" }, { status: 500 });
    }
  } else {
    if (!escrowConfigured()) return NextResponse.json({ error: "ESCROW_PRIVATE_KEY not configured on the server." }, { status: 500 });
    try { hash = await sendFromEscrow(esc.company_wallet, amount, esc.token); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Release failed" }, { status: 500 }); }
  }

  const now = new Date().toISOString();
  await s.from("escrow_milestones").update({ status: "released", release_tx_hash: hash, amount, completed_at: now, released_at: now }).eq("id", milestoneId);

  const { data: allMs } = await s.from("escrow_milestones").select("status").eq("escrow_id", esc.id);
  const allReleased = (allMs ?? []).every((m: { status: string }) => m.status === "released");
  await s.from("escrow").update({ released_amount: Number(esc.released_amount) + amount, status: allReleased ? "released" : "releasing" }).eq("id", esc.id);
  if (allReleased) {
    await s.from("journeys").update({ status: "confirmed", escrow_status: "released", updated_at: now }).eq("id", esc.journey_id);
  }
  return NextResponse.json({ ok: true, hash, allReleased });
}
