import { handoffEscalation } from "@/lib/live/escalation";
import { after, NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { recommendFromApprovedKnowledge } from "@/lib/live/recommendation";
import { insertAuditLog, insertRows, patchRows, supabaseRest } from "@/lib/live/supabase";
import { NO_APPROVED_GUIDANCE } from "@/lib/safety/constants";
import type { LiveTicket } from "@/lib/live/types";

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
    const { matches, citations, abstain, recommendationText, ragMinSimilarity, embeddingModel } =
      await recommendFromApprovedKnowledge(token, queryText);

    const triageRuns = await supabaseRest<Array<{ id: string }>>(
      token,
      `ai_triage_runs?select=id&ticket_id=eq.${id}&order=created_at.desc&limit=1`,
    );
    const triageRunId = triageRuns[0]?.id ?? null;

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

    await insertAuditLog(token, {
      organization_id: user.organization_id,
      actor_user_id: user.id,
      actor_role: user.role,
      action: abstain ? "recommendation.abstain" : "recommendation.grounded",
      entity_type: "ticket",
      entity_id: id,
      details: { recommendation_id: recommendation?.id, match_count: matches.length },
    });

    if (abstain) after(() => handoffEscalation(token, user, ticket, "abstained", NO_APPROVED_GUIDANCE));
    return NextResponse.json({ recommendation, matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Guidance failed.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}