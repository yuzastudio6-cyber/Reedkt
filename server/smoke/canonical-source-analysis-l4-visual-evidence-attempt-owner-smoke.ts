import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  type CanonicalSourceAnalysisPlanningScope,
} from '../services/canonical-source-led-orchestra-planning-reconciliation'
import {
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity,
} from '../services/canonical-source-visual-intelligence-analysis-contract'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
} from '../services/canonical-source-led-professional-content-analysis-port'
import {
  createCanonicalSourceLedSourceFrameAuthority,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceRepository,
  createCanonicalSourceAnalysisL4VisualEvidenceResult,
} from '../services/canonical-source-analysis-l4-visual-evidence-repository'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceAdmission,
  createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner,
  createCanonicalSourceAnalysisL4VisualEvidenceRelease,
  createCanonicalSourceAnalysisL4VisualEvidenceTrigger,
  createGoogleCloudRunL4VisualEvidenceExecutionPort,
  type CanonicalSourceAnalysisL4VisualEvidenceExecutionResult,
} from '../services/canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'

const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const ref = (
  id: string,
  value: unknown = { id },
): VisualIntelligenceEvidenceRef => Object.freeze({
  id,
  version: 1,
  contentHash: `sha256:${sha256AuthorityValue(value)}`,
})

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly values = new Map<string, Buffer>()

  async createOnly(input: {
    objectPath: string
    body: Buffer
    contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256)
    if (this.values.has(input.objectPath)) return 'already_exists'
    this.values.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(path: string): Promise<Buffer | null> {
    const body = this.values.get(path)
    return body ? Buffer.from(body) : null
  }
}

const finalizedRef = ref('finalized-source')
const storageRef = ref('finalized-storage')
const probeRef = ref('source-probe')
const consentRef = ref('source-analysis-consent')
const costCapRef = ref('source-analysis-cost-cap')
const planningDirection =
  'Watch the complete source and preserve meaning before proposing cuts.'
