import assert from 'node:assert/strict'

import {
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31PrivateInternalDispatchAllowed,
  assertCanonicalSam31PrivateInternalDispatchReadiness,
  createCanonicalSam31PrivateInternalDispatchReadinessOwner,
} from '../services/canonical-sam3_1-private-internal-dispatch-readiness-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  a100,
  l4Fallback,
} from './canonical-professional-tool-gpu-cost-authority-smoke'
import {
  ready,
  readyObservation,
} from './canonical-sam3_1-private-internal-release-readiness-owner-smoke'

const observedAt = '2026-08-02T16:05:00.000Z'
const expiresAt = '2026-08-02T16:10:00.000Z'
const a100Observation = readyObservation('a100_80gb_heavy_primary')
const l4Observation = readyObservation('l4_heavy_fallback')
const a100Release = release('a100_80gb_heavy_primary')
const l4Release = release('l4_heavy_fallback')
const owner = createCanonicalSam31PrivateInternalDispatchReadinessOwner()

const dispatchReadiness = owner.observe({
  readinessId: 'sam31-private-internal-sequential-dispatch-ready',
  privateInternalReleaseReadiness: ready,
  a100RouteReadinessObservation: a100Observation,
  l4RouteReadinessObservation: l4Observation,
  a100RuntimeRelease: a100Release,
  l4RuntimeRelease: l4Release,
  currentA100RateAuthority: a100,
  currentL4RateAuthority: l4Fallback,
  observedAt,
  expiresAt,
})

assert.equal(dispatchReadiness.status,
  'ready_for_private_internal_sequential_dispatch')
assert.equal(dispatchReadiness.privateInternalSequentialDispatchAuthorized,
  true)
assert.equal(dispatchReadiness.maximumSimultaneousPrivateA100Attempts, 1)
assert.equal(dispatchReadiness.maximumSimultaneousPrivateL4Attempts, 1)
assert.equal(dispatchReadiness.publicConcurrencyCapacityRequired, false)
assert.equal(dispatchReadiness.publicConcurrencyA100Target, 16)
assert.equal(dispatchReadiness.publicConcurrencyL4Target, 16)
assert.equal(dispatchReadiness.customerOrPublicDispatchAuthorized, false)
assert.equal(dispatchReadiness.cpuOnlySubstantiveExecutionAllowed, false)
assert.deepEqual(
  assertCanonicalSam31PrivateInternalDispatchReadiness(
    dispatchReadiness,
    observedAt,
  ),
  dispatchReadiness,
)

const a100ReleaseRef = releaseRef(a100Release)
const a100RateRef = rateRef(a100)
assert.deepEqual(assertCanonicalSam31PrivateInternalDispatchAllowed({
  readiness: dispatchReadiness,
  routeId: 'a100_80gb_heavy_primary',
  runtimeReleaseRef: a100ReleaseRef,
  rateAuthorityRef: a100RateRef,
  immutableImageDigest: a100Release.immutableImageDigest,
  at: observedAt,
}), dispatchReadiness)

assert.throws(() => owner.observe({
  readinessId: 'sam31-private-internal-crossed-release',
  privateInternalReleaseReadiness: ready,
  a100RouteReadinessObservation: a100Observation,
  l4RouteReadinessObservation: l4Observation,
  a100RuntimeRelease: l4Release,
  l4RuntimeRelease: a100Release,
  currentA100RateAuthority: a100,
  currentL4RateAuthority: l4Fallback,
  observedAt,
  expiresAt,
}))
assert.throws(() => owner.observe({
  readinessId: 'sam31-private-internal-crossed-rate',
  privateInternalReleaseReadiness: ready,
  a100RouteReadinessObservation: a100Observation,
  l4RouteReadinessObservation: l4Observation,
  a100RuntimeRelease: a100Release,
  l4RuntimeRelease: l4Release,
  currentA100RateAuthority: l4Fallback,
  currentL4RateAuthority: a100,
  observedAt,
  expiresAt,
}))
assert.throws(() => owner.observe({
  readinessId: 'sam31-private-internal-image-mismatch',
  privateInternalReleaseReadiness: ready,
  a100RouteReadinessObservation: a100Observation,
  l4RouteReadinessObservation: l4Observation,
  a100RuntimeRelease: {
    ...a100Release,
    immutableImageDigest: `sha256:${'c'.repeat(64)}`,
  },
  l4RuntimeRelease: l4Release,
  currentA100RateAuthority: a100,
  currentL4RateAuthority: l4Fallback,
  observedAt,
  expiresAt,
}))
assert.throws(() => assertCanonicalSam31PrivateInternalDispatchAllowed({
  readiness: dispatchReadiness,
  routeId: 'a100_80gb_heavy_primary',
  runtimeReleaseRef: {
    ...a100ReleaseRef,
    contentHash: `sha256:${'0'.repeat(64)}`,
  },
  rateAuthorityRef: a100RateRef,
  immutableImageDigest: a100Release.immutableImageDigest,
  at: observedAt,
}))
assert.throws(() => assertCanonicalSam31PrivateInternalDispatchReadiness(
  dispatchReadiness,
  expiresAt,
))
assert.throws(() => assertCanonicalSam31PrivateInternalDispatchReadiness({
  ...dispatchReadiness,
  readinessHash: '0'.repeat(64),
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-private-internal-dispatch-readiness-owner',
  checks: 32,
  oneA100AndQualifiedL4CanAuthorizePrivateSequentialDispatch: true,
  sixteenA100OrL4RequiredForPrivateInternal: false,
  exactReleaseRateCapacityAndFourComponentLineageRequired: true,
  customerOrPublicDispatchAuthorized: false,
  gpuJobDispatched: dispatchReadiness.gpuJobDispatched,
  customerCreditsMutated: dispatchReadiness.customerCreditsMutated,
}))

