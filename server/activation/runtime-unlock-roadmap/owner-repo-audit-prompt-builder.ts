import type { OwnerAcceptanceMatrix, OwnerRepoAuditPrompt, WorkstreamId } from './runtime-unlock-roadmap-types'

const commonContracts = [
  'README.md',
  'AGENTS.md',
  'docs/cross-chat/',
  'docs/agents/',
  'docs/runtime-unlock/',
  'docs/activation-phase-52h-cross-workstream-handoff-tracking-results.md',
  'server/activation/runtime-unlock-roadmap/',
] as const

const workstreamContracts: Record<WorkstreamId, string[]> = {
  AI_TOOLS_CREATIVE_GRAPHICS: ['docs/agents/tool-capability-registry.md', 'remotion-capability-matrix.md', 'render-strategy-planner.md'],
  TRACK_A_RENDER_EXPORT: ['docs/activation-phase-roadmap.md', 'remotion-renderer-plan.md', 'render-strategy-planner.md'],
  TRACK_B_MEDIA_PROCESSING: ['launch-tool-stack-update.md', 'tool-settings-catalog.md', 'video-understanding-report.md'],
  MAP_GEOSPATIAL: ['map-location-animation-planning.md', 'map-animation-settings-catalog.md', 'docs/activation-phase-50g-map-geospatial-readiness-results.md'],
  SOUND_MUSIC_AUDIO: ['soundsync-audio-pipeline-planning.md', 'audio-settings-catalog.md', 'soundsync-sfx-director.md'],
  SUPABASE_RLS_STORAGE_DATABASE: ['supabase-production-test-readiness.md', 'supabase-local-staging-test-plan.md', 'docs/activation-phase-51d-supabase-milestone-sync-results.md'],
  PROVIDER_GATEWAY_MODELS: ['model-routing-policy.md', 'generation-provider-architecture.md', 'provider-prompt-architecture.md'],
  WORKER_RUNTIME_JOBS: ['worker-tool-runtime-architecture.md', 'async-edit-work-graph.md', 'editing-agent-execution-architecture.md'],
  COMPLIANCE_SECURITY: ['data-privacy-retention-plan.md', 'documentary-fact-safety-system.md', 'tool-license-risk-policy.md'],
  OBSERVABILITY_AUDIT_COST: ['pricing-and-credits.md', 'credit-ledger-architecture.md', 'production-readiness-review.md'],
  FRONTEND_PRODUCT_UX: ['design.md', 'chat-planning-ux-architecture.md', 'tool-usage-planning-ui.md'],
  BILLING_STRIPE_CREDITS: ['pricing-and-credits.md', 'credit-ledger-architecture.md', 'approved-plan-snapshot-policy.md'],
}

export function buildOwnerRepoAuditPrompts(matrix: OwnerAcceptanceMatrix): OwnerRepoAuditPrompt[] {
  return matrix.rows.map((row) => ({
    promptId: row.repoAuditPromptName.split(' ')[1],
    title: row.repoAuditPromptName,
    workstream: row.workstream,
    owner: row.owner,
    crossChatOwnershipCheck: [
      `Confirm ${row.workstream} ownership and list any adjacent workstreams affected.`,
      'State that this audit does not implement runtime behavior.',
      'State duplicate-work risk and handoff needed.',
    ],
    filesAndContractsToInspect: [...commonContracts, ...workstreamContracts[row.workstream]],
    noImplementationUntilAudit: true,
    blockedScopes: row.blockedScopes,
    supabaseClassification: row.supabaseUpdateClassification,
    finalResponseFormat: [
      'Workstream updated',
      'Other workstreams affected',
      'Contracts changed',
      'Handoff needed',
      'Duplicate risk',
      'Next owner/prompt',
      'Supabase update classification',
      'Blocked scopes confirmation',
    ],
  }))
}
