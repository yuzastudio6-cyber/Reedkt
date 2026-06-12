import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR,
  buildWorkerRuntimeDryRunApprovalReports,
} from '../worker-runtime-dry-run-approval'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  WorkerRuntimeNoopDryRunExecutionDecision,
  WorkerRuntimeNoopDryRunExecutionReports,
} from './worker-noop-dry-run-execution-types'

export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE = 'worker-runtime-noop-dry-run-execution'
export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID = 'worker-runtime-noop-dry-run-execution-20260612'
export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_BRANCH = 'codex/rp-worker-runtime-noop-dry-run-execution'
export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_BASE_BRANCH =
  'codex/rp-worker-runtime-dry-run-approval-after-repo-audit'
export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR =
  'docs/activation-worker-runtime-noop-dry-run-execution-reports'

export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_EXPECTED_REPORTS = [
  'worker_noop_dry_run_plan.json',
  'worker_noop_dry_run_source_of_truth_audit.json',
  'worker_noop_dry_run_fixture_inventory.json',
  'worker_noop_dry_run_valid_fixture_results.json',
  'worker_noop_dry_run_invalid_fixture_results.json',
  'worker_noop_dry_run_queue_job_sidecar_guardrails.json',
  'worker_noop_dry_run_artifact_source_ref_guardrails.json',
  'worker_noop_dry_run_raw_prompt_rejection.json',
  'worker_noop_dry_run_signed_url_public_artifact_rejection.json',
  'worker_noop_dry_run_supabase_no_write_verification.json',
  'worker_noop_dry_run_runtime_no_execution_verification.json',
  'worker_noop_dry_run_observability_cost_metadata.json',
  'worker_noop_dry_run_billing_credit_placeholder_metadata.json',
  'worker_noop_dry_run_fail_closed_events.json',
  'worker_noop_dry_run_execution_result.json',
  'worker_noop_dry_run_execution_decision.json',
  'worker_noop_dry_run_readiness_report.json',
  'worker_noop_dry_run_private_artifact_manifest.json',
  'worker_noop_dry_run_summary.json',
] as const

export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_NOOP_METADATA_ONLY',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_NOOP_SYNTHETIC_ONLY',
  'REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_V1_FIXTURES',
  'REEDITPRO_CONFIRM_NO_QUEUE_JOB_SIDE_EFFECTS',
  'REEDITPRO_CONFIRM_FAIL_CLOSED_INVALID_WORKER_FIXTURES',
] as const

export const WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_WORKER_EXECUTION',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_EXECUTION_READY',
  'REEDITPRO_CONFIRM_JOB_DISPATCH',
  'REEDITPRO_CONFIRM_JOB_CLAIM',
  'REEDITPRO_CONFIRM_JOB_LEASE',
  'REEDITPRO_CONFIRM_QUEUE_ENQUEUE',
  'REEDITPRO_CONFIRM_SIDECAR_EXECUTION',
  'REEDITPRO_CONFIRM_SUBPROCESS_EXECUTION',
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
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS',
  'REEDITPRO_CONFIRM_SECRET_PAYLOAD_PRINT',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
] as const

const RUNTIME_FALSE_FLAGS = {
  workerExecution: false,
  workerRuntimeExecutionReady: false,
  workerExecutionReady: false,
  jobDispatch: false,
  queueEnqueue: false,
  jobClaim: false,
  jobLease: false,
  sidecarSpawn: false,
  sidecarExecution: false,
  subprocessSpawn: false,
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
  generatedLocalFixturePassedClaimed: false,
  secretPayloadAccess: false,
  secretPayloadPrinted: false,
  secretPayloadCommitted: false,
  serviceRoleKeyAccess: false,
  dbUrlAccess: false,
  creditSpendOrReservation: false,
  stripeOrBilling: false,
  storageObjectsCreated: false,
}

const BLOCKED_SCOPES = [
  'real_worker_execution',
  'job_dispatch',
  'queue_enqueue',
  'job_claim',
  'job_lease',
  'sidecar_spawn',
  'subprocess_spawn',
  'tool_execution',
  'route_execution',
  'provider_calls',
  'raw_prompt_execution',
  'media_processing',
  'docker',
  'cloud_run',
  'cloud_build',
  'supabase_writes',
  'sql',
  'migrations',
  'public_artifacts',
  'signed_urls',
  'generated_assets',
  'credit_spend_or_reservation',
  'external_beta',
  'paid_production',
  'production',
  'generated_local_fixture_passed',
] as const

