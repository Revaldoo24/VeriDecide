export const EMBEDDING_DIM = 1536;

export function embedTextLocal(text: string) {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0);
  
  // Improved tokenization: keep alphanumeric (including Indonesian) and spaces
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Keep word characters (includes Indonesian letters)
    .split(/\s+/)
    .filter(Boolean);

  console.log(`[EMBEDDING] Input text: "${text.substring(0, 100)}..."`);
  console.log(`[EMBEDDING] Tokens extracted: ${tokens.length} tokens`);
  console.log(`[EMBEDDING] First 10 tokens: [${tokens.slice(0, 10).join(", ")}]`);

  if (tokens.length === 0) {
    console.error("[EMBEDDING] ❌ ERROR: No tokens extracted! This will produce a zero vector.");
    console.error("[EMBEDDING] Original text:", text);
    return vector; // Return zero vector (will cause low similarity)
  }

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = hash % EMBEDDING_DIM;
    vector[index] += 1;
  }

  const normalized = normalize(vector);
  const nonZeroCount = normalized.filter(v => v !== 0).length;
  console.log(`[EMBEDDING] Vector generated: ${nonZeroCount} non-zero dimensions out of ${EMBEDDING_DIM}`);
  
  return normalized;
}

export function toVectorString(vector: number[]) {
  return `[${vector.join(",")}]`;
}

function hashToken(token: string) {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash << 5) - hash + token.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalize(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}
