import { z } from 'zod'

import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from '../../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
} from '../../services/private-edit-authority-store'
import {
  assertPlainSerializedData,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  canonicalSam31SourceCheckpointQualificationReferenceSchema,
} from '../../model-artifacts/canonical-sam3_1-source-checkpoint-qualified-authority'

export const CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_EVIDENCE_VERSION =
  'canonical-sam3_1-gpu-runtime-qualification-evidence-v3' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const versionOneRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
}).strict()
const sourceCheckpointQualificationRefSchema =
  canonicalSam31SourceCheckpointQualificationReferenceSchema

const routeSchema = z.object({
  routeId: z.enum([
    'a100_80gb_heavy_primary',
    'l4_heavy_fallback',
  ]),
  gpuProfileId: z.enum([
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0],
    CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
  ]),
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  executionTarget: z.enum([
    'google_cloud_vertex_custom_job_a2_ultra',
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
}).strict().superRefine((route, context) => {
  const a100 = route.routeId === 'a100_80gb_heavy_primary'
  const exact = a100
    ? route.gpuProfileId === CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
      && (route.executionTarget === 'google_cloud_vertex_custom_job_a2_ultra'
        || route.executionTarget ===
          'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra')
      && route.machineType === 'a2-ultragpu-1g'
      && route.accelerator === 'nvidia_a100_80gb'
    : route.gpuProfileId === CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
      && route.executionTarget === 'google_cloud_run_l4_job'
      && route.machineType === 'cloud_run_nvidia_l4'
      && route.accelerator === 'nvidia_l4'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification route is inconsistent.',
  })
})

export const canonicalSam31GpuRuntimeDriverEvidenceSchema = z.object({
  cudaDriverRuntimeQualificationRef: versionOneRefSchema,
  observedNvidiaDriverVersion: z.string().regex(
    /^[0-9]+(?:\.[0-9]+){1,3}$/u,
  ),
  cudaDriverLibraryMode: z.enum(['cuda_compat_12_8', 'host_driver']),
  loadedCudaDriverLibraryPathDigestSha256: sha256,
  cudaForwardCompatibilityPackageSha256: z.literal(
    'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
  ),
  cudaForwardCompatibilityLibraryLoaded: z.boolean(),
  hostCudaDriverLibraryLoaded: z.boolean(),
  exactDriverVersionAndLoadedLibraryPathReread: z.literal(true),
}).strict().superRefine((driver, context) => {
  const major = Number.parseInt(
    driver.observedNvidiaDriverVersion.split('.')[0] ?? '',
    10,
  )
  const exact = major >= 535 && major < 570
    ? driver.cudaDriverLibraryMode === 'cuda_compat_12_8'
      && driver.cudaForwardCompatibilityLibraryLoaded
      && !driver.hostCudaDriverLibraryLoaded
    : major >= 570
      && driver.cudaDriverLibraryMode === 'host_driver'
      && !driver.cudaForwardCompatibilityLibraryLoaded
      && driver.hostCudaDriverLibraryLoaded
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification driver evidence is incompatible.',
  })
})

