import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  WorkerRuntimeDryRunApprovalDecision,
  WorkerRuntimeDryRunApprovalReports,
} from './worker-dry-run-approval-types'

export const WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE = 'worker-runtime-dry-run-approval-after-repo-audit'
export const WORKER_RUNTIME_DRY_RUN_APPROVAL_RUN_ID = 'worker-runtime-dry-run-approval-20260612'
export const WORKER_RUNTIME_DRY_RUN_APPROVAL_BRANCH =
  'codex/rp-worker-runtime-dry-run-approval-after-repo-audit'
export const WORKER_RUNTIME_DRY_RUN_APPROVAL_BASE_BRANCH =
  'codex/rp-worker-runtime-repo-audit-after-plan-snapshot'
export const WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR =
  'docs/activation-worker-runtime-dry-run-approval-reports'

export const WORKER_RUNTIME_DRY_RUN_APPROVAL_EXPECTED_REPORTS = [
  'source_of_truth_ownership_audit.json',
  'worker_dry_run_approval_plan.json',
  'worker_dry_run_evidence_inventory.json',
  'approved_plan_snapshot_dry_run_fixtures.json',
  'worker_dry_run_scope_policy.json',
  'worker_dry_run_artifact_scope_guardrails.json',
  'worker_dry_run_queue_job_sidecar_policy.json',
  'worker_dry_run_observability_cost_failure_guardrails.json',
  'worker_dry_run_fail_closed_policy.json',
  'worker_dry_run_approval_decision.json',
  'worker_dry_run_approval_blocker_report.json',
  'worker_dry_run_approval_readiness_report.json',
  'worker_dry_run_approval_private_artifact_manifest.json',
] as const

export const WORKER_RUNTIME_DRY_RUN_APPROVAL_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_DRY_RUN_APPROVAL_PACKET',
  'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_FIXTURE_DESIGN',
  'REEDITPRO_CONFIRM_PLAN_SNAPSHOT_INTAKE_AUDIT',
  'REEDITPRO_CONFIRM_ARTIFACT_SCOPE_POLICY_AUDIT',
  'REEDITPRO_CONFIRM_WORKER_EXECUTION_BLOCKER_POLICY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
] as const

export const WORKER_RUNTIME_DRY_RUN_APPROVAL_FORBIDDEN_CONFIRMATIONS = [
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

const REPO_AUDIT_REPORT_DIR = 'docs/activation-worker-runtime-repo-audit-reports'
const PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR = 'docs/activation-model-orchestration-plan-snapshot-dry-run-reports'
const PLAN_SNAPSHOT_CONTRACT_REPORT_DIR = 'docs/activation-model-orchestration-plan-snapshot-contract-reports'

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
  creditSpendOrReservation: false,
  stripeOrBilling: false,
  storageObjectsCreated: false,
}

