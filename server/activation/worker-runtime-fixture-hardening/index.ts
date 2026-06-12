import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR,
  buildWorkerRuntimeDryRunContractReviewReports,
} from '../worker-runtime-dry-run-contract-review'
import {
  WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR,
  buildWorkerRuntimeNoopDryRunExecutionReports,
} from '../worker-runtime-noop-dry-run-execution'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import type {
  WorkerRuntimeFixtureHardeningArtifacts,
  WorkerRuntimeFixtureHardeningDecision,
  WorkerRuntimeFixtureHardeningReports,
} from './worker-runtime-fixture-hardening-types'

export const WORKER_RUNTIME_FIXTURE_HARDENING_PHASE = 'worker-runtime-fixture-hardening'
export const WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID = 'worker-runtime-fixture-hardening-20260612'
export const WORKER_RUNTIME_FIXTURE_HARDENING_BRANCH =
  'codex/rp-worker-runtime-unlock-3-fixture-hardening'
export const WORKER_RUNTIME_FIXTURE_HARDENING_BASE_BRANCH =
  'codex/rp-model-orchestration-plan-snapshot-dry-run-validation'
export const WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR =
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-reports'
export const WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR =
  'docs/activation-worker-runtime-unlock-3-fixture-hardening-fixtures'

export const WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_REPORTS = [
  'worker_runtime_fixture_source_of_truth_audit.json',
  'worker_runtime_hardened_fixture_inventory.json',
  'worker_runtime_valid_fixture_hardening.json',
  'worker_runtime_invalid_fixture_hardening.json',
  'worker_runtime_payload_fixture_hardening.json',
  'worker_runtime_result_fixture_hardening.json',
  'worker_runtime_manifest_checksum_provenance_hardening.json',
  'worker_runtime_queue_job_sidecar_fixture_hardening.json',
  'worker_runtime_claim_lease_idempotency_fixture_hardening.json',
  'worker_runtime_retry_cleanup_fixture_hardening.json',
  'worker_runtime_artifact_source_ref_fixture_hardening.json',
  'worker_runtime_observability_cost_fixture_hardening.json',
  'worker_runtime_billing_credit_fixture_hardening.json',
  'worker_runtime_supabase_persistence_blocker_fixture_hardening.json',
  'worker_runtime_cloudrun_docker_blocker_fixture_hardening.json',
  'worker_runtime_tool_provider_route_blocker_fixture_hardening.json',
  'worker_runtime_no_execution_fixture_policy.json',
  'worker_runtime_fixture_hardening_decision.json',
  'worker_runtime_fixture_hardening_summary.json',
] as const

export const WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_FIXTURES = [
  'worker_runtime_hardened_valid_fixtures.json',
  'worker_runtime_hardened_invalid_fixtures.json',
  'worker_runtime_fixture_manifest.json',
  'worker_runtime_fixture_checksums.json',
  'worker_runtime_fixture_schema_versions.json',
] as const

export const WORKER_RUNTIME_FIXTURE_HARDENING_ALLOWED_DECISIONS = [
  'worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan',
  'worker_runtime_fixture_hardening_passed_with_warnings_ready_for_local_fixture_plan',
  'worker_runtime_fixture_hardening_blocked_source_of_truth_conflict',
  'worker_runtime_fixture_hardening_blocked_missing_contract_review',
  'worker_runtime_fixture_hardening_blocked_missing_fixture_contract',
  'worker_runtime_fixture_hardening_blocked_invalid_fixture_coverage',
  'worker_runtime_fixture_hardening_blocked_policy_violation',
] as const

const NO_SCOPE_STATEMENT =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, real worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

const RUNTIME_FALSE_FLAGS = {
  workerExecution: false,
  workerRuntimeExecutionReady: false,
  workerExecutionReady: false,
  runtimeExecutionAllowed: false,
  workerExecutionAllowed: false,
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
  'generated_local_fixture_passed',
] as const

const REQUIRED_SOURCE_PATHS = [
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_dry_run_contract_review_decision.json',
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_fixture_contract_review.json',
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_payload_schema_review.json',
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_result_schema_review.json',
  'docs/activation-worker-runtime-unlock-2-dry-run-contract-review-reports/worker_runtime_invalid_fixture_fail_closed_review.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_execution_decision.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_fixture_inventory.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_valid_fixture_results.json',
  'docs/activation-worker-runtime-noop-dry-run-execution-reports/worker_noop_dry_run_invalid_fixture_results.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json',
  'docs/activation-worker-runtime-dry-run-approval-reports/approved_plan_snapshot_dry_run_fixtures.json',
  'docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-product-internal-testing-session-0-reports/session_0_decision.json',
  'docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json',
] as const

const ADDITIONAL_INVALID_FIXTURE_DEFINITIONS = [
  {
    caseId: 'invalid_signed_url_source_of_truth',
    purpose: 'Reject signed URL source-of-truth metadata.',
    intentionallyInvalidReason: 'signed_url_source_of_truth',
    blockedActions: ['signed_url_source_of_truth'],
    unsafeFieldClass: 'signed_url_source_of_truth_field',
  },
  {
    caseId: 'invalid_unapproved_artifact_prefix',
    purpose: 'Reject artifact refs outside approved synthetic private placeholder prefixes.',
    intentionallyInvalidReason: 'unapproved_artifact_prefix',
    blockedActions: ['unapproved_artifact_prefix'],
    unsafeFieldClass: 'unapproved_artifact_prefix_field',
  },
  {
    caseId: 'invalid_service_role_key_like_field_name',
    purpose: 'Reject service-role-key-like field names without storing or printing secret values.',
    intentionallyInvalidReason: 'service_role_key_like_field_name',
    blockedActions: ['service_role_key_like_field_name'],
    unsafeFieldClass: 'service_role_key_like_field_name',
  },
  {
    caseId: 'invalid_direct_tool_route_execution_field',
    purpose: 'Reject direct tool or route execution fields in worker fixtures.',
    intentionallyInvalidReason: 'direct_tool_route_execution_field',
    blockedActions: ['direct_tool_execution_field', 'direct_route_execution_field'],
    unsafeFieldClass: 'direct_tool_route_execution_field',
  },
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

function normalizeForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForCanonicalJson)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalizeForCanonicalJson(nested)]),
    )
  }
  return value
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(normalizeForCanonicalJson(value))
}