export const canonicalSam31GpuRuntimeDeterministicRunSchema = z.object({
  runOrdinal: z.number().int().min(1).max(30),
  qualificationAttemptRef: versionOneRefSchema,
  resultAdmissionRef: versionOneRefSchema,
  runtimeRequestRef: versionOneRefSchema,
  runtimeResponseObjectRef: versionOneRefSchema,
  privateOutputRereadEvidenceRef: versionOneRefSchema,
  attemptCostReceiptRef: versionOneRefSchema,
  immutableImageDigest: prefixedSha256,
  routeId: routeSchema.shape.routeId,
  accelerator: routeSchema.shape.accelerator,
  deterministicProbeFixtureRef: versionOneRefSchema,
  outputMaskSetDigestSha256: sha256,
  exactResultRequestResponseOutputAndCostReread: z.literal(true),
  exactToolModelAndCheckpointReread: z.literal(true),
  exactPythonTorchCudaWheelAndNativeClosureReread: z.literal(true),
  strictCheckpointLoadWithNoMissingOrUnexpectedKeys: z.literal(true),
  actualCudaModelInferenceMeasured: z.literal(true),
  actualNvdecDecodeMeasured: z.literal(true),
  decodedFramesRemainedCudaResident: z.literal(true),
  bfloat16AutocastMeasured: z.literal(true),
  cpuOnlyInferenceObserved: z.literal(false),
  quantizationOrResolutionReductionUsed: z.literal(false),
  sourceResolutionAndFrameRangePreserved: z.literal(true),
  terminalWorkerStoppedAndScaleBackToZeroVerified: z.literal(true),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const performanceMeasurementSchema = z.object({
  runOrdinal: z.number().int().min(1).max(30),
  fullSourceExecutionRef: versionOneRefSchema,
  completeChunkResultSetRef: versionOneRefSchema,
  terminalUsageAndCostReceiptSetRef: versionOneRefSchema,
  wallTimeMilliseconds: positiveInteger,
  coldStartAndImagePullMilliseconds: nonnegativeInteger,
  modelLoadMilliseconds: nonnegativeInteger,
  decodePromptPropagationAndStitchMilliseconds: positiveInteger,
  outputPersistenceAndExactRereadMilliseconds: nonnegativeInteger,
  sourceResolutionAndCompleteFrameRangePreserved: z.literal(true),
  everyChunkResultAndTerminalCostReread: z.literal(true),
  allGpuCapacityStoppedAfterTerminal: z.literal(true),
  customerCreditsMutated: z.literal(false),
}).strict().superRefine((measurement, context) => {
  const measuredComponents =
    measurement.coldStartAndImagePullMilliseconds
    + measurement.modelLoadMilliseconds
    + measurement.decodePromptPropagationAndStitchMilliseconds
    + measurement.outputPersistenceAndExactRereadMilliseconds
  if (measuredComponents > measurement.wallTimeMilliseconds) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 performance components exceed wall time.',
    })
  }
})

export const canonicalSam31GpuRuntimePerformanceEvidenceSchema = z.object({
  eightMinuteSourcePerformanceQualificationRef: versionOneRefSchema,
  exactEightMinuteSourceRef: versionOneRefSchema,
  sourceDurationMilliseconds: z.literal(480_000),
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameCount: positiveInteger,
  fpsNumerator: positiveInteger,
  fpsDenominator: positiveInteger,
  measurements: z.array(performanceMeasurementSchema).min(5).max(30),
  p95WallTimeMilliseconds: positiveInteger,
  targetWallTimeMilliseconds: z.literal(480_000),
  completeSourceIntervalCovered: z.literal(true),
  automaticQualityReductionAllowed: z.literal(false),
}).strict().superRefine((performance, context) => {
  const ordinals = performance.measurements.map((run) => run.runOrdinal)
  const ordered = ordinals.every((ordinal, index) => ordinal === index + 1)
  const uniqueRefs = new Set(performance.measurements.flatMap((run) => [
    refKey(run.fullSourceExecutionRef),
    refKey(run.completeChunkResultSetRef),
    refKey(run.terminalUsageAndCostReceiptSetRef),
  ])).size === performance.measurements.length * 3
  const expectedP95 = nearestRankP95(
    performance.measurements.map((run) => run.wallTimeMilliseconds),
  )
  const durationNumerator = performance.sourceFrameCount
    * performance.fpsDenominator * 1_000
  const expectedDuration = durationNumerator / performance.fpsNumerator
  if (
    !ordered
    || !uniqueRefs
    || expectedP95 !== performance.p95WallTimeMilliseconds
    || performance.p95WallTimeMilliseconds >
      performance.targetWallTimeMilliseconds
    || !Number.isInteger(expectedDuration)
    || expectedDuration !== performance.sourceDurationMilliseconds
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 eight-minute performance evidence is invalid.',
  })
})

