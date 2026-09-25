// Seed content for the demo VPN knowledge base. These are synthetic,
// clearly-labeled internal runbooks written for this demo — NOT real vendor
// documentation and NOT real customer data (BUILD_SPEC.md safety rule).
//
// Chunk `keywords` are hand-tagged subsets of lib/domain/taxonomy.ts phrases
// that literally appear in that chunk's text. lib/retrieval/grounding.ts
// intersects these against a ticket's matched taxonomy keywords to decide
// whether a recommendation is grounded or must return NO_APPROVED_GUIDANCE.
//
// Coverage is intentionally uneven across the two demo organizations:
// Riverside MSP has the full seven-category runbook set (plus one pending
// and one deprecated document to show the approval lifecycle). Northgate IT
// Partners only has approved coverage for two categories, so technicians
// there will correctly see NO_APPROVED_GUIDANCE for the rest — a real
// demonstration of both tenant isolation and honest abstention.

import { ORG_NORTHGATE, ORG_RIVERSIDE } from "./demo-fixtures";
import type { ApprovalStatus } from "./types";

export interface KnowledgeChunkFixture {
  id: string;
  section: string;
  sourceLocator: string;
  keywords: string[];
  text: string;
}

export interface KnowledgeDocumentFixture {
  id: string;
  organizationId: string;
  title: string;
  vendor: string;
  sourceReference: string;
  version: string;
  effectiveDate: string;
  approvalStatus: ApprovalStatus;
  content: string;
  chunks: KnowledgeChunkFixture[];
}

