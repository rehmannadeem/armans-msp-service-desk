import fs from "node:fs";

function parseEnv(file) {
  const out = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 1) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

const file = ".env.local";
if (!fs.existsSync(file)) {
  console.error("FAIL: .env.local is missing.");
  process.exit(1);
}

const env = parseEnv(file);
for (const key of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "OPENAI_API_KEY"]) {
  if (!env[key] || env[key].includes("replace-with")) {
    console.error(`FAIL: ${key} is missing or still a placeholder.`);
    process.exit(1);
  }
}

const supabaseUrl = env.SUPABASE_URL.replace(/\/$/, "");
const supa = await fetch(`${supabaseUrl}/rest/v1/organizations?select=id&limit=1`, {
  headers: { apikey: env.SUPABASE_ANON_KEY },
});
if (!supa.ok) {
  console.error("FAIL: Supabase API check returned", supa.status, await supa.text());
  process.exit(1);
}
console.log("PASS: Supabase project URL + publishable/anon key.");

const openai = await fetch("https://api.openai.com/v1/embeddings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    input: "MSP V1 configuration health check",
    encoding_format: "float",
  }),
});
if (!openai.ok) {
  console.error("FAIL: OpenAI API check returned", openai.status, await openai.text());
  process.exit(1);
}
const body = await openai.json();
const dims = body?.data?.[0]?.embedding?.length || 0;
if (dims !== 1536) {
  console.error("FAIL: Expected a 1536-dimensional embedding, got", dims);
  process.exit(1);
}
console.log("PASS: OpenAI embeddings API (1536 dimensions).");
console.log("LIVE CONFIG READY.");
