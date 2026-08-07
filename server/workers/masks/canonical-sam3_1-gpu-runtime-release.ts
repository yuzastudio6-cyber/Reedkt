import { z } from 'zod'

import {
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
  type CanonicalProfessionalToolGpuRuntimeRelease,
} from '../../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from '../../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31CloudImageSupplyChainRelease,
  type CanonicalSam31CloudImageSupplyChainRelease,
} from '../../model-artifacts/canonical-sam3_1-cloud-image-supply-chain-release'
import {
  assertCanonicalSam31SourceCheckpointQualification,
  canonicalSam31SourceCheckpointQualificationRef,
  type CanonicalSam31SourceCheckpointQualification,
} from '../../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  sha256AuthorityValue,
} from '../../services/private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority,
  canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef,
  type CanonicalSam31GpuRuntimeQualificationCompilationAuthorityReadPort,
} from '../../services/canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  assertCanonicalSam31GpuRuntimeQualificationEvidence,
  canonicalSam31GpuRuntimeQualificationEvidenceRef,
  qualificationReleaseFields,
  type CanonicalSam31GpuRuntimeQualificationEvidenceReadPort,
} from './canonical-sam3_1-gpu-runtime-qualification-evidence'

export const CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_VERSION =
  'canonical-sam3_1-gpu-runtime-release-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
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
const versionOneEvidenceRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
}).strict()

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
    'google_cloud_batch_a2_ultra_job',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  allocatedVcpuCount: z.union([z.literal(12), z.literal(8)]),
  allocatedMemoryGiB: z.union([z.literal(170), z.literal(32)]),
  allocatedLocalScratchGiB: z.union([z.literal(375), z.literal(0)]),
}).strict().superRefine((route, context) => {
  const a100 = route.routeId === 'a100_80gb_heavy_primary'
  const exact = a100
    ? route.gpuProfileId === CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
      && route.executionTarget === 'google_cloud_batch_a2_ultra_job'
      && route.machineType === 'a2-ultragpu-1g'
      && route.accelerator === 'nvidia_a100_80gb'
      && route.allocatedVcpuCount === 12
      && route.allocatedMemoryGiB === 170
      && route.allocatedLocalScratchGiB === 375
    : route.gpuProfileId === CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1]
      && route.executionTarget === 'google_cloud_run_l4_job'
      && route.machineType === 'cloud_run_nvidia_l4'
      && route.accelerator === 'nvidia_l4'
      && route.allocatedVcpuCount === 8
      && route.allocatedMemoryGiB === 32
      && route.allocatedLocalScratchGiB === 0
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 runtime release lost its A100 or L4 route.',
  })
})

export const canonicalSam31GpuRuntimeQualificationSchema = z.object({
  sourceCheckpointCompatibilityQualificationRef: evidenceRefSchema.extend({
    version: z.literal(1),
    schemaVersion: z.literal(
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1',
    ),
  }).strict(),
  cudaDriverRuntimeQualificationRef: evidenceRefSchema,
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
  runtimeDriverAndLibraryPathEvidenceReread: z.boolean(),
  substantiveGpuExecutionQualificationRef: evidenceRefSchema,
  temporalMaskQualityQualificationRef: evidenceRefSchema,
  eightMinuteSourcePerformanceQualificationRef: evidenceRefSchema,
  exactToolModelAndCheckpointReread: z.boolean(),
  exactPythonTorchCudaWheelAndNativeClosureReread: z.boolean(),
  strictCheckpointLoadWithNoMissingOrUnexpectedKeys: z.boolean(),
  actualCudaModelInferenceMeasured: z.boolean(),
  actualNvdecDecodeMeasured: z.boolean(),
  decodedFramesRemainedCudaResident: z.boolean(),
  bfloat16AutocastMeasured: z.boolean(),
  cpuOnlyInferenceObserved: z.literal(false),
  quantizationOrResolutionReductionUsed: z.literal(false),
  sourceResolutionAndFrameRangePreserved: z.boolean(),
  temporalMaskQaPassed: z.boolean(),
  directPrivateCompleteIntervalReviewPassed: z.boolean(),
  qualificationRunCount: positiveInteger,
  eightMinuteSourceP95WallTimeMilliseconds: nonnegativeInteger,
  eightMinuteSourceTargetMilliseconds: z.literal(480_000),
  qualityEqualToOrBetterThanApprovedA100Baseline: z.boolean(),
}).strict().superRefine((qualification, context) => {
  const driverMajor = Number.parseInt(
    qualification.observedNvidiaDriverVersion.split('.')[0] ?? '',
    10,
  )
  const forwardCompatible = driverMajor >= 535 && driverMajor < 570
  const hostDriver = driverMajor >= 570
  const exact = forwardCompatible
    ? qualification.cudaDriverLibraryMode === 'cuda_compat_12_8'
      && qualification.cudaForwardCompatibilityLibraryLoaded
      && !qualification.hostCudaDriverLibraryLoaded
    : hostDriver
      && qualification.cudaDriverLibraryMode === 'host_driver'
      && !qualification.cudaForwardCompatibilityLibraryLoaded
      && qualification.hostCudaDriverLibraryLoaded
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 release lost CUDA driver compatibility evidence.',
  })
})

