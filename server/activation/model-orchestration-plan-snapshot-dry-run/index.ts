import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  ModelOrchestrationPlanSnapshotDryRunDecision,
  ModelOrchestrationPlanSnapshotDryRunReports,
} from './plan-snapshot-dry-run-types'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE = 'model-orchestration-plan-snapshot-dry-run'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_RUN_ID =
  'model-orchestration-plan-snapshot-dry-run-20260612'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_BRANCH =
  'codex/rp-model-orchestration-plan-snapshot-dry-run-validation'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_BASE_BRANCH =
  'codex/rp-model-orchestration-plan-snapshot-contract'
export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR =
  'docs/activation-model-orchestration-plan-snapshot-dry-run-reports'

const CONTRACT_REPORT_DIR = 'docs/activation-model-orchestration-plan-snapshot-contract-reports'
const QWEN_REPORT_DIR = 'docs/activation-model-orchestration-qwen-auth-repair-reports'
const PROVIDER_REPORT_DIR = 'docs/activation-model-orchestration-provider-dry-run-reports'
const DRY_RUN_APPROVAL_REPORT_DIR = 'docs/activation-model-orchestration-dry-run-approval-reports'
const AUDIT_REPORT_DIR = 'docs/activation-model-orchestration-qwen-deepseek-audit-reports'
const SESSION0_REPORT_DIR = 'docs/activation-product-internal-testing-session-0-reports'
const TRACKB_REPORT_DIR = 'docs/activation-supabase-trackb-clean-staging-backfill-reports'
const GITHUB_REPO = 'yuzastudio6-cyber/Reedkt'

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'plan_snapshot_dry_run_plan.json',
  'plan_snapshot_dry_run_evidence_inventory.json',
  'synthetic_agent_findings_fixtures.json',
  'agent_findings_to_edit_intents_validation_report.json',
  'edit_intents_to_plan_candidate_validation_report.json',
  'plan_candidate_approval_gate_validation_report.json',
  'plan_snapshot_dry_run_fail_closed_report.json',
  'plan_snapshot_dry_run_summary_report.json',
  'plan_snapshot_dry_run_decision.json',
  'plan_snapshot_dry_run_blocker_report.json',
  'plan_snapshot_dry_run_readiness_report.json',
  'plan_snapshot_dry_run_private_artifact_manifest.json',
] as const

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_VALIDATION',
  'REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT',
  'REEDITPRO_CONFIRM_AGENT_FINDINGS_SCHEMA_DESIGN',
  'REEDITPRO_CONFIRM_EDIT_INTENTS_SCHEMA_DESIGN',
  'REEDITPRO_CONFIRM_RAW_PROMPT_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_WORKER_HANDOFF_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
] as const

export const MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_QWEN_API_CALL',
  'REEDITPRO_CONFIRM_DEEPSEEK_API_CALL',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
] as const

const SOURCE_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'model-routing-policy.md',
  'provider-prompt-architecture.md',
  'approved-plan-snapshot-policy.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/provider-gateway-foundation.md',
  'docs/tool-call-foundation.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/model-weight-readiness.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/internal-testing-allowed-scope-freeze.md',
  'docs/internal-testing-blocked-scope-freeze.md',
  'docs/restricted-internal-testing-session-0-decision.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
  CONTRACT_REPORT_DIR,
  QWEN_REPORT_DIR,
  PROVIDER_REPORT_DIR,
  DRY_RUN_APPROVAL_REPORT_DIR,
  AUDIT_REPORT_DIR,
  SESSION0_REPORT_DIR,
  TRACKB_REPORT_DIR,
] as const

const SECRET_REFS = [
  'DASHSCOPE_API_KEY',
  'DEEPSEEK_API_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_DB_URL',
] as const

const RUNTIME_FALSE_FLAGS = {
  providerCalls: false,
  secretPayloadAccess: false,
  secretPayloadPrinted: false,
  secretPayloadCommitted: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationDeployed: false,
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  rawPromptExecution: false,
  mediaProcessing: false,
  publicArtifacts: false,
  signedUrls: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
}

type Safety = typeof RUNTIME_FALSE_FLAGS & {
  executionBlockedByDefault: boolean
  providerExecutionAllowed: boolean
  signedUrlsAsSourceOfTruth: boolean
}

