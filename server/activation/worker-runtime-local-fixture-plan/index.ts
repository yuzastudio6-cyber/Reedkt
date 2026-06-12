import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR,
  WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR,
  buildWorkerRuntimeFixtureHardeningArtifacts,
  buildWorkerRuntimeFixtureHardeningReports,
} from '../worker-runtime-fixture-hardening'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  WorkerRuntimeLocalFixturePlanDecision,
  WorkerRuntimeLocalFixturePlanReports,
} from './worker-runtime-local-fixture-plan-types'

export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE = 'worker-runtime-local-fixture-plan'
export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID = 'worker-runtime-local-fixture-plan-20260612'
export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_BRANCH =
  'codex/rp-worker-runtime-unlock-4-local-fixture-plan'
export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_BASE_BRANCH =
  'codex/rp-model-orchestration-plan-snapshot-dry-run-validation'
export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_BASE_SHA =
  'e762d297dc9ea236b8c2c85585ff2fd781ea3e77'
export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_REPORT_DIR =
  'docs/activation-worker-runtime-unlock-4-local-fixture-plan-reports'

export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_EXPECTED_REPORTS = [
  'worker_runtime_local_fixture_plan_decision.json',
  'worker_runtime_local_fixture_source_of_truth_audit.json',
  'worker_runtime_local_fixture_scope.json',
  'worker_runtime_local_fixture_input_matrix.json',
  'worker_runtime_local_fixture_validation_matrix.json',
  'worker_runtime_local_fixture_execution_blocker_plan.json',
  'worker_runtime_local_fixture_valid_fixture_plan.json',
  'worker_runtime_local_fixture_invalid_fixture_plan.json',
  'worker_runtime_local_fixture_manifest_checksum_plan.json',
  'worker_runtime_local_fixture_payload_result_plan.json',
  'worker_runtime_local_fixture_queue_job_sidecar_plan.json',
  'worker_runtime_local_fixture_claim_lease_idempotency_plan.json',
  'worker_runtime_local_fixture_retry_cleanup_plan.json',
  'worker_runtime_local_fixture_artifact_source_ref_plan.json',
  'worker_runtime_local_fixture_observability_cost_plan.json',
  'worker_runtime_local_fixture_billing_credit_plan.json',
  'worker_runtime_local_fixture_supabase_owner_handoff_plan.json',
  'worker_runtime_local_fixture_cloudrun_docker_owner_handoff_plan.json',
  'worker_runtime_local_fixture_tool_provider_route_owner_handoff_plan.json',
  'worker_runtime_local_fixture_no_execution_policy.json',
  'worker_runtime_local_fixture_summary.json',
] as const

export const WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_ALLOWED_DECISIONS = [
  'worker_runtime_local_fixture_plan_ready',
  'worker_runtime_local_fixture_plan_ready_with_warnings',
  'worker_runtime_local_fixture_plan_blocked_missing_hardened_fixtures',
  'worker_runtime_local_fixture_plan_blocked_missing_manifest_checksums',
  'worker_runtime_local_fixture_plan_blocked_source_ref_policy_gap',
  'worker_runtime_local_fixture_plan_blocked_supabase_owner_handoff',
  'worker_runtime_local_fixture_plan_blocked_source_of_truth_conflict',
] as const

const NO_SCOPE_STATEMENT =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, real worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

const RUNTIME_FALSE_FLAGS = {
  workerExecution: false,
  workerRuntimeExecutionReady: false,
  workerExecutionReady: false,
  runtimeExecutionAllowed: false,
  workerExecutionAllowed: false,
  localFixturesExecuted: false,
  localFixtureValidationExecuted: false,
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
  toolExecutionAllowed: false,
  routeExecution: false,
  routeExecutionAllowed: false,
  providerCalls: false,
  providerExecutionAllowed: false,
  dockerRun: false,
  cloudRunJob: false,
  cloudBuild: false,
  mediaProcessing: false,
  rawPromptExecution: false,
  rawPromptForwardingAllowed: false,
  rawProviderOutputExecution: false,
  supabaseWrites: false,
  sqlExecuted: false,
  migrationDeployed: false,
  publicArtifacts: false,
  publicArtifactsAllowed: false,
  signedUrls: false,
  signedUrlsAsSourceOfTruthAllowed: false,
  productionAffected: false,
  productionMutationAllowed: false,
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
  generatedAssets: false,
  demucsRuntime: false,
  trackARuntime: false,
  trackBMediaProcessing: false,
}

const BLOCKED_SCOPES = [
  'real_worker_execution',
  'worker_runtime_execution_ready',
  'local_fixture_execution',
  'generated_local_fixture_passed_claim',
  'job_dispatch',
  'queue_enqueue',
  'job_claim',
  'job_lease',
  'claim_mutation',
  'lease_mutation',
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
  'storage_writes',
  'public_artifacts',
  'signed_urls',
  'generated_assets',
  'credit_spend_or_reservation',
  'stripe_or_billing_mutation',
  'internal_beta',
  'external_beta',
  'paid_production',
  'production',
] as const

