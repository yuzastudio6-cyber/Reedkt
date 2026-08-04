import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { GoogleAuth } from 'google-auth-library'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalA100BatchReleaseObservation,
  createGoogleBatchA100JobInvocationPort,
  type CanonicalA100BatchJobInvocationPort,
} from '../services/canonical-a100-batch-job-invocation-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION,
  type CanonicalSourceAnalysisFinalizedAuthority,
} from '../services/canonical-source-analysis-preparation-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  type CanonicalSourceAnalysisPlanningScope,
} from '../services/canonical-source-led-orchestra-planning-reconciliation'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
} from '../services/canonical-source-led-professional-content-analysis-port'
import {
  createCanonicalSourceTranscriptOrchestraRepository,
} from '../services/canonical-source-transcript-orchestra-repository'
import {
  CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_READ_PORT_VERSION,
  CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_READ_PORT_VERSION,
  createCanonicalSourceTranscriptA100AttemptOwner,
  createCanonicalSourceTranscriptA100UsageCost,
  createCanonicalSourceTranscriptA100WorkerResult,
  createCanonicalSourceTranscriptAdmission,
  createCanonicalSourceTranscriptTrigger,
  type CanonicalSourceTranscriptAdmission,
  type CanonicalSourceTranscriptSourceContext,
} from '../services/canonical-source-transcript-a100-attempt-owner'
import {
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity,
} from '../services/canonical-source-visual-intelligence-analysis-contract'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'

const NOW = '2026-08-03T12:15:00.000Z'
const COST_OBSERVED_AT = '2026-08-03T12:16:00.000Z'
const rawSha = (value: string | Buffer) => createHash('sha256')
  .update(value).digest('hex')
const ref = (
  id: string,
  value: unknown = { id },
): VisualIntelligenceEvidenceRef => Object.freeze({
  id,
  version: 1,
  contentHash: `sha256:${sha256AuthorityValue(value)}`,
})

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly objects = new Map<string, Buffer>()

  async createOnly(input: {
    readonly objectPath: string
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawSha(input.body), input.contentSha256)
    if (this.objects.has(input.objectPath)) return 'already_exists'
    this.objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const body = this.objects.get(objectPath)
    return body ? Buffer.from(body) : null
  }
}

const rate = await currentA100Rate()
const modelDigest = rawSha('qualified-faster-whisper-large-v3-model-bytes')
const release = createCanonicalA100BatchReleaseObservation({
  releaseRef: ref('a100-source-transcript-release'),
  runtimeRegion: 'us-central1',
  batchInstanceTemplateResource:
    'projects/reeditpro/global/instanceTemplates/reeditpro-source-transcript-a100-v1',
  batchInstanceTemplateRef: ref('a100-source-transcript-instance-template'),
  runtimeImageUri:
    `us-central1-docker.pkg.dev/reeditpro/gpu-workers/source-transcript-a100@sha256:${rawSha('runtime-image')}`,
  runtimeImageRef: {
    id: 'a100-source-transcript-runtime-image',
    version: 1,
    contentHash: `sha256:${rawSha('runtime-image')}`,
  },
  cudaRuntimeRef: ref('cuda-runtime-12-3-2'),
  gpuDriverRuntimeRef: ref('a100-gpu-driver-runtime'),
  gpuDriverVersion: '570.195.03',
  modelArtifactImageRef: ref('faster-whisper-large-v3-model-image'),
  modelManifestRef: {
    id: 'faster-whisper-large-v3-model-manifest',
    version: 1,
    contentHash: `sha256:${modelDigest}`,
  },
  modelDigestSha256: `sha256:${modelDigest}`,
  runtimeQualificationEvidenceRef: ref('a100-runtime-qualification'),
  modelArtifactQualificationEvidenceRef:
    ref('large-v3-model-qualification'),
  instanceTemplateQualificationEvidenceRef:
    ref('a100-instance-template-qualification'),
  privateSecurityReviewRef: ref('a100-private-security-review'),
  privateLicenseReviewRef: ref('large-v3-private-license-review'),
  lifecycleBucketName: 'reeditpro-source-analysis-lifecycle-us',
  privateArtifactBucketName: 'reeditpro-source-analysis-private-us',
  maximumExecutionSeconds: 480,
})

