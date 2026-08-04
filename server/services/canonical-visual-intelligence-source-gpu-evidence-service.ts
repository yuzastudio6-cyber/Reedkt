import { createHash } from 'node:crypto'

import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type {
  VisualIntelligenceDeterministicTool,
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalSourceVisualIntelligenceGpuEvidencePort,
} from './canonical-source-visual-intelligence-owner-service'
import {
  parseVisualIntelligenceCoverage,
  parseVisualIntelligenceEvidence,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligencePreparedEvidence,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'

export const VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_RELEASE_VERSION =
  'visual-intelligence-source-gpu-evidence-release-v1' as const
export const VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_ENVELOPE_VERSION =
  'visual-intelligence-source-gpu-evidence-envelope-v2' as const
export const VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_WORKER_RESULT_VERSION =
  'visual-intelligence-source-gpu-evidence-worker-result-v1' as const
export const VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_USAGE_COST_VERSION =
  'visual-intelligence-source-gpu-evidence-usage-cost-v1' as const
export const VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_RESULT_VERSION =
  'visual-intelligence-source-gpu-evidence-result-v2' as const

/**
 * Minimal private-object boundary used by the source evidence lane. Keeping
 * this port local to Visual Intelligence avoids coupling source analysis to a
 * transcript worker implementation merely to share create-only/read-exact
 * storage semantics.
 */
export interface VisualIntelligenceSourceGpuEvidenceObjectPort {
  createOnly(input: {
    readonly bucketName: string
    readonly objectName: string
    readonly body: Buffer
    readonly contentType: string
  }): Promise<'created' | 'already_exists'>
  readExact(input: {
    readonly bucketName: string
    readonly objectName: string
    readonly generation?: string
    readonly etag?: string
  }): Promise<{
    readonly body: Buffer
    readonly generation: string
    readonly etag: string
    readonly contentType: string
  } | null>
}

const PROJECT_ID = 'reeditpro' as const
const JOB_NAME = 'reeditpro-visual-intelligence-source-evidence-l4' as const
const OPERATION_ID =
  'internal.visual_intelligence.prepare_source_gpu_evidence.v1' as const
const INVOCATION_ENV = 'REEDITPRO_VISUAL_INTELLIGENCE_EVIDENCE_INVOCATION_ID'
const PREFIX = 'private/visual-intelligence/v1/source-gpu-evidence'
const RELEASE_PREFIX =
  'private/visual-intelligence/releases/source-gpu-evidence/v1/'
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SAFE_OBJECT = /^[A-Za-z0-9][A-Za-z0-9._/:-]{0,1023}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u
const GENERATION = /^[1-9][0-9]{0,30}$/u
const GCS_BUCKET = /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u
const MAX_RECORD_BYTES = 16 * 1024 * 1024
const BYTES_PER_GIB = 1024 ** 3
const THIRTY_DAY_MONTH_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000
const TIMESTAMP = z.string().datetime({ offset: true })
const NONNEGATIVE_INTEGER = z.number().int().nonnegative().safe()
const POSITIVE_INTEGER = z.number().int().positive().safe()

const safeId = z.string().regex(SAFE_ID).refine((value) =>
  !value.includes('..'))
const evidenceRef = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(PREFIXED_SHA256),
}).strict()

const releaseWithoutDigest = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_RELEASE_VERSION,
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_immutable_private_release_reread',
  ]),
  projectId: z.literal(PROJECT_ID),
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  cloudRunJobName: z.literal(JOB_NAME),
  operationId: z.literal(OPERATION_ID),
  releaseRef: evidenceRef,
  immutableImageRef: evidenceRef,
  immutableImageDigest: z.string().regex(PREFIXED_SHA256),
  lifecycleBucketName: z.string().regex(GCS_BUCKET),
  serviceIdentityRef: evidenceRef,
  cloudRunJobConfigurationRef: evidenceRef,
  cloudUsageAndCostObservationOwnerRef: evidenceRef,
  accountEffectivePricingReaderConfigurationRef: evidenceRef,
  billingAccountPricingScopeRef: evidenceRef,
  ffprobeReleaseRef: evidenceRef,
  ffmpegCudaReleaseRef: evidenceRef,
  pySceneDetectPolicyReleaseRef: evidenceRef,
  opencvCudaReleaseRef: evidenceRef,
  nvdecQualificationRef: evidenceRef,
  opencvCudaQualificationRef: evidenceRef,
  gpuSceneScoreQualificationRef: evidenceRef,
  completeSourceCoverageQualificationRef: evidenceRef,
  eightMinutePerformanceQualificationRef: evidenceRef,
  accountEffectiveL4RateAuthorityRef: evidenceRef,
  qualificationRunCount: z.number().int().min(30).max(10_000),
  eightMinuteSourceP95WallTimeMilliseconds:
    z.number().int().positive().max(480_000),
  eightMinuteSourceTargetMilliseconds: z.literal(480_000),
  allocatedAccelerator: z.literal('nvidia_l4'),
  allocatedGpuCount: z.literal(1),
  allocatedVcpuCount: z.literal(8),
  allocatedMemoryGiB: z.literal(32),
  maximumExecutionSeconds: z.literal(900),
  minimumIdleInstances: z.literal(0),
  maximumConcurrentAttemptsPerInstance: z.literal(1),
  cloudRunTaskRetries: z.literal(0),
  userTriggeredOnly: z.literal(true),
  scaleFromZeroRequired: z.literal(true),
  scaleBackToZeroAfterTerminalAttemptRequired: z.literal(true),
  prewarmingOrKeepaliveAllowed: z.literal(false),
  nvdecUsedForSubstantiveDecode: z.literal(true),
  opencvCudaUsedForPixelMeasurements: z.literal(true),
  sceneScoresDerivedFromGpuPixels: z.literal(true),
  pySceneDetectUsedForBoundedPolicyOnly: z.literal(true),
  ffprobeUsedForMetadataOnly: z.literal(true),
  substantiveCpuMediaProcessingAllowed: z.literal(false),
  runtimeNetworkDownloadAllowed: z.literal(false),
  callerPathUrlBytesOrCommandAllowed: z.literal(false),
  privateInternalQualified: z.literal(true),
  customerBillingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.immutableImageRef.contentHash !== value.immutableImageDigest) {
    context.addIssue({
      code: 'custom',
      message: 'Source GPU evidence image identity is inconsistent.',
    })
  }
})

const releaseSchema = releaseWithoutDigest.extend({
  releaseDigestSha256: z.string().regex(PREFIXED_SHA256),
}).strict()

export type VisualIntelligenceSourceGpuEvidenceRelease = z.infer<
  typeof releaseSchema
>

const workerResultWithoutDigest = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_WORKER_RESULT_VERSION,
  ),
  invocationId: safeId,
  envelopeDigestSha256: z.string().regex(PREFIXED_SHA256),
  releaseRef: evidenceRef,
  preparedEvidence: z.unknown(),
  execution: z.object({
    sourceExactGenerationEtagShaLengthRereadVerified: z.literal(true),
    nvdecUsed: z.literal(true),
    ffmpegCudaUsed: z.literal(true),
    opencvCudaUsed: z.literal(true),
    sceneScoresDerivedFromGpuPixels: z.literal(true),
    pySceneDetectPolicyOnly: z.literal(true),
    ffprobeMetadataOnly: z.literal(true),
    substantiveCpuMediaProcessingUsed: z.literal(false),
    runtimeNetworkDownloadPerformed: z.literal(false),
    workerActiveMilliseconds: POSITIVE_INTEGER.max(900_000),
    gpuActiveMilliseconds: POSITIVE_INTEGER.max(900_000),
    sourceBytesRead: POSITIVE_INTEGER,
    persistedPrivateBytes: POSITIVE_INTEGER,
    privateArtifactRetentionMilliseconds: POSITIVE_INTEGER,
    classAOperationCount: POSITIVE_INTEGER,
    classBOperationCount: POSITIVE_INTEGER,
  }).strict().superRefine((value, context) => {
    if (value.gpuActiveMilliseconds > value.workerActiveMilliseconds) {
      context.addIssue({
        code: 'custom',
        message: 'GPU active time exceeds worker active time.',
      })
    }
  }),
}).strict()