const releaseInputSchema = z.object({
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  releaseId: safeId,
  releaseVersion: positiveInteger,
  route: routeSchema,
  serviceIdentityRef: evidenceRefSchema,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  sourceAndDependencyClosureRef: evidenceRefSchema,
  sbomRef: evidenceRefSchema,
  imageScanAndSignatureRef: evidenceRefSchema,
  scaleToZeroConfigurationRef: evidenceRefSchema,
  privateNetworkAndArtifactTransportRef: evidenceRefSchema,
  qualification: canonicalSam31GpuRuntimeQualificationSchema,
  qualifiedAt: timestamp,
  expiresAt: timestamp,
}).strict()

const canonicalReleaseInputWithoutQualificationSchema = releaseInputSchema
  .omit({ qualification: true })
  .extend({
    evidenceClass: z.literal('canonical_private_reread'),
    serviceIdentityRef: versionOneEvidenceRefSchema,
    immutableImageRef: versionOneEvidenceRefSchema,
    scaleToZeroConfigurationRef: versionOneEvidenceRefSchema,
    privateNetworkAndArtifactTransportRef: versionOneEvidenceRefSchema,
  })
  .strict()
type Sam31GpuRuntimeReleaseInput = z.input<typeof releaseInputSchema>
type CanonicalSam31GpuRuntimeReleaseInputWithoutQualification = z.input<
  typeof canonicalReleaseInputWithoutQualificationSchema
>

const releaseObservationWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_VERSION),
  source: z.literal('canonical_sam3_1_gpu_runtime_release_compiler'),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum(['contract_only', 'private_internal_qualified']),
  releaseId: safeId,
  releaseVersion: positiveInteger,
  toolId: z.literal('sam3_1'),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  sourceCandidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  privateArtifactIngestReceiptRef: evidenceRefSchema,
  privateArtifactIngestReceiptHash: sha256,
  ingestStatus: z.enum([
    'contract_validated_only',
    'ready_for_immutable_image_build_review',
  ]),
  sourceArchive: z.object({
    revision: z.literal(
      '96914d2425f90a64f45ca977c2b5165418099543',
    ),
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256,
    gpuDecodePatchSha256: z.literal(
      'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca',
    ),
  }).strict(),
  checkpoint: z.object({
    repositoryRevision: z.literal(
      'daa63191845a41281374e725f4c9e51c7a824460',
    ),
    fileName: z.literal('sam3.1_multiplex.pt'),
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256,
    officialGatedCheckpointOnly: z.literal(true),
    automatedTermsAcceptanceUsed: z.literal(false),
    thirdPartyMirrorUsed: z.literal(false),
  }).strict(),
  runtimeClosure: z.object({
    pythonVersion: z.literal('3.12'),
    torchVersion: z.literal('2.10.0'),
    torchvisionVersion: z.literal('0.25.0'),
    cudaVersion: z.literal('12.8'),
    torchcodecVersion: z.literal('0.10.0'),
    einopsVersion: z.literal('0.8.2'),
    cudaForwardCompatibilityPackageSha256: z.literal(
      'e980bf55b8d1f6390f07968df46644c971a52f4e4129067d33d1445fac716893',
    ),
    cudaDriverLibrarySelectionEntrypointVersion: z.literal(
      'weeditpro-sam3_1-cuda-driver-entrypoint-v1',
    ),
    fixedBuilder: z.literal('build_sam3_multiplex_video_predictor'),
    runtimeNetworkDownloadAllowed: z.literal(false),
    cpuOnlyInferenceAllowed: z.literal(false),
    flashAttention3Enabled: z.literal(false),
  }).strict(),
  route: routeSchema,
  serviceIdentityRef: evidenceRefSchema,
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  imageSupplyChainReleaseRef: evidenceRefSchema.nullable(),
  sourceAndDependencyClosureRef: evidenceRefSchema,
  sbomRef: evidenceRefSchema,
  imageScanAndSignatureRef: evidenceRefSchema,
  scaleToZeroConfigurationRef: evidenceRefSchema,
  privateNetworkAndArtifactTransportRef: evidenceRefSchema,
  qualification: canonicalSam31GpuRuntimeQualificationSchema,
  scaleToZero: z.object({
    minimumIdleInstances: z.literal(0),
    maximumConcurrentAttemptsPerInstance: z.literal(1),
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: z.literal(false),
    startsOnlyFromCreateOnlyApprovedUserAttempt: z.literal(true),
    stopsAtTerminalAttempt: z.literal(true),
  }).strict(),
  qualifiedAt: timestamp,
  expiresAt: timestamp,
  authority: z.object({
    specializedReleaseObservationOnly: z.literal(true),
    privateInternalQualified: z.boolean(),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApprovalGranted: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionQualified: z.literal(false),
  }).strict(),
}).strict().superRefine((release, context) => {
  const canonical = release.evidenceClass === 'canonical_private_reread'
  const qualification = release.qualification
  const exactEvidence = canonical
    ? release.status === 'private_internal_qualified'
      && release.ingestStatus ===
        'ready_for_immutable_image_build_review'
      && release.authority.privateInternalQualified
      && release.imageSupplyChainReleaseRef !== null
      && release.sourceArchive.byteLength === 73_605_120
      && release.sourceArchive.sha256 ===
        '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a'
      && release.sourceArchive.artifactRef.contentHash ===
        `sha256:${release.sourceArchive.sha256}`
      && release.checkpoint.byteLength >= 3_000_000_000
      && release.checkpoint.byteLength <= 5_000_000_000
      && release.checkpoint.artifactRef.contentHash ===
        `sha256:${release.checkpoint.sha256}`
      && qualification.exactToolModelAndCheckpointReread
      && qualification.exactPythonTorchCudaWheelAndNativeClosureReread
      && qualification.runtimeDriverAndLibraryPathEvidenceReread
      && qualification.strictCheckpointLoadWithNoMissingOrUnexpectedKeys
      && qualification.actualCudaModelInferenceMeasured
      && qualification.actualNvdecDecodeMeasured
      && qualification.decodedFramesRemainedCudaResident
      && qualification.bfloat16AutocastMeasured
      && qualification.sourceResolutionAndFrameRangePreserved
      && qualification.temporalMaskQaPassed
      && qualification.directPrivateCompleteIntervalReviewPassed
      && qualification.qualificationRunCount >= 30
      && qualification.eightMinuteSourceP95WallTimeMilliseconds > 0
      && qualification.eightMinuteSourceP95WallTimeMilliseconds <=
        qualification.eightMinuteSourceTargetMilliseconds
      && qualification.qualityEqualToOrBetterThanApprovedA100Baseline
    : release.status === 'contract_only'
      && release.ingestStatus === 'contract_validated_only'
      && !release.authority.privateInternalQualified
      && !qualification.exactToolModelAndCheckpointReread
      && !qualification.exactPythonTorchCudaWheelAndNativeClosureReread
      && !qualification.runtimeDriverAndLibraryPathEvidenceReread
      && !qualification.strictCheckpointLoadWithNoMissingOrUnexpectedKeys
      && !qualification.actualCudaModelInferenceMeasured
      && !qualification.actualNvdecDecodeMeasured
      && !qualification.decodedFramesRemainedCudaResident
      && !qualification.bfloat16AutocastMeasured
      && !qualification.sourceResolutionAndFrameRangePreserved
      && !qualification.temporalMaskQaPassed
      && !qualification.directPrivateCompleteIntervalReviewPassed
      && qualification.qualificationRunCount === 1
      && qualification.eightMinuteSourceP95WallTimeMilliseconds === 0
      && !qualification.qualityEqualToOrBetterThanApprovedA100Baseline
  if (
    !exactEvidence
    || release.immutableImageRef.contentHash !== release.immutableImageDigest
    || Date.parse(release.expiresAt) <= Date.parse(release.qualifiedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 runtime release lost evidence, image, or expiry.',
  })
})

export const canonicalSam31GpuRuntimeReleaseObservationSchema =
  releaseObservationWithoutHashSchema.extend({
    releaseObservationHash: sha256,
  }).strict()
export type CanonicalSam31GpuRuntimeReleaseObservation = z.infer<
  typeof canonicalSam31GpuRuntimeReleaseObservationSchema
>

export function compileCanonicalSam31GpuRuntimeRelease(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly sourceCheckpointQualification:
    CanonicalSam31SourceCheckpointQualification
  readonly imageSupplyChainRelease?:
    CanonicalSam31CloudImageSupplyChainRelease
  readonly release: Sam31GpuRuntimeReleaseInput
}): {
  readonly observation: CanonicalSam31GpuRuntimeReleaseObservation
  readonly runtimeRelease: CanonicalProfessionalToolGpuRuntimeRelease
} {
  return compileCanonicalSam31GpuRuntimeReleaseInternal(input, false)
}

