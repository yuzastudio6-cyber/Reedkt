import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  assertCanonicalCurrentGoogleCloudGpuRateAuthority,
  type CanonicalCurrentGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  calculateCanonicalProfessionalGpuInfrastructureCost,
  type CanonicalProfessionalToolGpuUsage,
} from '../tool-cost-metering/canonical-professional-tool-gpu-cost-authority'
import {
  createCanonicalSourceLedSourceFrameAuthority,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisPreparedRequestForPlanning,
  type CanonicalSourceAnalysisRequestAuthorityReadPort,
} from './canonical-source-led-orchestra-planning-reconciliation'
import {
  CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION,
  CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisFinalizedAuthority,
  verifyCanonicalSourceAnalysisProbeAuthority,
  type CanonicalSourceAnalysisFinalizedAuthorityReadPort,
  type CanonicalSourceAnalysisProbeAuthorityReadPort,
  type CanonicalSourceAnalysisProbeAuthorityScope,
} from './canonical-source-analysis-preparation-owner'
import {
  createCanonicalSourceAnalysisL4VisualEvidenceAdmission,
  assertCanonicalSourceAnalysisL4VisualEvidenceRelease,
  assertCanonicalSourceAnalysisL4VisualEvidenceTrigger,
  type CanonicalSourceAnalysisL4VisualEvidenceAdmission,
  type CanonicalSourceAnalysisL4VisualEvidenceTrigger,
} from './canonical-source-analysis-l4-visual-evidence-attempt-owner'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository,
} from './canonical-source-analysis-l4-visual-evidence-authority-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ADMISSION_OWNER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-admission-owner-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-current-rate-read-port-v1' as const

const MAXIMUM_EXECUTION_MILLISECONDS = 900_000
const MAXIMUM_PRIVATE_ARTIFACT_BYTES = 8 * 1024 ** 3
const PRIVATE_ARTIFACT_RETENTION_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000
const ADMISSION_TTL_MILLISECONDS = 10 * 60 * 1_000
const MAXIMUM_TRIGGER_AGE_MILLISECONDS = 24 * 60 * 60 * 1_000

export interface CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION
  rereadCurrentL4StandardRate(input: Readonly<{
    routeId: 'l4_standard_primary'
    region: 'us-central1'
    currency: 'USD'
    at: string
  }>): Promise<unknown | null>
}

export type CanonicalSourceAnalysisL4VisualEvidenceAdmissionResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'canonical_source_visual_evidence_prepared_request_not_ready'
        | 'canonical_source_visual_evidence_finalized_source_not_ready'
        | 'canonical_source_visual_evidence_probe_not_ready'
        | 'canonical_source_visual_evidence_release_not_ready'
        | 'canonical_source_visual_evidence_current_rate_not_ready'
      admissionPersisted: false
      gpuJobStarted: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'ready'
      disposition: 'created' | 'identical_replay'
      admission: CanonicalSourceAnalysisL4VisualEvidenceAdmission
      scope: CanonicalSourceTranscriptOrchestraReadScope
      platformEstimateRef: VisualIntelligenceEvidenceRef
      currentAccountRateAuthorityRef: VisualIntelligenceEvidenceRef
      maximumPlatformInternalCostUsdNanos: number
      exactPreparedFinalizedProbeReleaseAndRateRereadVerified: true
      admissionPersistedAndReread: true
      platformFundedPreapprovalAnalysis: true
      gpuJobStarted: false
      customerCreditMutated: false
      publicDeliveryGranted: false
      productionAuthorityGranted: false
    }>

export interface CanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ADMISSION_OWNER_VERSION
  readonly routeId: 'l4_standard_primary'
  readonly region: 'us-central1'
  readonly platformFundedPreapprovalAnalysis: true
  readonly approvedEditSnapshotRequired: false
  readonly customerCreditMutationAllowed: false
  readonly callerRateReleaseOrCostCapAccepted: false
  admitOneShot(
    trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
  ): Promise<CanonicalSourceAnalysisL4VisualEvidenceAdmissionResult>
}

/**
 * Creates the only preapproval admission for L4 source-evidence preparation.
 * The trigger selects a source already present in a canonical prepared request;
 * it cannot provide source bytes, paths, release data, a price, or a cost cap.
 */
