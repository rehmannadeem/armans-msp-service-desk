// Embedding provider abstraction.
//
// V1 ships only the deterministic embedder: a dependency-free, reproducible
// bag-of-words hash embedding. It requires no API key and no network call,
// so retrieval works identically in demo mode, in tests, and in CI. The
// vector dimension (1536) matches common embedding APIs so a real provider
// can be dropped in later behind the same `embed()` signature without a
// schema change (see README "Swapping in a real embedding provider").
export const EMBEDDING_DIMENSIONS = 1536;

function hashToken(token: string, dims: number): number {
  let hash = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % dims;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function embed(text: string, dims: number = EMBEDDING_DIMENSIONS): number[] {
  const vector = new Array(dims).fill(0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    const bucket = hashToken(token, dims);
    vector[bucket] += 1;
    // Also hash bigrams to capture short phrases like "gateway timeout".
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]}_${tokens[i + 1]}`;
    vector[hashToken(bigram, dims)] += 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  // Both vectors are already L2-normalized by embed(), so dot product ==
  // cosine similarity. Guard against callers passing raw vectors anyway.
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}
