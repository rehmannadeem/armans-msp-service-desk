import type { Category, Impact, Priority, Queue, Urgency } from "@/lib/types";
import type { LlmTriageAdapter, TriageInput, TriageOutput } from "@/lib/llm/adapter";

// --- Category rules -------------------------------------------------------
// Ordered by specificity: more specific VPN sub-problems (MFA, gateway, DNS,
// routing, client install) are matched before the generic "authentication
// failure" / "connectivity prerequisites" buckets so e.g. an MFA complaint
// is never mis-filed as a plain password problem.

interface CategoryRule {
  category: Category;
  keywords: string[];
  queue: Queue;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "mfa_expired_credentials",
    keywords: [
      "mfa",
      "multi-factor",
      "multi factor",
      "two-factor",
      "two factor",
      "2fa",
      "authenticator app",
      "one-time code",
      "one time code",
      "otp",
      "token expired",
      "password expired",
      "credentials expired",
      "account locked",
      "push notification not arriving",
    ],
    queue: "L1_GENERAL",
  },
  {
    category: "gateway_timeout_unreachable",
    keywords: [
      "gateway timeout",
      "gateway unreachable",
      "vpn gateway down",
      "cannot reach vpn server",
      "can't reach vpn server",
      "connection timed out",
      "connection timeout",
      "server unreachable",
      "vpn down",
      "concentrator",
      "vpn is down",
    ],
    queue: "L2_NETWORK",
  },
  {
    category: "dns_after_connection",
    keywords: [
      "dns",
      "can't resolve",
      "cannot resolve",
      "name resolution",
      "internal site not loading",
      "can't access internal",
      "cannot access internal",
      "resolve internal hostname",
      "resolve internal host",
    ],
    queue: "L2_NETWORK",
  },
  {
    category: "route_split_tunnel",
    keywords: [
      "split tunnel",
      "split-tunnel",
      "routing table",
      "route conflict",
      "partial connectivity",
      "some internal sites work",
      "some sites work but",
    ],
    queue: "L2_NETWORK",
  },
  {
    category: "client_configuration",
    keywords: [
      "client won't install",
      "client wont install",
      "install fail",
      "installation failed",
      "configuration file",
      "cert error",
      "certificate error",
      "client crashes",
      "client keeps crashing",
      "client version",
      "update the vpn client",
      "vpn client profile",
      "vpn profile",
    ],
    queue: "L1_GENERAL",
  },
  {
    category: "connectivity_prerequisites",
    keywords: [
      "no internet",
      "no network connection",
      "wifi not working",
      "wi-fi not working",
      "ethernet unplugged",
      "laptop is offline",
      "can't get online",
      "cannot get online",
      "no internet access before",
    ],
    queue: "L1_GENERAL",
  },
  {
    category: "authentication_failure",
    keywords: [
      "invalid password",
      "login fail",
      "login failed",
      "authentication failed",
      "can't log in",
      "cannot log in",
      "can't sign in",
      "cannot sign in",
      "incorrect password",
      "access denied",
      "auth error",
      "wrong password",
      "rejected credentials",
    ],
    queue: "L1_GENERAL",
  },
];

// --- Impact / urgency signal words ----------------------------------------

const SITE_WIDE_KEYWORDS = [
  "entire office",
  "whole site",
  "everyone in the office",
  "all users",
  "company-wide",
  "companywide",
  "site-wide",
  "whole company",
];

const DEPARTMENT_KEYWORDS = [
  "my team",
  "our department",
  "several users",
  "multiple users",
  "the sales team",
  "the finance team",
  "our floor",
  "a group of us",
];

const HIGH_URGENCY_KEYWORDS = [
  "urgent",
  "asap",
  "critical",
  "production down",
  "cannot work",
  "can't work",
  "blocking",
  "revenue",
];

const LOW_URGENCY_KEYWORDS = ["whenever", "not urgent", "low priority", "no rush"];

// --- Missing-information checks -------------------------------------------

