import { z } from 'zod'

import {
  assertCanonicalQualityFirstProfessionalToolGpuPlacement,
  createCanonicalQualityFirstProfessionalToolGpuPlacement,
} from './canonical-quality-first-professional-tool-gpu-placement'
import {
  assertCanonicalQualityFirstUserTriggeredGpuPolicy,
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from './canonical-quality-first-user-triggered-gpu-policy'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  assertCanonicalProfessionalToolGpuCostEstimate,
  type CanonicalProfessionalToolGpuCostEstimate,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { ALL_PROFESSIONAL_TOOL_CATALOG_IDS } from '../tool-registry'

export const CANONICAL_PROFESSIONAL_TOOL_GPU_RUNTIME_RELEASE_VERSION =
  'canonical-professional-tool-gpu-runtime-release-observation-v2' as const
export const CANONICAL_PROFESSIONAL_TOOL_GPU_DISPATCH_ADMISSION_VERSION =
  'canonical-professional-tool-gpu-dispatch-admission-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const toolIdSchema = z.enum(ALL_PROFESSIONAL_TOOL_CATALOG_IDS)
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const runtimeReleaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_TOOL_GPU_RUNTIME_RELEASE_VERSION,
  ),
  source: z.literal('canonical_server_gpu_runtime_release_registry'),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  releaseId: safeId,
  releaseVersion: positiveInteger,
  status: z.enum(['contract_only', 'private_internal_qualified']),
  toolId: toolIdSchema,
  gpuExecutionOwnerBindingMode: z.enum([
    'native_gpu_implementation',
    'declared_gpu_successor',
  ]),
  gpuExecutionOwnerToolId: toolIdSchema,
  legacyToolSubstantiveExecutionObserved: z.literal(false),
  operationId: safeId,
  toolCostProfileId: safeId,
  modelOrOperationCostProfileId: safeId,
  routeId: routeIdSchema,
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  executionTarget: z.enum([
    'google_cloud_batch_a2_ultra_job',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.union([z.literal(12), z.literal(8)]),
  allocatedMemoryGiB: z.union([z.literal(170), z.literal(32)]),
  allocatedLocalScratchGiB: z.union([z.literal(375), z.literal(0)]),
  serviceIdentityRef: evidenceRefSchema,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  sourceAndDependencyClosureRef: evidenceRefSchema,
  toolOrModelArtifactReleaseRef: evidenceRefSchema,
  sbomRef: evidenceRefSchema,
  imageScanAndSignatureRef: evidenceRefSchema,
  cudaDriverRuntimeQualificationRef: evidenceRefSchema,
  substantiveGpuExecutionQualificationRef: evidenceRefSchema,
  scaleToZeroConfigurationRef: evidenceRefSchema,
  privateNetworkAndArtifactTransportRef: evidenceRefSchema,
  substantiveGpuEvidenceClass: z.enum([
    'cuda_model_inference_and_nvdec',
    'cuda_kernel_execution',
    'nvenc_nvdec_hardware_codec_execution',
    'gpu_render_execution',
  ]),
  exactToolOrModelVersionReread: z.boolean(),
  exactCudaAndNativeDependencyClosureReread: z.boolean(),
  actualGpuKernelModelRenderOrHardwareCodecMeasured: z.boolean(),
  cpuOnlySubstantiveExecutionObserved: z.literal(false),
  gpuHostCpuOnlyExecutionMaySatisfyQualification: z.literal(false),
  runtimeNetworkDownloadAllowed: z.literal(false),
  callerImageModelToolOrCommandSelectionAllowed: z.literal(false),
  minimumIdleInstances: z.literal(0),
  maximumConcurrentAttemptsPerInstance: z.literal(1),
  prewarmingKeepaliveOrAlwaysOnPoolAllowed: z.literal(false),
  startsOnlyFromCreateOnlyApprovedUserAttempt: z.literal(true),
  stopsAtTerminalAttempt: z.literal(true),
  qualificationRunCount: positiveInteger,
  qualifiedAt: timestamp,
  expiresAt: timestamp,
  privateInternalQualified: z.boolean(),
  customerBillingAuthorityGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionQualified: z.literal(false),
}).strict().superRefine((release, context) => {
  const a100 = release.routeId === 'a100_80gb_heavy_primary'
  const exactRoute = a100
    ? release.executionTarget === 'google_cloud_batch_a2_ultra_job'
      && release.machineType === 'a2-ultragpu-1g'
      && release.accelerator === 'nvidia_a100_80gb'
      && release.allocatedVcpuCount === 12
      && release.allocatedMemoryGiB === 170
      && release.allocatedLocalScratchGiB === 375
    : release.executionTarget === 'google_cloud_run_l4_job'
      && release.machineType === 'cloud_run_nvidia_l4'
      && release.accelerator === 'nvidia_l4'
      && release.allocatedVcpuCount === 8
      && release.allocatedMemoryGiB === 32
      && release.allocatedLocalScratchGiB === 0
  const evidenceExact = release.evidenceClass === 'canonical_private_reread'
    ? release.status === 'private_internal_qualified'
      && release.privateInternalQualified
      && release.exactToolOrModelVersionReread
      && release.exactCudaAndNativeDependencyClosureReread
      && release.actualGpuKernelModelRenderOrHardwareCodecMeasured
      && release.qualificationRunCount >= 30
    : release.status === 'contract_only'
      && !release.privateInternalQualified
      && !release.exactToolOrModelVersionReread
      && !release.exactCudaAndNativeDependencyClosureReread
      && !release.actualGpuKernelModelRenderOrHardwareCodecMeasured
  const executionOwnerExact = release.gpuExecutionOwnerBindingMode ===
    'native_gpu_implementation'
    ? release.gpuExecutionOwnerToolId === release.toolId
    : release.gpuExecutionOwnerToolId !== release.toolId
  if (!exactRoute
    || !evidenceExact
    || !executionOwnerExact
    || Date.parse(release.expiresAt) <= Date.parse(release.qualifiedAt)
    || release.immutableImageRef.contentHash !== release.immutableImageDigest) {
    context.addIssue({
      code: 'custom',
      message: 'GPU runtime release lost route, evidence, image, or expiry.',
    })
  }
})