function sha256Canonical(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function sourceRefByPrefix(fixture: Record<string, unknown>, prefix: string): string {
  return stringArray(fixture.sourceOfTruthRefs).find((ref) => ref.startsWith(prefix)) ??
    `${prefix}synthetic_worker_fixture_hardening/${String(fixture.caseId)}`
}

function buildSourceRefs(fixture: Record<string, unknown>) {
  return {
    supabaseRowRef: sourceRefByPrefix(fixture, 'supabase_row_ref:'),
    privateGcsPathRef: sourceRefByPrefix(fixture, 'private_gcs_path_ref:'),
    manifestRef: sourceRefByPrefix(fixture, 'manifest_ref:'),
    checksumRef: sourceRefByPrefix(fixture, 'checksum_ref:'),
  }
}

function sourceRefsArray(fixture: Record<string, unknown>) {
  const refs = buildSourceRefs(fixture)
  return [
    refs.supabaseRowRef,
    refs.privateGcsPathRef,
    refs.manifestRef,
    refs.checksumRef,
  ]
}

function syntheticSourceFixture(caseId: string, purpose: string) {
  return {
    caseId,
    kind: 'invalid_fail_closed',
    purpose,
    schemaVersion: 'approved_plan_snapshot_v1',
    approvedSnapshotId: `synthetic-${caseId}`,
    sourceOfTruthRefs: [
      `supabase_row_ref:synthetic_worker_fixture_hardening/${caseId}`,
      `private_gcs_path_ref:synthetic-private-gcs/worker-fixture-hardening/${caseId}`,
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
    expectedDecision: 'fail_closed',
    blockedActions: [],
  }
}

function getApprovalFixtures() {
  const fixtureReport = readJson('docs/activation-worker-runtime-dry-run-approval-reports/approved_plan_snapshot_dry_run_fixtures.json')
  return recordArray(fixtureReport?.fixtures)
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

function requiredPlaceholderRefsPresent(fixture: Record<string, unknown>) {
  const refs = sourceRefsArray(fixture)
  return [
    'supabase_row_ref:synthetic',
    'private_gcs_path_ref:synthetic',
    'manifest_ref:synthetic',
    'checksum_ref:synthetic',
  ].every((prefix) => refs.some((ref) => ref.startsWith(prefix)))
}

function buildPayloadContract(fixture: Record<string, unknown>, refs: ReturnType<typeof buildSourceRefs>) {
  const caseId = String(fixture.caseId)
  return {
    schemaVersion: 'worker_runtime_metadata_payload_contract_v1',
    workstreamOwner: 'WORKER_RUNTIME_JOBS',
    workerType: 'metadata_only_noop_worker_fixture',
    jobIntent: String(fixture.purpose ?? 'metadata-only worker fixture hardening'),
    idempotencyKey: `synthetic_idempotency_key:${caseId}`,
    correlationId: `synthetic_correlation_id:${caseId}`,
    approvedPlanSnapshotRef: refs.supabaseRowRef,
    approvedPlanSnapshotHash: refs.checksumRef,
    artifactScope: 'private_placeholder_only',
    privateArtifactManifestRef: refs.manifestRef,
    inputManifestRefs: [refs.manifestRef],
    outputManifestExpected: true,
    checksumRequired: true,
    provenanceRequired: true,
    sourceOfTruthRefs: sourceRefsArray(fixture),
    blockedActions: BLOCKED_SCOPES,
    handoffOwner: 'WORKER_RUNTIME_JOBS',
    resultSchemaVersion: 'worker_runtime_metadata_result_contract_v1',
    rawPromptFieldAllowed: false,
    rawProviderOutputFieldAllowed: false,
    publicUrlFieldAllowed: false,
    executableWorkerPayloadAllowed: false,
  }
}

function buildResultContract(fixture: Record<string, unknown>, refs: ReturnType<typeof buildSourceRefs>, decision: string) {
  const caseId = String(fixture.caseId)
  return {
    schemaVersion: 'worker_runtime_metadata_result_contract_v1',
    status: decision === 'fail_closed' ? 'passed_fail_closed' : 'accepted_metadata_only',
    decision,
    accepted: decision !== 'fail_closed',
    blocked: decision === 'fail_closed',
    failClosed: decision === 'fail_closed',
    evidenceRefs: [
      `${WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR}/worker_runtime_hardened_fixture_inventory.json`,
      `${WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR}/worker_runtime_fixture_checksums.json`,
    ],
    outputManifestRef: refs.manifestRef,
    checksumRef: refs.checksumRef,
    provenanceRef: `manifest_ref:synthetic_provenance_${caseId}`,
    auditMetadataRef: `manifest_ref:synthetic_audit_metadata_${caseId}`,
    costMetadataRef: `manifest_ref:synthetic_cost_metadata_${caseId}`,
    billingPlaceholderRef: `manifest_ref:synthetic_billing_placeholder_${caseId}`,
    cleanupMetadata: {
      cleanupRequired: false,
      cleanupOwner: 'WORKER_RUNTIME_JOBS',
      cleanupMode: 'metadata_only_placeholder',
    },
    rollbackMetadata: {
      rollbackRequired: false,
      rollbackOwner: 'WORKER_RUNTIME_JOBS',
      rollbackMode: 'metadata_only_placeholder',
    },
    blockedOutputs: [
      'public_url',
      'signed_url',
      'raw_provider_output',
      'secret_payload',
      'real_media_payload',
      'database_url',
    ],
  }
}

function hardenValidFixture(fixture: Record<string, unknown>) {
  const refs = buildSourceRefs(fixture)
  return {
    caseId: fixture.caseId,
    sourceCaseId: fixture.caseId,
    kind: 'valid_hardened',
    purpose: fixture.purpose,
    schemaVersion: 'worker_runtime_hardened_fixture_v1',
    planSnapshotSchemaVersion: fixture.schemaVersion,
    approvedPlanSnapshotSchema: 'approved_plan_snapshot_v1',
    approvedPlanSnapshotRef: refs.supabaseRowRef,
    approvedPlanSnapshotHash: refs.checksumRef,
    sourceApprovalSnapshotId: fixture.approvedSnapshotId,
    sourceOfTruthRefs: sourceRefsArray(fixture),
    sourceOfTruthRefSet: refs,
    artifactScope: 'private_placeholder_only',
    syntheticOnly: true,
    realUserData: false,
    realMedia: false,
    privatePayloadCommitted: false,
    payloadContract: buildPayloadContract(fixture, refs),
    resultContract: buildResultContract(fixture, refs, 'accepted_for_future_local_fixture_plan'),
    expectedDecision: 'accepted_for_future_local_fixture_plan',
    blockedActions: [],
    ...runtimeFlags(),
  }
}

function hardenInvalidFixture(fixture: Record<string, unknown>) {
  const refs = buildSourceRefs(fixture)
  const blockedActions = stringArray(fixture.blockedActions)
  return {
    caseId: fixture.caseId,
    sourceCaseId: fixture.caseId,
    kind: 'invalid_fail_closed_hardened',
    purpose: fixture.purpose,
    schemaVersion: 'worker_runtime_hardened_fixture_v1',
    planSnapshotSchemaVersion: fixture.schemaVersion,
    approvedPlanSnapshotSchema: 'approved_plan_snapshot_v1',
    approvedPlanSnapshotRef: refs.supabaseRowRef,
    approvedPlanSnapshotHash: refs.checksumRef,
    sourceApprovalSnapshotId: fixture.approvedSnapshotId,
    sourceOfTruthRefs: sourceRefsArray(fixture),
    sourceOfTruthRefSet: refs,
    artifactScope: 'private_placeholder_only',
    syntheticOnly: true,
    realUserData: false,
    realMedia: false,
    privatePayloadCommitted: false,
    payloadContract: buildPayloadContract(fixture, refs),
    resultContract: buildResultContract(fixture, refs, 'fail_closed'),
    expectedDecision: 'fail_closed',
    intentionallyInvalidReason: fixture.intentionallyInvalidReason,
    blockedActions,
    unsafeFieldClass: fixture.unsafeFieldClass ?? fixture.intentionallyInvalidReason,
    ...runtimeFlags(),
  }
}

function getHardenedValidFixtures() {
  return getApprovalFixtures()
    .filter((fixture) => fixture.kind === 'valid')
    .map(hardenValidFixture)
}

function getHardenedInvalidFixtures() {
  const originalInvalid = getApprovalFixtures()
    .filter((fixture) => fixture.kind === 'invalid_fail_closed')
  const additionalInvalid = ADDITIONAL_INVALID_FIXTURE_DEFINITIONS.map((definition) => ({
    ...syntheticSourceFixture(definition.caseId, definition.purpose),
    intentionallyInvalidReason: definition.intentionallyInvalidReason,
    blockedActions: definition.blockedActions,
    unsafeFieldClass: definition.unsafeFieldClass,
  }))

  return [...originalInvalid, ...additionalInvalid].map(hardenInvalidFixture)
}

function buildFixtureChecksums(validFixtures: Record<string, unknown>[], invalidFixtures: Record<string, unknown>[]) {
  const allFixtures = [...validFixtures, ...invalidFixtures]
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    checksumAlgorithm: 'sha256',
    checksumInputScope: 'canonical_fixture_json_content_only',
    canonicalization: 'recursive_object_key_sort_then_json_stringify',
    fixtureCount: allFixtures.length,
    fixtureChecksums: allFixtures.map((fixture) => ({
      caseId: fixture.caseId,
      kind: fixture.kind,
      sha256: sha256Canonical(fixture),
    })),
    validFixtureSetSha256: sha256Canonical(validFixtures),
    invalidFixtureSetSha256: sha256Canonical(invalidFixtures),
    realMediaChecksummed: false,
    privatePayloadChecksummed: false,
    ...runtimeFlags(),
  }
}

function buildFixtureManifest(validFixtures: Record<string, unknown>[], invalidFixtures: Record<string, unknown>[]) {
  const checksums = buildFixtureChecksums(validFixtures, invalidFixtures)
  const checksumRows = recordArray(checksums.fixtureChecksums)
  const allFixtures = [...validFixtures, ...invalidFixtures]
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    manifestSchemaVersion: 'worker_runtime_fixture_manifest_v1',
    fixtureCount: allFixtures.length,
    validFixtureCount: validFixtures.length,
    invalidFailClosedFixtureCount: invalidFixtures.length,
    fixtureFiles: [
      `${WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR}/worker_runtime_hardened_valid_fixtures.json`,
      `${WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR}/worker_runtime_hardened_invalid_fixtures.json`,
      `${WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR}/worker_runtime_fixture_checksums.json`,
      `${WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR}/worker_runtime_fixture_schema_versions.json`,
    ],
    fixtures: allFixtures.map((fixture) => ({
      caseId: fixture.caseId,
      kind: fixture.kind,
      expectedDecision: fixture.expectedDecision,
      checksum: checksumRows.find((row) => row.caseId === fixture.caseId)?.sha256,
      approvedPlanSnapshotRef: fixture.approvedPlanSnapshotRef,
      approvedPlanSnapshotHash: fixture.approvedPlanSnapshotHash,
      sourceOfTruthRefs: fixture.sourceOfTruthRefs,
    })),
    artifactClassification: 'docs_only_sanitized_metadata_fixtures',
    containsSecretPayload: false,
    containsPrivatePayload: false,
    containsRawProviderOutput: false,
    containsRealUserData: false,
    containsRealMedia: false,
    publicArtifact: false,
    signedUrl: false,
    ...runtimeFlags(),
  }
}

function buildFixtureSchemaVersions(validFixtures: Record<string, unknown>[], invalidFixtures: Record<string, unknown>[]) {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    fixtureSchemaVersion: 'worker_runtime_hardened_fixture_v1',
    approvedPlanSnapshotSchema: 'approved_plan_snapshot_v1',
    payloadContractSchemaVersion: 'worker_runtime_metadata_payload_contract_v1',
    resultContractSchemaVersion: 'worker_runtime_metadata_result_contract_v1',
    validFixtures: validFixtures.map((fixture) => ({
      caseId: fixture.caseId,
      schemaVersion: fixture.schemaVersion,
      planSnapshotSchemaVersion: fixture.planSnapshotSchemaVersion,
      approvedPlanSnapshotSchema: fixture.approvedPlanSnapshotSchema,
    })),
    invalidFixtures: invalidFixtures.map((fixture) => ({
      caseId: fixture.caseId,
      schemaVersion: fixture.schemaVersion,
      planSnapshotSchemaVersion: fixture.planSnapshotSchemaVersion,
      approvedPlanSnapshotSchema: fixture.approvedPlanSnapshotSchema,
      intentionallyInvalidReason: fixture.intentionallyInvalidReason,
    })),
    ...runtimeFlags(),
  }
}

