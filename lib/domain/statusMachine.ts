import type { TicketStatus } from "@/lib/types";

// Explicit allow-list of ticket status transitions. Keeping this as a pure, table-driven
// function makes the whole lifecycle ("Ticket intake -> AI triage -> dispatcher review ->
// technician assignment -> ... -> resolve/escalate") auditable and unit-testable in isolation
// from the database and API layer.
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ["triaged"],
  triaged: ["dispatcher_review"],
  dispatcher_review: ["assigned", "escalated"],
  assigned: ["in_progress", "resolved", "escalated"],
  in_progress: ["resolved", "escalated"],
  resolved: [],
  escalated: ["assigned"],
};

export class InvalidTransitionError extends Error {
  constructor(from: TicketStatus, to: TicketStatus) {
    super(`Cannot transition ticket from "${from}" to "${to}".`);
    this.name = "InvalidTransitionError";
  }
}

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: TicketStatus, to: TicketStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
