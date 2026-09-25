// Single source of truth for VPN-support triage taxonomy. The same phrase
// lists drive: (1) deterministic ticket classification in
// lib/llm/triage-rules.ts, and (2) keyword-overlap grounding in
// lib/retrieval/grounding.ts. Sharing one vocabulary keeps ticket keywords
// and knowledge-chunk keywords comparable without any ML model.

import type { VpnCategory } from "./types";

export const VPN_TAXONOMY: Record<Exclude<VpnCategory, "vpn_other">, string[]> = {
  vpn_auth_failure: [
    "authentication failed",
    "auth failed",
    "invalid credentials",
    "login failed",
    "username or password",
    "access denied",
    "password rejected",
    "account locked",
    "incorrect password",
    "authentication error",
  ],
  vpn_gateway_unreachable: [
    "gateway timeout",
    "gateway unreachable",
    "cannot reach vpn server",
    "connection timed out",
    "server not responding",
    "unable to connect to vpn gateway",
    "vpn server unreachable",
    "connection timeout",
    "host unreachable",
  ],
  vpn_client_config: [
    "client configuration",
    "wrong profile",
    "vpn profile",
    "configuration file",
    "client settings",
    "misconfigured client",
    "wrong server address",
    "profile not loading",
    "client install",
    "reinstall vpn client",
  ],
  vpn_dns_post_connect: [
    "dns not resolving",
    "cannot resolve internal",
    "dns after connecting",
    "internal sites not loading",
    "name resolution failed",
    "cannot access internal domain",
    "dns server unreachable",
    "split dns",
    "nslookup fails",
    "cannot reach internal share",
  ],
  vpn_mfa_credential: [
    "mfa",
    "multi-factor",
    "one-time passcode",
    "otp expired",
    "token expired",
    "push notification not received",
    "authenticator app",
    "expired password",
    "certificate expired",
    "2fa",
    "two-factor",
  ],
  vpn_split_tunnel_routing: [
    "split tunnel",
    "split-tunnel",
    "routing issue",
    "wrong route",
    "traffic not routing",
    "cannot reach internal network after connecting",
    "route table",
    "full tunnel",
    "internal resources unreachable via vpn",
    "static route",
  ],
  vpn_connectivity_prereq: [
    "no internet connection",
    "wifi issue",
    "network adapter",
    "local internet is down",
    "laptop offline",
    "ethernet unplugged",
    "no network access",
    "firewall blocking",
    "antivirus blocking vpn",
    "driver issue",
  ],
};

// Tie-break order when multiple categories score equally on keyword matches.
export const CATEGORY_PRIORITY_ORDER: Exclude<VpnCategory, "vpn_other">[] = [
  "vpn_auth_failure",
  "vpn_mfa_credential",
  "vpn_gateway_unreachable",
  "vpn_dns_post_connect",
  "vpn_split_tunnel_routing",
  "vpn_client_config",
  "vpn_connectivity_prereq",
];

export const QUEUE_BY_CATEGORY: Record<VpnCategory, string> = {
  vpn_auth_failure: "L1 - VPN Authentication",
  vpn_gateway_unreachable: "L2 - Network Infrastructure",
  vpn_client_config: "L1 - VPN Client Support",
  vpn_dns_post_connect: "L2 - Network Infrastructure",
  vpn_mfa_credential: "L1 - Identity & Access",
  vpn_split_tunnel_routing: "L2 - Network Infrastructure",
  vpn_connectivity_prereq: "L1 - VPN Client Support",
  vpn_other: "L1 - General Triage",
};

export const CATEGORY_LABELS: Record<VpnCategory, string> = {
  vpn_auth_failure: "VPN Authentication Failure",
  vpn_gateway_unreachable: "VPN Gateway Timeout / Unreachable",
  vpn_client_config: "VPN Client Configuration",
  vpn_dns_post_connect: "DNS Resolution After Connect",
  vpn_mfa_credential: "MFA / Expired Credentials",
  vpn_split_tunnel_routing: "Route / Split-Tunnel Problem",
  vpn_connectivity_prereq: "Basic Connectivity Prerequisite",
  vpn_other: "Unclassified / Needs Manual Triage",
};

export function allTaxonomyKeywords(): string[] {
  return Object.values(VPN_TAXONOMY).flat();
}