const planningDirectionDigestSha256 = sha(planningDirection)
const userInstructionDigestSha256 = sha('authenticated-user-instructions')
const sourceChecksum = sha('exact-private-source')
const request = {
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  planningDirection,
  planningDirectionDigestSha256,
  userInstructionDigestSha256,
  fps: 30 as const,
  sources: [{
    sourceSequenceItemId: 'source-item-1',
    mediaAssetId: 'media-asset-1',
    uploadedOrder: 1,
    storageProvider: 'google_cloud_storage' as const,
    storageBucket: 'private-source-bucket',
    storagePath: 'workspace-1/source.mp4',
    checksumSha256: sourceChecksum,
    byteLength: 4_096,
    durationFrames: 240,
    managedApiAuthority: {
      ownerUserId: 'user-1',
      storageBucket: 'private-source-bucket',
      storagePath: 'workspace-1/source.mp4',
      contentType: 'video/mp4' as const,
      storageGeneration: '1001',
      storageEtag: 'source-etag-1',
      width: 1_920,
      height: 1_080,
      hasAudio: true,
      audioProbe: {
        disposition: 'verified_audio_stream' as const,
        videoStreamIndex: 0,
        videoStartTimeBaseUnits: 0,
        videoTimeBaseNumerator: 1,
        videoTimeBaseDenominator: 24,
        audioStreamIndex: 1,
        audioStartTimeBaseUnits: 0,
        audioDurationTimeBaseUnits: 480_000,
        audioTimeBaseNumerator: 1,
        audioTimeBaseDenominator: 48_000,
        audioSampleRateHertz: 48_000,
        audioChannelCount: 2,
      },
      fpsNumerator: 24,
      fpsDenominator: 1,
      frameCount: 240,
      sourceTimeBaseNumerator: 1,
      sourceTimeBaseDenominator: 24,
      finalizedMediaAuthorityRef: finalizedRef,
      finalizedStorageObjectAuthorityRef: storageRef,
      sourceBindingManifestCandidateRef: ref('source-binding-manifest'),
      sourceProbeAuthorityRef: probeRef,
      providerMediaReadAuthorityRef: ref('provider-media-read'),
      sourceAnalysisConsentRef: consentRef,
      platformAnalysisCostCapRef: costCapRef,
    },
  }],
} satisfies CanonicalSourceLedProfessionalContentAnalysisInput
const identity =
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity(request)
const planningScope: CanonicalSourceAnalysisPlanningScope = {
  ownerUserId: 'user-1',
  workspaceId: request.workspaceId,
  projectId: request.projectId,
  editSessionId: request.editSessionId,
  planningDirection,
  planningDirectionDigestSha256,
  userInstructionDigestSha256,
  sources: request.sources.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    storageProvider: source.storageProvider,
    storageBucket: source.storageBucket,
    storagePath: source.storagePath,
    contentType: 'video/mp4' as const,
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    storageGeneration: source.managedApiAuthority.storageGeneration,
    storageEtag: source.managedApiAuthority.storageEtag,
  })),
}
const sourceFrameAuthority = createCanonicalSourceLedSourceFrameAuthority({
  fpsNumerator: 24,
  fpsDenominator: 1,
  frameCount: 240,
  timeBaseNumerator: 1,
  timeBaseDenominator: 24,
})
const evidenceScope = {
  ownerUserId: 'user-1',
  workspaceId: request.workspaceId,
  projectId: request.projectId,
  editSessionId: request.editSessionId,
  analysisRunId: identity.analysisRunId,
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  checksumSha256: sourceChecksum,
  byteLength: 4_096,
  durationFrames: 240,
  sourceFrameAuthority,
  finalizedMediaAuthorityRef: finalizedRef,
  sourceProbeAuthorityRef: probeRef,
} as const
const releaseRef = ref('l4-visual-evidence-release')
const toolReleases = [
  releaseItem('media_probe',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe, 1),
  releaseItem('private_media_transform',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 2),
  releaseItem('scene_detection',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect, 3),
  releaseItem('pixel_measurement',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv, 4),
  releaseItem('exact_visible_text',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr, 5),
  releaseItem('sampling_policy',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 6),
]
const release = createCanonicalSourceAnalysisL4VisualEvidenceRelease({
  releaseRef,
  operationId: 'internal.visual_intelligence.prepare_source_visual_evidence.v1',
  routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
  routeId: 'l4_standard_primary',
  projectId: 'reeditpro',
  runtimeRegion: 'us-central1',
  cloudRunJobName: 'reeditpro-professional-l4',
  cloudRunJobResource:
    'projects/reeditpro/locations/us-central1/jobs/reeditpro-professional-l4',
  acceleratorClass: 'nvidia_l4',
  immutableImageRef: Object.freeze({
    id: 'l4-visual-image',
    version: 1,
    contentHash: `sha256:${sha('l4-visual-image')}`,
  }),
  immutableImageDigest: `sha256:${sha('l4-visual-image')}`,
  toolReleases,
  maximumExecutionSeconds: 900,
  maximumAttempts: 1,
  minimumIdleInstances: 0,
  configuredGpuType: 'nvidia-l4',
  runtimeDownloadAllowed: false,
  callerCommandImageModelPathUrlOrEnvironmentAccepted: false,
  substantiveCpuMediaProcessingAllowed: false,
  retryAfterUnknownOutcomeAllowed: false,
  accountEffectivePricingRequired: true,
  publicListPriceSettlementAllowed: false,
  productionAuthorityGranted: false,
  observedAt: '2026-08-04T12:00:00.000Z',
})
const trigger = createCanonicalSourceAnalysisL4VisualEvidenceTrigger({
  requestId: 'source-visual-evidence-trigger-1',
  planningScope,
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  userTriggerRecordRef: ref('user-trigger'),
  idempotencyKey: 'source-visual-evidence-trigger-1',
  triggeredAt: '2026-08-04T12:00:01.000Z',
  serverPreparedRequestRequired: true,
  browserSourceOrEvidenceAuthorityAccepted: false,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false,
  customerCreditMutationAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
const preparedRequestContentRef = Object.freeze({
  id: `prepared-source-analysis-${identity.requestDigest.slice(0, 32)}`,
  version: 1,
  contentHash: `sha256:${identity.requestDigest}`,
})
const admission = createCanonicalSourceAnalysisL4VisualEvidenceAdmission({
  admissionId: 'source-visual-evidence-admission-1',
  triggerRef: Object.freeze({
    id: trigger.requestId,
    version: 1,
    contentHash: `sha256:${trigger.triggerHash}`,
  }),
  scopeDigestSha256: sha256AuthorityValue(evidenceScope),
  preparedRequestContentRef,
  finalizedMediaAuthorityRef: finalizedRef,
  finalizedStorageObjectAuthorityRef: storageRef,
  sourceProbeAuthorityRef: probeRef,
  sourceAnalysisConsentRef: consentRef,
  platformAnalysisCostCapRef: costCapRef,
  platformEstimateRef: ref('platform-estimate'),
  currentAccountRateAuthorityRef: ref('account-effective-l4-rate'),
  runtimeReleaseRef: releaseRef,
  operationId: 'internal.visual_intelligence.prepare_source_visual_evidence.v1',
  routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
  routeId: 'l4_standard_primary',
  maximumAttempts: 1,
  attemptOrdinal: 1,
  uncertainOutcomeRetryAllowed: false,
  createOnlyConsumptionRequiredBeforeCloudRunCall: true,
  exactPreparedSourceProbeConsentCostRateAndReleaseReread: true,
  userTriggeredScaleFromZero: true,
  minimumIdleInstances: 0,
  platformFundedPreapprovalAnalysis: true,
  maximumPlatformInternalCostUsdNanos: 5_000_000_000,
  customerCreditReservationRequired: false,
  customerCreditsMutated: false,
  systemFailureOrUnknownCostChargedToCustomer: false,
  unapprovedOverageChargedToCustomer: false,
  admittedAt: '2026-08-04T12:00:00.000Z',
  expiresAt: '2026-08-04T12:10:00.000Z',
})
const toolEvidence = [
  evidenceItem('media_probe', 'ffprobe',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe, 1, probeRef),
  evidenceItem('private_media_transform', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 2),
  evidenceItem('scene_detection', 'pyscenedetect',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect, 3),
  evidenceItem('pixel_measurement', 'opencv',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv, 4),
  evidenceItem('exact_visible_text', 'ocr',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr, 5),
  evidenceItem('sampling_policy', 'ffmpeg',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg, 6),
]
const invocationId = `source-visual-evidence-${sha256AuthorityValue({
  triggerHash: trigger.triggerHash,
  idempotencyKey: trigger.idempotencyKey,
}).slice(0, 40)}`
const terminalResult = createCanonicalSourceAnalysisL4VisualEvidenceResult({
  scope: evidenceScope,
  sourceObject: {
    storageProvider: 'google_cloud_storage',
    storageBucket: 'private-source-bucket',
    storagePath: 'workspace-1/source.mp4',
    storageGeneration: '1001',
    storageEtag: 'source-etag-1',
    contentType: 'video/mp4',
    width: 1_920,
    height: 1_080,
    checksumSha256: sourceChecksum,
    byteLength: 4_096,
    finalizedMediaAuthorityRef: finalizedRef,
    finalizedStorageObjectAuthorityRef: storageRef,
    exactGenerationEtagChecksumAndLengthRereadVerified: true,
  },
  operationId: 'internal.visual_intelligence.prepare_source_visual_evidence.v1',
  routeProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
  acceleratorClass: 'nvidia_l4',
  cloudRunJobName: 'reeditpro-professional-l4',
  invocationId,
  admissionRef: Object.freeze({
    id: admission.admissionId,
    version: 1,
    contentHash: `sha256:${admission.admissionHash}`,
  }),
  runtimeReleaseRef: release.releaseRef,
  cloudRunExecutionRef: ref('cloud-operation'),
  platformEstimateRef: admission.platformEstimateRef,
  accountEffectivePricingAuthorityRef:
    admission.currentAccountRateAuthorityRef,
  attemptCostEvidenceRef: ref('l4-terminal-account-effective-cost'),
  maximumPlatformInternalCostUsdNanos:
    admission.maximumPlatformInternalCostUsdNanos,
  actualPlatformInternalCostUsdNanos: 1_250_000_000,
  accountEffectivePricingRereadVerified: true,
  publicListPriceUsedAsSettlementAuthority: false,
  platformInternalCostWithinAdmittedCap: true,
  toolEvidence,
  userTriggeredScaleFromZero: true,
  minimumIdleInstances: 0,
  terminalCloudRunExecutionObserved: true,
  terminalWorkerStopped: true,
  scaleBackToZeroVerified: true,
  maximumAttempts: 1,
  uncertainOutcomeRetryAllowed: false,
  runtimeNetworkDownloadPerformed: false,
  exactSourceReleaseExecutionAndCostRereadVerified: true,
  privateEvidencePersistedAndReread: true,
  browserOrCallerEvidenceAccepted: false,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false,
  customerCreditMutated: false,
  systemFailureChargedToCustomer: false,
  unapprovedOverageChargedToCustomer: false,
  directProviderCallMade: false,
  directTimelineMutationPerformed: false,
  qaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

const objectPort = new MemoryObjectPort()
const repository = createCanonicalSourceAnalysisL4VisualEvidenceRepository({
  objectPort,
})
let cloudCalls = 0
let terminalReads = 0
const owner = createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner({
  requestAuthorityReadPort: {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest() { return structuredClone(request) },
  },
  admissionReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-admission-read-port-v1',
    async rereadAdmittedExecution() { return structuredClone(admission) },
  },
  releaseReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-release-read-port-v1',
    async rereadPrivateRelease() { return structuredClone(release) },
  },
  executionPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-execution-port-v1',
    async runOnce() {
      cloudCalls += 1
      return {
        disposition: 'accepted',
        cloudJobCreateRequestRef: ref('cloud-create'),
        cloudRunOperationRef: ref('cloud-operation'),
        providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
        observedAt: '2026-08-04T12:00:02.000Z',
      }
    },
  },
  terminalReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1',
    async readCompleted() {
      terminalReads += 1
      return structuredClone(terminalResult)
    },
  },
  evidenceRepository: repository,
  lifecycleObjectPort: objectPort,
  now: () => new Date('2026-08-04T12:00:01.500Z'),
})