const ERROR_MESSAGE_KEYWORDS = ["error", "code", "message says", "it says"];
const OS_KEYWORDS = ["windows", "macos", "mac os", "ios", "android", "linux", "mac "];
const CLIENT_NAME_KEYWORDS = [
  "cisco",
  "anyconnect",
  "globalprotect",
  "global protect",
  "forticlient",
  "openvpn",
  "pulse secure",
  "client version",
];
const TIMING_KEYWORDS = ["since", "started", "after", "yesterday", "today", "always", "sometimes"];

// --- Priority matrix --------------------------------------------------------

const PRIORITY_MATRIX: Record<Impact, Record<Urgency, Priority>> = {
  site_wide: { high: "P1", medium: "P2", low: "P2" },
  department: { high: "P2", medium: "P3", low: "P3" },
  single_user: { high: "P3", medium: "P4", low: "P4" },
};

function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function countMatches(haystack: string, needles: string[]): number {
  return needles.reduce((count, needle) => (haystack.includes(needle) ? count + 1 : count), 0);
}

function detectImpact(text: string): Impact {
  if (containsAny(text, SITE_WIDE_KEYWORDS)) return "site_wide";
  if (containsAny(text, DEPARTMENT_KEYWORDS)) return "department";
  return "single_user";
}

function detectUrgency(text: string, category: Category): Urgency {
  if (containsAny(text, HIGH_URGENCY_KEYWORDS)) return "high";
  if (containsAny(text, LOW_URGENCY_KEYWORDS)) return "low";
  // Gateway-down incidents default to high urgency even without explicit signal words,
  // since an unreachable VPN gateway blocks every remote worker behind it.
  if (category === "gateway_timeout_unreachable") return "high";
  if (category === "client_configuration" || category === "connectivity_prerequisites") return "low";
  return "medium";
}

function detectMissingInformation(text: string): string[] {
  const missing: string[] = [];
  if (!containsAny(text, ERROR_MESSAGE_KEYWORDS)) {
    missing.push("exact error message or code shown to the user");
  }
  if (!containsAny(text, OS_KEYWORDS)) {
    missing.push("device type and operating system");
  }
  if (!containsAny(text, CLIENT_NAME_KEYWORDS)) {
    missing.push("VPN client name and version");
  }
  if (!containsAny(text, TIMING_KEYWORDS)) {
    missing.push("when the issue started and whether it is reproducible");
  }
  return missing;
}

function classifyCategory(text: string): { category: Category; queue: Queue; score: number } {
  let best: { category: Category; queue: Queue; score: number } | null = null;
  for (const rule of CATEGORY_RULES) {
    const score = countMatches(text, rule.keywords);
    if (score > 0 && (!best || score > best.score)) {
      best = { category: rule.category, queue: rule.queue, score };
    }
  }
  return best ?? { category: "other", queue: "L1_GENERAL", score: 0 };
}

export class DemoTriageAdapter implements LlmTriageAdapter {
  readonly modelName = "demo-rule-based-v1";

  triage(input: TriageInput): TriageOutput {
    const text = `${input.subject} ${input.description}`.toLowerCase();

    const { category, queue, score } = classifyCategory(text);
    const impact = detectImpact(text);
    const urgency = detectUrgency(text, category);
    const priority = PRIORITY_MATRIX[impact][urgency];
    const missing_information = detectMissingInformation(text);

    let confidence: number;
    if (category === "other") {
      confidence = 0.2;
    } else {
      confidence = Math.min(0.95, 0.4 + score * 0.15);
      confidence = Math.max(0.1, confidence - missing_information.length * 0.05);
    }
    confidence = Math.round(confidence * 100) / 100;

    const rationale =
      category === "other"
        ? "No VPN sub-category keywords matched the ticket text; routed to general L1 triage for manual classification."
        : `Matched ${score} keyword signal(s) for "${category}"; impact/urgency derived from ticket text, priority from the impact x urgency matrix.`;

    return {
      category,
      impact,
      urgency,
      priority,
      missing_information,
      suggested_queue: queue,
      confidence,
      rationale,
    };
  }
}

export const demoTriageAdapter = new DemoTriageAdapter();