export async function prepareCanonicalSam31GpuRuntimeRelease(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly sourceCheckpointQualification:
    CanonicalSam31SourceCheckpointQualification
  readonly imageSupplyChainRelease:
    CanonicalSam31CloudImageSupplyChainRelease
  readonly release: CanonicalSam31GpuRuntimeReleaseInputWithoutQualification
  readonly qualificationEvidenceRef: ReturnType<
    typeof canonicalSam31GpuRuntimeQualificationEvidenceRef
  >
  readonly qualificationEvidenceReadPort:
    CanonicalSam31GpuRuntimeQualificationEvidenceReadPort
  readonly qualificationCompilationAuthorityRef: ReturnType<
    typeof canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef
  >
  readonly qualificationCompilationAuthorityReadPort:
    CanonicalSam31GpuRuntimeQualificationCompilationAuthorityReadPort
}): Promise<{
  readonly observation: CanonicalSam31GpuRuntimeReleaseObservation
  readonly runtimeRelease: CanonicalProfessionalToolGpuRuntimeRelease
}> {
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  const sourceCheckpointQualification =
    assertCanonicalSam31SourceCheckpointQualification(
      input.sourceCheckpointQualification,
    )
  const imageSupplyChain = assertCanonicalSam31CloudImageSupplyChainRelease(
    input.imageSupplyChainRelease,
  )
  const release = canonicalReleaseInputWithoutQualificationSchema.parse(
    input.release,
  )
  const privateArtifactIngestReceiptRef = {
    id: ingest.ingestReceiptId,
    version: ingest.ingestReceiptVersion,
    contentHash: `sha256:${ingest.ingestReceiptHash}` as const,
  }
  const sourceCheckpointCompatibilityQualificationRef =
    canonicalSam31SourceCheckpointQualificationRef(
      sourceCheckpointQualification,
    )
  const imageSupplyChainReleaseRef = {
    id: imageSupplyChain.releaseId,
    version: imageSupplyChain.releaseVersion,
    contentHash: `sha256:${imageSupplyChain.releaseHash}` as const,
  }
  const qualificationRoute = qualificationRouteFromRelease(release.route)
  const untrustedEvidence = await input.qualificationEvidenceReadPort
    .rereadExact({
      qualificationEvidenceRef: input.qualificationEvidenceRef,
      candidateRef: {
        schemaVersion: candidate.schemaVersion,
        candidateHash: candidate.candidateHash,
      },
      privateArtifactIngestReceiptRef,
      sourceCheckpointCompatibilityQualificationRef,
      imageSupplyChainReleaseRef,
      serviceIdentityRef: release.serviceIdentityRef,
      immutableImageRef: release.immutableImageRef,
      immutableImageDigest: release.immutableImageDigest,
      scaleToZeroConfigurationRef: release.scaleToZeroConfigurationRef,
      privateNetworkAndArtifactTransportRef:
        release.privateNetworkAndArtifactTransportRef,
      route: qualificationRoute,
    })
  if (!untrustedEvidence) {
    throw new Error('SAM 3.1 runtime qualification evidence is unavailable.')
  }
  const evidence = assertCanonicalSam31GpuRuntimeQualificationEvidence(
    untrustedEvidence,
  )
  if (
    !sameEvidenceRef(
      canonicalSam31GpuRuntimeQualificationEvidenceRef(evidence),
      input.qualificationEvidenceRef,
    )
    || evidence.candidateRef.candidateHash !== candidate.candidateHash
    || evidence.candidateRef.schemaVersion !== candidate.schemaVersion
    || !sameEvidenceRef(
      evidence.privateArtifactIngestReceiptRef,
      privateArtifactIngestReceiptRef,
    )
    || !sameEvidenceRef(
      evidence.sourceCheckpointCompatibilityQualificationRef,
      sourceCheckpointCompatibilityQualificationRef,
    )
    || !sameEvidenceRef(
      evidence.imageSupplyChainReleaseRef,
      imageSupplyChainReleaseRef,
    )
    || !sameEvidenceRef(evidence.serviceIdentityRef, release.serviceIdentityRef)
    || !sameEvidenceRef(evidence.immutableImageRef, release.immutableImageRef)
    || evidence.immutableImageDigest !== release.immutableImageDigest
    || !sameEvidenceRef(
      evidence.scaleToZeroConfigurationRef,
      release.scaleToZeroConfigurationRef,
    )
    || !sameEvidenceRef(
      evidence.privateNetworkAndArtifactTransportRef,
      release.privateNetworkAndArtifactTransportRef,
    )
    || !sameQualificationRoute(evidence.route, qualificationRoute)
    || evidence.qualifiedAt !== release.qualifiedAt
  ) throw new Error('SAM 3.1 runtime qualification evidence is stale.')
  const untrustedCompilationAuthority = await input
    .qualificationCompilationAuthorityReadPort
    .rereadQualificationCompilationAuthority({
      authorityRef: input.qualificationCompilationAuthorityRef,
    })
  if (!untrustedCompilationAuthority) {
    throw new Error(
      'SAM 3.1 runtime qualification compilation authority is unavailable.',
    )
  }
  const compilationAuthority =
    assertCanonicalSam31GpuRuntimeQualificationCompilationAuthority(
      untrustedCompilationAuthority,
    )
  if (
    !sameEvidenceRef(
      canonicalSam31GpuRuntimeQualificationCompilationAuthorityRef(
        compilationAuthority,
      ),
      input.qualificationCompilationAuthorityRef,
    )
    || !sameEvidenceRef(
      compilationAuthority.qualificationEvidenceRef,
      input.qualificationEvidenceRef,
    )
    || compilationAuthority.qualificationId !== evidence.qualificationId
    || compilationAuthority.candidateRef.schemaVersion !==
      evidence.candidateRef.schemaVersion
    || compilationAuthority.candidateRef.candidateHash !==
      evidence.candidateRef.candidateHash
    || !sameEvidenceRef(
      compilationAuthority.privateArtifactIngestReceiptRef,
      evidence.privateArtifactIngestReceiptRef,
    )
    || !sameEvidenceRef(
      compilationAuthority.sourceCheckpointCompatibilityQualificationRef,
      evidence.sourceCheckpointCompatibilityQualificationRef,
    )
    || !sameEvidenceRef(
      compilationAuthority.imageSupplyChainReleaseRef,
      evidence.imageSupplyChainReleaseRef,
    )
    || !sameEvidenceRef(
      compilationAuthority.serviceIdentityRef,
      evidence.serviceIdentityRef,
    )
    || !sameEvidenceRef(
      compilationAuthority.immutableImageRef,
      evidence.immutableImageRef,
    )
    || compilationAuthority.immutableImageDigest !==
      evidence.immutableImageDigest
    || !sameEvidenceRef(
      compilationAuthority.scaleToZeroConfigurationRef,
      evidence.scaleToZeroConfigurationRef,
    )
    || !sameEvidenceRef(
      compilationAuthority.privateNetworkAndArtifactTransportRef,
      evidence.privateNetworkAndArtifactTransportRef,
    )
    || !sameQualificationRoute(
      compilationAuthority.route,
      evidence.route,
    )
    || compilationAuthority.qualifiedAt !== evidence.qualifiedAt
    || !compilationAuthority
      .exactQualificationAndFourComponentRecordsReread
    || !compilationAuthority
      .exactComponentPayloadsMatchedQualificationEvidence
    || compilationAuthority.callerSuppliedQualificationBooleansAccepted
    || compilationAuthority.runtimeReleaseGranted
    || compilationAuthority.gpuJobDispatched
    || compilationAuthority.customerCreditsMutated
    || compilationAuthority.productionAuthorityGranted
  ) throw new Error(
    'SAM 3.1 runtime qualification compilation authority is stale.',
  )
  await assertApprovedA100BaselineEvidence({
    evidence,
    readPort: input.qualificationEvidenceReadPort,
  })

  return compileCanonicalSam31GpuRuntimeReleaseInternal({
    candidate,
    ingestReceipt: ingest,
    sourceCheckpointQualification,
    imageSupplyChainRelease: imageSupplyChain,
    release: {
      ...release,
      qualification: qualificationReleaseFields(
        evidence,
        input.qualificationCompilationAuthorityRef,
      ),
    },
  }, true)
}

