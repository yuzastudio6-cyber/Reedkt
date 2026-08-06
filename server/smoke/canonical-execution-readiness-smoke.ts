import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalExecutionReadinessService,
} from '../services/canonical-execution-readiness-service'
import {
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

// Reuse the full canonical authority integration setup. It creates real
// server-owned plan, preference, source-media, approval, reservation, planned
// asset, derived-job, and execution-package evidence in a private temp root.
await import('./edit-planning-authority-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const userId = 'user-authority-smoke'
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'canonical-execution-readiness-smoke',
  auth: { userId, isMockUser: true },
}
const aggregate = await readPrivateEditAuthorityAggregate({
  localStorageRoot,
  ownerUserId: userId,
  workspaceId,
})
assert.ok(aggregate)
const snapshot = aggregate.snapshots.find((candidate) =>
  aggregate.executionPackages.some((executionPackage) => executionPackage.snapshotId === candidate.snapshotId))
assert.ok(snapshot)
const rootJob = aggregate.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.dependencyJobIds.length === 0)
const dependentJob = aggregate.jobs.find((candidate) =>
  candidate.snapshotId === snapshot.snapshotId && candidate.dependencyJobIds.length > 0)
assert.ok(rootJob)
assert.ok(dependentJob)

const service = createCanonicalExecutionReadinessService(context)
const rootResult = await service.inspectJob({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: rootJob.id,
  purpose: 'private_internal_dry_run_readiness',
})
const rootEnvelope = rootResult.executionReadinessEnvelope
assert.equal(rootEnvelope.source, 'immutable_canonical_edit_authority')
assert.equal(rootEnvelope.readinessState, 'authority_verified_runtime_blocked')
assert.equal(rootEnvelope.dependencyEvidenceState, 'not_required_for_root_job')
assert.equal(rootEnvelope.gates.dependencyEvidence, 'not_required')
assert.equal(rootEnvelope.gates.tenantBoundLease, 'separate_authority_not_issued')
assert.equal(rootEnvelope.gates.runtimeToolEvidence, 'separate_authority_not_evaluated')
assert.equal(rootEnvelope.gates.producedArtifactAuthority, 'separate_authority_not_evaluated')
assert.equal(rootEnvelope.gates.qaResultAuthority, 'separate_authority_not_evaluated')
assert.equal(rootEnvelope.gates.dispatch, 'not_authorized')
assert.equal(rootEnvelope.claimAuthorized, false)
assert.equal(rootEnvelope.dispatchAuthorized, false)
assert.equal(rootEnvelope.toolExecutionAuthorized, false)
assert.equal(rootEnvelope.providerCallAuthorized, false)
assert.equal(rootEnvelope.artifactWriteAuthorized, false)
assert.equal(rootEnvelope.renderAuthorized, false)
assert.equal(rootEnvelope.creditSpendAuthorized, false)
assert.equal(rootEnvelope.noRuntimeSideEffects, true)
assert.equal(rootEnvelope.expectedAssets.length, rootJob.expectedAssetIds.length)
assert.deepEqual(rootEnvelope.expectedAssets.map((asset) => asset.assetId), rootJob.expectedAssetIds)
assert.deepEqual(rootEnvelope.job.executionInputRef, rootJob.executionInputRef)
assert.equal(rootEnvelope.authorityHashes.snapshotHash, snapshot.snapshotHash)
assert.equal(rootEnvelope.authorityHashes.approvedAssetManifestHash, snapshot.approvedAssetManifestHash)
assert.equal(rootEnvelope.authorityHashes.approvedSourceAssetManifestHash, snapshot.approvedSourceAssetManifestHash)
const { envelopeHash, ...rootEnvelopeWithoutHash } = rootEnvelope
assert.equal(envelopeHash, sha256AuthorityValue(rootEnvelopeWithoutHash))
const serializedRootEnvelope = JSON.stringify(rootEnvelope)
assert.equal(serializedRootEnvelope.includes('bucketName'), false)
assert.equal(serializedRootEnvelope.includes('objectPath'), false)
assert.equal(serializedRootEnvelope.includes('executionInput'), true, 'Only the content-addressed input reference should be present.')
assert.equal(serializedRootEnvelope.includes('"operation"'), false, 'Raw approved execution payload must not be copied into the envelope.')
assert.equal(serializedRootEnvelope.includes('has not been implemented'), false, 'Read-only readiness must not describe separately implemented authorities as missing.')

const dependentResult = await service.inspectJob({
  workspaceId,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  jobId: dependentJob.id,
  purpose: 'private_internal_dry_run_readiness',
})
const dependentEnvelope = dependentResult.executionReadinessEnvelope
assert.equal(dependentEnvelope.readinessState, 'dependency_evidence_required_runtime_blocked')
assert.equal(dependentEnvelope.dependencyEvidenceState, 'required_results_and_qa_not_committed')
assert.equal(dependentEnvelope.gates.dependencyEvidence, 'blocked_pending_results_and_qa')
assert.equal(dependentEnvelope.dependencies.length, dependentJob.dependencyJobIds.length)
assert.ok(dependentEnvelope.dependencies.every((dependency) =>
  dependency.completionEvidenceState === 'not_committed' &&
  dependency.qaEvidenceState === 'not_committed' &&
  dependency.dependencySatisfied === false))

await expectApiError(
  () => service.inspectJob({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: 'authority_job_not_present',
    purpose: 'private_internal_dry_run_readiness',
  }),
  'JOB_NOT_FOUND',
)

await expectApiError(
  () => service.inspectJob({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: rootJob.id,
    purpose: 'private_internal_dry_run_readiness',
    approvedPlanSnapshot: { callerAuthored: true },
  } as never),
  'VALIDATION_FAILED',
)

await expectApiError(
  () => service.inspectJob({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: 'another-edit-session',
    jobId: rootJob.id,
    purpose: 'private_internal_dry_run_readiness',
  }),
  'JOB_NOT_FOUND',
)

await expectApiError(
  () => createCanonicalExecutionReadinessService({
    ...context,
    env: loadRuntimeEnv({
      NODE_ENV: 'production',
      E2E_RUNTIME_MODE: 'cloud_run',
      WORKER_RUNTIME_MODE: 'disabled',
      STORAGE_MODE: 'gcs_disabled',
      API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-placeholder',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
      REEDITPRO_INTERNAL_SERVICE_TOKEN: 'internal-placeholder',
    }),
  }).inspectJob({
    workspaceId,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    jobId: rootJob.id,
    purpose: 'private_internal_dry_run_readiness',
  }),
  'TOOL_NOT_READY',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'strict_identity_only_request',
    'immutable_snapshot_plan_estimate_work_graph_revalidation',
    'planning_preference_brief_binding_revalidation',
    'live_source_identity_and_source_manifest_revalidation',
    'planned_asset_manifest_and_expected_output_revalidation',
    'execution_package_and_tool_manifest_revalidation',
    'root_dependency_readiness_without_dispatch',
    'dependent_job_results_and_qa_remain_blocked',
    'no_raw_execution_or_storage_payload_exposure',
    'no_lease_claim_provider_tool_artifact_render_or_credit_authority',
    'project_session_job_scope_isolation',
    'production_fail_closed',
  ],
}))

async function expectApiError(
  action: () => Promise<unknown>,
  code: string,
): Promise<void> {
  try {
    await action()
    assert.fail(`Expected ${code}.`)
  } catch (error) {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, code)
  }
}