export function buildWorkerRuntimeFixtureHardeningArtifacts(): WorkerRuntimeFixtureHardeningArtifacts {
  const validFixtures = getHardenedValidFixtures()
  const invalidFixtures = getHardenedInvalidFixtures()
  return {
    validFixtures: {
      phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
      runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
      status: validFixtures.length === 4 ? 'passed' : 'blocked',
      fixtureSet: 'hardened_valid_worker_runtime_fixtures',
      fixtureCount: validFixtures.length,
      fixtures: validFixtures,
      ...runtimeFlags(),
    },
    invalidFixtures: {
      phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
      runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
      status: invalidFixtures.length === 8 ? 'passed' : 'blocked',
      fixtureSet: 'hardened_invalid_fail_closed_worker_runtime_fixtures',
      fixtureCount: invalidFixtures.length,
      fixtures: invalidFixtures,
      ...runtimeFlags(),
    },
    fixtureManifest: buildFixtureManifest(validFixtures, invalidFixtures),
    fixtureChecksums: buildFixtureChecksums(validFixtures, invalidFixtures),
    fixtureSchemaVersions: buildFixtureSchemaVersions(validFixtures, invalidFixtures),
  }
}

function buildSourceAudit(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const contractReports = buildWorkerRuntimeDryRunContractReviewReports()
  const noopReports = buildWorkerRuntimeNoopDryRunExecutionReports()
  const contractDecision = asRecord(contractReports.decision)
  const noopDecision = asRecord(noopReports.decision)
  const approvalDecision = readJson('docs/activation-worker-runtime-dry-run-approval-reports/worker_dry_run_approval_decision.json')
  const repoAuditDecision = readJson('docs/activation-worker-runtime-repo-audit-reports/worker_runtime_repo_audit_decision.json')
  const planDryRunDecision = readJson('docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json')
  const internalTestingDecision = readJson('docs/activation-product-internal-testing-session-0-reports/session_0_decision.json')
  const trackBReadiness = readJson('docs/activation-supabase-trackb-clean-staging-backfill-reports/trackb_clean_staging_backfill_readiness_report.json')

  const evidence = [
    {
      pr: 351,
      name: 'worker runtime dry-run contract review',
      expectedDecision: 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening',
      actualDecision: contractDecision.decision,
      accepted: contractDecision.decision === 'worker_runtime_dry_run_contract_review_passed_ready_for_fixture_hardening',
    },
    {
      pr: 346,
      name: 'worker no-op dry-run execution',
      expectedDecision: 'worker_noop_dry_run_passed_ready_for_contract_review',
      actualDecision: noopDecision.decision,
      accepted: noopDecision.decision === 'worker_noop_dry_run_passed_ready_for_contract_review',
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
      actualDecision: trackBReadiness?.supabaseUpdateStatus,
      accepted: trackBReadiness?.status === 'passed',
    },
  ]
  const sourcePaths = REQUIRED_SOURCE_PATHS.map(pathStatus)
  const status = evidence.every((item) => item.accepted) &&
    sourcePaths.every((item) => item.present) &&
    artifacts.validFixtures.status === 'passed' &&
    artifacts.invalidFixtures.status === 'passed' ? 'passed' : 'blocked'

  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status,
    owner: 'WORKER_RUNTIME_JOBS',
    sourceBranch: WORKER_RUNTIME_FIXTURE_HARDENING_BASE_BRANCH,
    sourceMergeCommit: '5b2e62a6bc9e22ab20a82448265aaeee48431445',
    sourcePr351Merged: true,
    sourceOfTruthConflictsFound: status !== 'passed',
    sourcePaths,
    evidence,
    sourceReportDirs: {
      contractReview: WORKER_RUNTIME_DRY_RUN_CONTRACT_REVIEW_REPORT_DIR,
      noopDryRun: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REPORT_DIR,
    },
    rawProviderOutputCopied: false,
    secretPayloadCopied: false,
    ...runtimeFlags(),
  }
}

