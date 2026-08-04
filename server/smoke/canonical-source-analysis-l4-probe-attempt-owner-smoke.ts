import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import {
  canonicalProfessionalToolGpuRuntimeReleaseSchema,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSourceAnalysisL4ProbeAttemptOwner,
  type CanonicalSourceAnalysisL4ProbeAdmission,
  type CanonicalSourceAnalysisL4ProbeCloudRunResult,
  type CanonicalSourceAnalysisL4ProbeTrigger,
  type CanonicalSourceAnalysisL4ProbeWorkerResult,
} from '../services/canonical-source-analysis-l4-probe-attempt-owner'
import {
  createCanonicalSourceAnalysisProbeAuthorityRepository,
} from '../services/canonical-source-analysis-probe-authority-repository'
import type {
  CanonicalSourceAnalysisFinalizedAuthority,
} from '../services/canonical-source-analysis-preparation-owner'
import {
  createVisualIntelligenceSourceGpuEvidenceUsageCost,
  type VisualIntelligenceSourceGpuEvidenceUsageCost,
} from '../services/canonical-visual-intelligence-source-gpu-evidence-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  observeCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalGoogleCloudGpuRateRawObservation,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  createVisualIntelligenceEvidenceRef,
  visualIntelligenceDigest,
} from '../visual-intelligence/visual-intelligence-contract'

const NOW = '2026-08-03T14:00:00.000Z'
const RATE_OBSERVED_AT = '2026-08-03T13:50:00.000Z'
const rawSha = (value: string | Buffer) => createHash('sha256')
  .update(value).digest('hex')
const ref = (
  id: string,
  value: unknown = { id },
): VisualIntelligenceEvidenceRef => createVisualIntelligenceEvidenceRef(
  id,
  value,
)

const sourceIdentity = Object.freeze({
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  sourceSequenceItemId: 'source-sequence-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  storageProvider: 'google_cloud_storage' as const,
  storageBucket: 'reeditpro-private-source-media',
  storagePath: 'workspaces/workspace-1/source/video.mp4',
  contentType: 'video/mp4' as const,
  checksumSha256: rawSha('exact-source-video-bytes'),
  byteLength: 48_000_000,
  storageGeneration: '101',
  storageEtag: 'source-etag-101',
})
const finalizedMediaAuthorityRef = ref('finalized-media-authority')
const finalizedStorageObjectAuthorityRef = ref(
  'finalized-storage-object-authority',
)
const finalizedAuthority: CanonicalSourceAnalysisFinalizedAuthority =
  Object.freeze({
    schemaVersion: 'canonical-source-analysis-finalized-authority-v1',
    ...sourceIdentity,
    finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef,
    sourceBindingManifestCandidateRef: ref('source-binding-manifest'),
    providerMediaReadAuthorityRef: ref('provider-media-read-authority'),
    sourceAnalysisConsentRef: ref('source-analysis-consent'),
    platformAnalysisCostCapRef: ref('source-analysis-cost-cap'),
    authenticatedPrincipalRereadVerified: true,
    workspaceProjectAccessRereadVerified: true,
    finalizedUploadRereadVerified: true,
    exactGenerationEtagShaLengthRereadVerified: true,
    sourceBindingManifestRereadVerified: true,
    sourceAnalysisConsentRereadVerified: true,
    platformAnalysisCostCapRereadVerified: true,
    browserStorageAuthorityAccepted: false,
    callerPathUrlBytesOrCommandAccepted: false,
  })

const triggerPayload = {
  schemaVersion: 'canonical-source-analysis-l4-probe-trigger-v1' as const,
  source: 'authenticated_server_source_analysis_trigger' as const,
  requestId: 'source-probe-request-1',
  sourceIdentity,
  userTriggerRecordRef: ref('authenticated-user-trigger'),
  idempotencyKey: 'source-probe-idempotency-1',
  triggeredAt: '2026-08-03T13:58:00.000Z',
  serverDerivedFinalizedSourceIdentity: true as const,
  browserStorageIdentityAccepted: false as const,
  callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
  customerCreditMutationAuthorized: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
}
const trigger: CanonicalSourceAnalysisL4ProbeTrigger = Object.freeze({
  ...triggerPayload,
  triggerHash: sha256AuthorityValue(triggerPayload),
})

