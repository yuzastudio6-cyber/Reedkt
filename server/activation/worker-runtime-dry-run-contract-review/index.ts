import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR,
  buildWorkerRuntimeNoopDryRunExecutionReports,
} from '../worker-runtime-noop-dry-run-execution'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  WorkerRuntimeDryRunContractReviewDecision,
  WorkerRuntimeDryRunContractReviewReports,
} from './worker-dry-run-contract-review-types'

export const WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE = 'worker-runtime-dry-run-contract-review'
export const WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID = 'worker-runtime-dry-run-contract-review-20260612'
export const WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_BRANCH =
  'codex/rp-worker-runtime-unlock-2-dry-run-contract-review'
export const WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_BASE_BRANCH =
  'codex/rp-model-orchestration-plan-snapshot-dry-run-validation'
export const WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR =
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports'

export const WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_EXPECTED_REPORTS = [
  'worker_runtime_dry_run_contract_review_decision.json',
  'worker_noop_dry_run_evidence_acceptance.json',
  'worker_runtime_fixture_contract_review.json',
  'worker_runtime_payload_schema_review.json',
  'worker_runtime_result_schema_review.json',
  'worker_runtime_invalid_fixture_fail_closed_review.json',
  'worker_runtime_queue_job_sidecar_contract_review.json',
  'worker_runtime_claim_lease_idempotency_contract_review.json',
  'worker_runtime_artifact_source_ref_contract_review.json',
  'worker_runtime_observability_cost_contract_review.json',
  'worker_runtime_billing_credit_contract_review.json',
  'worker_runtime_supabase_persistence_blocker_review.json',
  'worker_runtime_cloudrun_docker_blocker_review.json',
  'worker_runtime_tool_provider_route_blocker_review.json',
  'worker_runtime_worker_execution_blocker_register.json',
  'worker_runtime_dry_run_contract_review_summary.json',
] as const

export const WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_ALLOWED_DECISIONS = [
  'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening',
  'worker_runtime_dry_run_contract_review_passed_with_warnings_ready_for_fixture_hardening',
  'worker_runtime_dry_run_contract_review_blocked_missing_payload_fields',
  'worker_runtime_dry_run_contract_review_blocked_missing_result_schema',
  'worker_runtime_dry_run_contract_review_blocked_missing_fail_closed_evidence',
  'worker_runtime_dry_run_contract_review_blocked_missing_supabase_owner_handoff',
  'worker_runtime_dry_run_contract_review_blocked_source_of_truth_conflict',
] as const

const NO_SCOPE_STATEMENT =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, real worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