const SOURCE_PATHS = [
  'README.md',
  'AGENTS.md',
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/architecture-boundary-matrix.md',
  'docs/tool-readiness-worker-runtime-foundation.md',
  'docs/tool-call-foundation.md',
  'docs/provider-gateway-foundation.md',
  'docs/model-orchestration-approved-plan-snapshot-schema.md',
  'docs/model-orchestration-approval-gate-worker-handoff-policy.md',
  'docs/worker-runtime-repo-audit.md',
  'docs/worker-runtime-approved-plan-snapshot-intake.md',
  'docs/worker-runtime-artifact-scope-source-of-truth.md',
  'docs/worker-runtime-execution-blocker-policy.md',
  'docs/worker-runtime-repo-audit-decision.md',
  'docs/implementation-prompts/prompt-worker-runtime-dry-run-approval-after-repo-audit.md',
  'docs/internal-testing-allowed-scope-freeze.md',
  'docs/internal-testing-blocked-scope-freeze.md',
  'docs/restricted-internal-testing-session-0-decision.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  REPO_AUDIT_REPORT_DIR,
  PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR,
  PLAN_SNAPSHOT_CONTRACT_REPORT_DIR,
  'docs/activation-model-orchestration-provider-dry-run-reports',
  'docs/activation-model-orchestration-qwen-auth-repair-reports',
  'docs/activation-model-orchestration-dry-run-approval-reports',
  'docs/activation-track-b-tool-route-manifest-reports',
  'docs/activation-track-b-capability-manifests-reports',
  'docs/activation-phase-44g-local-worker-sidecar-foundation-reports',
  'docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports',
  'docs/activation-phase-44l-route-dry-run-approval-reports',
  'docs/activation-phase-44m-noop-route-dry-run-execution-reports',
  'docs/activation-phase-44o-metadata-route-dry-run-execution-reports',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports',
] as const

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function collectFiles(root: string, limit = 80): { present: boolean; totalFiles: number; representativeFiles: string[] } {
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

function hasUnsafeFlag(report: Record<string, unknown>): boolean {
  return Object.keys(RUNTIME_FALSE_FLAGS).some((key) => report[key] === true)
}

function runtimeFlags() {
  return { ...RUNTIME_FALSE_FLAGS }
}

export function getWorkerRuntimeDryRunApprovalPlan() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_APPROVAL_RUN_ID,
    branch: WORKER_RUNTIME_DRY_RUN_APPROVAL_BRANCH,
    baseBranch: WORKER_RUNTIME_DRY_RUN_APPROVAL_BASE_BRANCH,
    prTitle: '[worker] Runtime dry-run approval packet',
    mode: 'metadata_only_approval_packet',
    reportDir: WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR,
    expectedReports: WORKER_RUNTIME_DRY_RUN_APPROVAL_EXPECTED_REPORTS,
    requiredConfirmations: WORKER_RUNTIME_DRY_RUN_APPROVAL_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: WORKER_RUNTIME_DRY_RUN_APPROVAL_FORBIDDEN_CONFIRMATIONS,
    expectedDecision: 'approved_for_future_worker_noop_dry_run_execution',
    nextRecommendedPhase: 'WORKER_RUNTIME_JOBS - no-op worker dry-run execution if approval passes',
    noRuntimeExecutionInThisPhase: true,
    ...runtimeFlags(),
  }
}

function buildSourceAudit() {
  const repoAuditDecision = readJson(path.join(REPO_AUDIT_REPORT_DIR, 'worker_runtime_repo_audit_decision.json'))
  const planSnapshotDryRunDecision = readJson(path.join(PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR, 'plan_snapshot_dry_run_decision.json'))
  const planSnapshotContractDecision = readJson(path.join(PLAN_SNAPSHOT_CONTRACT_REPORT_DIR, 'plan_snapshot_contract_decision.json'))
  const evidence = [
    {
      pr: 341,
      name: 'worker runtime repo audit',
      expectedDecision: 'repo_audit_passed_ready_for_worker_dry_run_approval',
      actualDecision: repoAuditDecision?.decision,
      present: repoAuditDecision !== undefined,
      accepted: repoAuditDecision?.decision === 'repo_audit_passed_ready_for_worker_dry_run_approval',
    },
    {
      pr: 337,
      name: 'plan snapshot dry-run validation',
      expectedDecision: 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
      actualDecision: planSnapshotDryRunDecision?.decision,
      present: planSnapshotDryRunDecision !== undefined,
      accepted: planSnapshotDryRunDecision?.decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
    },
    {
      pr: 327,
      name: 'plan snapshot contract',
      expectedDecision: 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
      actualDecision: planSnapshotContractDecision?.decision,
      present: planSnapshotContractDecision !== undefined,
      accepted: planSnapshotContractDecision?.decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
    },
    {
      pr: 320,
      name: 'Qwen and DeepSeek provider dry-run evidence',
      present: existsSync('docs/activation-model-orchestration-provider-dry-run-reports'),
      accepted: existsSync('docs/activation-model-orchestration-provider-dry-run-reports'),
      note: 'Provider execution is historical source evidence only and is not invoked by this packet.',
    },
    {
      pr: 318,
      name: 'model orchestration dry-run approval packet',
      present: existsSync('docs/activation-model-orchestration-dry-run-approval-reports'),
      accepted: existsSync('docs/activation-model-orchestration-dry-run-approval-reports'),
    },
    {
      pr: 311,
      name: 'restricted internal testing session 0',
      present: existsSync('docs/restricted-internal-testing-session-0-decision.md'),
      accepted: existsSync('docs/restricted-internal-testing-session-0-decision.md'),
    },
    {
      pr: 298,
      name: 'Track B clean staging backfill',
      present: existsSync('docs/activation-supabase-trackb-clean-staging-backfill-reports'),
      accepted: existsSync('docs/activation-supabase-trackb-clean-staging-backfill-reports'),
    },
  ]
  const integrationEvidence = [
    pathStatus('docs/activation-track-b-tool-route-manifest-reports'),
    pathStatus('docs/activation-track-b-capability-manifests-reports'),
    pathStatus('docs/activation-phase-44g-local-worker-sidecar-foundation-reports'),
    pathStatus('docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports'),
    pathStatus('docs/activation-phase-44l-route-dry-run-approval-reports'),
    pathStatus('docs/activation-phase-44m-noop-route-dry-run-execution-reports'),
    pathStatus('docs/activation-phase-44o-metadata-route-dry-run-execution-reports'),
  ]
  const status = evidence.every((item) => item.accepted) &&
    integrationEvidence.every((item) => item.present) ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status,
    owner: 'WORKER_RUNTIME_JOBS',
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    prEvidence: evidence,
    integrationEvidence,
    sourceOfTruthConflictsFound: false,
    missingOptionalDocsAreRecordedNotMutated: true,
    ...runtimeFlags(),
  }
}

