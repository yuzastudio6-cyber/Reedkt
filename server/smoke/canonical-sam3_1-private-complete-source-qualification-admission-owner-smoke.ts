import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31PrivateCompleteSourceQualificationAdmission,
  canonicalSam31PrivateCompleteSourceQualificationAdmissionRef,
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionOwner,
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository,
} from '../services/canonical-sam3_1-private-complete-source-qualification-admission-owner'
import {
  assertCanonicalSam31PrivateQualificationCapacityObservation,
} from '../services/canonical-sam3_1-private-qualification-capacity-owner'
import {
  assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-serving-rate-authority'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  authority as sourceRateAuthority,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-smoke'
import {
  exact as sourcePreparationTerminal,
  plan,
  preparation,
} from './canonical-sam3_1-eight-minute-source-preparation-terminal-owner-smoke'
import {
  endpointCanonicalDriver as driverComponent,
  endpointCanonicalDeterministic as deterministicComponent,
  endpointCanonicalPerformance as performanceComponent,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority-smoke'
import {
  qualifiedSupplyChain,
} from './canonical-sam3_1-cloud-image-supply-chain-build-smoke'
import {
  current as sourceCapacity,
} from './canonical-sam3_1-private-qualification-capacity-owner-smoke'

const admittedAt = '2026-08-13T16:11:00.000Z'
const expiresAt = '2026-08-13T16:20:00.000Z'
if (!sourcePreparationTerminal) {
  throw new Error('Source preparation terminal fixture is absent.')
}

const capacity = currentCapacity()
export const rateAuthority = currentRateAuthority()
const owner =
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionOwner()
const request = {
  admissionId: 'sam31-private-complete-source-a100-run-1-admission',
  qualificationId: driverComponent.qualificationId,
  runOrdinal: 1,
  routeId: 'a100_80gb_heavy_primary' as const,
  qualificationSourcePlan: plan,
  sourcePreparation: preparation,
  sourcePreparationTerminal,
  privateQualificationCapacity: capacity,
  driverAndCudaComponent: driverComponent,
  deterministicRunSetComponent: deterministicComponent,
  imageSupplyChainRelease: qualifiedSupplyChain,
  accountEffectiveRateAuthority: rateAuthority,
  admittedAt,
  expiresAt,
}

export const admission = owner.admit(request)
assert.equal(admission.status,
  'ready_for_private_qualification_execution_only')
assert.equal(admission.qualificationExecutionAuthorized, true)
assert.equal(
  admission.finalRuntimeReleaseRequiredBeforeQualificationExecution,
  false,
)
assert.equal(admission.finalRuntimeReleaseMayConsumeThisAdmission, false)
assert.equal(admission.completeSourcePerformanceEvidencePending, true)
assert.equal(admission.independentTemporalQualityEvidencePending, true)
assert.equal(admission.runtimeReleaseGranted, false)
assert.equal(admission.trackAllAdmissionGranted, false)
assert.equal(admission.minimumIdleGpuInstances, 0)
assert.equal(admission.substantiveCpuExecutionAllowed, false)
assert.equal(admission.sourceResolutionReductionAllowed, false)
assert.equal(admission.automaticRetryOrFallbackAllowed, false)
assert.equal(admission.maximumCustomerToolCostCredits, 0)
assert.equal(admission.customerCreditsMutated, false)
assert.equal(admission.customerOrPublicDispatchAuthorized, false)
assert.equal(admission.productionAuthorityGranted, false)

const objects = new Map<string, Buffer>()
const repository =
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository({
    objectPort: memoryObjectPort(objects),
    prefix: 'private/smoke/sam31-complete-source-qualification-admissions',
  })
assert.equal(await repository.persistCreateOnly({ admission }), 'created')
assert.equal(await repository.persistCreateOnly({ admission }),
  'identical_replay')
assert.deepEqual(await repository.reread({
  admissionRef:
    canonicalSam31PrivateCompleteSourceQualificationAdmissionRef(admission),
  at: '2026-08-13T16:12:00.000Z',
}), admission)

assert.throws(() => owner.admit({
  ...request,
  deterministicRunSetComponent: performanceComponent,
}), /deterministic_run_set_component_missing/u)
assert.throws(() => owner.admit({
  ...request,
  routeId: 'l4_heavy_fallback',
}), /route_component_or_rate_changed/u)
assert.throws(() => owner.admit({
  ...request,
  expiresAt: '2026-08-13T16:25:31.000Z',
}), /capacity_expires_before_admission/u)
assert.throws(() => owner.admit({
  ...request,
  qualificationId: 'crossed-qualification',
}), /qualification_component_lineage_changed/u)
const changedImage = structuredClone(qualifiedSupplyChain)
changedImage.immutableImageDigest = `sha256:${'0'.repeat(64)}`
assert.throws(() => owner.admit({
  ...request,
  imageSupplyChainRelease: changedImage,
}))
assert.throws(() => assertCanonicalSam31PrivateCompleteSourceQualificationAdmission({
  ...admission,
  admissionHash: '0'.repeat(64),
}), /qualification-only admission changed/u)
assert.throws(() => assertCanonicalSam31PrivateCompleteSourceQualificationAdmission(
  admission,
  expiresAt,
), /qualification-only admission is stale/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-complete-source-qualification-admission-owner',
  checks: 31,
  routeId: admission.routeId,
  exactChunkCount: admission.exactChunkCount,
  qualificationExecutionAuthorized: admission.qualificationExecutionAuthorized,
  finalRuntimeReleaseRequiredBeforeQualificationExecution:
    admission.finalRuntimeReleaseRequiredBeforeQualificationExecution,
  runtimeReleaseGranted: admission.runtimeReleaseGranted,
  trackAllAdmissionGranted: admission.trackAllAdmissionGranted,
  customerCreditsMutated: admission.customerCreditsMutated,
  productionAuthorityGranted: admission.productionAuthorityGranted,
}))

