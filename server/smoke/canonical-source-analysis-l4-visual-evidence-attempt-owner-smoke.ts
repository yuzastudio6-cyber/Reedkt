import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION,
  CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION,
  type CanonicalSourceAnalysisFinalizedAuthority,
  type CanonicalSourceAnalysisProbeAuthority,
} from '../services/canonical-source-analysis-preparation-owner'
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
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
} from '../services/canonical-source-analysis-l4-visual-evidence-authority-repository'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
  createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-admission-owner'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceAdmission,
  createCanonicalSourceAnalysisL4VisualEvidenceAdmission,
  createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner,
  createCanonicalSourceAnalysisL4VisualEvidenceRelease,
  createCanonicalSourceAnalysisL4VisualEvidenceTrigger,
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
  createGoogleCloudRunL4VisualEvidenceExecutionPort,
  type CanonicalSourceAnalysisL4VisualEvidenceExecutionResult,
} from '../services/canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence,
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence,
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-evidence-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
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
const finalizedAuthority = Object.freeze({
  schemaVersion: 'canonical-source-analysis-finalized-authority-v1' as const,
  ownerUserId: 'user-1',
  workspaceId: request.workspaceId,
  projectId: request.projectId,
  editSessionId: request.editSessionId,
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  storageProvider: 'google_cloud_storage' as const,
  storageBucket: 'private-source-bucket',
  storagePath: 'workspace-1/source.mp4',
  contentType: 'video/mp4' as const,
  checksumSha256: sourceChecksum,
  byteLength: 4_096,
  storageGeneration: '1001',
  storageEtag: 'source-etag-1',
  finalizedMediaAuthorityRef: finalizedRef,
  finalizedStorageObjectAuthorityRef: storageRef,
  sourceBindingManifestCandidateRef: ref('source-binding-manifest'),
  providerMediaReadAuthorityRef: ref('provider-media-read'),
  sourceAnalysisConsentRef: consentRef,
  platformAnalysisCostCapRef: costCapRef,
  authenticatedPrincipalRereadVerified: true,
  workspaceProjectAccessRereadVerified: true,
  finalizedUploadRereadVerified: true,
  exactGenerationEtagShaLengthRereadVerified: true,
  sourceBindingManifestRereadVerified: true,
  sourceAnalysisConsentRereadVerified: true,
  platformAnalysisCostCapRereadVerified: true,
  browserStorageAuthorityAccepted: false,
  callerPathUrlBytesOrCommandAccepted: false,
}) satisfies CanonicalSourceAnalysisFinalizedAuthority
const probeAuthority = Object.freeze({
  schemaVersion: 'canonical-source-analysis-probe-authority-v2' as const,
  ownerUserId: 'user-1',
  workspaceId: request.workspaceId,
  projectId: request.projectId,
  editSessionId: request.editSessionId,
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  checksumSha256: sourceChecksum,
  byteLength: 4_096,
  storageGeneration: '1001',
  storageEtag: 'source-etag-1',
  width: 1_920,
  height: 1_080,
  hasAudio: true,
  audioProbe: request.sources[0].managedApiAuthority.audioProbe,
  fpsNumerator: 24,
  fpsDenominator: 1,
  frameCount: 240,
  sourceTimeBaseNumerator: 1,
  sourceTimeBaseDenominator: 24,
  constantFrameRate: true,
  finalizedMediaAuthorityRef: finalizedRef,
  finalizedStorageObjectAuthorityRef: storageRef,
  sourceProbeAuthorityRef: probeRef,
  probeRuntimeReleaseRef: ref('probe-runtime-release'),
  resultRuntimeRecordRef: ref('probe-runtime-result'),
  usageCostEvidenceRef: ref('probe-usage-cost'),
  operationId: 'internal.visual_intelligence.probe_source_timing.v1' as const,
  routeProfileId:
    'quality_l4_user_triggered_standard_media_job_v1' as const,
  acceleratorClass: 'nvidia_l4' as const,
  userTriggeredOnly: true,
  minimumIdleInstances: 0,
  exactFinalizedSourceRereadVerified: true,
  exactProbeResultRereadVerified: true,
  ffprobeUsedForMetadataOnly: true,
  gpuDecodeUsedForFrameCountVerification: true,
  substantiveCpuMediaProcessingUsed: false,
  runtimeNetworkDownloadPerformed: false,
  customerCreditMutated: false,
  systemFailureChargedToCustomer: false,
  unapprovedOverageChargedToCustomer: false,
  scaleBackToZeroVerified: true,
  callerProbeFieldsAccepted: false,
  callerPathUrlBytesOrCommandAccepted: false,
  providerCalled: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}) satisfies CanonicalSourceAnalysisProbeAuthority
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
const workerOperationResource =
  'projects/reeditpro/locations/us-central1/operations/op-worker-1'