const result = await owner.executeOneShot(trigger)
assert.equal(result.status, 'ready')
if (result.status !== 'ready') throw new Error('L4 evidence owner failed.')
assert.equal(result.disposition, 'created')
assert.equal(result.resultDigestSha256, terminalResult.resultDigestSha256)
assert.equal(result.scaleBackToZeroVerified, true)
assert.equal(result.customerCreditMutated, false)
assert.equal(cloudCalls, 1)
assert.equal(terminalReads, 1)
const replay = await owner.executeOneShot(trigger)
assert.equal(replay.status, 'ready')
assert.equal(replay.status === 'ready' && replay.disposition,
  'identical_replay')
assert.equal(replay.status === 'ready' && replay.invocationId, invocationId)
assert.equal(cloudCalls, 1)

const delayedObjectPort = new MemoryObjectPort()
let delayedNow = new Date('2026-08-04T12:00:01.500Z')
let delayedCloudCalls = 0
let delayedTerminalReads = 0
const delayedOwner = createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner({
  requestAuthorityReadPort: {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest() { return structuredClone(request) },
  },
  admissionReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-admission-read-port-v1',
    async rereadAdmittedExecution() { return structuredClone(admission) },
  },
  releaseReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-release-read-port-v1',
    async rereadPrivateRelease() { return structuredClone(release) },
  },
  executionPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-execution-port-v1',
    async runOnce() {
      delayedCloudCalls += 1
      return {
        disposition: 'accepted',
        cloudJobCreateRequestRef: ref('cloud-create'),
        cloudRunOperationRef: ref('cloud-operation'),
        providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
        observedAt: '2026-08-04T12:00:02.000Z',
      }
    },
  },
  terminalReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1',
    async readCompleted() {
      delayedTerminalReads += 1
      return delayedTerminalReads === 1
        ? null
        : structuredClone(terminalResult)
    },
  },
  evidenceRepository: createCanonicalSourceAnalysisL4VisualEvidenceRepository({
    objectPort: delayedObjectPort,
  }),
  lifecycleObjectPort: delayedObjectPort,
  now: () => delayedNow,
})
const delayedPending = await delayedOwner.executeOneShot(trigger)
assert.equal(delayedPending.status, 'reconciliation_required')
assert.equal(
  delayedPending.status === 'reconciliation_required'
    && delayedPending.blockerCode,
  'source_visual_evidence_terminal_result_not_ready',
)
delayedNow = new Date('2026-08-04T12:20:00.000Z')
const delayedReady = await delayedOwner.executeOneShot(trigger)
assert.equal(delayedReady.status, 'ready')
assert.equal(delayedCloudCalls, 1)
assert.equal(delayedTerminalReads, 2)

