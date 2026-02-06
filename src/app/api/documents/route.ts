import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveTenantId } from "@/lib/auth/supabaseServer";
import { embedTextLocal, toVectorString } from "@/lib/rag/embedding";
import { appendAudit } from "@/lib/audit/ledger";

export async function POST(req: NextRequest) {
  try {
    console.log("[DOCUMENTS] Upload request received");
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const content = String(body?.content || "").trim();
    const sourceUri = String(body?.sourceUri || "").trim();

    console.log(`[DOCUMENTS] Title: "${title}", Content length: ${content.length} chars`);

    if (!title || !content) {
      console.error("[DOCUMENTS] ❌ Validation failed: Missing title or content");
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    const tenantId = resolveTenantId(req.headers);
    const actorId = body?.actorId ?? req.headers.get("x-actor-id") ?? null;
    const supabase = getSupabaseAdmin();

    const checksum = crypto.createHash("sha256").update(content).digest("hex");

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        tenant_id: tenantId,
        title,
        source_uri: sourceUri || null,
        source_type: "internal",
      })
      .select("id")
      .single();

    if (docError || !doc) {
      console.error("[DOCUMENTS] ❌ Failed to create document:", docError?.message);
      throw new Error(docError?.message || "Failed to create document.");
    }
    console.log(`[DOCUMENTS] ✓ Document created: ${doc.id}`);


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
      console.error("[DOCUMENTS] ❌ Failed to create version:", versionError?.message);
      throw new Error(versionError?.message || "Failed to create document version.");
    }
    console.log(`[DOCUMENTS] ✓ Version created: ${version.id}`);


    const chunks = chunkText(content, 800);
    console.log(`[DOCUMENTS] Chunking: ${chunks.length} chunks created`);
    
    console.log("[DOCUMENTS] Generating embeddings...");
    const payload = chunks.map((chunk, index) => {
      const embedding = embedTextLocal(chunk);
      console.log(`[DOCUMENTS]   Chunk ${index + 1}/${chunks.length}: ${chunk.length} chars, embedding dim: ${embedding.length}`);
      return {
        tenant_id: tenantId,
        version_id: version.id,
        chunk_index: index,
        content: chunk,
        embedding: toVectorString(embedding),
      };
    });

    console.log(`[DOCUMENTS] Inserting ${payload.length} chunks into database...`);
    const { error: chunkError } = await supabase.from("document_chunks").insert(payload);
    if (chunkError) {
      console.error("[DOCUMENTS] ❌ Failed to insert chunks:", chunkError.message);
      throw new Error(chunkError.message);
    }
    console.log(`[DOCUMENTS] ✓ All chunks inserted successfully`);


    await appendAudit({
      tenantId,
      actorId,
      action: "DOCUMENT_INGESTED",
      entityType: "document",
      entityId: doc.id,
      payload: { title, sourceUri, chunkCount: chunks.length },
    });

    console.log(`[DOCUMENTS] ✅ SUCCESS: Document "${title}" uploaded with ${chunks.length} chunks`);
    return NextResponse.json({ documentId: doc.id, versionId: version.id, chunks: chunks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DOCUMENTS] ❌ UPLOAD FAILED:", message);
    console.error("[DOCUMENTS] Error details:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function chunkText(text: string, size: number) {
  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + size));
    index += size;
  }
  return chunks;
}