function buildEvidenceInventory() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    evidence: [
      { name: 'PR #341 repo audit', classification: 'accepted_source', path: `${REPO_AUDIT_REPORT_DIR}/worker_runtime_repo_audit_decision.json` },
      { name: 'PR #337 plan snapshot dry-run', classification: 'accepted_source', path: `${PLAN_SNAPSHOT_DRY_RUN_REPORT_DIR}/plan_snapshot_dry_run_decision.json` },
      { name: 'PR #327 plan snapshot contract', classification: 'accepted_source', path: `${PLAN_SNAPSHOT_CONTRACT_REPORT_DIR}/plan_snapshot_contract_decision.json` },
      { name: 'Provider dry-run evidence', classification: 'historical_source_no_provider_calls', path: 'docs/activation-model-orchestration-provider-dry-run-reports' },
      { name: 'Track B route manifest', classification: 'route_metadata_only', path: 'docs/activation-track-b-tool-route-manifest-reports' },
      { name: 'Track B capability manifests', classification: 'capability_metadata_only', path: 'docs/activation-track-b-capability-manifests-reports' },
      { name: 'Phase 44G local sidecar foundation', classification: 'sidecar_metadata_foundation_only', path: 'docs/activation-phase-44g-local-worker-sidecar-foundation-reports' },
      { name: 'Phase 44J hybrid simulation', classification: 'simulation_evidence_no_execution_here', path: 'docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports' },
      { name: 'Route dry-run chain', classification: 'route_metadata_chain_no_route_execution_here', path: 'docs/activation-phase-44l-route-dry-run-approval-reports' },
      { name: 'Supabase Track B clean staging sync', classification: 'completed_elsewhere_no_write_here', path: 'docs/activation-supabase-trackb-clean-staging-backfill-reports' },
    ],
    workerSurfacesReviewed: [
      collectFiles('server/workers', 80),
      collectFiles('server/jobs', 80),
      collectFiles('server/queues', 80),
      collectFiles('server/activation/local-worker-sidecar-foundation', 80),
    ],
    ...runtimeFlags(),
  }
}

function fixture(caseId: string, kind: 'valid' | 'invalid_fail_closed', purpose: string, blockedActions: string[], reason?: string) {
  return {
    caseId,
    kind,
    purpose,
    schemaVersion: 'approved_plan_snapshot_v1',
    approvedSnapshotId: `synthetic-${caseId}`,
    sourceOfTruthRefs: [
      `supabase_row_ref:synthetic_worker_dry_run/${caseId}`,
      `private_gcs_path_ref:synthetic-private-gcs/worker-dry-run/${caseId}`,
      `manifest_ref:synthetic_manifest_${caseId}`,
      `checksum_ref:synthetic_checksum_${caseId}`,
    ],
    workerHandoffStatus: 'future_worker_phase_requires_separate_approval',
    syntheticOnly: true,
    realUserData: false,
    realMedia: false,
    privatePayloadCommitted: false,
    runtimeExecutionAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerExecutionAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    rawPromptForwardingAllowed: false,
    productionMutationAllowed: false,
    expectedDecision: kind === 'valid' ? 'accepted_for_future_noop_dry_run_fixture' : 'fail_closed',
    blockedActions,
    intentionallyInvalidReason: reason,
  }
}