export const canonicalSam31GpuRuntimeQualityEvidenceSchema = z.object({
  temporalMaskQualityQualificationRef: versionOneRefSchema,
  independentTemporalMeasurementSetRef: versionOneRefSchema,
  directPrivateCompleteIntervalReviewRef: versionOneRefSchema,
  reviewedSequenceCount: positiveInteger,
  temporalMaskFindingCount: z.literal(0),
  allMaskFramesMatchedSourceGeometry: z.literal(true),
  everyExpectedFrameAndObjectReviewed: z.literal(true),
  temporalStabilityThresholdsPassed: z.literal(true),
  directPrivateCompleteIntervalReviewPassed: z.literal(true),
  qualityRole: z.enum([
    'approved_a100_baseline',
    'l4_fallback_compared_to_approved_a100_baseline',
  ]),
  approvedA100BaselineRuntimeQualificationEvidenceRef:
    versionOneRefSchema.nullable(),
  approvedA100BaselineRef: versionOneRefSchema,
  qualityEqualToOrBetterThanApprovedA100Baseline: z.literal(true),
  reviewerIndependentFromRuntimeWorker: z.literal(true),
  qaApprovalGranted: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((quality, context) => {
  const sameAsBaseline = sameRef(
    quality.temporalMaskQualityQualificationRef,
    quality.approvedA100BaselineRef,
  )
  const exact = quality.qualityRole === 'approved_a100_baseline'
    ? sameAsBaseline
      && quality.approvedA100BaselineRuntimeQualificationEvidenceRef === null
    : !sameAsBaseline
      && quality.approvedA100BaselineRuntimeQualificationEvidenceRef !== null
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 A100 baseline comparison lineage is invalid.',
  })
})

const evidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_gpu_runtime_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('private_runtime_qualification_evidence_ready'),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  candidateRef: z.object({
    schemaVersion: z.literal('canonical-sam3_1-source-runtime-candidate-v4'),
    candidateHash: sha256,
  }).strict(),
  privateArtifactIngestReceiptRef: versionOneRefSchema,
  sourceCheckpointCompatibilityQualificationRef:
    sourceCheckpointQualificationRefSchema,
  imageSupplyChainReleaseRef: versionOneRefSchema,
  serviceIdentityRef: versionOneRefSchema,
  immutableImageRef: versionOneRefSchema,
  immutableImageDigest: prefixedSha256,
  scaleToZeroConfigurationRef: versionOneRefSchema,
  privateNetworkAndArtifactTransportRef: versionOneRefSchema,
  route: routeSchema,
  driverEvidence: canonicalSam31GpuRuntimeDriverEvidenceSchema,
  deterministicRuns: z.array(
    canonicalSam31GpuRuntimeDeterministicRunSchema,
  ).length(30),
  performanceEvidence: canonicalSam31GpuRuntimePerformanceEvidenceSchema,
  qualityEvidence: canonicalSam31GpuRuntimeQualityEvidenceSchema,
  qualifiedAt: timestamp,
  authority: z.object({
    exactThirtyRunSetReread: z.literal(true),
    exactEightMinutePerformanceSetReread: z.literal(true),
    exactDriverAndCudaEvidenceReread: z.literal(true),
    independentTemporalMaskQaReread: z.literal(true),
    directCompleteIntervalReviewReread: z.literal(true),
    privateRuntimeQualificationEvidenceReady: z.literal(true),
    gpuJobDispatchAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApprovalGranted: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict(),
}).strict().superRefine((evidence, context) => {
  const runs = evidence.deterministicRuns
  const exactRuns = runs.every((run, index) =>
    run.runOrdinal === index + 1
    && run.routeId === evidence.route.routeId
    && run.accelerator === evidence.route.accelerator
    && run.immutableImageDigest === evidence.immutableImageDigest)
  const uniqueRefs = new Set(runs.flatMap((run) => [
    refKey(run.qualificationAttemptRef),
    refKey(run.resultAdmissionRef),
    refKey(run.runtimeRequestRef),
    refKey(run.runtimeResponseObjectRef),
    refKey(run.privateOutputRereadEvidenceRef),
    refKey(run.attemptCostReceiptRef),
  ])).size === runs.length * 6
  const oneDeterministicFixture = new Set(
    runs.map((run) => refKey(run.deterministicProbeFixtureRef)),
  ).size === 1
  const deterministic = new Set(
    runs.map((run) => run.outputMaskSetDigestSha256),
  ).size === 1
  const qualityRoleMatchesRoute = evidence.route.routeId ===
    'a100_80gb_heavy_primary'
    ? evidence.qualityEvidence.qualityRole === 'approved_a100_baseline'
    : evidence.qualityEvidence.qualityRole ===
      'l4_fallback_compared_to_approved_a100_baseline'
  if (
    !exactRuns
    || !uniqueRefs
    || !oneDeterministicFixture
    || !deterministic
    || !qualityRoleMatchesRoute
  ) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 qualification evidence lost run or route identity.',
    })
  }
})