const REQUIRED_SOURCE_PATHS = [
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-reports/worker_runtime_fixture_hardening_decision.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-reports/worker_runtime_fixture_hardening_summary.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_hardened_valid_fixtures.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_hardened_invalid_fixtures.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_fixture_manifest.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_fixture_checksums.json',
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures/worker_runtime_fixture_schema_versions.json',
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_dry_run_contract_review_decision.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_execution_decision.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json',
  'docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/provider_dry_run_evidence_reconciliation.json',
  'docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_repaired_provider_dry_run_report.json',
  'docs/activation-product-internal-testing-session-0-reports/session_0_decision.json',
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

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

function hasUnsafeFlag(report: Record<string, unknown>): boolean {
  return Object.keys(RUNTIME_FALSE_FLAGS).some((key) => report[key] === true)
}

function sourceRefsSafe(fixture: Record<string, unknown>) {
  const refs = stringArray(fixture.sourceOfTruthRefs)
  return refs.length === 4 &&
    refs.some((ref) => ref.startsWith('supabase_row_ref:synthetic')) &&
    refs.some((ref) => ref.startsWith('private_gcs_path_ref:synthetic')) &&
    refs.some((ref) => ref.startsWith('manifest_ref:synthetic')) &&
    refs.some((ref) => ref.startsWith('checksum_ref:synthetic'))
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

function allFixtures() {
  const artifacts = buildWorkerRuntimeFixtureHardeningArtifacts()
  const validFixtures = recordArray(artifacts.validFixtures.fixtures)
  const invalidFixtures = recordArray(artifacts.invalidFixtures.fixtures)
  return {
    artifacts,
    validFixtures,
    invalidFixtures,
    fixtures: [...validFixtures, ...invalidFixtures],
  }
}

function buildSourceAudit() {
  const fixtureHardeningReports = buildWorkerRuntimeFixtureHardeningReports()
  const fixtureDecision = asRecord(fixtureHardeningReports.decision)
  const contractDecision = readJson('docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_dry_run_contract_review_decision.json')
  const noopDecision = readJson('docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_execution_decision.json')
  const approvalDecision = readJson('docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json')
  const repoAuditDecision = readJson('docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json')
  const planDryRunDecision = readJson('docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json')
  const planContractDecision = readJson('docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json')
  const providerReconciliation = readJson('docs/activation-model-orchestration-plan-snapshot-contract-reports/provider_dry_run_evidence_reconciliation.json')
  const qwenDryRun = readJson('docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_repaired_provider_dry_run_report.json')
  const internalTestingDecision = readJson('docs/activation-product-internal-testing-session-0-reports/session_0_decision.json')
  const trackBReadiness = readJson('docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json')
  const contractDecisionText = readText('docs/model-orchestration-plan-snapshot-contract-decision.md')

  const deepseekAccepted = providerReconciliation?.finalReconciledDeepSeekStatus === 'passed_remote_pr320' ||
    contractDecisionText.includes('DeepSeek: `passed_remote_pr320`')
  const evidence = [
    {
      pr: 353,
      name: 'worker runtime fixture hardening',
      expectedDecision: 'worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan',
      actualDecision: fixtureDecision.decision,
      accepted: fixtureDecision.decision === 'worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan',
    },
    {
      pr: 351,
      name: 'worker runtime dry-run contract review',
      expectedDecision: 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening',
      actualDecision: contractDecision?.decision,
      accepted: contractDecision?.decision === 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening',
    },
    {
      pr: 346,
      name: 'worker no-op dry-run execution',
      expectedDecision: 'worker_noop_dry_run_passed_ready_for_contract_review',
      actualDecision: noopDecision?.decision,
      accepted: noopDecision?.decision === 'worker_noop_dry_run_passed_ready_for_contract_review',
    },
    {
      pr: 342,
      name: 'worker dry-run approval packet',
      expectedDecision: 'approved_for_future_worker_noop_dry_run_execution',
      actualDecision: approvalDecision?.decision,
      accepted: approvalDecision?.decision === 'approved_for_future_worker_noop_dry_run_execution',
    },
    {
      pr: 341,
      name: 'worker runtime repo audit after plan snapshot dry-run',
      expectedDecision: 'repo_audit_passed_ready_for_worker_dry_run_approval',
      actualDecision: repoAuditDecision?.decision,
      accepted: repoAuditDecision?.decision === 'repo_audit_passed_ready_for_worker_dry_run_approval',
    },
    {
      pr: 337,
      name: 'plan snapshot dry-run validation',
      expectedDecision: 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
      actualDecision: planDryRunDecision?.decision,
      accepted: planDryRunDecision?.decision === 'plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit',
    },
    {
      pr: 335,
      name: 'plan snapshot contract readiness/fix handoff',
      expectedDecision: 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
      actualDecision: planContractDecision?.decision,
      accepted: planContractDecision?.decision === 'plan_snapshot_contract_passed_ready_for_dry_run_validation',
    },
    {
      pr: 329,
      name: 'Qwen DashScope repaired dry-run evidence',
      expectedDecision: '4_qwen_calls_passed_as_metadata_evidence',
      actualStatus: qwenDryRun?.status,
      providerCallsPassed: qwenDryRun?.providerCallsPassed,
      accepted: qwenDryRun?.status === 'passed' && qwenDryRun?.providerCallsPassed === 4,
      copiedRawProviderOutput: false,
    },
    {
      pr: 320,
      name: 'DeepSeek provider dry-run evidence',
      expectedDecision: '3_deepseek_calls_preserved_as_metadata_evidence',
      actualStatus: providerReconciliation?.finalReconciledDeepSeekStatus ?? (deepseekAccepted ? 'passed_remote_pr320' : undefined),
      providerCallsPassed: deepseekAccepted ? 3 : 0,
      accepted: deepseekAccepted,
      copiedRawProviderOutput: false,
    },
    {
      pr: 315,
      name: 'Supabase registry restoration lane',
      expectedDecision: 'checked_where_present_not_required_for_worker_fixture_plan',
      localEvidencePresent: existsSync('docs/activation-supabase-milestone-registry-schema-reports') ||
        existsSync('docs/supabase-activation-milestone-registry-staging-deployment.md'),
      accepted: true,
    },
    {
      pr: 319,
      name: 'SOUND/Supabase local harness lane',
      expectedDecision: 'checked_where_present_not_continued_in_worker_fixture_plan',
      localEvidencePresent: existsSync('docs/supabase-sound-local-harness-validation-4-report.md') ||
        existsSync('docs/supabase-sound-local-harness-ports-fix-report.md'),
      accepted: true,
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
      name: 'Supabase Track B clean staging sync metadata',
      expectedDecision: 'track_b_clean_staging_metadata_backfill_verified',
      actualStatus: trackBReadiness?.status,
      accepted: trackBReadiness?.status === 'passed',
    },
  ]
  const sourcePaths = REQUIRED_SOURCE_PATHS.map(pathStatus)
  const status = evidence.every((item) => item.accepted) && sourcePaths.every((item) => item.present) ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status,
    owner: 'WORKER_RUNTIME_JOBS',
    branch: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_BRANCH,
    baseBranch: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_BASE_BRANCH,
    baseSha: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_BASE_SHA,
    sourcePr353Merged: true,
    sourceOfTruthConflictsFound: status !== 'passed',
    sourcePaths,
    evidence,
    sourceHardenedFixtureReportDir: WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR,
    sourceHardenedFixtureDir: WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR,
    rawPromptTextReadAsSource: false,
    rawProviderOutputCopied: false,
    secretPayloadCopied: false,
    ...runtimeFlags(),
  }
}

function buildScope() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    mode: 'metadata_only_local_fixture_validation_plan',
    allowedInThisPhase: [
      'read_hardened_fixture_metadata',
      'map_fixture_inputs_to_future_validation_steps',
      'write_sanitized_reports_and_docs',
      'prepare_next_no_real_execution_prompt',
    ],
    forbiddenInThisPhase: BLOCKED_SCOPES,
    noScopeStatement: NO_SCOPE_STATEMENT,
    ...runtimeFlags(),
  }
}