function compileCanonicalSam31GpuRuntimeReleaseInternal(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly sourceCheckpointQualification:
    CanonicalSam31SourceCheckpointQualification
  readonly imageSupplyChainRelease?:
    CanonicalSam31CloudImageSupplyChainRelease
  readonly release: Sam31GpuRuntimeReleaseInput
}, canonicalQualificationEvidenceVerified: boolean): {
  readonly observation: CanonicalSam31GpuRuntimeReleaseObservation
  readonly runtimeRelease: CanonicalProfessionalToolGpuRuntimeRelease
} {
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  const sourceCheckpointQualification =
    assertCanonicalSam31SourceCheckpointQualification(
      input.sourceCheckpointQualification,
    )
  const release = releaseInputSchema.parse(input.release)
  if (
    release.evidenceClass === 'canonical_private_reread'
    && !canonicalQualificationEvidenceVerified
  ) {
    throw new Error(
      'Canonical SAM 3.1 runtime release requires exact qualification reread.',
    )
  }
  const imageSupplyChain = input.imageSupplyChainRelease
    ? assertCanonicalSam31CloudImageSupplyChainRelease(
      input.imageSupplyChainRelease,
    )
    : null
  if (
    ingest.candidateRef.candidateHash !== candidate.candidateHash
    || ingest.candidateRef.schemaVersion !== candidate.schemaVersion
    || ingest.operationId !== candidate.operationId
    || ingest.evidenceClass !== release.evidenceClass
    || sourceCheckpointQualification.candidateRef.candidateHash !==
      candidate.candidateHash
    || sourceCheckpointQualification.ingestReceiptRef.contentHash !==
      `sha256:${ingest.ingestReceiptHash}`
    || sourceCheckpointQualification.evidenceClass !== release.evidenceClass
    || !sameEvidenceRef(
      release.qualification.sourceCheckpointCompatibilityQualificationRef,
      canonicalSam31SourceCheckpointQualificationRef(
        sourceCheckpointQualification,
      ),
    )
  ) throw new Error('SAM 3.1 candidate, ingest, and release differ.')

  const canonical = release.evidenceClass === 'canonical_private_reread'
  const imageSupplyChainRef = imageSupplyChain
    ? {
      id: imageSupplyChain.releaseId,
      version: imageSupplyChain.releaseVersion,
      contentHash: `sha256:${imageSupplyChain.releaseHash}` as const,
    }
    : null
  if (canonical) {
    if (
      sourceCheckpointQualification.status !==
        'qualified_for_private_image_build'
      || !sourceCheckpointQualification.authority
        .securityLicenseAndCompatibilityQualified
      || !sourceCheckpointQualification.authority
        .privateImageBuildReviewEligible
      || !imageSupplyChain
      || imageSupplyChain.evidenceClass !== 'canonical_private_reread'
      || imageSupplyChain.status !== 'image_supply_chain_qualified'
      || !imageSupplyChain.authority.imageSupplyChainQualified
      || imageSupplyChain.operationId !== candidate.operationId
      || !sameEvidenceRef(
        release.immutableImageRef,
        imageSupplyChain.immutableImageRef,
      )
      || release.immutableImageDigest !==
        imageSupplyChain.immutableImageDigest
      || !sameEvidenceRef(
        release.sourceAndDependencyClosureRef,
        imageSupplyChain.sourceAndDependencyClosureRef,
      )
      || !sameEvidenceRef(release.sbomRef, imageSupplyChain.sbom.artifactRef)
      || !imageSupplyChainRef
      || !sameEvidenceRef(
        release.imageScanAndSignatureRef,
        imageSupplyChainRef,
      )
    ) throw new Error('SAM 3.1 release lacks qualified image supply chain.')
  } else if (
    sourceCheckpointQualification.status !== 'contract_only'
    || sourceCheckpointQualification.authority
      .securityLicenseAndCompatibilityQualified
    || sourceCheckpointQualification.authority.privateImageBuildReviewEligible
    || (imageSupplyChain
      && imageSupplyChain.evidenceClass !== 'synthetic_contract_fixture')
  ) {
    throw new Error('SAM 3.1 contract fixture crossed supply-chain evidence.')
  }
  const observationPayload = releaseObservationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_GPU_RUNTIME_RELEASE_VERSION,
    source: 'canonical_sam3_1_gpu_runtime_release_compiler',
    evidenceClass: release.evidenceClass,
    status: canonical ? 'private_internal_qualified' : 'contract_only',
    releaseId: release.releaseId,
    releaseVersion: release.releaseVersion,
    toolId: 'sam3_1',
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    sourceCandidateRef: {
      schemaVersion: candidate.schemaVersion,
      candidateHash: candidate.candidateHash,
    },
    privateArtifactIngestReceiptRef: {
      id: ingest.ingestReceiptId,
      version: ingest.ingestReceiptVersion,
      contentHash: `sha256:${ingest.ingestReceiptHash}`,
    },
    privateArtifactIngestReceiptHash: ingest.ingestReceiptHash,
    ingestStatus: ingest.status,
    sourceArchive: {
      revision: ingest.sourceArchive.revision,
      artifactRef: ingest.sourceArchive.artifactRef,
      byteLength: ingest.sourceArchive.coordinate.byteLength,
      sha256: ingest.sourceArchive.coordinate.sha256,
      gpuDecodePatchSha256:
        candidate.runtimeClosure.reeditproGpuDecodePatchSha256,
    },
    checkpoint: {
      repositoryRevision: ingest.checkpoint.revision,
      fileName: ingest.checkpoint.fileName,
      artifactRef: ingest.checkpoint.artifactRef,
      byteLength: ingest.checkpoint.coordinate.byteLength,
      sha256: ingest.checkpoint.coordinate.sha256,
      officialGatedCheckpointOnly:
        ingest.privateBoundary.officialGatedCheckpointOnly,
      automatedTermsAcceptanceUsed: false,
      thirdPartyMirrorUsed: ingest.privateBoundary.thirdPartyMirrorAccepted,
    },
    runtimeClosure: {
      pythonVersion: ingest.runtimeClosure.pythonVersion,
      torchVersion: ingest.runtimeClosure.torchVersion,
      torchvisionVersion: ingest.runtimeClosure.torchvisionVersion,
      cudaVersion: ingest.runtimeClosure.cudaVersion,
      torchcodecVersion: candidate.runtimeClosure.candidateTorchcodecVersion,
      einopsVersion: candidate.runtimeClosure.candidateEinopsVersion,
      cudaForwardCompatibilityPackageSha256:
        candidate.runtimeClosure.cudaDriverCompatibility
          .cudaForwardCompatibilitySha256,
      cudaDriverLibrarySelectionEntrypointVersion:
        'weeditpro-sam3_1-cuda-driver-entrypoint-v1',
      fixedBuilder: ingest.runtimeClosure.fixedBuilder,
      runtimeNetworkDownloadAllowed:
        ingest.privateBoundary.runtimeNetworkDownloadAllowed,
      cpuOnlyInferenceAllowed: false,
      flashAttention3Enabled: ingest.runtimeClosure.flashAttention3Enabled,
    },
    route: release.route,
    serviceIdentityRef: release.serviceIdentityRef,
    immutableImageRef: release.immutableImageRef,
    immutableImageDigest: release.immutableImageDigest,
    imageSupplyChainReleaseRef: imageSupplyChainRef,
    sourceAndDependencyClosureRef: release.sourceAndDependencyClosureRef,
    sbomRef: release.sbomRef,
    imageScanAndSignatureRef: release.imageScanAndSignatureRef,
    scaleToZeroConfigurationRef: release.scaleToZeroConfigurationRef,
    privateNetworkAndArtifactTransportRef:
      release.privateNetworkAndArtifactTransportRef,
    qualification: release.qualification,
    scaleToZero: {
      minimumIdleInstances: 0,
      maximumConcurrentAttemptsPerInstance: 1,
      prewarmingKeepaliveOrAlwaysOnPoolAllowed: false,
      startsOnlyFromCreateOnlyApprovedUserAttempt: true,
      stopsAtTerminalAttempt: true,
    },
    qualifiedAt: release.qualifiedAt,
    expiresAt: release.expiresAt,
    authority: {
      specializedReleaseObservationOnly: true,
      privateInternalQualified: canonical,
      customerCreditsMutated: false,
      customerBillingAuthorityGranted: false,
      qaApprovalGranted: false,
      publicDeliveryAuthorized: false,
      productionQualified: false,
    },
  })
  const observation = canonicalSam31GpuRuntimeReleaseObservationSchema.parse({
    ...observationPayload,
    releaseObservationHash: sha256AuthorityValue(observationPayload),
  })
  const genericPayload = {
    schemaVersion:
      'canonical-professional-tool-gpu-runtime-release-observation-v2' as const,
    source: 'canonical_server_gpu_runtime_release_registry' as const,
    evidenceClass: release.evidenceClass,
    releaseId: release.releaseId,
    releaseVersion: release.releaseVersion,
    status: canonical
      ? 'private_internal_qualified' as const
      : 'contract_only' as const,
    toolId: 'sam3_1' as const,
    gpuExecutionOwnerBindingMode: 'native_gpu_implementation' as const,
    gpuExecutionOwnerToolId: 'sam3_1' as const,
    legacyToolSubstantiveExecutionObserved: false as const,
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    toolCostProfileId: 'gpu-tool-sam3_1-v1',
    modelOrOperationCostProfileId:
      'sam3_1_multiplex_video_segmentation_v1',
    routeId: release.route.routeId,
    runtimeRegion: release.route.runtimeRegion,
    executionTarget: release.route.executionTarget,
    machineType: release.route.machineType,
    accelerator: release.route.accelerator,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: release.route.allocatedVcpuCount,
    allocatedMemoryGiB: release.route.allocatedMemoryGiB,
    allocatedLocalScratchGiB: release.route.allocatedLocalScratchGiB,
    serviceIdentityRef: release.serviceIdentityRef,
    immutableImageRef: release.immutableImageRef,
    immutableImageDigest: release.immutableImageDigest,
    sourceAndDependencyClosureRef: release.sourceAndDependencyClosureRef,
    // The model/source artifact authority is shared by the separately
    // qualified A100 and L4 runtime routes. Route-specific release evidence
    // belongs in this generic runtime release's own releaseRef/hash, not in
    // the estimate's exact tool/model artifact binding.
    toolOrModelArtifactReleaseRef:
      observation.privateArtifactIngestReceiptRef,
    sbomRef: release.sbomRef,
    imageScanAndSignatureRef: release.imageScanAndSignatureRef,
    cudaDriverRuntimeQualificationRef:
      release.qualification.cudaDriverRuntimeQualificationRef,
    substantiveGpuExecutionQualificationRef:
      release.qualification.substantiveGpuExecutionQualificationRef,
    scaleToZeroConfigurationRef: release.scaleToZeroConfigurationRef,
    privateNetworkAndArtifactTransportRef:
      release.privateNetworkAndArtifactTransportRef,
    substantiveGpuEvidenceClass:
      'cuda_model_inference_and_nvdec' as const,
    exactToolOrModelVersionReread:
      release.qualification.exactToolModelAndCheckpointReread,
    exactCudaAndNativeDependencyClosureReread:
      release.qualification.exactPythonTorchCudaWheelAndNativeClosureReread,
    actualGpuKernelModelRenderOrHardwareCodecMeasured:
      release.qualification.actualCudaModelInferenceMeasured
      && release.qualification.actualNvdecDecodeMeasured,
    cpuOnlySubstantiveExecutionObserved: false as const,
    gpuHostCpuOnlyExecutionMaySatisfyQualification: false as const,
    runtimeNetworkDownloadAllowed: false as const,
    callerImageModelToolOrCommandSelectionAllowed: false as const,
    minimumIdleInstances: 0 as const,
    maximumConcurrentAttemptsPerInstance: 1 as const,
    prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
    startsOnlyFromCreateOnlyApprovedUserAttempt: true as const,
    stopsAtTerminalAttempt: true as const,
    qualificationRunCount: release.qualification.qualificationRunCount,
    qualifiedAt: release.qualifiedAt,
    expiresAt: release.expiresAt,
    privateInternalQualified: canonical,
    customerBillingAuthorityGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionQualified: false as const,
  }
  const runtimeRelease = canonicalProfessionalToolGpuRuntimeReleaseSchema
    .parse({
      ...genericPayload,
      releaseHash: sha256AuthorityValue(genericPayload),
    })
  return { observation, runtimeRelease }
}

