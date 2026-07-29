import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameComfyUiOperationAdmissionCandidate,
} from '../../src/types/living-frame-comfyui-operation-admission-candidate'
import {
  LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_OPEN_GATES,
} from '../../src/types/living-frame-comfyui-operation-admission-candidate'
import {
  LivingFrameComfyUiOperationAdmissionCandidateError,
  createLivingFrameComfyUiOperationAdmissionCandidate,
  verifyLivingFrameComfyUiOperationAdmissionCandidate,
} from '../living-frame/living-frame-comfyui-operation-admission-candidate'

const input = {
  candidateId:
    'living-frame.comfyui.canonical-operation-admission.001',
} as const

const candidate =
  await createLivingFrameComfyUiOperationAdmissionCandidate(input)

assert.equal(
  await verifyLivingFrameComfyUiOperationAdmissionCandidate(
    candidate,
    input,
  ),
  true,
)
assert.equal(
  candidate.currentRegistryObservation.productionToolIdentityCount,
  50,
)
assert.equal(
  candidate.currentRegistryObservation.catalogState,
  'non_e2e_evaluation_only',
)
assert.equal(
  candidate.currentRegistryObservation.productionToolIdentityPresent,
  false,
)
assert.equal(
  candidate.currentRegistryObservation.canonicalOperationPresent,
  false,
)
assert.equal(
  candidate.admissionDecision.executableToolIdentityCountRequested,
  1,
)
assert.equal(
  candidate.admissionDecision.representedCapabilityKeys.length,
  6,
)
assert.equal(
  candidate.admissionDecision.sixCapabilityToolIdentityFanoutAllowed,
  false,
)
assert.equal(
  candidate.admissionDecision.fiveGpuCapabilityChargesAllowed,
  false,
)
assert.equal(
  candidate.requestProjection.modelArtifactsTravelInOrdinaryArtifactBindings,
  false,
)
assert.equal(candidate.requestProjection.exactModelRoleCount, 5)
assert.equal(
  candidate.requestProjection.exactModelArtifactByteLength,
  11_700_367_157,
)
assert.equal(
  candidate.requestProjection.benchmarkRequestMaySubstituteForSelectedSceneRequest,
  false,
)
assert.equal(
  candidate.workerRuntimeExpectation.processEntrypointKind,
  'fixed_supervised_python_process',
)
assert.equal(
  candidate.workerRuntimeExpectation.genericEntrypointTypeCurrentlySupportsThisKind,
  false,
)
assert.equal(
  candidate.workerRuntimeExpectation.unprivilegedUid,
  65532,
)
assert.equal(
  candidate.workerRuntimeExpectation.unprivilegedGid,
  65532,
)
assert.equal(candidate.resourceCeilings.maximumNetworkRequests, 0)
assert.equal(candidate.resourceCeilings.maximumNetworkResponseBytes, 0)
assert.deepEqual(
  candidate.openGateCodes,
  LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_OPEN_GATES,
)
assert.equal(
  candidate.qaProjection.operationOutputAloneMayReachFinalExport,
  false,
)
assert.equal(
  candidate.costProjection.firstFiveCapabilitiesShareAttemptLifetime,
  true,
)
assert.equal(
  candidate.costProjection.auraFaceCpuQaExcludedFromGpuAttempt,
  true,
)
assert.equal(candidate.fallbackProjection.fallbackMayUseAiVideo, false)
assert.equal(candidate.registryMutated, false)
assert.equal(candidate.operationRegistered, false)
assert.equal(candidate.dispatchGranted, false)
assert.equal(candidate.runtimeExecuted, false)
assert.equal(candidate.productionReady, false)

for (const [key, value] of
  Object.entries(candidate.authorityBoundary)) {
  assert.equal(
    value,
    key === 'admissionCandidateCompilationAuthority',
    `${key} authority mismatch.`,
  )
}

const replay =
  await createLivingFrameComfyUiOperationAdmissionCandidate(input)
assert.equal(
  replay.candidateDigestSha256,
  candidate.candidateDigestSha256,
)

const fanoutForgery = resign({
  ...withoutDigest(candidate),
  admissionDecision: {
    ...candidate.admissionDecision,
    executableToolIdentityCountRequested: 6,
    sixCapabilityToolIdentityFanoutAllowed: true,
  },
})
assert.equal(
  await verifyLivingFrameComfyUiOperationAdmissionCandidate(
    fanoutForgery,
    input,
  ),
  false,
)

const modelBindingForgery = resign({
  ...withoutDigest(candidate),
  requestProjection: {
    ...candidate.requestProjection,
    modelArtifactsTravelInOrdinaryArtifactBindings: true,
  },
})
assert.equal(
  await verifyLivingFrameComfyUiOperationAdmissionCandidate(
    modelBindingForgery,
    input,
  ),
  false,
)

const benchmarkSubstitutionForgery = resign({
  ...withoutDigest(candidate),
  requestProjection: {
    ...candidate.requestProjection,
    benchmarkRequestMaySubstituteForSelectedSceneRequest: true,
    selectedSceneRequestProjectionImplemented: true,
  },
})
assert.equal(
  await verifyLivingFrameComfyUiOperationAdmissionCandidate(
    benchmarkSubstitutionForgery,
    input,
  ),
  false,
)

const callerEntrypointForgery = resign({
  ...withoutDigest(candidate),
  workerRuntimeExpectation: {
    ...candidate.workerRuntimeExpectation,
    callerExecutableArgumentsEnvironmentOrPathAllowed: true,
  },
})
assert.equal(
  await verifyLivingFrameComfyUiOperationAdmissionCandidate(
    callerEntrypointForgery,
    input,
  ),
  false,
)

const promotionForgery = resign({
  ...withoutDigest(candidate),
  registryMutated: true,
  operationRegistered: true,
  dispatchGranted: true,
  runtimeExecuted: true,
  productionReady: true,
})
assert.equal(
  await verifyLivingFrameComfyUiOperationAdmissionCandidate(
    promotionForgery,
    input,
  ),
  false,
)

let invalidInput: unknown
try {
  await createLivingFrameComfyUiOperationAdmissionCandidate({
    candidateId: 'invalid id',
  })
} catch (error) {
  invalidInput = error
}
assert.ok(
  invalidInput
    instanceof LivingFrameComfyUiOperationAdmissionCandidateError,
)
assert.deepEqual(invalidInput.issues, [{
  code: 'input_invalid',
  path: '$',
}])

console.log(JSON.stringify({
  status: 'passed',
  productionToolCountObserved:
    candidate.currentRegistryObservation.productionToolIdentityCount,
  requestedExecutableToolIdentityCount:
    candidate.admissionDecision.executableToolIdentityCountRequested,
  representedCapabilityCount:
    candidate.admissionDecision.representedCapabilityKeys.length,
  exactModelRoleCount:
    candidate.requestProjection.exactModelRoleCount,
  genericEntrypointExtensionRequired:
    !candidate.workerRuntimeExpectation
      .genericEntrypointTypeCurrentlySupportsThisKind,
  selectedSceneProjectionOpen:
    !candidate.requestProjection.selectedSceneRequestProjectionImplemented,
  openGateCount: candidate.openGateCodes.length,
  adversarialAssertions: 5,
  registryMutated: candidate.registryMutated,
  productionReady: candidate.productionReady,
}))

function withoutDigest(
  value: LivingFrameComfyUiOperationAdmissionCandidate,
): Record<string, unknown> {
  const clone =
    structuredClone(value) as unknown as Record<string, unknown>
  delete clone.candidateDigestSha256
  return clone
}

function resign(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...value,
    candidateDigestSha256: digest(value),
  }
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
}
