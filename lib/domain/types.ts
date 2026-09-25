// Shared domain types mirroring db/migrations/0001_init.sql.
// Keep in sync with the SQL check constraints — this file has no runtime
// effect on the database; it only gives the app compile-time safety.

export type Role =
  | "customer"
  | "dispatcher"
  | "l1_technician"
  | "l2_technician"
  | "service_manager";

export const ROLES: Role[] = [
  "customer",
  "dispatcher",
  "l1_technician",
  "l2_technician",
  "service_manager",
];

export type TicketStatus =
  | "new"
  | "triaged"
  | "dispatched"
  | "in_progress"
  | "resolved"
  | "escalated"
  | "closed";

export type ImpactLevel = "low" | "medium" | "high";
export type UrgencyLevel = "low" | "medium" | "high";
export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type VpnCategory =
  | "vpn_auth_failure"
  | "vpn_gateway_unreachable"
  | "vpn_client_config"
  | "vpn_dns_post_connect"
  | "vpn_mfa_credential"
  | "vpn_split_tunnel_routing"
  | "vpn_connectivity_prereq"
  | "vpn_other";

export interface TriageResult {
  category: VpnCategory;
  impact: ImpactLevel;
  urgency: UrgencyLevel;
  priority: PriorityLevel;
  missingInformation: string[];
  suggestedQueue: string;
  confidence: number;
  matchedKeywords: string[];
}

export type ApprovalStatus = "approved" | "pending" | "deprecated";

export type RecommendationStatus = "grounded" | "no_approved_guidance";

export type DecisionType = "approve" | "edit" | "reject" | "escalate" | "resolve";

export interface Citation {
  documentId: string;
  title: string;
  vendor: string | null;
  sourceReference: string;
  section: string | null;
  sourceLocator: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface AppUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface Ticket {
  id: string;
  organizationId: string;
  submittedBy: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  category: string | null;
  impact: string | null;
  urgency: string | null;
  priority: string | null;
  queue: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketEvent {
  id: string;
  organizationId: string;
  ticketId: string;
  eventType: string;
  actorUserId: string | null;
  actorRole: string | null;
  payload: unknown;
  createdAt: string;
}

export interface AiTriageRun {
  id: string;
  organizationId: string;
  ticketId: string;
  model: string;
  category: string | null;
  impact: string | null;
  urgency: string | null;
  priority: string | null;
  missingInformation: string[];
  suggestedQueue: string | null;
  confidence: number | null;
  isFallback: boolean;
  createdAt: string;
}

export interface AiRecommendation {
  id: string;
  organizationId: string;
  ticketId: string;
  triageRunId: string | null;
  status: RecommendationStatus;
  recommendationText: string | null;
  citations: Citation[];
  retrievalQuery: string | null;
  retrievedChunkIds: string[];
  model: string | null;
  isFallback: boolean;
  createdAt: string;
}

export interface HumanDecision {
  id: string;
  organizationId: string;
  ticketId: string;
  recommendationId: string | null;
  decidedBy: string;
  decision: DecisionType;
  notes: string | null;
  editedText: string | null;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  vendor: string | null;
  sourceReference: string;
  version: string | null;
  effectiveDate: string | null;
  approvalStatus: ApprovalStatus;
  content: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAt: string;
}