const missingAdmissionOwner = createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner({
  requestAuthorityReadPort: {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest() { return structuredClone(request) },
  },
  admissionReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-admission-read-port-v1',
    async rereadAdmittedExecution() { return null },
  },
  releaseReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-release-read-port-v1',
    async rereadPrivateRelease() { return structuredClone(release) },
  },
  executionPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-execution-port-v1',
    async runOnce() { throw new Error('must not run') },
  },
  terminalReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1',
    async readCompleted() { throw new Error('must not read') },
  },
  evidenceRepository: createCanonicalSourceAnalysisL4VisualEvidenceRepository({
    objectPort: new MemoryObjectPort(),
  }),
  lifecycleObjectPort: new MemoryObjectPort(),
  now: () => new Date('2026-08-04T12:00:01.500Z'),
})
assert.deepEqual(await missingAdmissionOwner.executeOneShot(trigger), {
  status: 'not_ready',
  blockerCode: 'canonical_source_visual_evidence_admission_not_ready',
  cloudJobStarted: false,
  customerCreditMutated: false,
})

let cloudRequest: Record<string, unknown> | null = null
const googlePort = createGoogleCloudRunL4VisualEvidenceExecutionPort({
  auth: {
    async request(value) {
      cloudRequest = value as Record<string, unknown>
      return {
        data: {
          name: 'projects/reeditpro/locations/us-central1/operations/op-1',
        },
      } as never
    },
  },
  now: () => '2026-08-04T12:00:02.000Z',
})
const accepted = await googlePort.runOnce({
  release,
  invocationId: 'source-visual-evidence-google-port-1',
}) as CanonicalSourceAnalysisL4VisualEvidenceExecutionResult
assert.equal(accepted.disposition, 'accepted')
const observedCloudRequest = cloudRequest as Record<string, unknown> | null
assert.ok(observedCloudRequest)
assert.equal(observedCloudRequest.url,
  'https://run.googleapis.com/v2/projects/reeditpro/locations/us-central1/jobs/reeditpro-professional-l4:run')