function buildInputMatrix() {
  const { artifacts, validFixtures, invalidFixtures, fixtures } = allFixtures()
  const manifest = asRecord(artifacts.fixtureManifest)
  const checksums = asRecord(artifacts.fixtureChecksums)
  const schemaVersions = asRecord(artifacts.fixtureSchemaVersions)
  const checksumRows = recordArray(checksums.fixtureChecksums)
  const sourceRefCount = fixtures.flatMap((fixture) => stringArray(fixture.sourceOfTruthRefs)).length
  const unsafeFixtureIds = fixtures
    .filter((fixture) =>
      fixture.schemaVersion !== 'worker_runtime_hardened_fixture_v1' ||
      fixture.approvedPlanSnapshotSchema !== 'approved_plan_snapshot_v1' ||
      fixture.artifactScope !== 'private_placeholder_only' ||
      fixture.syntheticOnly !== true ||
      fixture.realUserData !== false ||
      fixture.realMedia !== false ||
      fixture.privatePayloadCommitted !== false ||
      !sourceRefsSafe(fixture) ||
      !fixtureRuntimeFlagsSafe(fixture))
    .map((fixture) => fixture.caseId)

  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: validFixtures.length === 4 &&
      invalidFixtures.length === 8 &&
      fixtures.length === 12 &&
      manifest.status === 'passed' &&
      checksums.status === 'passed' &&
      schemaVersions.status === 'passed' &&
      checksumRows.length === 12 &&
      unsafeFixtureIds.length === 0 ? 'passed' : 'blocked',
    sourceFixtureDir: WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR,
    fixtureCount: fixtures.length,
    validFixtureCount: validFixtures.length,
    invalidFailClosedFixtureCount: invalidFixtures.length,
    validFixtureIds: validFixtures.map((fixture) => fixture.caseId),
    invalidFixtureIds: invalidFixtures.map((fixture) => fixture.caseId),
    invalidReasons: invalidFixtures.map((fixture) => fixture.intentionallyInvalidReason),
    sourceRefCount,
    checksumCount: checksumRows.length,
    checksumInputScope: checksums.checksumInputScope,
    fixtureSchemaVersion: schemaVersions.fixtureSchemaVersion,
    approvedPlanSnapshotSchema: schemaVersions.approvedPlanSnapshotSchema,
    payloadContractSchemaVersion: schemaVersions.payloadContractSchemaVersion,
    resultContractSchemaVersion: schemaVersions.resultContractSchemaVersion,
    unsafeFixtureIds,
    ...runtimeFlags(),
  }
}