const rate = await observeCanonicalCurrentGoogleCloudGpuRateAuthority({
  rateAuthorityId: 'source-analysis-l4-account-effective-rate',
  rateAuthorityVersion: 1,
  routeId: 'l4_standard_primary',
  region: 'us-central1',
  readPort: { async readCurrentRouteRate() { return rawRate() } },
})
const currentRateRef: VisualIntelligenceEvidenceRef = Object.freeze({
  id: rate.rateAuthorityId,
  version: rate.rateAuthorityVersion,
  contentHash: `sha256:${rate.rateAuthorityHash}`,
})
const runtimeRelease = release()
const runtimeReleaseRef: VisualIntelligenceEvidenceRef = Object.freeze({
  id: runtimeRelease.releaseId,
  version: runtimeRelease.releaseVersion,
  contentHash: `sha256:${runtimeRelease.releaseHash}`,
})

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly objects = new Map<string, Buffer>()
  failNextLaunchWrite = false

  async createOnly(input: {
    readonly objectPath: string
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawSha(input.body), input.contentSha256)
    if (
      this.failNextLaunchWrite
      && input.objectPath.includes('/launches/')
    ) {
      this.failNextLaunchWrite = false
      throw new Error('synthetic crash after cloud call before launch record')
    }
    const existing = this.objects.get(input.objectPath)
    if (existing) {
      assert.ok(existing.equals(input.body))
      return 'already_exists'
    }
    this.objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const body = this.objects.get(objectPath)
    return body ? Buffer.from(body) : null
  }
}

interface HarnessOptions {
  finalizedReady?: boolean
  admissionReady?: boolean
  releaseReady?: boolean
  cloudDisposition?: 'completed' | 'rejected' | 'throw'
  workerReady?: boolean
  costReady?: boolean
  maximumCostUsdNanos?: number
  tamperWorker?: (value: CanonicalSourceAnalysisL4ProbeWorkerResult) => unknown
  tamperCost?: (value: VisualIntelligenceSourceGpuEvidenceUsageCost) => unknown
  failLaunchWriteOnce?: boolean
}