function buildApprovedPlanSnapshotFixtures() {
  const fixtures = [
    fixture('valid_noop_metadata_review_plan', 'valid', 'Validate approved snapshot intake and no-op worker metadata review only.', []),
    fixture('valid_artifact_scope_validation_plan', 'valid', 'Validate private artifact scope metadata and source refs only.', []),
    fixture('valid_route_resolution_only_plan', 'valid', 'Validate route metadata resolution without route execution.', []),
    fixture('valid_cost_estimation_only_plan', 'valid', 'Validate cost class and budget metadata without credit mutation.', []),
    fixture('invalid_raw_prompt_worker_input', 'invalid_fail_closed', 'Reject raw prompt input as worker source.', ['raw_prompt_execution'], 'raw_prompt_worker_input'),
    fixture('invalid_public_artifact_output_request', 'invalid_fail_closed', 'Reject public artifact output request.', ['public_artifacts'], 'public_artifact_output_request'),
    fixture('invalid_broad_media_processing_request', 'invalid_fail_closed', 'Reject broad or arbitrary media processing request.', ['broad_media_processing'], 'broad_media_processing_request'),
    fixture('invalid_production_write_request', 'invalid_fail_closed', 'Reject production write or deployment request.', ['production_write'], 'production_write_request'),
  ]
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    fixtureCount: fixtures.length,
    validFixtureCount: fixtures.filter((item) => item.kind === 'valid').length,
    invalidFailClosedFixtureCount: fixtures.filter((item) => item.kind === 'invalid_fail_closed').length,
    fixtures,
    noRealUserData: true,
    noRealMedia: true,
    noPrivatePayloads: true,
    noProviderCalls: true,
    ...runtimeFlags(),
  }
}

function buildScopePolicy() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    allowedFutureNoopScope: [
      'no_op_worker_intake_validation',
      'approved_plan_snapshot_schema_validation',
      'artifact_scope_validation',
      'route_metadata_resolution_only',
      'cost_capacity_estimate_only',
      'audit_event_shaping_only',
    ],
    blockedInApprovalPhase: [
      'worker_execution',
      'tool_execution',
      'route_execution',
      'provider_calls',
      'media_processing',
      'supabase_writes',
      'docker',
      'cloud_run',
      'cloud_build',
      'public_artifacts',
      'signed_urls',
      'production',
      'external_beta',
      'paid_production',
    ],
    futureDryRunMayOnlySimulateMetadata: true,
    ...runtimeFlags(),
  }
}

function buildArtifactScopeGuardrails() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    requiredSourceOfTruthRefs: [
      'supabase_row_ref',
      'private_gcs_path_ref',
      'private_artifact_manifest_ref',
      'checksum_ref',
      'approved_plan_snapshot_ref',
    ],
    forbiddenSourceRefs: [
      'signed_url',
      'public_artifact_url',
      'arbitrary_local_path',
      'unapproved_gcs_prefix',
      'raw_provider_response',
      'raw_prompt_text',
    ],
    signedUrlsAsSourceOfTruth: false,
    publicArtifactsAllowed: false,
    privatePayloadsCommitted: false,
    artifactScopesRequiredBeforeFutureExecution: true,
    ...runtimeFlags(),
  }
}

function buildQueueJobSidecarPolicy() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    approvalPhaseActions: {
      queueEnqueue: false,
      jobClaim: false,
      jobLease: false,
      workerProcessSpawn: false,
      sidecarExecution: false,
      subprocessExecution: false,
      dockerRun: false,
      cloudRunJob: false,
      cloudBuild: false,
    },
    futureDryRunConstraint: 'simulate_enqueue_dispatch_claim_and_sidecar_metadata_only_unless_separately_approved',
    ...runtimeFlags(),
  }
}

function buildObservabilityCostFailureGuardrails() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    requiredFutureMetadata: [
      'correlation_id',
      'approved_plan_snapshot_id',
      'artifact_manifest_refs',
      'noop_execution_id',
      'cost_estimate_class',
      'timeout_class',
      'retry_policy_ref',
      'rollback_cleanup_metadata',
      'failure_state_mapping',
      'abuse_rate_limit_check',
    ],
    retryDefault: 'disabled_until_noop_dry_run_execution_prompt',
    costMutationAllowed: false,
    creditReservationAllowed: false,
    ...runtimeFlags(),
  }
}