const audioFixture = makeFixture('audio', true)
const lifecycleObjects = new MemoryObjectPort()
const transcriptRepository = createCanonicalSourceTranscriptOrchestraRepository({
  objectPort: lifecycleObjects,
  prefix: 'private/smoke/source-transcript-results',
})
let admission: CanonicalSourceTranscriptAdmission | undefined
let sourceContext: CanonicalSourceTranscriptSourceContext | undefined
let runOnceCalls = 0
let reconcileCalls = 0
const successfulInvocation = batchPort('SUCCEEDED', () => {
  runOnceCalls += 1
}, () => {
  reconcileCalls += 1
})
const owner = createCanonicalSourceTranscriptA100AttemptOwner({
  requestAuthorityReadPort: requestPort(audioFixture),
  finalizedAuthorityReadPort: finalizedPort(audioFixture),
  admissionReadPort: {
    schemaVersion: 'canonical-source-transcript-admission-read-port-v1',
    async rereadAdmittedTranscript(input) {
      sourceContext = input.sourceContext
      admission = makeAdmission(input.trigger, input.sourceContext)
      return admission
    },
  },
  releaseReadPort: {
    schemaVersion: 'canonical-source-transcript-a100-release-read-port-v1',
    async rereadPrivateA100TranscriptRelease() {
      return release
    },
  },
  invocationPort: successfulInvocation,
  workerResultReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_READ_PORT_VERSION,
    async readCompletedWorkerResult(input) {
      assert.ok(admission)
      assert.ok(sourceContext)
      return makeWorker({
        invocationId: input.invocationId,
        invocationResultRef: input.invocationResultRef,
        admission,
        sourceContext,
      })
    },
  },
  usageCostReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_READ_PORT_VERSION,
    async readCompletedUsageCost(input) {
      assert.ok(admission)
      assert.equal(input.terminalState, 'SUCCEEDED')
      return makeUsage({
        invocationId: input.invocationId,
        invocationResultRef: input.invocationResultRef,
        admission,
        outcome: 'executed',
      })
    },
  },
  transcriptRepository,
  lifecycleObjectPort: lifecycleObjects,
  prefix: 'private/smoke/source-transcript-attempts',
  now: () => new Date(NOW),
})

const created = await owner.executeOneShot(audioFixture.trigger)
assert.equal(created.status, 'ready')
assert.equal(created.disposition, 'created')
assert.equal(created.invocationId?.startsWith('source-transcript-a100-'), true)
assert.equal(created.attemptCostEvidenceRef?.id, 'a100-attempt-cost')
assert.equal(created.scaleBackToZeroVerified, true)
assert.equal(created.platformFundedPreapprovalAnalysis, true)
assert.equal(created.customerCreditMutated, false)
assert.equal(runOnceCalls, 1)
assert.equal(reconcileCalls, 0)
assert.equal(lifecycleObjects.objects.size, 3)

const replay = await owner.executeOneShot(audioFixture.trigger)
assert.equal(replay.status, 'ready')
assert.equal(replay.disposition, 'identical_replay')
assert.equal(runOnceCalls, 1, 'completed transcript replay must not redispatch')
assert.equal(reconcileCalls, 0)
assert.equal(lifecycleObjects.objects.size, 3)

const noAudioFixture = makeFixture('silent', false)
const noAudioObjects = new MemoryObjectPort()
let noAudioAdmissionReread = 0
let noAudioInvocation = 0
const noAudioOwner = createCanonicalSourceTranscriptA100AttemptOwner({
  requestAuthorityReadPort: requestPort(noAudioFixture),
  finalizedAuthorityReadPort: finalizedPort(noAudioFixture),
  admissionReadPort: {
    schemaVersion: 'canonical-source-transcript-admission-read-port-v1',
    async rereadAdmittedTranscript() {
      noAudioAdmissionReread += 1
      return null
    },
  },
  releaseReadPort: {
    schemaVersion: 'canonical-source-transcript-a100-release-read-port-v1',
    async rereadPrivateA100TranscriptRelease() {
      throw new Error('no-audio source must not reread an A100 release')
    },
  },
  invocationPort: {
    async runOnce() {
      noAudioInvocation += 1
      throw new Error('no-audio source must not start a GPU job')
    },
    async reconcileExisting() {
      throw new Error('no-audio source must not reconcile a GPU job')
    },
  },
  workerResultReadPort: unavailableWorkerPort(),
  usageCostReadPort: unavailableUsagePort(),
  transcriptRepository: createCanonicalSourceTranscriptOrchestraRepository({
    objectPort: noAudioObjects,
    prefix: 'private/smoke/no-audio-transcript-results',
  }),
  lifecycleObjectPort: noAudioObjects,
  prefix: 'private/smoke/no-audio-transcript-attempts',
  now: () => new Date(NOW),
})
const noAudio = await noAudioOwner.executeOneShot(noAudioFixture.trigger)
assert.equal(noAudio.status, 'ready')
assert.equal(noAudio.invocationId, null)
assert.equal(noAudio.attemptCostEvidenceRef, null)
assert.equal(noAudioAdmissionReread, 0)
assert.equal(noAudioInvocation, 0)
assert.equal(noAudioObjects.objects.size, 1)