function runtimeFlags() {
  return { ...RUNTIME_FALSE_FLAGS }
}

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function readText(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function collectReportFiles(root: string) {
  if (!existsSync(root)) return { present: false, totalFiles: 0, representativeFiles: [] as string[] }
  const files = readdirSync(root).filter((name) => !name.startsWith('.')).sort()
  return { present: true, totalFiles: files.length, representativeFiles: files.slice(0, 40) }
}

function hasUnsafeFlag(report: Record<string, unknown>): boolean {
  return Object.keys(RUNTIME_FALSE_FLAGS).some((key) => report[key] === true)
}

function hasRequiredSourceRefs(fixture: Record<string, unknown>) {
  const refs = stringArray(fixture.sourceOfTruthRefs)
  return [
    'supabase_row_ref:',
    'private_gcs_path_ref:',
    'manifest_ref:',
    'checksum_ref:',
  ].every((prefix) => refs.some((ref) => ref.startsWith(prefix)))
}

function fixtureRuntimeFlagsSafe(fixture: Record<string, unknown>) {
  return [
    'runtimeExecutionAllowed',
    'workerExecutionAllowed',
    'toolExecutionAllowed',
    'providerExecutionAllowed',
    'publicArtifactsAllowed',
    'signedUrlsAsSourceOfTruthAllowed',
    'rawPromptForwardingAllowed',
    'productionMutationAllowed',
  ].every((key) => fixture[key] === false)
}

function getApprovalReports() {
  return buildWorkerRuntimeDryRunApprovalReports()
}

export function getWorkerRuntimeNoopDryRunExecutionPlan() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    branch: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_BRANCH,
    baseBranch: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_BASE_BRANCH,
    mode: 'metadata_only_synthetic_noop_worker_dry_run',
    sourceApprovalPr: 342,
    sourceApprovalBranch: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_BASE_BRANCH,
    sourceApprovalReportDir: WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR,
    reportDir: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR,
    expectedReports: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_EXPECTED_REPORTS,
    requiredConfirmations: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_FORBIDDEN_CONFIRMATIONS,
    allowedFixtureSchema: 'approved_plan_snapshot_v1',
    expectedFixtureCount: 8,
    validFixtureCount: 4,
    invalidFailClosedFixtureCount: 4,
    nextRecommendedPhase: 'WORKER-RUNTIME-UNLOCK-2: worker runtime dry-run contract review, no real execution',
    blockedScopes: BLOCKED_SCOPES,
    ...runtimeFlags(),
  }
}

