// Demo VPN knowledge base — SYNTHETIC, for product demonstration only.
//
// These runbooks are written for this demo and are NOT sourced from any
// real vendor documentation or customer environment. Every document below
// is clearly labeled with source_reference starting with "SYNTHETIC-DEMO-KB"
// so it can never be mistaken for real customer or vendor data
// (BUILD_SPEC: "Do not present synthetic runbooks ... as real customer data").
//
// One document ("Legacy VPN Client Rollback Steps") is seeded as `pending`
// approval on purpose: it proves that un-approved knowledge is never
// retrieved, even though its content would otherwise match a ticket.

export interface SeedChunk {
  section: string;
  source_locator: string;
  keywords: string[];
  text: string;
}

export interface SeedDocument {
  key: string; // stable id used only for wiring chunks in demoStore
  title: string;
  vendor: string;
  source_reference: string;
  version: string;
  effective_date: string;
  approval_status: "approved" | "pending" | "deprecated";
  content: string; // full runbook text
  chunks: SeedChunk[];
}

export const seedDocuments: SeedDocument[] = [
  {
    key: "auth-failure",
    title: "VPN Authentication Failure Runbook",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-001",
    version: "1.2",
    effective_date: "2026-01-15",
    approval_status: "approved",
    content:
      "Covers credential-based authentication failures at VPN login (username/password rejected, account lockout, LDAP/AD sync errors).",
    chunks: [
      {
        section: "Symptoms",
        source_locator: "SYNTHETIC-DEMO-KB-001 §1",
        keywords: ["authentication", "login", "password", "rejected", "credentials", "invalid"],
        text:
          "User reports the VPN client rejects their username/password with an 'authentication failed' or 'invalid credentials' error immediately after clicking connect, before any tunnel is established. The error appears within 1-3 seconds, indicating the request reached the authentication server and was denied, not a network timeout.",
      },
      {
        section: "Diagnosis Steps",
        source_locator: "SYNTHETIC-DEMO-KB-001 §2",
        keywords: ["diagnosis", "account lockout", "ad sync", "directory", "case sensitive"],
        text:
          "1) Confirm the account is not locked in the directory service (check failed-login counter). 2) Verify the user is typing the correct domain-qualified username (domain\\user vs user@domain — client-dependent). 3) Confirm password was not recently changed and client is not caching an old credential. 4) Check directory sync/replication lag if the account was created or reset in the last 15 minutes.",
      },
      {
        section: "Resolution Steps",
        source_locator: "SYNTHETIC-DEMO-KB-001 §3",
        keywords: ["resolution", "reset", "unlock", "clear cache", "retry"],
        text:
          "1) Unlock the account if locked and confirm with the user. 2) Have the user clear any saved/cached credentials in the VPN client and re-enter them manually. 3) If password was changed in the last few minutes, wait for directory replication (typically under 5 minutes) and retry. 4) If failure persists after 3 verified-correct attempts, escalate to L2 for directory-server-side investigation.",
      },
      {
        section: "Escalation Criteria",
        source_locator: "SYNTHETIC-DEMO-KB-001 §4",
        keywords: ["escalate", "l2", "directory server"],
        text:
          "Escalate to L2 if: the account is confirmed unlocked and credentials are confirmed correct but authentication still fails, or if multiple users report simultaneous authentication failures (possible directory server or RADIUS outage).",
      },
    ],
  },
  {
    key: "gateway-timeout",
    title: "VPN Gateway Timeout / Unreachable Runbook",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-002",
    version: "1.1",
    effective_date: "2026-01-15",
    approval_status: "approved",
    content:
      "Covers cases where the VPN client cannot reach the gateway/concentrator at all: connection attempt times out or the host is reported unreachable.",
    chunks: [
      {
        section: "Symptoms",
        source_locator: "SYNTHETIC-DEMO-KB-002 §1",
        keywords: ["timeout", "unreachable", "gateway", "concentrator", "cannot connect", "hangs"],
        text:
          "The VPN client hangs on 'Connecting...' for 30+ seconds and then fails with a timeout, or immediately reports the gateway/server as unreachable. This differs from an authentication failure because the client never reaches the point of prompting for or validating credentials.",
      },
      {
        section: "Diagnosis Steps",
        source_locator: "SYNTHETIC-DEMO-KB-002 §2",
        keywords: ["diagnosis", "firewall", "port", "isp", "outage", "ping"],
        text:
          "1) Confirm the gateway hostname resolves via DNS from the user's network. 2) Check whether the required outbound port (typically UDP 443 or TCP 443 depending on client protocol) is blocked by a local firewall, hotel/guest Wi-Fi, or ISP. 3) Check the internal status page / monitoring for a known gateway outage or maintenance window. 4) Ask if this is a new network (new office, hotel, home ISP change) — captive portals commonly block VPN ports.",
      },
      {
        section: "Resolution Steps",
        source_locator: "SYNTHETIC-DEMO-KB-002 §3",
        keywords: ["resolution", "switch network", "restart client", "alternate gateway"],
        text:
          "1) If a known gateway outage is active, inform the user and log the ticket against the outage. 2) Have the user try a different network (e.g., mobile hotspot) to isolate a local network block. 3) Restart the VPN client and, if available, the local network adapter. 4) If an alternate/backup gateway exists, have the user select it in the client profile.",
      },
      {
        section: "Escalation Criteria",
        source_locator: "SYNTHETIC-DEMO-KB-002 §4",
        keywords: ["escalate", "l2", "outage", "multiple users"],
        text:
          "Escalate to L2 immediately if more than one user reports the gateway unreachable at the same time — this indicates a possible gateway-side outage rather than a per-user issue, and should not wait for individual triage.",
      },
    ],
  },
  {
    key: "client-config",
    title: "VPN Client Configuration Runbook",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-003",
    version: "1.0",
    effective_date: "2025-11-01",
    approval_status: "approved",
    content:
      "Covers issues caused by incorrect or outdated VPN client configuration profiles: wrong server address, missing profile, outdated client version.",
    chunks: [
      {
        section: "Symptoms",
        source_locator: "SYNTHETIC-DEMO-KB-003 §1",
        keywords: ["configuration", "profile", "missing profile", "wrong server", "outdated client"],
        text:
          "User cannot find a connection profile, sees an old/decommissioned server address, or the client shows a version-mismatch warning on connect. Distinct from gateway timeout because the client may not even attempt a connection due to bad local config.",
      },
      {
        section: "Diagnosis Steps",
        source_locator: "SYNTHETIC-DEMO-KB-003 §2",
        keywords: ["diagnosis", "profile check", "version check"],
        text:
          "1) Confirm which profile/server address the client currently has configured. 2) Compare against the current approved server list. 3) Check installed client version against the minimum supported version. 4) Confirm the user's device is company-managed (profile push) vs. self-installed (manual config required).",
      },
      {
        section: "Resolution Steps",
        source_locator: "SYNTHETIC-DEMO-KB-003 §3",
        keywords: ["resolution", "reinstall", "update client", "push profile", "manual config"],
        text:
          "1) Push or re-send the current connection profile via MDM if the device is managed. 2) For unmanaged devices, provide the current server address and have the user recreate the profile manually. 3) Update the client to the minimum supported version if outdated. 4) Reinstall the client only if configuration reset does not resolve the issue.",
      },
      {
        section: "Escalation Criteria",
        source_locator: "SYNTHETIC-DEMO-KB-003 §4",
        keywords: ["escalate", "l2", "mdm"],
        text:
          "Escalate to L2 if MDM profile push fails repeatedly or the device enrollment itself appears broken — this moves outside standard VPN client troubleshooting into device management.",
      },
    ],
  },
  {
    key: "dns-after-connect",
    title: "DNS Resolution Failure After VPN Connect Runbook",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-004",
    version: "1.0",
    effective_date: "2025-12-01",
    approval_status: "approved",
    content:
      "Covers cases where the VPN tunnel connects successfully but internal hostnames fail to resolve afterward.",
    chunks: [
      {
        section: "Symptoms",
        source_locator: "SYNTHETIC-DEMO-KB-004 §1",
        keywords: ["dns", "cannot resolve", "hostname", "after connect", "internal sites"],
        text:
          "User confirms the VPN client shows 'Connected', but internal sites/shares fail to load by hostname while working fine by IP address. This isolates the problem to DNS resolution, not the tunnel itself.",
      },
      {
        section: "Diagnosis Steps",
        source_locator: "SYNTHETIC-DEMO-KB-004 §2",
        keywords: ["diagnosis", "dns server", "split tunnel dns", "flush dns"],
        text:
          "1) Confirm the client is set to use internal DNS servers, not the local ISP/public DNS, once connected. 2) Check whether split-tunnel DNS settings are excluding the internal domain suffix. 3) Have the user run a DNS flush and retry. 4) Confirm the internal DNS server itself is healthy (check monitoring).",
      },
      {
        section: "Resolution Steps",
        source_locator: "SYNTHETIC-DEMO-KB-004 §3",
        keywords: ["resolution", "set dns", "flush", "reconnect"],
        text:
          "1) Correct the client's DNS server assignment to the internal resolver addresses. 2) Ensure the internal domain suffix is included in split-tunnel DNS scope. 3) Flush DNS cache and reconnect the tunnel. 4) If still failing, test resolution using nslookup against the internal DNS server IP directly to isolate client vs. server-side issues.",
      },
      {
        section: "Escalation Criteria",
        source_locator: "SYNTHETIC-DEMO-KB-004 §4",
        keywords: ["escalate", "l2", "dns server down"],
        text:
          "Escalate to L2 if the internal DNS server fails to answer direct nslookup queries from a known-good client — this indicates a server-side DNS issue rather than VPN client configuration.",
      },
    ],
  },
  {
    key: "mfa-expired",
    title: "VPN MFA / Expired Credentials Runbook",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-005",
    version: "1.3",
    effective_date: "2026-02-01",
    approval_status: "approved",
    content:
      "Covers multi-factor authentication push/token failures and expired password or certificate scenarios during VPN login.",
    chunks: [
      {
        section: "Symptoms",
        source_locator: "SYNTHETIC-DEMO-KB-005 §1",
        keywords: ["mfa", "multi-factor", "push notification", "token expired", "certificate expired", "otp"],
        text:
          "User authenticates with username/password successfully but the MFA push notification never arrives, the OTP code is rejected, or the client reports an expired password or expired client certificate.",
      },
      {
        section: "Diagnosis Steps",
        source_locator: "SYNTHETIC-DEMO-KB-005 §2",
        keywords: ["diagnosis", "mfa provider status", "clock skew", "cert expiry"],
        text:
          "1) Check MFA provider status page for a known outage. 2) Confirm the user's device clock is accurate — OTP codes fail with more than ~30s clock skew. 3) Check password expiry policy date against last change date. 4) For certificate-based auth, check the client certificate expiration date.",
      },
      {
        section: "Resolution Steps",
        source_locator: "SYNTHETIC-DEMO-KB-005 §3",
        keywords: ["resolution", "resync token", "reset mfa", "renew certificate", "reset password"],
        text:
          "1) If clock skew is the cause, have the user sync device time automatically and retry. 2) If password is expired, walk the user through the self-service reset flow. 3) If the client certificate is expired, trigger re-enrollment/renewal via the certificate management tool. 4) If MFA push repeatedly fails but provider status is healthy, have the user try the backup OTP method.",
      },
      {
        section: "Escalation Criteria",
        source_locator: "SYNTHETIC-DEMO-KB-005 §4",
        keywords: ["escalate", "l2", "mfa provider outage", "certificate authority"],
        text:
          "Escalate to L2 if the MFA provider status page shows a live outage, or if certificate re-enrollment fails at the certificate authority level.",
      },
    ],
  },
  {
    key: "route-split-tunnel",
    title: "VPN Routing / Split-Tunnel Problems Runbook",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-006",
    version: "1.0",
    effective_date: "2025-10-20",
    approval_status: "approved",
    content:
      "Covers cases where the VPN connects but traffic routes incorrectly: internal resources unreachable, or all traffic unexpectedly tunneled (or not tunneled) due to split-tunnel misconfiguration.",
    chunks: [
      {
        section: "Symptoms",
        source_locator: "SYNTHETIC-DEMO-KB-006 §1",
        keywords: ["routing", "split tunnel", "route conflict", "cannot reach subnet", "all traffic tunneled"],
        text:
          "User is connected but cannot reach specific internal subnets while others work, or reports that all internet traffic (including personal browsing) is unexpectedly routed through the VPN ('full tunnel' when 'split tunnel' was expected), or the reverse.",
      },
      {
        section: "Diagnosis Steps",
        source_locator: "SYNTHETIC-DEMO-KB-006 §2",
        keywords: ["diagnosis", "route table", "traceroute", "local subnet conflict"],
        text:
          "1) Check the client's route table (or `route print`/`netstat -rn`) against the expected internal subnet list. 2) Check for an IP conflict between the user's local network subnet and an internal subnet (common on home routers using 10.x or 192.168.x ranges). 3) Confirm which split-tunnel policy profile the user's client is assigned.",
      },
      {
        section: "Resolution Steps",
        source_locator: "SYNTHETIC-DEMO-KB-006 §3",
        keywords: ["resolution", "reassign profile", "change local subnet", "reconnect"],
        text:
          "1) If a local subnet conflict is found, have the user change their home router's LAN subnet or reconnect from a network without the conflict. 2) Reassign the user to the correct split-tunnel policy profile if misassigned. 3) Reconnect the client after any profile change to force route table refresh.",
      },
      {
        section: "Escalation Criteria",
        source_locator: "SYNTHETIC-DEMO-KB-006 §4",
        keywords: ["escalate", "l2", "policy profile", "gateway routing table"],
        text:
          "Escalate to L2 if the split-tunnel policy profile itself appears misconfigured at the gateway (affecting a whole user group, not just one user), since that requires gateway policy changes.",
      },
    ],
  },
  {
    key: "connectivity-prereqs",
    title: "VPN Basic Connectivity Prerequisites Runbook",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-007",
    version: "1.0",
    effective_date: "2025-09-01",
    approval_status: "approved",
    content:
      "Baseline prerequisites to confirm before deeper VPN troubleshooting: local internet connectivity, OS/client compatibility, required software installed.",
    chunks: [
      {
        section: "Symptoms",
        source_locator: "SYNTHETIC-DEMO-KB-007 §1",
        keywords: ["prerequisites", "no internet", "client not installed", "unsupported os"],
        text:
          "Before troubleshooting any VPN-specific symptom, confirm the basics: does the device have working internet access at all (non-VPN sites load), is the VPN client actually installed, and is the OS version supported by the current client release?",
      },
      {
        section: "Diagnosis Steps",
        source_locator: "SYNTHETIC-DEMO-KB-007 §2",
        keywords: ["diagnosis", "connectivity check", "os version", "client installed"],
        text:
          "1) Have the user load a non-internal website to confirm general internet connectivity. 2) Confirm the VPN client application is installed and not just a shortcut/leftover icon. 3) Check OS version against the supported matrix for the current client release. 4) Confirm no other VPN client is installed and conflicting (only one VPN client should run at a time).",
      },
      {
        section: "Resolution Steps",
        source_locator: "SYNTHETIC-DEMO-KB-007 §3",
        keywords: ["resolution", "install client", "update os", "remove conflicting client"],
        text:
          "1) If no general internet access, this is a local/ISP issue outside VPN scope — resolve connectivity first. 2) Install the VPN client if missing, using the standard deployment package. 3) Update the OS if it falls outside the supported matrix. 4) Uninstall conflicting VPN clients before proceeding.",
      },
      {
        section: "Escalation Criteria",
        source_locator: "SYNTHETIC-DEMO-KB-007 §4",
        keywords: ["escalate", "l2", "unsupported os"],
        text:
          "Escalate to L2 (or Service Manager for a policy exception) only if the device's OS is permanently unsupported and no upgrade path exists.",
      },
    ],
  },
  {
    key: "legacy-rollback-pending",
    title: "Legacy VPN Client Rollback Steps",
    vendor: "Generic VPN Client",
    source_reference: "SYNTHETIC-DEMO-KB-008",
    version: "0.1-draft",
    effective_date: "2026-03-01",
    approval_status: "pending",
    content:
      "Draft steps for rolling back to a legacy VPN client version. NOT YET APPROVED — included in the demo seed specifically to prove that pending documents are never surfaced to technicians.",
    chunks: [
      {
        section: "Draft Rollback Steps",
        source_locator: "SYNTHETIC-DEMO-KB-008 §1",
        keywords: ["rollback", "legacy client", "downgrade", "unapproved"],
        text:
          "DRAFT, NOT APPROVED. Proposed steps to downgrade a user to the legacy VPN client build if the current release is suspected of causing connection failures. This document must remain pending until a Service Manager reviews and approves it, and must never be cited to a technician while pending.",
      },
    ],
  },
];