function buildFailClosedPolicy() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    failClosedOn: [
      'missing_approved_plan_snapshot',
      'raw_prompt_input',
      'provider_response_input',
      'plan_snapshot_candidate_input',
      'invalid_artifact_scope',
      'public_artifact_request',
      'signed_url_source_of_truth_request',
      'production_mutation',
      'broad_media_request',
      'real_tool_execution_request',
      'worker_execution_request',
      'docker_or_cloud_run_request',
      'missing_audit_cost_metadata',
    ],
    failureMode: 'blocked_before_any_runtime_or_mutation',
    ...runtimeFlags(),
  }
}

function selectDecision(reports: Omit<WorkerRuntimeDryRunApprovalReports, 'decision' | 'blockerReport' | 'readinessReport' | 'privateArtifactManifest'>): WorkerRuntimeDryRunApprovalDecision {
  if (Object.values(reports).some(hasUnsafeFlag)) return 'rejected_due_worker_execution_safety_risk'
  if (reports.sourceAudit.status !== 'passed') return 'blocked_pending_plan_snapshot_fixture_review'
  if (reports.approvedPlanSnapshotFixtures.status !== 'passed') return 'blocked_pending_plan_snapshot_fixture_review'
  if (reports.artifactScopeGuardrails.status !== 'passed') return 'blocked_pending_artifact_scope_guardrails'
  if (reports.queueJobSidecarPolicy.status !== 'passed') return 'blocked_pending_queue_job_policy'
  if (reports.observabilityCostFailureGuardrails.status !== 'passed') return 'blocked_pending_observability_cost_guardrails'
  if (reports.failClosedPolicy.status !== 'passed' || reports.scopePolicy.status !== 'passed') {
    return 'blocked_pending_execution_blocker_policy'
  }
  return 'approved_for_future_worker_noop_dry_run_execution'
}

function buildDecision(input: Omit<WorkerRuntimeDryRunApprovalReports, 'decision' | 'blockerReport' | 'readinessReport' | 'privateArtifactManifest'>) {
  const decision = selectDecision(input)
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_APPROVAL_RUN_ID,
    status: decision === 'approved_for_future_worker_noop_dry_run_execution' ? 'approved' : 'blocked',
    decision,
    activeBlockers: decision === 'approved_for_future_worker_noop_dry_run_execution' ? [] : [decision],
    futureNoopDryRunExecutionApproved: decision === 'approved_for_future_worker_noop_dry_run_execution',
    workerExecutionApproved: false,
    nextRecommendedPhase: decision === 'approved_for_future_worker_noop_dry_run_execution'
      ? 'WORKER_RUNTIME_JOBS - no-op worker dry-run execution if approval passes'
      : 'Repair the exact worker dry-run approval blocker before a no-op dry-run execution prompt.',
    ...runtimeFlags(),
  }
}

function buildBlockerReport(decision: Record<string, unknown>) {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: decision.status,
    activeBlockers: decision.activeBlockers,
    blockedScopesStillBlocked: [
      'actual_worker_execution',
      'real_tool_execution',
      'provider_execution',
      'production',
      'external_beta',
      'paid_production',
      'public_artifacts',
      'signed_urls',
      'raw_prompt_execution',
      'supabase_writes',
      'docker',
      'cloud_run',
      'cloud_build',
      'media_processing',
    ],
    ...runtimeFlags(),
  }
}

function buildReadinessReport(decision: Record<string, unknown>) {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: decision.status,
    decision: decision.decision,
    workerDryRunApprovalPacketAttempted: true,
    futureNoopDryRunExecutionApproved: decision.futureNoopDryRunExecutionApproved === true,
    workerExecutionReady: false,
    workerExecutionApproved: false,
    supabaseUpdateRequired: 'no_write',
    supabaseEnvironmentTouched: 'none',
    packageLockChanged: false,
    ...runtimeFlags(),
  }
}

function buildPrivateArtifactManifest() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_APPROVAL_PHASE,
    status: 'passed',
    artifacts: WORKER_RUNTIME_DRY_RUN_APPROVAL_EXPECTED_REPORTS.map((name) => ({
      name,
      path: `${WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR}/${name}`,
      classification: 'safe_metadata_report',
      containsSecretPayload: false,
      containsPrivatePayload: false,
      containsRawProviderOutput: false,
      publicArtifact: false,
    })),
    ...runtimeFlags(),
  }
}

