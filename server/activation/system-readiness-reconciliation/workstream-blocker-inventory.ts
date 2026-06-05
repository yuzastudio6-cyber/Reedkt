import type { SystemBlockerRecord, SystemRepoOwnershipAudit } from './system-readiness-reconciliation-types'

export function buildSystemBlockerInventory(audit: SystemRepoOwnershipAudit): SystemBlockerRecord[] {
  const base: SystemBlockerRecord[] = [
    blocker('production_not_allowed', 'SYSTEM', 'critical', true, true, true, true, 'Production readiness remains disabled across Phase 52E evidence.', 'system readiness owner', 'Production readiness reconciliation remains future-scoped.'),
    blocker('external_beta_not_allowed', 'SYSTEM', 'critical', false, true, true, true, 'External beta remains disabled.', 'system readiness owner', 'External beta gate remains blocked until owner readiness passes.'),
    blocker('broad_media_not_allowed', 'SYSTEM', 'critical', false, true, true, true, 'Broad media remains disabled.', 'system readiness owner', 'Broad media policy review remains future-scoped.'),
    blocker('public_artifacts_not_allowed', 'SYSTEM', 'critical', true, true, true, true, 'Private GCS is the artifact store; public artifacts remain blocked.', 'system readiness owner', 'Keep private artifact policy in every owner packet.'),
    blocker('raw_prompt_execution_not_allowed', 'SYSTEM', 'critical', true, true, true, true, 'Approved snapshots and manifests remain source of truth.', 'system readiness owner', 'Do not allow workers to execute raw prompt text.'),
    blocker('worker_execution_not_allowed_in_phase52f', 'WORKER_RUNTIME_JOBS', 'critical', true, true, true, true, 'Phase 52F is planning only.', 'Worker Runtime/jobs owner', 'Define worker claim and approved snapshot execution contract.'),
    blocker('provider_calls_not_allowed', 'PROVIDER_GATEWAY_MODELS', 'critical', true, true, true, true, 'Provider calls remain disabled.', 'Provider Gateway/models owner', 'Provider Gateway execution policy review.'),
    blocker('ai_tools_missing_manifest', 'AI_TOOLS_CREATIVE_GRAPHICS', 'medium', false, true, true, true, 'Phase 52B has placeholders only.', 'AI Tools chat', 'Prompt GD-0 — AI Tools / Graphic Design Stack Repo Audit.'),
    blocker('track_b_vlm_blocked', 'TRACK_B_MEDIA_PROCESSING', 'high', false, true, true, true, 'VLM excluded after Phase 39C L4/vLLM CUDA OOM.', 'Track B media/audio/VLM owner', 'Track B VLM runtime resolution.'),
    blocker('track_b_demucs_blocked', 'TRACK_B_MEDIA_PROCESSING', 'high', false, true, true, true, 'Demucs remains blocked pending model provenance/runtime QA.', 'Track B media/audio/VLM owner', 'Demucs provenance and runtime QA review.'),
    blocker('worker_runtime_execution_contract_needed', 'WORKER_RUNTIME_JOBS', 'high', true, true, true, true, 'Candidate plans are non-executable until Worker Runtime owns execution.', 'Worker Runtime/jobs owner', 'Worker Runtime approved snapshot execution contract review.'),
    blocker('provider_gateway_execution_policy_needed', 'PROVIDER_GATEWAY_MODELS', 'high', false, true, true, true, 'Provider/model execution boundaries are policy-only.', 'Provider Gateway/models owner', 'Provider Gateway execution policy review.'),
    blocker('compliance_security_review_needed', 'COMPLIANCE_SECURITY', 'high', false, true, true, true, 'Compliance/security readiness is not closed.', 'Compliance/security owner', 'Compliance/security internal beta prerequisite review.'),
    blocker('observability_audit_cost_controls_needed', 'OBSERVABILITY_AUDIT_COST', 'high', false, true, true, true, 'Audit/abuse/cost controls are not closed.', 'Observability/audit/cost owner', 'Observability abuse and cost readiness review.'),
    blocker('frontend_product_ux_internal_flow_needed', 'FRONTEND_PRODUCT_UX', 'medium', false, true, true, true, 'User-facing internal beta flows require UX owner validation.', 'Frontend product UX owner', 'Frontend internal test UX contract review.'),
    blocker('billing_stripe_credit_flow_needed', 'BILLING_STRIPE_CREDITS', 'high', false, true, true, true, 'Billing/credit flows remain disabled.', 'Billing/Stripe credits owner', 'Billing/credit internal test gate review.'),
  ]
  if (audit.missingSourceOfTruthDocs.some((item) => item.path === 'docs/cross-chat')) {
    base.push(blocker('missing_cross_chat_docs_if_any', 'SYSTEM', 'medium', false, true, true, true, 'docs/cross-chat is absent on this activation base.', 'cross-chat coordination owner', 'XCHAT registry merge or owner handoff before broad coordination.'))
  }
  return base
}

function blocker(
  blockerId: string,
  workstream: SystemBlockerRecord['workstream'],
  severity: SystemBlockerRecord['severity'],
  blocksInternalTesting: boolean,
  blocksInternalBeta: boolean,
  blocksExternalBeta: boolean,
  blocksProduction: boolean,
  currentEvidence: string,
  requiredOwner: string,
  recommendedNextPrompt: string,
): SystemBlockerRecord {
  return { blockerId, workstream, severity, blocksInternalTesting, blocksInternalBeta, blocksExternalBeta, blocksProduction, currentEvidence, requiredOwner, recommendedNextPrompt }
}