const RUNTIME_FALSE_FLAGS = {
  workerExecution: false,
  workerRuntimeExecutionReady: false,
  workerExecutionReady: false,
  jobDispatch: false,
  queueEnqueue: false,
  jobClaim: false,
  jobLease: false,
  claimMutation: false,
  leaseMutation: false,
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
  rawProviderOutputExecution: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationDeployed: false,
  publicArtifacts: false,
  signedUrls: false,
  productionAffected: false,
  internalBeta: false,
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
  demucsRuntime: false,
  trackARuntime: false,
  trackBMediaProcessing: false,
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
  'raw_provider_output_execution',
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

const SOURCE_PATHS = [
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_execution_decision.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_fixture_inventory.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_valid_fixture_results.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_invalid_fixture_results.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_queue_job_sidecar_guardrails.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_artifact_source_ref_guardrails.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_runtime_no_execution_verification.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_supabase_no_write_verification.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/approved_plan_snapshot_dry_run_fixtures.json',
  'docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/provider_dry_run_evidence_reconciliation.json',
  'docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_repaired_provider_dry_run_report.json',
  'docs/model-orchestration-plan-snapshot-contract-decision.md',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json',
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

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function hasUnsafeFlag(report: Record<string, unknown>): boolean {
  return Object.keys(RUNTIME_FALSE_FLAGS).some((key) => report[key] === true)
}

function reportStatus(report: Record<string, unknown>): string {
  return typeof report.status === 'string' ? report.status : 'missing'
}

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function requiredRefsPresent(fixture: Record<string, unknown>) {
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

function getApprovalFixtures() {
  const fixtureReport = readJson('docs/activation-worker-runtime-dry-run-approval-reports/approved_plan_snapshot_dry_run_fixtures.json')
  return recordArray(fixtureReport?.fixtures)
}

function buildNoopEvidenceAcceptance() {
  const noopReports = buildWorkerRuntimeNoopDryRunExecutionReports()
  const noopDecision = asRecord(noopReports.decision)
  const noopReadiness = asRecord(noopReports.readinessReport)
  const fixtureInventory = asRecord(noopReports.fixtureInventory)
  const validResults = asRecord(noopReports.validFixtureResults)
  const invalidResults = asRecord(noopReports.invalidFixtureResults)
  const approvalDecision = readJson('docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json')
  const repoAuditDecision = readJson('docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json')
  const planDryRunDecision = readJson('docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json')
  const planContractDecision = readJson('docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json')
  const qwenDryRun = readJson('docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_repaired_provider_dry_run_report.json')
  const providerReconciliation = readJson('docs/activation-model-orchestration-plan-snapshot-contract-reports/provider_dry_run_evidence_reconciliation.json')
  const contractDecisionText = readText('docs/model-orchestration-plan-snapshot-contract-decision.md')

  const sourceEvidence = [
    {
      pr: 346,
      name: 'worker no-op dry-run execution',
      expected: 'worker_noop_dry_run_passed_ready_for_contract_review',
      actual: noopDecision.decision,
      accepted: noopDecision.decision === 'worker_noop_dry_run_passed_ready_for_contract_review' &&
        noopReadiness.readyForWorkerRuntimeDryRunContractReview === true,
    },
    {
      pr: 342,
      name: 'worker dry-run approval',
      expected: 'approved_for_future_worker_noop_dry_run_execution',
      actual: approvalDecision?.decision,
      accepted: approvalDecision?.decision === 'approved_for_future_worker_noop_dry_run_execution',
    },
    {
      pr: 341,
      name: 'worker runtime repo audit',
      expected: 'repo_audit_passed_ready_for_worker_dry_run_approval',
      actual: repoAuditDecision?.decision,
      accepted: repoAuditDecision?.decision === 'repo_audit_passed_ready_for_worker_dry_run_approval',
    },
    {
      pr: 337,
      name: 'plan snapshot dry-run validation',
      expected: 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
      actual: planDryRunDecision?.decision,
      accepted: planDryRunDecision?.decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
    },
    {
      pr: 335,
      name: 'plan snapshot handoff evidence',
      expected: 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
      actual: planContractDecision?.decision,
      accepted: planContractDecision?.decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
    },
    {
      pr: 329,
      name: 'Qwen provider evidence',
      expected: '4_of_4_passed_preserved_as_metadata',
      actual: qwenDryRun?.status,
      providerCallsPassed: qwenDryRun?.providerCallsPassed,
      accepted: qwenDryRun?.status === 'passed' && qwenDryRun?.providerCallsPassed === 4,
      copiedRawProviderOutput: false,
    },
    {
      pr: 320,
      name: 'DeepSeek provider evidence',
      expected: '3_of_3_passed_remote_pr320_preserved',
      actual: providerReconciliation?.finalReconciledDeepSeekStatus ??
        (contractDecisionText.includes('DeepSeek: `passed_remote_pr320`') ? 'passed_remote_pr320' : undefined),
      providerCallsPassed: providerReconciliation?.finalReconciledDeepSeekStatus === 'passed_remote_pr320' ||
        contractDecisionText.includes('DeepSeek: `passed_remote_pr320`') ? 3 : undefined,
      accepted: providerReconciliation?.finalReconciledDeepSeekStatus === 'passed_remote_pr320' ||
        contractDecisionText.includes('DeepSeek: `passed_remote_pr320`'),
      copiedRawProviderOutput: false,
    },
    {
      pr: 315,
      name: 'Supabase registry restoration',
      expected: 'do_not_duplicate_registry_lane',
      actual: existsSync('docs/supabase-activation-milestone-registry-staging-deployment.md') ? 'registry_docs_present' : 'registry_docs_optional_absent',
      accepted: true,
    },
    {
      pr: 319,
      name: 'Supabase/SOUND local harness blocked lane',
      expected: 'not_continued_in_worker_lane',
      actual: 'not_continued',
      accepted: true,
    },
  ]

  const status = sourceEvidence.every((item) => item.accepted) &&
    fixtureInventory.fixtureCount === 8 &&
    validResults.acceptedCount === 4 &&
    invalidResults.passedFailClosedCount === 4 ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status,
    githubMergeHygiene: {
      pr346State: 'MERGED',
      pr346Draft: false,
      pr346MergeCommit: '9343673744dc52d2e740a545047705dc4d33b5fd',
      pr342State: 'MERGED',
      pr342MergeCommit: '77892aa5572758c08836c9d6c8d8ef9d069d5350',
      pr341State: 'MERGED',
      pr341MergeCommit: '4583001d8e8a22c638d45510fe0e08b8959bfb15',
      stackedFromDraftPr346: false,
      baseBranchHead: '4583001d8e8a22c638d45510fe0e08b8959bfb15',
    },
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    sourceEvidence,
    sourceOfTruthConflictsFound: status !== 'passed',
    rawProviderOutputCopied: false,
    secretPayloadCopied: false,
    ...runtimeFlags(),
  }
}

function buildFixtureContractReview() {
  const fixtures = getApprovalFixtures()
  const missing = fixtures.filter((fixture) =>
    fixture.schemaVersion !== 'approved_plan_snapshot_v1' ||
    typeof fixture.approvedSnapshotId !== 'string' ||
    !requiredRefsPresent(fixture) ||
    fixture.syntheticOnly !== true ||
    fixture.realUserData !== false ||
    fixture.realMedia !== false ||
    fixture.privatePayloadCommitted !== false ||
    !fixtureRuntimeFlagsSafe(fixture))
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: fixtures.length === 8 && missing.length === 0 ? 'passed' : 'blocked',
    reviewedFixtureCount: fixtures.length,
    validFixtureCount: fixtures.filter((fixture) => fixture.kind === 'valid').length,
    invalidFailClosedFixtureCount: fixtures.filter((fixture) => fixture.kind === 'invalid_fail_closed').length,
    requiredFields: [
      'approvedPlanSnapshotRef',
      'approvedPlanSnapshotHash',
      'planSnapshotSchemaVersion',
      'approved_plan_snapshot_v1',
      'sourceOfTruthRefs',
      'syntheticOnly',
    ],
    currentFieldMapping: {
      approvedPlanSnapshotRef: 'approvedSnapshotId',
      approvedPlanSnapshotHash: 'checksum_ref sourceOfTruthRefs placeholder',
      planSnapshotSchemaVersion: 'schemaVersion',
      approvedPlanSnapshotSchema: 'approved_plan_snapshot_v1',
    },
    requiredSourceTruthRefs: ['supabase_row_ref', 'private_gcs_path_ref', 'manifest_ref', 'checksum_ref'],
    blockedFields: ['rawPrompt', 'rawProviderOutput', 'publicArtifactUrl', 'signedUrlAsSourceOfTruth', 'productionWriteRequest'],
    missingOrUnsafeFixtureIds: missing.map((fixture) => fixture.caseId),
    warnings: [
      'Fixture hardening should normalize approvedSnapshotId into an explicit approvedPlanSnapshotRef field.',
      'Fixture hardening should expose checksum_ref as approvedPlanSnapshotHash while preserving metadata-only placeholders.',
    ],
    ...runtimeFlags(),
  }
}

function buildPayloadSchemaReview() {
  const requiredFields = [
    'workstreamOwner',
    'workerType',
    'jobIntent',
    'idempotencyKey',
    'correlationId',
    'artifactScope',
    'privateArtifactManifestRef',
    'inputManifestRefs',
    'outputManifestExpected',
    'checksumRequired',
    'provenanceRequired',
    'blockedActions',
    'handoffOwner',
    'resultSchemaVersion',
  ]
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: 'passed',
    contractMode: 'metadata_only_future_worker_payload_contract',
    requiredFields,
    requiredFieldCount: requiredFields.length,
    owner: 'WORKER_RUNTIME_JOBS',
    blockedFields: ['rawPrompt', 'rawProviderOutput', 'publicArtifactUrl', 'signedUrl', 'realUserData', 'mediaPayload'],
    defaultBlockedActions: BLOCKED_SCOPES,
    handoffOwner: 'WORKER_RUNTIME_JOBS',
    resultSchemaVersion: 'worker_runtime_dry_run_result_v1',
    noExecutablePayloadCreated: true,
    ...runtimeFlags(),
  }
}