const workerResultSchema = workerResultWithoutDigest.extend({
  workerResultDigestSha256: z.string().regex(PREFIXED_SHA256),
}).strict()

export type VisualIntelligenceSourceGpuEvidenceWorkerResult = z.infer<
  typeof workerResultSchema
>

const usageCostWithoutDigest = z.object({
  schemaVersion: z.literal(
    VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_USAGE_COST_VERSION,
  ),
  source: z.literal(
    'canonical_google_cloud_usage_and_account_effective_pricing_reread',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  envelopeDigestSha256: z.string().regex(PREFIXED_SHA256),
  releaseRef: evidenceRef,
  cloudRunExecutionRef: evidenceRef,
  cloudRunTerminalObservationRef: evidenceRef,
  accountEffectiveRateAuthority: z.custom<
    CanonicalCurrentGoogleCloudGpuRateAuthority
  >(),
  workerUsageEvidenceRef: evidenceRef,
  attemptCostReceiptRef: evidenceRef,
  actualUsage: z.object({
    coldStartMilliseconds: NONNEGATIVE_INTEGER,
    activeExecutionMilliseconds: POSITIVE_INTEGER,
    shutdownMilliseconds: NONNEGATIVE_INTEGER,
    totalBillableMilliseconds: POSITIVE_INTEGER,
    allocatedVcpuCount: z.literal(8),
    allocatedMemoryGiB: z.literal(32),
    allocatedGpuCount: z.literal(1),
    persistedPrivateBytes: NONNEGATIVE_INTEGER,
    privateArtifactRetentionMilliseconds: POSITIVE_INTEGER,
    networkEgressBytes: z.literal(0),
    classAOperationCount: POSITIVE_INTEGER,
    classBOperationCount: POSITIVE_INTEGER,
  }).strict(),
  actualCost: z.object({
    gpuUsdNanos: NONNEGATIVE_INTEGER,
    vcpuUsdNanos: NONNEGATIVE_INTEGER,
    memoryUsdNanos: NONNEGATIVE_INTEGER,
    privateStorageUsdNanos: NONNEGATIVE_INTEGER,
    networkEgressUsdNanos: z.literal(0),
    classAOperationUsdNanos: NONNEGATIVE_INTEGER,
    classBOperationUsdNanos: NONNEGATIVE_INTEGER,
    totalInternalCostUsdNanos: NONNEGATIVE_INTEGER,
  }).strict(),
  exactPlatformUsageReread: z.literal(true),
  exactCurrentBillingAccountPriceReread: z.literal(true),
  accountEffectiveCostRecorded: z.literal(true),
  publicListPriceUsedAsSettlementAuthority: z.literal(false),
  platformFundedPreapprovalAnalysis: z.literal(true),
  customerEligibleToolCostMicros: z.literal(0),
  customerEligibleToolCostCredits: z.literal(0),
  serviceFeeIncluded: z.literal(false),
  customerCreditsMutated: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  terminalGpuInstanceCount: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  observedAt: TIMESTAMP,
}).strict().superRefine((value, context) => {
  if (
    value.actualUsage.totalBillableMilliseconds
      !== value.actualUsage.coldStartMilliseconds
        + value.actualUsage.activeExecutionMilliseconds
        + value.actualUsage.shutdownMilliseconds
    || value.actualCost.totalInternalCostUsdNanos
      !== value.actualCost.gpuUsdNanos + value.actualCost.vcpuUsdNanos
        + value.actualCost.memoryUsdNanos
        + value.actualCost.privateStorageUsdNanos
        + value.actualCost.networkEgressUsdNanos
        + value.actualCost.classAOperationUsdNanos
        + value.actualCost.classBOperationUsdNanos
  ) context.addIssue({
    code: 'custom',
    message: 'Source Visual Intelligence GPU usage/cost totals are invalid.',
  })
})

const usageCostSchema = usageCostWithoutDigest.extend({
  usageCostDigestSha256: z.string().regex(PREFIXED_SHA256),
}).strict()

export type VisualIntelligenceSourceGpuEvidenceUsageCost = z.infer<
  typeof usageCostSchema
>

export interface VisualIntelligenceSourceGpuEvidenceUsageCostObserverPort {
  observeAndPersist(input: {
    readonly release: VisualIntelligenceSourceGpuEvidenceRelease
    readonly envelope: Readonly<Record<string, unknown>>
    readonly workerResult: VisualIntelligenceSourceGpuEvidenceWorkerResult
    readonly cloudRunExecutionRef: VisualIntelligenceEvidenceRef
    readonly cloudRunTerminalObservationRef: VisualIntelligenceEvidenceRef
  }): Promise<VisualIntelligenceSourceGpuEvidenceUsageCost>
}

export interface VisualIntelligenceSourceGpuEvidenceCloudRunPort {
  runOnce(input: {
    readonly projectId: typeof PROJECT_ID
    readonly runtimeRegion: 'us-central1' | 'europe-west4'
    readonly jobName: typeof JOB_NAME
    readonly invocationId: string
    readonly maximumExecutionSeconds: 900
  }): Promise<{
    readonly cloudRunExecutionName: string
    readonly cloudRunExecutionRef: VisualIntelligenceEvidenceRef
    readonly cloudRunTerminalObservationRef: VisualIntelligenceEvidenceRef
    readonly completed: true
    readonly runningTaskCount: 0
  }>
}

const admittedReleases = new WeakSet<object>()

/** Test-only constructor. Hosted runtime must reread an immutable release. */
export function createControlledVisualIntelligenceSourceGpuEvidenceRelease(
  input: z.input<typeof releaseWithoutDigest>,
): VisualIntelligenceSourceGpuEvidenceRelease {
  const payload = releaseWithoutDigest.parse(input)
  const release = Object.freeze(releaseSchema.parse({
    ...payload,
    releaseDigestSha256: visualIntelligenceDigest(payload),
  }))
  admittedReleases.add(release)
  return release
}

/** Test-only deterministic worker-result constructor. */
export function createControlledVisualIntelligenceSourceGpuEvidenceWorkerResult(
  input: z.input<typeof workerResultWithoutDigest>,
): VisualIntelligenceSourceGpuEvidenceWorkerResult {
  const payload = workerResultWithoutDigest.parse(input)
  return Object.freeze(workerResultSchema.parse({
    ...payload,
    workerResultDigestSha256: visualIntelligenceDigest(payload),
  }))
}

export function createVisualIntelligenceSourceGpuEvidenceUsageCost(
  input: z.input<typeof usageCostWithoutDigest>,
): VisualIntelligenceSourceGpuEvidenceUsageCost {
  const payload = usageCostWithoutDigest.parse(input)
  const authority = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    payload.accountEffectiveRateAuthority,
    payload.observedAt,
  )
  if (
    authority.routeId !== 'l4_standard_primary'
    || authority.profileId !==
      'quality_l4_user_triggered_standard_media_job_v1'
    || authority.routeRole !== 'standard_primary'
    || authority.accelerator !== 'nvidia_l4'
  ) throw notReady('visual_intelligence_source_gpu_rate_route_invalid')
  return assertVisualIntelligenceSourceGpuEvidenceUsageCost({
    ...payload,
    accountEffectiveRateAuthority: authority,
    usageCostDigestSha256: visualIntelligenceDigest(payload),
  })
}

export function assertVisualIntelligenceSourceGpuEvidenceUsageCost(
  value: unknown,
): VisualIntelligenceSourceGpuEvidenceUsageCost {
  const evidence = usageCostSchema.parse(value)
  const authority = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    evidence.accountEffectiveRateAuthority,
    evidence.observedAt,
  )
  if (
    evidence.usageCostDigestSha256 !== visualIntelligenceDigest(
      omit(evidence, 'usageCostDigestSha256'),
    )
    || authority.routeId !== 'l4_standard_primary'
    || authority.profileId !==
      'quality_l4_user_triggered_standard_media_job_v1'
    || authority.routeRole !== 'standard_primary'
    || authority.accelerator !== 'nvidia_l4'
  ) throw conflict('visual_intelligence_source_gpu_usage_cost_invalid')
  assertUsageCostBreakdownAndRefs(evidence)
  return Object.freeze(evidence)
}

/**
 * Reads a record authored by the separate cloud usage/pricing owner. The GPU
 * media worker cannot author or settle this evidence itself.
 */
