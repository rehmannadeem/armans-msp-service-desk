// Deterministic, dependency-free "demo LLM" triage classifier. No network
// call, no randomness — same input always produces the same structured
// output, which is what makes lib/llm/demo-adapter.test.ts meaningful.
//
// This is intentionally rule-based rather than a real model call: BUILD_SPEC
// asks for a credible, testable demo, and a keyword taxonomy shared with the
// knowledge base (lib/domain/taxonomy.ts) is what makes the NO_APPROVED_
// GUIDANCE safety rule reachable and provable in tests.

import { CATEGORY_PRIORITY_ORDER, QUEUE_BY_CATEGORY, VPN_TAXONOMY } from "@/lib/domain/taxonomy";
import type { ImpactLevel, PriorityLevel, TriageResult, UrgencyLevel, VpnCategory } from "@/lib/domain/types";

const HIGH_IMPACT_PHRASES = [
  "all users",
  "entire office",
  "everyone",
  "whole team",
  "company-wide",
  "all employees",
  "multiple offices",
];

const LOW_IMPACT_PHRASES = ["just me", "only me", "single user", "my laptop", "one person"];

const HIGH_URGENCY_PHRASES = [
  "urgent",
  "asap",
  "cannot work",
  "completely down",
  "production down",
  "business critical",
  "right now",
  "immediately",
];

const LOW_URGENCY_PHRASES = ["whenever", "no rush", "minor", "not urgent", "low priority"];

const ERROR_DETAIL_PATTERN = /(error|code\s?\d+|timeout|denied|failed with|rejected)/i;
const CLIENT_VERSION_PATTERN =
  /(cisco anyconnect|globalprotect|forticlient|openvpn|wireguard|pulse secure|version\s?\d)/i;
const PLATFORM_PATTERN = /(windows|mac ?os|macos|linux|ios|android)/i;
const TIMING_PATTERN = /(today|yesterday|since|started|this morning|last night|\bam\b|\bpm\b|\d{1,2}\/\d{1,2})/i;

const PRIORITY_MATRIX: Record<ImpactLevel, Record<UrgencyLevel, PriorityLevel>> = {
  high: { high: "critical", medium: "high", low: "medium" },
  medium: { high: "high", medium: "medium", low: "low" },
  low: { high: "medium", medium: "low", low: "low" },
};

function countMatches(text: string, phrases: string[]): number {
  return phrases.filter((p) => text.includes(p)).length;
}

function classifyCategory(text: string): { category: VpnCategory; matchedKeywords: string[]; score: number } {
  let bestCategory: VpnCategory = "vpn_other";
  let bestScore = 0;

  for (const category of CATEGORY_PRIORITY_ORDER) {
    const score = countMatches(text, VPN_TAXONOMY[category]);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  const matchedKeywords = bestScore > 0 ? VPN_TAXONOMY[bestCategory].filter((p) => text.includes(p)) : [];
  return { category: bestCategory, matchedKeywords, score: bestScore };
}

function classifyImpact(text: string): ImpactLevel {
  if (countMatches(text, HIGH_IMPACT_PHRASES) > 0) return "high";
  if (countMatches(text, LOW_IMPACT_PHRASES) > 0) return "low";
  return "medium";
}

function classifyUrgency(text: string): UrgencyLevel {
  if (countMatches(text, HIGH_URGENCY_PHRASES) > 0) return "high";
  if (countMatches(text, LOW_URGENCY_PHRASES) > 0) return "low";
  return "medium";
}

function findMissingInformation(text: string): string[] {
  const missing: string[] = [];
  if (!ERROR_DETAIL_PATTERN.test(text)) missing.push("Exact error message or code shown to the user");
  if (!CLIENT_VERSION_PATTERN.test(text)) missing.push("VPN client name and version");
  if (!PLATFORM_PATTERN.test(text)) missing.push("Operating system and version of the affected device");
  if (!TIMING_PATTERN.test(text)) missing.push("When the issue started and whether it is intermittent or constant");
  if (countMatches(text, [...HIGH_IMPACT_PHRASES, ...LOW_IMPACT_PHRASES]) === 0) {
    missing.push("Number of users/devices affected");
  }
  return missing;
}

export function classifyTicket(subject: string, description: string): TriageResult {
  const text = `${subject}\n${description}`.toLowerCase();

  const { category, matchedKeywords, score } = classifyCategory(text);
  const impact = classifyImpact(text);
  const urgency = classifyUrgency(text);
  const priority = PRIORITY_MATRIX[impact][urgency];
  const missingInformation = findMissingInformation(text);
  const suggestedQueue = QUEUE_BY_CATEGORY[category];

  let confidence = 0.35;
  if (score >= 3) confidence = 0.9;
  else if (score === 2) confidence = 0.75;
  else if (score === 1) confidence = 0.6;

  if (missingInformation.length >= 3) confidence -= 0.1;
  confidence = Math.min(0.95, Math.max(0.2, Number(confidence.toFixed(2))));

  return {
    category,
    impact,
    urgency,
    priority,
    missingInformation,
    suggestedQueue,
    confidence,
    matchedKeywords,
  };
}