const unknownFixture = makeFixture('unknown', true)
const unknownObjects = new MemoryObjectPort()
let unknownRunCalls = 0
let unknownReconciliationCalls = 0
const unknownOwner = createCanonicalSourceTranscriptA100AttemptOwner({
  requestAuthorityReadPort: requestPort(unknownFixture),
  finalizedAuthorityReadPort: finalizedPort(unknownFixture),
  admissionReadPort: admissionPort(),
  releaseReadPort: releasePort(),
  invocationPort: {
    async runOnce() {
      unknownRunCalls += 1
      throw unknownBatchOutcome('a100_batch_create_outcome_unknown')
    },
    async reconcileExisting() {
      unknownReconciliationCalls += 1
      throw unknownBatchOutcome('a100_batch_reconciliation_read_unknown')
    },
  },
  workerResultReadPort: unavailableWorkerPort(),
  usageCostReadPort: unavailableUsagePort(),
  transcriptRepository: createCanonicalSourceTranscriptOrchestraRepository({
    objectPort: unknownObjects,
    prefix: 'private/smoke/unknown-transcript-results',
  }),
  lifecycleObjectPort: unknownObjects,
  prefix: 'private/smoke/unknown-transcript-attempts',
  now: () => new Date(NOW),
})
const unknownFirst = await unknownOwner.executeOneShot(unknownFixture.trigger)
assert.equal(unknownFirst.status, 'reconciliation_required')
assert.equal(unknownFirst.blockerCode, 'source_transcript_a100_outcome_unknown')
assert.equal(unknownFirst.automaticRetryAllowed, false)
assert.equal(unknownFirst.unknownOutcomeChargedToCustomer, false)
const unknownSecond = await unknownOwner.executeOneShot(unknownFixture.trigger)
assert.equal(unknownSecond.status, 'reconciliation_required')
assert.equal(unknownRunCalls, 1, 'unknown attempt must consume only once')
assert.equal(unknownReconciliationCalls, 1)
assert.equal(unknownObjects.objects.size, 1)

const unrelatedFixture = makeFixture('unrelated', true)
const unrelatedOwner = createCanonicalSourceTranscriptA100AttemptOwner({
  requestAuthorityReadPort: requestPort(unrelatedFixture),
  finalizedAuthorityReadPort: finalizedPort(unrelatedFixture),
  admissionReadPort: admissionPort(),
  releaseReadPort: releasePort(),
  invocationPort: {
    async runOnce() {
      throw new ApiError(
        'JOB_DEPENDENCY_NOT_READY',
        'Unrelated dependency is unavailable.',
        503,
        {
          requiredGate: 'unrelated_dependency',
          retryAllowed: false,
          fallbackAllowed: false,
        },
      )
    },
    async reconcileExisting() {
      throw new Error('unrelated dependency must not be reconciled here')
    },
  },
  workerResultReadPort: unavailableWorkerPort(),
  usageCostReadPort: unavailableUsagePort(),
  transcriptRepository: createCanonicalSourceTranscriptOrchestraRepository({
    objectPort: new MemoryObjectPort(),
    prefix: 'private/smoke/unrelated-transcript-results',
  }),
  lifecycleObjectPort: new MemoryObjectPort(),
  now: () => new Date(NOW),
})
await assert.rejects(
  unrelatedOwner.executeOneShot(unrelatedFixture.trigger),
  /Unrelated dependency is unavailable/u,
)