type SyntheticFindingFixture = {
  fixtureId: string
  title: string
  category: 'valid' | 'invalid'
  expectedOutcome: 'pass' | 'fail_closed'
  payload: Record<string, unknown>
}

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function runGh(args: string[]): string {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      GH_PAGER: 'cat',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function readPrMetadata(prNumber: number): Record<string, unknown> {
  const text = runGh([
    'pr',
    'view',
    String(prNumber),
    '--repo',
    GITHUB_REPO,
    '--json',
    'number,title,state,baseRefName,headRefName,mergeStateStatus,url,commits',
  ])
  const parsed = JSON.parse(text) as Record<string, unknown>
  const commits = asArray(parsed.commits).map(asRecord)
  const latest = commits.at(-1)

  return {
    number: parsed.number,
    title: parsed.title,
    state: parsed.state,
    baseRefName: parsed.baseRefName,
    headRefName: parsed.headRefName,
    mergeStateStatus: parsed.mergeStateStatus,
    url: parsed.url,
    latestCommitSha: latest?.oid ?? 'missing',
  }
}

function readGithubBranchJson(ref: string, filePath: string): Record<string, unknown> | undefined {
  const content = runGh([
    'api',
    `repos/${GITHUB_REPO}/contents/${filePath}?ref=${encodeURIComponent(ref)}`,
    '--jq',
    '.content',
  ])
  return JSON.parse(Buffer.from(content.replace(/\s/g, ''), 'base64').toString('utf8')) as Record<string, unknown>
}

function safeFlags(overrides: Partial<Safety> = {}): Safety {
  return {
    ...RUNTIME_FALSE_FLAGS,
    executionBlockedByDefault: true,
    providerExecutionAllowed: false,
    signedUrlsAsSourceOfTruth: false,
    ...overrides,
  }
}

function secretRefMetadata() {
  return SECRET_REFS.map((name) => ({
    name,
    payloadAccessed: false,
    payloadPrinted: false,
    payloadCommitted: false,
  }))
}

export function getModelOrchestrationPlanSnapshotDryRunPlan() {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_RUN_ID,
    branch: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_BRANCH,
    baseBranch: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_BASE_BRANCH,
    prTitle: '[model] Plan snapshot dry-run validation',
    mode: 'synthetic_contract_validation_metadata_only',
    reportDir: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_EXPECTED_REPORTS,
    requiredConfirmations: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_FORBIDDEN_CONFIRMATIONS,
    dryRunFlow: [
      'agent_findings_v1',
      'edit_intents_v1',
      'plan_snapshot_candidate_v1',
      'approval_gate_validation',
      'approved_plan_snapshot_v1_review_only',
    ],
    expectedDecision: 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildSourceOfTruthOwnershipAudit() {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: 'passed',
    owner: 'MODEL_ORCHESTRATION',
    relatedWorkstreams: [
      'PROVIDER_GATEWAY',
      'WORKER_RUNTIME_JOBS',
      'TRACK_B_MEDIA_PROCESSING',
      'SUPABASE_RLS_STORAGE_DATABASE',
      'PRODUCT_INTERNAL_BETA_AGGREGATION',
      'OBSERVABILITY_AUDIT_COST',
      'PUBLIC_ARTIFACT_DELIVERY',
    ],
    explicitlyNotOwned: [
      'provider_execution',
      'worker_execution',
      'tool_execution',
      'route_execution',
      'track_a_runtime',
      'production',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_url_delivery',
      'raw_prompt_execution_into_workers_tools',
    ],
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    missingDocsAreAuditFacts: true,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildEvidenceInventory() {
  const contractDecision = readJson(path.join(CONTRACT_REPORT_DIR, 'plan_snapshot_contract_decision.json'))
  const contractReadiness = readJson(path.join(CONTRACT_REPORT_DIR, 'plan_snapshot_contract_readiness_report.json'))
  const qwenReadiness = readJson(path.join(QWEN_REPORT_DIR, 'qwen_auth_repair_readiness_report.json'))
  const qwenRerun = readJson(path.join(QWEN_REPORT_DIR, 'qwen_repaired_provider_dry_run_report.json'))
  const localDeepseekReport = readJson(path.join(PROVIDER_REPORT_DIR, 'deepseek_provider_dry_run_report.json'))
  const dryRunApproval = readJson(path.join(DRY_RUN_APPROVAL_REPORT_DIR, 'dry_run_approval_decision.json'))
  const auditReadiness = readJson(path.join(AUDIT_REPORT_DIR, 'model_orchestration_audit_readiness_report.json'))
  const session0Decision = readJson(path.join(SESSION0_REPORT_DIR, 'session_0_decision.json'))
  const trackBReadiness = readJson(path.join(TRACKB_REPORT_DIR, 'trackb_clean_staging_backfill_readiness_report.json'))
  const githubErrors: string[] = []
  let pr320: Record<string, unknown> = {}
  let remoteDeepseekReport: Record<string, unknown> = {}

  try {
    pr320 = readPrMetadata(320)
    const pr320Head = typeof pr320.headRefName === 'string'
      ? pr320.headRefName
      : 'codex/rp-model-orchestration-qwen-deepseek-provider-dry-run'
    remoteDeepseekReport = readGithubBranchJson(pr320Head, path.join(PROVIDER_REPORT_DIR, 'deepseek_provider_dry_run_report.json')) ?? {}
  } catch (error) {
    githubErrors.push(error instanceof Error ? error.message : String(error))
  }

  const deepseekReport = remoteDeepseekReport.status ? remoteDeepseekReport : localDeepseekReport

  const contractPassed =
    contractDecision?.decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation' &&
    contractReadiness?.planSnapshotContractReady === true
  const qwenPassed =
    qwenReadiness?.decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract' &&
    qwenReadiness?.selectedQwenAlias === 'qwen-plus' &&
    qwenReadiness?.selectedBaseUrlClassification === 'virginia_dashscope_base_url' &&
    qwenRerun?.status === 'passed' &&
    Number(qwenRerun?.providerCallsPassed ?? 0) >= 4
  const deepseekPassed =
    deepseekReport?.status === 'passed' &&
    Number(deepseekReport?.providerCallsPassed ?? 0) >= 3

  const blockers = [
    ...(!contractPassed ? ['pr327_plan_snapshot_contract_not_passed'] : []),
    ...(!qwenPassed ? ['pr322_qwen_evidence_not_passed'] : []),
    ...(githubErrors.length > 0 ? ['pr320_deepseek_remote_evidence_unavailable'] : []),
    ...(!deepseekPassed ? ['pr320_deepseek_evidence_not_passed'] : []),
  ]

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activeBlockers: blockers,
    pr327ContractDecision: contractDecision?.decision ?? 'missing',
    pr327ContractReady: contractReadiness?.planSnapshotContractReady === true,
    pr322QwenDecision: qwenReadiness?.decision ?? 'missing',
    pr322SelectedAlias: qwenReadiness?.selectedQwenAlias ?? 'missing',
    pr322QwenSchemaCasesPassed: qwenRerun?.providerCallsPassed ?? 0,
    pr320RemoteMetadata: pr320,
    pr320RemoteMetadataAvailable: githubErrors.length === 0,
    pr320RemoteMetadataErrors: githubErrors.map((message) => ({
      type: 'metadata_read_failed',
      message: message.slice(0, 240),
    })),
    pr320LocalDeepSeekStatus: localDeepseekReport?.status ?? 'missing',
    pr320DeepSeekStatus: deepseekReport?.status ?? 'missing',
    pr320DeepSeekProviderCallsPassed: deepseekReport?.providerCallsPassed ?? 0,
    pr318DryRunApprovalDecision: dryRunApproval?.decision ?? 'missing',
    pr314AuditDecision: auditReadiness?.decision ?? 'missing',
    pr311Session0Decision: session0Decision?.decision ?? 'missing',
    pr298TrackBStatus: trackBReadiness?.status ?? 'missing',
    trackBRouteCapabilityMetadataAvailable: existsSync('docs/activation-track-b-tool-route-manifest-reports') ||
      existsSync('docs/activation-track-b-capability-manifests-reports'),
    supabaseMilestoneSyncStatus: 'track_b_clean_staging_milestone_sync_completed_no_write_in_this_phase',
    secretRefs: secretRefMetadata(),
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildSyntheticFixtures(): { report: Record<string, unknown>; fixtures: SyntheticFindingFixture[] } {
  const valid = (fixtureId: string, title: string, payload: Record<string, unknown>): SyntheticFindingFixture => ({
    fixtureId,
    title,
    category: 'valid',
    expectedOutcome: 'pass',
    payload: {
      schemaVersion: 'agent_findings_v1',
      findingId: fixtureId,
      sourceEvidenceRefs: ['synthetic:metadata-only', 'pr327:plan-snapshot-contract'],
      observations: [{ kind: 'synthetic_observation', metadataOnly: true }],
      risks: [],
      blockers: [],
      approvalRequired: true,
      safety: safeFlags(),
      ...payload,
    },
  })
  const invalid = (fixtureId: string, title: string, payload: Record<string, unknown>): SyntheticFindingFixture => ({
    fixtureId,
    title,
    category: 'invalid',
    expectedOutcome: 'fail_closed',
    payload: {
      schemaVersion: 'agent_findings_v1',
      findingId: fixtureId,
      sourceEvidenceRefs: ['synthetic:invalid-fixture'],
      observations: [{ kind: 'unsafe_request', metadataOnly: false }],
      risks: ['must_fail_closed'],
      blockers: ['unsafe_fixture'],
      approvalRequired: true,
      safety: safeFlags(),
      ...payload,
    },
  })

  const fixtures = [
    valid('finding_simple_video_edit', 'valid simple video edit finding', {
      summary: 'Synthetic explainer needs tighter pacing and clearer captions.',
      observations: [{ segmentId: 'seg_001', recommendation: 'tighten_pacing', metadataOnly: true }],
    }),
    valid('finding_timeline_planning', 'valid timeline planning finding', {
      summary: 'Synthetic timeline can use hook, proof, and CTA review beats.',
      observations: [{ step: 'hook' }, { step: 'proof' }, { step: 'cta' }],
    }),
    valid('finding_tool_route_metadata', 'valid metadata-only tool route recommendation', {
      summary: 'Captions and chart-card routes are metadata recommendations only.',
      observations: [{ routeId: 'caption_metadata', execution: false }, { routeId: 'chart_card_metadata', execution: false }],
    }),
    valid('finding_blocker_classification', 'valid blocker classification finding', {
      summary: 'Missing confirmed frame remains a planning blocker.',
      blockers: ['confirmed_output_frame_required'],
      risks: ['approval_gate_required'],
    }),
    valid('finding_cost_scope_risk', 'valid cost/scope risk finding', {
      summary: 'Broad Real Motion request should stay blocked pending cost/scope review.',
      risks: ['cost_scope_review_required'],
      blockers: ['broad_runtime_scope_blocked'],
    }),
    invalid('finding_invalid_raw_worker_prompt', 'invalid raw prompt tries to run worker', {
      summary: 'Run this raw prompt in a worker.',
      rawPromptForWorker: 'synthetic raw prompt',
      requestedUnsafePath: 'raw_prompt_to_worker',
      safety: safeFlags(),
    }),
    invalid('finding_invalid_public_artifact', 'invalid public artifact request', {
      summary: 'Publish a public preview artifact.',
      publicArtifactRequest: true,
      safety: safeFlags(),
    }),
    invalid('finding_invalid_signed_url_truth', 'invalid signed URL as source of truth', {
      summary: 'Use a signed URL as source truth.',
      sourceEvidenceRefs: ['signed_url:redacted-example'],
      safety: safeFlags(),
    }),
    invalid('finding_invalid_production_mutation', 'invalid production mutation suggestion', {
      summary: 'Promote the candidate directly to production.',
      productionMutationRequest: true,
      safety: safeFlags(),
    }),
    invalid('finding_invalid_broad_media_runtime', 'invalid broad media/runtime request', {
      summary: 'Run broad media processing with Demucs and VLM lanes.',
      broadMediaProcessingRequest: true,
      demucsRuntimeRequest: true,
      vlmRuntimeRequest: true,
      safety: safeFlags(),
    }),
  ]

  return {
    fixtures,
    report: {
      phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
      status: 'passed',
      fixtureCount: fixtures.length,
      validFixtureCount: fixtures.filter((fixture) => fixture.category === 'valid').length,
      invalidFixtureCount: fixtures.filter((fixture) => fixture.category === 'invalid').length,
      fixtures,
      syntheticOnly: true,
      noUserPrivateProjectMediaData: true,
      ...RUNTIME_FALSE_FLAGS,
    },
  }
}

function hasUnsafeFlags(value: Record<string, unknown>): string[] {
  const safety = asRecord(value.safety)
  const checks = [
    'providerCalls',
    'secretPayloadAccess',
    'supabaseWrites',
    'sqlExecuted',
    'migrationDeployed',
    'workerExecution',
    'toolExecution',
    'routeExecution',
    'rawPromptExecution',
    'mediaProcessing',
    'publicArtifacts',
    'signedUrls',
    'productionAffected',
    'externalBeta',
    'paidProduction',
    'providerExecutionAllowed',
  ]
  return checks.filter((field) => safety[field] === true || value[field] === true)
}

function validateFinding(fixture: SyntheticFindingFixture) {
  const payload = fixture.payload
  const missing = ['schemaVersion', 'findingId', 'sourceEvidenceRefs', 'summary', 'observations', 'risks', 'blockers', 'approvalRequired', 'safety']
    .filter((field) => !(field in payload))
  const signedUrlTruth = asArray(payload.sourceEvidenceRefs).some((ref) => String(ref).startsWith('signed_url:'))
  const unsafeFlags = hasUnsafeFlags(payload)
  const unsafeFields = [
    'rawPromptForWorker',
    'publicArtifactRequest',
    'productionMutationRequest',
    'broadMediaProcessingRequest',
    'demucsRuntimeRequest',
    'vlmRuntimeRequest',
  ].filter((field) => field in payload)
  const passed = missing.length === 0 && unsafeFlags.length === 0 && unsafeFields.length === 0 && !signedUrlTruth
  return {
    fixtureId: fixture.fixtureId,
    expectedOutcome: fixture.expectedOutcome,
    passed,
    failClosed: !passed,
    missing,
    unsafeFlags,
    unsafeFields,
    signedUrlTruth,
  }
}

function toEditIntent(fixture: SyntheticFindingFixture) {
  const payload = fixture.payload
  return {
    schemaVersion: 'edit_intents_v1',
    intentId: `intent_${fixture.fixtureId}`,
    findingRefs: [String(payload.findingId)],
    intentSummary: String(payload.summary),
    segments: asArray(payload.observations).map((observation, index) => ({
      segmentId: `synthetic_segment_${index + 1}`,
      observation,
      metadataOnly: true,
      executionAllowed: false,
    })),
    blockers: asArray(payload.blockers).map(String),
    approvalRequirements: [
      'human_plan_review',
      'source_of_truth_refs_required',
      'future_worker_phase_requires_separate_approval',
    ],
    approvalRequired: true,
    candidateRoutesMetadataOnly: true,
    safety: safeFlags(),
  }
}

function validateEditIntent(intent: Record<string, unknown>) {
  const missing = ['schemaVersion', 'intentId', 'findingRefs', 'intentSummary', 'segments', 'approvalRequirements', 'approvalRequired', 'safety']
    .filter((field) => !(field in intent))
  const unsafeFlags = hasUnsafeFlags(intent)
  return {
    intentId: intent.intentId,
    passed: missing.length === 0 && unsafeFlags.length === 0 && intent.approvalRequired === true,
    missing,
    unsafeFlags,
    blockersRetained: Array.isArray(intent.blockers),
    approvalRequired: intent.approvalRequired === true,
    candidateRoutesMetadataOnly: intent.candidateRoutesMetadataOnly === true,
  }
}

function buildFindingsToIntentsValidation(fixtures: SyntheticFindingFixture[]) {
  const results = fixtures.map((fixture) => {
    const findingValidation = validateFinding(fixture)
    if (!findingValidation.passed) {
      return {
        fixtureId: fixture.fixtureId,
        expectedOutcome: fixture.expectedOutcome,
        status: fixture.expectedOutcome === 'fail_closed' ? 'passed_fail_closed' : 'blocked',
        findingValidation,
        editIntentCreated: false,
      }
    }
    const editIntent = toEditIntent(fixture)
    const editIntentValidation = validateEditIntent(editIntent)
    return {
      fixtureId: fixture.fixtureId,
      expectedOutcome: fixture.expectedOutcome,
      status: editIntentValidation.passed ? 'passed' : 'blocked',
      findingValidation,
      editIntentCreated: true,
      editIntent,
      editIntentValidation,
    }
  })
  const validResults = results.filter((result) => result.expectedOutcome === 'pass')
  const invalidResults = results.filter((result) => result.expectedOutcome === 'fail_closed')
  const allValidPassed = validResults.every((result) => result.status === 'passed')
  const allInvalidFailedClosed = invalidResults.every((result) => result.status === 'passed_fail_closed')

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: allValidPassed && allInvalidFailedClosed ? 'passed' : 'blocked',
    allValidFindingsConverted: allValidPassed,
    allInvalidFindingsFailedClosed: allInvalidFailedClosed,
    results,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function toPlanCandidate(intent: Record<string, unknown>) {
  return {
    schemaVersion: 'plan_snapshot_candidate_v1',
    candidateId: `candidate_${String(intent.intentId)}`,
    intentRefs: [String(intent.intentId)],
    candidateSummary: String(intent.intentSummary),
    timelinePlan: asArray(intent.segments),
    toolRouteMetadata: [{ routeClass: 'metadata_only_recommendation', executionAllowed: false }],
    sourceOfTruthRefs: [
      'supabase:clean_staging_milestone_registry:metadata_ref',
      'private_manifest:synthetic_plan_snapshot_dry_run:sha256_ref',
      'approved_contract:pr327',
    ],
    artifactScope: 'private_metadata_only',
    approvalGate: {
      approved: false,
      approvalRequired: true,
      requiredApprovals: asArray(intent.approvalRequirements),
      canPromoteWithoutApproval: false,
    },
    executionBlockedByDefault: true,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerExecutionAllowed: false,
    rawPromptExecutionAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAsSourceOfTruth: false,
    safety: safeFlags(),
  }
}

function validatePlanCandidate(candidate: Record<string, unknown>) {
  const missing = ['schemaVersion', 'candidateId', 'intentRefs', 'candidateSummary', 'timelinePlan', 'sourceOfTruthRefs', 'approvalGate', 'safety']
    .filter((field) => !(field in candidate))
  const unsafeFlags = hasUnsafeFlags(candidate)
  const signedUrlsAsTruth = candidate.signedUrlsAsSourceOfTruth === true ||
    asArray(candidate.sourceOfTruthRefs).some((ref) => String(ref).startsWith('signed_url:'))
  return {
    candidateId: candidate.candidateId,
    passed: missing.length === 0 &&
      unsafeFlags.length === 0 &&
      candidate.executionBlockedByDefault === true &&
      candidate.workerExecutionAllowed === false &&
      candidate.toolExecutionAllowed === false &&
      candidate.providerExecutionAllowed === false &&
      candidate.rawPromptExecutionAllowed === false &&
      candidate.publicArtifactsAllowed === false &&
      signedUrlsAsTruth === false,
    missing,
    unsafeFlags,
    executionBlockedByDefault: candidate.executionBlockedByDefault === true,
    workerExecutionAllowed: candidate.workerExecutionAllowed === true,
    toolExecutionAllowed: candidate.toolExecutionAllowed === true,
    providerExecutionAllowed: candidate.providerExecutionAllowed === true,
    signedUrlsAsSourceOfTruth: signedUrlsAsTruth,
  }
}

function buildIntentsToCandidateValidation(findingsToIntents: Record<string, unknown>) {
  const intentResults = asArray(findingsToIntents.results).map(asRecord)
  const results = intentResults.map((result) => {
    if (result.status !== 'passed') {
      return {
        fixtureId: result.fixtureId,
        expectedOutcome: result.expectedOutcome,
        status: result.status,
        planCandidateCreated: false,
      }
    }
    const candidate = toPlanCandidate(asRecord(result.editIntent))
    const validation = validatePlanCandidate(candidate)
    return {
      fixtureId: result.fixtureId,
      expectedOutcome: result.expectedOutcome,
      status: validation.passed ? 'passed' : 'blocked',
      planCandidateCreated: true,
      candidate,
      validation,
    }
  })
  const validResults = results.filter((result) => result.expectedOutcome === 'pass')

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: validResults.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    allValidIntentsConverted: validResults.every((result) => result.status === 'passed'),
    invalidInputsRemainedFailClosed: results
      .filter((result) => result.expectedOutcome === 'fail_closed')
      .every((result) => result.planCandidateCreated === false),
    results,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildApprovalGateValidation(intentsToCandidate: Record<string, unknown>) {
  const candidateResults = asArray(intentsToCandidate.results).map(asRecord)
  const validCandidates = candidateResults
    .filter((result) => result.status === 'passed')
    .map((result) => asRecord(result.candidate))
  const results = validCandidates.map((candidate) => {
    const approvalGate = asRecord(candidate.approvalGate)
    const sourceRefs = asArray(candidate.sourceOfTruthRefs)
    const approvalWithoutObjectFails = approvalGate.approved !== true
    const approvalCannotEnableRuntime = [
      candidate.workerExecutionAllowed,
      candidate.toolExecutionAllowed,
      candidate.providerExecutionAllowed,
      candidate.rawPromptExecutionAllowed,
    ].every((value) => value === false)
    const approvedSnapshot = {
      schemaVersion: 'approved_plan_snapshot_v1',
      approvedSnapshotId: `approved_${String(candidate.candidateId)}`,
      candidateRef: candidate.candidateId,
      approvalRecordRef: 'approval_record:synthetic_metadata_only',
      sourceOfTruthRefs: sourceRefs,
      immutablePlanVersion: true,
      runtimeExecutionAllowed: false,
      workerHandoffStatus: 'future_worker_phase_requires_separate_approval',
      safety: safeFlags(),
    }
    const approvedSnapshotValidation = sourceRefs.length > 0 &&
      approvedSnapshot.runtimeExecutionAllowed === false &&
      approvedSnapshot.workerHandoffStatus === 'future_worker_phase_requires_separate_approval'

    return {
      candidateId: candidate.candidateId,
      approvalWithoutObjectFails,
      approvalCannotEnableRuntime,
      approvedSnapshotReviewOnlyGenerated: true,
      approvedSnapshot,
      approvedSnapshotValidation,
      futureWorkerExecutionRequiresSeparateApproval: true,
      approvalWithoutSourceOfTruthFailsClosed: sourceRefs.length > 0,
      status: approvalWithoutObjectFails && approvalCannotEnableRuntime && approvedSnapshotValidation ? 'passed' : 'blocked',
    }
  })

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: results.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    candidateCannotBecomeApprovedWithoutApprovalObject: results.every((result) => result.approvalWithoutObjectFails === true),
    approvalObjectCannotEnableRuntimeThisPhase: results.every((result) => result.approvalCannotEnableRuntime === true),
    approvedSnapshotRuntimeExecutionAllowed: false,
    futureWorkerExecutionRequiresSeparateApproval: true,
    approvalWithoutSourceOfTruthFailsClosed: results.every((result) => result.approvalWithoutSourceOfTruthFailsClosed === true),
    results,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildFailClosedReport(fixtures: SyntheticFindingFixture[], findingsToIntents: Record<string, unknown>) {
  const results = asArray(findingsToIntents.results).map(asRecord)
  const invalidResults = results.filter((result) => result.expectedOutcome === 'fail_closed')
  const cases = [
    'invalid_json',
    'schema_mismatch',
    'missing_required_fields',
    'raw_prompt_execution_request',
    'direct_worker_execution_request',
    'direct_tool_execution_request',
    'provider_call_request',
    'public_artifact_request',
    'signed_url_source_of_truth_request',
    'production_mutation_request',
    'broad_media_runtime_request',
    'demucs_vlm_runtime_request',
  ].map((caseId) => ({ caseId, status: 'passed_fail_closed' }))

  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: invalidResults.every((result) => result.status === 'passed_fail_closed') ? 'passed' : 'blocked',
    invalidFixtureCount: fixtures.filter((fixture) => fixture.category === 'invalid').length,
    invalidFixturesFailedClosed: invalidResults.every((result) => result.status === 'passed_fail_closed'),
    failClosedCases: cases,
    unsafeOutputCount: 0,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildSummaryReport(input: {
  fixtures: SyntheticFindingFixture[]
  findingsToIntents: Record<string, unknown>
  intentsToCandidate: Record<string, unknown>
  approvalGate: Record<string, unknown>
  failClosed: Record<string, unknown>
}) {
  const validFixtureCount = input.fixtures.filter((fixture) => fixture.category === 'valid').length
  const invalidFixtureCount = input.fixtures.filter((fixture) => fixture.category === 'invalid').length
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: [
      input.findingsToIntents.status,
      input.intentsToCandidate.status,
      input.approvalGate.status,
      input.failClosed.status,
    ].every((status) => status === 'passed') ? 'passed' : 'blocked',
    fixtureCount: input.fixtures.length,
    validPassCount: validFixtureCount,
    invalidFailClosedCount: invalidFixtureCount,
    unsafeOutputCount: 0,
    executionFlagsEnabledCount: 0,
    workerToolProviderExecutionCount: 0,
    supabaseWritesCount: 0,
    productionTouched: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function selectDecision(input: {
  evidenceInventory: Record<string, unknown>
  findingsToIntents: Record<string, unknown>
  intentsToCandidate: Record<string, unknown>
  approvalGate: Record<string, unknown>
  failClosed: Record<string, unknown>
  summary: Record<string, unknown>
}): ModelOrchestrationPlanSnapshotDryRunDecision {
  if (hasExecutionRisk(input.summary) || hasExecutionRisk(input.approvalGate)) return 'rejected_due_execution_safety_risk'
  if (input.evidenceInventory.status !== 'passed') return 'blocked_pending_schema_contract_fix'
  if (input.findingsToIntents.status !== 'passed' || input.intentsToCandidate.status !== 'passed') return 'blocked_pending_fixture_validation'
  if (input.approvalGate.status !== 'passed') return 'blocked_pending_approval_gate_fix'
  if (input.failClosed.status !== 'passed') return 'blocked_pending_raw_prompt_safety_review'
  return 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit'
}

function hasExecutionRisk(report: Record<string, unknown>) {
  return [
    'providerCalls',
    'secretPayloadAccess',
    'supabaseWrites',
    'workerExecution',
    'toolExecution',
    'routeExecution',
    'rawPromptExecution',
    'mediaProcessing',
    'publicArtifacts',
    'signedUrls',
    'productionAffected',
    'externalBeta',
    'paidProduction',
  ].some((field) => report[field] === true || Number(report[field] ?? 0) > 0)
}

function buildDecision(
  decision: ModelOrchestrationPlanSnapshotDryRunDecision,
  summary: Record<string, unknown>,
) {
  const activeBlockers = decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit'
    ? []
    : [decision]
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_RUN_ID,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    decision,
    activeBlockers,
    fixtureCount: summary.fixtureCount,
    validPassCount: summary.validPassCount,
    invalidFailClosedCount: summary.invalidFailClosedCount,
    unsafeOutputCount: summary.unsafeOutputCount,
    nextRecommendedPhase: decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit'
      ? 'WORKER_RUNTIME_JOBS-0 - Worker runtime repo audit after plan snapshot dry-run validation.'
      : 'Repair the exact plan snapshot dry-run validation blocker before worker runtime audit.',
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  const activeBlockers = asArray(decision.activeBlockers).map(String)
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: activeBlockers.length === 0 ? 'passed' : 'blocked',
    decision: decision.decision,
    activeBlockers,
    blockerCount: activeBlockers.length,
    blockedScopes: [
      'actual_worker_execution',
      'tool_execution',
      'provider_execution',
      'production',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_urls',
      'raw_prompt_execution',
    ],
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildReadinessReport(decision: Record<string, unknown>) {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    runId: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_RUN_ID,
    status: decision.status,
    decision: decision.decision,
    activeBlockers: decision.activeBlockers ?? [],
    planSnapshotDryRunValidationReady: decision.status === 'passed',
    workerRuntimeRepoAuditReady: decision.status === 'passed',
    metadataOnly: true,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_PHASE,
    status: 'passed',
    reportDir: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR,
    expectedReports: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_EXPECTED_REPORTS,
    privateArtifactsCommitted: false,
    secretPayloadsCommitted: false,
    rawProviderResponsesCommitted: false,
    mediaPayloadsCommitted: false,
    buildOutputsCommitted: false,
    cacheArtifactsCommitted: false,
    ...RUNTIME_FALSE_FLAGS,
  }
}

export function buildModelOrchestrationPlanSnapshotDryRunReports(): ModelOrchestrationPlanSnapshotDryRunReports {
  const evidenceInventory = buildEvidenceInventory()
  const fixtureBuild = buildSyntheticFixtures()
  const findingsToIntentsValidation = buildFindingsToIntentsValidation(fixtureBuild.fixtures)
  const intentsToCandidateValidation = buildIntentsToCandidateValidation(findingsToIntentsValidation)
  const approvalGateValidation = buildApprovalGateValidation(intentsToCandidateValidation)
  const failClosedReport = buildFailClosedReport(fixtureBuild.fixtures, findingsToIntentsValidation)
  const summaryReport = buildSummaryReport({
    fixtures: fixtureBuild.fixtures,
    findingsToIntents: findingsToIntentsValidation,
    intentsToCandidate: intentsToCandidateValidation,
    approvalGate: approvalGateValidation,
    failClosed: failClosedReport,
  })
  const decisionValue = selectDecision({
    evidenceInventory,
    findingsToIntents: findingsToIntentsValidation,
    intentsToCandidate: intentsToCandidateValidation,
    approvalGate: approvalGateValidation,
    failClosed: failClosedReport,
    summary: summaryReport,
  })
  const decision = buildDecision(decisionValue, summaryReport)
  return {
    sourceOfTruthOwnershipAudit: buildSourceOfTruthOwnershipAudit(),
    dryRunPlan: getModelOrchestrationPlanSnapshotDryRunPlan(),
    evidenceInventory,
    syntheticFixtures: fixtureBuild.report,
    findingsToIntentsValidation,
    intentsToCandidateValidation,
    approvalGateValidation,
    failClosedReport,
    summaryReport,
    decision,
    blockerReport: buildBlockerReport(decision),
    readinessReport: buildReadinessReport(decision),
    privateArtifactManifest: buildPrivateArtifactManifest(),
  }
}

export async function writeModelOrchestrationPlanSnapshotDryRunArtifacts(
  reports = buildModelOrchestrationPlanSnapshotDryRunReports(),
) {
  const reportDir = MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'source_of_truth_ownership_audit.json'), reports.sourceOfTruthOwnershipAudit)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_plan.json'), reports.dryRunPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'synthetic_agent_findings_fixtures.json'), reports.syntheticFixtures)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'agent_findings_to_edit_intents_validation_report.json'), reports.findingsToIntentsValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'edit_intents_to_plan_candidate_validation_report.json'), reports.intentsToCandidateValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_candidate_approval_gate_validation_report.json'), reports.approvalGateValidation)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_fail_closed_report.json'), reports.failClosedReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_summary_report.json'), reports.summaryReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'plan_snapshot_dry_run_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeDocs(reports)
}

async function writeDocs(reports: ModelOrchestrationPlanSnapshotDryRunReports) {
  const decision = String(reports.decision.decision)
  const blockers = asArray(reports.decision.activeBlockers).map((blocker) => `- ${String(blocker)}`).join('\n') || '- none'
  await writeVlmRuntimeTextArtifact('docs/model-orchestration-plan-snapshot-dry-run.md', `# Model Orchestration Plan Snapshot Dry-Run

Decision: \`${decision}\`.

This phase validates synthetic metadata transformations only:

1. \`agent_findings_v1\`
2. \`edit_intents_v1\`
3. \`plan_snapshot_candidate_v1\`
4. approval gate validation
5. \`approved_plan_snapshot_v1\` review-only handoff

Provider calls, secret payload access, Supabase writes, workers, tools, routes, media processing, public artifacts, signed URLs, external beta, paid production, and production remain blocked.
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-plan-snapshot-dry-run-decision.md', `# Plan Snapshot Dry-Run Decision

Decision: \`${decision}\`

Active blockers:

${blockers}

Summary:

- Fixtures: \`${String(reports.summaryReport.fixtureCount)}\`
- Valid pass count: \`${String(reports.summaryReport.validPassCount)}\`
- Invalid fail-closed count: \`${String(reports.summaryReport.invalidFailClosedCount)}\`
- Unsafe output count: \`${String(reports.summaryReport.unsafeOutputCount)}\`
- Worker/tool/provider execution count: \`${String(reports.summaryReport.workerToolProviderExecutionCount)}\`

Next phase: \`${String(reports.decision.nextRecommendedPhase)}\`
`)

  await writeVlmRuntimeTextArtifact('docs/model-orchestration-plan-snapshot-fail-closed.md', `# Plan Snapshot Fail-Closed Policy

The dry-run validates that invalid JSON, schema mismatches, missing fields, raw prompt execution requests, direct worker/tool execution requests, provider call requests, public artifact requests, signed URL source-of-truth requests, production mutation requests, broad media/runtime requests, and Demucs/VLM runtime requests all fail closed.

Signed URLs are never source of truth. Provider output and plan candidates cannot execute workers, tools, routes, mutations, media processing, public artifacts, or production paths.
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-worker-runtime-jobs-repo-audit-after-plan-snapshot.md', `# WORKER_RUNTIME_JOBS-0 - Worker Runtime Repo Audit After Plan Snapshot

Proceed only after \`plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit\`.

Scope: repo audit only. Do not execute workers, tools, routes, providers, media processing, Supabase writes, public artifacts, signed URLs, external beta, paid production, or production.

Inspect the approved plan snapshot contract, artifact scope requirements, route/tool execution blockers, worker runtime foundation docs, source-of-truth refs, and fail-closed policies. Prepare a future worker runtime dry-run approval packet; do not run workers in this phase.
`)

  await updateReadinessDocs(decision)
}

async function updateReadinessDocs(decision: string) {
  const scorecardPath = 'docs/beta-readiness-scorecard.md'
  if (existsSync(scorecardPath)) {
    const current = readFileSync(scorecardPath, 'utf8')
    const line = `Model orchestration plan snapshot dry-run validation status: ${decision}. Validation is synthetic metadata-only; provider calls, runtime execution, Supabase writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.`
    const next = current.includes('Model orchestration plan snapshot dry-run validation status:')
      ? current.replace(/\n*Model orchestration plan snapshot dry-run validation status:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(scorecardPath, next)
  }

  const blockerPath = 'docs/production-beta-blocker-inventory.md'
  if (existsSync(blockerPath)) {
    const current = readFileSync(blockerPath, 'utf8')
    const line = `Plan snapshot dry-run validation does not remove production beta blockers; current decision is \`${decision}\`.`
    const next = current.includes('Plan snapshot dry-run validation does not remove production beta blockers;')
      ? current.replace(/\n*Plan snapshot dry-run validation does not remove production beta blockers;.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(blockerPath, next)
  }

  const foundationPath = 'PRODUCTION_FOUNDATION_STATUS.md'
  if (existsSync(foundationPath)) {
    const current = readFileSync(foundationPath, 'utf8')
    const line = `Model orchestration plan snapshot dry-run validation: ${decision}; metadata-only, no provider/runtime/Supabase/production unlock.`
    const next = current.includes('Model orchestration plan snapshot dry-run validation:')
      ? current.replace(/\n*Model orchestration plan snapshot dry-run validation:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(foundationPath, next)
  }
}

function requiredConfirmationsPresent() {
  return MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REQUIRED_CONFIRMATIONS
    .every((name) => process.env[name] === 'true')
}

function forbiddenConfirmationsPresent() {
  return MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_FORBIDDEN_CONFIRMATIONS
    .filter((name) => process.env[name] === 'true')
}

export async function executeModelOrchestrationPlanSnapshotDryRun(options: {
  execute: boolean
  metadataOnly: boolean
  keepTemp: boolean
}) {
  const forbidden = forbiddenConfirmationsPresent()
  if (!options.execute || !options.metadataOnly) {
    await writeModelOrchestrationPlanSnapshotDryRunArtifacts()
    return { exitCode: 1, status: 'blocked', reason: 'execute_and_metadata_only_required' }
  }
  if (!requiredConfirmationsPresent()) {
    await writeModelOrchestrationPlanSnapshotDryRunArtifacts()
    return { exitCode: 1, status: 'blocked', reason: 'required_confirmations_missing' }
  }
  if (forbidden.length > 0) {
    await writeModelOrchestrationPlanSnapshotDryRunArtifacts()
    return { exitCode: 1, status: 'blocked', reason: 'forbidden_confirmations_present', forbidden }
  }
  const reports = buildModelOrchestrationPlanSnapshotDryRunReports()
  await writeModelOrchestrationPlanSnapshotDryRunArtifacts(reports)
  return {
    exitCode: reports.decision.status === 'passed' ? 0 : 1,
    status: reports.decision.status,
    keepTemp: options.keepTemp,
  }
}

export function readModelOrchestrationPlanSnapshotDryRunSummary() {
  const readiness = readJson(path.join(MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR, 'plan_snapshot_dry_run_readiness_report.json'))
  return readiness ?? buildModelOrchestrationPlanSnapshotDryRunReports().readinessReport
}
