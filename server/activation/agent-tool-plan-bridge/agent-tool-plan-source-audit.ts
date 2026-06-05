import { existsSync } from 'node:fs'
import type { RepoOwnershipAudit, SourceTruthFileAudit } from './agent-tool-plan-bridge-types'

const expectedFiles: Array<{ path: string; role: SourceTruthFileAudit['role']; note: string }> = [
  { path: 'README.md', role: 'required_source_of_truth', note: 'Top-level activation status and blocked scope.' },
  { path: 'AGENTS.md', role: 'required_source_of_truth', note: 'Repo agent rules, approved snapshot, raw prompt, and worker execution boundaries.' },
  { path: 'PRODUCTION_FOUNDATION_STATUS.md', role: 'required_source_of_truth', note: 'Foundation branch status if present on this base.' },
  { path: 'docs/source-of-truth-map.md', role: 'required_source_of_truth', note: 'Foundation source-of-truth map if present on this base.' },
  { path: 'docs/production-milestone-plan.md', role: 'required_source_of_truth', note: 'Foundation milestone plan if present on this base.' },
  { path: 'docs/production-architecture-freeze.md', role: 'required_source_of_truth', note: 'Production architecture freeze if present on this base.' },
  { path: 'docs/architecture-boundary-matrix.md', role: 'required_source_of_truth', note: 'Cross-workstream boundary matrix if present on this base.' },
  { path: 'docs/future-backend-service-map.md', role: 'required_source_of_truth', note: 'Future backend service map if present on this base.' },
  { path: 'docs/future-worker-lanes.md', role: 'required_source_of_truth', note: 'Future worker lane ownership if present on this base.' },
  { path: 'docs/tool-call-foundation.md', role: 'required_source_of_truth', note: 'Tool-call foundation if present on this base.' },
  { path: 'docs/tool-readiness-worker-runtime-foundation.md', role: 'required_source_of_truth', note: 'Tool readiness and worker runtime foundation if present on this base.' },
  { path: 'docs/worker-claim-execution-contract-hardening.md', role: 'required_source_of_truth', note: 'Worker claim execution contract if present on this base.' },
  { path: 'docs/provider-gateway-foundation.md', role: 'required_source_of_truth', note: 'Provider gateway execution boundary if present on this base.' },
  { path: 'docs/render-preview-export-foundation.md', role: 'required_source_of_truth', note: 'Track A render/export boundary if present on this base.' },
  { path: 'docs/media-readiness-probe-timing-foundation.md', role: 'required_source_of_truth', note: 'Track B/media readiness boundary if present on this base.' },
  { path: 'docs/compliance-license-security-review-foundation.md', role: 'required_source_of_truth', note: 'Compliance/security boundary if present on this base.' },
  { path: 'docs/observability-audit-abuse-cost-foundation.md', role: 'required_source_of_truth', note: 'Observability/audit/cost boundary if present on this base.' },
  { path: 'docs/supabase-milestone-sync-policy.md', role: 'required_source_of_truth', note: 'Supabase sync policy if present on this base.' },
  { path: 'docs/supabase-success-milestone-reporting-standard.md', role: 'required_source_of_truth', note: 'Supabase milestone reporting standard if present on this base.' },
  { path: 'docs/beta-readiness-scorecard.md', role: 'required_source_of_truth', note: 'Beta readiness scorecard if present on this base.' },
  { path: 'docs/production-beta-blocker-inventory.md', role: 'required_source_of_truth', note: 'Production/beta blocker inventory if present on this base.' },
  { path: 'docs/implementation-prompts/README.md', role: 'required_source_of_truth', note: 'Implementation prompt index if present on this base.' },
  { path: 'docs/cross-chat', role: 'optional_cross_chat', note: 'XCHAT-0 coordination docs are absent on the Phase 52C activation base unless merged later.' },
  { path: 'docs/agents', role: 'agent_contract', note: 'Phase 52A-52C agent architecture, schema, routing, handoff, source-of-truth, and registry docs.' },
]

export function buildAgentToolPlanSourceAudit(date = new Date()): RepoOwnershipAudit {
  const filesInspected = expectedFiles.map((item) => ({ ...item, present: existsSync(item.path) }))
  const missingExpectedFiles = filesInspected.filter((item) => !item.present).map((item) => item.path)
  const agentDocsPresent = filesInspected.find((item) => item.path === 'docs/agents')?.present === true
  const blockers = agentDocsPresent ? [] : ['docs/agents is required for Phase 52D agent contracts and is missing.']
  return {
    auditId: 'phase52d_repo_ownership_audit',
    createdAt: date.toISOString(),
    workstreamOwner: 'shared_agent_tool_coordination',
    relatedWorkstreams: ['TRACK_A_RENDER_EXPORT', 'WEB_SEARCH_CAPTURE', 'MAP_GEOSPATIAL', 'AI_TOOLS_CREATIVE_GRAPHICS', 'TRACK_B_MEDIA_PROCESSING', 'WORKER_RUNTIME_JOBS', 'SUPABASE_MILESTONE_SYNC'],
    explicitlyNotOwned: [
      'AI Tools creative graphics execution',
      'Track B media/runtime/model execution',
      'Supabase schema, RLS, migration, or product-row ownership',
      'Provider gateway/model routing execution',
      'Worker job execution',
      'Frontend product UX implementation',
      'Billing, Stripe, and credit mutation',
    ],
    integrationPoints: ['Phase 52B tool capability registry', 'Phase 52C agent findings and edit intents', 'Phase 52A approved plan snapshot schema', 'Phase 52A cross-track handoff template', 'Phase 51D Supabase milestone sync'],
    filesInspected,
    missingExpectedFiles,
    duplicateBridgeDetected: false,
    duplicateRisk: 'none_detected',
    implementationAllowed: blockers.length === 0,
    findings: [
      'Phase 52D is owned by the shared agent/tool coordination layer for candidate approved-plan bridge records only.',
      'Future execution remains owned by Worker Runtime and downstream workstream owners.',
      'Phase 52D may generate handoff packets but may not execute Track A, Track B, AI Tools, web search, map, provider, or worker runtime actions.',
    ],
    blockers,
    warnings: missingExpectedFiles.length ? [`${missingExpectedFiles.length} prompt-listed source-of-truth paths are absent on this activation base and are recorded as audit gaps, not inferred.`] : [],
  }
}
