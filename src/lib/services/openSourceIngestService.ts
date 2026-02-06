import crypto from "crypto";
import { getSupabaseAdmin } from "../auth/supabaseServer";
import { embedTextLocal, toVectorString } from "../rag/embedding";

export type SearchResult = {
  title: string;
  link: string;
  snippet?: string;
};

export type IngestReport = {
  query: string;
  attempted: number;
  ingested: number;
  skipped: number;
  skippedDomains: Array<{ url: string; host: string; reason: string }>;
  errors: Array<{ url: string; reason: string }>;
  debug?: {
    allowlist: string[];
    provider: string;
  };
};

const DEFAULT_ALLOWLIST = [
  "gov",
  "edu",
  "who.int",
  "oecd.org",
  "un.org",
  "worldbank.org",
  "wto.org",
  "weforum.org",
  "europa.eu",
  "legislation.gov",
];

export async function ingestOpenSourceEvidence(params: {
  tenantId: string;
  query: string;
  maxResults?: number;
}) {
  const enabled = (process.env.OPEN_SOURCE_ENABLED || "false").toLowerCase() === "true";
  if (!enabled) {
    throw new Error("Open-source ingestion is disabled. Set OPEN_SOURCE_ENABLED=true.");
  }

  const results = await searchWeb(params.query, params.maxResults ?? 6);
  const allowlist = parseAllowlist();
  const supabase = getSupabaseAdmin();
  const report: IngestReport = {
    query: params.query,
    attempted: results.length,
    ingested: 0,
    skipped: 0,
    skippedDomains: [],
    errors: [],
    debug: {
      allowlist,
      provider: (process.env.SERP_PROVIDER || "").toLowerCase(),
    },
  };

  for (const result of results) {
    if (!isAllowed(result.link, allowlist)) {
      report.skipped += 1;
      report.skippedDomains.push({
        url: result.link,
        host: safeHost(result.link),
        reason: allowlist.length === 0 ? "Allowlist empty? expected allow-all" : "Domain not in allowlist",
      });
      continue;
    }

    try {
      const text = await fetchPageText(result.link);
      if (!text) {
        report.errors.push({ url: result.link, reason: "Empty body" });
        report.skippedDomains.push({
          url: result.link,
          host: safeHost(result.link),
          reason: "Empty body",
        });
        report.skipped += 1;
        continue;
      }

      const checksum = crypto.createHash("sha256").update(text).digest("hex");
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          tenant_id: params.tenantId,
          title: result.title || "Open Source Evidence",
          source_uri: result.link,
          source_type: "open_source",
        })
        .select("id")
        .single();

      if (docError || !doc) {
        report.errors.push({ url: result.link, reason: docError?.message || "Doc insert failed" });
        continue;
      }

      const { data: version, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          tenant_id: params.tenantId,
          document_id: doc.id,
          version: 1,
          content: text,
          checksum,
        })
        .select("id")
        .single();

      if (versionError || !version) {
        report.errors.push({ url: result.link, reason: versionError?.message || "Version insert failed" });
        continue;
      }

      const chunks = chunkText(text, 800);
      const payload = chunks.map((chunk, index) => ({
        tenant_id: params.tenantId,
        version_id: version.id,
        chunk_index: index,
        content: chunk,
        embedding: toVectorString(embedTextLocal(chunk)),
      }));

      const { error: chunkError } = await supabase.from("document_chunks").insert(payload);
      if (chunkError) {
        report.errors.push({ url: result.link, reason: chunkError.message });
        continue;
      }

      report.ingested += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      report.errors.push({ url: result.link, reason });
      report.skippedDomains.push({
        url: result.link,
        host: safeHost(result.link),
        reason,
      });
      report.skipped += 1;
    }
  }

  return report;
}

async function searchWeb(query: string, maxResults: number): Promise<SearchResult[]> {
  const provider = (process.env.SERP_PROVIDER || "").toLowerCase();
  const apiKey = process.env.SERP_API_KEY;
  const apiUrl = process.env.SERP_API_URL;

  if (!apiKey) {
    throw new Error("Missing SERP_API_KEY");
  }

  if (provider === "serper") {
    const response = await fetch(apiUrl || "https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: maxResults }),
    });

    if (!response.ok) {
      throw new Error(`Serper request failed: ${response.status}`);
    }

    const data = await response.json();
    const organic = data?.organic ?? [];
    return organic.slice(0, maxResults).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  }

  if (provider === "serpapi") {
    const url = new URL(apiUrl || "https://serpapi.com/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("num", String(maxResults));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    const organic = data?.organic_results ?? [];
    return organic.slice(0, maxResults).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  }

  throw new Error("SERP_PROVIDER must be set to 'serper' or 'serpapi'.");
}

async function fetchPageText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "VeriDecideBot/1.0 (+governed)"
    },
  });
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/pdf")) {
    return null;
  }

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const maxChars = Number(process.env.OPEN_SOURCE_MAX_CHARS || "8000");
  const body = stripped.slice(0, maxChars);
  if (!body) return null;
  return body;
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

function parseAllowlist() {
  const raw = process.env.OPEN_SOURCE_ALLOWLIST;
  if (raw === undefined) return DEFAULT_ALLOWLIST;
  if (raw.trim() === "") return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isAllowed(url: string, allowlist: string[]) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (allowlist.length === 0) return true;
    return allowlist.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "unknown";
  }
}
