import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveTenantId } from "@/lib/auth/supabaseServer";
import { appendAudit } from "@/lib/audit/ledger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const outputId = String(body?.outputId || "").trim();
    const decision = String(body?.decision || "").toUpperCase();
    const justification = String(body?.justification || "").trim();

    if (!outputId || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
    }

    const tenantId = resolveTenantId(req.headers);
    const reviewerId = body?.reviewerId ?? req.headers.get("x-actor-id") ?? null;
    const supabase = getSupabaseAdmin();

    const { error: reviewError } = await supabase.from("reviews").insert({
      tenant_id: tenantId,
      output_id: outputId,
      reviewer_id: reviewerId,
      decision,
      justification,
    });

    if (reviewError) {
      throw new Error(reviewError.message);
    }

    const { error: updateError } = await supabase
      .from("outputs")
      .update({ status: decision })
      .eq("id", outputId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await appendAudit({
      tenantId,
      actorId: reviewerId,
      action: "HUMAN_REVIEW",
      entityType: "review",
      entityId: outputId,
      payload: { decision, justification },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
