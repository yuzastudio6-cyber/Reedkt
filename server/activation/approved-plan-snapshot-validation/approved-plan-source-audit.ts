import { existsSync } from 'node:fs'
import type { ApprovedPlanRepoOwnershipAudit, ApprovedPlanSourceTruthFileAudit } from './approved-plan-validation-types'

const expectedFiles: Array<Omit<ApprovedPlanSourceTruthFileAudit, 'present' | 'severity' | 'blockingForPhase52E'>> = [
  { path: 'README.md', owner: 'system_readiness', role: 'required_source_of_truth', impact: 'Top-level product and activation scope.', followUp: 'Keep blocked runtime scope visible.' },
  { path: 'AGENTS.md', owner: 'repo_agent_rules', role: 'required_source_of_truth', impact: 'Raw prompt, approved snapshot, and worker execution rules.', followUp: 'Preserve worker-approved-snapshot boundaries.' },
  { path: 'PRODUCTION_FOUNDATION_STATUS.md', owner: 'foundation_status', role: 'foundation_contract', impact: 'Foundation status if present on this base.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/source-of-truth-map.md', owner: 'foundation_status', role: 'foundation_contract', impact: 'Global source-of-truth map if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/production-milestone-plan.md', owner: 'foundation_status', role: 'foundation_contract', impact: 'Production milestone plan if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/production-architecture-freeze.md', owner: 'foundation_status', role: 'foundation_contract', impact: 'Production architecture freeze if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/architecture-boundary-matrix.md', owner: 'foundation_status', role: 'foundation_contract', impact: 'Cross-workstream boundary matrix if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/future-backend-service-map.md', owner: 'backend_services', role: 'foundation_contract', impact: 'Future backend services if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/future-worker-lanes.md', owner: 'worker_runtime', role: 'foundation_contract', impact: 'Future worker lane ownership if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/tool-call-foundation.md', owner: 'worker_runtime', role: 'foundation_contract', impact: 'Tool-call boundary if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/tool-readiness-worker-runtime-foundation.md', owner: 'worker_runtime', role: 'foundation_contract', impact: 'Worker runtime foundation if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/worker-claim-execution-contract-hardening.md', owner: 'worker_runtime', role: 'foundation_contract', impact: 'Worker claim contract if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/provider-gateway-foundation.md', owner: 'provider_gateway', role: 'foundation_contract', impact: 'Provider gateway boundary if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/render-preview-export-foundation.md', owner: 'track_a_render_export', role: 'foundation_contract', impact: 'Track A render/export boundary if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/media-readiness-probe-timing-foundation.md', owner: 'track_b_media_processing', role: 'foundation_contract', impact: 'Track B/media boundary if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/compliance-license-security-review-foundation.md', owner: 'compliance_security', role: 'foundation_contract', impact: 'Compliance/security boundary if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/observability-audit-abuse-cost-foundation.md', owner: 'observability_audit_cost', role: 'foundation_contract', impact: 'Observability/audit/cost boundary if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/supabase-milestone-sync-policy.md', owner: 'supabase_milestone_sync', role: 'required_source_of_truth', impact: 'Supabase sync policy if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/supabase-success-milestone-reporting-standard.md', owner: 'supabase_milestone_sync', role: 'required_source_of_truth', impact: 'Supabase milestone reporting standard if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/beta-readiness-scorecard.md', owner: 'system_readiness', role: 'required_source_of_truth', impact: 'Beta readiness blocker state if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/production-beta-blocker-inventory.md', owner: 'system_readiness', role: 'required_source_of_truth', impact: 'Production/beta blocker inventory if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/implementation-prompts/README.md', owner: 'implementation_prompt_registry', role: 'required_source_of_truth', impact: 'Prompt registry if present.', followUp: 'Record as missing contract if absent.' },
  { path: 'docs/cross-chat', owner: 'cross_chat_coordination', role: 'optional_cross_chat', impact: 'XCHAT coordination docs may be absent on this activation base.', followUp: 'Use XCHAT branch as follow-up if absent.' },
  { path: 'docs/agents', owner: 'shared_agent_tool_coordination', role: 'agent_contract', impact: 'Phase 52A-52D agent architecture and contract docs.', followUp: 'Block Phase 52E if absent.' },
]

export function buildApprovedPlanSourceAudit(date = new Date()): ApprovedPlanRepoOwnershipAudit {
  const filesInspected = expectedFiles.map((item) => {
    const present = existsSync(item.path)
    const blocks = item.path === 'docs/agents' && !present
    return {
      ...item,
      present,
      severity: blocks ? 'blocker' : present ? 'info' : 'warning',
      blockingForPhase52E: blocks,
    } satisfies ApprovedPlanSourceTruthFileAudit
  })
  const missingExpectedFiles = filesInspected.filter((item) => !item.present).map((item) => item.path)
  const blockers = filesInspected.filter((item) => item.blockingForPhase52E).map((item) => `${item.path} is required for Phase 52E validation.`)
  return {
    auditId: 'phase52e_repo_ownership_audit',
    createdAt: date.toISOString(),
    workstreamOwner: 'shared_agent_tool_coordination',
    relatedWorkstreams: [
      'TRACK_A_RENDER_EXPORT',
      'AI_TOOLS_CREATIVE_GRAPHICS',
      'TRACK_B_MEDIA_PROCESSING',
      'MAP_GEOSPATIAL',
      'WEB_SEARCH_CAPTURE',
      'SUPABASE_MILESTONE_SYNC',
      'WORKER_RUNTIME_JOBS',
      'PROVIDER_GATEWAY_MODELS',
      'COMPLIANCE_SECURITY',
      'OBSERVABILITY_AUDIT_COST',
      'FRONTEND_PRODUCT_UX',
      'BILLING_STRIPE_CREDITS',
    ],
    explicitlyNotOwned: [
      'Worker execution and job dispatch',
      'Track A final render/export execution',
      'AI Tools creative graphics execution',
      'Track B media/model/runtime execution',
      'Supabase schema/RLS/migration ownership',
      'Provider gateway execution',
      'Compliance implementation',
      'Observability implementation',
      'Frontend UX implementation',
      'Billing and Stripe credit mutation',
    ],
    integrationPoints: [
      'Phase 52D candidate approved-plan snapshots',
      'Phase 52D handoff packets',
      'Phase 52B tool capability registry',
      'Phase 51D Supabase milestone sync',
      'Source-of-truth docs and worker contracts',
      'Feature gates and blocked runtime scopes',
    ],
    filesInspected,
    missingExpectedFiles,
    duplicateValidationDetected: false,
    implementationAllowed: blockers.length === 0,
    findings: [
      'Phase 52E is owned by shared agent/tool coordination for candidate validation and system reconciliation only.',
      'Candidate snapshots remain candidate-only and must not be approved for runtime by this phase.',
      'Workers and downstream track owners remain the future execution owners.',
    ],
    blockers,
    warnings: missingExpectedFiles.length ? [`${missingExpectedFiles.length} prompt-listed source-of-truth paths are absent and recorded in missing-contract inventory.`] : [],
  }
}