export function createVisualIntelligenceSourceGpuEvidenceGcsUsageCostObserverPort(
  input: {
    readonly objectPort: VisualIntelligenceSourceGpuEvidenceObjectPort
    readonly lifecycleBucketName: string
    readonly pollMilliseconds?: number
    readonly maximumWaitMilliseconds?: number
  },
): VisualIntelligenceSourceGpuEvidenceUsageCostObserverPort {
  const lifecycleBucketName = z.string().regex(GCS_BUCKET).parse(
    input.lifecycleBucketName,
  )
  const pollMilliseconds = input.pollMilliseconds ?? 1_000
  const maximumWaitMilliseconds = input.maximumWaitMilliseconds ?? 60_000
  if (
    typeof input.objectPort?.readExact !== 'function'
    || !Number.isInteger(pollMilliseconds)
    || pollMilliseconds < 1
    || !Number.isInteger(maximumWaitMilliseconds)
    || maximumWaitMilliseconds < 1
  ) throw notReady('visual_intelligence_source_gpu_cost_observer_invalid')
  return Object.freeze({
    async observeAndPersist(
      { envelope }: Parameters<
        VisualIntelligenceSourceGpuEvidenceUsageCostObserverPort[
          'observeAndPersist'
        ]
      >[0],
    ) {
      const invocationId = requireVersion(envelope.invocationId)
      const deadline = Date.now() + maximumWaitMilliseconds
      while (Date.now() <= deadline) {
        const stored = await input.objectPort.readExact({
          bucketName: lifecycleBucketName,
          objectName: usageCostObjectName(invocationId),
        })
        if (stored) {
          if (
            stored.contentType !== 'application/json'
            || stored.body.byteLength < 2
            || stored.body.byteLength > MAX_RECORD_BYTES
          ) throw conflict(
            'visual_intelligence_source_gpu_usage_cost_object_invalid',
          )
          return assertVisualIntelligenceSourceGpuEvidenceUsageCost(
            parseJson(stored.body),
          )
        }
        await delay(pollMilliseconds)
      }
      throw unknownOutcome(
        'visual_intelligence_source_gpu_usage_cost_not_reconciled',
      )
    },
  })
}

export async function readVisualIntelligenceSourceGpuEvidenceRelease(input: {
  readonly bucketName: string
  readonly objectName: string
  readonly generation: string
  readonly etag: string
  readonly contentSha256: string
  readonly objectPort: VisualIntelligenceSourceGpuEvidenceObjectPort
}): Promise<VisualIntelligenceSourceGpuEvidenceRelease> {
  validateReleaseCoordinate(input)
  const stored = await input.objectPort.readExact({
    bucketName: input.bucketName,
    objectName: input.objectName,
    generation: input.generation,
    etag: input.etag,
  })
  if (
    !stored
    || stored.generation !== input.generation
    || stored.etag !== input.etag
    || stored.contentType !== 'application/json'
    || stored.body.byteLength < 2
    || stored.body.byteLength > 512 * 1024
    || rawDigest(stored.body) !== input.contentSha256
  ) throw notReady('visual_intelligence_source_gpu_release_identity_invalid')
  const release = parseRelease(parseJson(stored.body))
  if (
    release.evidenceClass !== 'canonical_immutable_private_release_reread'
    || release.lifecycleBucketName !== input.bucketName
    || stored.body.toString('utf8') !== visualIntelligenceCanonicalJson(release)
  ) throw notReady('visual_intelligence_source_gpu_release_not_canonical')
  admittedReleases.add(release)
  return release
}