function buildSourceOfTruthAudit() {
  const approvalReports = getApprovalReports()
  const approvalDecision = asRecord(approvalReports.decision)
  const approvalFixtures = asRecord(approvalReports.approvedPlanSnapshotFixtures)
  const repoAuditDecision = readJson('docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json')
  const planSnapshotContractDecision = readJson('docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json')
  const planSnapshotDryRunDecision = readJson('docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json')
  const qwenDecision = readJson('docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_auth_repair_decision.json')
  const qwenDryRun = readJson('docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_repaired_provider_dry_run_report.json')
  const providerDryRunDecision = readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json')
  const deepseekDryRun = readJson('docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json')
  const dryRunApprovalDecision = readJson('docs/activation-model-orchestration-dry-run-approval-reports/dry_run_approval_decision.json')
  const internalTestingDecision = readJson('docs/activation-product-internal-testing-session-0-reports/session_0_decision.json')
  const trackBCleanStagingReadiness = readJson('docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json')
  const contractDocText = `${readText('docs/model-orchestration-plan-snapshot-contract.md')}\n${readText('docs/model-orchestration-plan-snapshot-contract-decision.md')}`

  const qwenAccepted = qwenDecision?.decision === 'qwen_alias_repaired_ready_for_plan_snapshot_contract' &&
    numberValue(qwenDryRun?.providerCallsPassed) === 4
  const deepseekRemotePr320Passed = contractDocText.includes('DeepSeek: `passed_remote_pr320`')
  const deepseekAccepted = deepseekRemotePr320Passed ||
    planSnapshotContractDecision?.providerEvidencePassed === true ||
    numberValue(deepseekDryRun?.providerCallsPassed) === 3

  const evidence = [
    {
      pr: 342,
      name: 'worker runtime dry-run approval packet',
      expectedDecision: 'approved_for_future_worker_noop_dry_run_execution',
      actualDecision: approvalDecision.decision,
      accepted: approvalDecision.decision === 'approved_for_future_worker_noop_dry_run_execution' &&
        approvalFixtures.fixtureCount === 8,
    },
    {
      pr: 341,
      name: 'worker runtime repo audit',
      expectedDecision: 'repo_audit_passed_ready_for_worker_dry_run_approval',
      actualDecision: repoAuditDecision?.decision,
      accepted: repoAuditDecision?.decision === 'repo_audit_passed_ready_for_worker_dry_run_approval',
    },
    {
      pr: 335,
      name: 'plan snapshot contract readiness/fix handoff',
      expectedDecision: 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
      actualDecision: planSnapshotContractDecision?.decision,
      accepted: planSnapshotContractDecision?.decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
    },
    {
      pr: 337,
      name: 'plan snapshot dry-run validation',
      expectedDecision: 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
      actualDecision: planSnapshotDryRunDecision?.decision,
      accepted: planSnapshotDryRunDecision?.decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
    },
    {
      pr: 327,
      name: 'original plan snapshot contract packet',
      expectedDecision: 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
      actualDecision: planSnapshotContractDecision?.decision,
      accepted: planSnapshotContractDecision?.schemaContractsPresent === true &&
        planSnapshotContractDecision?.workerHandoffPolicyPresent === true,
    },
    {
      pr: 329,
      name: 'Qwen synthetic provider evidence',
      expectedDecision: 'qwen_4_of_4_preserved_as_metadata_source',
      actualDecision: qwenDecision?.decision,
      providerCallsPassed: numberValue(qwenDryRun?.providerCallsPassed),
      accepted: qwenAccepted,
    },
    {
      pr: 320,
      name: 'DeepSeek provider evidence',
      expectedDecision: 'deepseek_3_of_3_preserved_or_contract_accepted',
      actualDecision: deepseekRemotePr320Passed ? 'passed_remote_pr320' : providerDryRunDecision?.decision,
      providerCallsPassed: deepseekRemotePr320Passed ? 3 : numberValue(deepseekDryRun?.providerCallsPassed),
      accepted: deepseekAccepted,
      note: 'Only sanitized metadata is copied into this packet; provider raw output is not copied.',
    },
    {
      pr: 318,
      name: 'model orchestration dry-run approval',
      expectedDecision: 'approved_for_future_qwen_deepseek_provider_dry_run',
      actualDecision: dryRunApprovalDecision?.decision,
      accepted: dryRunApprovalDecision?.decision === 'approved_for_future_qwen_deepseek_provider_dry_run',
    },
    {
      pr: 311,
      name: 'restricted internal testing session 0',
      expectedDecision: 'restricted_internal_testing_session_0_passed',
      actualDecision: internalTestingDecision?.decision,
      accepted: internalTestingDecision?.decision === 'restricted_internal_testing_session_0_passed',
    },
    {
      pr: 298,
      name: 'Supabase Track B clean staging sync',
      expectedDecision: 'track_b_clean_staging_metadata_backfill_verified',
      actualDecision: trackBCleanStagingReadiness?.supabaseUpdateStatus,
      accepted: trackBCleanStagingReadiness?.status === 'passed',
    },
  ]

  const supportingEvidence = [
    { ...pathStatus('docs/activation-track-b-tool-route-manifest-reports'), required: true },
    { ...pathStatus('docs/activation-track-b-capability-manifests-reports'), required: true },
    { ...pathStatus('docs/activation-phase-44g-local-worker-sidecar-foundation-reports'), required: true },
    { ...pathStatus('docs/activation-phase-44j-hybrid-compute-e2e-simulation-reports'), required: true },
    { ...pathStatus('docs/activation-phase-44l-route-dry-run-approval-reports'), required: true },
    { ...pathStatus('docs/activation-phase-44m-noop-route-dry-run-execution-reports'), required: true },
    { ...pathStatus('docs/activation-phase-44o-metadata-route-dry-run-execution-reports'), required: true },
    { ...pathStatus('docs/source-of-truth-map.md'), required: false },
  ]

  const status = evidence.every((item) => item.accepted) &&
    supportingEvidence.every((item) => item.present || !item.required) ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status,
    sourceApprovalPr: 342,
    owner: 'WORKER_RUNTIME_JOBS',
    sourceOfTruthConflictsFound: status !== 'passed',
    evidence,
    supportingEvidence,
    reportDirectories: {
      approval: collectReportFiles(WORKER_RUNTIME_DRY_RUN_APPROVAL_REPORT_DIR),
      repoAudit: collectReportFiles('docs/activation-worker-runtime-repo-audit-reports'),
      planSnapshotContract: collectReportFiles('docs/activation-model-orchestration-plan-snapshot-contract-reports'),
      planSnapshotDryRun: collectReportFiles('docs/activation-model-orchestration-plan-snapshot-dry-run-reports'),
    },
    copiedRawProviderOutput: false,
    copiedSecretPayloads: false,
    ...runtimeFlags(),
  }
}