export const KNOWLEDGE_FIXTURES: KnowledgeDocumentFixture[] = [
  // ---------------------------------------------------------------- Riverside
  {
    id: "33333333-3333-4333-8333-333333333301",
    organizationId: ORG_RIVERSIDE.id,
    title: "Cisco AnyConnect Authentication Failure",
    vendor: "Cisco AnyConnect",
    sourceReference: "Internal Runbook RVS-VPN-001 (synthetic demo content)",
    version: "1.3",
    effectiveDate: "2025-11-03",
    approvalStatus: "approved",
    content:
      "Diagnosis and resolution steps for Cisco AnyConnect authentication failed / login failed errors.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440401",
        section: "Diagnosis",
        sourceLocator: "RVS-VPN-001 §1",
        keywords: [
          "authentication failed",
          "login failed",
          "invalid credentials",
          "account locked",
          "incorrect password",
          "username or password",
        ],
        text: "An authentication failed or login failed message on Cisco AnyConnect is almost always one of three causes: invalid credentials typed into the username or password fields, an account locked in Active Directory after repeated incorrect password attempts, or a stale cached credential from a previous session. Ask the user for the exact error text before proceeding.",
      },
      {
        id: "44444444-4444-4444-8444-444444440402",
        section: "Resolution",
        sourceLocator: "RVS-VPN-001 §2",
        keywords: ["password rejected", "authentication error", "access denied"],
        text: "1) Check Active Directory for a locked account; unlock and have the user reset their password if password rejected or access denied is shown. 2) In AnyConnect, use 'Delete Saved User Credentials' from the client settings to clear any stale cache. 3) Reconnect and confirm the authentication error clears. Escalate to L2 only if the account is unlocked, the password is confirmed correct, and the authentication error persists.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    organizationId: ORG_RIVERSIDE.id,
    title: "Palo Alto GlobalProtect Gateway Timeout",
    vendor: "Palo Alto GlobalProtect",
    sourceReference: "Internal Runbook RVS-VPN-002 (synthetic demo content)",
    version: "1.1",
    effectiveDate: "2025-10-20",
    approvalStatus: "approved",
    content: "Diagnosis and resolution steps when the GlobalProtect gateway is unreachable or times out.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440403",
        section: "Diagnosis",
        sourceLocator: "RVS-VPN-002 §1",
        keywords: ["gateway timeout", "gateway unreachable", "cannot reach vpn server", "vpn server unreachable"],
        text: "A gateway timeout or gateway unreachable message means the client cannot complete a TLS handshake with the GlobalProtect portal. This is usually a network path problem (captive portal, blocked port 443) rather than a credentials problem, especially if the error appears before any login prompt.",
      },
      {
        id: "44444444-4444-4444-8444-444444440404",
        section: "Resolution",
        sourceLocator: "RVS-VPN-002 §2",
        keywords: [
          "connection timed out",
          "server not responding",
          "unable to connect to vpn gateway",
          "connection timeout",
          "host unreachable",
        ],
        text: "1) Confirm the user's local internet works outside the VPN client. 2) Have them try a different network (mobile hotspot) to rule out a captive portal or ISP block; if that succeeds, the connection timed out was caused by the original network blocking port 443/4501. 3) Check the regional gateway status page. If the server not responding condition affects multiple users, escalate to L2 to check gateway health rather than repeating client-side steps.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    organizationId: ORG_RIVERSIDE.id,
    title: "Cisco AnyConnect Client Configuration",
    vendor: "Cisco AnyConnect",
    sourceReference: "Internal Runbook RVS-VPN-003 (synthetic demo content)",
    version: "1.4",
    effectiveDate: "2025-09-15",
    approvalStatus: "approved",
    content: "Fixing a wrong or corrupted AnyConnect client profile.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440405",
        section: "Diagnosis",
        sourceLocator: "RVS-VPN-003 §1",
        keywords: ["client configuration", "wrong profile", "vpn profile", "configuration file", "client settings"],
        text: "If the client configuration looks wrong (missing company gateway entries, wrong profile shown at launch, or the vpn profile dropdown is empty), the local configuration file was likely not pushed correctly or was edited manually.",
      },
      {
        id: "44444444-4444-4444-8444-444444440406",
        section: "Resolution",
        sourceLocator: "RVS-VPN-003 §2",
        keywords: [
          "misconfigured client",
          "wrong server address",
          "profile not loading",
          "client install",
          "reinstall vpn client",
        ],
        text: "1) Close AnyConnect fully. 2) Delete the local profile XML under the AnyConnect Profile folder to clear a misconfigured client state. 3) If the wrong server address still appears after relaunch, or the profile not loading persists, do a full reinstall vpn client using the standard client install package from the software portal, then relaunch and confirm the correct gateway list appears.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333304",
    organizationId: ORG_RIVERSIDE.id,
    title: "Palo Alto GlobalProtect DNS Resolution After Connect",
    vendor: "Palo Alto GlobalProtect",
    sourceReference: "Internal Runbook RVS-VPN-004 (synthetic demo content)",
    version: "1.0",
    effectiveDate: "2025-08-01",
    approvalStatus: "approved",
    content: "Fixing internal name resolution once the VPN tunnel is already connected.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440407",
        section: "Diagnosis",
        sourceLocator: "RVS-VPN-004 §1",
        keywords: ["dns not resolving", "cannot resolve internal", "dns after connecting", "internal sites not loading"],
        text: "When the tunnel shows connected but dns not resolving occurs for internal hostnames, or internal sites not loading while public sites work fine, the issue is DNS after connecting, not the tunnel itself. Confirm the tunnel is actually up first.",
      },
      {
        id: "44444444-4444-4444-8444-444444440408",
        section: "Resolution",
        sourceLocator: "RVS-VPN-004 §2",
        keywords: [
          "name resolution failed",
          "cannot access internal domain",
          "dns server unreachable",
          "split dns",
          "nslookup fails",
          "cannot reach internal share",
        ],
        text: "1) Run nslookup against an internal hostname; if nslookup fails or reports dns server unreachable, capture the DNS server IP GlobalProtect assigned. 2) Confirm split dns is enabled on the portal config for the affected domain suffix. 3) If cannot access internal domain or cannot reach internal share persists, flush the local DNS cache (ipconfig /flushdns) and reconnect. Escalate to L2 if the assigned DNS server does not match the expected internal resolver.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333305",
    organizationId: ORG_RIVERSIDE.id,
    title: "Duo MFA and Expired Credential Issues",
    vendor: "Duo Security",
    sourceReference: "Internal Runbook RVS-VPN-005 (synthetic demo content)",
    version: "1.2",
    effectiveDate: "2025-11-10",
    approvalStatus: "approved",
    content: "Handling MFA prompts, expired one-time passcodes, and expired credentials during VPN login.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440409",
        section: "Diagnosis",
        sourceLocator: "RVS-VPN-005 §1",
        keywords: [
          "mfa",
          "multi-factor",
          "one-time passcode",
          "otp expired",
          "token expired",
          "push notification not received",
          "authenticator app",
        ],
        text: "MFA and multi-factor issues during VPN login usually fall into two buckets: the push notification not received on the authenticator app, or the one-time passcode was entered too slowly and otp expired / token expired is shown.",
      },
      {
        id: "44444444-4444-4444-8444-444444440410",
        section: "Resolution",
        sourceLocator: "RVS-VPN-005 §2",
        keywords: ["expired password", "certificate expired", "2fa", "two-factor"],
        text: "1) Have the user check phone connectivity and retry the 2fa / two-factor push. 2) If token expired repeats, confirm device clock sync (Duo tokens are time-based). 3) If the account instead shows expired password, direct the user to the self-service reset portal before retrying VPN login. 4) A certificate expired message on the VPN client itself (not MFA) requires an L2 certificate reissue — do not attempt to work around it client-side.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333306",
    organizationId: ORG_RIVERSIDE.id,
    title: "Palo Alto GlobalProtect Split-Tunnel and Routing",
    vendor: "Palo Alto GlobalProtect",
    sourceReference: "Internal Runbook RVS-VPN-006 (synthetic demo content)",
    version: "1.0",
    effectiveDate: "2025-07-22",
    approvalStatus: "approved",
    content: "Diagnosing traffic that does not route correctly after connecting.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440411",
        section: "Diagnosis",
        sourceLocator: "RVS-VPN-006 §1",
        keywords: ["split tunnel", "split-tunnel", "routing issue", "wrong route", "traffic not routing"],
        text: "A routing issue where some internal resources work and others don't, or traffic not routing over the tunnel at all, points to the split tunnel / split-tunnel configuration rather than authentication or DNS.",
      },
      {
        id: "44444444-4444-4444-8444-444444440412",
        section: "Resolution",
        sourceLocator: "RVS-VPN-006 §2",
        keywords: [
          "cannot reach internal network after connecting",
          "route table",
          "full tunnel",
          "internal resources unreachable via vpn",
          "static route",
        ],
        text: "1) Run 'route print' (Windows) or 'netstat -rn' (macOS) to inspect the route table after connecting. 2) If internal resources unreachable via vpn but the tunnel shows connected, compare the included-routes list on the portal config against the destination subnet. 3) For users who need everything routed, confirm whether they are on a split tunnel or full tunnel profile — full tunnel is required for some internal-only applications. 4) A missing static route is an L2-level config change; do not edit the local route table manually as a permanent fix.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333307",
    organizationId: ORG_RIVERSIDE.id,
    title: "VPN Connectivity Prerequisites (Any Client)",
    vendor: "General",
    sourceReference: "Internal Runbook RVS-VPN-007 (synthetic demo content)",
    version: "2.0",
    effectiveDate: "2025-06-01",
    approvalStatus: "approved",
    content: "Baseline connectivity checks before troubleshooting any VPN client.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440413",
        section: "Diagnosis",
        sourceLocator: "RVS-VPN-007 §1",
        keywords: ["no internet connection", "wifi issue", "network adapter", "local internet is down", "laptop offline"],
        text: "Before troubleshooting any VPN client, rule out a basic no internet connection problem: a wifi issue, disabled network adapter, or the local internet is down entirely would make any VPN client fail regardless of vendor.",
      },
      {
        id: "44444444-4444-4444-8444-444444440414",
        section: "Resolution",
        sourceLocator: "RVS-VPN-007 §2",
        keywords: ["ethernet unplugged", "no network access", "firewall blocking", "antivirus blocking vpn", "driver issue"],
        text: "1) Confirm the device shows no network access in the OS tray before touching the VPN client; check for ethernet unplugged or wifi disabled. 2) Check for a local firewall blocking or antivirus blocking vpn (common after a security software update). 3) If the network adapter shows an error, a driver issue may require a reinstall. Only proceed to vendor-specific VPN troubleshooting once basic connectivity is confirmed.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333308",
    organizationId: ORG_RIVERSIDE.id,
    title: "Split-Tunnel Advanced Diagnostics (Draft)",
    vendor: "Palo Alto GlobalProtect",
    sourceReference: "Draft Runbook RVS-VPN-008-DRAFT (synthetic demo content, not yet approved)",
    version: "0.3-draft",
    effectiveDate: "2025-12-01",
    approvalStatus: "pending",
    content:
      "Draft advanced diagnostics for split tunnel route conflicts. Awaiting Service Manager review before this becomes citable guidance — intentionally excluded from technician retrieval until approved.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440415",
        section: "Draft notes",
        sourceLocator: "RVS-VPN-008-DRAFT §1",
        keywords: ["split tunnel", "split-tunnel", "route table", "static route"],
        text: "DRAFT — not yet approved. Proposed steps for advanced split tunnel route table conflicts involving overlapping static route entries from a home router. Needs validation before publishing.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333309",
    organizationId: ORG_RIVERSIDE.id,
    title: "Legacy Cisco AnyConnect XML Profile Guide",
    vendor: "Cisco AnyConnect",
    sourceReference: "Internal Runbook RVS-VPN-000 (deprecated, synthetic demo content)",
    version: "0.9",
    effectiveDate: "2023-02-01",
    approvalStatus: "deprecated",
    content:
      "Deprecated manual XML profile editing guide, superseded by RVS-VPN-003. Retained for audit history only and excluded from retrieval.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440416",
        section: "Deprecated",
        sourceLocator: "RVS-VPN-000 §1",
        keywords: ["client configuration", "vpn profile"],
        text: "DEPRECATED — superseded by RVS-VPN-003. Previously described manually editing the client configuration XML to fix a vpn profile; this workaround is no longer supported and must not be cited.",
      },
    ],
  },
  // ----------------------------------------------------------------- Northgate
  {
    id: "33333333-3333-4333-8333-333333333310",
    organizationId: ORG_NORTHGATE.id,
    title: "FortiClient Authentication Failure",
    vendor: "Fortinet FortiClient",
    sourceReference: "Internal Runbook NG-VPN-001 (synthetic demo content)",
    version: "1.0",
    effectiveDate: "2025-10-05",
    approvalStatus: "approved",
    content: "Diagnosis and resolution steps for FortiClient authentication failed errors.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440417",
        section: "Diagnosis",
        sourceLocator: "NG-VPN-001 §1",
        keywords: ["authentication failed", "login failed", "invalid credentials", "incorrect password"],
        text: "An authentication failed or login failed error on FortiClient usually means invalid credentials or incorrect password against the FortiGate's LDAP backend.",
      },
      {
        id: "44444444-4444-4444-8444-444444440418",
        section: "Resolution",
        sourceLocator: "NG-VPN-001 §2",
        keywords: ["account locked", "password rejected", "access denied", "authentication error"],
        text: "1) Check whether the account locked flag is set on the domain controller after repeated password rejected attempts. 2) Reset the password if needed and retry. 3) If access denied persists with a confirmed-correct password, escalate — this authentication error likely requires an L2 check of the FortiGate auth server binding.",
      },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333311",
    organizationId: ORG_NORTHGATE.id,
    title: "FortiClient Connectivity Prerequisites",
    vendor: "Fortinet FortiClient",
    sourceReference: "Internal Runbook NG-VPN-002 (synthetic demo content)",
    version: "1.0",
    effectiveDate: "2025-10-05",
    approvalStatus: "approved",
    content: "Baseline connectivity checks before troubleshooting FortiClient.",
    chunks: [
      {
        id: "44444444-4444-4444-8444-444444440419",
        section: "Diagnosis",
        sourceLocator: "NG-VPN-002 §1",
        keywords: ["no internet connection", "wifi issue", "network adapter", "laptop offline"],
        text: "Rule out a plain no internet connection problem — a wifi issue or the network adapter being disabled — before assuming FortiClient itself is broken.",
      },
      {
        id: "44444444-4444-4444-8444-444444440420",
        section: "Resolution",
        sourceLocator: "NG-VPN-002 §2",
        keywords: ["ethernet unplugged", "no network access", "firewall blocking", "driver issue"],
        text: "1) Confirm no network access is not showing in the OS tray and rule out ethernet unplugged. 2) Check for local firewall blocking FortiClient after a security update. 3) A persistent driver issue on the adapter requires a reinstall before VPN troubleshooting continues.",
      },
    ],
  },
];
