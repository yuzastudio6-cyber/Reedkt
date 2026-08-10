import assert from 'node:assert/strict'

import {
  admitCanonicalProfessionalToolGpuDispatch,
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  createCanonicalProfessionalToolGpuCostEstimate,
  type CanonicalProfessionalToolGpuUsage,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  a100,
  l4Fallback,
  l4Standard,
} from './canonical-professional-tool-gpu-cost-authority-smoke'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const admittedAt = '2026-08-02T16:10:00.000Z'
const expiresAt = '2026-08-02T16:15:00.000Z'
const hash = (character: string) => character.repeat(64)
const ref = (id: string, character: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${hash(character)}`,
})

const heavyEstimate = createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'fixture-estimate-sam31',
  scope: estimateScope('sam3_1'),
  primaryRateAuthority: a100,
  primaryUsageRange: range('a100', 60_000, 120_000, 240_000),
  fallbackRateAuthority: l4Fallback,
  fallbackUsageRange: range('l4', 120_000, 240_000, 420_000),
  primaryPreInferenceFailureHighUsage: usage('a100', 0),
  createdAt: admittedAt,
})
const standardEstimate = createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'fixture-estimate-ffmpeg',
  scope: estimateScope('ffmpeg'),
  primaryRateAuthority: l4Standard,
  primaryUsageRange: range('l4', 30_000, 60_000, 90_000),
  createdAt: admittedAt,
})
const successorEstimate = createCanonicalProfessionalToolGpuCostEstimate({
  estimateId: 'fixture-estimate-libass-gpu-successor',
  scope: estimateScope('libass'),
  primaryRateAuthority: l4Standard,
  primaryUsageRange: range('l4', 30_000, 60_000, 90_000),
  createdAt: admittedAt,
})

const a100Release = release({
  toolId: 'sam3_1',
  operationId: 'operation-sam3_1',
  toolCostProfileId: 'gpu-tool-sam3_1-v1',
  modelOrOperationCostProfileId:
    'sam3_1_multiplex_video_segmentation_v1',
  routeId: 'a100_80gb_heavy_primary',
})
const l4FallbackRelease = release({
  toolId: 'sam3_1',
  operationId: 'operation-sam3_1',
  toolCostProfileId: 'gpu-tool-sam3_1-v1',
  modelOrOperationCostProfileId:
    'sam3_1_multiplex_video_segmentation_v1',
  routeId: 'l4_heavy_fallback',
})
const l4StandardRelease = release({
  toolId: 'ffmpeg',
  operationId: 'operation-ffmpeg',
  toolCostProfileId: 'gpu-tool-ffmpeg-v1',
  modelOrOperationCostProfileId: 'l4_standard_media_render_and_qa_v1',
  routeId: 'l4_standard_primary',
})
const l4SuccessorRelease = release({
  toolId: 'libass',
  gpuExecutionOwnerBindingMode: 'declared_gpu_successor',
  gpuExecutionOwnerToolId: 'remotion',
  operationId: 'operation-libass',
  toolCostProfileId: 'gpu-tool-libass-v1',
  modelOrOperationCostProfileId: 'l4_standard_media_render_and_qa_v1',
  routeId: 'l4_standard_primary',
})

const primaryAdmission = admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-sam31-primary',
  estimate: heavyEstimate,
  runtimeRelease: a100Release,
  currentRateAuthority: a100,
  scope: admissionScope('sam3_1'),
  routeId: 'a100_80gb_heavy_primary',
  admittedAt,
  expiresAt,
})
assert.equal(primaryAdmission.admittedAttemptOrdinal, 1)
assert.equal(primaryAdmission.minimumIdleInstances, 0)
assert.equal(primaryAdmission.workDispatched, false)
assert.equal(primaryAdmission.gpuHostCpuOnlyExecutionMaySatisfyAdmission, false)

const fallbackAdmission = admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-sam31-fallback',
  estimate: heavyEstimate,
  runtimeRelease: l4FallbackRelease,
  currentRateAuthority: l4Fallback,
  scope: admissionScope('sam3_1'),
  routeId: 'l4_heavy_fallback',
  priorPrimaryTerminalReceiptRef: ref('fixture-primary-safe-failure', 'c'),
  priorPrimaryFailureClass:
    'a100_capacity_unavailable_before_attempt_start',
  priorPrimaryOutcomeKnownNotExecuted: true,
  admittedAt,
  expiresAt,
})
assert.equal(fallbackAdmission.admittedAttemptOrdinal, 2)
assert.equal(fallbackAdmission.unknownPriorOutcomeMayRetryOrFallback, false)

const standardAdmission = admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-ffmpeg-standard',
  estimate: standardEstimate,
  runtimeRelease: l4StandardRelease,
  currentRateAuthority: l4Standard,
  scope: admissionScope('ffmpeg'),
  routeId: 'l4_standard_primary',
  admittedAt,
  expiresAt,
})
assert.equal(standardAdmission.routeId, 'l4_standard_primary')
assert.equal(standardAdmission.userTriggeredScaleFromZero, true)
assert.equal(standardAdmission.stopAtTerminalAttempt, true)

const successorAdmission = admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-libass-successor',
  estimate: successorEstimate,
  runtimeRelease: l4SuccessorRelease,
  currentRateAuthority: l4Standard,
  scope: admissionScope('libass'),
  routeId: 'l4_standard_primary',
  admittedAt,
  expiresAt,
})
assert.equal(successorAdmission.toolId, 'libass')
assert.equal(l4SuccessorRelease.gpuExecutionOwnerToolId, 'remotion')

const wrongSuccessorRelease = release({
  toolId: 'libass',
  gpuExecutionOwnerBindingMode: 'declared_gpu_successor',
  gpuExecutionOwnerToolId: 'pixijs',
  operationId: 'operation-libass',
  toolCostProfileId: 'gpu-tool-libass-v1',
  modelOrOperationCostProfileId: 'l4_standard_media_render_and_qa_v1',
  routeId: 'l4_standard_primary',
})
assert.throws(() => admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-libass-wrong-successor-refused',
  estimate: successorEstimate,
  runtimeRelease: wrongSuccessorRelease,
  currentRateAuthority: l4Standard,
  scope: admissionScope('libass'),
  routeId: 'l4_standard_primary',
  admittedAt,
  expiresAt,
}), /differs/u)

const contractOnly = release({
  toolId: 'sam3_1',
  operationId: 'operation-sam3_1',
  toolCostProfileId: 'gpu-tool-sam3_1-v1',
  modelOrOperationCostProfileId:
    'sam3_1_multiplex_video_segmentation_v1',
  routeId: 'a100_80gb_heavy_primary',
  contractOnly: true,
})
assert.throws(() => admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-contract-only-refused',
  estimate: heavyEstimate,
  runtimeRelease: contractOnly,
  currentRateAuthority: a100,
  scope: admissionScope('sam3_1'),
  routeId: 'a100_80gb_heavy_primary',
  admittedAt,
  expiresAt,
}))
assert.throws(() => admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-fallback-without-safe-prior',
  estimate: heavyEstimate,
  runtimeRelease: l4FallbackRelease,
  currentRateAuthority: l4Fallback,
  scope: admissionScope('sam3_1'),
  routeId: 'l4_heavy_fallback',
  admittedAt,
  expiresAt,
}))
assert.throws(() => admitCanonicalProfessionalToolGpuDispatch({
  admissionId: 'fixture-admission-cross-tool-release',
  estimate: standardEstimate,
  runtimeRelease: a100Release,
  currentRateAuthority: l4Standard,
  scope: admissionScope('ffmpeg'),
  routeId: 'l4_standard_primary',
  admittedAt,
  expiresAt,
}))
const tampered = structuredClone(standardAdmission)
tampered.minimumIdleInstances = 1 as 0
assert.throws(() => assertCanonicalProfessionalToolGpuDispatchAdmission(
  tampered,
))

console.log(JSON.stringify({
  smoke: 'canonical-professional-tool-gpu-dispatch-admission',
  checks: 33,
  syntheticContractDataOnly: true,
  liveRuntimeReleaseObserved: false,
  primaryRoute: primaryAdmission.routeId,
  fallbackRoute: fallbackAdmission.routeId,
  standardRoute: standardAdmission.routeId,
  declaredGpuSuccessorRoute: successorAdmission.routeId,
  declaredGpuSuccessorExecutionOwner:
    l4SuccessorRelease.gpuExecutionOwnerToolId,
  minimumIdleInstances: standardAdmission.minimumIdleInstances,
  cpuOnlySubstantiveAdmission: standardAdmission
    .cpuOnlySubstantiveExecutionAllowed,
  workDispatched: standardAdmission.workDispatched,
  customerCreditsMutated: standardAdmission.customerCreditsMutated,
  admissionHashes: [
    primaryAdmission.admissionHash,
    fallbackAdmission.admissionHash,
    standardAdmission.admissionHash,
  ],
}))

function release(input: {
  toolId: 'sam3_1' | 'ffmpeg' | 'libass'
  gpuExecutionOwnerBindingMode?:
    | 'native_gpu_implementation'
    | 'declared_gpu_successor'
  gpuExecutionOwnerToolId?: 'sam3_1' | 'ffmpeg' | 'remotion' | 'pixijs'
  operationId: string
  toolCostProfileId: string
  modelOrOperationCostProfileId: string
  routeId:
    | 'a100_80gb_heavy_primary'
    | 'l4_heavy_fallback'
    | 'l4_standard_primary'
  contractOnly?: boolean
}) {
  const a100Route = input.routeId === 'a100_80gb_heavy_primary'
  const imageRef = ref(`fixture-image-${input.routeId}`, 'd')
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-runtime-release-observation-v3' as const,
    source: 'canonical_server_gpu_runtime_release_registry' as const,
    evidenceClass: input.contractOnly
      ? 'synthetic_contract_fixture' as const
      : 'canonical_private_reread' as const,
    releaseId: `fixture-release-${input.toolId}-${input.routeId}`,
    releaseVersion: 1,
    status: input.contractOnly
      ? 'contract_only' as const
      : 'private_internal_qualified' as const,
    toolId: input.toolId,
    gpuExecutionOwnerBindingMode:
      input.gpuExecutionOwnerBindingMode ??
        'native_gpu_implementation' as const,
    gpuExecutionOwnerToolId: input.gpuExecutionOwnerToolId ?? input.toolId,
    legacyToolSubstantiveExecutionObserved: false as const,
    operationId: input.operationId,
    toolCostProfileId: input.toolCostProfileId,
    modelOrOperationCostProfileId: input.modelOrOperationCostProfileId,
    routeId: input.routeId,
    runtimeRegion: 'us-central1' as const,
    executionTarget: a100Route
      ? 'google_cloud_vertex_custom_job_a2_ultra' as const
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
    serviceIdentityRef: ref('fixture-service-identity', '1'),
    immutableImageRef: imageRef,
    immutableImageDigest: imageRef.contentHash,
    sourceAndDependencyClosureRef: ref('fixture-source-closure', '2'),
    toolOrModelArtifactReleaseRef: ref('fixture-artifact-release', '3'),
    sbomRef: ref('fixture-sbom', '4'),
    imageScanAndSignatureRef: ref('fixture-image-scan', '5'),
    cudaDriverRuntimeQualificationRef: ref('fixture-cuda-qualification', '6'),
    substantiveGpuExecutionQualificationRef:
      ref('fixture-substantive-gpu-qualification', '7'),
    scaleToZeroConfigurationRef: ref('fixture-scale-zero', '8'),
    privateNetworkAndArtifactTransportRef: ref('fixture-network', '9'),
    substantiveGpuEvidenceClass: input.toolId === 'sam3_1'
      ? 'cuda_model_inference_and_nvdec' as const
      : input.toolId === 'libass'
        ? 'gpu_render_execution' as const
        : 'nvenc_nvdec_hardware_codec_execution' as const,
    exactToolOrModelVersionReread: !input.contractOnly,
    exactCudaAndNativeDependencyClosureReread: !input.contractOnly,
    actualGpuKernelModelRenderOrHardwareCodecMeasured: !input.contractOnly,
    cpuOnlySubstantiveExecutionObserved: false as const,
    gpuHostCpuOnlyExecutionMaySatisfyQualification: false as const,
    runtimeNetworkDownloadAllowed: false as const,
    callerImageModelToolOrCommandSelectionAllowed: false as const,
    minimumIdleInstances: 0 as const,
    maximumConcurrentAttemptsPerInstance: 1 as const,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
    startsOnlyFromCreateOnlyApprovedUserAttempt: true as const,
    stopsAtTerminalAttempt: true as const,
    qualificationRunCount: input.contractOnly ? 1 : 30,
    qualifiedAt: '2026-08-02T16:05:00.000Z',
    expiresAt: '2026-09-01T16:05:00.000Z',
    privateInternalQualified: !input.contractOnly,
    customerBillingAuthorityGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionQualified: false as const,
  }
  return canonicalProfessionalToolGpuRuntimeReleaseSchema.parse({
    ...payload,
    releaseHash: sha256AuthorityValue(payload),
  })
}

function estimateScope(toolId: 'sam3_1' | 'ffmpeg' | 'libass') {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersion: 1,
    editPlanHash: hash('a'),
    outputId: 'output-1',
    operationId: `operation-${toolId}`,
    plannedWorkItemRef: ref(`work-${toolId}`, 'b'),
    toolId,
    exactToolOrModelReleaseRef: ref('fixture-artifact-release', '3'),
  }
}

function admissionScope(toolId: 'sam3_1' | 'ffmpeg' | 'libass') {
  return {
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    editPlanId: 'edit-plan-1',
    editPlanVersion: 1,
    approvedSnapshotRef: ref('approved-snapshot', '1'),
    confirmedOutputFrameRef: ref('confirmed-output-frame', '2'),
    masterTimingRef: ref('master-timing', '3'),
    approvedWorkItemRef: ref(`work-${toolId}`, 'b'),
    workerLeaseRef: ref(`lease-${toolId}`, '4'),
    fundedReservationRef: ref(`reservation-${toolId}`, '5'),
    userApprovalRecordRef: ref('user-approval', '6'),
    userTriggerRecordRef: ref('user-trigger', '7'),
    executionAttemptRef: ref(`attempt-${toolId}`, '8'),
    idempotencyKey: `idempotency-${toolId}`,
  }
}

function usage(
  route: 'a100' | 'l4',
  activeGpuMilliseconds: number,
): CanonicalProfessionalToolGpuUsage {
  const coldStartMilliseconds = 10_000
  const runtimeAndModelLoadMilliseconds = activeGpuMilliseconds === 0
    ? 0
    : 20_000
  const drainAndShutdownMilliseconds = 2_000
  return {
    coldStartMilliseconds,
    runtimeAndModelLoadMilliseconds,
    activeGpuMilliseconds,
    drainAndShutdownMilliseconds,
    totalBillableMilliseconds: coldStartMilliseconds
      + runtimeAndModelLoadMilliseconds
      + activeGpuMilliseconds
      + drainAndShutdownMilliseconds,
    allocatedGpuCount: 1,
    allocatedVcpuCount: route === 'a100' ? 12 : 8,
    allocatedMemoryGiB: route === 'a100' ? 170 : 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes: 64 * 1024 * 1024,
    privateArtifactRetentionMilliseconds: 24 * 60 * 60 * 1_000,
    networkEgressBytes: 0,
    classAOperationCount: 4,
    classBOperationCount: 8,
  }
}

function range(
  route: 'a100' | 'l4',
  low: number,
  expected: number,
  high: number,
) {
  return {
    low: usage(route, low),
    expected: usage(route, expected),
    high: usage(route, high),
  }
}
