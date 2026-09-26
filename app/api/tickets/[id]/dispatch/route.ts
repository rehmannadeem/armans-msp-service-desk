import { NextResponse } from "next/server";
import { requireLiveUser } from "@/lib/live/auth";
import { insertRows, patchRows } from "@/lib/live/supabase";
import type { LiveTicket } from "@/lib/live/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { token, user } = await requireLiveUser();
    if (user.role !== "dispatcher" && user.role !== "service_manager") {
      return NextResponse.json({ error: "Dispatcher or service manager role required." }, { status: 403 });
    }
    const { id } = await context.params;
    const body = await request.json() as { queue?: string; assigned_to?: string; notes?: string };
    if (!body.queue) return NextResponse.json({ error: "Queue is required." }, { status: 400 });
    const assignee = body.assigned_to || user.id;

    const [ticket] = await patchRows<LiveTicket>(token, `tickets?id=eq.${id}`, {
      status: "assigned",
      queue: body.queue,
      assigned_to: assignee,
      updated_at: new Date().toISOString(),
    });
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

    await insertRows(token, "human_decisions", {
      organization_id: user.organization_id,
      ticket_id: id,
      recommendation_id: null,
      decided_by: user.id,
      decision: "approve",
      notes: body.notes || `Routing approved to ${body.queue}`,
    });
    await insertRows(token, "ticket_events", {
      organization_id: user.organization_id,
      ticket_id: id,
      event_type: "dispatcher_approved",
      actor_user_id: user.id,
      actor_role: user.role,
      payload: { queue: body.queue, assigned_to: assignee },
    });
    await insertRows(token, "audit_logs", {
      organization_id: user.organization_id,
      actor_user_id: user.id,
      actor_role: user.role,
      action: "ticket.dispatch",
      entity_type: "ticket",
      entity_id: id,
      details: { queue: body.queue, assigned_to: assignee },
    });
    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dispatch failed.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}