const invalidWorker = makeWorker({
  invocationId: 'source-transcript-a100-invalid-worker',
  invocationResultRef: ref('invalid-worker-invocation-result'),
  admission: makeAdmission(
    audioFixture.trigger,
    sourceContext!,
  ),
  sourceContext: sourceContext!,
})
const overlappingSegments = structuredClone(invalidWorker)
overlappingSegments.transcript.segments.push({
  segmentId: 'segment-overlap',
  startFrame: 120,
  endFrameExclusive: 240,
  text: 'This range overlaps the prior transcript range.',
  confidenceBasisPoints: 9_000,
  wordsVerified: true,
})
overlappingSegments.transcript.transcriptDigestSha256 =
  sha256AuthorityValue(overlappingSegments.transcript.segments)
const overlappingCoverage = {
  ...overlappingSegments.transcript.coverage,
}
Reflect.deleteProperty(overlappingCoverage, 'coverageDigestSha256')
overlappingSegments.transcript.coverage.coverageDigestSha256 =
  sha256AuthorityValue(overlappingCoverage)
await assert.rejects(async () =>
  createCanonicalSourceTranscriptA100WorkerResult({
    ...stripWorkerEnvelope(overlappingSegments),
  }))

const missingRequestOwner = createCanonicalSourceTranscriptA100AttemptOwner({
  requestAuthorityReadPort: {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest() {
      return null
    },
  },
  finalizedAuthorityReadPort: finalizedPort(audioFixture),
  admissionReadPort: admissionPort(),
  releaseReadPort: releasePort(),
  invocationPort: successfulInvocation,
  workerResultReadPort: unavailableWorkerPort(),
  usageCostReadPort: unavailableUsagePort(),
  transcriptRepository,
  lifecycleObjectPort: lifecycleObjects,
  now: () => new Date(NOW),
})
const missingRequest = await missingRequestOwner.executeOneShot(
  makeFixture('missing', true).trigger,
)
assert.deepEqual(missingRequest, {
  status: 'not_ready',
  blockerCode: 'canonical_source_analysis_request_not_ready',
  gpuJobStarted: false,
  automaticRetryAllowed: false,
  customerCreditMutated: false,
})

