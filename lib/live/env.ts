export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getLiveConfig() {
  return {
    supabaseUrl: requireEnv("SUPABASE_URL").replace(/\/$/, ""),
    supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
    openaiApiKey: requireEnv("OPENAI_API_KEY"),
    openaiModel: process.env.OPENAI_MODEL || "gpt-5.6-luna",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    ragMinSimilarity: Number(process.env.RAG_MIN_SIMILARITY || "0.35"),
  };
}