function buildFixtureInventory() {
  const approvalFixtures = asRecord(getApprovalReports().approvedPlanSnapshotFixtures)
  const fixtures = recordArray(approvalFixtures.fixtures)
  const validFixtures = fixtures.filter((fixture) => fixture.kind === 'valid')
  const invalidFixtures = fixtures.filter((fixture) => fixture.kind === 'invalid_fail_closed')
  const unsafeFixtures = fixtures.filter((fixture) =>
    fixture.schemaVersion !== 'approved_plan_snapshot_v1' ||
    booleanValue(fixture.syntheticOnly) !== true ||
    booleanValue(fixture.realUserData) !== false ||
    booleanValue(fixture.realMedia) !== false ||
    booleanValue(fixture.privatePayloadCommitted) !== false ||
    !fixtureRuntimeFlagsSafe(fixture) ||
    !hasRequiredSourceRefs(fixture))

  const status = fixtures.length === 8 &&
    validFixtures.length === 4 &&
    invalidFixtures.length === 4 &&
    unsafeFixtures.length === 0 ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status,
    fixtureCount: fixtures.length,
    validFixtureCount: validFixtures.length,
    invalidFailClosedFixtureCount: invalidFixtures.length,
    fixtureIds: fixtures.map((fixture) => fixture.caseId),
    invalidReasons: invalidFixtures.map((fixture) => fixture.intentionallyInvalidReason),
    unsafeFixtureIds: unsafeFixtures.map((fixture) => fixture.caseId),
    schemaVersion: 'approved_plan_snapshot_v1',
    syntheticOnly: true,
    sourceRefPrefixesRequired: ['supabase_row_ref', 'private_gcs_path_ref', 'manifest_ref', 'checksum_ref'],
    ...runtimeFlags(),
  }
}

function buildValidFixtureResults() {
  const fixtures = recordArray(asRecord(getApprovalReports().approvedPlanSnapshotFixtures).fixtures)
    .filter((fixture) => fixture.kind === 'valid')
  const results = fixtures.map((fixture) => {
    const refs = stringArray(fixture.sourceOfTruthRefs)
    const accepted = fixture.expectedDecision === 'accepted_for_future_noop_dry_run_fixture' &&
      fixture.schemaVersion === 'approved_plan_snapshot_v1' &&
      booleanValue(fixture.syntheticOnly) === true &&
      fixtureRuntimeFlagsSafe(fixture) &&
      hasRequiredSourceRefs(fixture)

    return {
      caseId: fixture.caseId,
      status: accepted ? 'accepted_metadata_only' : 'blocked',
      expectedDecision: fixture.expectedDecision,
      approvedSnapshotId: fixture.approvedSnapshotId,
      sourceRefCount: refs.length,
      sourceRefsValidated: hasRequiredSourceRefs(fixture),
      metadataOnlyResult: 'accepted_for_noop_worker_dry_run_contract_review',
      enqueueOccurred: false,
      claimOccurred: false,
      leaseOccurred: false,
      workerExecutionOccurred: false,
      providerCallOccurred: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    }
  })

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: results.length === 4 && results.every((result) => result.status === 'accepted_metadata_only') ? 'passed' : 'blocked',
    resultCount: results.length,
    acceptedCount: results.filter((result) => result.status === 'accepted_metadata_only').length,
    results,
    ...runtimeFlags(),
  }
}

function buildInvalidFixtureResults() {
  const fixtures = recordArray(asRecord(getApprovalReports().approvedPlanSnapshotFixtures).fixtures)
    .filter((fixture) => fixture.kind === 'invalid_fail_closed')
  const results = fixtures.map((fixture) => {
    const blockedActions = stringArray(fixture.blockedActions)
    const failClosed = fixture.expectedDecision === 'fail_closed' &&
      blockedActions.length > 0 &&
      fixtureRuntimeFlagsSafe(fixture)

    return {
      caseId: fixture.caseId,
      status: failClosed ? 'passed_fail_closed' : 'blocked',
      expectedDecision: fixture.expectedDecision,
      intentionallyInvalidReason: fixture.intentionallyInvalidReason,
      blockedActions,
      rejectionReason: fixture.intentionallyInvalidReason,
      failClosedObserved: failClosed,
      enqueueOccurred: false,
      claimOccurred: false,
      leaseOccurred: false,
      workerExecutionOccurred: false,
      providerCallOccurred: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    }
  })

  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: results.length === 4 && results.every((result) => result.status === 'passed_fail_closed') ? 'passed' : 'blocked',
    resultCount: results.length,
    passedFailClosedCount: results.filter((result) => result.status === 'passed_fail_closed').length,
    results,
    ...runtimeFlags(),
  }
}

