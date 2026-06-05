import { existsSync } from 'node:fs'
import type { SystemRepoOwnershipAudit, SystemSourceFileAudit, WorkstreamId } from './system-readiness-reconciliation-types'

const relatedWorkstreams: WorkstreamId[] = [
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'MAP_GEOSPATIAL',
  'SOUND_MUSIC_AUDIO',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'COMPLIANCE_SECURITY',
  'OBSERVABILITY_AUDIT_COST',
  'FRONTEND_PRODUCT_UX',
  'BILLING_STRIPE_CREDITS',
]

const requiredBaseFiles = ['README.md', 'AGENTS.md', 'docs/agents/source-of-truth-policy.md', 'docs/agents/cross-track-handoff-template.md']

const expectedButOptionalFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/production-architecture-freeze.md',
  'docs/architecture-boundary-matrix.md',
  'docs/future-backend-service-map.md',
  'docs/future-worker-lanes.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/worker-claim-execution-contract-hardening.md',
  'docs/provider-gateway-foundation.md',
  'docs/render-preview-export-foundation.md',
  'docs/media-readiness-probe-timing-foundation.md',
  'docs/compliance-license-security-review-foundation.md',
  'docs/observability-audit-abuse-cost-foundation.md',
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
]

export function buildSystemSourceAudit(createdAt = new Date()): SystemRepoOwnershipAudit {
  const filesInspected: SystemSourceFileAudit[] = [
    ...requiredBaseFiles.map((filePath) => auditFile(filePath, 'required_base_contract', true)),
    ...expectedButOptionalFiles.map((filePath) => auditFile(filePath, filePath.startsWith('docs/cross-chat') ? 'cross_chat_contract' : 'foundation_contract', false)),
  ]
  const missingSourceOfTruthDocs = filesInspected.filter((item) => !item.present)
  const blockers = filesInspected.filter((item) => item.blockingForPhase52F && !item.present).map((item) => `Missing required source-of-truth file: ${item.path}`)
  const warnings = missingSourceOfTruthDocs.filter((item) => !item.blockingForPhase52F).map((item) => `${item.path} is absent on this activation base and recorded as an audit gap.`)
  return {
    auditId: 'phase52f_repo_ownership_audit',
    createdAt: createdAt.toISOString(),
    workstreamOwner: 'shared_system_integration_readiness_layer',
    relatedWorkstreams,
    explicitlyNotOwned: [
      'AI Tools graphics implementation',
      'Track B runtime/model/media execution',
      'Supabase schema/RLS/migrations',
      'Provider Gateway execution',
      'Worker Runtime execution',
      'Compliance implementation',
      'Observability implementation',
      'Frontend UX implementation',
      'Billing/Stripe implementation',
    ],
    integrationPoints: ['tool capability registry', 'approved-plan snapshot validation', 'handoff packets', 'Supabase milestone registry', 'feature gates', 'readiness snapshots', 'blocker inventory'],
    filesInspected,
    missingSourceOfTruthDocs,
    duplicateSystemReadinessImplementationDetected: false,
    implementationAllowed: blockers.length === 0,
    findings: [
      'Phase 52F is owned by the shared system integration/readiness layer in this chat.',
      'Runtime execution ownership remains outside Phase 52F.',
      'Absent foundation/cross-chat docs are tracked as reconciliation gaps rather than inferred.',
    ],
    blockers,
    warnings,
  }
}

function auditFile(path: string, category: SystemSourceFileAudit['category'], blocking: boolean): SystemSourceFileAudit {
  const present = existsSync(path)
  return {
    path,
    present,
    category,
    blockingForPhase52F: blocking,
    owner: category === 'cross_chat_contract' ? 'cross-chat coordination' : category === 'agent_contract' ? 'shared agent architecture' : 'system readiness',
    finding: present ? 'present' : blocking ? 'required file missing' : 'absent on this activation base; recorded as audit gap',
    recommendedAction: present ? 'use as source-of-truth evidence' : blocking ? 'restore before Phase 52F execution' : 'handoff to owning workstream if later phases require it',
  }
}