export function assertCanonicalSam31GpuRuntimeReleaseObservation(
  value: unknown,
): CanonicalSam31GpuRuntimeReleaseObservation {
  const release = canonicalSam31GpuRuntimeReleaseObservationSchema.parse(value)
  const { releaseObservationHash, ...payload } = release
  if (releaseObservationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 runtime release observation hash is invalid.')
  }
  return release
}

function sameEvidenceRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

type Sam31RuntimeQualificationRoute = Parameters<
  CanonicalSam31GpuRuntimeQualificationEvidenceReadPort['rereadExact']
>[0]['route']

function qualificationRouteFromRelease(
  route: z.infer<typeof routeSchema>,
): Sam31RuntimeQualificationRoute {
  return Object.freeze({
    routeId: route.routeId,
    gpuProfileId: route.gpuProfileId,
    runtimeRegion: route.runtimeRegion,
    executionTarget: route.executionTarget,
    machineType: route.machineType,
    accelerator: route.accelerator,
  })
}

function sameQualificationRoute(
  left: Sam31RuntimeQualificationRoute,
  right: Sam31RuntimeQualificationRoute,
): boolean {
  return left.routeId === right.routeId
    && left.gpuProfileId === right.gpuProfileId
    && left.runtimeRegion === right.runtimeRegion
    && left.executionTarget === right.executionTarget
    && left.machineType === right.machineType
    && left.accelerator === right.accelerator
}

