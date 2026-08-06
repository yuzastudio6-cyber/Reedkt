import assert from 'node:assert/strict'
import { loadRuntimeEnv, type RuntimeEnv } from '../config/env'
import { EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS } from '../edit-references/edit-reference-production-readiness'
import { PrivateEditReferenceLongFormStudyRepository } from '../edit-references/private-edit-reference-long-form-study-repository'
import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION,
  assertEditReferenceLongFormRuntimePortIsNotProduction,
  createBackendLocalEditReferenceLongFormStudyRuntimePort,
  resolveEditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudyRuntimePort,
} from '../services/edit-reference-production-long-form-runtime-port'

const localEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  LOCAL_STORAGE_ROOT: '/tmp/reeditpro-edit-reference-long-form-runtime-port-smoke',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const hostedEnv: RuntimeEnv = {
  ...localEnv,
  nodeEnv: 'production',
  mode: 'cloud_run',
  storageMode: 'gcs_disabled',
  largeMediaFinalizationMode: 'disabled',
  workerRuntimeMode: 'cloud_run',
  allowMockWithoutSupabase: false,
  mockOnly: false,
}
const protectedMockWorkerEnv: RuntimeEnv = {
  ...localEnv,
  workerRuntimeMode: 'mock',
  mockOnly: true,
}

const local = resolveEditReferenceLongFormStudyRuntimePort({ env: localEnv })
assert.equal(local.schemaVersion, EDIT_REFERENCE_PRODUCTION_LONG_FORM_RUNTIME_PORT_VERSION)
assert.equal(local.authorityClass, 'pre_plan_edit_reference_long_form_study')
assert.equal(local.sourceAuthority, 'backend_local_private_segmented')
assert.equal(local.evidenceClass, 'backend_local_private_only')
assert.equal(local.productionAuthority, false)
assert.equal(local.approvedEditAuthorityFabricated, false)
assert.equal(local.approvedEditPlanSnapshotRequired, false)
assert.equal(local.approvedEditCreditReservationRequired, false)
assert.equal(local.browserClaimAllowed, false)
assert.equal(local.browserSessionRequiredForCompletion, false)
assert.equal(local.customerPriceCalculated, false)
assert.equal(local.customerCreditsMutated, false)
assert.equal(local.serviceFeeIncluded, false)
assert.equal(local.canonicalWorkerSpineRequired, true)
assert.equal(local.createsSecondProductionQueueOrRepository, false)
assert.equal(local.databaseTransactionAdapterVerified, false)
assert.equal(local.multiReplicaLeaseRecoveryVerified, false)
assert.equal(local.authenticatedWorkerDispatchVerified, false)
assert.equal(local.livePrivateObjectReadVerified, false)
assertEditReferenceLongFormRuntimePortIsNotProduction(local)
assert.strictEqual(
  resolveEditReferenceLongFormStudyRuntimePort({ env: localEnv, runtimePort: local }),
  local,
)
const protectedMockWorker = resolveEditReferenceLongFormStudyRuntimePort({
  env: protectedMockWorkerEnv,
})
assert.equal(protectedMockWorker.evidenceClass, 'backend_local_private_only')
assert.equal(protectedMockWorker.productionAuthority, false)
assertEditReferenceLongFormRuntimePortIsNotProduction(protectedMockWorker)

assert.throws(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env: localEnv,
    runtimePort: local,
    localRepository: new PrivateEditReferenceLongFormStudyRepository(),
  }),
  (error) => hasRuntimeReason(error, 'runtime_port_and_local_legacy_adapters_mixed'),
)
assert.throws(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env: localEnv,
    runtimePort: {
      ...local,
      databaseTransactionAdapterVerified: true,
    },
  }),
  (error) => hasRuntimeReason(error, 'local_runtime_port_authority_invalid'),
  'Protected-local evidence must not claim a verified production database adapter.',
)
assert.throws(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env: localEnv,
    runtimePort: {
      ...local,
      sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
      evidenceClass: 'backend_local_private_only',
      databaseTransactionAdapterVerified: true,
    },
  }),
  (error) => hasRuntimeReason(error, 'local_runtime_port_authority_invalid'),
  'Canonical V3 local source authority must not use legacy local-only evidence.',
)
assert.throws(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env: localEnv,
    runtimePort: {
      ...local,
      sourceAuthority: 'canonical_v3_loopback_postgres_pre_plan_study',
      evidenceClass: 'canonical_contract_fixture_unreleased',
      databaseTransactionAdapterVerified: false,
    },
  }),
  (error) => hasRuntimeReason(error, 'local_runtime_port_authority_invalid'),
  'Canonical V3 local evidence must remain bound to a verified database adapter.',
)
assert.throws(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env: hostedEnv,
    localRepository: new PrivateEditReferenceLongFormStudyRepository(),
  }),
  (error) => hasRuntimeReason(error, 'hosted_runtime_cannot_mount_local_long_form_adapters'),
)