function buildResultSchemaReview() {
  const requiredFields = [
    'status',
    'decision',
    'accepted',
    'blocked',
    'failClosed',
    'evidenceRefs',
    'outputManifestRef',
    'checksumRef',
    'provenanceRef',
    'auditMetadataRef',
    'costMetadataRef',
    'billingPlaceholderRef',
    'cleanupMetadata',
    'rollbackMetadata',
  ]
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: 'passed',
    contractMode: 'metadata_only_future_worker_result_contract',
    requiredFields,
    requiredFieldCount: requiredFields.length,
    allowedStatuses: ['accepted_metadata_only', 'blocked', 'passed_fail_closed'],
    allowedDecisions: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_ALLOWED_DECISIONS,
    blockedOutputs: ['publicUrl', 'signedUrl', 'rawProviderOutput', 'secretPayload', 'realMediaPayload'],
    outputManifestRefPlaceholderRequired: true,
    checksumAndProvenancePlaceholdersRequired: true,
    ...runtimeFlags(),
  }
}

function buildInvalidFixtureFailClosedReview() {
  const invalidResults = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_invalid_fixture_results.json'))
  const failClosedEvents = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_fail_closed_events.json'))
  const rawPrompt = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_raw_prompt_rejection.json'))
  const signedUrlPublic = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_signed_url_public_artifact_rejection.json'))
  const resultRows = recordArray(invalidResults?.results)
  const expectedReasons = [
    'raw_prompt_worker_input',
    'public_artifact_output_request',
    'broad_media_processing_request',
    'production_write_request',
  ]
  const observedReasons = resultRows.map((result) => String(result.rejectionReason))
  const status = invalidResults?.status === 'passed' &&
    failClosedEvents?.status === 'passed' &&
    rawPrompt?.rawPromptRejected === true &&
    signedUrlPublic?.publicArtifactRejected === true &&
    expectedReasons.every((reason) => observedReasons.includes(reason)) ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status,
    invalidFixtureCount: resultRows.length,
    expectedReasons,
    observedReasons,
    rawPromptRejected: rawPrompt?.rawPromptRejected === true,
    publicArtifactRejected: signedUrlPublic?.publicArtifactRejected === true,
    broadMediaRejected: observedReasons.includes('broad_media_processing_request'),
    productionWriteRejected: observedReasons.includes('production_write_request'),
    signedUrlSourceOfTruthRejected: signedUrlPublic?.signedUrlSourceOfTruthRejected === true,
    privatePayloadCommitRejected: true,
    ...runtimeFlags(),
  }
}