function harness(options: HarnessOptions = {}) {
  const objectPort = new MemoryObjectPort()
  const repository = createCanonicalSourceAnalysisProbeAuthorityRepository({
    objectPort,
    prefix: 'private/smoke/source-analysis-probes',
  })
  objectPort.failNextLaunchWrite = options.failLaunchWriteOnce ?? false
  let cloudCalls = 0
  let finalizedReads = 0
  let admissionReads = 0
  let releaseReads = 0
  let workerReads = 0
  let costReads = 0
  let workerReady = options.workerReady ?? true
  let costReady = options.costReady ?? true
  let latestAdmission: CanonicalSourceAnalysisL4ProbeAdmission | null = null
  let cloudExecutionRef: VisualIntelligenceEvidenceRef | null = null
  let cloudTerminalRef: VisualIntelligenceEvidenceRef | null = null

  const owner = createCanonicalSourceAnalysisL4ProbeAttemptOwner({
    finalizedAuthorityReadPort: {
      schemaVersion: 'canonical-source-analysis-finalized-authority-read-port-v1',
      async readExactFinalizedSource() {
        finalizedReads += 1
        return options.finalizedReady === false ? null : finalizedAuthority
      },
    },
    admissionReadPort: {
      schemaVersion: 'canonical-source-analysis-l4-probe-admission-read-port-v1',
      async rereadAdmittedProbe({ trigger: admittedTrigger }) {
        admissionReads += 1
        if (options.admissionReady === false) return null
        latestAdmission = admission(admittedTrigger,
          options.maximumCostUsdNanos ?? 1_000_000_000)
        return latestAdmission
      },
    },
    runtimeReleaseReadPort: {
      schemaVersion:
        'canonical-source-analysis-l4-probe-runtime-release-read-port-v1',
      async rereadPrivateL4ProbeRelease() {
        releaseReads += 1
        return options.releaseReady === false ? null : runtimeRelease
      },
    },
    cloudRunPort: {
      async runOnce(input) {
        cloudCalls += 1
        if (options.cloudDisposition === 'throw') {
          throw new Error('synthetic uncertain cloud outcome')
        }
        const result = cloudResult(input.invocationId,
          options.cloudDisposition ?? 'completed')
        cloudExecutionRef = result.cloudRunExecutionRef
        cloudTerminalRef = result.cloudRunTerminalObservationRef
        return result
      },
    },
    workerResultReadPort: {
      async readCompletedWorkerResult(input) {
        workerReads += 1
        if (!workerReady || !latestAdmission || !cloudExecutionRef) return null
        const result = workerResult({
          invocationId: input.invocationId,
          envelopeHash: input.envelopeHash,
          admission: latestAdmission,
          cloudExecutionRef,
        })
        return options.tamperWorker?.(result) ?? result
      },
    },
    usageCostReadPort: {
      async readCompletedUsageCost(input) {
        costReads += 1
        if (
          !costReady || !cloudExecutionRef || !cloudTerminalRef
        ) return null
        const result = usageCost({
          invocationId: input.invocationId,
          envelopeHash: input.envelopeHash,
          cloudExecutionRef,
          cloudTerminalRef,
        })
        return options.tamperCost?.(result) ?? result
      },
    },
    probeAuthorityRepository: repository,
    lifecycleObjectPort: objectPort,
    prefix: 'private/smoke/source-analysis-attempts',
    now: () => new Date(NOW),
  })

  return {
    owner,
    repository,
    objectPort,
    counters: () => ({
      cloudCalls,
      finalizedReads,
      admissionReads,
      releaseReads,
      workerReads,
      costReads,
    }),
    makeWorkerReady() { workerReady = true },
    makeCostReady() { costReady = true },
  }
}

const positive = harness()
const created = await positive.owner.executeOneShot(trigger)
assert.equal(created.status, 'ready')
assert.equal(created.disposition, 'created')
assert.equal(created.customerCreditMutated, false)
assert.equal(created.platformFundedPreapprovalAnalysis, true)
assert.equal(created.persistedProbeAuthorityExactRereadVerified, true)
assert.equal(created.workerResultAndAccountEffectiveCostLineageBound, true)
assert.equal(created.scaleBackToZeroVerified, true)
assert.equal(positive.counters().cloudCalls, 1)
assert.equal(positive.objectPort.objects.size, 4)

const replay = await positive.owner.executeOneShot(trigger)
assert.equal(replay.status, 'ready')
assert.equal(replay.disposition, 'identical_replay')
assert.equal(positive.counters().cloudCalls, 1)
assert.equal(positive.counters().admissionReads, 1)
assert.equal(positive.counters().workerReads, 1)
assert.equal(positive.counters().costReads, 1)

const missingFinalized = harness({ finalizedReady: false })
assert.deepEqual(await missingFinalized.owner.executeOneShot(trigger), {
  status: 'not_ready',
  blockerCode: 'canonical_finalized_source_authority_not_ready',
  cloudJobStarted: false,
  automaticRetryAllowed: false,
  customerCreditMutated: false,
})
assert.equal(missingFinalized.counters().cloudCalls, 0)

const missingAdmission = harness({ admissionReady: false })
assert.equal(
  (await missingAdmission.owner.executeOneShot(trigger)).status,
  'not_ready',
)
assert.equal(missingAdmission.counters().cloudCalls, 0)

const missingRelease = harness({ releaseReady: false })
assert.equal(
  (await missingRelease.owner.executeOneShot(trigger)).status,
  'not_ready',
)
assert.equal(missingRelease.counters().cloudCalls, 0)

