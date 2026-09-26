import { NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { insertRows, patchRows, supabaseRest } from "@/lib/live/supabase";
import type { LiveTicket } from "@/lib/live/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { token, user } = await requireLiveUser();
    if (!["l1_technician", "l2_technician", "service_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Technician or service manager role required." }, { status: 403 });
    }
    const { id } = await context.params;
    const body = await request.json() as { decision?: "resolve" | "escalate"; notes?: string; edited_text?: string };
    if (!body.decision) return NextResponse.json({ error: "Decision is required." }, { status: 400 });

    const recs = await supabaseRest<Array<{ id: string }>>(
      token,
      `ai_recommendations?select=id&ticket_id=eq.${id}&order=created_at.desc&limit=1`,
    );
    const recommendationId = recs[0]?.id ?? null;
    const status = body.decision === "resolve" ? "resolved" : "escalated";

    const [ticket] = await patchRows<LiveTicket>(token, `tickets?id=eq.${id}`, {
      status,
      updated_at: new Date().toISOString(),
    });
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

    await insertRows(token, "human_decisions", {
      organization_id: user.organization_id,
      ticket_id: id,
      recommendation_id: recommendationId,
      decided_by: user.id,
      decision: body.decision,
      notes: body.notes || null,
      edited_text: body.edited_text || null,
    });

    await insertRows(token, "ticket_events", {
      organization_id: user.organization_id,
      ticket_id: id,
      event_type: body.decision === "resolve" ? "ticket_resolved" : "ticket_escalated",
      actor_user_id: user.id,
      actor_role: user.role,
      payload: { recommendation_id: recommendationId, notes: body.notes || null },
    });

    await insertRows(token, "audit_logs", {
      organization_id: user.organization_id,
      actor_user_id: user.id,
      actor_role: user.role,
      action: `ticket.${body.decision}`,
      entity_type: "ticket",
      entity_id: id,
      details: { recommendation_id: recommendationId, notes: body.notes || null },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decision failed.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}