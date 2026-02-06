import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveTenantId } from "@/lib/auth/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req.headers);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("audit_ledger")
      .select("id, action, entity_type, entity_id, payload, created_at, hash, prev_hash")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