const pendingWorker = harness({ workerReady: false })
const workerPending = await pendingWorker.owner.executeOneShot(trigger)
assert.equal(workerPending.status, 'reconciliation_required')
assert.equal(workerPending.blockerCode, 'source_probe_worker_result_not_ready')
assert.equal(workerPending.cloudJobStartState, 'known_started')
pendingWorker.makeWorkerReady()
assert.equal(
  (await pendingWorker.owner.executeOneShot(trigger)).status,
  'ready',
)
assert.equal(pendingWorker.counters().cloudCalls, 1)

const pendingCost = harness({ costReady: false })
const costPending = await pendingCost.owner.executeOneShot(trigger)
assert.equal(costPending.status, 'reconciliation_required')
assert.equal(costPending.blockerCode, 'source_probe_terminal_cost_not_ready')
pendingCost.makeCostReady()
assert.equal(
  (await pendingCost.owner.executeOneShot(trigger)).status,
  'ready',
)
assert.equal(pendingCost.counters().cloudCalls, 1)

const unknown = harness({ cloudDisposition: 'throw' })
const unknownFirst = await unknown.owner.executeOneShot(trigger)
assert.equal(unknownFirst.status, 'reconciliation_required')
assert.equal(unknownFirst.blockerCode, 'source_probe_cloud_outcome_unknown')
assert.equal(unknownFirst.cloudJobStartState, 'unknown')
assert.equal(unknownFirst.unknownOutcomeChargedToCustomer, false)
assert.equal(
  (await unknown.owner.executeOneShot(trigger)).status,
  'reconciliation_required',
)
assert.equal(unknown.counters().cloudCalls, 1)

const crashedBeforeLaunchRecord = harness({ failLaunchWriteOnce: true })
await assert.rejects(
  crashedBeforeLaunchRecord.owner.executeOneShot(trigger),
)
const consumedWithoutLaunch = await crashedBeforeLaunchRecord.owner
  .executeOneShot(trigger)
assert.equal(consumedWithoutLaunch.status, 'reconciliation_required')
assert.equal(
  consumedWithoutLaunch.blockerCode,
  'source_probe_consumed_launch_not_observed',
)
assert.equal(consumedWithoutLaunch.cloudJobStartState, 'unknown')
assert.equal(crashedBeforeLaunchRecord.counters().cloudCalls, 1)

const rejected = harness({ cloudDisposition: 'rejected' })
const rejectedResult = await rejected.owner.executeOneShot(trigger)
assert.equal(rejectedResult.status, 'failed_before_creation')
assert.equal(rejectedResult.cloudJobStarted, false)
assert.equal(rejectedResult.substantiveWorkExecuted, false)
assert.equal(rejected.counters().workerReads, 0)
assert.equal(rejected.counters().costReads, 0)

await assert.rejects(
  harness({
    tamperWorker: (value) => ({ ...value, frameCount: value.frameCount + 1 }),
  }).owner.executeOneShot(trigger),
)
await assert.rejects(
  harness({
    tamperWorker: (value) => {
      const { workerResultHash, ...payload } = value
      assert.match(workerResultHash, /^[a-f0-9]{64}$/u)
      const variableFrameRate = { ...payload, constantFrameRate: false }
      return {
        ...variableFrameRate,
        workerResultHash: sha256AuthorityValue(variableFrameRate),
      }
    },
  }).owner.executeOneShot(trigger),
)
await assert.rejects(
  harness({
    tamperCost: (value) => ({
      ...value,
      terminalGpuInstanceCount: 1,
    }),
  }).owner.executeOneShot(trigger),
)
await assert.rejects(
  harness({ maximumCostUsdNanos: 1 }).owner.executeOneShot(trigger),
)
await assert.rejects(
  positive.owner.executeOneShot({
    ...trigger,
    sourceIdentity: { ...trigger.sourceIdentity, byteLength: 1 },
  }),
)

