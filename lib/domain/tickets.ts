import type { SupabaseClient } from "@supabase/supabase-js";
import { assertTransition } from "@/lib/domain/statusMachine";
import { NotFoundError } from "@/lib/domain/errors";
import { writeAuditLog } from "@/lib/domain/audit";
import type { Actor, Role, SessionUser, Ticket, TicketEvent, TicketStatus } from "@/lib/types";

export interface TicketParticipant {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TicketWithRelations extends Ticket {
  submitted_by_user: TicketParticipant | null;
  assigned_technician: TicketParticipant | null;
}

// Relies on Postgres' default foreign-key naming (<table>_<column>_fkey), which the
// migrations in supabase/migrations/0001_core_schema.sql use unmodified so PostgREST
// can resolve these embeds automatically.
const TICKET_SELECT_WITH_RELATIONS =
  "*, submitted_by_user:users!tickets_submitted_by_fkey(id,name,email,role), " +
  "assigned_technician:users!tickets_assigned_technician_id_fkey(id,name,email,role)";

export interface CreateTicketInput {
  subject: string;
  description: string;
}

export async function createTicket(db: SupabaseClient, session: SessionUser, input: CreateTicketInput): Promise<Ticket> {
  const { data, error } = await db
    .from("tickets")
    .insert({
      organization_id: session.organizationId,
      submitted_by: session.userId,
      subject: input.subject,
      description: input.description,
      status: "new",
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to create ticket: ${error?.message}`);

  await recordTicketEvent(db, session, data.id, "ticket_submitted", { subject: input.subject });
  await writeAuditLog(db, session, { action: "ticket.create", entityType: "ticket", entityId: data.id });
  return data as Ticket;
}

/**
 * Tenant isolation, by design: every read is scoped by organization_id in the same
 * query that looks up the row, so a ticket id from another tenant simply does not
 * exist as far as this query is concerned (NotFoundError, not a leaked 403).
 * See tests/tenantIsolation.test.ts.
 */
export async function getTicketById(
  db: SupabaseClient,
  organizationId: string,
  ticketId: string,
): Promise<TicketWithRelations> {
  const { data, error } = await db
    .from("tickets")
    .select(TICKET_SELECT_WITH_RELATIONS)
    .eq("organization_id", organizationId)
    .eq("id", ticketId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load ticket: ${error.message}`);
  if (!data) throw new NotFoundError("Ticket");
  return data as unknown as TicketWithRelations;
}

export async function listTicketsForSession(db: SupabaseClient, session: SessionUser): Promise<TicketWithRelations[]> {
  let query = db
    .from("tickets")
    .select(TICKET_SELECT_WITH_RELATIONS)
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false });

  // Customers only ever see their own submissions; every internal role sees the
  // full org queue (dispatcher/technician/manager visibility is intentional).
  if (session.role === "customer") {
    query = query.eq("submitted_by", session.userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list tickets: ${error.message}`);
  return (data ?? []) as unknown as TicketWithRelations[];
}

export async function listTicketsAssignedTo(db: SupabaseClient, session: SessionUser): Promise<TicketWithRelations[]> {
  const { data, error } = await db
    .from("tickets")
    .select(TICKET_SELECT_WITH_RELATIONS)
    .eq("organization_id", session.organizationId)
    .eq("assigned_technician_id", session.userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to list assigned tickets: ${error.message}`);
  return (data ?? []) as unknown as TicketWithRelations[];
}

export async function recordTicketEvent(
  db: SupabaseClient,
  actor: Actor,
  ticketId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await db.from("ticket_events").insert({
    ticket_id: ticketId,
    organization_id: actor.organizationId,
    event_type: eventType,
    actor_id: actor.userId,
    actor_role: actor.role,
    payload,
  });
  if (error) throw new Error(`Failed to record ticket event: ${error.message}`);
}

export async function listTicketEvents(
  db: SupabaseClient,
  organizationId: string,
  ticketId: string,
): Promise<TicketEvent[]> {
  const { data, error } = await db
    .from("ticket_events")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load ticket events: ${error.message}`);
  return data ?? [];
}

export interface TransitionTicketStatusInput {
  ticketId: string;
  toStatus: TicketStatus;
  fields?: Record<string, unknown>;
}

export async function transitionTicketStatus(
  db: SupabaseClient,
  actor: Actor,
  input: TransitionTicketStatusInput,
): Promise<Ticket> {
  const current = await getTicketById(db, actor.organizationId, input.ticketId);
  assertTransition(current.status, input.toStatus);

  const { data, error } = await db
    .from("tickets")
    .update({ status: input.toStatus, updated_at: new Date().toISOString(), ...(input.fields ?? {}) })
    .eq("organization_id", actor.organizationId)
    .eq("id", input.ticketId)
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to update ticket status: ${error?.message}`);
  return data as Ticket;
}
