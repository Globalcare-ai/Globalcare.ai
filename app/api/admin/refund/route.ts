import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/server";
import { sendFromEscrow, escrowConfigured, adminAuthorized } from "@/lib/escrow-server";
import { arcConfigured, readArcEscrow, refundOnArc } from "@/lib/blockchain/arc-server";
import { usdcDecimals, toUnits, arcPublicClient } from "@/lib/blockchain/usdc";

const EPS = 1e-9;

export async function POST(req: Request) {
  if (!adminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { journeyId?: string; refundId?: string; toPatient?: number; toCompany?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const { journeyId, refundId } = body;
  const toPatient = Number(body.toPatient) || 0;
  const toCompany = Number(body.toCompany) || 0;
  if (!journeyId) return NextResponse.json({ error: "journeyId required" }, { status: 400 });
  if (toPatient <= 0) return NextResponse.json({ error: "Refund to patient must be greater than 0" }, { status: 400 });

  const s = createServerClient();
  const { data: escs } = await s.from("escrow").select("*").eq("journey_id", journeyId).order("created_at", { ascending: false }).limit(1);
  const esc = escs?.[0];
  if (!esc) return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  if (!esc.patient_wallet) return NextResponse.json({ error: "Patient wallet not set on escrow" }, { status: 400 });
  if (toCompany > 0 && !esc.company_wallet) return NextResponse.json({ error: "Company wallet not set on escrow — cannot send the company split" }, { status: 400 });

  const remaining = Number(esc.deposited_amount) - Number(esc.released_amount) - Number(esc.refunded_amount);
  if (toPatient + toCompany > remaining + EPS) return NextResponse.json({ error: "Refund + company split exceeds remaining escrow balance" }, { status: 400 });

  const isArc = esc.network === "arc-testnet";
  let hashP: string;
  let hashC: string | null = null;

  if (isArc) {
    // one contract call settles both legs atomically
    if (!arcConfigured()) return NextResponse.json({ error: "Arc escrow is not configured on the server." }, { status: 500 });
    try {
      const onChain = await readArcEscrow(journeyId);
      if (onChain.status === "none") return NextResponse.json({ error: "No escrow funded on Arc for this journey" }, { status: 400 });
      const decimals = await usdcDecimals(arcPublicClient());
      const unitsPatient = toUnits(toPatient, decimals);
      const unitsCompany = toUnits(toCompany, decimals);
      if (unitsPatient + unitsCompany > onChain.remaining) {
        return NextResponse.json({ error: "Refund exceeds the remaining balance held on-chain" }, { status: 400 });
      }
      hashP = await refundOnArc(journeyId, unitsPatient, unitsCompany);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Arc refund failed" }, { status: 500 });
    }
  } else {
    if (!escrowConfigured()) return NextResponse.json({ error: "ESCROW_PRIVATE_KEY not configured on the server." }, { status: 500 });
    try { hashP = await sendFromEscrow(esc.patient_wallet, toPatient, esc.token); }
    catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Refund failed" }, { status: 500 }); }

    if (toCompany > 0 && esc.company_wallet) {
      try { hashC = await sendFromEscrow(esc.company_wallet, toCompany, esc.token); }
      catch (e) { return NextResponse.json({ error: `Patient refunded (${hashP}) but company split failed: ${e instanceof Error ? e.message : "error"}` }, { status: 500 }); }
    }
  }

  const newRefunded = Number(esc.refunded_amount) + toPatient;
  const newReleased = Number(esc.released_amount) + toCompany;
  const status = toPatient >= remaining - EPS ? "refunded" : "partially_refunded";
  await s.from("escrow").update({ refunded_amount: newRefunded, released_amount: newReleased, status }).eq("id", esc.id);

  const now = new Date().toISOString();
  if (refundId) {
    await s.from("refunds").update({ status: "refunded", amount: toPatient, to_company: toCompany, refund_tx_hash: hashP }).eq("id", refundId);
  } else {
    await s.from("refunds").insert({ journey_id: journeyId, escrow_id: esc.id, requested_by: "admin", reason: "Admin-initiated refund", amount: toPatient, to_company: toCompany, status: "refunded", refund_tx_hash: hashP });
  }
  await s.from("journeys").update({ status: "cancelled", escrow_status: status, updated_at: now }).eq("id", journeyId);
  return NextResponse.json({ ok: true, hash: hashP, companyHash: hashC, status });
}