const workerOperationDigest = sha256AuthorityValue({
  invocationId,
  releaseRef: release.releaseRef,
  cloudRunJobResource: release.cloudRunJobResource,
  operationResource: workerOperationResource,
})
const workerOperationRef = ref(
  `source-visual-cloud-operation-${workerOperationDigest.slice(0, 32)}`,
  {
    invocationId,
    releaseRef: release.releaseRef,
    cloudRunJobResource: release.cloudRunJobResource,
    operationResource: workerOperationResource,
  },
)
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
  cloudRunExecutionRef: workerOperationRef,
  platformEstimateRef: admission.platformEstimateRef,
  admissionAccountEffectivePricingAuthorityRef:
    admission.currentAccountRateAuthorityRef,
  terminalAccountEffectivePricingAuthorityRef:
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

const currentL4Rate = await observeCurrentL4Rate()
const admissionOwnerObjectPort = new MemoryObjectPort()
const admissionOwnerAuthorityRepository =
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
    objectPort: admissionOwnerObjectPort,
  })
await admissionOwnerAuthorityRepository.persistReleaseCreateOnly({ release })
const admissionOwner = createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner({
  ...admissionOwnerDependencies(),
  authorityRepository: admissionOwnerAuthorityRepository,
  runtimeReleaseRef: releaseRef,
  now: () => new Date('2026-08-04T12:00:02.000Z'),
})
const ownedAdmissionResult = await admissionOwner.admitOneShot(trigger)
assert.equal(ownedAdmissionResult.status, 'ready')
if (ownedAdmissionResult.status !== 'ready') {
  throw new Error('Canonical L4 visual evidence admission failed.')
}
assert.equal(ownedAdmissionResult.disposition, 'created')
assert.equal(ownedAdmissionResult.maximumPlatformInternalCostUsdNanos > 0, true)
assert.equal(ownedAdmissionResult.gpuJobStarted, false)
assert.equal(ownedAdmissionResult.customerCreditMutated, false)
const ownedAdmissionReplay = await admissionOwner.admitOneShot(trigger)
assert.equal(ownedAdmissionReplay.status, 'ready')
assert.equal(
  ownedAdmissionReplay.status === 'ready'
    && ownedAdmissionReplay.disposition,
  'identical_replay',
)
const ownedAdmissionRereadRaw = await admissionOwnerAuthorityRepository
  .admissionReadPort.rereadAdmittedExecution({
    trigger,
    scope: ownedAdmissionResult.scope,
    preparedRequestContentRef:
      ownedAdmissionResult.admission.preparedRequestContentRef,
  })
assert.ok(ownedAdmissionRereadRaw)
const ownedAdmissionReread =
  assertCanonicalSourceAnalysisL4VisualEvidenceAdmission(
    ownedAdmissionRereadRaw,
  )
assert.equal(
  ownedAdmissionReread.admissionHash,
  ownedAdmissionResult.admission.admissionHash,
)
const missingReleaseRepository =
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
    objectPort: new MemoryObjectPort(),
  })