export function createVisualIntelligenceSourceGpuEvidenceCloudRunPort(input: {
  readonly release: VisualIntelligenceSourceGpuEvidenceRelease
  readonly objectPort: VisualIntelligenceSourceGpuEvidenceObjectPort
  readonly cloudRunPort?: VisualIntelligenceSourceGpuEvidenceCloudRunPort
  readonly usageCostObserverPort:
    VisualIntelligenceSourceGpuEvidenceUsageCostObserverPort
  readonly pollMilliseconds?: number
  readonly maximumWaitMilliseconds?: number
}): CanonicalSourceVisualIntelligenceGpuEvidencePort {
  const release = assertAdmittedRelease(input.release)
  const cloudRunPort = input.cloudRunPort
    ?? createGoogleVisualIntelligenceSourceGpuEvidenceCloudRunPort({ release })
  const pollMilliseconds = input.pollMilliseconds ?? 1_000
  const maximumWaitMilliseconds = input.maximumWaitMilliseconds ?? 60_000
  if (
    !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
    || typeof input.usageCostObserverPort?.observeAndPersist !== 'function'
    || pollMilliseconds < 1
    || maximumWaitMilliseconds < 1
  ) throw notReady('visual_intelligence_source_gpu_port_invalid')

  const port: CanonicalSourceVisualIntelligenceGpuEvidencePort = {
    async prepare(value) {
      const sourceAuthority = value.source.managedApiAuthority
      if (!sourceAuthority) {
        throw notReady('visual_intelligence_source_gpu_authority_missing')
      }
      const invocationId = `vi-source-gpu-${visualIntelligenceDigest({
        requestId: value.requestId,
        sourceChecksumSha256: value.source.checksumSha256,
        sourceGeneration: sourceAuthority.storageGeneration,
        transcriptAuthorityRef: value.transcriptResult.transcriptAuthorityRef,
        releaseDigestSha256: release.releaseDigestSha256,
      }).slice(7, 39)}`
      const envelopeWithoutDigest = {
        schemaVersion:
          VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_ENVELOPE_VERSION,
        invocationId,
        projectId: PROJECT_ID,
        runtimeRegion: release.runtimeRegion,
        cloudRunJobName: JOB_NAME,
        operationId: OPERATION_ID,
        scope: {
          workspaceId: value.workspaceId,
          projectId: value.projectId,
          editSessionId: value.editSessionId,
          analysisRunId: value.analysisRunId,
        },
        source: {
          sourceSequenceItemId: value.source.sourceSequenceItemId,
          mediaAssetId: value.source.mediaAssetId,
          checksumSha256: value.source.checksumSha256,
          byteLength: value.source.byteLength,
          durationFrames: value.source.durationFrames,
          width: sourceAuthority.width,
          height: sourceAuthority.height,
          hasAudio: sourceAuthority.hasAudio,
          fpsNumerator: sourceAuthority.fpsNumerator,
          fpsDenominator: sourceAuthority.fpsDenominator,
          storageBucket: sourceAuthority.storageBucket,
          storagePath: sourceAuthority.storagePath,
          storageGeneration: sourceAuthority.storageGeneration,
          storageEtag: sourceAuthority.storageEtag,
          contentType: sourceAuthority.contentType,
          sourceProbeAuthorityRef: sourceAuthority.sourceProbeAuthorityRef,
          finalizedStorageObjectAuthorityRef:
            sourceAuthority.finalizedStorageObjectAuthorityRef,
          sourceAnalysisConsentRef: sourceAuthority.sourceAnalysisConsentRef,
          platformAnalysisCostCapRef:
            sourceAuthority.platformAnalysisCostCapRef,
        },
        transcriptAuthorityRef: value.transcriptResult.transcriptAuthorityRef,
        transcriptVersion: value.transcriptResult.schemaVersion,
        transcriptToolExecution: sourceAuthority.hasAudio
          ? buildTranscriptToolExecution(value.transcriptResult)
          : null,
        releaseRef: release.releaseRef,
        release,
        algorithm: {
          completeSourceRangeRequired: true,
          nativeVideoInputRequired: true,
          nvdecRequired: true,
          opencvCudaRequired: true,
          gpuDerivedSceneScoresRequired: true,
          pySceneDetectPolicyOnly: true,
          cpuPixelOrFrameDecodeAllowed: false,
          everyTimelineFrameInspectedClaimAllowed: false,
          completeTimePixelInspectionClaimAllowed: false,
          analysisSurfaceWidth: 320,
          analysisSurfaceHeight: 180,
          analysisSurfacePixelFormat: 'nv12_luma',
          gpuSceneScoreAlgorithm: 'cuda_luma_mean_absolute_difference_v1',
          sceneBoundaryThresholdBasisPoints: 1_250,
          minimumSceneLengthFrames: 12,
          maximumSceneCount: 4_096,
          semanticSamplingFramesPerSecondNumerator: 2,
          semanticSamplingFramesPerSecondDenominator: 1,
        },
        boundaries: {
          callerPayloadContainsOnlyInvocationId: true,
          workerReadsEnvelopeFromPrivateLifecycleStore: true,
          runtimeNetworkDownloadAllowed: false,
          directTimelineMutationAllowed: false,
          customerCreditMutationAllowed: false,
          publicDeliveryAllowed: false,
          productionAuthorityGranted: false,
        },
      } as const
      const envelope = Object.freeze({
        ...envelopeWithoutDigest,
        envelopeDigestSha256:
          visualIntelligenceDigest(envelopeWithoutDigest),
      })
      const envelopeObject = `${PREFIX}/requests/${invocationId}.json`
      await persistExact(input.objectPort, release.lifecycleBucketName,
        envelopeObject, envelope)
      const existing = await readResult(input.objectPort, release, envelope)
      if (existing) return existing

      const consumption = {
        schemaVersion:
          'visual-intelligence-source-gpu-evidence-consumption-v1',
        invocationId,
        envelopeDigestSha256: envelope.envelopeDigestSha256,
        maximumAttempts: 1,
        attemptOrdinal: 1,
        uncertainOutcomeRetryAllowed: false,
      } as const
      const consumptionObject = `${PREFIX}/consumptions/${invocationId}.json`
      const disposition = await createOnlyExact(
        input.objectPort,
        release.lifecycleBucketName,
        consumptionObject,
        consumption,
      )
      if (disposition === 'already_exists') {
        return await waitForResult({
          objectPort: input.objectPort,
          release,
          envelope,
          pollMilliseconds,
          maximumWaitMilliseconds,
        })
      }
      let terminal
      try {
        terminal = await cloudRunPort.runOnce({
          projectId: PROJECT_ID,
          runtimeRegion: release.runtimeRegion,
          jobName: JOB_NAME,
          invocationId,
          maximumExecutionSeconds: release.maximumExecutionSeconds,
        })
      } catch (error) {
        throw unknownOutcome(
          'visual_intelligence_source_gpu_dispatch_unknown',
          error,
        )
      }
      if (terminal.completed !== true || terminal.runningTaskCount !== 0) {
        throw unknownOutcome(
          'visual_intelligence_source_gpu_terminal_state_invalid',
        )
      }
      const workerResult = await waitForWorkerResult({
        objectPort: input.objectPort,
        release,
        envelope,
        pollMilliseconds,
        maximumWaitMilliseconds,
      })
      const usageCost = await input.usageCostObserverPort.observeAndPersist({
        release,
        envelope,
        workerResult,
        cloudRunExecutionRef: terminal.cloudRunExecutionRef,
        cloudRunTerminalObservationRef:
          terminal.cloudRunTerminalObservationRef,
      })
      assertUsageCostMatches({
        usageCost,
        release,
        envelope,
        workerResult,
        cloudRunExecutionRef: terminal.cloudRunExecutionRef,
        cloudRunTerminalObservationRef:
          terminal.cloudRunTerminalObservationRef,
      })
      const finalResultWithoutDigest = {
        schemaVersion:
          VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_RESULT_VERSION,
        invocationId,
        envelopeDigestSha256: envelope.envelopeDigestSha256,
        releaseRef: release.releaseRef,
        preparedEvidence: workerResult.preparedEvidence,
        execution: {
          cloudRunExecutionName: terminal.cloudRunExecutionName,
          allocatedAccelerator: 'nvidia_l4',
          allocatedGpuCount: 1,
          sourceExactGenerationAndChecksumRereadVerified: true,
          scaleFromZeroJobConfigurationVerified: true,
          nvdecUsed: true,
          ffmpegCudaUsed: true,
          opencvCudaUsed: true,
          sceneScoresDerivedFromGpuPixels: true,
          pySceneDetectPolicyOnly: true,
          ffprobeMetadataOnly: true,
          substantiveCpuMediaProcessingUsed: false,
          runtimeNetworkDownloadPerformed: false,
          coldStartObserved:
            usageCost.actualUsage.coldStartMilliseconds > 0,
          wallTimeMilliseconds:
            usageCost.actualUsage.totalBillableMilliseconds,
          gpuActiveMilliseconds:
            workerResult.execution.gpuActiveMilliseconds,
          workerUsageEvidenceRef: usageCost.workerUsageEvidenceRef,
          accountEffectiveAttemptCostEvidenceRef:
            usageCost.attemptCostReceiptRef,
          accountEffectiveAttemptCostSettled: true,
          terminalGpuInstanceCount: 0,
          scaleBackToZeroVerified: true,
          customerCreditMutated: false,
        },
      } as const
      const finalResult = Object.freeze({
        ...finalResultWithoutDigest,
        resultDigestSha256:
          visualIntelligenceDigest(finalResultWithoutDigest),
      })
      await persistExact(
        input.objectPort,
        release.lifecycleBucketName,
        finalResultObjectName(invocationId),
        finalResult,
      )
      const accepted = await readResult(input.objectPort, release, envelope)
      if (!accepted) {
        throw unknownOutcome(
          'visual_intelligence_source_gpu_final_result_unreadable',
        )
      }
      return accepted
    },
  }
  return Object.freeze(port)
}

export function createGoogleVisualIntelligenceSourceGpuEvidenceCloudRunPort(
  input: {
    readonly release: VisualIntelligenceSourceGpuEvidenceRelease
    readonly auth?: Pick<GoogleAuth, 'request'>
    readonly pollMilliseconds?: number
  },
): VisualIntelligenceSourceGpuEvidenceCloudRunPort {
  const release = assertAdmittedRelease(input.release)
  const auth = input.auth ?? new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const pollMilliseconds = input.pollMilliseconds ?? 2_000
  const port: VisualIntelligenceSourceGpuEvidenceCloudRunPort = {
    async runOnce(request) {
      const resource = `projects/${request.projectId}/locations/`
        + `${request.runtimeRegion}/jobs/${request.jobName}`
      let job: unknown
      try {
        job = (await auth.request({
          url: `https://run.googleapis.com/v2/${resource}`,
          method: 'GET',
          timeout: 30_000,
          maxRedirects: 0,
          retry: false,
        })).data
      } catch {
        throw notReady(
          'visual_intelligence_source_gpu_job_configuration_unreadable',
        )
      }
      assertCloudRunJobConfiguration(job, release, resource)
      let operation: unknown
      try {
        operation = (await auth.request({
          url: `https://run.googleapis.com/v2/${resource}:run`,
          method: 'POST',
          timeout: 30_000,
          maxRedirects: 0,
          retry: false,
          data: {
            overrides: {
              taskCount: 1,
              timeout: `${request.maximumExecutionSeconds}s`,
              containerOverrides: [{
                env: [{ name: INVOCATION_ENV, value: request.invocationId }],
              }],
            },
          },
        })).data
      } catch (error) {
        throw unknownOutcome('visual_intelligence_source_gpu_start_unknown', error)
      }
      const operationName = readString(operation, 'name')
      const operationPrefix = `projects/${PROJECT_ID}/locations/`
        + `${request.runtimeRegion}/operations/`
      if (!operationName.startsWith(operationPrefix)) {
        throw unknownOutcome('visual_intelligence_source_gpu_operation_invalid')
      }
      const deadline = Date.now() + (request.maximumExecutionSeconds + 60) * 1_000
      let current = operation
      while (readBoolean(current, 'done') !== true) {
        if (Date.now() >= deadline) {
          throw unknownOutcome('visual_intelligence_source_gpu_timeout')
        }
        await delay(pollMilliseconds)
        try {
          current = (await auth.request({
            url: `https://run.googleapis.com/v2/${operationName}`,
            method: 'GET',
            timeout: 30_000,
            maxRedirects: 0,
            retry: false,
          })).data
        } catch (error) {
          throw unknownOutcome('visual_intelligence_source_gpu_poll_unknown', error)
        }
      }
      if (readRecord(current, 'error')) {
        throw unknownOutcome('visual_intelligence_source_gpu_terminal_error')
      }
      const executionName = extractExecutionName(current)
      const expectedPrefix = `projects/${PROJECT_ID}/locations/`
        + `${request.runtimeRegion}/jobs/${JOB_NAME}/executions/`
      if (!executionName.startsWith(expectedPrefix)) {
        throw unknownOutcome('visual_intelligence_source_gpu_execution_invalid')
      }
      let execution: unknown
      try {
        execution = (await auth.request({
          url: `https://run.googleapis.com/v2/${executionName}`,
          method: 'GET',
          timeout: 30_000,
          maxRedirects: 0,
          retry: false,
        })).data
      } catch (error) {
        throw unknownOutcome(
          'visual_intelligence_source_gpu_terminal_reread_unknown',
          error,
        )
      }
      const terminalPayload = assertTerminalCloudRunExecution(
        execution,
        executionName,
        operationName,
      )
      return {
        cloudRunExecutionName: executionName,
        cloudRunExecutionRef: createRef(
          `visual-intelligence-source-gpu-execution-${request.invocationId}`,
          { executionName },
        ),
        cloudRunTerminalObservationRef: createRef(
          `visual-intelligence-source-gpu-terminal-${request.invocationId}`,
          terminalPayload,
        ),
        completed: true,
        runningTaskCount: 0,
      }
    },
  }
  return Object.freeze(port)
}