export const canonicalSam31GpuRuntimeQualificationEvidenceSchema =
  evidenceWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalSam31GpuRuntimeQualificationEvidence = z.infer<
  typeof canonicalSam31GpuRuntimeQualificationEvidenceSchema
>

export const canonicalSam31GpuRuntimeQualificationEvidenceReferenceSchema =
  versionOneRefSchema

export const canonicalSam31GpuRuntimeQualificationEvidenceReadRequestSchema =
  z.object({
    qualificationEvidenceRef: versionOneRefSchema,
    candidateRef: z.object({
      schemaVersion: z.literal(
        'canonical-sam3_1-source-runtime-candidate-v4',
      ),
      candidateHash: sha256,
    }).strict(),
    privateArtifactIngestReceiptRef: versionOneRefSchema,
    sourceCheckpointCompatibilityQualificationRef:
      sourceCheckpointQualificationRefSchema,
    imageSupplyChainReleaseRef: versionOneRefSchema,
    serviceIdentityRef: versionOneRefSchema,
    immutableImageRef: versionOneRefSchema,
    immutableImageDigest: prefixedSha256,
    scaleToZeroConfigurationRef: versionOneRefSchema,
    privateNetworkAndArtifactTransportRef: versionOneRefSchema,
    route: routeSchema,
  }).strict()

export interface CanonicalSam31GpuRuntimeQualificationEvidenceReadPort {
  rereadExact(input: z.infer<
    typeof canonicalSam31GpuRuntimeQualificationEvidenceReadRequestSchema
  >): Promise<unknown | null>
  rereadEvidenceRefExact(input: {
    readonly qualificationEvidenceRef: z.infer<
      typeof versionOneRefSchema
    >
  }): Promise<unknown | null>
}

export function assertCanonicalSam31GpuRuntimeQualificationEvidence(
  value: unknown,
): CanonicalSam31GpuRuntimeQualificationEvidence {
  assertPlainSerializedData(value, 'sam3_1_gpu_runtime_qualification_evidence')
  const evidence = canonicalSam31GpuRuntimeQualificationEvidenceSchema
    .parse(value)
  const { evidenceHash, ...payload } = evidence
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 runtime qualification evidence hash is invalid.')
  }
  return evidence
}

export function canonicalSam31GpuRuntimeQualificationEvidenceRef(
  evidence: CanonicalSam31GpuRuntimeQualificationEvidence,
) {
  const parsed = assertCanonicalSam31GpuRuntimeQualificationEvidence(evidence)
  return versionOneRefSchema.parse({
    id: parsed.qualificationId,
    version: parsed.qualificationVersion,
    contentHash: `sha256:${parsed.evidenceHash}`,
  })
}

export function canonicalSam31GpuRuntimeQualificationEvidenceDigest(
  payload: z.input<typeof evidenceWithoutHashSchema>,
): string {
  return sha256AuthorityValue(evidenceWithoutHashSchema.parse(payload))
}