assert.equal(observedCloudRequest.retry, false)
assert.equal(observedCloudRequest.maxRedirects, 0)
assert.deepEqual(observedCloudRequest.data, {
  overrides: {
    taskCount: 1,
    timeout: '900s',
    containerOverrides: [{
      env: [{
        name: 'REEDITPRO_GPU_INVOCATION_ID',
        value: 'source-visual-evidence-google-port-1',
      }],
    }],
  },
})
assert.equal(JSON.stringify(observedCloudRequest).includes('/Users/'), false)
assert.equal(JSON.stringify(observedCloudRequest).includes('source.mp4'), false)

const uncertainPort = createGoogleCloudRunL4VisualEvidenceExecutionPort({
  auth: { async request() { throw new Error('network outcome unknown') } },
  now: () => '2026-08-04T12:00:02.000Z',
})
assert.equal(((await uncertainPort.runOnce({
  release,
  invocationId: 'source-visual-evidence-google-port-unknown',
})) as CanonicalSourceAnalysisL4VisualEvidenceExecutionResult).disposition,
'outcome_unknown_requires_reconciliation')

console.log(JSON.stringify({
  ok: true,
  ownerVersion: owner.schemaVersion,
  l4CloudRunStartedOnce: cloudCalls === 1,
  createOnlyReplayAvoidedDuplicateGpuJob: true,
  exactTerminalEvidencePersistedAndReread: true,
  accountEffectiveCostLineageRequired: true,
  scaleBackToZeroVerified: true,
  cpuMediaProcessingAllowed: false,
  missingAdmissionFailedClosed: true,
  uncertainCloudOutcomeBlockedRetry: true,
  admittedDispatchReconciledAfterAdmissionExpiry: true,
  googleCloudRunRequestCarriesInvocationIdOnly: true,
  customerCreditsMutated: false,
}))

function releaseItem(
  role: EvidenceRole,
  operationId: string,
  ordinal: number,
) {
  return { role, operationId, runtimeReleaseRef: ref(`tool-release-${ordinal}`) }
}

function evidenceItem(
  role: EvidenceRole,
  tool: EvidenceTool,
  operationId: string,
  ordinal: number,
  evidenceRef = ref(`tool-evidence-${ordinal}`),
) {
  return {
    role,
    tool,
    operationId,
    toolVersion: `${tool}-qualified-v1`,
    evidenceRef,
    runtimeReleaseRef: toolReleases[ordinal - 1]!.runtimeReleaseRef,
    executionRef: ref(`tool-execution-${ordinal}`),
    exactSourceChecksumBound: true as const,
    exactCanonicalResultRereadVerified: true as const,
    substantiveCpuExecutionUsed: false as const,
  }
}

type EvidenceRole =
  | 'media_probe'
  | 'private_media_transform'
  | 'scene_detection'
  | 'pixel_measurement'
  | 'exact_visible_text'
  | 'sampling_policy'

type EvidenceTool = 'ffprobe' | 'ffmpeg' | 'pyscenedetect' | 'opencv' | 'ocr'