function buildQueueJobSidecarGuardrails() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: 'passed',
    metadataSimulationOnly: true,
    queueEnqueueOccurred: false,
    jobDispatchOccurred: false,
    jobClaimOccurred: false,
    jobLeaseOccurred: false,
    leaseMutationOccurred: false,
    sidecarSpawnOccurred: false,
    subprocessSpawnOccurred: false,
    retryScheduled: false,
    cleanupRequired: false,
    rollbackRequired: false,
    ...runtimeFlags(),
  }
}

function buildArtifactSourceRefGuardrails() {
  const fixtures = recordArray(asRecord(getApprovalReports().approvedPlanSnapshotFixtures).fixtures)
  const refs = fixtures.flatMap((fixture) => stringArray(fixture.sourceOfTruthRefs))
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: refs.length === 32 && fixtures.every(hasRequiredSourceRefs) ? 'passed' : 'blocked',
    fixtureCount: fixtures.length,
    sourceRefCount: refs.length,
    requiredRefs: ['Supabase row ref placeholder', 'private GCS path ref placeholder', 'manifest ref placeholder', 'checksum ref placeholder'],
    arbitraryLocalPathsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    publicArtifactUrlsAllowed: false,
    privatePayloadsCommitted: false,
    ...runtimeFlags(),
  }
}

function buildRawPromptRejection() {
  const invalid = recordArray(asRecord(getApprovalReports().approvedPlanSnapshotFixtures).fixtures)
    .find((fixture) => fixture.caseId === 'invalid_raw_prompt_worker_input')
  const blockedActions = stringArray(invalid?.blockedActions)
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: blockedActions.includes('raw_prompt_execution') ? 'passed' : 'blocked',
    caseId: invalid?.caseId,
    rejectionReason: invalid?.intentionallyInvalidReason,
    rawPromptRejected: true,
    rawPromptForwardedToWorker: false,
    rawPromptExecuted: false,
    rawPromptPersisted: false,
    ...runtimeFlags(),
  }
}

function buildSignedUrlPublicArtifactRejection() {
  const invalid = recordArray(asRecord(getApprovalReports().approvedPlanSnapshotFixtures).fixtures)
    .find((fixture) => fixture.caseId === 'invalid_public_artifact_output_request')
  const blockedActions = stringArray(invalid?.blockedActions)
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: blockedActions.includes('public_artifacts') ? 'passed' : 'blocked',
    publicArtifactCaseId: invalid?.caseId,
    publicArtifactRejected: true,
    signedUrlSourceOfTruthRejected: true,
    signedUrlCreated: false,
    publicArtifactCreated: false,
    arbitraryPathAccepted: false,
    ...runtimeFlags(),
  }
}

function buildSupabaseNoWriteVerification() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: 'passed',
    supabaseUpdateRequired: 'no',
    supabaseUpdateStatus: 'metadata_only_no_write',
    supabaseEnvironmentTouched: 'no',
    rowsInserted: false,
    rowsUpdated: false,
    rowsDeleted: false,
    signedUrlsCreated: false,
    nextSupabaseAction: 'none',
    ...runtimeFlags(),
  }
}

function buildRuntimeNoExecutionVerification() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: 'passed',
    noScopeStatement: 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, real worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
    blockedScopes: BLOCKED_SCOPES,
    ...runtimeFlags(),
  }
}

function buildObservabilityCostMetadata() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: 'passed',
    auditEventsShaped: true,
    auditEventsPersisted: false,
    costMetadataShaped: true,
    cloudCostUsd: 0,
    providerCostUsd: 0,
    workerRuntimeCostUsd: 0,
    billingApiCalls: 'not_run',
    observabilityBackendWrites: false,
    ...runtimeFlags(),
  }
}

function buildBillingCreditPlaceholderMetadata() {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: 'passed',
    creditEstimateMetadataOnly: true,
    creditReservationCreated: false,
    creditSpendCreated: false,
    creditRefundCreated: false,
    stripeCheckoutCreated: false,
    stripeWebhookProcessed: false,
    billingMutation: false,
    ...runtimeFlags(),
  }
}

function buildFailClosedEvents(invalidFixtureResults: Record<string, unknown>) {
  const results = recordArray(invalidFixtureResults.results)
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: results.length === 4 && results.every((result) => result.status === 'passed_fail_closed') ? 'passed' : 'blocked',
    failClosedEventCount: results.length,
    events: results.map((result) => ({
      caseId: result.caseId,
      rejectionReason: result.rejectionReason,
      blockedActions: result.blockedActions,
      runtimePrevented: true,
    })),
    ...runtimeFlags(),
  }
}