console.log(JSON.stringify({
  qualification:
    'canonical-source-analysis-l4-probe-attempt-owner-v1',
  exactUserTriggeredL4ProbeCreated: true,
  identicalReplayDidNotRedispatch: true,
  durableSingleUseConsumptionBeforeCloudCall: true,
  uncertainCloudOutcomeReconciliationOnly: true,
  automaticRetryAfterUnknownOutcomeAllowed: false,
  exactWorkerResultRereadRequired: true,
  exactAccountEffectiveTerminalCostRequired: true,
  scaleBackToZeroRequired: true,
  platformFundedPreapprovalAnalysis: true,
  customerCreditsMutated: false,
  liveGpuJobStarted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function admission(
  admittedTrigger: CanonicalSourceAnalysisL4ProbeTrigger,
  maximumPlatformInternalCostUsdNanos: number,
): CanonicalSourceAnalysisL4ProbeAdmission {
  const payload = {
    schemaVersion: 'canonical-source-analysis-l4-probe-admission-v1' as const,
    source: 'canonical_server_source_analysis_probe_admission_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    admissionId: 'source-analysis-l4-probe-admission-1',
    triggerRef: Object.freeze({
      id: admittedTrigger.requestId,
      version: 1,
      contentHash: `sha256:${admittedTrigger.triggerHash}`,
    }),
    sourceIdentity,
    finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef,
    sourceAnalysisConsentRef: finalizedAuthority.sourceAnalysisConsentRef,
    platformAnalysisCostCapRef:
      finalizedAuthority.platformAnalysisCostCapRef,
    platformEstimateRef: ref('source-probe-platform-estimate'),
    currentAccountRateAuthorityRef: currentRateRef,
    runtimeReleaseRef,
    operationId: 'internal.visual_intelligence.probe_source_timing.v1' as const,
    routeProfileId:
      'quality_l4_user_triggered_standard_media_job_v1' as const,
    routeId: 'l4_standard_primary' as const,
    maximumAttempts: 1 as const,
    attemptOrdinal: 1 as const,
    uncertainOutcomeRetryAllowed: false as const,
    createOnlyConsumptionRequiredBeforeCloudJob: true as const,
    exactFinalizedSourceConsentCostRateAndReleaseReread: true as const,
    userTriggeredScaleFromZero: true as const,
    minimumIdleInstances: 0 as const,
    platformFundedPreapprovalAnalysis: true as const,
    maximumPlatformInternalCostUsdNanos,
    customerCreditReservationRequired: false as const,
    customerCreditsMutated: false as const,
    systemFailureOrUnknownCostChargedToCustomer: false as const,
    unapprovedOverageChargedToCustomer: false as const,
    workDispatched: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    admittedAt: '2026-08-03T13:59:00.000Z',
    expiresAt: '2026-08-03T15:00:00.000Z',
  }
  return Object.freeze({
    ...payload,
    admissionHash: sha256AuthorityValue(payload),
  })
}

function cloudResult(
  invocationId: string,
  disposition: 'completed' | 'rejected',
): CanonicalSourceAnalysisL4ProbeCloudRunResult {
  const createRef = ref(`${invocationId}.cloud-create`)
  if (disposition === 'rejected') return Object.freeze({
    disposition: 'rejected_before_creation',
    cloudJobCreateRequestRef: createRef,
    cloudRunOperationRef: null,
    cloudRunExecutionRef: null,
    cloudRunTerminalObservationRef: null,
    providerInferenceOrSubstantiveWorkOutcome: 'not_executed',
    runningTaskCount: 0,
    observedAt: '2026-08-03T14:00:02.000Z',
  })
  return Object.freeze({
    disposition: 'completed',
    cloudJobCreateRequestRef: createRef,
    cloudRunOperationRef: ref(`${invocationId}.cloud-operation`),
    cloudRunExecutionRef: ref(`${invocationId}.cloud-execution`),
    cloudRunTerminalObservationRef: ref(`${invocationId}.cloud-terminal`),
    providerInferenceOrSubstantiveWorkOutcome: 'executed',
    runningTaskCount: 0,
    observedAt: '2026-08-03T14:01:30.000Z',
  })
}

function workerResult(input: {
  invocationId: string
  envelopeHash: string
  admission: CanonicalSourceAnalysisL4ProbeAdmission
  cloudExecutionRef: VisualIntelligenceEvidenceRef
}): CanonicalSourceAnalysisL4ProbeWorkerResult {
  const payload = {
    schemaVersion: 'canonical-source-analysis-l4-probe-worker-result-v1' as const,
    source: 'canonical_l4_source_analysis_probe_worker' as const,
    evidenceClass: 'canonical_private_reread' as const,
    invocationId: input.invocationId,
    envelopeHash: input.envelopeHash,
    admissionRef: Object.freeze({
      id: input.admission.admissionId,
      version: 1,
      contentHash: `sha256:${input.admission.admissionHash}`,
    }),
    releaseRef: runtimeReleaseRef,
    cloudRunExecutionRef: input.cloudExecutionRef,
    sourceIdentity,
    finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef,
    workerRuntimeRecordRef: ref(`${input.invocationId}.worker-runtime`),
    gpuFrameCountEvidenceRef: ref(`${input.invocationId}.gpu-frame-count`),
    width: 1920,
    height: 1080,
    hasAudio: false,
    audioProbe: { disposition: 'verified_no_audio_stream' as const },
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 11_520,
    sourceTimeBaseNumerator: 1,
    sourceTimeBaseDenominator: 12_288,
    constantFrameRate: true as const,
    execution: {
      exactEnvelopeAndFinalizedSourceRereadVerified: true as const,
      ffprobeUsedForMetadataOnly: true as const,
      nvdecUsedForCompleteFrameCountVerification: true as const,
      gpuFrameCountVerificationPassed: true as const,
      substantiveCpuMediaProcessingUsed: false as const,
      runtimeNetworkDownloadPerformed: false as const,
      workerActiveMilliseconds: 60_000,
      gpuActiveMilliseconds: 58_000,
      sourceBytesRead: sourceIdentity.byteLength,
      persistedPrivateBytes: 2_048,
      privateArtifactRetentionMilliseconds: 86_400_000,
      classAOperationCount: 2,
      classBOperationCount: 4,
    },
  }
  return Object.freeze({
    ...payload,
    workerResultHash: sha256AuthorityValue(payload),
  })
}

function usageCost(input: {
  invocationId: string
  envelopeHash: string
  cloudExecutionRef: VisualIntelligenceEvidenceRef
  cloudTerminalRef: VisualIntelligenceEvidenceRef
}): VisualIntelligenceSourceGpuEvidenceUsageCost {
  const actualUsage = {
    coldStartMilliseconds: 100,
    activeExecutionMilliseconds: 60_000,
    shutdownMilliseconds: 100,
    totalBillableMilliseconds: 60_200,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedGpuCount: 1 as const,
    persistedPrivateBytes: 2_048,
    privateArtifactRetentionMilliseconds: 86_400_000,
    networkEgressBytes: 0 as const,
    classAOperationCount: 2,
    classBOperationCount: 4,
  }
  const component = (name: string) => rate.components.find(
    (candidate) => candidate.componentClass === name,
  )!.maximumUsdNanosPerBillingUnit
  const actualCost = {
    gpuUsdNanos: ceil(component('cloud_run_l4_gpu_second'),
      actualUsage.totalBillableMilliseconds, 1, 1_000),
    vcpuUsdNanos: ceil(component('cloud_run_vcpu_second'),
      actualUsage.totalBillableMilliseconds, 8, 1_000),
    memoryUsdNanos: ceil(component('cloud_run_memory_gib_second'),
      actualUsage.totalBillableMilliseconds, 32, 1_000),
    privateStorageUsdNanos: ceil(
      component('private_object_storage_gib_month'),
      actualUsage.persistedPrivateBytes,
      actualUsage.privateArtifactRetentionMilliseconds,
      1_073_741_824 * 2_592_000_000,
    ),
    networkEgressUsdNanos: 0 as const,
    classAOperationUsdNanos: ceil(component('object_class_a_per_1000'),
      actualUsage.classAOperationCount, 1, 1_000),
    classBOperationUsdNanos: ceil(component('object_class_b_per_1000'),
      actualUsage.classBOperationCount, 1, 1_000),
  }
  const totalCost = Object.values(actualCost).reduce(
    (total, value) => total + value,
    0,
  )
  const exactActualCost = {
    ...actualCost,
    totalInternalCostUsdNanos: totalCost,
  }
  const envelopeDigestSha256 = `sha256:${input.envelopeHash}`
  const workerUsageEvidenceRef: VisualIntelligenceEvidenceRef = Object.freeze({
    id: `visual-intelligence-source-gpu-usage-${input.invocationId}`,
    version: 1,
    contentHash: visualIntelligenceDigest({
      invocationId: input.invocationId,
      envelopeDigestSha256,
      cloudRunExecutionRef: input.cloudExecutionRef,
      cloudRunTerminalObservationRef: input.cloudTerminalRef,
      actualUsage,
    }),
  })
  const attemptCostReceiptRef: VisualIntelligenceEvidenceRef = Object.freeze({
    id: `visual-intelligence-source-gpu-cost-${input.invocationId}`,
    version: 1,
    contentHash: visualIntelligenceDigest({
      invocationId: input.invocationId,
      accountEffectiveRateAuthorityRef: currentRateRef,
      workerUsageEvidenceRef,
      actualCost: exactActualCost,
    }),
  })
  return createVisualIntelligenceSourceGpuEvidenceUsageCost({
    schemaVersion: 'visual-intelligence-source-gpu-evidence-usage-cost-v1',
    source:
      'canonical_google_cloud_usage_and_account_effective_pricing_reread',
    evidenceClass: 'canonical_private_reread',
    invocationId: input.invocationId,
    envelopeDigestSha256,
    releaseRef: runtimeReleaseRef,
    cloudRunExecutionRef: input.cloudExecutionRef,
    cloudRunTerminalObservationRef: input.cloudTerminalRef,
    accountEffectiveRateAuthority: rate,
    workerUsageEvidenceRef,
    attemptCostReceiptRef,
    actualUsage,
    actualCost: exactActualCost,
    exactPlatformUsageReread: true,
    exactCurrentBillingAccountPriceReread: true,
    accountEffectiveCostRecorded: true,
    publicListPriceUsedAsSettlementAuthority: false,
    platformFundedPreapprovalAnalysis: true,
    customerEligibleToolCostMicros: 0,
    customerEligibleToolCostCredits: 0,
    serviceFeeIncluded: false,
    customerCreditsMutated: false,
    unapprovedOverageChargedToCustomer: false,
    terminalGpuInstanceCount: 0,
    scaleBackToZeroVerified: true,
    observedAt: '2026-08-03T14:02:00.000Z',
  })
}

function release() {
  const imageRef = ref('source-probe-l4-image')
  const payload = {
    schemaVersion:
      'canonical-professional-tool-gpu-runtime-release-observation-v2' as const,
    source: 'canonical_server_gpu_runtime_release_registry' as const,
    evidenceClass: 'canonical_private_reread' as const,
    releaseId: 'source-analysis-l4-probe-runtime-release',
    releaseVersion: 1,
    status: 'private_internal_qualified' as const,
    toolId: 'ffmpeg' as const,
    gpuExecutionOwnerBindingMode: 'native_gpu_implementation' as const,
    gpuExecutionOwnerToolId: 'ffmpeg' as const,
    legacyToolSubstantiveExecutionObserved: false as const,
    operationId: 'internal.visual_intelligence.probe_source_timing.v1',
    toolCostProfileId: 'gpu-tool-ffmpeg-v1',
    modelOrOperationCostProfileId: 'source-analysis-l4-probe-v1',
    routeId: 'l4_standard_primary' as const,
    runtimeRegion: 'us-central1' as const,
    executionTarget: 'google_cloud_run_l4_job' as const,
    machineType: 'cloud_run_nvidia_l4' as const,
    accelerator: 'nvidia_l4' as const,
    allocatedGpuCount: 1 as const,
    allocatedVcpuCount: 8 as const,
    allocatedMemoryGiB: 32 as const,
    allocatedLocalScratchGiB: 0 as const,
    serviceIdentityRef: ref('source-probe-service-identity'),
    immutableImageRef: imageRef,
    immutableImageDigest: imageRef.contentHash,
    sourceAndDependencyClosureRef: ref('source-probe-source-closure'),
    toolOrModelArtifactReleaseRef: ref('source-probe-ffmpeg-release'),
    sbomRef: ref('source-probe-sbom'),
    imageScanAndSignatureRef: ref('source-probe-image-signature'),
    cudaDriverRuntimeQualificationRef: ref('source-probe-cuda-release'),
    substantiveGpuExecutionQualificationRef:
      ref('source-probe-nvdec-qualification'),
    scaleToZeroConfigurationRef: ref('source-probe-scale-zero'),
    privateNetworkAndArtifactTransportRef:
      ref('source-probe-private-transport'),
    substantiveGpuEvidenceClass:
      'nvenc_nvdec_hardware_codec_execution' as const,
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
    stopsAtTerminalAttempt: true as const,
    qualificationRunCount: 30,
    qualifiedAt: '2026-08-03T12:00:00.000Z',
    expiresAt: '2026-09-03T12:00:00.000Z',
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

function rawRate(): CanonicalGoogleCloudGpuRateRawObservation {
  const components = [
    rateComponent('cloud_run_l4_gpu_second', 'gpu_second', 'gpu', 1_000_000),
    rateComponent('cloud_run_vcpu_second', 'vcpu_second', 'cpu', 10_000),
    rateComponent('cloud_run_memory_gib_second', 'gib_second', 'memory', 1_000),
    rateComponent('private_object_storage_gib_month', 'gib_month', 'storage',
      10_000_000),
    rateComponent('network_egress_gib', 'gib', 'network', 0),
    rateComponent('object_class_a_per_1000', 'per_1000_operations', 'a',
      1_000_000),
    rateComponent('object_class_b_per_1000', 'per_1000_operations', 'b',
      100_000),
  ]
  const payload = {
    sourceClass: 'billing_account_effective_pricing_api' as const,
    billingAccountPricingScopeRef: ref('source-probe-billing-account'),
    pricingReaderConfigurationRef: ref('source-probe-price-reader'),
    routeId: 'l4_standard_primary' as const,
    region: 'us-central1' as const,
    currency: 'USD' as const,
    components,
    priceRecordSetRef: ref('source-probe-price-record-set'),
    pricingReadStartedAt: '2026-08-03T13:49:59.000Z',
    pricingReadFinishedAt: RATE_OBSERVED_AT,
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
  marker: string,
  rateUsdNanos: number,
) {
  const service = componentClass.startsWith('cloud_run')
    ? 'cloud-run'
    : 'cloud-storage'
  return {
    componentClass,
    cloudServiceName: service,
    skuRateBindingId: `source-probe-rate-${marker}`,
    skuPriceTerms: [{
      cloudServiceId: `service-${service}`,
      skuId: `sku-${marker}`,
      quantityPerBillingUnit: 1,
      consumptionModel: 'consumptionModels/default',
      apiUnit: billingUnit,
      apiUnitQuantity: '1',
      contractPriceTiers: [{
        startAmount: '0',
        contractPriceUsdNanos: rateUsdNanos,
      }],
      maximumContractPriceUsdNanos: rateUsdNanos,
      skuMetadataRef: ref(`source-probe-sku-metadata-${marker}`),
      billingAccountPriceRef:
        ref(`source-probe-account-price-${marker}`),
    }],
    skuDescriptionDigestSha256: rawSha(`source-probe-${marker}`),
    skuRegion: 'us-central1' as const,
    billingUnit,
    maximumUsdNanosPerBillingUnit: rateUsdNanos,
    currentPriceObservedAt: RATE_OBSERVED_AT,
    skuRecordRef: ref(`source-probe-sku-record-${marker}`),
  }
}

function ceil(
  left: number,
  middle: number,
  right: number,
  divisor: number,
): number {
  const numerator = BigInt(left) * BigInt(middle) * BigInt(right)
  return Number((numerator + BigInt(divisor) - 1n) / BigInt(divisor))
}
