import { notifyEscalation } from "./n8n";
import { insertAuditLog } from "./supabase";
import type { LiveTicket, LiveUser } from "./types";

export function handoffEscalation(
  token: string, user: LiveUser, ticket: LiveTicket, event: "abstained" | "escalated", reason: string,
) {
  return notifyEscalation({
    ticket_id: ticket.id,
    tenant: ticket.organization_id,
    queue: ticket.queue || "L1_GENERAL",
    reason,
    timestamp: new Date().toISOString(),
  }, event, (details) => insertAuditLog(token, {
    organization_id: user.organization_id,
    actor_user_id: user.id,
    actor_role: user.role,
    action: "escalation.delivery_failed",
    entity_type: "ticket",
    entity_id: ticket.id,
    details,
  }));
}