function selectDecision(input: Omit<WorkerRuntimeNoopDryRunExecutionReports, 'decision' | 'readinessReport' | 'privateArtifactManifest' | 'summary'>): WorkerRuntimeNoopDryRunExecutionDecision {
  if (Object.values(input).some(hasUnsafeFlag)) return 'worker_noop_dry_run_blocked_policy_violation'
  if (input.sourceOfTruthAudit.status !== 'passed') return 'worker_noop_dry_run_blocked_source_of_truth_conflict'
  if (input.fixtureInventory.status !== 'passed') return 'worker_noop_dry_run_blocked_fixture_validation_failed'
  if (input.validFixtureResults.status !== 'passed' || input.invalidFixtureResults.status !== 'passed') return 'worker_noop_dry_run_failed'
  if ([
    input.queueJobSidecarGuardrails,
    input.artifactSourceRefGuardrails,
    input.rawPromptRejection,
    input.signedUrlPublicArtifactRejection,
    input.supabaseNoWriteVerification,
    input.runtimeNoExecutionVerification,
    input.observabilityCostMetadata,
    input.billingCreditPlaceholderMetadata,
    input.failClosedEvents,
  ].some((report) => report.status !== 'passed')) {
    return 'worker_noop_dry_run_blocked_policy_violation'
  }
  return 'worker_noop_dry_run_passed_ready_for_contract_review'
}

function buildExecutionResult(input: {
  sourceOfTruthAudit: Record<string, unknown>
  fixtureInventory: Record<string, unknown>
  validFixtureResults: Record<string, unknown>
  invalidFixtureResults: Record<string, unknown>
}) {
  const passed = input.sourceOfTruthAudit.status === 'passed' &&
    input.fixtureInventory.status === 'passed' &&
    input.validFixtureResults.status === 'passed' &&
    input.invalidFixtureResults.status === 'passed'
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    noOpDryRunAttempted: true,
    metadataOnly: true,
    syntheticOnly: true,
    approvedPlanSnapshotFixtureValidation: input.fixtureInventory.status,
    validFixtureResults: input.validFixtureResults.status,
    invalidFixtureResults: input.invalidFixtureResults.status,
    workerNoopDryRunPassed: passed,
    realWorkerExecutionRemainsBlocked: true,
    jobDispatchRemainsBlocked: true,
    supabasePersistenceRemainsBlocked: true,
    productionBetaPaidProductionClaimed: false,
    ...runtimeFlags(),
  }
}

function buildDecisionReport(input: Omit<WorkerRuntimeNoopDryRunExecutionReports, 'decision' | 'readinessReport' | 'privateArtifactManifest' | 'summary'>) {
  const decision = selectDecision(input)
  const passed = decision === 'worker_noop_dry_run_passed_ready_for_contract_review' ||
    decision === 'worker_noop_dry_run_passed_with_warnings_ready_for_contract_review'
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    decision,
    activeBlockers: passed ? [] : [decision],
    workerNoopDryRunPassed: passed,
    workerDispatchReady: false,
    jobClaimReady: false,
    jobLeaseReady: false,
    nextRecommendedPhase: passed
      ? 'WORKER-RUNTIME-UNLOCK-2: worker runtime dry-run contract review, no real execution'
      : `WORKER-RUNTIME-NOOP-DRY-RUN-FIX-${decision}: fix no-op dry-run blocker, no real execution`,
    ...runtimeFlags(),
  }
}

function buildReadinessReport(decision: Record<string, unknown>) {
  const passed = decision.status === 'passed'
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    decision: decision.decision,
    workerNoopDryRunPassed: passed,
    readyForWorkerRuntimeDryRunContractReview: passed,
    workerDispatchReady: false,
    realJobClaimReady: false,
    realJobLeaseReady: false,
    stagingFixturePassed: false,
    controlledPrivateSamplePassed: false,
    internalBetaCandidate: false,
    externalBetaCandidate: false,
    productionCandidate: false,
    supabaseUpdateRequired: 'no',
    supabaseEnvironmentTouched: 'no',
    packageLockChanged: false,
    nextRecommendedPhase: decision.nextRecommendedPhase,
    ...runtimeFlags(),
  }
}

function buildPrivateArtifactManifest() {
  const artifacts = WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_EXPECTED_REPORTS.map((name) => ({
    name,
    path: `${WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR}/${name}`,
    classification: 'safe_metadata_report',
    containsSecretPayload: false,
    containsPrivatePayload: false,
    containsRawProviderOutput: false,
    publicArtifact: false,
  }))
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: 'passed',
    artifacts,
    resultDoc: 'docs/worker-runtime-noop-dry-run-execution-result.md',
    nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-unlock-2-dry-run-contract-review.md',
    ...runtimeFlags(),
  }
}

