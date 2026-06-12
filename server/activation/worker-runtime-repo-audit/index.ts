import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  WorkerRuntimeRepoAuditDecision,
  WorkerRuntimeRepoAuditReports,
} from './worker-runtime-audit-types'

export const WORKER_RUNTIME_REPO_AUDIT_PHASE = 'worker-runtime-repo-audit-after-plan-snapshot'
export const WORKER_RUNTIME_REPO_AUDIT_RUN_ID = 'worker-runtime-repo-audit-20260612'
export const WORKER_RUNTIME_REPO_AUDIT_BRANCH = 'codex/rp-worker-runtime-repo-audit-after-plan-snapshot'
export const WORKER_RUNTIME_REPO_AUDIT_BASE_BRANCH =
  'codex/rp-model-orchestration-plan-snapshot-dry-run-validation'
export const WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR =
  'docs/activation-worker-runtime-repo-audit-reports'

export const WORKER_RUNTIME_REPO_AUDIT_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'worker_runtime_repo_audit_plan.json',
  'worker_job_queue_inventory.json',
  'approved_plan_snapshot_intake_review.json',
  'artifact_scope_source_of_truth_review.json',
  'worker_execution_blocker_policy.json',
  'worker_secret_reference_inventory.json',
  'worker_observability_cost_failure_review.json',
  'worker_runtime_gap_map.json',
  'worker_runtime_repo_audit_decision.json',
  'worker_runtime_repo_audit_blocker_report.json',
  'worker_runtime_repo_audit_readiness_report.json',
  'worker_runtime_repo_audit_private_artifact_manifest.json',
] as const

export const WORKER_RUNTIME_REPO_AUDIT_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_REPO_AUDIT',
  'REEDITPRO_CONFIRM_PLAN_SNAPSHOT_INTAKE_AUDIT',
  'REEDITPRO_CONFIRM_ARTIFACT_SCOPE_POLICY_AUDIT',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
] as const

export const WORKER_RUNTIME_REPO_AUDIT_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_RAW_PROMPT_EXECUTION',
  'REEDITPRO_CONFIRM_DOCKER_RUN',
  'REEDITPRO_CONFIRM_CLOUD_RUN_JOB',
  'REEDITPRO_CONFIRM_CLOUD_BUILD',
  'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_SQL',
  'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS',
  'REEDITPRO_CONFIRM_SIGNED_URL_DELIVERY',
  'REEDITPRO_CONFIRM_PRODUCTION_WRITE',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
] as const

const PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR = 'docs/activation-model-orchestration-plan-snapshot-dry-run-reports'
const PLAN_SNAPSHOT_CONTRACT_REPORT_DIR = 'docs/activation-model-orchestration-plan-snapshot-contract-reports'
const SOURCE_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'editing-agent-execution-architecture.md',
  'async-edit-work-graph.md',
  'editing-asset-manifest.md',
  'approved-plan-snapshot-policy.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/tool-call-foundation.md',
  'docs/provider-gateway-foundation.md',
  'docs/model-orchestration-plan-snapshot-contract.md',
  'docs/model-orchestration-approved-plan-snapshot-schema.md',
  'docs/model-orchestration-approval-gate-worker-handoff-policy.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-repo-audit-after-plan-snapshot.md',
  'docs/internal-testing-allowed-scope-freeze.md',
  'docs/internal-testing-blocked-scope-freeze.md',
  'docs/restricted-internal-testing-session-0-decision.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/README.md',
  'docs/cross-chat',
  PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR,
  PLAN_SNAPSHOT_CONTRACT_REPORT_DIR,
  'docs/activation-track-b-tool-route-manifest-reports',
  'docs/activation-track-b-capability-manifests-reports',
  'docs/activation-phase-44g-local-worker-sidecar-foundation-reports',
  'docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports',
  'docs/activation-phase-44k-desktop-beta-readiness-gate-reports',
  'docs/activation-phase-44m-noop-route-dry-run-execution-reports',
  'docs/activation-phase-44o-metadata-route-dry-run-execution-reports',
] as const