function buildValidationMatrix() {
  const inputMatrix = buildInputMatrix()
  const validationRows = [
    ['source_of_truth_chain', 'verify merged worker/model/Supabase metadata source chain', 'metadata_only'],
    ['hardened_fixture_presence', 'verify four valid and eight invalid hardened fixtures are present', 'metadata_only'],
    ['approved_snapshot_schema', 'verify approved_plan_snapshot_v1 and worker_runtime_hardened_fixture_v1 contracts', 'metadata_only'],
    ['manifest_checksum_presence', 'verify manifest and SHA-256 rows are present', 'metadata_only'],
    ['placeholder_source_refs', 'verify synthetic Supabase row/private GCS/manifest/checksum refs only', 'metadata_only'],
    ['valid_fixture_acceptance_plan', 'plan accepted metadata-only outcome checks for valid fixtures', 'metadata_only'],
    ['invalid_fixture_fail_closed_plan', 'plan fail-closed checks for invalid fixtures', 'metadata_only'],
    ['payload_result_contracts', 'verify payload/result contract fields exist', 'metadata_only'],
    ['no_runtime_flags', 'verify all runtime flags remain false', 'metadata_only'],
    ['redaction_and_secret_scan', 'verify reports contain no secret payloads or raw provider output', 'metadata_only'],
  ].map(([validationId, purpose, mode]) => ({
    validationId,
    purpose,
    mode,
    plannedForUnlock5: true,
    executesFixturesInUnlock4: false,
    status: 'planned',
  }))

  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: inputMatrix.status === 'passed' ? 'passed' : 'blocked',
    validationMatrixSchemaVersion: 'worker_runtime_local_fixture_validation_matrix_v1',
    validationRows,
    unlock4ExecutesFixtures: false,
    unlock5MayValidateLocallyMetadataOnly: true,
    ...runtimeFlags(),
  }
}

function buildExecutionBlockerPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    blockerPlan: 'all_real_execution_paths_remain_blocked_for_unlock4',
    blockedScopes: BLOCKED_SCOPES,
    localFixtureValidationPlannedOnly: true,
    ...runtimeFlags(),
  }
}

function buildValidFixturePlan() {
  const { validFixtures } = allFixtures()
  const unsafeFixtureIds = validFixtures
    .filter((fixture) =>
      fixture.expectedDecision !== 'accepted_for_future_local_fixture_plan' ||
      !sourceRefsSafe(fixture) ||
      !fixtureRuntimeFlagsSafe(fixture))
    .map((fixture) => fixture.caseId)
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: validFixtures.length === 4 && unsafeFixtureIds.length === 0 ? 'passed' : 'blocked',
    fixturePlanKind: 'valid_hardened_fixture_local_validation_plan',
    validFixtureCount: validFixtures.length,
    plannedValidFixtureChecks: validFixtures.map((fixture) => ({
      caseId: fixture.caseId,
      expectedDecision: 'accepted_metadata_only',
      plannedAssertions: [
        'approved_plan_snapshot_ref_present',
        'approved_plan_snapshot_hash_present',
        'private_placeholder_refs_only',
        'payload_contract_present',
        'result_contract_present',
        'runtime_flags_false',
      ],
      localFixtureExecutedInUnlock4: false,
    })),
    unsafeFixtureIds,
    ...runtimeFlags(),
  }
}

function buildInvalidFixturePlan() {
  const { invalidFixtures } = allFixtures()
  const requiredReasons = [
    'raw_prompt_worker_input',
    'public_artifact_output_request',
    'broad_media_processing_request',
    'production_write_request',
    'signed_url_source_of_truth',
    'unapproved_artifact_prefix',
    'service_role_key_like_field_name',
    'direct_tool_route_execution_field',
  ]
  const observedReasons = invalidFixtures.map((fixture) => String(fixture.intentionallyInvalidReason))
  const unsafeFixtureIds = invalidFixtures
    .filter((fixture) =>
      fixture.expectedDecision !== 'fail_closed' ||
      !stringArray(fixture.blockedActions).length ||
      !sourceRefsSafe(fixture) ||
      !fixtureRuntimeFlagsSafe(fixture))
    .map((fixture) => fixture.caseId)
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: invalidFixtures.length === 8 &&
      requiredReasons.every((reason) => observedReasons.includes(reason)) &&
      unsafeFixtureIds.length === 0 ? 'passed' : 'blocked',
    fixturePlanKind: 'invalid_fail_closed_hardened_fixture_local_validation_plan',
    invalidFailClosedFixtureCount: invalidFixtures.length,
    requiredReasons,
    observedReasons,
    plannedInvalidFixtureChecks: invalidFixtures.map((fixture) => ({
      caseId: fixture.caseId,
      intentionallyInvalidReason: fixture.intentionallyInvalidReason,
      expectedDecision: 'fail_closed',
      blockedActions: stringArray(fixture.blockedActions),
      localFixtureExecutedInUnlock4: false,
    })),
    unsafeFixtureIds,
    ...runtimeFlags(),
  }
}

