import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tenantId = process.env.DEMO_TENANT_ID;

if (!url || !key || !tenantId) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DEMO_TENANT_ID");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const title = "Regulatory Guidance: Data Retention";
const content = `Organizations handling regulated records must retain audit logs for a minimum of five years.
Retention policies should include immutable storage for finalized decisions and supporting evidence.

Regulatory reviewers must be able to trace every automated decision to its source documents.
Access logs and approval records should be available for forensic review and legal discovery.`;

const checksum = crypto.createHash("sha256").update(content).digest("hex");

const { data: existing } = await supabase
  .from("documents")
  .select("id")
  .eq("tenant_id", tenantId)
  .eq("title", title)
  .maybeSingle();

if (existing?.id) {
  console.log("Demo document already exists.");
  process.exit(0);
}

const { data: doc, error: docError } = await supabase
  .from("documents")
  .insert({ tenant_id: tenantId, title, source_uri: "internal://demo/regulatory-guidance" })
  .select("id")
  .single();

if (docError || !doc) {
  throw new Error(docError?.message || "Failed to create document.");
}

const { data: version, error: versionError } = await supabase
  .from("document_versions")
  .insert({
    tenant_id: tenantId,
    document_id: doc.id,
    version: 1,
    content,
    checksum,
  })
  .select("id")
  .single();

if (versionError || !version) {
  throw new Error(versionError?.message || "Failed to create document version.");
}

const chunks = content.split("\n\n").map((chunk, index) => ({
  chunk_index: index,
  content: chunk.trim(),
}));

const payload = chunks.map((chunk) => ({
  tenant_id: tenantId,
  version_id: version.id,
  chunk_index: chunk.chunk_index,
  content: chunk.content,
  embedding: toVectorString(embedTextLocal(chunk.content)),
}));

const { error: chunkError } = await supabase.from("document_chunks").insert(payload);

if (chunkError) {
  throw new Error(chunkError.message);
}

console.log("Seeded demo document and chunks.");

function embedTextLocal(text) {
  const dim = 1536;
  const vector = new Array(dim).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = hash % dim;
    vector[index] += 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function toVectorString(vector) {
  return `[${vector.join(",")}]`;
}

function hashToken(token) {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash << 5) - hash + token.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