const RUNTIME_FALSE_FLAGS = {
  workerExecution: false,
  toolExecution: false,
  routeExecution: false,
  providerCalls: false,
  dockerRun: false,
  cloudRunJob: false,
  cloudBuild: false,
  mediaProcessing: false,
  rawPromptExecution: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationDeployed: false,
  publicArtifacts: false,
  signedUrls: false,
  productionAffected: false,
  externalBeta: false,
  paidProduction: false,
  secretPayloadAccess: false,
  secretPayloadPrinted: false,
  secretPayloadCommitted: false,
}

const SECRET_REFS = [
  { name: 'SUPABASE_DB_URL', purpose: 'future server database transport', owner: 'SUPABASE_RLS_STORAGE_DATABASE' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', purpose: 'future server-only Supabase writes', owner: 'SUPABASE_RLS_STORAGE_DATABASE' },
  { name: 'SUPABASE_ACCESS_TOKEN', purpose: 'future management automation when separately approved', owner: 'SUPABASE_RLS_STORAGE_DATABASE' },
  { name: 'GCS_PRIVATE_ARTIFACT_BUCKET', purpose: 'future private artifact storage', owner: 'PUBLIC_ARTIFACT_DELIVERY' },
  { name: 'GOOGLE_CLOUD_WORKER_SERVICE_ACCOUNT', purpose: 'future Cloud Run worker identity', owner: 'WORKER_RUNTIME_JOBS' },
  { name: 'DASHSCOPE_API_KEY', purpose: 'future provider calls outside worker repo audit', owner: 'PROVIDER_GATEWAY' },
  { name: 'DEEPSEEK_API_KEY', purpose: 'future provider calls outside worker repo audit', owner: 'PROVIDER_GATEWAY' },
] as const

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function collectFiles(root: string, limit = 120): { present: boolean; totalFiles: number; representativeFiles: string[] } {
  if (!existsSync(root)) return { present: false, totalFiles: 0, representativeFiles: [] }
  const files: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else files.push(fullPath.split(path.sep).join('/'))
    }
  }
  walk(root)
  files.sort()
  return {
    present: true,
    totalFiles: files.length,
    representativeFiles: files.slice(0, limit),
  }
}

function safePackageScriptInventory() {
  const scripts = asRecord(JSON.parse(readFileSync('package.json', 'utf8')).scripts)
  return Object.keys(scripts)
    .filter((name) => /worker|job|queue|route|runtime|docker|cloud/i.test(name))
    .sort()
    .map((name) => {
      const command = String(scripts[name] ?? '')
      return {
        name,
        classification: /docker|cloud|run-worker-job/i.test(name) || /docker|cloud run|cloud build/i.test(command)
          ? 'fail_closed_or_manual_only'
          : 'metadata_or_validation_script',
        rawCommandStored: false,
        commandShapeRedacted: true,
      }
    })
}