async function assertApprovedA100BaselineEvidence(input: {
  readonly evidence: ReturnType<
    typeof assertCanonicalSam31GpuRuntimeQualificationEvidence
  >
  readonly readPort: CanonicalSam31GpuRuntimeQualificationEvidenceReadPort
}): Promise<void> {
  if (input.evidence.route.routeId === 'a100_80gb_heavy_primary') return
  const expectedRef = input.evidence.qualityEvidence
    .approvedA100BaselineRuntimeQualificationEvidenceRef
  if (!expectedRef) {
    throw new Error('SAM 3.1 L4 release has no approved A100 baseline.')
  }
  const untrustedBaseline = await input.readPort.rereadEvidenceRefExact({
    qualificationEvidenceRef: expectedRef,
  })
  if (!untrustedBaseline) {
    throw new Error('SAM 3.1 A100 baseline evidence is unavailable.')
  }
  const baseline = assertCanonicalSam31GpuRuntimeQualificationEvidence(
    untrustedBaseline,
  )
  if (
    !sameEvidenceRef(
      canonicalSam31GpuRuntimeQualificationEvidenceRef(baseline),
      expectedRef,
    )
    || baseline.route.routeId !== 'a100_80gb_heavy_primary'
    || baseline.route.accelerator !== 'nvidia_a100_80gb'
    || baseline.qualityEvidence.qualityRole !== 'approved_a100_baseline'
    || baseline.candidateRef.candidateHash !==
      input.evidence.candidateRef.candidateHash
    || !sameEvidenceRef(
      baseline.privateArtifactIngestReceiptRef,
      input.evidence.privateArtifactIngestReceiptRef,
    )
    || !sameEvidenceRef(
      baseline.sourceCheckpointCompatibilityQualificationRef,
      input.evidence.sourceCheckpointCompatibilityQualificationRef,
    )
    || !sameEvidenceRef(
      baseline.imageSupplyChainReleaseRef,
      input.evidence.imageSupplyChainReleaseRef,
    )
    || !sameEvidenceRef(
      baseline.immutableImageRef,
      input.evidence.immutableImageRef,
    )
    || baseline.immutableImageDigest !== input.evidence.immutableImageDigest
    || !sameEvidenceRef(
      baseline.qualityEvidence.temporalMaskQualityQualificationRef,
      input.evidence.qualityEvidence.approvedA100BaselineRef,
    )
    || Date.parse(baseline.qualifiedAt) > Date.parse(input.evidence.qualifiedAt)
  ) throw new Error('SAM 3.1 L4 evidence crossed its A100 baseline.')
}