export function
createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner(input: Readonly<{
  requestAuthorityReadPort: CanonicalSourceAnalysisRequestAuthorityReadPort
  finalizedAuthorityReadPort: CanonicalSourceAnalysisFinalizedAuthorityReadPort
  probeAuthorityReadPort: CanonicalSourceAnalysisProbeAuthorityReadPort
  currentRateReadPort:
    CanonicalSourceAnalysisL4VisualEvidenceCurrentRateReadPort
  authorityRepository:
    CanonicalSourceAnalysisL4VisualEvidenceAuthorityRepository
  runtimeReleaseRef: VisualIntelligenceEvidenceRef
  now?: () => Date
}>): CanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner {
  validateDependencies(input)
  const now = input.now ?? (() => new Date())
  const runtimeReleaseRef = parseRef(input.runtimeReleaseRef)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_ADMISSION_OWNER_VERSION,
    routeId: 'l4_standard_primary' as const,
    region: 'us-central1' as const,
    platformFundedPreapprovalAnalysis: true as const,
    approvedEditSnapshotRequired: false as const,
    customerCreditMutationAllowed: false as const,
    callerRateReleaseOrCostCapAccepted: false as const,
    async admitOneShot(
      untrustedTrigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
    ) {
      const trigger = assertCanonicalSourceAnalysisL4VisualEvidenceTrigger(
        untrustedTrigger,
      )
      const admissionRequestedAt = now().toISOString()
      assertTriggerTime(trigger, admissionRequestedAt)
      const preparedRaw = await input.requestAuthorityReadPort
        .readExactPreparedRequest(trigger.planningScope)
      if (!preparedRaw) return notReady(
        'canonical_source_visual_evidence_prepared_request_not_ready',
      )
      const prepared = verifyCanonicalSourceAnalysisPreparedRequestForPlanning({
        scope: trigger.planningScope,
        request: preparedRaw,
      })
      const source = prepared.request.sources.find((candidate) =>
        candidate.sourceSequenceItemId === trigger.sourceSequenceItemId
        && candidate.mediaAssetId === trigger.mediaAssetId)
      if (!source?.managedApiAuthority) {
        throw conflict('source_visual_evidence_admission_source_missing')
      }
      if (source.storageProvider !== 'google_cloud_storage') {
        throw conflict('source_visual_evidence_admission_storage_invalid')
      }
      const authority = source.managedApiAuthority
      const finalizedRaw = await input.finalizedAuthorityReadPort
        .readExactFinalizedSource({
          ownerUserId: authority.ownerUserId,
          workspaceId: prepared.request.workspaceId,
          projectId: prepared.request.projectId,
          editSessionId: prepared.request.editSessionId,
          sourceSequenceItemId: source.sourceSequenceItemId,
          mediaAssetId: source.mediaAssetId,
          uploadedOrder: source.uploadedOrder,
        })
      if (!finalizedRaw) return notReady(
        'canonical_source_visual_evidence_finalized_source_not_ready',
      )
      const finalized = verifyCanonicalSourceAnalysisFinalizedAuthority({
        untrusted: finalizedRaw,
        expected: {
          ownerUserId: authority.ownerUserId,
          workspaceId: prepared.request.workspaceId,
          projectId: prepared.request.projectId,
          editSessionId: prepared.request.editSessionId,
          sourceSequenceItemId: source.sourceSequenceItemId,
          mediaAssetId: source.mediaAssetId,
          uploadedOrder: source.uploadedOrder,
          storageProvider: source.storageProvider,
          storageBucket: source.storageBucket,
          storagePath: source.storagePath,
          contentType: authority.contentType,
          checksumSha256: source.checksumSha256,
          byteLength: source.byteLength,
          storageGeneration: authority.storageGeneration,
          storageEtag: authority.storageEtag,
        },
      })
      const probeScope = createProbeScope(finalized)
      const probeRaw = await input.probeAuthorityReadPort
        .readCompletedExactProbe(probeScope)
      if (!probeRaw) return notReady(
        'canonical_source_visual_evidence_probe_not_ready',
      )
      const probe = verifyCanonicalSourceAnalysisProbeAuthority({
        untrusted: probeRaw,
        expected: probeScope,
      })
      assertPreparedAuthorityMatches({ authority, finalized, probe })
      const releaseRaw = await input.authorityRepository
        .readExactRelease(runtimeReleaseRef)
      if (!releaseRaw) return notReady(
        'canonical_source_visual_evidence_release_not_ready',
      )
      const release = assertCanonicalSourceAnalysisL4VisualEvidenceRelease(
        releaseRaw,
      )
      if (!sameRef(release.releaseRef, runtimeReleaseRef)) {
        throw conflict('source_visual_evidence_release_ref_mismatch')
      }
      const rateRaw = await input.currentRateReadPort
        .rereadCurrentL4StandardRate({
          routeId: 'l4_standard_primary',
          region: 'us-central1',
          currency: 'USD',
          at: admissionRequestedAt,
        })
      if (!rateRaw) return notReady(
        'canonical_source_visual_evidence_current_rate_not_ready',
      )
      const admittedAt = now().toISOString()
      assertTriggerTime(trigger, admittedAt)
      const rate = assertCanonicalCurrentGoogleCloudGpuRateAuthority(
        rateRaw, admittedAt,
      )
      assertExactRateAndRelease(rate, release.runtimeRegion)
      const maximumUsage = maximumUsageFor(source.byteLength)
      const maximumCost = calculateCanonicalProfessionalGpuInfrastructureCost({
        rateAuthority: rate,
        usage: maximumUsage,
        observedAt: admittedAt,
      })
      const maximumPlatformInternalCostUsdNanos = Math.max(
        1,
        maximumCost.totalInfrastructureCostUsdNanos,
      )
      const rateRef = rateAuthorityRef(rate)
      const scope = createEvidenceScope({
        prepared,
        source,
        finalized,
        probe,
      })
      const platformEstimateRef = opaqueRef(
        `source-visual-evidence-estimate-${trigger.triggerHash.slice(0, 32)}`,
        {
          triggerRef: triggerRef(trigger),
          scopeDigestSha256: sha256AuthorityValue(scope),
          runtimeReleaseRef,
          currentAccountRateAuthorityRef: rateRef,
          maximumUsage,
          maximumCost,
          maximumPlatformInternalCostUsdNanos,
          platformFundedPreapprovalAnalysis: true,
          customerEligibleCostUsdNanos: 0,
        },
      )
      const admission = createCanonicalSourceAnalysisL4VisualEvidenceAdmission({
        admissionId:
          `source-visual-evidence-admission-${trigger.triggerHash.slice(0, 32)}`,
        triggerRef: triggerRef(trigger),
        scopeDigestSha256: sha256AuthorityValue(scope),
        preparedRequestContentRef: Object.freeze({
          id: `prepared-source-analysis-${prepared.requestDigest.slice(0, 32)}`,
          version: 1,
          contentHash: `sha256:${prepared.requestDigest}`,
        }),
        finalizedMediaAuthorityRef: finalized.finalizedMediaAuthorityRef,
        finalizedStorageObjectAuthorityRef:
          finalized.finalizedStorageObjectAuthorityRef,
        sourceProbeAuthorityRef: probe.sourceProbeAuthorityRef,
        sourceAnalysisConsentRef: finalized.sourceAnalysisConsentRef,
        platformAnalysisCostCapRef: finalized.platformAnalysisCostCapRef,
        platformEstimateRef,
        currentAccountRateAuthorityRef: rateRef,
        runtimeReleaseRef,
        operationId:
          'internal.visual_intelligence.prepare_source_visual_evidence.v1',
        routeProfileId:
          'quality_l4_user_triggered_standard_media_job_v1',
        routeId: 'l4_standard_primary',
        maximumAttempts: 1,
        attemptOrdinal: 1,
        uncertainOutcomeRetryAllowed: false,
        createOnlyConsumptionRequiredBeforeCloudRunCall: true,
        exactPreparedSourceProbeConsentCostRateAndReleaseReread: true,
        userTriggeredScaleFromZero: true,
        minimumIdleInstances: 0,
        platformFundedPreapprovalAnalysis: true,
        maximumPlatformInternalCostUsdNanos,
        customerCreditReservationRequired: false,
        customerCreditsMutated: false,
        systemFailureOrUnknownCostChargedToCustomer: false,
        unapprovedOverageChargedToCustomer: false,
        admittedAt,
        expiresAt: new Date(
          Date.parse(admittedAt) + ADMISSION_TTL_MILLISECONDS,
        ).toISOString(),
      })
      const persisted = await input.authorityRepository
        .persistAdmissionCreateOnly({
          trigger,
          scope,
          preparedRequestContentRef: admission.preparedRequestContentRef,
          admission,
        })
      return Object.freeze({
        status: 'ready' as const,
        disposition: persisted.disposition,
        admission,
        scope,
        platformEstimateRef,
        currentAccountRateAuthorityRef: rateRef,
        maximumPlatformInternalCostUsdNanos,
        exactPreparedFinalizedProbeReleaseAndRateRereadVerified: true as const,
        admissionPersistedAndReread: true as const,
        platformFundedPreapprovalAnalysis: true as const,
        gpuJobStarted: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

function createProbeScope(
  finalized: ReturnType<typeof verifyCanonicalSourceAnalysisFinalizedAuthority>,
): CanonicalSourceAnalysisProbeAuthorityScope {
  return Object.freeze({
    ownerUserId: finalized.ownerUserId,
    workspaceId: finalized.workspaceId,
    projectId: finalized.projectId,
    editSessionId: finalized.editSessionId,
    sourceSequenceItemId: finalized.sourceSequenceItemId,
    mediaAssetId: finalized.mediaAssetId,
    uploadedOrder: finalized.uploadedOrder,
    checksumSha256: finalized.checksumSha256,
    byteLength: finalized.byteLength,
    storageGeneration: finalized.storageGeneration,
    storageEtag: finalized.storageEtag,
    finalizedMediaAuthorityRef: cloneRef(finalized.finalizedMediaAuthorityRef),
    finalizedStorageObjectAuthorityRef:
      cloneRef(finalized.finalizedStorageObjectAuthorityRef),
  })
}

function createEvidenceScope(input: Readonly<{
  prepared: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >
  source: ReturnType<
    typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
  >['request']['sources'][number]
  finalized: ReturnType<typeof verifyCanonicalSourceAnalysisFinalizedAuthority>
  probe: ReturnType<typeof verifyCanonicalSourceAnalysisProbeAuthority>
}>): CanonicalSourceTranscriptOrchestraReadScope {
  return Object.freeze({
    ownerUserId: input.finalized.ownerUserId,
    workspaceId: input.prepared.request.workspaceId,
    projectId: input.prepared.request.projectId,
    editSessionId: input.prepared.request.editSessionId,
    analysisRunId: input.prepared.analysisRunId,
    sourceSequenceItemId: input.source.sourceSequenceItemId,
    mediaAssetId: input.source.mediaAssetId,
    uploadedOrder: input.source.uploadedOrder,
    checksumSha256: input.source.checksumSha256,
    byteLength: input.source.byteLength,
    durationFrames: input.probe.frameCount,
    sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
      fpsNumerator: input.probe.fpsNumerator,
      fpsDenominator: input.probe.fpsDenominator,
      frameCount: input.probe.frameCount,
      timeBaseNumerator: input.probe.sourceTimeBaseNumerator,
      timeBaseDenominator: input.probe.sourceTimeBaseDenominator,
    }),
    finalizedMediaAuthorityRef:
      cloneRef(input.finalized.finalizedMediaAuthorityRef),
    sourceProbeAuthorityRef: cloneRef(input.probe.sourceProbeAuthorityRef),
  })
}

function maximumUsageFor(sourceByteLength: number):
CanonicalProfessionalToolGpuUsage {
  return Object.freeze({
    coldStartMilliseconds: 120_000,
    runtimeAndModelLoadMilliseconds: 30_000,
    activeGpuMilliseconds: 720_000,
    drainAndShutdownMilliseconds: 30_000,
    totalBillableMilliseconds: MAXIMUM_EXECUTION_MILLISECONDS,
    allocatedGpuCount: 1,
    allocatedVcpuCount: 8,
    allocatedMemoryGiB: 32,
    allocatedLocalScratchGiB: 0,
    privateArtifactBytes: Math.max(
      sourceByteLength,
      MAXIMUM_PRIVATE_ARTIFACT_BYTES,
    ),
    privateArtifactRetentionMilliseconds:
      PRIVATE_ARTIFACT_RETENTION_MILLISECONDS,
    networkEgressBytes: 0,
    classAOperationCount: 1_000,
    classBOperationCount: 1_000,
  })
}

function assertPreparedAuthorityMatches(input: Readonly<{
  authority: NonNullable<
    ReturnType<
      typeof verifyCanonicalSourceAnalysisPreparedRequestForPlanning
    >['request']['sources'][number]['managedApiAuthority']
  >
  finalized: ReturnType<typeof verifyCanonicalSourceAnalysisFinalizedAuthority>
  probe: ReturnType<typeof verifyCanonicalSourceAnalysisProbeAuthority>
}>): void {
  const expected = {
    finalizedMediaAuthorityRef: input.finalized.finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef:
      input.finalized.finalizedStorageObjectAuthorityRef,
    sourceProbeAuthorityRef: input.probe.sourceProbeAuthorityRef,
    sourceAnalysisConsentRef: input.finalized.sourceAnalysisConsentRef,
    platformAnalysisCostCapRef: input.finalized.platformAnalysisCostCapRef,
  }
  const actual = {
    finalizedMediaAuthorityRef: input.authority.finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef:
      input.authority.finalizedStorageObjectAuthorityRef,
    sourceProbeAuthorityRef: input.authority.sourceProbeAuthorityRef,
    sourceAnalysisConsentRef: input.authority.sourceAnalysisConsentRef,
    platformAnalysisCostCapRef: input.authority.platformAnalysisCostCapRef,
  }
  if (stableAuthorityStringify(actual) !== stableAuthorityStringify(expected)) {
    throw conflict('source_visual_evidence_prepared_authority_mismatch')
  }
}

function assertExactRateAndRelease(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
  releaseRegion: 'us-central1' | 'europe-west4',
): void {
  if (
    rate.routeId !== 'l4_standard_primary'
    || rate.profileId !== 'quality_l4_user_triggered_standard_media_job_v1'
    || rate.routeRole !== 'standard_primary'
    || rate.executionTarget !== 'google_cloud_run_l4_job'
    || rate.machineType !== 'cloud_run_nvidia_l4'
    || rate.accelerator !== 'nvidia_l4'
    || rate.region !== releaseRegion
    || rate.currency !== 'USD'
    || rate.sourceClass !== 'billing_account_effective_pricing_api'
    || !rate.exactSkuRegionCurrencyTierAndCurrentPriceReread
    || rate.customerPricingOrServiceFeeAuthorityGranted
    || rate.walletOrCreditMutationAuthorityGranted
    || !rate.approvedForPreapprovalInfrastructureEstimate
  ) throw conflict('source_visual_evidence_current_rate_invalid')
}

function rateAuthorityRef(
  rate: CanonicalCurrentGoogleCloudGpuRateAuthority,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: rate.rateAuthorityId,
    version: rate.rateAuthorityVersion,
    contentHash: `sha256:${rate.rateAuthorityHash}`,
  })
}