function buildManifestChecksumPlan() {
  const { artifacts } = allFixtures()
  const checksums = asRecord(artifacts.fixtureChecksums)
  const manifest = asRecord(artifacts.fixtureManifest)
  const checksumRows = recordArray(checksums.fixtureChecksums)
  const schemaVersions = asRecord(artifacts.fixtureSchemaVersions)
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: checksums.status === 'passed' &&
      manifest.status === 'passed' &&
      schemaVersions.status === 'passed' &&
      checksums.checksumInputScope === 'canonical_fixture_json_content_only' &&
      checksumRows.length === 12 ? 'passed' : 'blocked',
    manifestSchemaVersion: manifest.manifestSchemaVersion,
    fixtureCount: manifest.fixtureCount,
    checksumAlgorithm: checksums.checksumAlgorithm,
    checksumInputScope: checksums.checksumInputScope,
    canonicalization: checksums.canonicalization,
    checksumCount: checksumRows.length,
    validFixtureSetSha256: checksums.validFixtureSetSha256,
    invalidFixtureSetSha256: checksums.invalidFixtureSetSha256,
    unlock5PlannedChecksumAction: 'recompute_canonical_json_sha256_over_committed_docs_only_fixture_json',
    realMediaChecksummed: false,
    privatePayloadChecksummed: false,
    ...runtimeFlags(),
  }
}

function buildPayloadResultPlan() {
  const { fixtures } = allFixtures()
  const requiredPayloadFields = [
    'workstreamOwner',
    'workerType',
    'jobIntent',
    'idempotencyKey',
    'correlationId',
    'approvedPlanSnapshotRef',
    'approvedPlanSnapshotHash',
    'artifactScope',
    'privateArtifactManifestRef',
    'inputManifestRefs',
    'outputManifestExpected',
    'checksumRequired',
    'provenanceRequired',
    'sourceOfTruthRefs',
    'blockedActions',
    'handoffOwner',
    'resultSchemaVersion',
  ]
  const requiredResultFields = [
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
    'blockedOutputs',
  ]
  const missingPayloadFieldFixtureIds = fixtures
    .filter((fixture) => requiredPayloadFields.some((field) => !(field in asRecord(fixture.payloadContract))))
    .map((fixture) => fixture.caseId)
  const missingResultFieldFixtureIds = fixtures
    .filter((fixture) => requiredResultFields.some((field) => !(field in asRecord(fixture.resultContract))))
    .map((fixture) => fixture.caseId)

  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: fixtures.length === 12 && missingPayloadFieldFixtureIds.length === 0 && missingResultFieldFixtureIds.length === 0 ? 'passed' : 'blocked',
    payloadContractSchemaVersion: 'worker_runtime_metadata_payload_contract_v1',
    resultContractSchemaVersion: 'worker_runtime_metadata_result_contract_v1',
    requiredPayloadFields,
    requiredResultFields,
    reviewedFixtureCount: fixtures.length,
    missingPayloadFieldFixtureIds,
    missingResultFieldFixtureIds,
    executableWorkerPayloadAllowed: false,
    rawPromptFieldAllowed: false,
    rawProviderOutputFieldAllowed: false,
    publicUrlFieldAllowed: false,
    ...runtimeFlags(),
  }
}

function buildQueueJobSidecarPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    futureUnlock5AllowedMode: 'metadata_only_local_fixture_validation',
    queueEnqueueAllowed: false,
    jobDispatchAllowed: false,
    jobClaimAllowed: false,
    jobLeaseAllowed: false,
    sidecarSpawnAllowed: false,
    subprocessSpawnAllowed: false,
    ...runtimeFlags(),
  }
}

function buildClaimLeaseIdempotencyPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    idempotencyKeyValidationPlanned: true,
    correlationIdValidationPlanned: true,
    approvedPlanSnapshotRefValidationPlanned: true,
    claimMutationAllowed: false,
    leaseMutationAllowed: false,
    idempotencyPersistenceAllowed: false,
    ...runtimeFlags(),
  }
}

function buildRetryCleanupPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    retryMetadataValidationPlanned: true,
    cleanupMetadataValidationPlanned: true,
    rollbackMetadataValidationPlanned: true,
    retryScheduled: false,
    cleanupExecuted: false,
    rollbackExecuted: false,
    ...runtimeFlags(),
  }
}

function buildArtifactSourceRefPlan() {
  const { fixtures } = allFixtures()
  const refs = fixtures.flatMap((fixture) => stringArray(fixture.sourceOfTruthRefs))
  const safeRefs = refs.every((ref) =>
    ref.startsWith('supabase_row_ref:synthetic') ||
    ref.startsWith('private_gcs_path_ref:synthetic') ||
    ref.startsWith('manifest_ref:synthetic') ||
    ref.startsWith('checksum_ref:synthetic'))
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: refs.length === 48 && safeRefs ? 'passed' : 'blocked',
    fixtureCount: fixtures.length,
    sourceRefCount: refs.length,
    allowedSourceRefPrefixes: [
      'supabase_row_ref:synthetic',
      'private_gcs_path_ref:synthetic',
      'manifest_ref:synthetic',
      'checksum_ref:synthetic',
    ],
    plannedSourceRefAssertions: [
      'reject_public_artifact_url',
      'reject_signed_url_source_of_truth',
      'reject_real_gcs_path',
      'reject_arbitrary_local_path',
      'reject_private_payload_commit',
    ],
    arbitraryLocalPathsAllowed: false,
    realGcsPathsAllowed: false,
    publicArtifactUrlsAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    privatePayloadsCommitted: false,
    ...runtimeFlags(),
  }
}

function buildObservabilityCostPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    auditMetadataOnly: true,
    costMetadataOnly: true,
    auditEventsPersisted: false,
    observabilityBackendWrites: false,
    cloudCostUsd: 0,
    providerCostUsd: 0,
    workerRuntimeCostUsd: 0,
    ...runtimeFlags(),
  }
}

function buildBillingCreditPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    billingPlaceholderMetadataOnly: true,
    creditReservationCreated: false,
    creditSpendCreated: false,
    creditRefundCreated: false,
    stripeCheckoutCreated: false,
    stripeWebhookProcessed: false,
    billingMutation: false,
    ...runtimeFlags(),
  }
}

function buildSupabaseOwnerHandoffPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    handoffKind: 'future_metadata_only_local_fixture_validation_may_read_synthetic_refs_but_must_not_mutate_supabase',
    supabaseUpdateRequired: 'no',
    supabaseEnvironmentTouched: 'no',
    rowsInserted: false,
    rowsUpdated: false,
    rowsDeleted: false,
    jobTablesWritten: false,
    approvedPlanSnapshotsWritten: false,
    signedUrlsCreated: false,
    futureSupabaseOwnerApprovalRequiredBeforePersistence: true,
    ...runtimeFlags(),
  }
}

function buildCloudrunDockerOwnerHandoffPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    owner: 'WORKER_RUNTIME_JOBS',
    dockerExecutionAllowed: false,
    cloudRunExecutionAllowed: false,
    cloudBuildExecutionAllowed: false,
    sidecarExecutionAllowed: false,
    subprocessExecutionAllowed: false,
    futureRuntimeOwnerApprovalRequiredBeforeRuntime: true,
    ...runtimeFlags(),
  }
}

function buildToolProviderRouteOwnerHandoffPlan() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    futureOwnerApprovalsRequired: [
      'TOOL_ROUTE_EXECUTION',
      'PROVIDER_GATEWAY_MODELS',
      'MODEL_ORCHESTRATION_QWEN_DEEPSEEK',
      'TRACK_A_RENDER_EXPORT',
      'TRACK_B_MEDIA_PROCESSING',
    ],
    qwenEvidenceAcceptedAsHistoricalMetadata: true,
    deepseekEvidenceAcceptedAsHistoricalMetadata: true,
    mediaProcessingAllowed: false,
    ...runtimeFlags(),
  }
}

function buildNoExecutionPolicy() {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: 'passed',
    policy: 'metadata_only_local_fixture_validation_plan_no_execution',
    noScopeStatement: NO_SCOPE_STATEMENT,
    blockedScopes: BLOCKED_SCOPES,
    realWorkerExecutionReady: false,
    productionReady: false,
    internalBetaReady: false,
    externalBetaReady: false,
    paidProductionReady: false,
    ...runtimeFlags(),
  }
}

function selectDecision(input: Omit<WorkerRuntimeLocalFixturePlanReports, 'decision' | 'summary'>): WorkerRuntimeLocalFixturePlanDecision {
  if (Object.values(input).some(hasUnsafeFlag)) return 'worker_runtime_local_fixture_plan_blocked_source_of_truth_conflict'
  if (input.sourceAudit.status !== 'passed') return 'worker_runtime_local_fixture_plan_blocked_source_of_truth_conflict'
  if (input.inputMatrix.status !== 'passed' || input.validFixturePlan.status !== 'passed' || input.invalidFixturePlan.status !== 'passed') {
    return 'worker_runtime_local_fixture_plan_blocked_missing_hardened_fixtures'
  }
  if (input.manifestChecksumPlan.status !== 'passed') return 'worker_runtime_local_fixture_plan_blocked_missing_manifest_checksums'
  if (input.artifactSourceRefPlan.status !== 'passed') return 'worker_runtime_local_fixture_plan_blocked_source_ref_policy_gap'
  if (input.supabaseOwnerHandoffPlan.status !== 'passed') return 'worker_runtime_local_fixture_plan_blocked_supabase_owner_handoff'
  if (Object.values(input).some((report) => report.status !== 'passed')) {
    return 'worker_runtime_local_fixture_plan_blocked_source_of_truth_conflict'
  }
  return 'worker_runtime_local_fixture_plan_ready'
}

function buildDecisionReport(input: Omit<WorkerRuntimeLocalFixturePlanReports, 'decision' | 'summary'>) {
  const decision = selectDecision(input)
  const passed = decision === 'worker_runtime_local_fixture_plan_ready' ||
    decision === 'worker_runtime_local_fixture_plan_ready_with_warnings'
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    decision,
    activeBlockers: passed ? [] : [decision],
    localFixturePlanReady: passed,
    readyForLocalFixtureValidation: passed,
    realWorkerExecutionReady: false,
    workerDispatchReady: false,
    jobClaimReady: false,
    jobLeaseReady: false,
    supabasePersistenceReady: false,
    productionBetaPaidProductionClaimed: false,
    nextRecommendedPhase: passed
      ? 'WORKER-RUNTIME-UNLOCK-5: worker runtime local fixture validation, no real execution'
      : `WORKER-RUNTIME-UNLOCK-4-FIX-${decision}: fix worker runtime local fixture plan blocker, no real execution`,
    noScopeStatement: NO_SCOPE_STATEMENT,
    ...runtimeFlags(),
  }
}

