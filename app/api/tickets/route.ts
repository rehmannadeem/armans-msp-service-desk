import { NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { insertRows, patchRows, supabaseRest } from "@/lib/live/supabase";
import { triageTicket } from "@/lib/live/openai";
import { notifyTriaged } from "@/lib/live/n8n";
import type { LiveTicket } from "@/lib/live/types";

type TriageRunRow = { id: string };

export async function GET() {
  try {
    const { token } = await requireLiveUser();
    const tickets = await supabaseRest<LiveTicket[]>(token, "tickets?select=*&order=created_at.desc");
    return NextResponse.json({ tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tickets.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { token, user } = await requireLiveUser();
    const body = await request.json() as { subject?: string; description?: string };
    if (!body.subject?.trim() || !body.description?.trim()) {
      return NextResponse.json({ error: "Subject and description are required." }, { status: 400 });
    }

    const [ticket] = await insertRows<LiveTicket>(token, "tickets", {
      organization_id: user.organization_id,
      submitted_by: user.id,
      subject: body.subject.trim(),
      description: body.description.trim(),
      status: "new",
    });
    if (!ticket) throw new Error("Ticket insert returned no row.");

    await insertRows(token, "ticket_events", {
      organization_id: user.organization_id,
      ticket_id: ticket.id,
      event_type: "ticket_submitted",
      actor_user_id: user.id,
      actor_role: user.role,
      payload: { subject: ticket.subject },
    });

    const triage = await triageTicket(ticket.subject, ticket.description);
    const [triageRun] = await insertRows<TriageRunRow>(token, "ai_triage_runs", {
      organization_id: user.organization_id,
      ticket_id: ticket.id,
      model: triage.model,
      input_snapshot: { subject: ticket.subject, description: ticket.description },
      category: triage.output.category,
      impact: triage.output.impact,
      urgency: triage.output.urgency,
      priority: triage.output.priority,
      missing_information: triage.output.missing_information,
      suggested_queue: triage.output.suggested_queue,
      confidence: triage.output.confidence,
      raw_output: triage.raw,
      is_fallback: triage.isFallback,
    });

    const [updated] = await patchRows<LiveTicket>(
      token,
      `tickets?id=eq.${ticket.id}`,
      {
        status: "dispatcher_review",
        category: triage.output.category,
        impact: triage.output.impact,
        urgency: triage.output.urgency,
        priority: triage.output.priority,
        queue: triage.output.suggested_queue,
        updated_at: new Date().toISOString(),
      },
    );

    await insertRows(token, "ticket_events", {
      organization_id: user.organization_id,
      ticket_id: ticket.id,
      event_type: "ai_triaged",
      actor_user_id: user.id,
      actor_role: user.role,
      payload: { triage_run_id: triageRun?.id, ...triage.output, is_fallback: triage.isFallback },
    });

    await insertRows(token, "audit_logs", {
      organization_id: user.organization_id,
      actor_user_id: user.id,
      actor_role: user.role,
      action: "ticket.create_and_triage",
      entity_type: "ticket",
      entity_id: ticket.id,
      details: { triage_run_id: triageRun?.id, model: triage.model, is_fallback: triage.isFallback },
    });

    void notifyTriaged({
      ticketId: ticket.id,
      organizationId: user.organization_id,
      subject: ticket.subject,
      category: triage.output.category,
      confidence: triage.output.confidence,
    });

    return NextResponse.json({ ticket: updated ?? ticket, triage: triage.output, triage_run_id: triageRun?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket submission failed.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