const blocked = resolveEditReferenceLongFormStudyRuntimePort({ env: hostedEnv })
assert.equal(blocked.sourceAuthority, 'unavailable')
assert.equal(blocked.evidenceClass, 'blocked_missing_canonical_runtime')
assert.equal(blocked.productionAuthority, false)
assertEditReferenceLongFormRuntimePortIsNotProduction(blocked)
await assert.rejects(
  blocked.read({
    scope: {
      localStorageRoot: localEnv.localStorageRoot,
      ownerUserId: 'user-runtime-port-smoke',
      workspaceId: 'workspace-runtime-port-smoke',
    },
    runId: 'run-runtime-port-smoke',
  }),
  (error) => {
    if (!hasRuntimeReason(error, 'canonical_production_long_form_runtime_missing')) return false
    const requiredAssertions = runtimeDetails(error).requiredAssertions
    const durableGate = EDIT_REFERENCE_PRODUCTION_GATE_DEFINITIONS.find((gate) => (
      gate.id === 'durable_long_form_study'
    ))
    assert.deepEqual(requiredAssertions, durableGate?.assertions)
    assert.equal(runtimeDetails(error).localFallbackAllowed, false)
    assert.equal(runtimeDetails(error).productionReady, false)
    return true
  },
)

const forgedProductionPort: EditReferenceLongFormStudyRuntimePort = {
  ...createBackendLocalEditReferenceLongFormStudyRuntimePort(),
  sourceAuthority: 'canonical_edit_reference_production_repository',
  evidenceClass: 'canonical_backend_verified_runtime',
  productionAuthority: true,
  databaseTransactionAdapterVerified: true,
  multiReplicaLeaseRecoveryVerified: true,
  authenticatedWorkerDispatchVerified: true,
  livePrivateObjectReadVerified: true,
}
assert.throws(
  () => resolveEditReferenceLongFormStudyRuntimePort({
    env: hostedEnv,
    runtimePort: forgedProductionPort,
  }),
  (error) => hasRuntimeReason(error, 'canonical_production_long_form_runtime_not_qualified'),
  'Caller-asserted booleans must not qualify a production runtime adapter.',
)
assert.throws(
  () => assertEditReferenceLongFormRuntimePortIsNotProduction(forgedProductionPort),
  (error) => hasRuntimeReason(error, 'runtime_port_unexpectedly_has_production_authority'),
)

console.log(JSON.stringify({
  status: 'passed',
  schemaVersion: local.schemaVersion,
  persistenceContractVersion: local.persistenceContractVersion,
  localEvidenceClass: local.evidenceClass,
  protectedMockWorkerEvidenceClass: protectedMockWorker.evidenceClass,
  hostedEvidenceClass: blocked.evidenceClass,
  prePlanAuthority: local.authorityClass,
  canonicalWorkerSpineRequired: local.canonicalWorkerSpineRequired,
  forgedProductionAdapterAccepted: false,
  liveProductionFactoryExists: false,
  providerRequestMade: false,
  remoteMutationAttempted: false,
  customerPriceCalculated: false,
  customerCreditsMutated: false,
  serviceFeeIncluded: false,
  productionReady: false,
}, null, 2))

function hasRuntimeReason(error: unknown, reason: string): boolean {
  return error instanceof ApiError
    && error.code === 'JOB_DEPENDENCY_NOT_READY'
    && runtimeDetails(error).reason === reason
}

function runtimeDetails(error: unknown): Record<string, unknown> {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== 'object') return {}
  return error.details as Record<string, unknown>
}