function buildFixtureInventory(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const validFixtures = recordArray(artifacts.validFixtures.fixtures)
  const invalidFixtures = recordArray(artifacts.invalidFixtures.fixtures)
  const allFixtures = [...validFixtures, ...invalidFixtures]
  const unsafeFixtureIds = allFixtures
    .filter((fixture) =>
      !requiredPlaceholderRefsPresent(fixture) ||
      !fixtureRuntimeFlagsSafe(fixture) ||
      fixture.syntheticOnly !== true ||
      fixture.realUserData !== false ||
      fixture.realMedia !== false ||
      fixture.privatePayloadCommitted !== false ||
      fixture.approvedPlanSnapshotSchema !== 'approved_plan_snapshot_v1' ||
      fixture.schemaVersion !== 'worker_runtime_hardened_fixture_v1')
    .map((fixture) => fixture.caseId)

  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: allFixtures.length === 12 && validFixtures.length === 4 && invalidFixtures.length === 8 && unsafeFixtureIds.length === 0 ? 'passed' : 'blocked',
    fixtureCount: allFixtures.length,
    validFixtureCount: validFixtures.length,
    invalidFailClosedFixtureCount: invalidFixtures.length,
    validFixtureIds: validFixtures.map((fixture) => fixture.caseId),
    invalidFixtureIds: invalidFixtures.map((fixture) => fixture.caseId),
    invalidReasons: invalidFixtures.map((fixture) => fixture.intentionallyInvalidReason),
    unsafeFixtureIds,
    schemaVersion: 'worker_runtime_hardened_fixture_v1',
    approvedPlanSnapshotSchema: 'approved_plan_snapshot_v1',
    requiredSourceTruthRefs: [
      'supabase_row_ref:synthetic...',
      'private_gcs_path_ref:synthetic...',
      'manifest_ref:synthetic...',
      'checksum_ref:synthetic...',
    ],
    docsOnlyFixtureDirectory: WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR,
    ...runtimeFlags(),
  }
}