function triggerRef(
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: trigger.requestId,
    version: 1,
    contentHash: `sha256:${trigger.triggerHash}`,
  })
}

function opaqueRef(id: string, value: unknown): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(value)}`,
  })
}

function cloneRef(value: VisualIntelligenceEvidenceRef):
VisualIntelligenceEvidenceRef {
  return Object.freeze({ ...parseRef(value) })
}

function parseRef(value: VisualIntelligenceEvidenceRef):
VisualIntelligenceEvidenceRef {
  if (
    !value
    || typeof value !== 'object'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value.id)
    || value.id.includes('..')
    || !Number.isSafeInteger(value.version)
    || value.version < 1
    || !/^sha256:[a-f0-9]{64}$/u.test(value.contentHash)
  ) throw conflict('source_visual_evidence_ref_invalid')
  return value
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertTriggerTime(
  trigger: CanonicalSourceAnalysisL4VisualEvidenceTrigger,
  admittedAt: string,
): void {
  const age = Date.parse(admittedAt) - Date.parse(trigger.triggeredAt)
  if (age < 0 || age > MAXIMUM_TRIGGER_AGE_MILLISECONDS) {
    throw conflict('source_visual_evidence_trigger_time_invalid')
  }
}

function validateDependencies(input: Parameters<
  typeof createCanonicalSourceAnalysisL4VisualEvidenceAdmissionOwner
>[0]): void {
  if (
    input.requestAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION
    || typeof input.requestAuthorityReadPort.readExactPreparedRequest !==
      'function'
    || input.finalizedAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION
    || typeof input.finalizedAuthorityReadPort.readExactFinalizedSource !==
      'function'
    || input.probeAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION
    || typeof input.probeAuthorityReadPort.readCompletedExactProbe !==
      'function'
    || input.currentRateReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_CURRENT_RATE_READ_PORT_VERSION
    || typeof input.currentRateReadPort.rereadCurrentL4StandardRate !==
      'function'
    || typeof input.authorityRepository?.readExactRelease !== 'function'
    || typeof input.authorityRepository.persistAdmissionCreateOnly !==
      'function'
  ) throw notReadyError('source_visual_evidence_admission_dependencies_invalid')
}

function notReady(
  blockerCode: Extract<
    CanonicalSourceAnalysisL4VisualEvidenceAdmissionResult,
    { status: 'not_ready' }
  >['blockerCode'],
): Extract<
  CanonicalSourceAnalysisL4VisualEvidenceAdmissionResult,
  { status: 'not_ready' }
> {
  return Object.freeze({
    status: 'not_ready' as const,
    blockerCode,
    admissionPersisted: false as const,
    gpuJobStarted: false as const,
    customerCreditMutated: false as const,
  })
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source visual-evidence admission conflicts with its authority.',
    409,
    { requiredGate },
  )
}

function notReadyError(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source visual-evidence admission is not ready.',
    503,
    { requiredGate },
  )
}
