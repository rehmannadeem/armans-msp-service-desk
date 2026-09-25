import type {
  AiRecommendation,
  AiTriageRun,
  AuditLog,
  Evaluation,
  HumanDecision,
  KnowledgeChunk,
  KnowledgeDocument,
  Organization,
  Role,
  Ticket,
  TicketEvent,
  TicketStatus,
  User,
} from "@/lib/types";

// Every read/write is scoped by organizationId. This is the application-layer
// half of tenant isolation; db/migrations/0002_rls.sql is the database-layer
// half. Neither implementation may bypass the organizationId filter.
export interface DataStore {
  getOrganizationBySlug(slug: string): Promise<Organization | null>;
  getOrganizationById(id: string): Promise<Organization | null>;
  listOrganizations(): Promise<Organization[]>;

  getUserById(organizationId: string, userId: string): Promise<User | null>;
  listUsersByRole(organizationId: string, role: Role): Promise<User[]>;
  listUsers(organizationId: string): Promise<User[]>;

  createTicket(
    organizationId: string,
    data: Pick<Ticket, "subject" | "description" | "submitted_by">
  ): Promise<Ticket>;
  getTicket(organizationId: string, ticketId: string): Promise<Ticket | null>;
  listTickets(
    organizationId: string,
    filter?: { status?: TicketStatus; assignedTo?: string }
  ): Promise<Ticket[]>;
  updateTicket(
    organizationId: string,
    ticketId: string,
    patch: Partial<
      Pick<
        Ticket,
        | "status"
        | "category"
        | "impact"
        | "urgency"
        | "priority"
        | "queue"
        | "assigned_to"
      >
    >
  ): Promise<Ticket>;

  addTicketEvent(
    organizationId: string,
    event: Omit<TicketEvent, "id" | "organization_id" | "created_at">
  ): Promise<TicketEvent>;
  listTicketEvents(organizationId: string, ticketId: string): Promise<TicketEvent[]>;

  createTriageRun(
    organizationId: string,
    data: Omit<AiTriageRun, "id" | "organization_id" | "created_at">
  ): Promise<AiTriageRun>;
  getLatestTriageRun(
    organizationId: string,
    ticketId: string
  ): Promise<AiTriageRun | null>;

  listKnowledgeDocuments(
    organizationId: string,
    filter?: { approvalStatus?: string }
  ): Promise<KnowledgeDocument[]>;
  getKnowledgeDocument(
    organizationId: string,
    documentId: string
  ): Promise<KnowledgeDocument | null>;
  listApprovedChunks(organizationId: string): Promise<KnowledgeChunk[]>;

  createRecommendation(
    organizationId: string,
    data: Omit<AiRecommendation, "id" | "organization_id" | "created_at">
  ): Promise<AiRecommendation>;
  getRecommendation(
    organizationId: string,
    recommendationId: string
  ): Promise<AiRecommendation | null>;
  listRecommendationsForTicket(
    organizationId: string,
    ticketId: string
  ): Promise<AiRecommendation[]>;

  createHumanDecision(
    organizationId: string,
    data: Omit<HumanDecision, "id" | "organization_id" | "created_at">
  ): Promise<HumanDecision>;
  listHumanDecisionsForTicket(
    organizationId: string,
    ticketId: string
  ): Promise<HumanDecision[]>;

  addAuditLog(
    organizationId: string,
    entry: Omit<AuditLog, "id" | "organization_id" | "created_at">
  ): Promise<AuditLog>;
  listAuditLogs(organizationId: string): Promise<AuditLog[]>;

  createEvaluation(
    organizationId: string,
    data: Omit<Evaluation, "id" | "organization_id" | "created_at">
  ): Promise<Evaluation>;
  listEvaluations(organizationId: string): Promise<Evaluation[]>;
}