export function qualificationReleaseFields(
  evidence: CanonicalSam31GpuRuntimeQualificationEvidence,
  substantiveGpuQualificationRef?: z.infer<typeof versionOneRefSchema>,
) {
  const parsed = assertCanonicalSam31GpuRuntimeQualificationEvidence(evidence)
  const firstRun = parsed.deterministicRuns[0]
  return Object.freeze({
    sourceCheckpointCompatibilityQualificationRef:
      parsed.sourceCheckpointCompatibilityQualificationRef,
    cudaDriverRuntimeQualificationRef:
      parsed.driverEvidence.cudaDriverRuntimeQualificationRef,
    observedNvidiaDriverVersion:
      parsed.driverEvidence.observedNvidiaDriverVersion,
    cudaDriverLibraryMode: parsed.driverEvidence.cudaDriverLibraryMode,
    loadedCudaDriverLibraryPathDigestSha256:
      parsed.driverEvidence.loadedCudaDriverLibraryPathDigestSha256,
    cudaForwardCompatibilityPackageSha256:
      parsed.driverEvidence.cudaForwardCompatibilityPackageSha256,
    cudaForwardCompatibilityLibraryLoaded:
      parsed.driverEvidence.cudaForwardCompatibilityLibraryLoaded,
    hostCudaDriverLibraryLoaded:
      parsed.driverEvidence.hostCudaDriverLibraryLoaded,
    runtimeDriverAndLibraryPathEvidenceReread:
      parsed.driverEvidence.exactDriverVersionAndLoadedLibraryPathReread,
    substantiveGpuExecutionQualificationRef:
      substantiveGpuQualificationRef
        ? versionOneRefSchema.parse(substantiveGpuQualificationRef)
        : canonicalSam31GpuRuntimeQualificationEvidenceRef(parsed),
    temporalMaskQualityQualificationRef:
      parsed.qualityEvidence.temporalMaskQualityQualificationRef,
    eightMinuteSourcePerformanceQualificationRef:
      parsed.performanceEvidence.eightMinuteSourcePerformanceQualificationRef,
    exactToolModelAndCheckpointReread:
      firstRun.exactToolModelAndCheckpointReread,
    exactPythonTorchCudaWheelAndNativeClosureReread:
      firstRun.exactPythonTorchCudaWheelAndNativeClosureReread,
    strictCheckpointLoadWithNoMissingOrUnexpectedKeys:
      firstRun.strictCheckpointLoadWithNoMissingOrUnexpectedKeys,
    actualCudaModelInferenceMeasured:
      firstRun.actualCudaModelInferenceMeasured,
    actualNvdecDecodeMeasured: firstRun.actualNvdecDecodeMeasured,
    decodedFramesRemainedCudaResident:
      firstRun.decodedFramesRemainedCudaResident,
    bfloat16AutocastMeasured: firstRun.bfloat16AutocastMeasured,
    cpuOnlyInferenceObserved: false as const,
    quantizationOrResolutionReductionUsed: false as const,
    sourceResolutionAndFrameRangePreserved:
      parsed.performanceEvidence.completeSourceIntervalCovered,
    temporalMaskQaPassed:
      parsed.qualityEvidence.temporalStabilityThresholdsPassed,
    directPrivateCompleteIntervalReviewPassed:
      parsed.qualityEvidence.directPrivateCompleteIntervalReviewPassed,
    qualificationRunCount: parsed.deterministicRuns.length,
    eightMinuteSourceP95WallTimeMilliseconds:
      parsed.performanceEvidence.p95WallTimeMilliseconds,
    eightMinuteSourceTargetMilliseconds: 480_000 as const,
    qualityEqualToOrBetterThanApprovedA100Baseline:
      parsed.qualityEvidence.qualityEqualToOrBetterThanApprovedA100Baseline,
  })
}

function nearestRankP95(values: number[]): number {
  if (values.length < 1) throw new Error('P95 requires measurements.')
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.ceil(sorted.length * 0.95) - 1]
}

function refKey(ref: z.infer<typeof evidenceRefSchema>): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return refKey(left) === refKey(right)
}
