import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeChunk, KnowledgeDocument } from "@/lib/types";

export async function listKnowledgeDocuments(db: SupabaseClient, organizationId: string): Promise<KnowledgeDocument[]> {
  const { data, error } = await db
    .from("knowledge_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("title", { ascending: true });
  if (error) throw new Error(`Failed to list knowledge documents: ${error.message}`);
  return data ?? [];
}

interface ChunkRow {
  id: string;
  document_id: string;
  organization_id: string;
  chunk_text: string;
  section_locator: string;
  keywords: string[] | null;
  category: KnowledgeChunk["category"];
  embedding: number[] | null;
  created_at: string;
  knowledge_documents: {
    title: string;
    source_vendor: string;
    source_reference: string;
    approval_status: KnowledgeChunk["approval_status"];
  };
}

/**
 * All approved chunks for a tenant, across every category. Filtering by
 * organization_id here is the primary tenant-isolation boundary (see
 * tests/tenantIsolation.test.ts); filtering by approval_status='approved' here is
 * the primary knowledge-approval boundary. The retrieval adapter re-checks both
 * defensively before it will let a chunk become a citation.
 */
export async function listApprovedChunksForOrg(db: SupabaseClient, organizationId: string): Promise<KnowledgeChunk[]> {
  const { data, error } = await db
    .from("knowledge_chunks")
    .select("*, knowledge_documents!inner(title,source_vendor,source_reference,approval_status)")
    .eq("organization_id", organizationId)
    .eq("knowledge_documents.approval_status", "approved");
  if (error) throw new Error(`Failed to load knowledge chunks: ${error.message}`);

  return ((data ?? []) as unknown as ChunkRow[]).map((row) => ({
    id: row.id,
    document_id: row.document_id,
    organization_id: row.organization_id,
    chunk_text: row.chunk_text,
    section_locator: row.section_locator,
    keywords: row.keywords ?? [],
    category: row.category,
    embedding: row.embedding,
    created_at: row.created_at,
    approval_status: row.knowledge_documents.approval_status,
    document_title: row.knowledge_documents.title,
    source_vendor: row.knowledge_documents.source_vendor,
    source_reference: row.knowledge_documents.source_reference,
  }));
}
