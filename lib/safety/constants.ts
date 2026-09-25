// Critical safety rule (see BUILD_SPEC.md "Critical Safety Rule"):
// If approved evidence is missing or insufficient, the system must return exactly
// this literal string and must never invent troubleshooting steps. Every code path
// that produces technician-facing guidance funnels through composeRecommendation()
// in lib/domain/recommendation.ts, which is the only place allowed to emit this value.
export const NO_APPROVED_GUIDANCE = "NO_APPROVED_GUIDANCE" as const;
