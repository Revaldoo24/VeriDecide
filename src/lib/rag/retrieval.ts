import { getSupabaseAdmin } from "../auth/supabaseServer";
import { toVectorString } from "./embedding";

export type EvidenceChunk = {
  id: string;
  version_id: string;
  content: string;
  similarity: number;
};

export async function retrieveEvidence(params: {
  tenantId: string;
  queryEmbedding: number[];
  matchCount?: number;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("match_chunks", {
    tenant_id: params.tenantId,
    query_embedding: toVectorString(params.queryEmbedding),
    match_count: params.matchCount ?? 6,
  });

  if (error) {
    throw new Error(`RAG retrieval failed: ${error.message}`);
  }

  return (data ?? []) as EvidenceChunk[];
}
