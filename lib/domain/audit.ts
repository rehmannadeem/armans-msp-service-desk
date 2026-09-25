import type { SupabaseClient } from "@supabase/supabase-js";
import type { Actor, AuditLog, Evaluation, SessionUser } from "@/lib/types";

export interface WriteAuditLogInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Every state-changing action in the system funnels through here so the /audit
 *  view can reconstruct a full "who did what, when" trail (BUILD_SPEC.md acceptance:
 *  "Human approve/edit/reject/escalate action is logged"). */
export async function writeAuditLog(db: SupabaseClient, actor: Actor, input: WriteAuditLogInput): Promise<void> {
  const { error } = await db.from("audit_logs").insert({
    organization_id: actor.organizationId,
    actor_id: actor.userId,
    actor_role: actor.role,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) {
    // Audit logging failures must not take down the primary user-facing action
    // (e.g. resolving a ticket), but they must be visible in server logs.
    console.error("audit_logs insert failed:", error.message);
  }
}

export async function listAuditLogs(db: SupabaseClient, organizationId: string, limit = 200): Promise<AuditLog[]> {
  const { data, error } = await db
    .from("audit_logs")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to list audit logs: ${error.message}`);
  return data ?? [];
}

export async function listEvaluations(db: SupabaseClient, organizationId: string, limit = 200): Promise<Evaluation[]> {
  const { data, error } = await db
    .from("evaluations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to list evaluations: ${error.message}`);
  return data ?? [];
}

export interface RecordEvaluationInput {
  ticketId?: string | null;
  aiTriageRunId?: string | null;
  recommendationId?: string | null;
  metricName: string;
  metricValue: number;
  notes?: string | null;
}

export async function recordEvaluation(
  db: SupabaseClient,
  session: SessionUser,
  input: RecordEvaluationInput,
): Promise<Evaluation> {
  const { data, error } = await db
    .from("evaluations")
    .insert({
      organization_id: session.organizationId,
      ticket_id: input.ticketId ?? null,
      ai_triage_run_id: input.aiTriageRunId ?? null,
      recommendation_id: input.recommendationId ?? null,
      evaluator_id: session.userId,
      metric_name: input.metricName,
      metric_value: input.metricValue,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to record evaluation: ${error?.message}`);

  await writeAuditLog(db, session, { action: "evaluation.create", entityType: "evaluation", entityId: data.id });
  return data;
}