function buildSummary(input: {
  decision: Record<string, unknown>
  sourceAudit: Record<string, unknown>
  inputMatrix: Record<string, unknown>
  validationMatrix: Record<string, unknown>
  manifestChecksumPlan: Record<string, unknown>
}) {
  return {
    phase: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_PHASE,
    runId: WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_RUN_ID,
    status: input.decision.status,
    decision: input.decision.decision,
    sourceOfTruthConflictsFound: input.sourceAudit.sourceOfTruthConflictsFound,
    localFixturePlanReady: input.decision.localFixturePlanReady,
    readyForLocalFixtureValidation: input.decision.readyForLocalFixtureValidation,
    fixtureCount: input.inputMatrix.fixtureCount,
    validFixtureCount: input.inputMatrix.validFixtureCount,
    invalidFailClosedFixtureCount: input.inputMatrix.invalidFailClosedFixtureCount,
    checksumInputScope: input.manifestChecksumPlan.checksumInputScope,
    validationRowsPlanned: recordArray(input.validationMatrix.validationRows).length,
    realWorkerExecution: 'blocked',
    jobDispatchStatus: 'blocked',
    jobClaimLeaseStatus: 'blocked',
    supabasePersistence: 'blocked',
    production: 'blocked',
    internalBetaStatus: 'blocked',
    externalBetaStatus: 'blocked',
    paidProductionStatus: 'blocked',
    nextRecommendedPhase: input.decision.nextRecommendedPhase,
    ...runtimeFlags(),
  }
}

export function buildWorkerRuntimeLocalFixturePlanReports(): WorkerRuntimeLocalFixturePlanReports {
  const sourceAudit = buildSourceAudit()
  const scope = buildScope()
  const inputMatrix = buildInputMatrix()
  const validationMatrix = buildValidationMatrix()
  const executionBlockerPlan = buildExecutionBlockerPlan()
  const validFixturePlan = buildValidFixturePlan()
  const invalidFixturePlan = buildInvalidFixturePlan()
  const manifestChecksumPlan = buildManifestChecksumPlan()
  const payloadResultPlan = buildPayloadResultPlan()
  const queueJobSidecarPlan = buildQueueJobSidecarPlan()
  const claimLeaseIdempotencyPlan = buildClaimLeaseIdempotencyPlan()
  const retryCleanupPlan = buildRetryCleanupPlan()
  const artifactSourceRefPlan = buildArtifactSourceRefPlan()
  const observabilityCostPlan = buildObservabilityCostPlan()
  const billingCreditPlan = buildBillingCreditPlan()
  const supabaseOwnerHandoffPlan = buildSupabaseOwnerHandoffPlan()
  const cloudrunDockerOwnerHandoffPlan = buildCloudrunDockerOwnerHandoffPlan()
  const toolProviderRouteOwnerHandoffPlan = buildToolProviderRouteOwnerHandoffPlan()
  const noExecutionPolicy = buildNoExecutionPolicy()
  const decision = buildDecisionReport({
    sourceAudit,
    scope,
    inputMatrix,
    validationMatrix,
    executionBlockerPlan,
    validFixturePlan,
    invalidFixturePlan,
    manifestChecksumPlan,
    payloadResultPlan,
    queueJobSidecarPlan,
    claimLeaseIdempotencyPlan,
    retryCleanupPlan,
    artifactSourceRefPlan,
    observabilityCostPlan,
    billingCreditPlan,
    supabaseOwnerHandoffPlan,
    cloudrunDockerOwnerHandoffPlan,
    toolProviderRouteOwnerHandoffPlan,
    noExecutionPolicy,
  })
  const summary = buildSummary({
    decision,
    sourceAudit,
    inputMatrix,
    validationMatrix,
    manifestChecksumPlan,
  })

  return {
    decision,
    sourceAudit,
    scope,
    inputMatrix,
    validationMatrix,
    executionBlockerPlan,
    validFixturePlan,
    invalidFixturePlan,
    manifestChecksumPlan,
    payloadResultPlan,
    queueJobSidecarPlan,
    claimLeaseIdempotencyPlan,
    retryCleanupPlan,
    artifactSourceRefPlan,
    observabilityCostPlan,
    billingCreditPlan,
    supabaseOwnerHandoffPlan,
    cloudrunDockerOwnerHandoffPlan,
    toolProviderRouteOwnerHandoffPlan,
    noExecutionPolicy,
    summary,
  }
}

export async function writeWorkerRuntimeLocalFixturePlanArtifacts(
  reports = buildWorkerRuntimeLocalFixturePlanReports(),
) {
  const reportMap: Record<typeof WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_EXPECTED_REPORTS[number], Record<string, unknown>> = {
    'worker_runtime_local_fixture_plan_decision.json': reports.decision,
    'worker_runtime_local_fixture_source_of_truth_audit.json': reports.sourceAudit,
    'worker_runtime_local_fixture_scope.json': reports.scope,
    'worker_runtime_local_fixture_input_matrix.json': reports.inputMatrix,
    'worker_runtime_local_fixture_validation_matrix.json': reports.validationMatrix,
    'worker_runtime_local_fixture_execution_blocker_plan.json': reports.executionBlockerPlan,
    'worker_runtime_local_fixture_valid_fixture_plan.json': reports.validFixturePlan,
    'worker_runtime_local_fixture_invalid_fixture_plan.json': reports.invalidFixturePlan,
    'worker_runtime_local_fixture_manifest_checksum_plan.json': reports.manifestChecksumPlan,
    'worker_runtime_local_fixture_payload_result_plan.json': reports.payloadResultPlan,
    'worker_runtime_local_fixture_queue_job_sidecar_plan.json': reports.queueJobSidecarPlan,
    'worker_runtime_local_fixture_claim_lease_idempotency_plan.json': reports.claimLeaseIdempotencyPlan,
    'worker_runtime_local_fixture_retry_cleanup_plan.json': reports.retryCleanupPlan,
    'worker_runtime_local_fixture_artifact_source_ref_plan.json': reports.artifactSourceRefPlan,
    'worker_runtime_local_fixture_observability_cost_plan.json': reports.observabilityCostPlan,
    'worker_runtime_local_fixture_billing_credit_plan.json': reports.billingCreditPlan,
    'worker_runtime_local_fixture_supabase_owner_handoff_plan.json': reports.supabaseOwnerHandoffPlan,
    'worker_runtime_local_fixture_cloudrun_docker_owner_handoff_plan.json': reports.cloudrunDockerOwnerHandoffPlan,
    'worker_runtime_local_fixture_tool_provider_route_owner_handoff_plan.json': reports.toolProviderRouteOwnerHandoffPlan,
    'worker_runtime_local_fixture_no_execution_policy.json': reports.noExecutionPolicy,
    'worker_runtime_local_fixture_summary.json': reports.summary,
  }

  for (const [name, report] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_REPORT_DIR, name), report)
  }

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-unlock-4-local-fixture-plan.md', `# Worker Runtime Local Fixture Plan

