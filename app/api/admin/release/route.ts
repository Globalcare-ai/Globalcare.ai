import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/server";
import { sendFromEscrow, escrowConfigured, adminAuthorized } from "@/lib/escrow-server";

const EPS = 1e-9;

export async function POST(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!escrowConfigured()) return NextResponse.json({ error: "ESCROW_PRIVATE_KEY not configured on the server." }, { status: 500 });

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
  const amount = Number(ms.amount);
  if (amount > remaining + EPS) return NextResponse.json({ error: "Release exceeds remaining escrow balance" }, { status: 400 });

  let hash: string;
  try { hash = await sendFromEscrow(esc.company_wallet, amount, esc.token); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Release failed" }, { status: 500 }); }

  const now = new Date().toISOString();
  await s.from("escrow_milestones").update({ status: "released", release_tx_hash: hash, completed_at: now, released_at: now }).eq("id", milestoneId);

  const { data: allMs } = await s.from("escrow_milestones").select("status").eq("escrow_id", esc.id);
  const allReleased = (allMs ?? []).every((m: { status: string }) => m.status === "released");
  await s.from("escrow").update({ released_amount: Number(esc.released_amount) + amount, status: allReleased ? "released" : "releasing" }).eq("id", esc.id);
  if (allReleased) {
    await s.from("journeys").update({ status: "confirmed", escrow_status: "released", updated_at: now }).eq("id", esc.journey_id);
  }
  return NextResponse.json({ ok: true, hash, allReleased });
}