function buildSummary(input: {
  decision: Record<string, unknown>
  fixtureInventory: Record<string, unknown>
  validFixtureResults: Record<string, unknown>
  invalidFixtureResults: Record<string, unknown>
}) {
  return {
    phase: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_PHASE,
    runId: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_RUN_ID,
    status: input.decision.status,
    decision: input.decision.decision,
    noOpDryRunAttempted: true,
    noOpDryRunPassed: input.decision.status === 'passed',
    fixtureCount: input.fixtureInventory.fixtureCount,
    validFixtures: `${input.validFixtureResults.acceptedCount}/${input.validFixtureResults.resultCount}`,
    invalidFailClosedFixtures: `${input.invalidFixtureResults.passedFailClosedCount}/${input.invalidFixtureResults.resultCount}`,
    realWorkerExecution: 'blocked',
    jobDispatchStatus: 'blocked',
    supabasePersistence: 'blocked',
    production: 'blocked',
    externalBetaStatus: 'blocked',
    paidProductionStatus: 'blocked',
    nextRecommendedPhase: input.decision.nextRecommendedPhase,
    ...runtimeFlags(),
  }
}

export function buildWorkerRuntimeNoopDryRunExecutionReports(): WorkerRuntimeNoopDryRunExecutionReports {
  const plan = getWorkerRuntimeNoopDryRunExecutionPlan()
  const sourceOfTruthAudit = buildSourceOfTruthAudit()
  const fixtureInventory = buildFixtureInventory()
  const validFixtureResults = buildValidFixtureResults()
  const invalidFixtureResults = buildInvalidFixtureResults()
  const queueJobSidecarGuardrails = buildQueueJobSidecarGuardrails()
  const artifactSourceRefGuardrails = buildArtifactSourceRefGuardrails()
  const rawPromptRejection = buildRawPromptRejection()
  const signedUrlPublicArtifactRejection = buildSignedUrlPublicArtifactRejection()
  const supabaseNoWriteVerification = buildSupabaseNoWriteVerification()
  const runtimeNoExecutionVerification = buildRuntimeNoExecutionVerification()
  const observabilityCostMetadata = buildObservabilityCostMetadata()
  const billingCreditPlaceholderMetadata = buildBillingCreditPlaceholderMetadata()
  const failClosedEvents = buildFailClosedEvents(invalidFixtureResults)
  const executionResult = buildExecutionResult({
    sourceOfTruthAudit,
    fixtureInventory,
    validFixtureResults,
    invalidFixtureResults,
  })
  const decision = buildDecisionReport({
    plan,
    sourceOfTruthAudit,
    fixtureInventory,
    validFixtureResults,
    invalidFixtureResults,
    queueJobSidecarGuardrails,
    artifactSourceRefGuardrails,
    rawPromptRejection,
    signedUrlPublicArtifactRejection,
    supabaseNoWriteVerification,
    runtimeNoExecutionVerification,
    observabilityCostMetadata,
    billingCreditPlaceholderMetadata,
    failClosedEvents,
    executionResult,
  })
  const readinessReport = buildReadinessReport(decision)
  const privateArtifactManifest = buildPrivateArtifactManifest()
  const summary = buildSummary({
    decision,
    fixtureInventory,
    validFixtureResults,
    invalidFixtureResults,
  })

  return {
    plan,
    sourceOfTruthAudit,
    fixtureInventory,
    validFixtureResults,
    invalidFixtureResults,
    queueJobSidecarGuardrails,
    artifactSourceRefGuardrails,
    rawPromptRejection,
    signedUrlPublicArtifactRejection,
    supabaseNoWriteVerification,
    runtimeNoExecutionVerification,
    observabilityCostMetadata,
    billingCreditPlaceholderMetadata,
    failClosedEvents,
    executionResult,
    decision,
    readinessReport,
    privateArtifactManifest,
    summary,
  }
}