function assertCloudRunJobConfiguration(
  value: unknown,
  release: VisualIntelligenceSourceGpuEvidenceRelease,
  resourceName: string,
): void {
  const job = requirePlain(
    value,
    'visual_intelligence_source_gpu_job_configuration_invalid',
  )
  const template = requirePlain(
    job.template,
    'visual_intelligence_source_gpu_job_configuration_invalid',
  )
  const task = requirePlain(
    template.template,
    'visual_intelligence_source_gpu_job_configuration_invalid',
  )
  const containers = task.containers
  if (!Array.isArray(containers) || containers.length !== 1) {
    throw notReady('visual_intelligence_source_gpu_job_container_invalid')
  }
  const container = requirePlain(
    containers[0],
    'visual_intelligence_source_gpu_job_container_invalid',
  )
  const resources = requirePlain(
    container.resources,
    'visual_intelligence_source_gpu_job_resources_invalid',
  )
  const limits = requirePlain(
    resources.limits,
    'visual_intelligence_source_gpu_job_resources_invalid',
  )
  const nodeSelector = requirePlain(
    task.nodeSelector,
    'visual_intelligence_source_gpu_job_accelerator_invalid',
  )
  const env = container.env
  if (!Array.isArray(env) || env.length !== 1) {
    throw notReady('visual_intelligence_source_gpu_job_environment_invalid')
  }
  const lifecycleEnvironment = requirePlain(
    env[0],
    'visual_intelligence_source_gpu_job_environment_invalid',
  )
  const image = typeof container.image === 'string' ? container.image : ''
  const serviceAccount = typeof task.serviceAccount === 'string'
    ? task.serviceAccount
    : ''
  const imagePattern = new RegExp(
    `^(?:us-central1|europe-west4)-docker\\.pkg\\.dev/${PROJECT_ID}/`
      + 'reeditpro-staging-workers/'
      + 'reeditpro-visual-intelligence-source-evidence-l4'
      + '@sha256:([a-f0-9]{64})$',
    'u',
  )
  const imageMatch = imagePattern.exec(image)
  const normalized = {
    resourceName,
    taskCount: template.taskCount,
    parallelism: template.parallelism,
    maxRetries: task.maxRetries,
    timeout: task.timeout,
    serviceAccount,
    image,
    cpu: limits.cpu,
    memory: limits.memory,
    gpu: limits['nvidia.com/gpu'],
    accelerator: nodeSelector.accelerator,
    lifecycleBucketName: lifecycleEnvironment.value,
  }
  if (
    job.name !== resourceName
    || template.taskCount !== 1
    || template.parallelism !== 1
    || task.maxRetries !== 0
    || task.timeout !== '900s'
    || !serviceAccount.endsWith(`@${PROJECT_ID}.iam.gserviceaccount.com`)
    || !imageMatch
    || `sha256:${imageMatch[1]}` !== release.immutableImageDigest
    || limits.cpu !== '8'
    || limits.memory !== '32Gi'
    || limits['nvidia.com/gpu'] !== '1'
    || nodeSelector.accelerator !== 'nvidia-l4'
    || lifecycleEnvironment.name !==
      'REEDITPRO_VISUAL_INTELLIGENCE_EVIDENCE_LIFECYCLE_BUCKET'
    || lifecycleEnvironment.value !== release.lifecycleBucketName
    || release.cloudRunJobConfigurationRef.contentHash
      !== visualIntelligenceDigest(normalized)
    || release.serviceIdentityRef.contentHash !== visualIntelligenceDigest({
      serviceAccount,
    })
  ) throw notReady('visual_intelligence_source_gpu_job_configuration_mismatch')
}

function assertTerminalCloudRunExecution(
  value: unknown,
  executionName: string,
  operationName: string,
) {
  const execution = requirePlain(
    value,
    'visual_intelligence_source_gpu_terminal_execution_invalid',
  )
  const conditions = execution.conditions
  const completedCondition = Array.isArray(conditions)
    ? conditions.find((candidate) => {
      if (!candidate || typeof candidate !== 'object') return false
      const record = candidate as Record<string, unknown>
      return record.type === 'Completed'
        && record.state === 'CONDITION_SUCCEEDED'
    })
    : undefined
  const payload = {
    operationName,
    executionName,
    completionTime: execution.completionTime,
    runningTaskCount: execution.runningCount,
    succeededTaskCount: execution.succeededCount,
    failedTaskCount: execution.failedCount,
    cancelledTaskCount: execution.cancelledCount,
    completedConditionState: completedCondition
      ? (completedCondition as Record<string, unknown>).state
      : null,
  }
  if (
    execution.name !== executionName
    || typeof execution.completionTime !== 'string'
    || Number.isNaN(Date.parse(execution.completionTime))
    || execution.runningCount !== 0
    || execution.succeededCount !== 1
    || execution.failedCount !== 0
    || execution.cancelledCount !== 0
    || !completedCondition
  ) throw unknownOutcome(
    'visual_intelligence_source_gpu_terminal_execution_unreconciled',
  )
  return Object.freeze(payload)
}

function buildTranscriptToolExecution(value: Parameters<
  CanonicalSourceVisualIntelligenceGpuEvidencePort['prepare']
>[0]['transcriptResult']) {
  const execution = value.execution
  if (
    !execution.completedRuntimeReleaseRef
    || !execution.completedAttemptReceiptRef
    || execution.gpuAccelerationUsed !== true
    || execution.cpuInferenceFallbackUsed !== false
    || (execution.acceleratorClass !== 'nvidia_a100_80gb'
      && execution.acceleratorClass !== 'nvidia_l4')
  ) throw notReady('visual_intelligence_transcript_execution_lineage_missing')
  return Object.freeze({
    tool: 'faster_whisper' as const,
    requirement: 'required' as const,
    executionClass: execution.acceleratorClass === 'nvidia_a100_80gb'
      ? 'a100_80gb_gpu_heavy' as const
      : 'l4_gpu_standard' as const,
    releaseRef: parseRef(execution.completedRuntimeReleaseRef),
    executionRef: parseRef(execution.completedAttemptReceiptRef),
    substantiveCpuExecutionUsed: false as const,
    sourceArtifactChecksumBound: true as const,
  })
}

function parseRelease(value: unknown): VisualIntelligenceSourceGpuEvidenceRelease {
  const release = releaseSchema.parse(value)
  if (
    release.releaseDigestSha256
      !== visualIntelligenceDigest(omit(release, 'releaseDigestSha256'))
  ) throw notReady('visual_intelligence_source_gpu_release_digest_invalid')
  return Object.freeze(release)
}

function assertAdmittedRelease(
  value: unknown,
): VisualIntelligenceSourceGpuEvidenceRelease {
  const release = parseRelease(value)
  if (!value || typeof value !== 'object' || !admittedReleases.has(value)) {
    throw notReady('visual_intelligence_source_gpu_release_not_reread')
  }
  return release
}

