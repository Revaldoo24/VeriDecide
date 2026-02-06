import { createClient } from "@supabase/supabase-js";

let cachedAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedAdmin;
}

export function resolveTenantId(headers: Headers) {
  const headerTenant = headers.get("x-tenant-id");
  const envTenant = process.env.DEMO_TENANT_ID;
  const tenantId = headerTenant || envTenant;
  if (!tenantId) {
    throw new Error("Missing tenant id. Provide x-tenant-id header or DEMO_TENANT_ID env.");
  }
  return tenantId;
}