const missingReleaseOwner = createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner({
  ...admissionOwnerDependencies(),
  authorityRepository: missingReleaseRepository,
  runtimeReleaseRef: releaseRef,
  now: () => new Date('2026-08-04T12:00:02.000Z'),
})
assert.deepEqual(await missingReleaseOwner.admitOneShot(trigger), {
  status: 'not_ready',
  blockerCode: 'canonical_source_visual_evidence_release_not_ready',
  admissionPersisted: false,
  gpuJobStarted: false,
  customerCreditMutated: false,
})
const missingRateOwner = createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner({
  ...admissionOwnerDependencies(),
  currentRateReadPort: {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
    async rereadCurrentL4StandardRate() { return null },
  },
  authorityRepository: admissionOwnerAuthorityRepository,
  runtimeReleaseRef: releaseRef,
  now: () => new Date('2026-08-04T12:00:02.000Z'),
})
assert.deepEqual(await missingRateOwner.admitOneShot(trigger), {
  status: 'not_ready',
  blockerCode: 'canonical_source_visual_evidence_current_rate_not_ready',
  admissionPersisted: false,
  gpuJobStarted: false,
  customerCreditMutated: false,
})
const staleTrigger = createCanonicalSourceAnalysisL4VisualEvidenceTrigger({
  requestId: 'source-visual-evidence-trigger-stale',
  planningScope: trigger.planningScope,
  sourceSequenceItemId: trigger.sourceSequenceItemId,
  mediaAssetId: trigger.mediaAssetId,
  userTriggerRecordRef: trigger.userTriggerRecordRef,
  idempotencyKey: 'source-visual-evidence-trigger-stale',
  triggeredAt: '2026-08-02T12:00:00.000Z',
  serverPreparedRequestRequired: true,
  browserSourceOrEvidenceAuthorityAccepted: false,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false,
  customerCreditMutationAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
await assert.rejects(admissionOwner.admitOneShot(staleTrigger))

const objectPort = new MemoryObjectPort()
const repository = createCanonicalSourceAnalysisL4VisualEvidenceRepository({
  objectPort,
})
const authorityRepository =
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
    objectPort,
  })