function parsePrepared(
  value: unknown,
  envelope: Record<string, unknown>,
  release: VisualIntelligenceSourceGpuEvidenceRelease,
): VisualIntelligencePreparedEvidence {
  const prepared = requirePlain(value,
    'visual_intelligence_source_gpu_prepared_invalid')
  requireExactKeys(prepared, [
    'deterministicEvidence', 'coveragePlan', 'privateMediaInputs',
    'transcriptVersion', 'ocrVersion', 'toolExecutionEvidence',
    'preparedEvidenceRef',
  ], 'visual_intelligence_source_gpu_prepared_invalid')
  if (!Array.isArray(prepared.deterministicEvidence)) {
    throw conflict('visual_intelligence_source_gpu_evidence_invalid')
  }
  const deterministicEvidence = prepared.deterministicEvidence.map(
    parseVisualIntelligenceEvidence,
  )
  const coveragePlan = parseVisualIntelligenceCoverage(prepared.coveragePlan)
  const source = requirePlain(envelope.source,
    'visual_intelligence_source_gpu_envelope_source_invalid')
  const privateInputs = prepared.privateMediaInputs
  if (!Array.isArray(privateInputs) || privateInputs.length !== 1) {
    throw conflict('visual_intelligence_source_gpu_media_input_invalid')
  }
  const media = requirePlain(privateInputs[0],
    'visual_intelligence_source_gpu_media_input_invalid')
  requireExactKeys(media, [
    'artifactId', 'gcsUri', 'contentType', 'checksumSha256',
    'exactGenerationRereadVerified',
  ], 'visual_intelligence_source_gpu_media_input_invalid')
  const expectedUri = `gs://${String(source.storageBucket)}/`
    + String(source.storagePath)
  if (
    media.artifactId !== source.mediaAssetId
    || media.gcsUri !== expectedUri
    || media.contentType !== 'video/mp4'
    || media.checksumSha256 !== source.checksumSha256
    || media.exactGenerationRereadVerified !== true
  ) throw conflict('visual_intelligence_source_gpu_media_input_mismatch')
  if (!Array.isArray(prepared.toolExecutionEvidence)) {
    throw conflict('visual_intelligence_source_gpu_tool_evidence_invalid')
  }
  const toolExecutionEvidence = prepared.toolExecutionEvidence.map(
    (entry) => parseToolExecution(entry),
  )
  const toolNames: VisualIntelligenceDeterministicTool[] =
    toolExecutionEvidence.map((entry) => entry.tool)
  if (
    new Set(toolNames).size !== toolNames.length
    || !(['ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv'] as const).every(
      (tool) => toolNames.includes(tool),
    )
  ) throw conflict('visual_intelligence_source_gpu_required_tools_missing')
  const preparedEvidenceRef = parseRef(prepared.preparedEvidenceRef)
  const payload = {
    deterministicEvidence,
    coveragePlan,
    privateMediaInputs: [media],
    transcriptVersion: prepared.transcriptVersion,
    ocrVersion: prepared.ocrVersion,
    toolExecutionEvidence,
  }
  if (
    preparedEvidenceRef.contentHash !== visualIntelligenceDigest(payload)
    || coveragePlan.requestedRanges.length !== 1
    || coveragePlan.requestedRanges[0]?.startFrame !== 0
    || coveragePlan.requestedRanges[0]?.endFrameExclusive
      !== source.durationFrames
    || coveragePlan.completeRequestedRangeCoverage !== true
    || coveragePlan.incompleteRanges.length !== 0
    || coveragePlan.everyTimelineFrameInspected !== false
    || coveragePlan.completeTimePixelInspectionClaimAllowed !== false
    || !sameRef(
      toolExecutionEvidence.find((entry) => entry.tool === 'ffprobe')!
        .releaseRef,
      release.ffprobeReleaseRef,
    )
    || !sameRef(
      toolExecutionEvidence.find((entry) => entry.tool === 'ffmpeg')!
        .releaseRef,
      release.ffmpegCudaReleaseRef,
    )
    || !sameRef(
      toolExecutionEvidence.find((entry) => entry.tool === 'pyscenedetect')!
        .releaseRef,
      release.pySceneDetectPolicyReleaseRef,
    )
    || !sameRef(
      toolExecutionEvidence.find((entry) => entry.tool === 'opencv')!
        .releaseRef,
      release.opencvCudaReleaseRef,
    )
  ) throw conflict('visual_intelligence_source_gpu_prepared_mismatch')
  return Object.freeze({
    deterministicEvidence,
    coveragePlan,
    privateMediaInputs: [media as unknown as VisualIntelligencePreparedEvidence[
      'privateMediaInputs'
    ][number]],
    transcriptVersion: requireVersion(prepared.transcriptVersion),
    ocrVersion: prepared.ocrVersion === null
      ? null
      : requireVersion(prepared.ocrVersion),
    toolExecutionEvidence,
    preparedEvidenceRef,
  })
}

function parseToolExecution(value: unknown):
VisualIntelligencePreparedEvidence['toolExecutionEvidence'][number] {
  const record = requirePlain(value,
    'visual_intelligence_source_gpu_tool_evidence_invalid')
  requireExactKeys(record, [
    'tool', 'requirement', 'executionClass', 'releaseRef', 'executionRef',
    'substantiveCpuExecutionUsed', 'sourceArtifactChecksumBound',
  ], 'visual_intelligence_source_gpu_tool_evidence_invalid')
  if (
    typeof record.tool !== 'string'
    || !['ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv',
      'faster_whisper', 'ocr'].includes(record.tool)
    || !['required', 'conditional'].includes(String(record.requirement))
    || !['l4_gpu_standard', 'a100_80gb_gpu_heavy'].includes(
      String(record.executionClass),
    )
    || record.substantiveCpuExecutionUsed !== false
    || record.sourceArtifactChecksumBound !== true
  ) throw conflict('visual_intelligence_source_gpu_tool_evidence_invalid')
  return Object.freeze({
    tool: record.tool,
    requirement: record.requirement,
    executionClass: record.executionClass,
    releaseRef: parseRef(record.releaseRef),
    executionRef: parseRef(record.executionRef),
    substantiveCpuExecutionUsed: false,
    sourceArtifactChecksumBound: true,
  }) as VisualIntelligencePreparedEvidence['toolExecutionEvidence'][number]
}

async function readWorkerResult(input: {
  objectPort: VisualIntelligenceSourceGpuEvidenceObjectPort
  release: VisualIntelligenceSourceGpuEvidenceRelease
  envelope: Record<string, unknown>
}): Promise<VisualIntelligenceSourceGpuEvidenceWorkerResult | null> {
  const invocationId = String(input.envelope.invocationId)
  const stored = await input.objectPort.readExact({
    bucketName: input.release.lifecycleBucketName,
    objectName: workerResultObjectName(invocationId),
  })
  if (!stored) return null
  if (
    stored.contentType !== 'application/json'
    || stored.body.byteLength < 2
    || stored.body.byteLength > MAX_RECORD_BYTES
  ) throw conflict('visual_intelligence_source_gpu_worker_object_invalid')
  const result = workerResultSchema.parse(parseJson(stored.body))
  const source = requirePlain(
    input.envelope.source,
    'visual_intelligence_source_gpu_envelope_source_invalid',
  )
  if (
    result.workerResultDigestSha256 !== visualIntelligenceDigest(
      omit(result, 'workerResultDigestSha256'),
    )
    || result.invocationId !== input.envelope.invocationId
    || result.envelopeDigestSha256 !==
      input.envelope.envelopeDigestSha256
    || !sameRef(result.releaseRef, input.release.releaseRef)
    || result.execution.sourceBytesRead !== source.byteLength
  ) throw conflict('visual_intelligence_source_gpu_worker_result_mismatch')
  parsePrepared(result.preparedEvidence, input.envelope, input.release)
  return Object.freeze(result)
}

async function waitForWorkerResult(input: {
  objectPort: VisualIntelligenceSourceGpuEvidenceObjectPort
  release: VisualIntelligenceSourceGpuEvidenceRelease
  envelope: Record<string, unknown>
  pollMilliseconds: number
  maximumWaitMilliseconds: number
}): Promise<VisualIntelligenceSourceGpuEvidenceWorkerResult> {
  const deadline = Date.now() + input.maximumWaitMilliseconds
  while (Date.now() <= deadline) {
    const result = await readWorkerResult(input)
    if (result) return result
    await delay(input.pollMilliseconds)
  }
  throw unknownOutcome('visual_intelligence_source_gpu_worker_result_timeout')
}