function release(
  routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback',
) {
  const a100Route = routeId === 'a100_80gb_heavy_primary'
  const imageDigest = a100Route
    ? a100Observation.immutableImageDigest
    : l4Observation.immutableImageDigest
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-runtime-release-observation-v3' as const,
    source: 'canonical_server_gpu_runtime_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseId: `fixture-sam31-${routeId}-private-release`,
    releaseVersion: 1,
    status: 'private_internal_qualified' as const,
    toolId: 'sam3_1' as const,
    gpuExecutionOwnerBindingMode: 'native_gpu_implementation' as const,
    gpuExecutionOwnerToolId: 'sam3_1' as const,
    legacyToolSubstantiveExecutionObserved: false as const,
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    toolCostProfileId: 'gpu-tool-sam3_1-v1',
    modelOrOperationCostProfileId:
      'sam3_1_multiplex_video_segmentation_v1',
    routeId,
    runtimeRegion: 'us-central1' as const,
    executionTarget: a100Route
      ? 'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra' as const
      : 'google_cloud_run_l4_job' as const,
    machineType: a100Route
      ? 'a2-ultragpu-1g' as const
      : 'cloud_run_nvidia_l4' as const,
    accelerator: a100Route
      ? 'nvidia_a100_80gb' as const
      : 'nvidia_l4' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: a100Route ? 12 as const : 8 as const,
    allocatedMemoryGiB: a100Route ? 170 as const : 32 as const,
    allocatedLocalScratchGiB: 0 as const,
    serviceIdentityRef: ref(`service-${routeId}`, '1'),
    immutableImageRef: {
      id: `image-${routeId}`,
      version: 1,
      contentHash: imageDigest,
    },
    immutableImageDigest: imageDigest,
    sourceAndDependencyClosureRef: ref(`source-${routeId}`, '2'),
    toolOrModelArtifactReleaseRef: ref('sam31-multiplex-artifact', '3'),
    sbomRef: ref(`sbom-${routeId}`, '4'),
    imageScanAndSignatureRef: ref(`scan-${routeId}`, '5'),
    cudaDriverRuntimeQualificationRef: ref(`driver-${routeId}`, '6'),
    substantiveGpuExecutionQualificationRef:
      ref(`qualification-${routeId}`, '7'),
    scaleToZeroConfigurationRef: ref(`scale-zero-${routeId}`, '8'),
    privateNetworkAndArtifactTransportRef: ref(`network-${routeId}`, '9'),
    substantiveGpuEvidenceClass:
      'cuda_model_inference_and_nvdec' as const,
    exactToolOrModelVersionReread: true,
    exactCudaAndNativeDependencyClosureReread: true,
    actualGpuKernelModelRenderOrHardwareCodecMeasured: true,
    cpuOnlySubstantiveExecutionObserved: false as const,
    gpuHostCpuOnlyExecutionMaySatisfyQualification: false as const,
    runtimeNetworkDownloadAllowed: false as const,
    callerImageModelToolOrCommandSelectionAllowed: false as const,
    minimumIdleInstances: 0 as const,
    maximumConcurrentAttemptsPerInstance: 1 as const,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
    startsOnlyFromCreateOnlyApprovedUserAttempt: true as const,
    stopsAtTerminalAttempt: !a100Route,
    lifecycleMode: a100Route
      ? 'idle_scaledown_to_zero' as const
      : 'terminal_attempt_teardown' as const,
    returnsToZeroAfterIdle: true as const,
    idleScaleDownSeconds: a100Route ? 300 as const : 0 as const,
    qualificationRunCount: 30,
    qualifiedAt: '2026-08-02T16:00:00.000Z',
    expiresAt: '2026-09-01T16:00:00.000Z',
    privateInternalQualified: true,
    customerBillingAuthorityGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionQualified: false as const,
  }
  return canonicalProfessionalToolGpuRuntimeReleaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

function ref(id: string, character: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${character.repeat(64)}`,
  }
}

function releaseRef(value: typeof a100Release) {
  return {
    id: value.releaseId,
    version: value.releaseVersion,
    contentHash: `sha256:${value.releaseHash}`,
  }
}

function rateRef(value: typeof a100) {
  return {
    id: value.rateAuthorityId,
    version: value.rateAuthorityVersion,
    contentHash: `sha256:${value.rateAuthorityHash}`,
  }
}