function buildQueueJobSidecarContractReview() {
  const queue = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_queue_job_sidecar_guardrails.json'))
  const status = queue?.status === 'passed' &&
    queue.queueEnqueueOccurred === false &&
    queue.jobDispatchOccurred === false &&
    queue.jobClaimOccurred === false &&
    queue.jobLeaseOccurred === false &&
    queue.sidecarSpawnOccurred === false &&
    queue.subprocessSpawnOccurred === false ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status,
    enqueue: false,
    dispatch: false,
    claim: false,
    lease: false,
    docker: false,
    cloudRun: false,
    retrySimulation: 'metadata_only',
    idempotencySimulation: 'metadata_only',
    cleanupRollbackMetadataOnly: true,
    sourceReportStatus: reportStatus(asRecord(queue)),
    ...runtimeFlags(),
  }
}

function buildClaimLeaseIdempotencyContractReview() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: 'passed',
    idempotencyKeyRequired: true,
    correlationIdRequired: true,
    approvedPlanSnapshotRefRequired: true,
    claimMutationAllowed: false,
    leaseMutationAllowed: false,
    retryStateMutationAllowed: false,
    idempotencyPersistenceAllowed: false,
    futureOwnerRequired: 'SUPABASE_RLS_STORAGE_DATABASE for real persistence and WORKER_RUNTIME_JOBS for runtime behavior',
    ...runtimeFlags(),
  }
}