export function buildWorkerRuntimeDryRunApprovalReports(): WorkerRuntimeDryRunApprovalReports {
  const sourceAudit = buildSourceAudit()
  const plan = getWorkerRuntimeDryRunApprovalPlan()
  const evidenceInventory = buildEvidenceInventory()
  const approvedPlanSnapshotFixtures = buildApprovedPlanSnapshotFixtures()
  const scopePolicy = buildScopePolicy()
  const artifactScopeGuardrails = buildArtifactScopeGuardrails()
  const queueJobSidecarPolicy = buildQueueJobSidecarPolicy()
  const observabilityCostFailureGuardrails = buildObservabilityCostFailureGuardrails()
  const failClosedPolicy = buildFailClosedPolicy()
  const decision = buildDecision({
    sourceAudit,
    plan,
    evidenceInventory,
    approvedPlanSnapshotFixtures,
    scopePolicy,
    artifactScopeGuardrails,
    queueJobSidecarPolicy,
    observabilityCostFailureGuardrails,
    failClosedPolicy,
  })
  const blockerReport = buildBlockerReport(decision)
  const readinessReport = buildReadinessReport(decision)
  const privateArtifactManifest = buildPrivateArtifactManifest()

  return {
    sourceAudit,
    plan,
    evidenceInventory,
    approvedPlanSnapshotFixtures,
    scopePolicy,
    artifactScopeGuardrails,
    queueJobSidecarPolicy,
    observabilityCostFailureGuardrails,
    failClosedPolicy,
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
    const line = `Worker runtime dry-run approval status: ${decision}. Approval is metadata-only; worker/tool/route/provider execution, Docker, Cloud Run, Cloud Build, Supabase writes, media processing, public artifacts, signed URLs, external beta, paid production, and production remain blocked.`
    const next = current.includes('Worker runtime dry-run approval status:')
      ? current.replace(/\n*Worker runtime dry-run approval status:.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(scorecardPath, next)
  }

  const blockerPath = 'docs/production-beta-blocker-inventory.md'
  if (existsSync(blockerPath)) {
    const current = readFileSync(blockerPath, 'utf8')
    const line = `Worker runtime dry-run approval does not remove production beta blockers; current decision is \`${decision}\`.`
    const next = current.includes('Worker runtime dry-run approval does not remove production beta blockers;')
      ? current.replace(/\n*Worker runtime dry-run approval does not remove production beta blockers;.*(?:\n|$)/, `\n\n${line}\n`)
      : `${current.trimEnd()}\n\n${line}\n`
    await writeVlmRuntimeTextArtifact(blockerPath, next)
  }
}

export async function writeWorkerRuntimeDryRunApprovalArtifacts(reports: WorkerRuntimeDryRunApprovalReports) {
  const reportMap: Record<typeof WORKER_RUNTIME_DRY_RUN_APPROVAL_EXPECTED_REPORTS[number], Record<string, unknown>> = {
    'source_of_truth_ownership_audit.json': reports.sourceAudit,
    'worker_dry_run_approval_plan.json': reports.plan,
    'worker_dry_run_evidence_inventory.json': reports.evidenceInventory,
    'approved_plan_snapshot_dry_run_fixtures.json': reports.approvedPlanSnapshotFixtures,
    'worker_dry_run_scope_policy.json': reports.scopePolicy,
    'worker_dry_run_artifact_scope_guardrails.json': reports.artifactScopeGuardrails,
    'worker_dry_run_queue_job_sidecar_policy.json': reports.queueJobSidecarPolicy,
    'worker_dry_run_observability_cost_failure_guardrails.json': reports.observabilityCostFailureGuardrails,
    'worker_dry_run_fail_closed_policy.json': reports.failClosedPolicy,
    'worker_dry_run_approval_decision.json': reports.decision,
    'worker_dry_run_approval_blocker_report.json': reports.blockerReport,
    'worker_dry_run_approval_readiness_report.json': reports.readinessReport,
    'worker_dry_run_approval_private_artifact_manifest.json': reports.privateArtifactManifest,
  }

  for (const [name, report] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR, name), report)
  }

  const decision = String(reports.decision.decision)
  await writeVlmRuntimeTextArtifact('docs/worker-runtime-dry-run-approval.md', `# Worker Runtime Dry-Run Approval

Decision: \`${decision}\`.

This packet approves a future no-op, metadata-only worker dry run using synthetic \`approved_plan_snapshot_v1\` fixtures. It does not execute workers, tools, routes, providers, Docker, Cloud Run, Cloud Build, media processing, Supabase writes, public artifacts, signed URLs, external beta, paid production, or production.

Next phase: \`WORKER_RUNTIME_JOBS - no-op worker dry-run execution if approval passes\`.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-dry-run-scope-policy.md', `# Worker Runtime Dry-Run Scope Policy

Allowed future scope is limited to no-op worker intake validation, approved plan snapshot schema validation, artifact scope validation, route metadata resolution only, cost/capacity estimate only, and audit event shaping only.

No real tool execution, route execution, worker execution, provider call, media processing, public artifact, signed URL, Supabase write, Docker, Cloud Run, external beta, paid production, or production unlock is approved.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-dry-run-artifact-scope-guardrails.md', `# Worker Runtime Dry-Run Artifact Scope Guardrails

Future worker source of truth must combine Supabase row refs, private GCS path refs, artifact manifest refs, checksums, and approved plan snapshot refs.

Signed URLs, public artifact URLs, arbitrary local paths, unapproved prefixes, raw provider responses, raw prompts, and committed private payloads are blocked.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-dry-run-queue-job-sidecar-policy.md', `# Worker Runtime Dry-Run Queue Job Sidecar Policy

This approval phase performs no queue enqueue, job claim, job lease, worker process spawn, sidecar execution, subprocess execution, Docker, Cloud Run, or Cloud Build.

A later no-op dry-run execution phase may simulate enqueue, dispatch, claim, lease, and sidecar metadata only if separately approved.
`)

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-dry-run-approval-decision.md', `# Worker Runtime Dry-Run Approval Decision

Decision: \`${decision}\`.

Future no-op dry-run execution approved: \`${String(reports.readinessReport.futureNoopDryRunExecutionApproved)}\`.

Worker execution approved: \`false\`. Supabase update classification: no write, SQL none, migration deployed no, environment touched none. Track B clean-staging milestone sync remains completed.
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-worker-runtime-noop-dry-run-execution.md', `# WORKER_RUNTIME_JOBS - No-Op Worker Dry-Run Execution

Proceed only after \`approved_for_future_worker_noop_dry_run_execution\`.

Scope: separate execution phase for no-op metadata worker dry-run only. Use synthetic \`approved_plan_snapshot_v1\` fixtures and private placeholder refs only.

Do not execute real workers, tools, routes, providers, media processing, Supabase writes, Docker, Cloud Run, Cloud Build, public artifacts, signed URLs, production, external beta, or paid production unless separately approved by the owning workstream.
`)

  await updateReadinessDocs(decision)
}