export async function writeWorkerRuntimeNoopDryRunExecutionArtifacts(reports = buildWorkerRuntimeNoopDryRunExecutionReports()) {
  const reportMap: Record<typeof WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_EXPECTED_REPORTS[number], Record<string, unknown>> = {
    'worker_noop_dry_run_plan.json': reports.plan,
    'worker_noop_dry_run_source_of_truth_audit.json': reports.sourceOfTruthAudit,
    'worker_noop_dry_run_fixture_inventory.json': reports.fixtureInventory,
    'worker_noop_dry_run_valid_fixture_results.json': reports.validFixtureResults,
    'worker_noop_dry_run_invalid_fixture_results.json': reports.invalidFixtureResults,
    'worker_noop_dry_run_queue_job_sidecar_guardrails.json': reports.queueJobSidecarGuardrails,
    'worker_noop_dry_run_artifact_source_ref_guardrails.json': reports.artifactSourceRefGuardrails,
    'worker_noop_dry_run_raw_prompt_rejection.json': reports.rawPromptRejection,
    'worker_noop_dry_run_signed_url_public_artifact_rejection.json': reports.signedUrlPublicArtifactRejection,
    'worker_noop_dry_run_supabase_no_write_verification.json': reports.supabaseNoWriteVerification,
    'worker_noop_dry_run_runtime_no_execution_verification.json': reports.runtimeNoExecutionVerification,
    'worker_noop_dry_run_observability_cost_metadata.json': reports.observabilityCostMetadata,
    'worker_noop_dry_run_billing_credit_placeholder_metadata.json': reports.billingCreditPlaceholderMetadata,
    'worker_noop_dry_run_fail_closed_events.json': reports.failClosedEvents,
    'worker_noop_dry_run_execution_result.json': reports.executionResult,
    'worker_noop_dry_run_execution_decision.json': reports.decision,
    'worker_noop_dry_run_readiness_report.json': reports.readinessReport,
    'worker_noop_dry_run_private_artifact_manifest.json': reports.privateArtifactManifest,
    'worker_noop_dry_run_summary.json': reports.summary,
  }

  for (const [name, report] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, name), report)
  }

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-noop-dry-run-execution-result.md', `# Worker Runtime No-Op Dry-Run Execution Result

Decision: \`${String(reports.decision.decision)}\`.

The no-op dry-run processed eight synthetic \`approved_plan_snapshot_v1\` fixtures from PR #342 as metadata only. Valid fixtures were accepted for contract review, and invalid fixtures failed closed for raw prompt, public artifact, broad media, and production-write requests.

No real worker execution, queue enqueue, job dispatch, job claim, job lease, sidecar spawn, subprocess spawn, tool execution, route execution, provider call, media processing, Supabase write, SQL, migration, storage object, signed URL, public artifact, credit mutation, beta unlock, paid production unlock, production unlock, or \`generated_local_fixture_passed\` claim occurred.

Next prompt: \`WORKER-RUNTIME-UNLOCK-2: worker runtime dry-run contract review, no real execution\`.
`)

  await writeVlmRuntimeTextArtifact('docs/implementation-prompts/prompt-worker-runtime-unlock-2-dry-run-contract-review.md', `# WORKER-RUNTIME-UNLOCK-2: Worker Runtime Dry-Run Contract Review

Proceed only after \`worker_noop_dry_run_passed_ready_for_contract_review\`.

Scope: review and harden the no-op worker dry-run contract, fixture schema, fail-closed behavior, artifact source refs, queue/job/sidecar metadata boundaries, observability/cost metadata, and Supabase no-write classification.

Do not execute real workers, enqueue jobs, claim or lease jobs, spawn sidecars or subprocesses, run tools or routes, call providers, process media, run Docker, run Cloud Run or Cloud Build, mutate Supabase, execute SQL, deploy migrations, create signed URLs, create public artifacts, mutate credits or billing, unlock beta, unlock paid production, unlock production, or claim \`generated_local_fixture_passed\`.
`)
}

function forbiddenConfirmationsPresent() {
  return WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
}

function missingConfirmations() {
  return WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
}

export async function executeWorkerRuntimeNoopDryRunExecution(input: {
  execute: boolean
  metadataOnly: boolean
  syntheticOnly: boolean
  keepTemp: boolean
}) {
  const reports = buildWorkerRuntimeNoopDryRunExecutionReports()
  const forbidden = forbiddenConfirmationsPresent()
  const missing = missingConfirmations()

  if (!input.execute || !input.metadataOnly || !input.syntheticOnly || !input.keepTemp) {
    await writeWorkerRuntimeNoopDryRunExecutionArtifacts(reports)
    return {
      exitCode: 1,
      status: 'blocked',
      reason: 'execute_metadata_only_synthetic_only_keep_temp_required',
      requiredConfirmations: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REQUIRED_CONFIRMATIONS,
    }
  }

  if (forbidden.length > 0) {
    await writeWorkerRuntimeNoopDryRunExecutionArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'forbidden_confirmations_present', forbidden }
  }

  if (missing.length > 0) {
    await writeWorkerRuntimeNoopDryRunExecutionArtifacts(reports)
    return { exitCode: 1, status: 'blocked', reason: 'missing_required_confirmations', missing }
  }

  await writeWorkerRuntimeNoopDryRunExecutionArtifacts(reports)
  return {
    exitCode: reports.decision.status === 'passed' ? 0 : 1,
    status: reports.decision.status,
    keepTemp: input.keepTemp,
  }
}

export function readWorkerRuntimeNoopDryRunExecutionSummary() {
  return readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_summary.json')) ??
    buildWorkerRuntimeNoopDryRunExecutionReports().summary
}