function assertUsageCostMatches(input: {
  usageCost: VisualIntelligenceSourceGpuEvidenceUsageCost
  release: VisualIntelligenceSourceGpuEvidenceRelease
  envelope: Record<string, unknown>
  workerResult: VisualIntelligenceSourceGpuEvidenceWorkerResult
  cloudRunExecutionRef: VisualIntelligenceEvidenceRef
  cloudRunTerminalObservationRef: VisualIntelligenceEvidenceRef
}): void {
  const evidence = usageCostSchema.parse(input.usageCost)
  const authority = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
    evidence.accountEffectiveRateAuthority,
    evidence.observedAt,
  )
  if (
    evidence.usageCostDigestSha256 !== visualIntelligenceDigest(
      omit(evidence, 'usageCostDigestSha256'),
    )
    || evidence.invocationId !== input.envelope.invocationId
    || evidence.envelopeDigestSha256 !==
      input.envelope.envelopeDigestSha256
    || !sameRef(evidence.releaseRef, input.release.releaseRef)
    || !sameRef(evidence.cloudRunExecutionRef, input.cloudRunExecutionRef)
    || !sameRef(
      evidence.cloudRunTerminalObservationRef,
      input.cloudRunTerminalObservationRef,
    )
    || authority.region !== input.release.runtimeRegion
    || !sameRef(
      rateAuthorityRef(authority),
      input.release.accountEffectiveL4RateAuthorityRef,
    )
    || !sameRef(
      authority.pricingReaderConfigurationRef,
      input.release.accountEffectivePricingReaderConfigurationRef,
    )
    || !sameRef(
      authority.billingAccountPricingScopeRef,
      input.release.billingAccountPricingScopeRef,
    )
    || evidence.actualUsage.activeExecutionMilliseconds
      < input.workerResult.execution.workerActiveMilliseconds
    || evidence.actualUsage.persistedPrivateBytes
      < input.workerResult.execution.persistedPrivateBytes
    || evidence.actualUsage.privateArtifactRetentionMilliseconds
      !== input.workerResult.execution.privateArtifactRetentionMilliseconds
    || evidence.actualUsage.classAOperationCount
      < input.workerResult.execution.classAOperationCount
    || evidence.actualUsage.classBOperationCount
      < input.workerResult.execution.classBOperationCount
  ) throw conflict('visual_intelligence_source_gpu_usage_cost_mismatch')
  assertUsageCostBreakdownAndRefs(evidence)
}

function assertUsageCostBreakdownAndRefs(
  evidence: VisualIntelligenceSourceGpuEvidenceUsageCost,
): void {
  type ComponentClass = CanonicalCurrentGoogleCloudGpuRateAuthority[
    'components'
  ][number]['componentClass']
  const component = (name: ComponentClass): number => {
    const match = evidence.accountEffectiveRateAuthority.components.find(
      (candidate) => candidate.componentClass === name,
    )
    if (!match) throw conflict(
      'visual_intelligence_source_gpu_rate_component_missing',
    )
    return match.maximumUsdNanosPerBillingUnit
  }
  const usage = evidence.actualUsage
  const expected = {
    gpuUsdNanos: ceilProductDivision(
      component('cloud_run_l4_gpu_second'),
      usage.totalBillableMilliseconds,
      usage.allocatedGpuCount,
      1_000,
    ),
    vcpuUsdNanos: ceilProductDivision(
      component('cloud_run_vcpu_second'),
      usage.totalBillableMilliseconds,
      usage.allocatedVcpuCount,
      1_000,
    ),
    memoryUsdNanos: ceilProductDivision(
      component('cloud_run_memory_gib_second'),
      usage.totalBillableMilliseconds,
      usage.allocatedMemoryGiB,
      1_000,
    ),
    privateStorageUsdNanos: ceilProductDivision(
      component('private_object_storage_gib_month'),
      usage.persistedPrivateBytes,
      usage.privateArtifactRetentionMilliseconds,
      BYTES_PER_GIB * THIRTY_DAY_MONTH_MILLISECONDS,
    ),
    networkEgressUsdNanos: 0,
    classAOperationUsdNanos: ceilProductDivision(
      component('object_class_a_per_1000'),
      usage.classAOperationCount,
      1,
      1_000,
    ),
    classBOperationUsdNanos: ceilProductDivision(
      component('object_class_b_per_1000'),
      usage.classBOperationCount,
      1,
      1_000,
    ),
  }
  const expectedCost = {
    ...expected,
    totalInternalCostUsdNanos: Object.values(expected).reduce(
      (total, value) => total + value,
      0,
    ),
  }
  const expectedUsageRef = createRef(
    `visual-intelligence-source-gpu-usage-${evidence.invocationId}`,
    {
      invocationId: evidence.invocationId,
      envelopeDigestSha256: evidence.envelopeDigestSha256,
      cloudRunExecutionRef: evidence.cloudRunExecutionRef,
      cloudRunTerminalObservationRef:
        evidence.cloudRunTerminalObservationRef,
      actualUsage: usage,
    },
  )
  const expectedCostRef = createRef(
    `visual-intelligence-source-gpu-cost-${evidence.invocationId}`,
    {
      invocationId: evidence.invocationId,
      accountEffectiveRateAuthorityRef: rateAuthorityRef(
        evidence.accountEffectiveRateAuthority,
      ),
      workerUsageEvidenceRef: expectedUsageRef,
      actualCost: expectedCost,
    },
  )
  if (
    visualIntelligenceCanonicalJson(evidence.actualCost)
      !== visualIntelligenceCanonicalJson(expectedCost)
    || !sameRef(evidence.workerUsageEvidenceRef, expectedUsageRef)
    || !sameRef(evidence.attemptCostReceiptRef, expectedCostRef)
  ) throw conflict('visual_intelligence_source_gpu_cost_reconciliation_invalid')
}

async function readResult(
  port: VisualIntelligenceSourceGpuEvidenceObjectPort,
  release: VisualIntelligenceSourceGpuEvidenceRelease,
  envelope: Record<string, unknown>,
): Promise<VisualIntelligencePreparedEvidence | null> {
  const invocationId = String(envelope.invocationId)
  const stored = await port.readExact({
    bucketName: release.lifecycleBucketName,
    objectName: finalResultObjectName(invocationId),
  })
  if (!stored) return null
  if (
    stored.contentType !== 'application/json'
    || stored.body.byteLength < 2
    || stored.body.byteLength > MAX_RECORD_BYTES
  ) throw conflict('visual_intelligence_source_gpu_result_object_invalid')
  const result = requirePlain(parseJson(stored.body),
    'visual_intelligence_source_gpu_result_invalid')
  requireExactKeys(result, [
    'schemaVersion', 'invocationId', 'envelopeDigestSha256', 'releaseRef',
    'preparedEvidence', 'execution', 'resultDigestSha256',
  ], 'visual_intelligence_source_gpu_result_invalid')
  const execution = requirePlain(result.execution,
    'visual_intelligence_source_gpu_execution_invalid')
  requireExactKeys(execution, [
    'cloudRunExecutionName', 'allocatedAccelerator', 'allocatedGpuCount',
    'sourceExactGenerationAndChecksumRereadVerified',
    'scaleFromZeroJobConfigurationVerified',
    'nvdecUsed', 'ffmpegCudaUsed', 'opencvCudaUsed',
    'sceneScoresDerivedFromGpuPixels', 'pySceneDetectPolicyOnly',
    'ffprobeMetadataOnly', 'substantiveCpuMediaProcessingUsed',
    'runtimeNetworkDownloadPerformed', 'coldStartObserved',
    'wallTimeMilliseconds', 'gpuActiveMilliseconds', 'workerUsageEvidenceRef',
    'accountEffectiveAttemptCostEvidenceRef',
    'accountEffectiveAttemptCostSettled', 'terminalGpuInstanceCount',
    'scaleBackToZeroVerified', 'customerCreditMutated',
  ], 'visual_intelligence_source_gpu_execution_invalid')
  const executionNamePrefix = `projects/${PROJECT_ID}/locations/`
    + `${release.runtimeRegion}/jobs/${JOB_NAME}/executions/`
  if (
    result.schemaVersion !== VISUAL_INTELLIGENCE_SOURCE_GPU_EVIDENCE_RESULT_VERSION
    || result.invocationId !== envelope.invocationId
    || result.envelopeDigestSha256 !== envelope.envelopeDigestSha256
    || !sameRef(parseRef(result.releaseRef), release.releaseRef)
    || result.resultDigestSha256 !== visualIntelligenceDigest(
      omit(result, 'resultDigestSha256'),
    )
    || execution.allocatedAccelerator !== 'nvidia_l4'
    || execution.allocatedGpuCount !== 1
    || typeof execution.cloudRunExecutionName !== 'string'
    || !execution.cloudRunExecutionName.startsWith(executionNamePrefix)
    || execution.sourceExactGenerationAndChecksumRereadVerified !== true
    || execution.scaleFromZeroJobConfigurationVerified !== true
    || execution.nvdecUsed !== true
    || execution.ffmpegCudaUsed !== true
    || execution.opencvCudaUsed !== true
    || execution.sceneScoresDerivedFromGpuPixels !== true
    || execution.pySceneDetectPolicyOnly !== true
    || execution.ffprobeMetadataOnly !== true
    || execution.substantiveCpuMediaProcessingUsed !== false
    || execution.runtimeNetworkDownloadPerformed !== false
    || typeof execution.coldStartObserved !== 'boolean'
    || !Number.isSafeInteger(execution.wallTimeMilliseconds)
    || Number(execution.wallTimeMilliseconds) < 1
    || Number(execution.wallTimeMilliseconds) > release.maximumExecutionSeconds
      * 1_000
    || !Number.isSafeInteger(execution.gpuActiveMilliseconds)
    || Number(execution.gpuActiveMilliseconds) < 1
    || Number(execution.gpuActiveMilliseconds)
      > Number(execution.wallTimeMilliseconds)
    || execution.accountEffectiveAttemptCostSettled !== true
    || execution.terminalGpuInstanceCount !== 0
    || execution.scaleBackToZeroVerified !== true
    || execution.customerCreditMutated !== false
  ) throw conflict('visual_intelligence_source_gpu_result_mismatch')
  parseRef(execution.workerUsageEvidenceRef)
  parseRef(execution.accountEffectiveAttemptCostEvidenceRef)
  return parsePrepared(result.preparedEvidence, envelope, release)
}