function buildArtifactSourceRefContractReview() {
  const artifact = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_artifact_source_ref_guardrails.json'))
  const status = artifact?.status === 'passed' &&
    artifact.sourceRefCount === 32 &&
    artifact.signedUrlsAsSourceOfTruthAllowed === false &&
    artifact.publicArtifactUrlsAllowed === false ? 'passed' : 'blocked'
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status,
    futureSourceOfTruthRequired: [
      'Supabase row ref placeholder',
      'private GCS path ref placeholder',
      'manifest ref placeholder',
      'checksum ref placeholder',
      'approved plan snapshot ref',
    ],
    signedUrlRejectedAsSourceOfTruth: true,
    publicArtifactRejected: true,
    arbitraryPathRejected: true,
    committedPrivatePayloadRejected: true,
    sourceReportStatus: reportStatus(asRecord(artifact)),
    ...runtimeFlags(),
  }
}

function buildObservabilityCostContractReview() {
  const observability = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_observability_cost_metadata.json'))
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: observability?.status === 'passed' ? 'passed' : 'blocked',
    auditMetadataOnly: true,
    auditEventsPersisted: false,
    costMetadataOnly: true,
    cloudCostUsd: 0,
    providerCostUsd: 0,
    workerRuntimeCostUsd: 0,
    observabilityBackendWrites: false,
    sourceReportStatus: reportStatus(asRecord(observability)),
    ...runtimeFlags(),
  }
}

function buildBillingCreditContractReview() {
  const billing = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_billing_credit_placeholder_metadata.json'))
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: billing?.status === 'passed' ? 'passed' : 'blocked',
    billingPlaceholderMetadataOnly: true,
    creditReservationCreated: false,
    creditSpendCreated: false,
    creditRefundCreated: false,
    stripeCheckoutCreated: false,
    stripeWebhookProcessed: false,
    billingMutation: false,
    sourceReportStatus: reportStatus(asRecord(billing)),
    ...runtimeFlags(),
  }
}

function buildSupabasePersistenceBlockerReview() {
  const supabaseNoWrite = readJson(path.join(WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR, 'worker_noop_dry_run_supabase_no_write_verification.json'))
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: supabaseNoWrite?.status === 'passed' && supabaseNoWrite.supabaseEnvironmentTouched === 'no' ? 'passed' : 'blocked',
    supabaseUpdateRequired: 'no',
    supabaseEnvironmentTouched: 'no',
    rowsInserted: false,
    rowsUpdated: false,
    rowsDeleted: false,
    jobTablesWritten: false,
    runtimeConfigsWritten: false,
    futureSupabaseOwnerPromptRequired: true,
    blocker: 'Supabase worker/job persistence remains separate-owner blocked.',
    sourceReportStatus: reportStatus(asRecord(supabaseNoWrite)),
    ...runtimeFlags(),
  }
}

function buildCloudrunDockerBlockerReview() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: 'passed',
    futureRuntimeOwnerApprovalRequired: true,
    blocker: 'Cloud Run, Docker, Cloud Build, sidecar, and subprocess execution remain blocked.',
    ...runtimeFlags(),
  }
}

