import { buildSystemBlockerInventory } from '../system-readiness-reconciliation'
import type { GoNoGoBlockerRecord, GoNoGoSourceAudit, WorkstreamId } from './controlled-internal-test-go-no-go-types'
import type { SystemRepoOwnershipAudit } from '../system-readiness-reconciliation'

const requiredBlockers: Array<{ blockerId: string; workstream: WorkstreamId | 'SYSTEM'; severity: GoNoGoBlockerRecord['severity']; evidence: string; owner: string; next: string }> = [
  blocker('runtime_execution_blocked', 'SYSTEM', 'critical', 'Runtime execution remains no-go.', 'Shared system readiness owner', 'Phase 52H owner response intake'),
  blocker('worker_execution_blocked', 'WORKER_RUNTIME_JOBS', 'critical', 'Worker execution remains no-go.', 'Worker Runtime/jobs owner', 'Worker Runtime execution contract review'),
  blocker('production_blocked', 'SYSTEM', 'critical', 'Production remains blocked.', 'Producer + compliance/security', 'Production readiness gate'),
  blocker('external_beta_blocked', 'SYSTEM', 'critical', 'External beta remains blocked.', 'Producer + compliance/security', 'External beta go/no-go'),
  blocker('broad_media_blocked', 'SYSTEM', 'critical', 'Broad media remains blocked.', 'Producer + compliance/security', 'Broad media review'),
  blocker('public_artifacts_blocked', 'SYSTEM', 'critical', 'Public artifacts remain blocked.', 'Security/storage owner', 'Artifact policy review'),
  blocker('raw_prompt_execution_blocked', 'WORKER_RUNTIME_JOBS', 'critical', 'Workers must not execute raw prompts.', 'Worker Runtime/jobs owner', 'Approved snapshot execution contract'),
  blocker('provider_execution_blocked', 'PROVIDER_GATEWAY_MODELS', 'critical', 'Provider execution remains no-go.', 'Provider Gateway/models owner', 'Provider execution policy review'),
  blocker('ai_tools_manifest_pending', 'AI_TOOLS_CREATIVE_GRAPHICS', 'medium', 'AI Tools manifests are placeholders pending owner confirmation.', 'AI Tools chat', 'Prompt GD-0'),
  blocker('track_b_vlm_blocked', 'TRACK_B_MEDIA_PROCESSING', 'high', 'VLM remains excluded after prior runtime constraints.', 'Track B media/VLM owner', 'Track B runtime blocker reconciliation'),
  blocker('track_b_demucs_blocked', 'TRACK_B_MEDIA_PROCESSING', 'high', 'Demucs remains blocked pending model provenance/runtime QA.', 'Track B audio owner', 'Demucs provenance review'),
  blocker('worker_runtime_contract_needed', 'WORKER_RUNTIME_JOBS', 'high', 'Worker claims/execution contracts are not enabled.', 'Worker Runtime/jobs owner', 'Worker execution contract review'),
  blocker('provider_gateway_policy_needed', 'PROVIDER_GATEWAY_MODELS', 'high', 'Provider gateway execution policy needs owner review.', 'Provider Gateway/models owner', 'Provider policy review'),
  blocker('compliance_security_needed', 'COMPLIANCE_SECURITY', 'high', 'Compliance/security review is needed before beta/production.', 'Compliance/security owner', 'Compliance/security prerequisite review'),
  blocker('observability_cost_needed', 'OBSERVABILITY_AUDIT_COST', 'high', 'Observability, abuse, and cost controls need owner review.', 'Observability/audit/cost owner', 'Observability readiness review'),
  blocker('frontend_ux_needed', 'FRONTEND_PRODUCT_UX', 'medium', 'Frontend UX contracts need owner review.', 'Frontend product UX owner', 'Frontend internal test UX review'),
  blocker('billing_needed', 'BILLING_STRIPE_CREDITS', 'high', 'Billing/Stripe/credits remain blocked for paid production.', 'Billing/Stripe credits owner', 'Billing/credit gate review'),
]

export function buildGoNoGoBlockerInventory(repoOwnershipAudit: GoNoGoSourceAudit): GoNoGoBlockerRecord[] {
  const carried = buildSystemBlockerInventory(repoOwnershipAudit as unknown as SystemRepoOwnershipAudit).map((item) => ({ ...item, phase52GRequired: true as const }))
  const missingCrossChat: GoNoGoBlockerRecord[] = repoOwnershipAudit.missingSourceOfTruthDocs.length
    ? [
        {
          blockerId: 'missing_cross_chat_docs_if_any',
          workstream: 'SYSTEM',
          severity: 'medium',
          blocksInternalTesting: false,
          blocksInternalBeta: true,
          blocksExternalBeta: true,
          blocksProduction: true,
          currentEvidence: 'Foundation/cross-chat docs are absent on this activation base and remain an audit gap.',
          requiredOwner: 'Cross-chat coordination owner',
          recommendedNextPrompt: 'Cross-chat owner response intake',
          phase52GRequired: true as const,
        },
      ]
    : []
  return [
    ...requiredBlockers.map((item) => ({
      blockerId: item.blockerId,
      workstream: item.workstream,
      severity: item.severity,
      blocksInternalTesting: false,
      blocksInternalBeta: true,
      blocksExternalBeta: true,
      blocksProduction: true,
      currentEvidence: item.evidence,
      requiredOwner: item.owner,
      recommendedNextPrompt: item.next,
      phase52GRequired: true as const,
    })),
    ...missingCrossChat,
    ...carried.filter((item) => !requiredBlockers.some((required) => required.blockerId === item.blockerId)),
  ]
}

function blocker(blockerId: string, workstream: WorkstreamId | 'SYSTEM', severity: GoNoGoBlockerRecord['severity'], evidence: string, owner: string, next: string) {
  return { blockerId, workstream, severity, evidence, owner, next }
}
