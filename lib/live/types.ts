export type LiveRole = "customer" | "dispatcher" | "l1_technician" | "l2_technician" | "service_manager";
export type LiveTicketStatus = "new" | "triaged" | "dispatcher_review" | "assigned" | "in_progress" | "resolved" | "escalated" | "closed";

export interface LiveUser {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: LiveRole;
}

export interface LiveTicket {
  id: string;
  organization_id: string;
  submitted_by: string | null;
  subject: string;
  description: string;
  status: LiveTicketStatus;
  category: string | null;
  impact: string | null;
  urgency: string | null;
  priority: string | null;
  queue: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface RankedChunk {
  id: string;
  document_id: string;
  section: string | null;
  source_locator: string | null;
  chunk_text: string;
  similarity: number;
}