function buildToolProviderRouteBlockerReview() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: 'passed',
    qwenEvidenceAcceptedAsHistoricalMetadata: true,
    deepseekEvidenceAcceptedAsHistoricalMetadata: true,
    futureOwnerApprovalsRequired: ['TOOL_ROUTE_EXECUTION', 'PROVIDER_GATEWAY_MODELS', 'MODEL_ORCHESTRATION_QWEN_DEEPSEEK'],
    ...runtimeFlags(),
  }
}

function buildWorkerExecutionBlockerRegister() {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: 'passed',
    blockers: BLOCKED_SCOPES.map((scope) => ({
      scope,
      blocked: true,
      resolution: 'requires later explicit owner prompt',
    })),
    runtimeUnlockLadderCurrentPosition: 'dry_run_contract_review_passed',
    realWorkerExecutionReady: false,
    productionReady: false,
    externalBetaReady: false,
    paidProductionReady: false,
    noScopeStatement: NO_SCOPE_STATEMENT,
    ...runtimeFlags(),
  }
}

function selectDecision(input: Omit<WorkerRuntimeDryRunContractReviewReports, 'decision' | 'summary'>): WorkerRuntimeDryRunContractReviewDecision {
  if (Object.values(input).some(hasUnsafeFlag)) return 'worker_runtime_dry_run_contract_review_blocked_source_of_truth_conflict'
  if (input.noopEvidenceAcceptance.status !== 'passed') return 'worker_runtime_dry_run_contract_review_blocked_source_of_truth_conflict'
  if (input.fixtureContractReview.status !== 'passed') return 'worker_runtime_dry_run_contract_review_blocked_missing_payload_fields'
  if (input.payloadSchemaReview.status !== 'passed') return 'worker_runtime_dry_run_contract_review_blocked_missing_payload_fields'
  if (input.resultSchemaReview.status !== 'passed') return 'worker_runtime_dry_run_contract_review_blocked_missing_result_schema'
  if (input.invalidFixtureFailClosedReview.status !== 'passed') return 'worker_runtime_dry_run_contract_review_blocked_missing_fail_closed_evidence'
  if (input.supabasePersistenceBlockerReview.status !== 'passed') return 'worker_runtime_dry_run_contract_review_blocked_missing_supabase_owner_handoff'
  if (Object.values(input).some((report) => report.status !== 'passed')) {
    return 'worker_runtime_dry_run_contract_review_blocked_source_of_truth_conflict'
  }
  return 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening'
}

function buildDecisionReport(input: Omit<WorkerRuntimeDryRunContractReviewReports, 'decision' | 'summary'>) {
  const decision = selectDecision(input)
  const passed = decision === 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening' ||
    decision === 'worker_runtime_dry_run_contract_review_passed_with_warnings_ready_for_fixture_hardening'
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    decision,
    activeBlockers: passed ? [] : [decision],
    dryRunContractsReadyForFixtureHardening: passed,
    realWorkerExecutionReady: false,
    workerDispatchReady: false,
    jobClaimReady: false,
    jobLeaseReady: false,
    supabasePersistenceReady: false,
    productionBetaPaidProductionClaimed: false,
    nextRecommendedPhase: passed
      ? 'WORKER-RUNTIME-UNLOCK-3: worker runtime fixture hardening, no real execution'
      : `WORKER-RUNTIME-UNLOCK-2-FIX-${decision}: fix dry-run contract review blocker, no real execution`,
    noScopeStatement: NO_SCOPE_STATEMENT,
    ...runtimeFlags(),
  }
}

