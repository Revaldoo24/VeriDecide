import crypto from "crypto";
import { getSupabaseAdmin } from "../auth/supabaseServer";

export async function appendAudit(entry: {
  tenantId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload: unknown;
}) {
  const supabase = getSupabaseAdmin();

  const { data: last } = await supabase
    .from("audit_ledger")
    .select("hash")
    .eq("tenant_id", entry.tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevHash = last?.hash ?? "";
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ ...entry, prevHash }))
    .digest("hex");

  const { error } = await supabase.from("audit_ledger").insert({
    tenant_id: entry.tenantId,
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    payload: entry.payload,
    prev_hash: prevHash,
    hash,
  });

  if (error) {
    throw new Error(`Audit append failed: ${error.message}`);
  }
}