async function waitForResult(input: {
  objectPort: VisualIntelligenceSourceGpuEvidenceObjectPort
  release: VisualIntelligenceSourceGpuEvidenceRelease
  envelope: Record<string, unknown>
  pollMilliseconds: number
  maximumWaitMilliseconds: number
}): Promise<VisualIntelligencePreparedEvidence> {
  const deadline = Date.now() + input.maximumWaitMilliseconds
  while (Date.now() <= deadline) {
    const result = await readResult(
      input.objectPort,
      input.release,
      input.envelope,
    )
    if (result) return result
    await delay(input.pollMilliseconds)
  }
  throw unknownOutcome('visual_intelligence_source_gpu_result_timeout')
}

async function persistExact(
  port: VisualIntelligenceSourceGpuEvidenceObjectPort,
  bucketName: string,
  objectName: string,
  value: unknown,
): Promise<void> {
  await createOnlyExact(port, bucketName, objectName, value)
}

async function createOnlyExact(
  port: VisualIntelligenceSourceGpuEvidenceObjectPort,
  bucketName: string,
  objectName: string,
  value: unknown,
): Promise<'created' | 'already_exists'> {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_source_gpu_record_size_invalid')
  }
  const disposition = await port.createOnly({
    bucketName,
    objectName,
    body,
    contentType: 'application/json',
  })
  const reread = await port.readExact({ bucketName, objectName })
  if (
    !reread
    || reread.contentType !== 'application/json'
    || !reread.body.equals(body)
  ) throw conflict('visual_intelligence_source_gpu_record_reread_mismatch')
  return disposition
}

function workerResultObjectName(invocationId: string): string {
  return `${PREFIX}/worker-results/${invocationId}.json`
}

function finalResultObjectName(invocationId: string): string {
  return `${PREFIX}/final-results/${invocationId}.json`
}

function usageCostObjectName(invocationId: string): string {
  return `${PREFIX}/usage-cost/${invocationId}.json`
}

function validateReleaseCoordinate(input: {
  bucketName: string
  objectName: string
  generation: string
  etag: string
  contentSha256: string
  objectPort: VisualIntelligenceSourceGpuEvidenceObjectPort
}): void {
  if (
    !GCS_BUCKET.test(input.bucketName)
    || !input.objectName.startsWith(RELEASE_PREFIX)
    || !input.objectName.endsWith('.json')
    || !safeObjectName(input.objectName)
    || !GENERATION.test(input.generation)
    || !input.etag
    || !RAW_SHA256.test(input.contentSha256)
    || !input.objectPort
    || typeof input.objectPort.readExact !== 'function'
  ) throw notReady('visual_intelligence_source_gpu_release_coordinate_invalid')
}

function parseRef(value: unknown): VisualIntelligenceEvidenceRef {
  return evidenceRef.parse(value)
}

function requireVersion(value: unknown): string {
  if (
    typeof value !== 'string'
    || value.length < 1
    || value.length > 160
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value)
  ) throw conflict('visual_intelligence_source_gpu_version_invalid')
  return value
}

function requirePlain(value: unknown, gate: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict(gate)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw conflict(gate)
  }
  return value as Record<string, unknown>
}

function requireExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  gate: string,
): void {
  const own = Reflect.ownKeys(value)
  if (
    own.length !== keys.length
    || own.some((key) => typeof key !== 'string' || !keys.includes(key))
    || keys.some((key) => !Object.hasOwn(value, key))
  ) throw conflict(gate)
}

function extractExecutionName(value: unknown): string {
  const response = readRecord(value, 'response')
  const metadata = response ? readRecord(response, 'metadata') : null
  const name = metadata ? readString(metadata, 'name') : ''
  if (!name) throw unknownOutcome('visual_intelligence_source_gpu_no_execution')
  return name
}

function readRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const result = (value as Record<string, unknown>)[key]
  return result && typeof result === 'object' && !Array.isArray(result)
    ? result as Record<string, unknown>
    : null
}

function readString(value: unknown, key: string): string {
  if (!value || typeof value !== 'object') return ''
  const result = (value as Record<string, unknown>)[key]
  return typeof result === 'string' ? result : ''
}

function readBoolean(value: unknown, key: string): boolean | null {
  if (!value || typeof value !== 'object') return null
  const result = (value as Record<string, unknown>)[key]
  return typeof result === 'boolean' ? result : null
}

function omit(value: Record<string, unknown>, key: string): unknown {
  const copy = { ...value }
  Reflect.deleteProperty(copy, key)
  return copy
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function rateAuthorityRef(
  value: CanonicalCurrentGoogleCloudGpuRateAuthority,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: value.rateAuthorityId,
    version: value.rateAuthorityVersion,
    contentHash: `sha256:${value.rateAuthorityHash}`,
  })
}

function createRef(
  id: string,
  value: unknown,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id,
    version: 1,
    contentHash: visualIntelligenceDigest(value),
  })
}

function ceilProductDivision(
  left: number,
  middle: number,
  right: number,
  divisor: number,
): number {
  const numerator = BigInt(left) * BigInt(middle) * BigInt(right)
  const quotient = (numerator + BigInt(divisor) - 1n) / BigInt(divisor)
  const result = Number(quotient)
  if (!Number.isSafeInteger(result) || result < 0) {
    throw conflict('visual_intelligence_source_gpu_cost_overflow')
  }
  return result
}

function parseJson(body: Buffer): unknown {
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_source_gpu_json_invalid')
  }
}

function rawDigest(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex')
}

function safeObjectName(value: string): boolean {
  return SAFE_OBJECT.test(value)
    && !value.startsWith('/')
    && !value.endsWith('/')
    && !value.includes('..')
    && !value.includes('\\')
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The L4 Visual Intelligence source-evidence runtime is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The L4 Visual Intelligence source-evidence runtime rejected conflicting evidence.',
    409,
    { requiredGate },
  )
}

function unknownOutcome(requiredGate: string, cause?: unknown): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The L4 Visual Intelligence source-evidence attempt outcome requires canonical reconciliation.',
    503,
    {
      requiredGate,
      causeName: cause instanceof Error ? cause.name : undefined,
    },
  )
}
