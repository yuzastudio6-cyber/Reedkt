import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSourceLedSourceFrameAuthority,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
} from '../services/canonical-source-analysis-l4-visual-evidence-admission-owner'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
  CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord,
} from '../services/canonical-source-analysis-l4-visual-evidence-authority-repository'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceAdmission,
  createCanonicalSourceAnalysisL4VisualEvidenceRelease,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerConsumption,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelope,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort,
} from '../services/canonical-source-analysis-l4-visual-evidence-attempt-owner'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence,
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
} from '../services/canonical-source-analysis-l4-visual-evidence-worker-evidence-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner,
  createGoogleCloudRunL4VisualEvidenceTerminalObservationPort,
} from '../services/canonical-source-analysis-l4-visual-evidence-terminal-reconciliation-owner'
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
    assert.equal(
      createHash('sha256').update(input.body).digest('hex'),
      input.contentSha256,
    )
    if (this.values.has(input.objectPath)) return 'already_exists'
    this.values.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(path: string): Promise<Buffer | null> {
    const body = this.values.get(path)
    return body ? Buffer.from(body) : null
  }
}

const invocationId = `source-visual-terminal-${sha('terminal').slice(0, 32)}`
const operationId =
  'internal.visual_intelligence.prepare_source_visual_evidence.v1' as const
const routeProfileId =
  'quality_l4_user_triggered_standard_media_job_v1' as const
const cloudRunJobResource =
  'projects/reeditpro/locations/us-central1/jobs/reeditpro-professional-l4'
const operationResource =
  'projects/reeditpro/locations/us-central1/operations/terminal-op-1'