function buildValidFixtureHardening(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const fixtures = recordArray(artifacts.validFixtures.fixtures)
  const unsafeFixtureIds = fixtures
    .filter((fixture) =>
      fixture.expectedDecision !== 'accepted_for_future_local_fixture_plan' ||
      !requiredPlaceholderRefsPresent(fixture) ||
      !fixtureRuntimeFlagsSafe(fixture))
    .map((fixture) => fixture.caseId)
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: fixtures.length === 4 && unsafeFixtureIds.length === 0 ? 'passed' : 'blocked',
    validFixtureCount: fixtures.length,
    acceptedDecision: 'accepted_for_future_local_fixture_plan',
    normalizedApprovedPlanSnapshotRef: true,
    normalizedApprovedPlanSnapshotHash: true,
    fixtureIds: fixtures.map((fixture) => fixture.caseId),
    unsafeFixtureIds,
    sourceValidFixtureCount: 4,
    ...runtimeFlags(),
  }
}

function buildInvalidFixtureHardening(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const fixtures = recordArray(artifacts.invalidFixtures.fixtures)
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
  const observedReasons = fixtures.map((fixture) => String(fixture.intentionallyInvalidReason))
  const unsafeFixtureIds = fixtures
    .filter((fixture) =>
      fixture.expectedDecision !== 'fail_closed' ||
      !stringArray(fixture.blockedActions).length ||
      !requiredPlaceholderRefsPresent(fixture) ||
      !fixtureRuntimeFlagsSafe(fixture))
    .map((fixture) => fixture.caseId)
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: fixtures.length === 8 &&
      requiredReasons.every((reason) => observedReasons.includes(reason)) &&
      unsafeFixtureIds.length === 0 ? 'passed' : 'blocked',
    invalidFailClosedFixtureCount: fixtures.length,
    requiredReasons,
    observedReasons,
    rawPromptRejected: observedReasons.includes('raw_prompt_worker_input'),
    publicArtifactRejected: observedReasons.includes('public_artifact_output_request'),
    broadMediaRejected: observedReasons.includes('broad_media_processing_request'),
    productionWriteRejected: observedReasons.includes('production_write_request'),
    signedUrlSourceOfTruthRejected: observedReasons.includes('signed_url_source_of_truth'),
    unapprovedArtifactPrefixRejected: observedReasons.includes('unapproved_artifact_prefix'),
    serviceRoleKeyLikeFieldNameRejected: observedReasons.includes('service_role_key_like_field_name'),
    directToolRouteExecutionFieldRejected: observedReasons.includes('direct_tool_route_execution_field'),
    unsafeFixtureIds,
    ...runtimeFlags(),
  }
}

function buildPayloadFixtureHardening(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const fixtures = [
    ...recordArray(artifacts.validFixtures.fixtures),
    ...recordArray(artifacts.invalidFixtures.fixtures),
  ]
  const requiredFields = [
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
  const missingPayloadFieldFixtureIds = fixtures
    .filter((fixture) => {
      const payload = asRecord(fixture.payloadContract)
      return requiredFields.some((field) => !(field in payload))
    })
    .map((fixture) => fixture.caseId)

  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: missingPayloadFieldFixtureIds.length === 0 && fixtures.length === 12 ? 'passed' : 'blocked',
    contractMode: 'metadata_only_fixture_payload_contract',
    requiredFields,
    reviewedFixtureCount: fixtures.length,
    missingPayloadFieldFixtureIds,
    executableWorkerPayloadAllowed: false,
    rawPromptFieldAllowed: false,
    rawProviderOutputFieldAllowed: false,
    publicUrlFieldAllowed: false,
    ...runtimeFlags(),
  }
}

function buildResultFixtureHardening(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const fixtures = [
    ...recordArray(artifacts.validFixtures.fixtures),
    ...recordArray(artifacts.invalidFixtures.fixtures),
  ]
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
    'blockedOutputs',
  ]
  const missingResultFieldFixtureIds = fixtures
    .filter((fixture) => {
      const result = asRecord(fixture.resultContract)
      return requiredFields.some((field) => !(field in result))
    })
    .map((fixture) => fixture.caseId)

  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: missingResultFieldFixtureIds.length === 0 && fixtures.length === 12 ? 'passed' : 'blocked',
    contractMode: 'metadata_only_fixture_result_contract',
    requiredFields,
    reviewedFixtureCount: fixtures.length,
    missingResultFieldFixtureIds,
    blockedOutputs: ['public_url', 'signed_url', 'raw_provider_output', 'secret_payload', 'real_media_payload', 'database_url'],
    outputManifestRefPlaceholderRequired: true,
    checksumAndProvenancePlaceholdersRequired: true,
    ...runtimeFlags(),
  }
}

function buildManifestChecksumProvenanceHardening(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const checksums = asRecord(artifacts.fixtureChecksums)
  const manifest = asRecord(artifacts.fixtureManifest)
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: checksums.status === 'passed' && manifest.status === 'passed' ? 'passed' : 'blocked',
    checksumAlgorithm: checksums.checksumAlgorithm,
    checksumInputScope: checksums.checksumInputScope,
    fixtureCount: checksums.fixtureCount,
    validFixtureSetSha256: checksums.validFixtureSetSha256,
    invalidFixtureSetSha256: checksums.invalidFixtureSetSha256,
    manifestSchemaVersion: manifest.manifestSchemaVersion,
    provenancePlaceholderRequired: true,
    canonicalFixtureJsonOnly: true,
    realMediaChecksummed: false,
    privatePayloadChecksummed: false,
    ...runtimeFlags(),
  }
}

function buildQueueJobSidecarFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    queueEnqueueAllowed: false,
    jobDispatchAllowed: false,
    jobClaimAllowed: false,
    jobLeaseAllowed: false,
    sidecarSpawnAllowed: false,
    subprocessSpawnAllowed: false,
    futureLocalFixturePlanMaySimulateMetadataOnly: true,
    ...runtimeFlags(),
  }
}

function buildClaimLeaseIdempotencyFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    idempotencyKeyRequired: true,
    correlationIdRequired: true,
    approvedPlanSnapshotRefRequired: true,
    claimMutationAllowed: false,
    leaseMutationAllowed: false,
    retryStateMutationAllowed: false,
    idempotencyPersistenceAllowed: false,
    ...runtimeFlags(),
  }
}

function buildRetryCleanupFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    retryMetadataRequired: true,
    cleanupMetadataRequired: true,
    rollbackMetadataRequired: true,
    retryScheduled: false,
    cleanupExecuted: false,
    rollbackExecuted: false,
    failureHandlingMode: 'metadata_only_fail_closed',
    ...runtimeFlags(),
  }
}

function buildArtifactSourceRefFixtureHardening(artifacts: WorkerRuntimeFixtureHardeningArtifacts) {
  const fixtures = [
    ...recordArray(artifacts.validFixtures.fixtures),
    ...recordArray(artifacts.invalidFixtures.fixtures),
  ]
  const refs = fixtures.flatMap((fixture) => stringArray(fixture.sourceOfTruthRefs))
  const safeRefs = refs.every((ref) =>
    ref.startsWith('supabase_row_ref:synthetic') ||
    ref.startsWith('private_gcs_path_ref:synthetic') ||
    ref.startsWith('manifest_ref:synthetic') ||
    ref.startsWith('checksum_ref:synthetic'))

  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: refs.length === 48 && safeRefs ? 'passed' : 'blocked',
    fixtureCount: fixtures.length,
    sourceRefCount: refs.length,
    allowedSourceRefPrefixes: [
      'supabase_row_ref:synthetic',
      'private_gcs_path_ref:synthetic',
      'manifest_ref:synthetic',
      'checksum_ref:synthetic',
    ],
    arbitraryLocalPathsAllowed: false,
    realGcsPathsAllowed: false,
    publicArtifactUrlsAllowed: false,
    privatePayloadsCommitted: false,
    ...runtimeFlags(),
  }
}

function buildObservabilityCostFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    auditMetadataOnly: true,
    auditEventsPersisted: false,
    costMetadataOnly: true,
    cloudCostUsd: 0,
    providerCostUsd: 0,
    workerRuntimeCostUsd: 0,
    observabilityBackendWrites: false,
    ...runtimeFlags(),
  }
}

function buildBillingCreditFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
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

function buildSupabasePersistenceBlockerFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    supabaseUpdateRequired: 'no',
    supabaseEnvironmentTouched: 'no',
    rowsInserted: false,
    rowsUpdated: false,
    rowsDeleted: false,
    jobTablesWritten: false,
    runtimeConfigsWritten: false,
    signedUrlsCreated: false,
    futureSupabaseOwnerPromptRequired: true,
    blocker: 'Supabase worker/job persistence remains separate-owner blocked.',
    ...runtimeFlags(),
  }
}

function buildCloudrunDockerBlockerFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    dockerExecutionAllowed: false,
    cloudRunExecutionAllowed: false,
    cloudBuildExecutionAllowed: false,
    sidecarExecutionAllowed: false,
    subprocessExecutionAllowed: false,
    futureRuntimeOwnerApprovalRequired: true,
    blocker: 'Docker, Cloud Run, Cloud Build, sidecar, and subprocess execution remain blocked.',
    ...runtimeFlags(),
  }
}

function buildToolProviderRouteBlockerFixtureHardening() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    qwenEvidenceAcceptedAsHistoricalMetadata: true,
    deepseekEvidenceAcceptedAsHistoricalMetadata: true,
    futureOwnerApprovalsRequired: ['TOOL_ROUTE_EXECUTION', 'PROVIDER_GATEWAY_MODELS', 'MODEL_ORCHESTRATION_QWEN_DEEPSEEK'],
    ...runtimeFlags(),
  }
}

function buildNoExecutionFixturePolicy() {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: 'passed',
    policy: 'metadata_only_docs_only_fixture_hardening',
    blockedScopes: BLOCKED_SCOPES,
    noScopeStatement: NO_SCOPE_STATEMENT,
    realWorkerExecutionReady: false,
    productionReady: false,
    internalBetaReady: false,
    externalBetaReady: false,
    paidProductionReady: false,
    ...runtimeFlags(),
  }
}

function selectDecision(input: Omit<WorkerRuntimeFixtureHardeningReports, 'decision' | 'summary'>): WorkerRuntimeFixtureHardeningDecision {
  if (Object.values(input).some(hasUnsafeFlag)) return 'worker_runtime_fixture_hardening_blocked_policy_violation'
  if (input.sourceAudit.status !== 'passed') return 'worker_runtime_fixture_hardening_blocked_source_of_truth_conflict'
  if (input.validFixtureHardening.status !== 'passed') return 'worker_runtime_fixture_hardening_blocked_missing_fixture_contract'
  if (input.invalidFixtureHardening.status !== 'passed') return 'worker_runtime_fixture_hardening_blocked_invalid_fixture_coverage'
  if (input.payloadFixtureHardening.status !== 'passed' || input.resultFixtureHardening.status !== 'passed') {
    return 'worker_runtime_fixture_hardening_blocked_missing_fixture_contract'
  }
  if (Object.values(input).some((report) => report.status !== 'passed')) {
    return 'worker_runtime_fixture_hardening_blocked_policy_violation'
  }
  return 'worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan'
}