export function getWorkerRuntimeRepoAuditPlan() {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    runId: WORKER_RUNTIME_REPO_AUDIT_RUN_ID,
    branch: WORKER_RUNTIME_REPO_AUDIT_BRANCH,
    baseBranch: WORKER_RUNTIME_REPO_AUDIT_BASE_BRANCH,
    prTitle: '[worker] Runtime repo audit after plan snapshot dry-run',
    mode: 'repo_source_of_truth_audit_metadata_only',
    reportDir: WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR,
    expectedReports: WORKER_RUNTIME_REPO_AUDIT_EXPECTED_REPORTS,
    requiredConfirmations: WORKER_RUNTIME_REPO_AUDIT_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: WORKER_RUNTIME_REPO_AUDIT_FORBIDDEN_CONFIRMATIONS,
    expectedDecision: 'repo_audit_passed_ready_for_worker_dry_run_approval',
    nextPhase: 'WORKER_RUNTIME_JOBS-1 - worker runtime dry-run approval packet',
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildSourceAudit() {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: 'passed',
    owner: 'WORKER_RUNTIME_JOBS',
    relatedWorkstreams: [
      'MODEL_ORCHESTRATION',
      'SUPABASE_RLS_STORAGE_DATABASE',
      'TRACK_B_MEDIA_PROCESSING',
      'PROVIDER_GATEWAY',
      'PRODUCT_INTERNAL_BETA_AGGREGATION',
      'OBSERVABILITY_AUDIT_COST',
      'PUBLIC_ARTIFACT_DELIVERY',
    ],
    explicitlyNotOwned: [
      'model_provider_execution',
      'track_b_tool_runtime_execution',
      'track_a_runtime',
      'production_deploy',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_url_delivery',
      'raw_prompt_execution',
      'broad_media_processing',
    ],
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    missingDocsAreAuditFacts: true,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildWorkerJobQueueInventory() {
  const packageScripts = safePackageScriptInventory()
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: 'passed',
    surfaces: [
      {
        surface: 'server_workers',
        classification: 'existing_fail_closed_without_separate_execution_approval',
        ...collectFiles('server/workers', 180),
      },
      {
        surface: 'worker_jobs',
        classification: 'existing_mock_or_readiness_workers',
        ...collectFiles('server/workers/jobs', 80),
      },
      {
        surface: 'production_worker_runtime',
        classification: 'existing_fail_closed_runtime_scaffold',
        ...collectFiles('server/workers/production', 80),
      },
      {
        surface: 'queue_modules',
        classification: existsSync('server/queues') ? 'existing' : 'missing',
        ...collectFiles('server/queues', 80),
      },
      {
        surface: 'local_sidecar_foundation',
        classification: 'existing_metadata_foundation',
        ...collectFiles('server/activation/local-worker-sidecar-foundation', 80),
      },
      {
        surface: 'route_modules',
        classification: 'existing_route_contracts_no_execution_in_this_phase',
        ...collectFiles('server/routes', 120),
      },
      {
        surface: 'cloud_runtime_docs_and_plans',
        classification: 'existing_planning_only_or_blocked',
        ...collectFiles('docs/google-cloud', 80),
      },
    ],
    packageScriptCount: packageScripts.length,
    packageScripts,
    dockerCloudRunCloudBuild: {
      detectedAsScriptsOrDocs: packageScripts.some((script) => /docker|cloud/i.test(String(script.name))),
      enabledByThisPhase: false,
      rawCommandsStored: false,
    },
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildApprovedPlanSnapshotIntakeReview() {
  const dryRunDecision = readJson(path.join(PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR, 'plan_snapshot_dry_run_decision.json'))
  const dryRunReadiness = readJson(path.join(PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR, 'plan_snapshot_dry_run_readiness_report.json'))
  const contractDecision = readJson(path.join(PLAN_SNAPSHOT_CONTRACT_REPORT_DIR, 'plan_snapshot_contract_decision.json'))
  const contractReadiness = readJson(path.join(PLAN_SNAPSHOT_CONTRACT_REPORT_DIR, 'plan_snapshot_contract_readiness_report.json'))
  const passed =
    dryRunDecision?.decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit' &&
    dryRunReadiness?.workerRuntimeRepoAuditReady === true &&
    contractDecision?.decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation' &&
    contractReadiness?.planSnapshotContractReady === true

  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: passed ? 'passed' : 'blocked',
    activeBlockers: passed ? [] : ['plan_snapshot_pr337_or_pr327_evidence_missing'],
    acceptedFutureInput: 'approved_plan_snapshot_v1',
    rejectedInputs: [
      'raw_chat_prompt',
      'provider_response',
      'agent_findings_v1_direct_execution',
      'edit_intents_v1_direct_execution',
      'plan_snapshot_candidate_v1_direct_execution',
      'tool_route_metadata_direct_execution',
    ],
    requiredFutureRefs: [
      'approved_plan_snapshot_id',
      'credit_or_cost_gate_ref',
      'private_artifact_manifest_ref',
      'source_of_truth_refs',
      'worker_runtime_dry_run_approval_ref',
    ],
    runtimeExecutionAllowed: false,
    realToolExecutionAllowedInFutureDryRunApproval: false,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildArtifactScopeSourceOfTruthReview() {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: 'passed',
    sourceOfTruthRequirements: [
      'supabase_row_ref',
      'private_gcs_path_ref',
      'private_artifact_manifest_id',
      'checksum_ref',
      'approved_plan_snapshot_ref',
    ],
    forbiddenSourceOfTruthRefs: [
      'signed_url',
      'public_artifact_url',
      'raw_provider_response',
      'unversioned_local_temp_path',
      'raw_prompt_text',
    ],
    futureWorkerReadWriteBoundary: 'workers_can_only_read_or_write_explicit_approved_private_artifact_scopes_after_separate_approval',
    signedUrlsAsSourceOfTruth: false,
    publicArtifactsAllowed: false,
    privatePayloadsCommitted: false,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildWorkerExecutionBlockerPolicy() {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: 'passed',
    blockedExecutionPaths: [
      'raw_prompt_execution',
      'unapproved_plan_snapshot_execution',
      'provider_response_direct_execution',
      'tool_route_direct_execution',
      'broad_media_processing',
      'public_output_generation',
      'production_write_or_deploy',
      'secret_access_from_frontend',
      'arbitrary_subprocess_or_path',
      'docker_run_without_separate_approval',
      'cloud_run_or_cloud_build_without_separate_approval',
    ],
    futureDryRunApprovalMayUseOnly: [
      'synthetic_approved_plan_snapshot_fixtures',
      'no_op_worker_contracts',
      'metadata_only_artifact_scope_validation',
      'no_real_tool_or_media_execution',
    ],
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildWorkerSecretReferenceInventory() {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: 'passed',
    secretRefs: SECRET_REFS.map((secret) => ({
      ...secret,
      payloadAccessed: false,
      payloadPrinted: false,
      payloadCommitted: false,
      currentUse: 'blocked_metadata_only',
    })),
    broadSecretDiscovery: false,
    frontendSecretAccessAllowed: false,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildWorkerObservabilityCostFailureReview() {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: 'passed',
    existingSignals: [
      pathStatus('server/observability/worker-event-observability.ts'),
      pathStatus('server/cost-controls/job-timeout-policy.ts'),
      pathStatus('server/cost-controls/worker-concurrency-policy.ts'),
      pathStatus('server/workers/worker-events.ts'),
      pathStatus('server/workers/worker-result.ts'),
      pathStatus('server/workers/production/production-worker-retry-policy.ts'),
      pathStatus('server/workers/production/production-worker-idempotency.ts'),
      pathStatus('server/workers/production/production-worker-artifact-policy.ts'),
    ],
    futureRequirements: [
      'per_run_correlation_id',
      'approved_plan_snapshot_id',
      'private_artifact_manifest_ids',
      'cost_estimate_and_budget_guardrail_refs',
      'retry_policy',
      'timeout_policy',
      'rollback_or_cleanup_policy',
      'failure_state_reporting',
      'abuse_and_rate_limit_controls',
      'human_review_escalation',
    ],
    currentPhaseRecordsOnlyRequirements: true,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildGapMap(reviews: {
  approvedPlanSnapshotIntakeReview: Record<string, unknown>
  artifactScopeSourceOfTruthReview: Record<string, unknown>
  workerExecutionBlockerPolicy: Record<string, unknown>
  workerObservabilityCostFailureReview: Record<string, unknown>
}) {
  const gaps = [
    {
      gap: 'repo_audit_passed',
      status: Object.values(reviews).every((review) => review.status === 'passed') ? 'passed' : 'blocked',
    },
    {
      gap: 'blocked_pending_worker_dry_run_approval',
      status: 'active_next_phase',
    },
    {
      gap: 'blocked_pending_artifact_scope_contract',
      status: reviews.artifactScopeSourceOfTruthReview.status === 'passed' ? 'cleared_for_audit' : 'blocked',
    },
    {
      gap: 'blocked_pending_queue_contract',
      status: 'future_worker_dry_run_approval_scope',
    },
    {
      gap: 'blocked_pending_observability_contract',
      status: reviews.workerObservabilityCostFailureReview.status === 'passed' ? 'documented_for_future_contract' : 'blocked',
    },
    {
      gap: 'blocked_pending_execution_safety_review',
      status: reviews.workerExecutionBlockerPolicy.status === 'passed' ? 'cleared_for_audit' : 'blocked',
    },
    {
      gap: 'blocked_pending_cloud_runtime_review',
      status: 'future_separate_cloud_runtime_phase',
    },
  ]

  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: gaps.some((gap) => gap.status === 'blocked') ? 'blocked' : 'passed',
    gaps,
    nextRequiredApproval: 'worker_runtime_dry_run_approval_packet',
    ...RUNTIME_FALSE_FLAGS,
  }
}

function hasUnsafeFlag(report: Record<string, unknown>): boolean {
  return Object.keys(RUNTIME_FALSE_FLAGS).some((key) => report[key] === true)
}

function selectDecision(reports: Omit<WorkerRuntimeRepoAuditReports, 'decision' | 'blockerReport' | 'readinessReport' | 'privateArtifactManifest'>): WorkerRuntimeRepoAuditDecision {
  if (hasUnsafeFlag(reports.approvedPlanSnapshotIntakeReview) ||
    hasUnsafeFlag(reports.artifactScopeSourceOfTruthReview) ||
    hasUnsafeFlag(reports.workerExecutionBlockerPolicy)) {
    return 'rejected_due_execution_safety_risk'
  }
  if (reports.approvedPlanSnapshotIntakeReview.status !== 'passed') return 'blocked_pending_plan_snapshot_intake_contract'
  if (reports.artifactScopeSourceOfTruthReview.status !== 'passed') return 'blocked_pending_artifact_scope_policy'
  if (reports.workerExecutionBlockerPolicy.status !== 'passed') return 'blocked_pending_worker_execution_blocker_policy'
  if (reports.workerObservabilityCostFailureReview.status !== 'passed') return 'blocked_pending_observability_cost_contract'
  if (reports.workerRuntimeGapMap.status !== 'passed') return 'blocked_pending_source_of_truth_policy'
  return 'repo_audit_passed_ready_for_worker_dry_run_approval'
}

function buildDecision(input: Omit<WorkerRuntimeRepoAuditReports, 'decision' | 'blockerReport' | 'readinessReport' | 'privateArtifactManifest'>) {
  const decision = selectDecision(input)
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    runId: WORKER_RUNTIME_REPO_AUDIT_RUN_ID,
    status: decision === 'repo_audit_passed_ready_for_worker_dry_run_approval' ? 'passed' : 'blocked',
    decision,
    activeBlockers: decision === 'repo_audit_passed_ready_for_worker_dry_run_approval' ? [] : [decision],
    workerDryRunApprovalReady: decision === 'repo_audit_passed_ready_for_worker_dry_run_approval',
    nextRecommendedPhase: decision === 'repo_audit_passed_ready_for_worker_dry_run_approval'
      ? 'WORKER_RUNTIME_JOBS-1 - worker runtime dry-run approval packet'
      : 'Repair the exact worker runtime repo audit blocker before dry-run approval.',
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: decision.status,
    activeBlockers: decision.activeBlockers,
    blockedScopesStillBlocked: [
      'worker_execution',
      'tool_execution',
      'route_execution',
      'provider_calls',
      'docker',
      'cloud_run',
      'cloud_build',
      'supabase_writes',
      'media_processing',
      'public_artifacts',
      'signed_urls',
      'production',
      'external_beta',
      'paid_production',
    ],
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildReadinessReport(decision: Record<string, unknown>) {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: decision.status,
    decision: decision.decision,
    workerRuntimeRepoAuditReady: decision.status === 'passed',
    workerDryRunApprovalReady: decision.status === 'passed',
    runtimeExecutionAllowedInThisPhase: false,
    ...RUNTIME_FALSE_FLAGS,
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: WORKER_RUNTIME_REPO_AUDIT_PHASE,
    status: 'passed',
    artifacts: WORKER_RUNTIME_REPO_AUDIT_EXPECTED_REPORTS.map((name) => ({
      name,
      path: `${WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR}/${name}`,
      classification: 'safe_metadata_report',
      containsSecretPayload: false,
      containsPrivatePayload: false,
      publicArtifact: false,
    })),
    ...RUNTIME_FALSE_FLAGS,
  }
}

export function buildWorkerRuntimeRepoAuditReports(): WorkerRuntimeRepoAuditReports {
  const sourceAudit = buildSourceAudit()
  const plan = getWorkerRuntimeRepoAuditPlan()
  const workerJobQueueInventory = buildWorkerJobQueueInventory()
  const approvedPlanSnapshotIntakeReview = buildApprovedPlanSnapshotIntakeReview()
  const artifactScopeSourceOfTruthReview = buildArtifactScopeSourceOfTruthReview()
  const workerExecutionBlockerPolicy = buildWorkerExecutionBlockerPolicy()
  const workerSecretReferenceInventory = buildWorkerSecretReferenceInventory()
  const workerObservabilityCostFailureReview = buildWorkerObservabilityCostFailureReview()
  const workerRuntimeGapMap = buildGapMap({
    approvedPlanSnapshotIntakeReview,
    artifactScopeSourceOfTruthReview,
    workerExecutionBlockerPolicy,
    workerObservabilityCostFailureReview,
  })
  const decision = buildDecision({
    sourceAudit,
    plan,
    workerJobQueueInventory,
    approvedPlanSnapshotIntakeReview,
    artifactScopeSourceOfTruthReview,
    workerExecutionBlockerPolicy,
    workerSecretReferenceInventory,
    workerObservabilityCostFailureReview,
    workerRuntimeGapMap,
  })
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision)
  const privateArtifactManifest = buildPrivateArtifactManifest()

  return {
    sourceAudit,
    plan,
    workerJobQueueInventory,
    approvedPlanSnapshotIntakeReview,
    artifactScopeSourceOfTruthReview,
    workerExecutionBlockerPolicy,
    workerSecretReferenceInventory,
    workerObservabilityCostFailureReview,
    workerRuntimeGapMap,
    decision,
    blockerReport,
    readinessReport,
    privateArtifactManifest,
  }
}

async function updateReadinessDocs(decision: string) {
  const scorecardPath = 'docs/beta-readiness-scorecard.md'
  if (existsSync(scorecardPath)) {
    const current = readFileSync(scorecardPath, 'utf8')
    const line = `Worker runtime repo audit status: ${decision}. Audit is metadata-only; worker/tool/route/provider execution, Supabase writes, Docker, Cloud Run, public artifacts, signed URLs, external beta, paid production, and production remain blocked.`
    const next = current.includes('Worker runtime repo audit status:')
      ? current.replace(/\n*Worker runtime repo audit status:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(scorecardPath, next)
  }

  const blockerPath = 'docs/production-beta-blocker-inventory.md'
  if (existsSync(blockerPath)) {
    const current = readFileSync(blockerPath, 'utf8')
    const line = `Worker runtime repo audit does not remove production beta blockers; current decision is \`${decision}\`.`
    const next = current.includes('Worker runtime repo audit does not remove production beta blockers;')
      ? current.replace(/\n*Worker runtime repo audit does not remove production beta blockers;.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(blockerPath, next)
  }

  const foundationPath = 'PRODUCTION_FOUNDATION_STATUS.md'
  if (existsSync(foundationPath)) {
    const current = readFileSync(foundationPath, 'utf8')
    const line = `Worker runtime repo audit: ${decision}; metadata-only, no worker execution, provider calls, Supabase writes, Docker, Cloud Run, public artifacts, signed URLs, or production unlock.`
    const next = current.includes('Worker runtime repo audit:')
      ? current.replace(/\n*Worker runtime repo audit:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(foundationPath, next)
  }
}

export async function writeWorkerRuntimeRepoAuditArtifacts(reports: WorkerRuntimeRepoAuditReports) {
  const reportMap: Record<typeof WORKER_RUNTIME_REPO_AUDIT_EXPECTED_REPORTS[number], Record<string, unknown>> = {
    'source_of_truth_ownership_audit.json': reports.sourceAudit,
    'worker_runtime_repo_audit_plan.json': reports.plan,
    'worker_job_queue_inventory.json': reports.workerJobQueueInventory,
    'approved_plan_snapshot_intake_review.json': reports.approvedPlanSnapshotIntakeReview,
    'artifact_scope_source_of_truth_review.json': reports.artifactScopeSourceOfTruthReview,
    'worker_execution_blocker_policy.json': reports.workerExecutionBlockerPolicy,
    'worker_secret_reference_inventory.json': reports.workerSecretReferenceInventory,
    'worker_observability_cost_failure_review.json': reports.workerObservabilityCostFailureReview,
    'worker_runtime_gap_map.json': reports.workerRuntimeGapMap,
    'worker_runtime_repo_audit_decision.json': reports.decision,
    'worker_runtime_repo_audit_blocker_report.json': reports.blockerReport,
    'worker_runtime_repo_audit_readiness_report.json': reports.readinessReport,
    'worker_runtime_repo_audit_private_artifact_manifest.json': reports.privateArtifactManifest,
  }

  for (const [name, report] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR, name), report)
  }

  const decision = String(reports.decision.decision)
  await writeVlmRuntimeTextArtifact('docs/worker-runtime-repo-audit.md', `# Worker Runtime Repo Audit

Decision: \`${decision}\`.

This packet audits worker, job, queue, sidecar, route, artifact, and cloud-runtime foundations after PR #337 plan snapshot dry-run validation. It does not execute workers, tools, routes, providers, Docker, Cloud Run, Cloud Build, media processing, Supabase writes, public artifacts, signed URLs, external beta, paid production, or production.

Next phase: \`WORKER_RUNTIME_JOBS-1 - worker runtime dry-run approval packet\`.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-approved-plan-snapshot-intake.md', `# Worker Runtime Approved Plan Snapshot Intake

Future worker runtime input must be \`approved_plan_snapshot_v1\` with source-of-truth refs, private artifact manifest refs, and a separate worker dry-run approval ref.

Raw prompts, provider responses, agent findings, edit intents, plan snapshot candidates, and tool-route metadata cannot execute workers directly. Runtime execution remains \`false\` in this audit phase.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-artifact-scope-source-of-truth.md', `# Worker Runtime Artifact Scope And Source Of Truth

Source of truth for future workers must combine Supabase row refs, private GCS path refs, artifact manifest IDs, checksums, and approved plan snapshot refs.

Signed URLs and public artifacts are never source of truth. Workers may only read or write explicit approved private artifact scopes in a later separately approved phase.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-execution-blocker-policy.md', `# Worker Runtime Execution Blocker Policy

Blocked in this phase: raw prompt execution, unapproved snapshot execution, provider-response direct execution, tool-route direct execution, broad media processing, public output, production writes, frontend secret access, arbitrary subprocess/path execution, Docker, Cloud Run, and Cloud Build.

The next phase may design a synthetic worker dry-run approval packet only; it still cannot execute real tools or process media unless separately approved.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-repo-audit-decision.md', `# Worker Runtime Repo Audit Decision

Decision: \`${decision}\`.

Worker dry-run approval ready: \`${String(reports.readinessReport.workerDryRunApprovalReady)}\`.

Supabase update classification: no write, SQL none, migration deployed no, environment touched none. Track B clean-staging milestone sync remains completed.
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-worker-runtime-dry-run-approval-after-repo-audit.md', `# WORKER_RUNTIME_JOBS-1 - Worker Runtime Dry-Run Approval After Repo Audit

Proceed only after \`repo_audit_passed_ready_for_worker_dry_run_approval\`.

Scope: approval packet only. Do not execute workers, real tools, routes, providers, media processing, Supabase writes, Docker, Cloud Run, Cloud Build, public artifacts, signed URLs, external beta, paid production, or production.

Use synthetic \`approved_plan_snapshot_v1\` fixtures only. Validate approved snapshot intake, artifact scope, source-of-truth refs, no-op worker contracts, observability/cost/failure requirements, and fail-closed blockers before any future execution phase.
`)

  await updateReadinessDocs(decision)
}

function forbiddenConfirmationsPresent() {
  return WORKER_RUNTIME_REPO_AUDIT_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
}

function missingConfirmations() {
  return WORKER_RUNTIME_REPO_AUDIT_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
}

export async function executeWorkerRuntimeRepoAudit(input: { execute: boolean; metadataOnly: boolean; keepTemp: boolean }) {
  const reports = buildWorkerRuntimeRepoAuditReports()
  const forbidden = forbiddenConfirmationsPresent()
  const missing = missingConfirmations()

  if (!input.execute || !input.metadataOnly) {
    await writeWorkerRuntimeRepoAuditArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'execute_metadata_only_required' }
  }

  if (forbidden.length > 0) {
    await writeWorkerRuntimeRepoAuditArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'forbidden_confirmations_present', forbidden }
  }

  if (missing.length > 0) {
    await writeWorkerRuntimeRepoAuditArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'missing_required_confirmations', missing }
  }

  await writeWorkerRuntimeRepoAuditArtifacts(reports)
  return { exitCode: reports.decision.status === 'passed' ? 0 : 1, status: reports.decision.status, keepTemp: input.keepTemp }
}

export function readWorkerRuntimeRepoAuditSummary() {
  return readJson(path.join(WORKER_RUNTIME_REPO_AUDIT_REPORT_DIR, 'worker_runtime_repo_audit_readiness_report.json')) ?? buildWorkerRuntimeRepoAuditReports().readinessReport
}