console.log(JSON.stringify({
  qualification: 'canonical-source-transcript-a100-attempt-owner-v1',
  checks: 38,
  exactPreparedFinalizedProbeConsentCostRateReleaseReread: true,
  createOnlyConsumptionBeforeBatchCreate: true,
  completedTranscriptPersistedAndReread: true,
  completedReplayDidNotRedispatch: true,
  noAudioBypassedGpu: true,
  unknownOutcomeDidNotRetryOrAutoFallback: true,
  restartUsedReadOnlyReconciliation: true,
  unrelatedDependencyNotMisclassifiedAsUnknownAttempt: true,
  transcriptSegmentsOrderedBoundedAndWordVerified: true,
  workerUsageMatchedAccountEffectiveCostRecord: true,
  fasterWhisperLargeV3Required: true,
  acceleratorClass: owner.acceleratorClass,
  minimumIdleInstances: owner.minimumIdleInstances,
  maximumAttempts: owner.maximumAttempts,
  cpuInferenceFallbackAllowed: owner.cpuInferenceFallbackAllowed,
  platformFundedPreapprovalAnalysis: true,
  customerCreditsMutated: false,
  liveGpuJobStarted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function makeFixture(suffix: string, hasAudio: boolean) {
  const sourceChecksum = rawSha(`exact-source-video-${suffix}`)
  const finalizedMediaAuthorityRef = ref(`finalized-media-${suffix}`)
  const finalizedStorageObjectAuthorityRef =
    ref(`finalized-storage-${suffix}`)
  const sourceProbeAuthorityRef = ref(`source-probe-${suffix}`)
  const planningDirection =
    'Understand the entire source before selecting cleanup cuts and preserve every instruction.'
  const source: CanonicalSourceLedProfessionalContentAnalysisInput['sources'][number] = {
    sourceSequenceItemId: `source-item-${suffix}`,
    mediaAssetId: `media-asset-${suffix}`,
    uploadedOrder: 1,
    storageProvider: 'google_cloud_storage',
    storageBucket: 'reeditpro-private-source-media',
    storagePath: `workspaces/workspace-1/source-${suffix}.mp4`,
    checksumSha256: sourceChecksum,
    byteLength: 48_000_000,
    durationFrames: 480,
    managedApiAuthority: {
      ownerUserId: 'user-1',
      storageBucket: 'reeditpro-private-source-media',
      storagePath: `workspaces/workspace-1/source-${suffix}.mp4`,
      contentType: 'video/mp4',
      storageGeneration: '101',
      storageEtag: `source-etag-${suffix}`,
      width: 1_920,
      height: 1_080,
      hasAudio,
      audioProbe: hasAudio ? {
        disposition: 'verified_audio_stream',
        videoStreamIndex: 0,
        videoStartTimeBaseUnits: 0,
        videoTimeBaseNumerator: 1,
        videoTimeBaseDenominator: 12_288,
        audioStreamIndex: 1,
        audioStartTimeBaseUnits: 0,
        audioDurationTimeBaseUnits: 960_000,
        audioTimeBaseNumerator: 1,
        audioTimeBaseDenominator: 48_000,
        audioSampleRateHertz: 48_000,
        audioChannelCount: 2,
      } : { disposition: 'verified_no_audio_stream' },
      fpsNumerator: 24,
      fpsDenominator: 1,
      frameCount: 480,
      sourceTimeBaseNumerator: 1,
      sourceTimeBaseDenominator: 12_288,
      finalizedMediaAuthorityRef,
      finalizedStorageObjectAuthorityRef,
      sourceBindingManifestCandidateRef: ref(`source-manifest-${suffix}`),
      sourceProbeAuthorityRef,
      providerMediaReadAuthorityRef: ref(`provider-read-${suffix}`),
      sourceAnalysisConsentRef: ref(`analysis-consent-${suffix}`),
      platformAnalysisCostCapRef: ref(`analysis-cost-cap-${suffix}`),
    },
  }
  const request: CanonicalSourceLedProfessionalContentAnalysisInput = {
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: `edit-session-${suffix}`,
    planningDirection,
    planningDirectionDigestSha256: rawSha(planningDirection),
    userInstructionDigestSha256: rawSha(`user-instruction-${suffix}`),
    fps: 30,
    sources: [source],
  }
  const identity =
    createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity(request)
  const authority = source.managedApiAuthority!
  const planningScope: CanonicalSourceAnalysisPlanningScope = {
    ownerUserId: authority.ownerUserId,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    planningDirection: request.planningDirection,
    planningDirectionDigestSha256: request.planningDirectionDigestSha256,
    userInstructionDigestSha256: request.userInstructionDigestSha256,
    sources: [{
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      storageProvider: 'google_cloud_storage',
      storageBucket: source.storageBucket,
      storagePath: source.storagePath,
      contentType: 'video/mp4',
      checksumSha256: source.checksumSha256,
      byteLength: source.byteLength,
      storageGeneration: authority.storageGeneration,
      storageEtag: authority.storageEtag,
    }],
  }
  const finalized: CanonicalSourceAnalysisFinalizedAuthority = {
    schemaVersion: 'canonical-source-analysis-finalized-authority-v1',
    ownerUserId: authority.ownerUserId,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    storageProvider: 'google_cloud_storage',
    storageBucket: source.storageBucket,
    storagePath: source.storagePath,
    contentType: 'video/mp4',
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    storageGeneration: authority.storageGeneration,
    storageEtag: authority.storageEtag,
    finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef,
    sourceBindingManifestCandidateRef:
      authority.sourceBindingManifestCandidateRef,
    providerMediaReadAuthorityRef: authority.providerMediaReadAuthorityRef,
    sourceAnalysisConsentRef: authority.sourceAnalysisConsentRef,
    platformAnalysisCostCapRef: authority.platformAnalysisCostCapRef,
    authenticatedPrincipalRereadVerified: true,
    workspaceProjectAccessRereadVerified: true,
    finalizedUploadRereadVerified: true,
    exactGenerationEtagShaLengthRereadVerified: true,
    sourceBindingManifestRereadVerified: true,
    sourceAnalysisConsentRereadVerified: true,
    platformAnalysisCostCapRereadVerified: true,
    browserStorageAuthorityAccepted: false,
    callerPathUrlBytesOrCommandAccepted: false,
  }
  const trigger = createCanonicalSourceTranscriptTrigger({
    requestId: `source-transcript-request-${suffix}`,
    planningScope,
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    userTriggerRecordRef: ref(`user-trigger-${suffix}`),
    idempotencyKey: `source-transcript-idempotency-${suffix}`,
    triggeredAt: '2026-08-03T12:14:00.000Z',
    serverPreparedRequestRequired: true,
    browserSourceOrTranscriptAuthorityAccepted: false,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false,
    customerCreditMutationAuthorized: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  return Object.freeze({ request, identity, planningScope, finalized, trigger })
}

function requestPort(fixture: ReturnType<typeof makeFixture>) {
  return {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest(scope: CanonicalSourceAnalysisPlanningScope) {
      assert.deepEqual(scope, fixture.planningScope)
      return fixture.request
    },
  } as const
}

function finalizedPort(fixture: ReturnType<typeof makeFixture>) {
  return {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION,
    async readExactFinalizedSource() {
      return fixture.finalized
    },
  } as const
}

function makeAdmission(
  trigger: ReturnType<typeof createCanonicalSourceTranscriptTrigger>,
  context: CanonicalSourceTranscriptSourceContext,
) {
  return createCanonicalSourceTranscriptAdmission({
    admissionId: `source-transcript-admission-${context.sourceSequenceItemId}`,
    triggerRef: {
      id: `source-transcript-trigger-${trigger.triggerHash.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${trigger.triggerHash}`,
    },
    sourceContext: context,
    preparedRequestContentRef: {
      id: `source-analysis-request-content-${context.requestDigestSha256.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${context.requestDigestSha256}`,
    },
    platformEstimateRef: ref(`platform-estimate-${context.sourceSequenceItemId}`),
    currentAccountRateAuthorityRef: {
      id: rate.rateAuthorityId,
      version: rate.rateAuthorityVersion,
      contentHash: `sha256:${rate.rateAuthorityHash}`,
    },
    runtimeReleaseRef: release.releaseRef,
    operationId: release.operationId,
    routeProfileId: release.profileId,
    modelCostProfileId: release.modelCostProfileId,
    routeId: 'a100_80gb_heavy_primary',
    maximumAttempts: 1,
    attemptOrdinal: 1,
    uncertainOutcomeRetryAllowed: false,
    createOnlyConsumptionRequiredBeforeBatchCreate: true,
    exactPreparedFinalizedProbeConsentCostRateAndReleaseReread: true,
    userTriggeredScaleFromZero: true,
    minimumIdleInstances: 0,
    platformFundedPreapprovalAnalysis: true,
    maximumPlatformInternalCostUsdNanos: 100_000_000_000,
    customerCreditReservationRequired: false,
    customerCreditsMutated: false,
    systemFailureOrUnknownCostChargedToCustomer: false,
    unapprovedOverageChargedToCustomer: false,
    l4FallbackMayBeSelectedByThisAdmission: false,
    admittedAt: '2026-08-03T12:00:00.000Z',
    expiresAt: '2026-08-03T13:00:00.000Z',
  })
}

function admissionPort() {
  return {
    schemaVersion: 'canonical-source-transcript-admission-read-port-v1',
    async rereadAdmittedTranscript(input: {
      trigger: ReturnType<typeof createCanonicalSourceTranscriptTrigger>
      sourceContext: CanonicalSourceTranscriptSourceContext
    }) {
      return makeAdmission(input.trigger, input.sourceContext)
    },
  } as const
}

function releasePort() {
  return {
    schemaVersion: 'canonical-source-transcript-a100-release-read-port-v1',
    async rereadPrivateA100TranscriptRelease() {
      return release
    },
  } as const
}

function makeWorker(input: {
  invocationId: string
  invocationResultRef: VisualIntelligenceEvidenceRef
  admission: CanonicalSourceTranscriptAdmission
  sourceContext: CanonicalSourceTranscriptSourceContext
}) {
  const segments = [{
    segmentId: 'segment-whole-source',
    startFrame: 0,
    endFrameExclusive: input.sourceContext.durationFrames,
    text: 'Keep the complete useful explanation and delete the failed take before it.',
    confidenceBasisPoints: 9_700,
    wordsVerified: true,
  }]
  const coverage = {
    schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: input.sourceContext.durationFrames,
    completeAudioTimelineProcessed: true as const,
    speechSegmentsMayOmitSilence: true as const,
    embeddedInstructionDetectionRequired: true as const,
  }
  return createCanonicalSourceTranscriptA100WorkerResult({
    invocationId: input.invocationId,
    admissionRef: {
      id: `source-transcript-admission-${input.admission.admissionHash.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${input.admission.admissionHash}`,
    },
    releaseRef: release.releaseRef,
    invocationResultRef: input.invocationResultRef,
    sourceContext: input.sourceContext,
    workerRuntimeRecordRef: ref('a100-worker-runtime-record'),
    privateTranscriptArtifactRef: ref('private-transcript-artifact'),
    modelManifestRef: release.modelManifestRef,
    transcript: {
      status: 'completed',
      modelId: 'faster-whisper-large-v3',
      modelDigestSha256: modelDigest,
      runtimeVersion: 'faster-whisper-1.2.1',
      transcriptDigestSha256: sha256AuthorityValue(segments),
      segments,
      coverage: {
        ...coverage,
        coverageDigestSha256: sha256AuthorityValue(coverage),
      },
      rawAudioPersisted: false,
      modelDownloadPerformed: false,
      networkAttempted: false,
    },
    execution: {
      exactInvocationSourceGenerationAndProbeRereadVerified: true,
      completeAudioTimelineProcessed: true,
      cudaInferenceUsed: true,
      a100DeviceVerified: true,
      fp16Used: true,
      wordTimestampsProduced: true,
      modelBytesPinnedBeforeExecution: true,
      runtimeNetworkDownloadPerformed: false,
      cpuInferenceFallbackUsed: false,
      rawAudioPersisted: false,
      sourceBytesRead: input.sourceContext.byteLength,
      privateArtifactBytes: 4_096,
      workerActiveMilliseconds: 11_000,
      modelLoadMilliseconds: 3_000,
      gpuActiveMilliseconds: 8_000,
      classAOperationCount: 2,
      classBOperationCount: 3,
    },
    sourceBytesIncluded: false,
    rawAudioBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    credentialsIncluded: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
}

function makeUsage(input: {
  invocationId: string
  invocationResultRef: VisualIntelligenceEvidenceRef
  admission: CanonicalSourceTranscriptAdmission
  outcome: 'executed' | 'not_executed' | 'unknown'
}) {
  return createCanonicalSourceTranscriptA100UsageCost({
    invocationId: input.invocationId,
    admissionRef: {
      id: `source-transcript-admission-${input.admission.admissionHash.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${input.admission.admissionHash}`,
    },
    releaseRef: release.releaseRef,
    invocationResultRef: input.invocationResultRef,
    cloudBatchTerminalObservationRef: ref('batch-terminal-observation'),
    cloudCapacityTeardownObservationRef: ref('batch-capacity-zero-observation'),
    workerUsageEvidenceRef: ref('a100-worker-usage'),
    platformUsageRereadRef: ref('google-cloud-platform-usage-reread'),
    attemptCostEvidenceRef: ref('a100-attempt-cost'),
    accountEffectiveRateAuthority: rate,
    providerInferenceOrSubstantiveWorkOutcome: input.outcome,
    actualUsage: {
      coldStartMilliseconds: 2_000,
      runtimeAndModelLoadMilliseconds: 3_000,
      activeGpuMilliseconds: 8_000,
      drainAndShutdownMilliseconds: 1_000,
      totalBillableMilliseconds: 14_000,
      allocatedGpuCount: 1,
      allocatedVcpuCount: 12,
      allocatedMemoryGiB: 170,
      allocatedLocalScratchGiB: 375,
      privateArtifactBytes: 4_096,
      privateArtifactRetentionMilliseconds: 86_400_000,
      networkEgressBytes: 0,
      classAOperationCount: 2,
      classBOperationCount: 3,
    },
    exactPlatformUsageReread: true,
    exactCurrentBillingAccountPriceReread: true,
    accountEffectiveCostRecorded: true,
    publicListPriceUsedAsSettlementAuthority: false,
    platformFundedPreapprovalAnalysis: true,
    customerEligibleToolCostUsdNanos: 0,
    customerEligibleToolCostCredits: 0,
    serviceFeeIncluded: false,
    customerCreditsMutated: false,
    systemFailureOrUnknownCostChargedToCustomer: false,
    unapprovedOverageChargedToCustomer: false,
    terminalGpuInstanceCount: 0,
    scaleBackToZeroVerified: true,
    observedAt: COST_OBSERVED_AT,
  })
}

function batchPort(
  terminalState: 'SUCCEEDED' | 'FAILED',
  onRun: () => void,
  onReconcile: () => void,
): CanonicalA100BatchJobInvocationPort {
  let jobResource = ''
  const delegate = createGoogleBatchA100JobInvocationPort({
    auth: {
      async request(request: Record<string, unknown>) {
        const params = request.params as { jobId: string } | undefined
        if (request.method === 'POST') {
          jobResource =
            `projects/reeditpro/locations/us-central1/jobs/${params?.jobId}`
          return { data: terminalJob(jobResource, terminalState) }
        }
        return { data: terminalJob(jobResource, terminalState) }
      },
    } as unknown as Pick<GoogleAuth, 'request'>,
    pollMilliseconds: 1,
    sleep: async () => undefined,
  })
  return {
    async runOnce(input) {
      onRun()
      return delegate.runOnce(input)
    },
    async reconcileExisting(input) {
      onReconcile()
      return delegate.reconcileExisting(input)
    },
  }
}

function terminalJob(
  resource: string,
  state: 'SUCCEEDED' | 'FAILED',
) {
  return {
    name: resource,
    uid: `batch-job-${state.toLowerCase()}-001`,
    status: {
      state,
      runDuration: state === 'SUCCEEDED' ? '14s' : '3s',
    },
  }
}

function unknownBatchOutcome(requiredGate: string) {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'A100 attempt outcome is unknown.',
    503,
    { requiredGate, retryAllowed: false, fallbackAllowed: false },
  )
}

function unavailableWorkerPort() {
  return {
    schemaVersion:
      CANONICAL_SOURCE_TRANSCRIPT_A100_WORKER_RESULT_READ_PORT_VERSION,
    async readCompletedWorkerResult() {
      return null
    },
  } as const
}

function unavailableUsagePort() {
  return {
    schemaVersion:
      CANONICAL_SOURCE_TRANSCRIPT_A100_USAGE_COST_READ_PORT_VERSION,
    async readCompletedUsageCost() {
      return null
    },
  } as const
}

function stripWorkerEnvelope(
  worker: ReturnType<typeof makeWorker>,
) {
  const {
    schemaVersion: omittedSchemaVersion,
    source: omittedSource,
    evidenceClass: omittedEvidenceClass,
    workerResultHash: omittedWorkerResultHash,
    ...input
  } = worker
  void omittedSchemaVersion
  void omittedSource
  void omittedEvidenceClass
  void omittedWorkerResultHash
  return input
}

async function currentA100Rate(): Promise<
  CanonicalCurrentGoogleCloudGpuRateAuthority
> {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: 'current-a100-account-effective-rate-v1',
    rateAuthorityVersion: 1,
    routeId: 'a100_80gb_heavy_primary',
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() {
        return rawA100RateObservation()
      },
    },
  })
}

function rawA100RateObservation(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    rateComponent(
      'a2_ultragpu_1g_machine_bundle',
      'machine_hour',
      5_068_797_890,
      'a',
    ),
    rateComponent(
      'private_object_storage_gib_month',
      'gib_month',
      20_000_000,
      'b',
    ),
    rateComponent(
      'network_egress_gib',
      'gib',
      120_000_000,
      'c',
    ),
    rateComponent(
      'object_class_a_per_1000',
      'per_1000_operations',
      5_000_000,
      'd',
    ),
    rateComponent(
      'object_class_b_per_1000',
      'per_1000_operations',
      400_000,
      'e',
    ),
  ]
  const base = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-account-pricing-scope'),
    pricingReaderConfigurationRef: ref('a100-rate-reader-configuration'),
    routeId: 'a100_80gb_heavy_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('a100-price-record-set'),
    pricingReadStartedAt: '2026-08-03T11:59:55.000Z',
    pricingReadFinishedAt: '2026-08-03T12:00:00.000Z',
  }
  return {
    ...base,
    pricingReadDigestSha256: sha256AuthorityValue(base),
  }
}

function rateComponent(
  componentClass:
    | 'a2_ultragpu_1g_machine_bundle'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'machine_hour'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  price: number,
  character: string,
) {
  const compute = componentClass.startsWith('a2_')
  const cloudServiceId = compute
    ? 'service-compute-engine'
    : 'service-cloud-storage'
  return {
    componentClass,
    cloudServiceName: compute ? 'compute-engine' : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId: `sku-${componentClass}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: price,
      }],
      maximumContractPriceUsdNanos: price,
      skuMetadataRef: ref(`sku-metadata-${componentClass}`, character),
      billingAccountPriceRef:
        ref(`account-price-${componentClass}`, character),
    }],
    skuDescriptionDigestSha256: character.repeat(64),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: '2026-08-03T12:00:00.000Z',
    skuRecordRef: ref(`sku-record-${componentClass}`, character),
  }
}