function buildDecisionReport(input: Omit<WorkerRuntimeFixtureHardeningReports, 'decision' | 'summary'>) {
  const decision = selectDecision(input)
  const passed = decision === 'worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan' ||
    decision === 'worker_runtime_fixture_hardening_passed_with_warnings_ready_for_local_fixture_plan'
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    decision,
    activeBlockers: passed ? [] : [decision],
    fixtureHardeningPassed: passed,
    readyForLocalFixturePlan: passed,
    realWorkerExecutionReady: false,
    workerDispatchReady: false,
    jobClaimReady: false,
    jobLeaseReady: false,
    supabasePersistenceReady: false,
    productionBetaPaidProductionClaimed: false,
    nextRecommendedPhase: passed
      ? 'WORKER-RUNTIME-UNLOCK-4: worker runtime local fixture plan, no real execution'
      : `WORKER-RUNTIME-UNLOCK-3-FIX-${decision}: fix worker runtime fixture hardening blocker, no real execution`,
    noScopeStatement: NO_SCOPE_STATEMENT,
    ...runtimeFlags(),
  }
}

function buildSummary(input: {
  decision: Record<string, unknown>
  sourceAudit: Record<string, unknown>
  fixtureInventory: Record<string, unknown>
  validFixtureHardening: Record<string, unknown>
  invalidFixtureHardening: Record<string, unknown>
}) {
  return {
    phase: WORKER_RUNTIME_FIXTURE_HARDENING_PHASE,
    runId: WORKER_RUNTIME_FIXTURE_HARDENING_RUN_ID,
    status: input.decision.status,
    decision: input.decision.decision,
    sourceOfTruthConflictsFound: input.sourceAudit.sourceOfTruthConflictsFound,
    fixtureHardeningPassed: input.decision.fixtureHardeningPassed,
    fixtureCount: input.fixtureInventory.fixtureCount,
    validFixtureCount: input.validFixtureHardening.validFixtureCount,
    invalidFailClosedFixtureCount: input.invalidFixtureHardening.invalidFailClosedFixtureCount,
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

export function buildWorkerRuntimeFixtureHardeningReports(): WorkerRuntimeFixtureHardeningReports {
  const artifacts = buildWorkerRuntimeFixtureHardeningArtifacts()
  const sourceAudit = buildSourceAudit(artifacts)
  const fixtureInventory = buildFixtureInventory(artifacts)
  const validFixtureHardening = buildValidFixtureHardening(artifacts)
  const invalidFixtureHardening = buildInvalidFixtureHardening(artifacts)
  const payloadFixtureHardening = buildPayloadFixtureHardening(artifacts)
  const resultFixtureHardening = buildResultFixtureHardening(artifacts)
  const manifestChecksumProvenanceHardening = buildManifestChecksumProvenanceHardening(artifacts)
  const queueJobSidecarFixtureHardening = buildQueueJobSidecarFixtureHardening()
  const claimLeaseIdempotencyFixtureHardening = buildClaimLeaseIdempotencyFixtureHardening()
  const retryCleanupFixtureHardening = buildRetryCleanupFixtureHardening()
  const artifactSourceRefFixtureHardening = buildArtifactSourceRefFixtureHardening(artifacts)
  const observabilityCostFixtureHardening = buildObservabilityCostFixtureHardening()
  const billingCreditFixtureHardening = buildBillingCreditFixtureHardening()
  const supabasePersistenceBlockerFixtureHardening = buildSupabasePersistenceBlockerFixtureHardening()
  const cloudrunDockerBlockerFixtureHardening = buildCloudrunDockerBlockerFixtureHardening()
  const toolProviderRouteBlockerFixtureHardening = buildToolProviderRouteBlockerFixtureHardening()
  const noExecutionFixturePolicy = buildNoExecutionFixturePolicy()
  const decision = buildDecisionReport({
    sourceAudit,
    fixtureInventory,
    validFixtureHardening,
    invalidFixtureHardening,
    payloadFixtureHardening,
    resultFixtureHardening,
    manifestChecksumProvenanceHardening,
    queueJobSidecarFixtureHardening,
    claimLeaseIdempotencyFixtureHardening,
    retryCleanupFixtureHardening,
    artifactSourceRefFixtureHardening,
    observabilityCostFixtureHardening,
    billingCreditFixtureHardening,
    supabasePersistenceBlockerFixtureHardening,
    cloudrunDockerBlockerFixtureHardening,
    toolProviderRouteBlockerFixtureHardening,
    noExecutionFixturePolicy,
  })
  const summary = buildSummary({
    decision,
    sourceAudit,
    fixtureInventory,
    validFixtureHardening,
    invalidFixtureHardening,
  })

  return {
    sourceAudit,
    fixtureInventory,
    validFixtureHardening,
    invalidFixtureHardening,
    payloadFixtureHardening,
    resultFixtureHardening,
    manifestChecksumProvenanceHardening,
    queueJobSidecarFixtureHardening,
    claimLeaseIdempotencyFixtureHardening,
    retryCleanupFixtureHardening,
    artifactSourceRefFixtureHardening,
    observabilityCostFixtureHardening,
    billingCreditFixtureHardening,
    supabasePersistenceBlockerFixtureHardening,
    cloudrunDockerBlockerFixtureHardening,
    toolProviderRouteBlockerFixtureHardening,
    noExecutionFixturePolicy,
    decision,
    summary,
  }
}

export async function writeWorkerRuntimeFixtureHardeningArtifacts(
  reports = buildWorkerRuntimeFixtureHardeningReports(),
  fixtures = buildWorkerRuntimeFixtureHardeningArtifacts(),
) {
  const reportMap: Record<typeof WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_REPORTS[number], Record<string, unknown>> = {
    'worker_runtime_fixture_source_of_truth_audit.json': reports.sourceAudit,
    'worker_runtime_hardened_fixture_inventory.json': reports.fixtureInventory,
    'worker_runtime_valid_fixture_hardening.json': reports.validFixtureHardening,
    'worker_runtime_invalid_fixture_hardening.json': reports.invalidFixtureHardening,
    'worker_runtime_payload_fixture_hardening.json': reports.payloadFixtureHardening,
    'worker_runtime_result_fixture_hardening.json': reports.resultFixtureHardening,
    'worker_runtime_manifest_checksum_provenance_hardening.json': reports.manifestChecksumProvenanceHardening,
    'worker_runtime_queue_job_sidecar_fixture_hardening.json': reports.queueJobSidecarFixtureHardening,
    'worker_runtime_claim_lease_idempotency_fixture_hardening.json': reports.claimLeaseIdempotencyFixtureHardening,
    'worker_runtime_retry_cleanup_fixture_hardening.json': reports.retryCleanupFixtureHardening,
    'worker_runtime_artifact_source_ref_fixture_hardening.json': reports.artifactSourceRefFixtureHardening,
    'worker_runtime_observability_cost_fixture_hardening.json': reports.observabilityCostFixtureHardening,
    'worker_runtime_billing_credit_fixture_hardening.json': reports.billingCreditFixtureHardening,
    'worker_runtime_supabase_persistence_blocker_fixture_hardening.json': reports.supabasePersistenceBlockerFixtureHardening,
    'worker_runtime_cloudrun_docker_blocker_fixture_hardening.json': reports.cloudrunDockerBlockerFixtureHardening,
    'worker_runtime_tool_provider_route_blocker_fixture_hardening.json': reports.toolProviderRouteBlockerFixtureHardening,
    'worker_runtime_no_execution_fixture_policy.json': reports.noExecutionFixturePolicy,
    'worker_runtime_fixture_hardening_decision.json': reports.decision,
    'worker_runtime_fixture_hardening_summary.json': reports.summary,
  }
  const fixtureMap: Record<typeof WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_FIXTURES[number], Record<string, unknown>> = {
    'worker_runtime_hardened_valid_fixtures.json': fixtures.validFixtures,
    'worker_runtime_hardened_invalid_fixtures.json': fixtures.invalidFixtures,
    'worker_runtime_fixture_manifest.json': fixtures.fixtureManifest,
    'worker_runtime_fixture_checksums.json': fixtures.fixtureChecksums,
    'worker_runtime_fixture_schema_versions.json': fixtures.fixtureSchemaVersions,
  }

  for (const [name, report] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR, name), report)
  }

  for (const [name, fixture] of Object.entries(fixtureMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR, name), fixture)
  }

  await writeVlmRuntimeTextArtifact('docs/worker-runtime-unlock-3-fixture-hardening.md', `# Worker Runtime Fixture Hardening

Decision: \`${String(reports.decision.decision)}\`.

This metadata-only packet hardens the merged PR #351 dry-run contract review into docs-only worker runtime fixtures for a later local fixture plan. The packet derives four valid fixtures from the PR #342 approved \`approved_plan_snapshot_v1\` fixtures and adds eight fail-closed invalid fixtures covering raw prompt input, public artifact output, broad media processing, production write requests, signed URL source-of-truth metadata, unapproved artifact prefixes, service-role-key-like field names, and direct tool/route execution fields.

Each valid hardened fixture now has explicit \`approvedPlanSnapshotRef\`, \`approvedPlanSnapshotHash\`, \`planSnapshotSchemaVersion\`, \`approvedPlanSnapshotSchema\`, private placeholder source refs, payload contract metadata, result contract metadata, manifest/checksum/provenance placeholders, and all runtime execution flags set to false. Deterministic SHA-256 values are computed over canonical fixture JSON content only.

Real worker execution, queue enqueue, job dispatch, job claim, job lease, sidecar spawn, subprocess spawn, tool execution, route execution, provider call, media processing, Supabase write, SQL, migration, storage object, signed URL, public artifact, generated asset, credit mutation, beta unlock, paid production unlock, production unlock, and \`generated_local_fixture_passed\` remain blocked.

Next prompt: \`${String(reports.decision.nextRecommendedPhase)}\`.

${NO_SCOPE_STATEMENT}
`)

  const passed = reports.decision.status === 'passed'
  const nextPromptPath = passed
    ? 'docs/implementation-prompts/prompt-worker-runtime-unlock-4-local-fixture-plan.md'
    : `docs/implementation-prompts/prompt-worker-runtime-unlock-3-fix-${String(reports.decision.decision)}.md`
  await writeVlmRuntimeTextArtifact(nextPromptPath, passed ? `# WORKER-RUNTIME-UNLOCK-4: Worker Runtime Local Fixture Plan

Proceed only after \`worker_runtime_fixture_hardening_passed_ready_for_local_fixture_plan\`.

Scope: plan a local, metadata-only fixture validation pass over the hardened worker runtime fixture packet. The future local fixture plan may read the hardened fixture JSON, manifest, checksums, and schema-version index, but it must remain no-real-execution unless a later owner explicitly approves a different phase.

Do not execute real workers, enqueue jobs, dispatch jobs, claim or lease jobs, mutate Supabase, execute SQL, deploy migrations, run providers, run tools/routes, process media, run Docker, run Cloud Run or Cloud Build, create signed URLs, create public artifacts, generate assets, mutate credits or billing, unlock beta, unlock paid production, unlock production, or claim \`generated_local_fixture_passed\`.
` : `# WORKER-RUNTIME-UNLOCK-3 Fix

Fix blocker: \`${String(reports.decision.decision)}\`.

Keep the fix metadata-only. Do not execute real workers, mutate Supabase, run SQL, call providers, run tools/routes, process media, create signed URLs or public artifacts, generate assets, mutate credits or billing, or unlock beta/production.
`)
}

export function readWorkerRuntimeFixtureHardeningSummary() {
  return readJson(path.join(WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR, 'worker_runtime_fixture_hardening_summary.json')) ??
    buildWorkerRuntimeFixtureHardeningReports().summary
}

export function getWorkerRuntimeFixtureHardeningTextCorpus() {
  return [
    ...WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_REPORTS.map((name) => path.join(WORKER_RUNTIME_FIXTURE_HARDENING_REPORT_DIR, name)),
    ...WORKER_RUNTIME_FIXTURE_HARDENING_EXPECTED_FIXTURES.map((name) => path.join(WORKER_RUNTIME_FIXTURE_HARDENING_FIXTURE_DIR, name)),
    'docs/worker-runtime-unlock-3-fixture-hardening.md',
    'docs/implementation-prompts/prompt-worker-runtime-unlock-4-local-fixture-plan.md',
  ].map((filePath) => ({ filePath, text: readText(filePath) }))
}