function currentCapacity() {
  const payload: Partial<typeof sourceCapacity> =
    structuredClone(sourceCapacity)
  delete payload.observationHash
  return assertCanonicalSam31PrivateQualificationCapacityObservation({
    ...payload,
    observationId: 'sam31-private-capacity-current-for-a100-run-1',
    observedAt: '2026-08-13T16:10:30.000Z',
    expiresAt: '2026-08-13T16:25:30.000Z',
    observationHash: sha256AuthorityValue({
      ...payload,
      observationId: 'sam31-private-capacity-current-for-a100-run-1',
      observedAt: '2026-08-13T16:10:30.000Z',
      expiresAt: '2026-08-13T16:25:30.000Z',
    }),
  }, admittedAt)
}

function currentRateAuthority() {
  const payload: Partial<typeof sourceRateAuthority> =
    structuredClone(sourceRateAuthority)
  delete payload.rateAuthorityHash
  const currentPayload = {
    ...payload,
    rateAuthorityId: 'vertex-a100-serving-rate:smoke-20260813',
    pricingReadStartedAt: '2026-08-13T16:09:59.000Z',
    pricingReadFinishedAt: '2026-08-13T16:10:00.000Z',
    observedAt: '2026-08-13T16:10:00.000Z',
    expiresAt: '2026-08-14T16:10:00.000Z',
  }
  return assertCanonicalCurrentGoogleCloudVertexA100ServingRateAuthority({
    ...currentPayload,
    rateAuthorityHash: sha256AuthorityValue(currentPayload),
  }, admittedAt)
}

function memoryObjectPort(
  storage: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const current = storage.get(input.objectPath)
      if (current) {
        assert.deepEqual(current, input.body)
        return 'already_exists'
      }
      storage.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const current = storage.get(objectPath)
      return current ? Buffer.from(current) : null
    },
  }
}