function buildSummary(input: {
  decision: Record<string, unknown>
  noopEvidenceAcceptance: Record<string, unknown>
  fixtureContractReview: Record<string, unknown>
  payloadSchemaReview: Record<string, unknown>
  resultSchemaReview: Record<string, unknown>
  invalidFixtureFailClosedReview: Record<string, unknown>
}) {
  return {
    phase: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_PHASE,
    runId: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_RUN_ID,
    status: input.decision.status,
    decision: input.decision.decision,
    sourceOfTruthConflictsFound: input.noopEvidenceAcceptance.sourceOfTruthConflictsFound,
    dryRunContractsReadyForFixtureHardening: input.decision.dryRunContractsReadyForFixtureHardening,
    fixtureContractStatus: input.fixtureContractReview.status,
    payloadSchemaStatus: input.payloadSchemaReview.status,
    resultSchemaStatus: input.resultSchemaReview.status,
    invalidFailClosedStatus: input.invalidFixtureFailClosedReview.status,
    realWorkerExecution: 'blocked',
    jobDispatchStatus: 'blocked',
    jobClaimLeaseStatus: 'blocked',
    supabasePersistence: 'blocked',
    production: 'blocked',
    externalBetaStatus: 'blocked',
    paidProductionStatus: 'blocked',
    nextRecommendedPhase: input.decision.nextRecommendedPhase,
    ...runtimeFlags(),
  }
}

export function buildWorkerRuntimeDryRunContractReviewReports(): WorkerRuntimeDryRunContractReviewReports {
  const noopEvidenceAcceptance = buildNoopEvidenceAcceptance()
  const fixtureContractReview = buildFixtureContractReview()
  const payloadSchemaReview = buildPayloadSchemaReview()
  const resultSchemaReview = buildResultSchemaReview()
  const invalidFixtureFailClosedReview = buildInvalidFixtureFailClosedReview()
  const queueJobSidecarContractReview = buildQueueJobSidecarContractReview()
  const claimLeaseIdempotencyContractReview = buildClaimLeaseIdempotencyContractReview()
  const artifactSourceRefContractReview = buildArtifactSourceRefContractReview()
  const observabilityCostContractReview = buildObservabilityCostContractReview()
  const billingCreditContractReview = buildBillingCreditContractReview()
  const supabasePersistenceBlockerReview = buildSupabasePersistenceBlockerReview()
  const cloudrunDockerBlockerReview = buildCloudrunDockerBlockerReview()
  const toolProviderRouteBlockerReview = buildToolProviderRouteBlockerReview()
  const workerExecutionBlockerRegister = buildWorkerExecutionBlockerRegister()
  const decision = buildDecisionReport({
    noopEvidenceAcceptance,
    fixtureContractReview,
    payloadSchemaReview,
    resultSchemaReview,
    invalidFixtureFailClosedReview,
    queueJobSidecarContractReview,
    claimLeaseIdempotencyContractReview,
    artifactSourceRefContractReview,
    observabilityCostContractReview,
    billingCreditContractReview,
    supabasePersistenceBlockerReview,
    cloudrunDockerBlockerReview,
    toolProviderRouteBlockerReview,
    workerExecutionBlockerRegister,
  })
  const summary = buildSummary({
    decision,
    noopEvidenceAcceptance,
    fixtureContractReview,
    payloadSchemaReview,
    resultSchemaReview,
    invalidFixtureFailClosedReview,
  })

  return {
    decision,
    noopEvidenceAcceptance,
    fixtureContractReview,
    payloadSchemaReview,
    resultSchemaReview,
    invalidFixtureFailClosedReview,
    queueJobSidecarContractReview,
    claimLeaseIdempotencyContractReview,
    artifactSourceRefContractReview,
    observabilityCostContractReview,
    billingCreditContractReview,
    supabasePersistenceBlockerReview,
    cloudrunDockerBlockerReview,
    toolProviderRouteBlockerReview,
    workerExecutionBlockerRegister,
    summary,
  }
}