const sourceChecksum = sha('canonical-private-source')
const finalizedMediaRef = ref('finalized-media')
const finalizedStorageRef = ref('finalized-storage')
const sourceProbeRef = ref('source-probe')
const frameAuthority = createCanonicalSourceLedSourceFrameAuthority({
  fpsNumerator: 24,
  fpsDenominator: 1,
  frameCount: 240,
  timeBaseNumerator: 1,
  timeBaseDenominator: 24,
})
const scope = {
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-1',
  analysisRunId: 'analysis-1',
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-1',
  uploadedOrder: 1,
  checksumSha256: sourceChecksum,
  byteLength: 4_096,
  durationFrames: 240,
  sourceFrameAuthority: frameAuthority,
  finalizedMediaAuthorityRef: finalizedMediaRef,
  sourceProbeAuthorityRef: sourceProbeRef,
} as const
const sourceObject = {
  storageProvider: 'google_cloud_storage' as const,
  storageBucket: 'private-source-bucket',
  storagePath: 'workspace-1/source.mp4',
  storageGeneration: '1001',
  storageEtag: 'source-etag-1',
  contentType: 'video/mp4' as const,
  width: 1_920,
  height: 1_080,
  checksumSha256: sourceChecksum,
  byteLength: 4_096,
  finalizedMediaAuthorityRef: finalizedMediaRef,
  finalizedStorageObjectAuthorityRef: finalizedStorageRef,
  exactGenerationEtagChecksumAndLengthRereadRequired: true as const,
}
const triggerRef = ref('source-trigger')
const releaseRef = ref('visual-evidence-release')
const rate = await observeCurrentRate()
const rateRef = Object.freeze({
  id: rate.rateAuthorityId,
  version: rate.rateAuthorityVersion,
  contentHash: `sha256:${rate.rateAuthorityHash}`,
})
const admissionRateRef = ref('admission-account-effective-rate')
const admission = createCanonicalSourceAnalysisL4VisualEvidenceAdmission({
  admissionId: 'visual-evidence-admission-1',
  triggerRef,
  scopeDigestSha256: sha256AuthorityValue(scope),
  preparedRequestContentRef: ref('prepared-request'),
  finalizedMediaAuthorityRef: finalizedMediaRef,
  finalizedStorageObjectAuthorityRef: finalizedStorageRef,
  sourceProbeAuthorityRef: sourceProbeRef,
  sourceAnalysisConsentRef: ref('source-consent'),
  platformAnalysisCostCapRef: ref('platform-cost-cap'),
  platformEstimateRef: ref('platform-estimate'),
  currentAccountRateAuthorityRef: admissionRateRef,
  runtimeReleaseRef: releaseRef,
  operationId,
  routeProfileId,
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
const toolchainQualificationRef = ref('l4-toolchain-qualification')
const release = createCanonicalSourceAnalysisL4VisualEvidenceRelease({
  releaseRef,
  operationId,
  routeProfileId,
  routeId: 'l4_standard_primary',
  projectId: 'reeditpro',
  runtimeRegion: 'us-central1',
  cloudRunJobName: 'reeditpro-professional-l4',
  cloudRunJobResource,
  acceleratorClass: 'nvidia_l4',
  immutableImageRef: ref('l4-image'),
  immutableImageDigest: ref('l4-image').contentHash,
  toolchainQualificationRef,
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
const envelopePayload = {
  schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-envelope-v2' as const,
  source:
    'canonical_source_analysis_l4_visual_evidence_attempt_owner' as const,
  invocationId,
  triggerRef,
  admissionRef: Object.freeze({
    id: admission.admissionId,
    version: 1,
    contentHash: `sha256:${admission.admissionHash}`,
  }),
  releaseRef,
  scope,
  sourceObject,
  idempotencyKey: 'terminal-idempotency-1',
  operationId,
  routeProfileId,
  cloudRunReceivesOnlyInvocationId: true as const,
  privateWorkerRereadsEnvelopeByExactDigest: true as const,
  callerPathUrlBytesCommandOrEnvironmentIncluded: false as const,
  runtimeNetworkDownloadAllowed: false as const,
  maximumAttempts: 1 as const,
  uncertainOutcomeRetryAllowed: false as const,
  customerCreditMutationAllowed: false as const,
  publicDeliveryAllowed: false as const,
  productionAuthorityGranted: false as const,
}
const envelope: CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelope = {
  ...envelopePayload,
  envelopeHash: sha256AuthorityValue(envelopePayload),
}
const envelopeRef = Object.freeze({
  id: invocationId,
  version: 1,
  contentHash: `sha256:${envelope.envelopeHash}`,
})
const consumptionPayload = {
  schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-consumption-v1' as const,
  source:
    'canonical_source_analysis_l4_visual_evidence_attempt_owner' as const,
  invocationId,
  admissionRef: envelope.admissionRef,
  envelopeRef,
  idempotencyKey: envelope.idempotencyKey,
  consumedBeforeCloudRunCall: true as const,
  maximumAttempts: 1 as const,
  uncertainOutcomeRetryAllowed: false as const,
  customerCreditsMutated: false as const,
  consumedAt: '2026-08-04T12:00:00.500Z',
}
const consumption: CanonicalSourceAnalysisL4VisualEvidenceWorkerConsumption = {
  ...consumptionPayload,
  consumptionHash: sha256AuthorityValue(consumptionPayload),
}
const consumptionRef = ref(`${invocationId}.consumption`,
  consumption.consumptionHash)
const operationRef = ref(`${invocationId}.cloud-operation`, {
  invocationId,
  releaseRef,
  cloudRunJobResource,
  operationResource,
})
const operationRecordPayload = {
  schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-authority-repository-v1' as const,
  recordKind: 'cloud_run_operation' as const,
  invocationId,
  releaseRef,
  cloudRunJobResource,
  operationResource,
  cloudRunOperationRef: operationRef,
  cloudRunRunRequestAccepted: true as const,
  workerOutcomeAtAcceptance: 'unknown' as const,
  providerInferenceOutcomeAtAcceptance: 'unknown' as const,
  customerCreditMutated: false as const,
  publicDeliveryGranted: false as const,
  productionAuthorityGranted: false as const,
  observedAt: '2026-08-04T12:00:01.000Z',
}
const operationRecord: CanonicalSourceAnalysisL4VisualEvidenceCloudRunOperationRecord = {
  ...operationRecordPayload,
  recordDigestSha256: sha256AuthorityValue(operationRecordPayload),
}
const bootstrapPayload = {
  schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-worker-bootstrap-v3' as const,
  source:
    'canonical_l4_source_visual_evidence_private_worker_bootstrap_owner' as const,
  invocationId,
  envelopeRef,
  consumptionRef,
  triggerRef,
  admissionRef: envelope.admissionRef,
  releaseRef,
  toolchainQualificationRef,
  cloudRunOperationRef: operationRef,
  currentAccountRateAuthorityRef: admissionRateRef,
  sourceObject,
  sourceTimeline: {
    sourceSequenceItemId: scope.sourceSequenceItemId,
    mediaAssetId: scope.mediaAssetId,
    uploadedOrder: scope.uploadedOrder,
    durationFrames: scope.durationFrames,
    sourceFrameAuthority: frameAuthority,
    sourceProbeAuthorityRef: sourceProbeRef,
  },
  scopeDigestSha256: sha256AuthorityValue(scope),
  operationId,
  routeProfileId,
  routeId: 'l4_standard_primary' as const,
  acceleratorClass: 'nvidia_l4' as const,
  cloudRunJobResource,
  operationResource,
  immutableImageRef: release.immutableImageRef,
  toolReleaseRefs: release.toolReleases,
  maximumExecutionSeconds: 900 as const,
  maximumAttempts: 1 as const,
  minimumIdleInstances: 0 as const,
  cloudRunEnvironmentContainedOnlyInvocationId: true as const,
  exactCreateOnlyEnvelopeConsumptionAdmissionReleaseAndOperationReread:
    true as const,
  substantiveCpuMediaProcessingAllowed: false as const,
  runtimeNetworkDownloadAllowed: false as const,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
  sourceBytesRead: false as const,
  toolExecutionStarted: false as const,
  customerCreditMutationAllowed: false as const,
  publicDeliveryAllowed: false as const,
  productionAuthorityGranted: false as const,
}
const bootstrap = assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap({
  ...bootstrapPayload,
  bootstrapDigestSha256: sha256AuthorityValue(bootstrapPayload),
})
const toolEvidence = [
  evidenceItem('media_probe', 'ffprobe',
    VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe, 1,
    sourceProbeRef),
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
const workerEvidence =
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence({
    bootstrap,
    invocationId,
    bootstrapRef: Object.freeze({
      id: `${invocationId}.bootstrap`,
      version: 1,
      contentHash: `sha256:${bootstrap.bootstrapDigestSha256}`,
    }),
    envelopeRef,
    consumptionRef,
    admissionRef: envelope.admissionRef,
    releaseRef,
    cloudRunOperationRef: operationRef,
    sourceObjectIdentityDigestSha256: sha256AuthorityValue(sourceObject),
    sourceTimelineDigestSha256: sha256AuthorityValue(
      bootstrap.sourceTimeline,
    ),
    sourceProbeAuthorityRef: sourceProbeRef,
    acceleratorClass: 'nvidia_l4',
    allocatedGpuCount: 1,
    gpuDeviceEvidenceRef: ref('gpu-device'),
    cudaRuntimeEvidenceRef: ref('cuda-runtime'),
    gpuDecodeEvidenceRef: ref('gpu-decode'),
    completeSourceCoverageEvidenceRef: ref('complete-source-coverage'),
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

const objectPort = new MemoryObjectPort()
const workerEvidenceOwner =
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner({
    objectPort,
  })
await workerEvidenceOwner.persistCreateOnly({ bootstrap, evidence: workerEvidence })
const workerEnvelopeReadPort = Object.freeze({
  schemaVersion:
    'canonical-source-analysis-l4-visual-evidence-worker-envelope-read-port-v1' as const,
  async readExactConsumedEnvelope(requestedInvocationId: string) {
    if (requestedInvocationId !== invocationId) return null
    return Object.freeze({
      envelope: structuredClone(envelope),
      consumption: structuredClone(consumption),
      envelopeRef,
      consumptionRef,
      exactCreateOnlyEnvelopeAndConsumptionRereadVerified: true as const,
      callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
      customerCreditMutated: false as const,
      publicDeliveryGranted: false as const,
      productionAuthorityGranted: false as const,
    })
  },
}) satisfies CanonicalSourceAnalysisL4VisualEvidenceWorkerEnvelopeReadPort
let persistedTerminalResult: unknown = null
let terminalPersistenceCount = 0
const authorityRepository = {
  repositoryVersion:
    'canonical-source-analysis-l4-visual-evidence-authority-repository-v1',
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
  terminalReadPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-terminal-read-port-v1',
    async readCompleted() { return structuredClone(persistedTerminalResult) },
  },
  cloudRunOperationAuthorityPort: {
    schemaVersion:
      'canonical-source-analysis-l4-visual-evidence-cloud-run-operation-authority-port-v1',
    async persistAcceptedOperationCreateOnly() {
      throw new Error('not used')
    },
    async readExactAcceptedOperation() {
      return structuredClone(operationRecord)
    },
  },
  async readExactAdmission() { return structuredClone(admission) },
  async readExactRelease() { return structuredClone(release) },
  async persistAdmissionCreateOnly() { throw new Error('not used') },
  async persistReleaseCreateOnly() { throw new Error('not used') },
  async persistTerminalCreateOnly(input) {
    terminalPersistenceCount += 1
    if (persistedTerminalResult !== null) return authorityPersistence(
      'identical_replay',
    )
    persistedTerminalResult = structuredClone(input.result)
    return authorityPersistence('created')
  },
} satisfies CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository
const terminalRequests: Record<string, unknown>[] = []
let terminalCalls = 0
const terminalObservationPort =
  createGoogleCloudRunL4VisualEvidenceTerminalObservationPort({
    auth: {
      async request(value) {
        terminalCalls += 1
        const requestValue = value as Record<string, unknown>
        terminalRequests.push(requestValue)
        const execution = {
          name:
            `${cloudRunJobResource}/executions/execution-terminal-1`,
          job: cloudRunJobResource,
          createTime: '2026-08-04T12:00:00.000Z',
          startTime: '2026-08-04T12:00:01.000Z',
          completionTime: '2026-08-04T12:00:06.000Z',
          taskCount: 1,
          reconciling: false,
          runningCount: 0,
          succeededCount: 1,
          failedCount: 0,
          cancelledCount: 0,
          retriedCount: 0,
        }
        if (requestValue.url ===
          `https://run.googleapis.com/v2/${execution.name}`) {
          return { data: execution } as never
        }
        return {
          data: {
            name: operationResource,
            done: true,
            response: {
              '@type':
                'type.googleapis.com/google.cloud.run.v2.Execution',
              ...execution,
            },
          },
        } as never
      },
    },
    now: () => '2026-08-04T12:00:07.000Z',
  })
const owner =
  createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner({
    workerEnvelopeReadPort,
    authorityRepository,
    workerEvidenceOwner,
    terminalObservationPort,
    currentRateReadPort: {
      schemaVersion:
        CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
      async rereadCurrentL4StandardRate() { return structuredClone(rate) },
    },
    objectPort,
  })
const ready = await owner.reconcileOneShot(invocationId)
assert.equal(ready.status, 'ready')
if (ready.status !== 'ready') throw new Error('Terminal owner was not ready.')
assert.equal(ready.disposition, 'created')
assert.equal(ready.accountEffectivePricingRereadVerified, true)
assert.equal(ready.scaleBackToZeroVerified, true)
assert.equal(ready.customerCreditMutated, false)
assert.equal(terminalPersistenceCount, 1)
assert.equal(terminalCalls, 2)
const observedOperationRequest = terminalRequests[0]!
const observedExecutionRequest = terminalRequests[1]!
assert.equal(observedOperationRequest.url,
  `https://run.googleapis.com/v2/${operationResource}`)
assert.equal(observedOperationRequest.method, 'GET')
assert.equal(observedOperationRequest.retry, false)
assert.equal(observedOperationRequest.maxRedirects, 0)
assert.equal('data' in observedOperationRequest, false)
assert.equal(observedExecutionRequest.url,
  `https://run.googleapis.com/v2/${cloudRunJobResource}`
    + '/executions/execution-terminal-1')
assert.equal(observedExecutionRequest.method, 'GET')
assert.equal(observedExecutionRequest.retry, false)
assert.equal(observedExecutionRequest.maxRedirects, 0)
assert.equal('data' in observedExecutionRequest, false)
const persisted = persistedTerminalResult as {
  admissionAccountEffectivePricingAuthorityRef?: VisualIntelligenceEvidenceRef
  terminalAccountEffectivePricingAuthorityRef?: VisualIntelligenceEvidenceRef
  accountEffectivePricingRereadVerified?: boolean
  publicListPriceUsedAsSettlementAuthority?: boolean
  actualPlatformInternalCostUsdNanos?: number
  maximumPlatformInternalCostUsdNanos?: number
  scaleBackToZeroVerified?: boolean
  terminalWorkerStopped?: boolean
  customerCreditMutated?: boolean
}
assert.deepEqual(
  persisted.admissionAccountEffectivePricingAuthorityRef,
  admissionRateRef,
)
assert.deepEqual(
  persisted.terminalAccountEffectivePricingAuthorityRef,
  rateRef,
)
assert.notDeepEqual(
  persisted.admissionAccountEffectivePricingAuthorityRef,
  persisted.terminalAccountEffectivePricingAuthorityRef,
)
assert.equal(persisted.accountEffectivePricingRereadVerified, true)
assert.equal(persisted.publicListPriceUsedAsSettlementAuthority, false)
assert.equal(
  (persisted.actualPlatformInternalCostUsdNanos ?? Infinity) <=
    (persisted.maximumPlatformInternalCostUsdNanos ?? -1),
  true,
)
assert.equal(persisted.scaleBackToZeroVerified, true)
assert.equal(persisted.terminalWorkerStopped, true)
assert.equal(persisted.customerCreditMutated, false)
const replay = await owner.reconcileOneShot(invocationId)
assert.equal(replay.status, 'ready')
assert.equal(replay.status === 'ready' && replay.disposition,
  'identical_replay')
assert.equal(terminalPersistenceCount, 2)
assert.equal(terminalCalls, 4)

const pendingOwner =
  createCanonicalSourceAnalysisL4VisualEvidenceTerminalReconciliationOwner({
    workerEnvelopeReadPort,
    authorityRepository: {
      ...authorityRepository,
      async persistTerminalCreateOnly() { throw new Error('must not persist') },
    },
    workerEvidenceOwner,
    terminalObservationPort: {
      schemaVersion:
        'canonical-source-analysis-l4-visual-evidence-terminal-observation-port-v1',
      async readTerminalExecution() { return null },
    },
    currentRateReadPort: {
      schemaVersion:
        CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION,
      async rereadCurrentL4StandardRate() { throw new Error('must not read') },
    },
    objectPort: new MemoryObjectPort(),
  })
assert.deepEqual(await pendingOwner.reconcileOneShot(invocationId), {
  status: 'not_ready',
  blockerCode: 'source_visual_evidence_cloud_terminal_not_ready',
  terminalEvidencePersisted: false,
  customerCreditMutated: false,
})

console.log(JSON.stringify({
  ok: true,
  ownerVersion: owner.schemaVersion,
  cloudRunOperationAndExecutionReread: true,
  terminalTaskSucceededAndStopped: true,
  terminalGpuInstanceCount: 0,
  scaleBackToZeroVerified: true,
  exactWorkerUsageReconciled: true,
  accountEffectiveRateReconciled: true,
  publicListPriceSettlementAllowed: false,
  platformFundedPreapprovalAnalysis: true,
  customerCreditMutated: false,
  terminalEvidencePersistedCreateOnly: true,
  pendingOperationFailsClosed: true,
}))

function releaseItem(
  role:
    | 'media_probe'
    | 'private_media_transform'
    | 'scene_detection'
    | 'pixel_measurement'
    | 'exact_visible_text'
    | 'sampling_policy',
  itemOperationId: string,
  ordinal: number,
) {
  return Object.freeze({
    role,
    operationId: itemOperationId,
    runtimeReleaseRef: ref(`tool-release-${ordinal}`),
  })
}

function evidenceItem(
  role:
    | 'media_probe'
    | 'private_media_transform'
    | 'scene_detection'
    | 'pixel_measurement'
    | 'exact_visible_text'
    | 'sampling_policy',
  tool: 'ffprobe' | 'ffmpeg' | 'pyscenedetect' | 'opencv' | 'ocr',
  itemOperationId: string,
  ordinal: number,
  evidenceRef = ref(`tool-evidence-${ordinal}`),
) {
  return Object.freeze({
    role,
    tool,
    operationId: itemOperationId,
    toolVersion: `${tool}-qualified-v1`,
    evidenceRef,
    runtimeReleaseRef: toolReleases[ordinal - 1]!.runtimeReleaseRef,
    executionRef: ref(`tool-execution-${ordinal}`),
    exactSourceChecksumBound: true as const,
    exactCanonicalResultRereadVerified: true as const,
    substantiveCpuExecutionUsed: false as const,
  })
}

function authorityPersistence(
  disposition: 'created' | 'identical_replay',
) {
  return Object.freeze({
    disposition,
    repositoryRecordRef: ref(`terminal-record-${disposition}`),
    exactCreateOnlyRereadVerified: true as const,
    cloudJobStarted: false as const,
    providerCalled: false as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

async function observeCurrentRate() {
  return observeCanonicalCurrentGoogleCloudGpuRateAuthority({
    rateAuthorityId: 'current-rate-l4-standard-primary-v1',
    rateAuthorityVersion: 1,
    routeId: 'l4_standard_primary',
    region: 'us-central1',
    readPort: {
      async readCurrentRouteRate() { return rawRateObservation() },
    },
  })
}

function rawRateObservation(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    rateComponent('cloud_run_l4_gpu_second', 'gpu_second', 186_700, '1'),
    rateComponent('cloud_run_vcpu_second', 'vcpu_second', 18_000, '2'),
    rateComponent('cloud_run_memory_gib_second', 'gib_second', 2_000, '3'),
    rateComponent('private_object_storage_gib_month',
      'gib_month', 20_000_000, '4'),
    rateComponent('network_egress_gib', 'gib', 120_000_000, '5'),
    rateComponent('object_class_a_per_1000',
      'per_1000_operations', 5_000_000, '6'),
    rateComponent('object_class_b_per_1000',
      'per_1000_operations', 400_000, '7'),
  ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('billing-scope'),
    pricingReaderConfigurationRef: ref('pricing-reader'),
    routeId: 'l4_standard_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('price-record-set'),
    pricingReadStartedAt: '2026-08-04T12:00:06.000Z',
    pricingReadFinishedAt: '2026-08-04T12:00:07.000Z',
  }
  return {
    ...payload,
    pricingReadDigestSha256: sha256AuthorityValue(payload),
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
  price: number,
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
        contractPriceUsdNanos: price,
      }],
      maximumContractPriceUsdNanos: price,
      skuMetadataRef: ref(`sku-metadata-${character}`),
      billingAccountPriceRef: ref(`billing-price-${character}`),
    }],
    skuDescriptionDigestSha256: character.repeat(64),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: price,
    currentPriceObservedAt: '2026-08-04T12:00:07.000Z',
    skuRecordRef: ref(`sku-record-${character}`),
  }
}