export const canonicalProfessionalToolGpuRuntimeReleaseSchema =
  runtimeReleaseWithoutHashSchema.extend({ releaseHash: sha256 }).strict()
export type CanonicalProfessionalToolGpuRuntimeRelease = z.infer<
  typeof canonicalProfessionalToolGpuRuntimeReleaseSchema
>

const admissionScopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  editPlanId: safeId,
  editPlanVersion: positiveInteger,
  approvedSnapshotRef: evidenceRefSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  masterTimingRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  userApprovalRecordRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  idempotencyKey: safeId,
}).strict()

const priorFailureClassSchema = z.enum([
  'not_applicable',
  'a100_capacity_unavailable_before_attempt_start',
  'a100_job_boot_failed_before_private_media_read',
  'a100_runtime_qualification_blocked_before_dispatch',
  'a100_driver_or_cuda_incompatible_before_model_load',
])

const admissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_TOOL_GPU_DISPATCH_ADMISSION_VERSION,
  ),
  source: z.literal('canonical_server_professional_gpu_dispatch_owner'),
  admissionId: safeId,
  toolId: toolIdSchema,
  operationId: safeId,
  routeId: routeIdSchema,
  scope: admissionScopeSchema,
  estimateRef: evidenceRefSchema,
  estimateMaximumReservedToolCostCredits: z.number().int().nonnegative().safe(),
  currentRateAuthorityRef: evidenceRefSchema,
  placementPolicyRef: z.object({
    schemaVersion: z.literal(
      'canonical-quality-first-professional-tool-gpu-placement-v1',
    ),
    policyHash: sha256,
    entryHash: sha256,
  }).strict(),
  gpuPolicyRef: z.object({
    schemaVersion: z.literal(
      'canonical-quality-first-user-triggered-scale-to-zero-gpu-policy-v2',
    ),
    policyHash: sha256,
  }).strict(),
  runtimeReleaseRef: evidenceRefSchema,
  priorPrimaryTerminalReceiptRef: evidenceRefSchema.nullable(),
  priorPrimaryFailureClass: priorFailureClassSchema,
  priorPrimaryOutcomeKnownNotExecuted: z.boolean(),
  admittedAttemptOrdinal: z.union([z.literal(1), z.literal(2)]),
  callerSelectedRouteImageModelOrCommand: z.literal(false),
  exactCurrentRateEstimateApprovalReservationAndReleaseReread:
    z.literal(true),
  exactApprovedUserTriggerAndIdempotencyReread: z.literal(true),
  actualGpuEvidenceRequiredFromTerminalResult: z.literal(true),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  gpuHostCpuOnlyExecutionMaySatisfyAdmission: z.literal(false),
  unknownPriorOutcomeMayRetryOrFallback: z.literal(false),
  createOnlyDurableConsumptionRequiredBeforeJobCreation: z.literal(true),
  userTriggeredScaleFromZero: z.literal(true),
  noApprovedAttemptMeansZeroGpuInstances: z.literal(true),
  minimumIdleInstances: z.literal(0),
  stopAtTerminalAttempt: z.literal(true),
  workDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((admission, context) => {
  const fallback = admission.routeId === 'l4_heavy_fallback'
  const exactAttempt = fallback
    ? admission.admittedAttemptOrdinal === 2
      && admission.priorPrimaryTerminalReceiptRef !== null
      && admission.priorPrimaryFailureClass !== 'not_applicable'
      && admission.priorPrimaryOutcomeKnownNotExecuted
    : admission.admittedAttemptOrdinal === 1
      && admission.priorPrimaryTerminalReceiptRef === null
      && admission.priorPrimaryFailureClass === 'not_applicable'
      && !admission.priorPrimaryOutcomeKnownNotExecuted
  if (!exactAttempt
    || Date.parse(admission.expiresAt) <= Date.parse(admission.admittedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU dispatch admission lost attempt or expiry lineage.',
    })
  }
})

