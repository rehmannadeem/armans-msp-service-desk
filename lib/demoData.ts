import type { KnowledgeChunk, SessionUser } from "@/lib/types";

export const DEMO_ORG_ID = "00000000-0000-4000-8000-000000000001";

export const DEMO_USERS: SessionUser[] = [
  { userId: "user-customer", organizationId: DEMO_ORG_ID, organizationName: "Armans MSP Demo", role: "customer", name: "Demo Customer", email: "customer@demo.local" },
  { userId: "user-dispatcher", organizationId: DEMO_ORG_ID, organizationName: "Armans MSP Demo", role: "dispatcher", name: "Sara Dispatcher", email: "dispatcher@demo.local" },
  { userId: "user-l1", organizationId: DEMO_ORG_ID, organizationName: "Armans MSP Demo", role: "l1_technician", name: "Ali L1 Technician", email: "l1@demo.local" },
  { userId: "user-l2", organizationId: DEMO_ORG_ID, organizationName: "Armans MSP Demo", role: "l2_technician", name: "Hassan L2 Technician", email: "l2@demo.local" },
  { userId: "user-manager", organizationId: DEMO_ORG_ID, organizationName: "Armans MSP Demo", role: "service_manager", name: "Mariam Service Manager", email: "manager@demo.local" },
];

function chunk(
  id: string,
  category: KnowledgeChunk["category"],
  section: string,
  text: string,
  keywords: string[],
): KnowledgeChunk {
  return {
    id,
    document_id: "demo-vpn-runbook-001",
    organization_id: DEMO_ORG_ID,
    chunk_text: text,
    section_locator: section,
    keywords,
    category,
    embedding: null,
    created_at: "2026-09-26T00:00:00Z",    approval_status: "approved",
    document_title: "Armans.AI Demo VPN Support Runbook",
    source_vendor: "Armans.AI Demo Knowledge",
    source_reference: "DEMO-VPN-001",
  };
}

export const DEMO_KB: KnowledgeChunk[] = [
  chunk("kb-auth", "authentication_failure", "Authentication", "Confirm the username is correct and verify the account is not locked before asking the user to retry the VPN sign-in.", ["authentication", "password", "login", "locked"]),
  chunk("kb-mfa", "mfa_expired_credentials", "MFA and credentials", "Verify the password has not expired and confirm the user can complete the approved MFA method. Escalate identity changes to the authorized identity team.", ["mfa", "password", "expired", "otp", "token"]),
  chunk("kb-gateway", "gateway_timeout_unreachable", "Gateway reachability", "Confirm the user has normal internet access, then verify the configured VPN gateway address is reachable. If multiple users are affected, escalate to the network team.", ["gateway", "timeout", "unreachable", "internet"]),
  chunk("kb-client", "client_configuration", "Client configuration", "Confirm the supported VPN client and profile are installed, record the client version, and compare the profile name with the approved configuration before reinstalling anything.", ["client", "profile", "version", "configuration"]),
  chunk("kb-dns", "dns_after_connection", "DNS after connection", "If the VPN connects but internal names fail, record the assigned DNS servers and test an approved internal hostname. Escalate DNS changes rather than modifying settings without authorization.", ["dns", "hostname", "resolve", "internal"]),
  chunk("kb-route", "route_split_tunnel", "Routes and split tunnel", "Compare the affected destination with the approved VPN route list. If expected corporate routes are missing, capture route-table evidence and escalate to the network team.", ["route", "split", "tunnel", "destination"]),
  chunk("kb-prereq", "connectivity_prerequisites", "Connectivity prerequisites", "Confirm Wi-Fi or Ethernet connectivity and successful general internet browsing before troubleshooting the VPN client itself.", ["internet", "wifi", "ethernet", "offline"]),
];

export const CROSS_TENANT_CHUNK: KnowledgeChunk = {
  ...DEMO_KB[0],
  id: "kb-other-tenant",
  organization_id: "00000000-0000-4000-8000-000000000099",
  chunk_text: "This content belongs to another tenant and must never be retrieved.",
};
