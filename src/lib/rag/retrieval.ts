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
  const { data: rawData, error } = await supabase.rpc("match_chunks", {
    tenant_id: params.tenantId,
    query_embedding: toVectorString(params.queryEmbedding),
    match_count: params.matchCount ?? 6,
  });

  const data = rawData as unknown as EvidenceChunk[] | null;

  if (error) {
    throw new Error(`RAG retrieval failed: ${error.message}`);
  }

  console.log(`[RAG] Retrieved ${data?.length || 0} chunks.`);
  if (data && data.length > 0) {
    console.log("[RAG] Top matches:", data.map(c => ({ id: c.id, similarity: c.similarity })));
  } else {
    console.log("[RAG] No matches found for embedding.");
  }

  return (data ?? []) as EvidenceChunk[];
}
