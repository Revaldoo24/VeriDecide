import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, resolveTenantId } from "@/lib/auth/supabaseServer";
import { embedTextLocal, toVectorString } from "@/lib/rag/embedding";
import { appendAudit } from "@/lib/audit/ledger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const content = String(body?.content || "").trim();
    const sourceUri = String(body?.sourceUri || "").trim();

    if (!title || !content) {
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

    const chunks = chunkText(content, 800);
    const payload = chunks.map((chunk, index) => ({
      tenant_id: tenantId,
      version_id: version.id,
      chunk_index: index,
      content: chunk,
      embedding: toVectorString(embedTextLocal(chunk)),
    }));

    const { error: chunkError } = await supabase.from("document_chunks").insert(payload);
    if (chunkError) {
      throw new Error(chunkError.message);
    }

    await appendAudit({
      tenantId,
      actorId,
      action: "DOCUMENT_INGESTED",
      entityType: "document",
      entityId: doc.id,
      payload: { title, sourceUri, chunkCount: chunks.length },
    });

    return NextResponse.json({ documentId: doc.id, versionId: version.id, chunks: chunks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
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
