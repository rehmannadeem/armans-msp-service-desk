import { NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { createEmbedding } from "@/lib/live/openai";
import { getLiveConfig } from "@/lib/live/env";
import { insertRows, patchRows, supabaseRest } from "@/lib/live/supabase";
import { notifyAbstention } from "@/lib/live/n8n";
import type { LiveTicket, RankedChunk } from "@/lib/live/types";
import { NO_APPROVED_GUIDANCE } from "@/lib/safety/constants";

type RecommendationRow = { id: string; status: string; recommendation_text: string | null; citations: unknown };

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { token, user } = await requireLiveUser();
    if (!["l1_technician", "l2_technician", "service_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Technician or service manager role required." }, { status: 403 });
    }

    const { id } = await context.params;
    const tickets = await supabaseRest<LiveTicket[]>(token, `tickets?select=*&id=eq.${id}&limit=1`);
    const ticket = tickets[0];
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

    const queryText = `${ticket.subject} ${ticket.description}`;
    const embedding = await createEmbedding(queryText);
    const { ragMinSimilarity, embeddingModel } = getLiveConfig();

    const matches = await supabaseRest<RankedChunk[]>(token, "rpc/match_approved_knowledge_chunks", {
      method: "POST",
      body: JSON.stringify({
        query_embedding: embedding,
        match_threshold: ragMinSimilarity,
        match_count: 5,
      }),
    });

    const triageRuns = await supabaseRest<Array<{ id: string }>>(
      token,
      `ai_triage_runs?select=id&ticket_id=eq.${id}&order=created_at.desc&limit=1`,
    );
    const triageRunId = triageRuns[0]?.id ?? null;

    const abstain = matches.length === 0;
    const recommendationText = abstain
      ? NO_APPROVED_GUIDANCE
      : matches.map((match, index) => `${index + 1}. ${match.chunk_text} [${match.source_locator || match.section || "approved source"}]`).join("\n");

    const citations = matches.map((match) => ({
      document_id: match.document_id,
      chunk_id: match.id,
      section: match.section,
      source_locator: match.source_locator,
      similarity: match.similarity,
    }));

    const [recommendation] = await insertRows<RecommendationRow>(token, "ai_recommendations", {
      organization_id: user.organization_id,
      ticket_id: id,
      triage_run_id: triageRunId,
      status: abstain ? "no_approved_guidance" : "grounded",
      recommendation_text: recommendationText,
      citations,
      retrieval_query: queryText,
      retrieved_chunk_ids: matches.map((match) => match.id),
      model: `retrieval:${embeddingModel}`,
      is_fallback: false,
    });

    await patchRows<LiveTicket>(token, `tickets?id=eq.${id}`, {
      status: "in_progress",
      updated_at: new Date().toISOString(),
    });

    await insertRows(token, "ticket_events", {
      organization_id: user.organization_id,
      ticket_id: id,
      event_type: abstain ? "guidance_abstained" : "guidance_generated",
      actor_user_id: user.id,
      actor_role: user.role,
      payload: { recommendation_id: recommendation?.id, citations, threshold: ragMinSimilarity },
    });

    await insertRows(token, "audit_logs", {
      organization_id: user.organization_id,
      actor_user_id: user.id,
      actor_role: user.role,
      action: abstain ? "recommendation.abstain" : "recommendation.grounded",
      entity_type: "ticket",
      entity_id: id,
      details: { recommendation_id: recommendation?.id, match_count: matches.length },
    });

    if (abstain) void notifyAbstention({ ticketId: id, organizationId: user.organization_id, subject: ticket.subject });
    return NextResponse.json({ recommendation, matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Guidance failed.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}