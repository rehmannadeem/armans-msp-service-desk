import { z } from "zod";
import { getLiveConfig } from "@/lib/live/env";
import { demoTriageAdapter } from "@/lib/llm/demoAdapter";
import type { TriageOutput } from "@/lib/llm/adapter";

const triageSchema = z.object({
  category: z.enum([
    "authentication_failure",
    "gateway_timeout_unreachable",
    "client_configuration",
    "dns_after_connection",
    "mfa_expired_credentials",
    "route_split_tunnel",
    "connectivity_prerequisites",
    "other",
  ]),
  impact: z.enum(["single_user", "department", "site_wide"]),
  urgency: z.enum(["low", "medium", "high"]),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  missing_information: z.array(z.string()),
  suggested_queue: z.enum(["L1_GENERAL", "L2_NETWORK", "L2_IDENTITY"]),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

async function openaiFetch(path: string, body: unknown): Promise<Response> {
  const { openaiApiKey } = getLiveConfig();
  return fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

type ResponsesPayload = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown }> }>;
};

function extractResponseText(json: unknown): string {
  const payload = json as ResponsesPayload;
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  throw new Error("OpenAI response did not contain text output.");
}

function parseJsonObject(text: string): unknown {
  const cleaned = text.trim().replace(/^\`\`\`json\s*/i, "").replace(/\`\`\`$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("OpenAI did not return a JSON object.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function triageTicket(
  subject: string,
  description: string,
): Promise<{ output: TriageOutput; model: string; isFallback: boolean; raw: unknown }> {
  const { openaiModel } = getLiveConfig();
  const prompt = [
    "You are an MSP service-desk triage engine for VPN incidents only.",
    "Return ONLY one JSON object with keys: category, impact, urgency, priority,",
    "missing_information, suggested_queue, confidence, rationale.",
    "Allowed categories: authentication_failure, gateway_timeout_unreachable, client_configuration,",
    "dns_after_connection, mfa_expired_credentials, route_split_tunnel, connectivity_prerequisites, other.",
    "Impact: single_user|department|site_wide. Urgency: low|medium|high.",
    "Priority: P1|P2|P3|P4. Queue: L1_GENERAL|L2_NETWORK|L2_IDENTITY.",
    "Do not invent facts missing from the ticket.",
    `Subject: ${subject}`,
    `Description: ${description}`,
  ].join("\n");

  try {
    const res = await openaiFetch("responses", { model: openaiModel, input: prompt });
    if (!res.ok) throw new Error(`OpenAI triage failed: ${res.status} ${await res.text()}`);
    const raw = await res.json();
    const output = triageSchema.parse(parseJsonObject(extractResponseText(raw)));
    return { output, model: openaiModel, isFallback: false, raw };
  } catch (error) {
    const output = demoTriageAdapter.triage({ subject, description });
    return {
      output,
      model: demoTriageAdapter.modelName,
      isFallback: true,
      raw: { fallback_reason: error instanceof Error ? error.message : String(error) },
    };
  }
}

export async function createEmbedding(text: string): Promise<number[]> {
  const { embeddingModel } = getLiveConfig();
  const res = await openaiFetch("embeddings", {
    model: embeddingModel,
    input: text,
    encoding_format: "float",
  });
  if (!res.ok) throw new Error(`OpenAI embedding failed: ${res.status} ${await res.text()}`);
  const json = await res.json() as { data?: Array<{ embedding?: number[] }> };
  const embedding = json.data?.[0]?.embedding;
  if (!embedding || embedding.length !== 1536) {
    throw new Error(`Expected 1536-dimension embedding, received ${embedding?.length ?? 0}.`);
  }
  return embedding;
}