export const canonicalProfessionalToolGpuDispatchAdmissionSchema =
  admissionWithoutHashSchema.extend({ admissionHash: sha256 }).strict()
export type CanonicalProfessionalToolGpuDispatchAdmission = z.infer<
  typeof canonicalProfessionalToolGpuDispatchAdmissionSchema
>

export function assertCanonicalProfessionalToolGpuRuntimeRelease(
  value: unknown,
  at?: string,
): CanonicalProfessionalToolGpuRuntimeRelease {
  const release = canonicalProfessionalToolGpuRuntimeReleaseSchema.parse(value)
  const { releaseHash, ...payload } = release
  if (releaseHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(release.qualifiedAt)
      || Date.parse(at) >= Date.parse(release.expiresAt)))) {
    throw new Error('Professional GPU runtime release is invalid.')
  }
  return release
}

export function admitCanonicalProfessionalToolGpuDispatch(input: {
  readonly admissionId: string
  readonly estimate: CanonicalProfessionalToolGpuCostEstimate
  readonly runtimeRelease: CanonicalProfessionalToolGpuRuntimeRelease
  readonly currentRateAuthority: CanonicalCurrentGoogleCloudGpuRateAuthority
  readonly scope: z.input<typeof admissionScopeSchema>
  readonly routeId: z.infer<typeof routeIdSchema>
  readonly priorPrimaryTerminalReceiptRef?: z.input<typeof evidenceRefSchema>
  readonly priorPrimaryFailureClass?: z.infer<typeof priorFailureClassSchema>
  readonly priorPrimaryOutcomeKnownNotExecuted?: boolean
  readonly admittedAt: string
  readonly expiresAt: string
}): CanonicalProfessionalToolGpuDispatchAdmission {
  const estimate = assertCanonicalProfessionalToolGpuCostEstimate(input.estimate)
  const release = assertCanonicalProfessionalToolGpuRuntimeRelease(
    input.runtimeRelease,
    input.admittedAt,
  )
  if (release.evidenceClass !== 'canonical_private_reread'
    || release.status !== 'private_internal_qualified'
    || !release.privateInternalQualified) {
    throw new Error('GPU runtime is not privately qualified.')
  }
  const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    input.currentRateAuthority,
    input.admittedAt,
  )
  const placementPolicy =
    assertCanonicalQualityFirstProfessionalToolGpuPlacement(
      createCanonicalQualityFirstProfessionalToolGpuPlacement(),
    )
  const gpuPolicy = assertCanonicalQualityFirstUserTriggeredGpuPolicy(
    createCanonicalQualityFirstUserTriggeredGpuPolicy(),
  )
  const placement = placementPolicy.entries.find((entry) =>
    entry.toolId === estimate.scope.toolId)
  if (!placement
    || placement.placementClass === 'historical_read_only'
    || placement.placementClass === 'non_gpu_control_plane_only'
    || placement.placementClass ===
      'l4_colocated_io_container_metadata_helper') {
    throw new Error('Tool cannot receive standalone GPU dispatch admission.')
  }
  const approvedRoute = input.routeId === 'l4_heavy_fallback'
    ? estimate.fallback
    : estimate.primary
  if (estimate.scope.toolId !== release.toolId
    || release.gpuExecutionOwnerBindingMode !==
      placement.gpuExecutionOwnerBindingMode
    || release.gpuExecutionOwnerToolId !==
      placement.gpuExecutionOwnerToolId
    || estimate.scope.operationId !== release.operationId
    || estimate.toolCostProfileId !== release.toolCostProfileId
    || estimate.modelOrOperationCostProfileId !==
      release.modelOrOperationCostProfileId
    || stableAuthorityStringify(
      estimate.scope.exactToolOrModelReleaseRef,
    ) !== stableAuthorityStringify(
      release.toolOrModelArtifactReleaseRef,
    )
    || input.routeId !== release.routeId
    || input.routeId !== rate.routeId
    || approvedRoute?.routeId !== input.routeId
    || approvedRoute.rateAuthorityRef.contentHash !==
      `sha256:${rate.rateAuthorityHash}`
    || release.runtimeRegion !== rate.region
    || estimate.placementPolicyRef.policyHash !== placementPolicy.policyHash
    || estimate.placementPolicyRef.entryHash !== placement.entryHash
    || estimate.gpuPolicyRef.policyHash !== gpuPolicy.policyHash) {
    throw new Error(
      'GPU dispatch release, estimate, rate, placement, or operation differs.',
    )
  }
  const scope = admissionScopeSchema.parse(input.scope)
  if (scope.ownerUserId !== estimate.scope.ownerUserId
    || scope.workspaceId !== estimate.scope.workspaceId
    || scope.projectId !== estimate.scope.projectId
    || scope.editSessionId !== estimate.scope.editSessionId
    || scope.editPlanId !== estimate.scope.editPlanId
    || scope.editPlanVersion !== estimate.scope.editPlanVersion
    || stableAuthorityStringify(scope.approvedWorkItemRef) !==
      stableAuthorityStringify(estimate.scope.plannedWorkItemRef)) {
    throw new Error('GPU dispatch scope differs from its approved estimate.')
  }
  const fallback = input.routeId === 'l4_heavy_fallback'
  const payload = admissionWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_TOOL_GPU_DISPATCH_ADMISSION_VERSION,
    source: 'canonical_server_professional_gpu_dispatch_owner',
    admissionId: input.admissionId,
    toolId: estimate.scope.toolId,
    operationId: estimate.scope.operationId,
    routeId: input.routeId,
    scope,
    estimateRef: ref(estimate.estimateId, estimate.estimateHash),
    estimateMaximumReservedToolCostCredits:
      estimate.maximumReservedToolCostCredits,
    currentRateAuthorityRef: ref(
      rate.rateAuthorityId,
      rate.rateAuthorityHash,
      rate.rateAuthorityVersion,
    ),
    placementPolicyRef: estimate.placementPolicyRef,
    gpuPolicyRef: estimate.gpuPolicyRef,
    runtimeReleaseRef: ref(
      release.releaseId,
      release.releaseHash,
      release.releaseVersion,
    ),
    priorPrimaryTerminalReceiptRef:
      input.priorPrimaryTerminalReceiptRef ?? null,
    priorPrimaryFailureClass:
      input.priorPrimaryFailureClass ?? 'not_applicable',
    priorPrimaryOutcomeKnownNotExecuted:
      input.priorPrimaryOutcomeKnownNotExecuted ?? false,
    admittedAttemptOrdinal: fallback ? 2 : 1,
    callerSelectedRouteImageModelOrCommand: false,
    exactCurrentRateEstimateApprovalReservationAndReleaseReread: true,
    exactApprovedUserTriggerAndIdempotencyReread: true,
    actualGpuEvidenceRequiredFromTerminalResult: true,
    cpuOnlySubstantiveExecutionAllowed: false,
    gpuHostCpuOnlyExecutionMaySatisfyAdmission: false,
    unknownPriorOutcomeMayRetryOrFallback: false,
    createOnlyDurableConsumptionRequiredBeforeJobCreation: true,
    userTriggeredScaleFromZero: true,
    noApprovedAttemptMeansZeroGpuInstances: true,
    minimumIdleInstances: 0,
    stopAtTerminalAttempt: true,
    workDispatched: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: input.admittedAt,
    expiresAt: input.expiresAt,
  })
  return canonicalProfessionalToolGpuDispatchAdmissionSchema.parse({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalToolGpuDispatchAdmission(
  value: unknown,
): CanonicalProfessionalToolGpuDispatchAdmission {
  const admission = canonicalProfessionalToolGpuDispatchAdmissionSchema
    .parse(value)
  const { admissionHash, ...payload } = admission
  if (admissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('Professional GPU dispatch admission hash is invalid.')
  }
  return admission
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}
