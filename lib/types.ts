export const ROLES = ["customer", "dispatcher", "l1_technician", "l2_technician", "service_manager"] as const;
export type Role = (typeof ROLES)[number];

export const TICKET_STATUSES = ["new", "triaged", "dispatcher_review", "assigned", "in_progress", "resolved", "escalated"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const CATEGORIES = [
  "authentication_failure",
  "gateway_timeout_unreachable",
  "client_configuration",
  "dns_after_connection",
  "mfa_expired_credentials",
  "route_split_tunnel",
  "connectivity_prerequisites",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Impact = "single_user" | "department" | "site_wide";
export type Urgency = "low" | "medium" | "high";
export type Priority = "P1" | "P2" | "P3" | "P4";
export type Queue = "L1_GENERAL" | "L2_NETWORK" | "L2_IDENTITY";
export type ApprovalStatus = "approved" | "pending_review" | "deprecated";
export type DecisionType = "approve" | "edit" | "reject" | "escalate" | "resolve";

export interface SessionUser {
  userId: string;
  organizationId: string;
  organizationName: string;
  role: Role;
  name: string;
  email: string;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  organization_id: string;
  chunk_text: string;
  section_locator: string;
  keywords: string[];
  category: Category | null;
  embedding: number[] | null;
  created_at: string;
  approval_status?: ApprovalStatus;
  document_title?: string;
  source_vendor?: string;
  source_reference?: string;
}

export interface Citation {
  document_id: string;
  document_title: string;
  source_vendor: string;
  source_reference: string;
  section_locator: string;
  chunk_id: string;
}