const admissionPersistence = await authorityRepository.persistAdmissionCreateOnly({
  trigger,
  scope: evidenceScope,
  preparedRequestContentRef,
  admission,
})
assert.equal(admissionPersistence.disposition, 'created')
assert.equal(admissionPersistence.exactCreateOnlyRereadVerified, true)
const releasePersistence = await authorityRepository.persistReleaseCreateOnly({
  release,
})
assert.equal(releasePersistence.disposition, 'created')
let cloudCalls = 0
let terminalReads = 0
type ObservedTerminalBinding = {
  invocationId: string
  envelopeHash: string
  admissionRef: VisualIntelligenceEvidenceRef
  releaseRef: VisualIntelligenceEvidenceRef
}
let observedTerminalBinding: ObservedTerminalBinding | null = null
const owner = createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner({
  requestAuthorityReadPort: {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest() { return structuredClone(request) },
  },
  admissionReadPort: authorityRepository.admissionReadPort,
  releaseReadPort: authorityRepository.releaseReadPort,
  executionPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-execution-port-v2',
    async runOnce({ release: exactRelease, invocationId: exactInvocationId }) {
      cloudCalls += 1
      const persisted = await authorityRepository
        .cloudRunOperationAuthorityPort.persistAcceptedOperationCreateOnly({
          invocationId: exactInvocationId,
          releaseRef: exactRelease.releaseRef,
          cloudRunJobResource: exactRelease.cloudRunJobResource,
          operationResource: workerOperationResource,
          observedAt: '2026-08-04T12:00:02.000Z',
        })
      assert.deepEqual(persisted.cloudRunOperationRef, workerOperationRef)
      return {
        disposition: 'accepted',
        cloudJobCreateRequestRef: ref('cloud-create'),
        cloudRunOperationRef: persisted.cloudRunOperationRef,
        providerInferenceOrSubstantiveWorkOutcome: 'unknown',
        observedAt: '2026-08-04T12:00:02.000Z',
      }
    },
  },
  terminalReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1',
    async readCompleted(input) {
      terminalReads += 1
      observedTerminalBinding = structuredClone(input)
      await authorityRepository.persistTerminalCreateOnly({
        ...input,
        result: terminalResult,
      })
      return authorityRepository.terminalReadPort.readCompleted(input)
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
const workerEnvelopeReadPort =
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort({
    objectPort,
  })
const workerBootstrapOwner =
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrapOwner({
    envelopeReadPort: workerEnvelopeReadPort,
    authorityRepository,
  })
const workerBootstrap = await workerBootstrapOwner.bootstrap(invocationId)
assert.equal(workerBootstrap.status, 'ready')
if (workerBootstrap.status !== 'ready') {
  throw new Error('L4 worker bootstrap failed.')
}
assert.equal(workerBootstrap.bootstrap.sourceObject.storageGeneration, '1001')
assert.equal(workerBootstrap.bootstrap.sourceObject.storageEtag,
  'source-etag-1')
assert.deepEqual(
  workerBootstrap.bootstrap.sourceTimeline.sourceProbeAuthorityRef,
  probeRef,
)
assert.equal(workerBootstrap.bootstrap.sourceTimeline.durationFrames, 240)
assert.equal(workerBootstrap.bootstrap.sourceBytesRead, false)
assert.equal(workerBootstrap.bootstrap.toolExecutionStarted, false)
assert.equal(workerBootstrap.substantiveWorkStarted, false)
assert.equal(workerBootstrap.customerCreditMutated, false)
assert.deepEqual(workerBootstrap.bootstrap.cloudRunOperationRef,
  workerOperationRef)
const workerEvidenceOwner =
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner({
    objectPort,
  })
const workerEvidence =
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence({
    bootstrap: workerBootstrap.bootstrap,
    invocationId,
    bootstrapRef: Object.freeze({
      id: `${invocationId}.bootstrap`,
      version: 1,
      contentHash:
        `sha256:${workerBootstrap.bootstrap.bootstrapDigestSha256}`,
    }),
    envelopeRef: workerBootstrap.bootstrap.envelopeRef,
    consumptionRef: workerBootstrap.bootstrap.consumptionRef,
    admissionRef: workerBootstrap.bootstrap.admissionRef,
    releaseRef: workerBootstrap.bootstrap.releaseRef,
    cloudRunOperationRef: workerBootstrap.bootstrap.cloudRunOperationRef,
    sourceObjectIdentityDigestSha256: sha256AuthorityValue(
      workerBootstrap.bootstrap.sourceObject,
    ),
    sourceTimelineDigestSha256: sha256AuthorityValue(
      workerBootstrap.bootstrap.sourceTimeline,
    ),
    sourceProbeAuthorityRef: probeRef,
    acceleratorClass: 'nvidia_l4',
    allocatedGpuCount: 1,
    gpuDeviceEvidenceRef: ref('l4-gpu-device-evidence'),
    cudaRuntimeEvidenceRef: ref('l4-cuda-runtime-evidence'),
    gpuDecodeEvidenceRef: ref('l4-gpu-decode-evidence'),
    completeSourceCoverageEvidenceRef:
      ref('l4-complete-source-coverage-evidence'),
    toolEvidence,
    exactGenerationEtagChecksumAndLengthRereadVerified: true,
    substantiveGpuExecutionVerified: true,
    gpuDecodeVerified: true,
    allCanonicalSourceFramesAccountedFor: true,
    skippedCanonicalFrameCount: 0,
    substantiveCpuMediaProcessingUsed: false,
    runtimeNetworkDownloadPerformed: false,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false,
    workerStartedAt: '2026-08-04T12:00:02.000Z',
    workerCompletedAt: '2026-08-04T12:00:05.000Z',
    activeExecutionMilliseconds: 3_000,
    persistedPrivateArtifactBytes: 8_192,
    classAOperationCount: 2,
    classBOperationCount: 8,
    terminalCloudRunExecutionClaimed: false,
    scaleBackToZeroClaimedByWorker: false,
    accountEffectiveCostClaimedByWorker: false,
    customerCreditMutated: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
const persistedWorkerEvidence = await workerEvidenceOwner.persistCreateOnly({
  bootstrap: workerBootstrap.bootstrap,
  evidence: workerEvidence,
})
assert.equal(persistedWorkerEvidence.disposition, 'created')
assert.equal(persistedWorkerEvidence.scaleBackToZeroClaimedByWorker, false)
assert.equal((await workerEvidenceOwner.persistCreateOnly({
  bootstrap: workerBootstrap.bootstrap,
  evidence: workerEvidence,
})).disposition, 'identical_replay')
const detachedWorkerEvidence = await workerEvidenceOwner.readExact(invocationId)
assert.ok(detachedWorkerEvidence)
;(detachedWorkerEvidence!.toolEvidence[1] as { toolVersion: string })
  .toolVersion = 'mutated-copy'
assert.equal(
  (await workerEvidenceOwner.readExact(invocationId))?.toolEvidence[1]
    ?.toolVersion,
  'ffmpeg-qualified-v1',
)
const {
  workerEvidenceDigestSha256: ignoredWorkerEvidenceDigest,
  ...workerEvidencePayload
} = workerEvidence
void ignoredWorkerEvidenceDigest
const workerTerminalAuthorityInjection = {
  ...workerEvidencePayload,
  terminalCloudRunExecutionClaimed: true,
}
assert.throws(() =>
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence({
    ...workerTerminalAuthorityInjection,
    workerEvidenceDigestSha256: sha256AuthorityValue(
      workerTerminalAuthorityInjection,
    ),
  }),
)
const workerReorderedToolPayload = {
  ...workerEvidencePayload,
  toolEvidence: [
    workerEvidence.toolEvidence[1],
    workerEvidence.toolEvidence[0],
    ...workerEvidence.toolEvidence.slice(2),
  ],
}
const workerReorderedToolEvidence =
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence({
    ...workerReorderedToolPayload,
    workerEvidenceDigestSha256: sha256AuthorityValue(
      workerReorderedToolPayload,
    ),
  })
await assert.rejects(workerEvidenceOwner.persistCreateOnly({
  bootstrap: workerBootstrap.bootstrap,
  evidence: workerReorderedToolEvidence,
}))
const detachedWorkerEnvelope = await workerEnvelopeReadPort
  .readExactConsumedEnvelope(invocationId)
assert.ok(detachedWorkerEnvelope)
;(detachedWorkerEnvelope!.envelope.sourceObject as { storageEtag: string })
  .storageEtag = 'mutated-copy'
assert.equal((await workerEnvelopeReadPort.readExactConsumedEnvelope(
  invocationId,
))?.envelope.sourceObject.storageEtag, 'source-etag-1')
assert.deepEqual(
  await workerBootstrapOwner.bootstrap('source-visual-evidence-missing'),
  {
    status: 'not_ready',
    blockerCode:
      'canonical_source_visual_evidence_worker_envelope_not_ready',
    substantiveWorkStarted: false,
    customerCreditMutated: false,
  },
)
const replay = await owner.executeOneShot(trigger)
assert.equal(replay.status, 'ready')
assert.equal(replay.status === 'ready' && replay.disposition,
  'identical_replay')
assert.equal(replay.status === 'ready' && replay.invocationId, invocationId)
assert.equal(cloudCalls, 1)
assert.ok(observedTerminalBinding)
const terminalBinding = observedTerminalBinding as ObservedTerminalBinding
assert.equal((await authorityRepository.persistTerminalCreateOnly({
  ...terminalBinding,
  result: terminalResult,
})).disposition, 'identical_replay')
await assert.rejects(
  authorityRepository.terminalReadPort.readCompleted({
    ...terminalBinding,
    envelopeHash: sha('wrong-envelope'),
  }),
)
await assert.rejects(
  authorityRepository.persistTerminalCreateOnly({
    ...terminalBinding,
    envelopeHash: sha('colliding-envelope'),
    result: terminalResult,
  }),
)
const crossTrigger = createCanonicalSourceAnalysisL4VisualEvidenceTrigger({
  requestId: trigger.requestId,
  planningScope: trigger.planningScope,
  sourceSequenceItemId: trigger.sourceSequenceItemId,
  mediaAssetId: trigger.mediaAssetId,
  userTriggerRecordRef: trigger.userTriggerRecordRef,
  idempotencyKey: 'source-visual-evidence-trigger-cross-binding',
  triggeredAt: trigger.triggeredAt,
  serverPreparedRequestRequired: true,
  browserSourceOrEvidenceAuthorityAccepted: false,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false,
  customerCreditMutationAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
await assert.rejects(
  authorityRepository.admissionReadPort.rereadAdmittedExecution({
    trigger: crossTrigger,
    scope: evidenceScope,
    preparedRequestContentRef,
  }),
)
const detachedAdmission = await authorityRepository.admissionReadPort
  .rereadAdmittedExecution({
    trigger,
    scope: evidenceScope,
    preparedRequestContentRef,
  })
assert.ok(detachedAdmission)
;(detachedAdmission as { admissionId: string }).admissionId = 'mutated-copy'
const unchangedAdmission = await authorityRepository.admissionReadPort
  .rereadAdmittedExecution({
    trigger,
    scope: evidenceScope,
    preparedRequestContentRef,
  }) as typeof admission
assert.equal(unchangedAdmission.admissionId, admission.admissionId)

const delayedObjectPort = new MemoryObjectPort()
const delayedAuthorityRepository =
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
    objectPort: delayedObjectPort,
  })
await delayedAuthorityRepository.persistAdmissionCreateOnly({
  trigger,
  scope: evidenceScope,
  preparedRequestContentRef,
  admission,
})
await delayedAuthorityRepository.persistReleaseCreateOnly({ release })
let delayedNow = new Date('2026-08-04T12:00:01.500Z')
let delayedCloudCalls = 0
let delayedTerminalReads = 0
const delayedOwner = createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner({
  requestAuthorityReadPort: {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest() { return structuredClone(request) },
  },
  admissionReadPort: delayedAuthorityRepository.admissionReadPort,
  releaseReadPort: delayedAuthorityRepository.releaseReadPort,
  executionPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-execution-port-v2',
    async runOnce({ release: exactRelease, invocationId: exactInvocationId }) {
      delayedCloudCalls += 1
      const persisted = await delayedAuthorityRepository
        .cloudRunOperationAuthorityPort.persistAcceptedOperationCreateOnly({
          invocationId: exactInvocationId,
          releaseRef: exactRelease.releaseRef,
          cloudRunJobResource: exactRelease.cloudRunJobResource,
          operationResource: workerOperationResource,
          observedAt: '2026-08-04T12:00:02.000Z',
        })
      return {
        disposition: 'accepted',
        cloudJobCreateRequestRef: ref('cloud-create'),
        cloudRunOperationRef: persisted.cloudRunOperationRef,
        providerInferenceOrSubstantiveWorkOutcome: 'unknown',
        observedAt: '2026-08-04T12:00:02.000Z',
      }
    },
  },
  terminalReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1',
    async readCompleted(input) {
      delayedTerminalReads += 1
      if (delayedTerminalReads === 1) return null
      await delayedAuthorityRepository.persistTerminalCreateOnly({
        ...input,
        result: terminalResult,
      })
      return delayedAuthorityRepository.terminalReadPort.readCompleted(input)
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

const missingAuthorityObjectPort = new MemoryObjectPort()
const missingAuthorityRepository =
  createCanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository({
    objectPort: missingAuthorityObjectPort,
  })
const missingAdmissionOwner = createCanonicalSourceAnalysisL4VisualEvidenceAttemptOwner({
  requestAuthorityReadPort: {
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    async readExactPreparedRequest() { return structuredClone(request) },
  },
  admissionReadPort: missingAuthorityRepository.admissionReadPort,
  releaseReadPort: missingAuthorityRepository.releaseReadPort,
  executionPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-execution-port-v2',
    async runOnce() { throw new Error('must not run') },
  },
  terminalReadPort: missingAuthorityRepository.terminalReadPort,
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
  operationAuthorityPort:
    authorityRepository.cloudRunOperationAuthorityPort,
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
assert.equal(accepted.providerInferenceOrSubstantiveWorkOutcome, 'unknown')
assert.ok(accepted.cloudRunOperationRef)
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
const durableCloudRunOperation = await authorityRepository
  .cloudRunOperationAuthorityPort.readExactAcceptedOperation({
    invocationId: 'source-visual-evidence-google-port-1',
    releaseRef: release.releaseRef,
  })
assert.ok(durableCloudRunOperation)
assert.equal(
  durableCloudRunOperation.operationResource,
  'projects/reeditpro/locations/us-central1/operations/op-1',
)
assert.deepEqual(
  durableCloudRunOperation.cloudRunOperationRef,
  accepted.cloudRunOperationRef,
)
;(durableCloudRunOperation as { operationResource: string })
  .operationResource = 'mutated-copy'
assert.equal((await authorityRepository.cloudRunOperationAuthorityPort
  .readExactAcceptedOperation({
    invocationId: 'source-visual-evidence-google-port-1',
    releaseRef: release.releaseRef,
  }))?.operationResource,
'projects/reeditpro/locations/us-central1/operations/op-1')
await assert.rejects(
  authorityRepository.cloudRunOperationAuthorityPort
    .persistAcceptedOperationCreateOnly({
      invocationId: 'source-visual-evidence-google-port-1',
      releaseRef: release.releaseRef,
      cloudRunJobResource: release.cloudRunJobResource,
      operationResource:
        'projects/reeditpro/locations/us-central1/operations/op-collision',
      observedAt: '2026-08-04T12:00:02.000Z',
    }),
)
assert.equal((await authorityRepository.cloudRunOperationAuthorityPort
  .persistAcceptedOperationCreateOnly({
    invocationId: 'source-visual-evidence-google-port-1',
    releaseRef: release.releaseRef,
    cloudRunJobResource: release.cloudRunJobResource,
    operationResource:
      'projects/reeditpro/locations/us-central1/operations/op-1',
    observedAt: '2026-08-04T12:00:02.000Z',
  })).disposition,
'identical_replay')

const uncertainPort = createGoogleCloudRunL4VisualEvidenceExecutionPort({
  operationAuthorityPort:
    authorityRepository.cloudRunOperationAuthorityPort,
  auth: { async request() { throw new Error('network outcome unknown') } },
  now: () => '2026-08-04T12:00:02.000Z',
})
assert.equal(((await uncertainPort.runOnce({
  release,
  invocationId: 'source-visual-evidence-google-port-unknown',
})) as CanonicalSourceAnalysisL4VisualEvidenceExecutionResult).disposition,
'outcome_unknown_requires_reconciliation')
let persistenceFailureCloudCalls = 0
const persistenceFailurePort =
  createGoogleCloudRunL4VisualEvidenceExecutionPort({
    operationAuthorityPort: {
      schemaVersion:
        'canonical-source-analysis-l4-visual-evidence-cloud-run-operation-authority-port-v1',
      async persistAcceptedOperationCreateOnly() {
        throw new Error('durable authority unavailable')
      },
      async readExactAcceptedOperation() { return null },
    },
    auth: {
      async request() {
        persistenceFailureCloudCalls += 1
        return {
          data: {
            name:
              'projects/reeditpro/locations/us-central1/operations/op-unpersisted',
          },
        } as never
      },
    },
    now: () => '2026-08-04T12:00:02.000Z',
  })
const unpersistedAcceptedOperation =
  await persistenceFailurePort.runOnce({
    release,
    invocationId: 'source-visual-evidence-google-port-unpersisted',
  }) as CanonicalSourceAnalysisL4VisualEvidenceExecutionResult
assert.equal(persistenceFailureCloudCalls, 1)
assert.equal(
  unpersistedAcceptedOperation.disposition,
  'outcome_unknown_requires_reconciliation',
)
assert.equal(unpersistedAcceptedOperation.cloudRunOperationRef, null)

console.log(JSON.stringify({
  ok: true,
  ownerVersion: owner.schemaVersion,
  l4CloudRunStartedOnce: cloudCalls === 1,
  createOnlyReplayAvoidedDuplicateGpuJob: true,
  exactTerminalEvidencePersistedAndReread: true,
  canonicalAuthorityRepositoryPortsSeparatelyVersioned: true,
  crossTriggerAndTerminalReplayMismatchRejected: true,
  detachedAuthorityReadsVerified: true,
  accountEffectiveCostLineageRequired: true,
  scaleBackToZeroVerified: true,
  cpuMediaProcessingAllowed: false,
  missingAdmissionFailedClosed: true,
  uncertainCloudOutcomeBlockedRetry: true,
  admittedDispatchReconciledAfterAdmissionExpiry: true,
  googleCloudRunRequestCarriesInvocationIdOnly: true,
  cloudRunOperationResourcePersistedCreateOnlyAndReread: true,
  acceptedOperationWithoutDurableAuthorityBlockedAsUnknown: true,
  workerRereadsConsumedEnvelopeAndExactPrivateAuthorities: true,
  workerEvidencePersistedCreateOnlyAndReread: true,
  workerCannotClaimTerminalOrScaleToZero: true,
  workerEnvironmentReceivesOnlyInvocationId: true,
  workerSourceBytesOrToolsStartedDuringBootstrap: false,
  customerCreditsMutated: false,
}))

function admissionOwnerDependencies() {
  return {
    requestAuthorityReadPort: {
      schemaVersion:
        CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
      async readExactPreparedRequest() { return structuredClone(request) },
    },
    finalizedAuthorityReadPort: {
      schemaVersion:
        CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION,
      async readExactFinalizedSource() {
        return structuredClone(finalizedAuthority)
      },
    },
    probeAuthorityReadPort: {
      schemaVersion:
        CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION,
      async readCompletedExactProbe() {
        return structuredClone(probeAuthority)
      },
    },
    currentRateReadPort: {
      schemaVersion:
        CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
      async rereadCurrentL4StandardRate() {
        return structuredClone(currentL4Rate)
      },
    },
  } as const
}

async function observeCurrentL4Rate() {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: 'current-rate-l4-standard-primary-v1',
    rateAuthorityVersion: 1,
    routeId: 'l4_standard_primary',
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() { return currentL4RawObservation() },
    },
  })
}

function currentL4RawObservation():
CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    rateComponent('cloud_run_l4_gpu_second',
      'gpu_second', 186_700, '1'),
    rateComponent('cloud_run_vcpu_second',
      'vcpu_second', 18_000, '2'),
    rateComponent('cloud_run_memory_gib_second',
      'gib_second', 2_000, '3'),
    rateComponent('private_object_storage_gib_month',
      'gib_month', 20_000_000, '4'),
    rateComponent('network_egress_gib',
      'gib', 120_000_000, '5'),
    rateComponent('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '6'),
    rateComponent('object_class_b_per_1000',
      'per_1000_operations', 400_000, '7'),
  ]
  const value = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-pricing-scope'),
    pricingReaderConfigurationRef: ref('pricing-reader-configuration'),
    routeId: 'l4_standard_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('price-record-set-l4-standard'),
    pricingReadStartedAt: '2026-08-04T12:00:00.000Z',
    pricingReadFinishedAt: '2026-08-04T12:00:01.000Z',
  }
  return {
    ...value,
    pricingReadDigestSha256: sha256AuthorityValue(value),
  }
}

function rateComponent(
  componentClass:
    | 'cloud_run_l4_gpu_second'
    | 'cloud_run_vcpu_second'
    | 'cloud_run_memory_gib_second'
    | 'private_object_storage_gib_month'
    | 'network_egress_gib'
    | 'object_class_a_per_1000'
    | 'object_class_b_per_1000',
  billingUnit:
    | 'gpu_second'
    | 'vcpu_second'
    | 'gib_second'
    | 'gib_month'
    | 'gib'
    | 'per_1000_operations',
  usdNanosPerBillingUnit: number,
  character: string,
) {
  const cloudServiceId = componentClass.startsWith('cloud_run')
    ? 'service-cloud-run'
    : 'service-cloud-storage'
  const skuId = `sku-${componentClass}`
  return {
    componentClass,
    cloudServiceName: componentClass.startsWith('cloud_run')
      ? 'cloud-run'
      : 'cloud-storage',
    skuRateBindingId: `rate-binding-${componentClass}`,
    skuPriceTerms: [{
      cloudServiceId,
      skuId,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: usdNanosPerBillingUnit,
      }],
      maximumContractPriceUsdNanos: usdNanosPerBillingUnit,
      skuMetadataRef: ref(`sku-metadata-${componentClass}-${character}`),
      billingAccountPriceRef:
        ref(`account-price-${componentClass}-${character}`),
    }],
    skuDescriptionDigestSha256: character.repeat(64),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: usdNanosPerBillingUnit,
    currentPriceObservedAt: '2026-08-04T12:00:01.000Z',
    skuRecordRef: ref(`sku-record-${componentClass}-${character}`),
  }
}

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