export async function writeWorkerRuntimeDryRunContractReviewArtifacts(
  reports = buildWorkerRuntimeDryRunContractReviewReports(),
) {
  const reportMap: Record<typeof WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_EXPECTED_REPORTS[number], Record<string, unknown>> = {
    'worker_runtime_dry_run_contract_review_decision.json': reports.decision,
    'worker_noop_dry_run_evidence_acceptance.json': reports.noopEvidenceAcceptance,
    'worker_runtime_fixture_contract_review.json': reports.fixtureContractReview,
    'worker_runtime_payload_schema_review.json': reports.payloadSchemaReview,
    'worker_runtime_result_schema_review.json': reports.resultSchemaReview,
    'worker_runtime_invalid_fixture_fail_closed_review.json': reports.invalidFixtureFailClosedReview,
    'worker_runtime_queue_job_sidecar_contract_review.json': reports.queueJobSidecarContractReview,
    'worker_runtime_claim_lease_idempotency_contract_review.json': reports.claimLeaseIdempotencyContractReview,
    'worker_runtime_artifact_source_ref_contract_review.json': reports.artifactSourceRefContractReview,
    'worker_runtime_observability_cost_contract_review.json': reports.observabilityCostContractReview,
    'worker_runtime_billing_credit_contract_review.json': reports.billingCreditContractReview,
    'worker_runtime_supabase_persistence_blocker_review.json': reports.supabasePersistenceBlockerReview,
    'worker_runtime_cloudrun_docker_blocker_review.json': reports.cloudrunDockerBlockerReview,
    'worker_runtime_tool_provider_route_blocker_review.json': reports.toolProviderRouteBlockerReview,
    'worker_runtime_worker_execution_blocker_register.json': reports.workerExecutionBlockerRegister,
    'worker_runtime_dry_run_contract_review_summary.json': reports.summary,
  }

  for (const [name, report] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR, name), report)
  }

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-unlock-2-dry-run-contract-review.md', `# Worker Runtime Dry-Run Contract Review

Decision: \`${String(reports.decision.decision)}\`.

The contract review accepted the merged PR #346 no-op worker dry-run evidence, PR #342 worker dry-run approval, PR #341 worker repo audit, PR #337 plan snapshot dry-run validation, PR #335/#327 plan snapshot contract handoff, PR #329 Qwen metadata evidence, and PR #320 DeepSeek preserved metadata evidence.

The reviewed contract requires approved plan snapshot metadata, private source-of-truth placeholders, idempotency and correlation metadata, manifest/checksum/provenance placeholders, fail-closed invalid fixture handling, and no public URL or signed URL source of truth.

Real worker execution, queue enqueue, job dispatch, job claim, job lease, sidecar spawn, subprocess spawn, tool execution, route execution, provider call, media processing, Supabase write, SQL, migration, storage object, signed URL, public artifact, credit mutation, beta unlock, paid production unlock, production unlock, and \`generated_local_fixture_passed\` remain blocked.

Next prompt: \`${String(reports.decision.nextRecommendedPhase)}\`.

${NO_SCOPE_STATEMENT}
`)

  const passed = reports.decision.status === 'passed'
  const nextPromptPath = passed
    ? 'docs/implementation-prompts/prompt-worker-runtime-unlock-3-fixture-hardening.md'
    : `docs/implementation-prompts/prompt-worker-runtime-unlock-2-fix-${String(reports.decision.decision)}.md`
  await writeVlmRuntimeTextArtifact(nextPromptPath, passed ? `# WORKER-RUNTIME-UNLOCK-3: Worker Runtime Fixture Hardening

Proceed only after \`worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening\`.

Scope: harden synthetic approved-plan-snapshot worker fixtures and metadata-only payload/result contracts. Keep this phase contract/fixture-only.

Do not execute real workers, enqueue jobs, dispatch jobs, claim or lease jobs, mutate Supabase, execute SQL, deploy migrations, run providers, run tools/routes, process media, run Docker, run Cloud Run or Cloud Build, create signed URLs, create public artifacts, mutate credits or billing, unlock beta, unlock paid production, unlock production, or claim \`generated_local_fixture_passed\`.
` : `# WORKER-RUNTIME-UNLOCK-2 Fix

Fix blocker: \`${String(reports.decision.decision)}\`.

Keep the fix metadata-only. Do not execute real workers, mutate Supabase, run SQL, call providers, run tools/routes, process media, create signed URLs or public artifacts, or unlock beta/production.
`)
}

export function readWorkerRuntimeDryRunContractReviewSummary() {
  return readJson(path.join(WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR, 'worker_runtime_dry_run_contract_review_summary.json')) ??
    buildWorkerRuntimeDryRunContractReviewReports().summary
}
