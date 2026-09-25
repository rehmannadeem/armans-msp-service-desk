import type { Role } from "@/lib/types";

export class ForbiddenError extends Error {
  constructor(message = "You are not allowed to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Anyone signed in may submit a ticket for their own organization. */
export function canSubmitTicket(_role: Role): boolean {
  return true;
}

/** Anyone signed in may list/view tickets scoped to their own organization. */
export function canViewTickets(_role: Role): boolean {
  return true;
}

/** Only dispatchers and service managers can approve/change ticket routing. */
export function canDispatch(role: Role): boolean {
  return role === "dispatcher" || role === "service_manager";
}

/** Only technicians (and managers, for demo oversight) can request AI guidance and record decisions. */
export function canWorkTicket(role: Role): boolean {
  return role === "l1_technician" || role === "l2_technician" || role === "service_manager";
}

/** Only service managers can view the audit/evaluation view. */
export function canViewAudit(role: Role): boolean {
  return role === "service_manager";
}

/** Only service managers can record a QA evaluation of AI output. */
export function canRecordEvaluation(role: Role): boolean {
  return role === "service_manager";
}

/** Knowledge sources are read-only for everyone in V1; only shown to authenticated staff, not customers. */
export function canViewKnowledgeBase(role: Role): boolean {
  return role !== "customer";
}

export function assertPermission(allowed: boolean, message?: string): void {
  if (!allowed) {
    throw new ForbiddenError(message);
  }
}