Decision: \`${String(reports.decision.decision)}\`.

This metadata-only packet maps the merged PR #353 hardened worker runtime fixture set into a future local fixture validation plan. It covers four valid hardened fixtures, eight invalid fail-closed fixtures, the fixture manifest, deterministic SHA-256 checksums, placeholder source refs, payload/result contract checks, owner handoffs, and no-execution runtime gates.

The planned local validation phase may read committed docs-only fixture JSON and recompute canonical JSON checksums. It must not execute real workers, enqueue or dispatch jobs, claim or lease jobs, spawn sidecars or subprocesses, mutate Supabase, run SQL, deploy migrations, call providers, run tools/routes, process media, run Docker, run Cloud Run or Cloud Build, create signed URLs, create public artifacts, generate assets, mutate credits or billing, unlock beta, unlock production, or claim \`generated_local_fixture_passed\`.

Fixture map:
- Valid hardened fixtures: \`${String(reports.inputMatrix.validFixtureCount)}\`
- Invalid fail-closed fixtures: \`${String(reports.inputMatrix.invalidFailClosedFixtureCount)}\`
- Checksum input scope: \`${String(reports.manifestChecksumPlan.checksumInputScope)}\`
- Source refs: \`${String(reports.inputMatrix.sourceRefCount)}\` synthetic placeholder refs only

Next prompt: \`${String(reports.decision.nextRecommendedPhase)}\`.

Supabase classification: update required \`no\`; environment touched \`no\`; SQL executed \`false\`; migration deployed \`false\`; persistence remains blocked pending a separate Supabase owner handoff.

${NO_SCOPE_STATEMENT}
`)

  const passed = reports.decision.status === 'passed'
  const nextPromptPath = passed
    ? 'docs/implementation-prompts/prompt-worker-runtime-unlock-5-local-fixture-validation.md'
    : `docs/implementation-prompts/prompt-worker-runtime-unlock-4-fix-${String(reports.decision.decision)}.md`
  await writeVlmRuntimeTextArtifact(nextPromptPath, passed ? `# WORKER-RUNTIME-UNLOCK-5: Worker Runtime Local Fixture Validation

Proceed only after \`worker_runtime_local_fixture_plan_ready\`.

Scope: validate the committed docs-only hardened worker runtime fixtures locally as metadata. The validation may read the PR #353 hardened fixture JSON, manifest, checksums, schema-version index, and the UNLOCK-4 local fixture plan reports. It may recompute deterministic SHA-256 values over canonical fixture JSON content and verify valid/invalid fixture expectations.

Do not execute real workers, enqueue jobs, dispatch jobs, claim or lease jobs, mutate Supabase, execute SQL, deploy migrations, run providers, run tools/routes, process media, run Docker, run Cloud Run or Cloud Build, create signed URLs, create public artifacts, generate assets, mutate credits or billing, unlock beta, unlock paid production, unlock production, or claim \`generated_local_fixture_passed\` unless a later owner explicitly approves a different phase.
` : `# WORKER-RUNTIME-UNLOCK-4 Fix

Fix blocker: \`${String(reports.decision.decision)}\`.

Keep the fix metadata-only. Do not execute real workers, mutate Supabase, run SQL, call providers, run tools/routes, process media, create signed URLs or public artifacts, generate assets, mutate credits or billing, unlock beta/production, or claim \`generated_local_fixture_passed\`.
`)
}

export function readWorkerRuntimeLocalFixturePlanSummary() {
  return readJson(path.join(WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_REPORT_DIR, 'worker_runtime_local_fixture_summary.json')) ??
    buildWorkerRuntimeLocalFixturePlanReports().summary
}

export function getWorkerRuntimeLocalFixturePlanTextCorpus() {
  return [
    ...WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_EXPECTED_REPORTS.map((name) => path.join(WORKER_RUNTIME_LOCAL_FIXTURE_PLAN_REPORT_DIR, name)),
    'docs/worker-runtime-unlock-4-local-fixture-plan.md',
    'docs/implementation-prompts/prompt-worker-runtime-unlock-5-local-fixture-validation.md',
  ].map((filePath) => ({ filePath, text: readText(filePath) }))
}