function forbiddenConfirmationsPresent() {
  return WORKER_RUNTIME_DRY_RUN_APPROVAL_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
}

function missingConfirmations() {
  return WORKER_RUNTIME_DRY_RUN_APPROVAL_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
}

export async function executeWorkerRuntimeDryRunApproval(input: { execute: boolean; metadataOnly: boolean; keepTemp: boolean }) {
  const reports = buildWorkerRuntimeDryRunApprovalReports()
  const forbidden = forbiddenConfirmationsPresent()
  const missing = missingConfirmations()

  if (!input.execute || !input.metadataOnly) {
    await writeWorkerRuntimeDryRunApprovalArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'execute_metadata_only_required' }
  }

  if (forbidden.length > 0) {
    await writeWorkerRuntimeDryRunApprovalArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'forbidden_confirmations_present', forbidden }
  }

  if (missing.length > 0) {
    await writeWorkerRuntimeDryRunApprovalArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'missing_required_confirmations', missing }
  }

  await writeWorkerRuntimeDryRunApprovalArtifacts(reports)
  return { exitCode: reports.decision.status === 'approved' ? 0 : 1, status: reports.decision.status, keepTemp: input.keepTemp }
}

export function readWorkerRuntimeDryRunApprovalSummary() {
  return readJson(path.join(WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR, 'worker_dry_run_approval_readiness_report.json')) ??
    buildWorkerRuntimeDryRunApprovalReports().readinessReport
}
