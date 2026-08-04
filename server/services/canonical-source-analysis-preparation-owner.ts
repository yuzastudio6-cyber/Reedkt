import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalSourceAnalysisRequestAuthorityRepository,
} from './canonical-source-analysis-request-authority-repository'
import {
  verifyCanonicalSourceAnalysisPlanningScope,
  type CanonicalSourceAnalysisPlanningScope,
} from './canonical-source-led-orchestra-planning-reconciliation'
import type {
  CanonicalSourceLedManagedAudioProbe,
  CanonicalSourceLedProfessionalContentAnalysisInput,
} from './canonical-source-led-professional-content-analysis-port'

export const CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION =
  'canonical-source-analysis-finalized-authority-read-port-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION =
  'canonical-source-analysis-probe-authority-read-port-v2' as const
export const CANONICAL_SOURCE_ANALYSIS_PREPARATION_OWNER_VERSION =
  'canonical-source-analysis-preparation-owner-v2' as const

const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

export interface CanonicalSourceAnalysisFinalizedAuthority {
  readonly schemaVersion:
    'canonical-source-analysis-finalized-authority-v1'
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly storageProvider: 'google_cloud_storage'
  readonly storageBucket: string
  readonly storagePath: string
  readonly contentType: 'video/mp4'
  readonly checksumSha256: string
  readonly byteLength: number
  readonly storageGeneration: string
  readonly storageEtag: string
  readonly finalizedMediaAuthorityRef: VisualIntelligenceEvidenceRef
  readonly finalizedStorageObjectAuthorityRef:
    VisualIntelligenceEvidenceRef
  readonly sourceBindingManifestCandidateRef:
    VisualIntelligenceEvidenceRef
  readonly providerMediaReadAuthorityRef: VisualIntelligenceEvidenceRef
  readonly sourceAnalysisConsentRef: VisualIntelligenceEvidenceRef
  readonly platformAnalysisCostCapRef: VisualIntelligenceEvidenceRef
  readonly authenticatedPrincipalRereadVerified: true
  readonly workspaceProjectAccessRereadVerified: true
  readonly finalizedUploadRereadVerified: true
  readonly exactGenerationEtagShaLengthRereadVerified: true
  readonly sourceBindingManifestRereadVerified: true
  readonly sourceAnalysisConsentRereadVerified: true
  readonly platformAnalysisCostCapRereadVerified: true
  readonly browserStorageAuthorityAccepted: false
  readonly callerPathUrlBytesOrCommandAccepted: false
}

export interface CanonicalSourceAnalysisFinalizedAuthorityExpectation {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly storageProvider: 'google_cloud_storage'
  readonly storageBucket: string
  readonly storagePath: string
  readonly contentType: 'video/mp4'
  readonly checksumSha256: string
  readonly byteLength: number
  readonly storageGeneration: string
  readonly storageEtag: string
}

export interface CanonicalSourceAnalysisProbeAuthority {
  readonly schemaVersion: 'canonical-source-analysis-probe-authority-v2'
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly checksumSha256: string
  readonly byteLength: number
  readonly storageGeneration: string
  readonly storageEtag: string
  readonly width: number
  readonly height: number
  readonly hasAudio: boolean
  readonly audioProbe: CanonicalSourceLedManagedAudioProbe
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly frameCount: number
  readonly sourceTimeBaseNumerator: number
  readonly sourceTimeBaseDenominator: number
  readonly constantFrameRate: true
  readonly finalizedMediaAuthorityRef: VisualIntelligenceEvidenceRef
  readonly finalizedStorageObjectAuthorityRef:
    VisualIntelligenceEvidenceRef
  readonly sourceProbeAuthorityRef: VisualIntelligenceEvidenceRef
  readonly probeRuntimeReleaseRef: VisualIntelligenceEvidenceRef
  readonly resultRuntimeRecordRef: VisualIntelligenceEvidenceRef
  readonly usageCostEvidenceRef: VisualIntelligenceEvidenceRef
  readonly operationId:
    'internal.visual_intelligence.probe_source_timing.v1'
  readonly routeProfileId:
    'quality_l4_user_triggered_standard_media_job_v1'
  readonly acceleratorClass: 'nvidia_l4'
  readonly userTriggeredOnly: true
  readonly minimumIdleInstances: 0
  readonly exactFinalizedSourceRereadVerified: true
  readonly exactProbeResultRereadVerified: true
  readonly ffprobeUsedForMetadataOnly: true
  readonly gpuDecodeUsedForFrameCountVerification: true
  readonly substantiveCpuMediaProcessingUsed: false
  readonly runtimeNetworkDownloadPerformed: false
  readonly customerCreditMutated: false
  readonly systemFailureChargedToCustomer: false
  readonly unapprovedOverageChargedToCustomer: false
  readonly scaleBackToZeroVerified: true
  readonly callerProbeFieldsAccepted: false
  readonly callerPathUrlBytesOrCommandAccepted: false
  readonly providerCalled: false
  readonly publicDeliveryGranted: false
  readonly productionAuthorityGranted: false
}

export interface CanonicalSourceAnalysisFinalizedAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION
  readExactFinalizedSource(input: Readonly<{
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    sourceSequenceItemId: string
    mediaAssetId: string
    uploadedOrder: number
  }>): Promise<CanonicalSourceAnalysisFinalizedAuthority | null>
}

export interface CanonicalSourceAnalysisProbeAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION
  readCompletedExactProbe(
    input: CanonicalSourceAnalysisProbeAuthorityScope,
  ): Promise<CanonicalSourceAnalysisProbeAuthority | null>
}

export interface CanonicalSourceAnalysisProbeAuthorityScope {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly checksumSha256: string
  readonly byteLength: number
  readonly storageGeneration: string
  readonly storageEtag: string
  readonly finalizedMediaAuthorityRef: VisualIntelligenceEvidenceRef
  readonly finalizedStorageObjectAuthorityRef: VisualIntelligenceEvidenceRef
}

export type CanonicalSourceAnalysisPreparationResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode:
        | 'canonical_finalized_source_authority_not_ready'
        | 'canonical_l4_source_probe_authority_not_ready'
      sourceIndex: number
      preparedRequestPersisted: false
      transcriptDispatched: false
      visualIntelligenceDispatched: false
      providerCalled: false
      gpuJobStarted: false
      customerCreditMutated: false
    }>
  | Readonly<{
      status: 'ready'
      disposition: 'created' | 'identical_replay'
      analysisRunId: string
      requestDigestSha256: string
      repositoryRecordRef: VisualIntelligenceEvidenceRef
      sourceCount: number
      exactFinalizedSourceRereadVerified: true
      exactL4ProbeRereadVerified: true
      preparedRequestPersisted: true
      transcriptDispatched: false
      visualIntelligenceDispatched: false
      providerCalled: false
      gpuJobStarted: false
      customerCreditMutated: false
    }>

export interface CanonicalSourceAnalysisPreparationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_PREPARATION_OWNER_VERSION
  readonly userTriggeredOnly: true
  readonly approximateDurationToFrameInferenceAllowed: false
  readonly browserProbeAuthorityAccepted: false
  readonly directTranscriptDispatchAllowed: false
  readonly directVisualIntelligenceDispatchAllowed: false
  prepareForOrchestra(
    scope: CanonicalSourceAnalysisPlanningScope,
  ): Promise<CanonicalSourceAnalysisPreparationResult>
}

/**
 * Creates the immutable Orchestra request only after two independent server
 * rereads: finalized GCS lineage and an exact L4 source-timing probe. It has no
 * worker/provider dispatch port and cannot turn duration seconds into guessed
 * source frames.
 */
export function createCanonicalSourceAnalysisPreparationOwner(input: {
  readonly finalizedAuthorityReadPort:
    CanonicalSourceAnalysisFinalizedAuthorityReadPort
  readonly probeAuthorityReadPort:
    CanonicalSourceAnalysisProbeAuthorityReadPort
  readonly requestAuthorityRepository:
    CanonicalSourceAnalysisRequestAuthorityRepository
}): CanonicalSourceAnalysisPreparationOwner {
  validateDependencies(input)
  return Object.freeze({
    schemaVersion: CANONICAL_SOURCE_ANALYSIS_PREPARATION_OWNER_VERSION,
    userTriggeredOnly: true as const,
    approximateDurationToFrameInferenceAllowed: false as const,
    browserProbeAuthorityAccepted: false as const,
    directTranscriptDispatchAllowed: false as const,
    directVisualIntelligenceDispatchAllowed: false as const,
    async prepareForOrchestra(
      untrustedScope: CanonicalSourceAnalysisPlanningScope,
    ) {
      const scope = verifyCanonicalSourceAnalysisPlanningScope(untrustedScope)
      const sources = [] as CanonicalSourceLedProfessionalContentAnalysisInput[
        'sources'
      ][number][]
      for (const [index, planned] of scope.sources.entries()) {
        const finalizedRaw = await input.finalizedAuthorityReadPort
          .readExactFinalizedSource({
            ownerUserId: scope.ownerUserId,
            workspaceId: scope.workspaceId,
            projectId: scope.projectId,
            editSessionId: scope.editSessionId,
            sourceSequenceItemId: planned.sourceSequenceItemId,
            mediaAssetId: planned.mediaAssetId,
            uploadedOrder: planned.uploadedOrder,
          })
        if (!finalizedRaw) return notReady(
          'canonical_finalized_source_authority_not_ready',
          index + 1,
        )
        const finalized = verifyCanonicalSourceAnalysisFinalizedAuthority({
          untrusted: finalizedRaw,
          expected: {
            ownerUserId: scope.ownerUserId,
            workspaceId: scope.workspaceId,
            projectId: scope.projectId,
            editSessionId: scope.editSessionId,
            ...planned,
          },
        })
        const probeScope = {
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
          finalizedMediaAuthorityRef:
            cloneRef(finalized.finalizedMediaAuthorityRef),
          finalizedStorageObjectAuthorityRef:
            cloneRef(finalized.finalizedStorageObjectAuthorityRef),
        } satisfies CanonicalSourceAnalysisProbeAuthorityScope
        const probeRaw = await input.probeAuthorityReadPort
          .readCompletedExactProbe(probeScope)
        if (!probeRaw) return notReady(
          'canonical_l4_source_probe_authority_not_ready',
          index + 1,
        )
        const probe = verifyCanonicalSourceAnalysisProbeAuthority({
          untrusted: probeRaw,
          expected: probeScope,
        })
        sources.push(Object.freeze({
          sourceSequenceItemId: finalized.sourceSequenceItemId,
          mediaAssetId: finalized.mediaAssetId,
          uploadedOrder: finalized.uploadedOrder,
          storageProvider: 'google_cloud_storage' as const,
          storageBucket: finalized.storageBucket,
          storagePath: finalized.storagePath,
          checksumSha256: finalized.checksumSha256,
          byteLength: finalized.byteLength,
          durationFrames: probe.frameCount,
          managedApiAuthority: Object.freeze({
            ownerUserId: finalized.ownerUserId,
            storageBucket: finalized.storageBucket,
            storagePath: finalized.storagePath,
            contentType: 'video/mp4' as const,
            storageGeneration: finalized.storageGeneration,
            storageEtag: finalized.storageEtag,
            width: probe.width,
            height: probe.height,
            hasAudio: probe.hasAudio,
            audioProbe: cloneAudioProbe(probe.audioProbe),
            fpsNumerator: probe.fpsNumerator,
            fpsDenominator: probe.fpsDenominator,
            frameCount: probe.frameCount,
            sourceTimeBaseNumerator: probe.sourceTimeBaseNumerator,
            sourceTimeBaseDenominator: probe.sourceTimeBaseDenominator,
            finalizedMediaAuthorityRef:
              cloneRef(finalized.finalizedMediaAuthorityRef),
            finalizedStorageObjectAuthorityRef:
              cloneRef(finalized.finalizedStorageObjectAuthorityRef),
            sourceBindingManifestCandidateRef:
              cloneRef(finalized.sourceBindingManifestCandidateRef),
            sourceProbeAuthorityRef:
              cloneRef(probe.sourceProbeAuthorityRef),
            providerMediaReadAuthorityRef:
              cloneRef(finalized.providerMediaReadAuthorityRef),
            sourceAnalysisConsentRef:
              cloneRef(finalized.sourceAnalysisConsentRef),
            platformAnalysisCostCapRef:
              cloneRef(finalized.platformAnalysisCostCapRef),
          }),
        }))
      }
      const request: CanonicalSourceLedProfessionalContentAnalysisInput =
        Object.freeze({
          workspaceId: scope.workspaceId,
          projectId: scope.projectId,
          editSessionId: scope.editSessionId,
          planningDirection: scope.planningDirection,
          planningDirectionDigestSha256:
            scope.planningDirectionDigestSha256,
          userInstructionDigestSha256:
            scope.userInstructionDigestSha256,
          fps: 30 as const,
          sources: Object.freeze(sources),
        })
      const persisted = await input.requestAuthorityRepository
        .persistCreateOnly({ scope, request })
      return Object.freeze({
        status: 'ready' as const,
        disposition: persisted.disposition,
        analysisRunId: persisted.analysisRunId,
        requestDigestSha256: persisted.requestDigestSha256,
        repositoryRecordRef: cloneRef(persisted.repositoryRecordRef),
        sourceCount: sources.length,
        exactFinalizedSourceRereadVerified: true as const,
        exactL4ProbeRereadVerified: true as const,
        preparedRequestPersisted: true as const,
        transcriptDispatched: false as const,
        visualIntelligenceDispatched: false as const,
        providerCalled: false as const,
        gpuJobStarted: false as const,
        customerCreditMutated: false as const,
      })
    },
  })
}

export function verifyCanonicalSourceAnalysisFinalizedAuthority(input: {
  readonly untrusted: unknown
  readonly expected: CanonicalSourceAnalysisFinalizedAuthorityExpectation
}): CanonicalSourceAnalysisFinalizedAuthority {
  const value = exactRecord(input.untrusted, [
    'schemaVersion', 'ownerUserId', 'workspaceId', 'projectId',
    'editSessionId', 'sourceSequenceItemId', 'mediaAssetId',
    'uploadedOrder', 'storageProvider', 'storageBucket', 'storagePath',
    'contentType', 'checksumSha256', 'byteLength', 'storageGeneration',
    'storageEtag', 'finalizedMediaAuthorityRef',
    'finalizedStorageObjectAuthorityRef',
    'sourceBindingManifestCandidateRef', 'providerMediaReadAuthorityRef',
    'sourceAnalysisConsentRef', 'platformAnalysisCostCapRef',
    'authenticatedPrincipalRereadVerified',
    'workspaceProjectAccessRereadVerified', 'finalizedUploadRereadVerified',
    'exactGenerationEtagShaLengthRereadVerified',
    'sourceBindingManifestRereadVerified',
    'sourceAnalysisConsentRereadVerified',
    'platformAnalysisCostCapRereadVerified',
    'browserStorageAuthorityAccepted',
    'callerPathUrlBytesOrCommandAccepted',
  ])
  const expected = input.expected
  if (
    value.schemaVersion !== 'canonical-source-analysis-finalized-authority-v1'
    || value.ownerUserId !== expected.ownerUserId
    || value.workspaceId !== expected.workspaceId
    || value.projectId !== expected.projectId
    || value.editSessionId !== expected.editSessionId
    || value.sourceSequenceItemId !== expected.sourceSequenceItemId
    || value.mediaAssetId !== expected.mediaAssetId
    || value.uploadedOrder !== expected.uploadedOrder
    || value.storageProvider !== expected.storageProvider
    || value.storageBucket !== expected.storageBucket
    || value.storagePath !== expected.storagePath
    || value.contentType !== expected.contentType
    || value.checksumSha256 !== expected.checksumSha256
    || value.byteLength !== expected.byteLength
    || value.storageGeneration !== expected.storageGeneration
    || value.storageEtag !== expected.storageEtag
    || value.authenticatedPrincipalRereadVerified !== true
    || value.workspaceProjectAccessRereadVerified !== true
    || value.finalizedUploadRereadVerified !== true
    || value.exactGenerationEtagShaLengthRereadVerified !== true
    || value.sourceBindingManifestRereadVerified !== true
    || value.sourceAnalysisConsentRereadVerified !== true
    || value.platformAnalysisCostCapRereadVerified !== true
    || value.browserStorageAuthorityAccepted !== false
    || value.callerPathUrlBytesOrCommandAccepted !== false
  ) throw conflict('source_analysis_finalized_authority_mismatch')
  const refs = [
    value.finalizedMediaAuthorityRef,
    value.finalizedStorageObjectAuthorityRef,
    value.sourceBindingManifestCandidateRef,
    value.providerMediaReadAuthorityRef,
    value.sourceAnalysisConsentRef,
    value.platformAnalysisCostCapRef,
  ].map(parseRef)
  if (new Set(refs.map(refKey)).size !== refs.length) {
    throw conflict('source_analysis_finalized_authority_refs_invalid')
  }
  return Object.freeze({
    ...(value as unknown as CanonicalSourceAnalysisFinalizedAuthority),
    finalizedMediaAuthorityRef: refs[0]!,
    finalizedStorageObjectAuthorityRef: refs[1]!,
    sourceBindingManifestCandidateRef: refs[2]!,
    providerMediaReadAuthorityRef: refs[3]!,
    sourceAnalysisConsentRef: refs[4]!,
    platformAnalysisCostCapRef: refs[5]!,
  })
}

export function verifyCanonicalSourceAnalysisProbeAuthority(input: {
  readonly untrusted: unknown
  readonly expected: CanonicalSourceAnalysisProbeAuthorityScope
}): CanonicalSourceAnalysisProbeAuthority {
  const value = exactRecord(input.untrusted, [
    'schemaVersion', 'ownerUserId', 'workspaceId', 'projectId',
    'editSessionId', 'sourceSequenceItemId', 'mediaAssetId',
    'uploadedOrder', 'checksumSha256', 'byteLength', 'storageGeneration',
    'storageEtag', 'width', 'height', 'hasAudio', 'audioProbe',
    'fpsNumerator', 'fpsDenominator', 'frameCount',
    'sourceTimeBaseNumerator', 'sourceTimeBaseDenominator',
    'constantFrameRate', 'finalizedMediaAuthorityRef',
    'finalizedStorageObjectAuthorityRef', 'sourceProbeAuthorityRef',
    'probeRuntimeReleaseRef', 'resultRuntimeRecordRef',
    'usageCostEvidenceRef', 'operationId', 'routeProfileId',
    'acceleratorClass', 'userTriggeredOnly', 'minimumIdleInstances',
    'exactFinalizedSourceRereadVerified', 'exactProbeResultRereadVerified',
    'ffprobeUsedForMetadataOnly', 'gpuDecodeUsedForFrameCountVerification',
    'substantiveCpuMediaProcessingUsed', 'runtimeNetworkDownloadPerformed',
    'customerCreditMutated', 'systemFailureChargedToCustomer',
    'unapprovedOverageChargedToCustomer', 'scaleBackToZeroVerified',
    'callerProbeFieldsAccepted', 'callerPathUrlBytesOrCommandAccepted',
    'providerCalled', 'publicDeliveryGranted', 'productionAuthorityGranted',
  ])
  const expected = input.expected
  if (
    value.schemaVersion !== 'canonical-source-analysis-probe-authority-v2'
    || value.ownerUserId !== expected.ownerUserId
    || value.workspaceId !== expected.workspaceId
    || value.projectId !== expected.projectId
    || value.editSessionId !== expected.editSessionId
    || value.sourceSequenceItemId !== expected.sourceSequenceItemId
    || value.mediaAssetId !== expected.mediaAssetId
    || value.uploadedOrder !== expected.uploadedOrder
    || value.checksumSha256 !== expected.checksumSha256
    || value.byteLength !== expected.byteLength
    || value.storageGeneration !== expected.storageGeneration
    || value.storageEtag !== expected.storageEtag
    || !positiveInteger(value.width)
    || !positiveInteger(value.height)
    || typeof value.hasAudio !== 'boolean'
    || !positiveInteger(value.fpsNumerator)
    || !positiveInteger(value.fpsDenominator)
    || !positiveInteger(value.frameCount)
    || !positiveInteger(value.sourceTimeBaseNumerator)
    || !positiveInteger(value.sourceTimeBaseDenominator)
    || value.constantFrameRate !== true
    || value.operationId !==
      'internal.visual_intelligence.probe_source_timing.v1'
    || value.routeProfileId !==
      'quality_l4_user_triggered_standard_media_job_v1'
    || value.acceleratorClass !== 'nvidia_l4'
    || value.userTriggeredOnly !== true
    || value.minimumIdleInstances !== 0
    || value.exactFinalizedSourceRereadVerified !== true
    || value.exactProbeResultRereadVerified !== true
    || value.ffprobeUsedForMetadataOnly !== true
    || value.gpuDecodeUsedForFrameCountVerification !== true
    || value.substantiveCpuMediaProcessingUsed !== false
    || value.runtimeNetworkDownloadPerformed !== false
    || value.customerCreditMutated !== false
    || value.systemFailureChargedToCustomer !== false
    || value.unapprovedOverageChargedToCustomer !== false
    || value.scaleBackToZeroVerified !== true
    || value.callerProbeFieldsAccepted !== false
    || value.callerPathUrlBytesOrCommandAccepted !== false
    || value.providerCalled !== false
    || value.publicDeliveryGranted !== false
    || value.productionAuthorityGranted !== false
  ) throw conflict('source_analysis_probe_authority_mismatch')
  const audioProbe = parseAudioProbe(value.audioProbe)
  if (
    value.hasAudio !==
      (audioProbe.disposition === 'verified_audio_stream')
  ) throw conflict('source_analysis_probe_audio_authority_mismatch')
  const refs = [
    value.finalizedMediaAuthorityRef,
    value.finalizedStorageObjectAuthorityRef,
    value.sourceProbeAuthorityRef,
    value.probeRuntimeReleaseRef,
    value.resultRuntimeRecordRef,
    value.usageCostEvidenceRef,
  ].map(parseRef)
  if (new Set(refs.map(refKey)).size !== refs.length) {
    throw conflict('source_analysis_probe_authority_refs_invalid')
  }
  if (
    refKey(refs[0]!) !== refKey(expected.finalizedMediaAuthorityRef)
    || refKey(refs[1]!) !==
      refKey(expected.finalizedStorageObjectAuthorityRef)
  ) throw conflict('source_analysis_probe_finalized_refs_mismatch')
  return Object.freeze({
    ...(value as unknown as CanonicalSourceAnalysisProbeAuthority),
    audioProbe,
    finalizedMediaAuthorityRef: refs[0]!,
    finalizedStorageObjectAuthorityRef: refs[1]!,
    sourceProbeAuthorityRef: refs[2]!,
    probeRuntimeReleaseRef: refs[3]!,
    resultRuntimeRecordRef: refs[4]!,
    usageCostEvidenceRef: refs[5]!,
  })
}

function parseAudioProbe(untrusted: unknown): CanonicalSourceLedManagedAudioProbe {
  if (
    untrusted && typeof untrusted === 'object'
    && !Array.isArray(untrusted)
    && (untrusted as { disposition?: unknown }).disposition ===
      'verified_no_audio_stream'
  ) {
    exactRecord(untrusted, ['disposition'])
    return Object.freeze({ disposition: 'verified_no_audio_stream' })
  }
  const value = exactRecord(untrusted, [
    'disposition', 'videoStreamIndex', 'videoStartTimeBaseUnits',
    'videoTimeBaseNumerator', 'videoTimeBaseDenominator',
    'audioStreamIndex', 'audioStartTimeBaseUnits',
    'audioDurationTimeBaseUnits', 'audioTimeBaseNumerator',
    'audioTimeBaseDenominator', 'audioSampleRateHertz',
    'audioChannelCount',
  ])
  if (
    value.disposition !== 'verified_audio_stream'
    || !nonnegativeInteger(value.videoStreamIndex)
    || !safeInteger(value.videoStartTimeBaseUnits)
    || !positiveInteger(value.videoTimeBaseNumerator)
    || !positiveInteger(value.videoTimeBaseDenominator)
    || !nonnegativeInteger(value.audioStreamIndex)
    || !safeInteger(value.audioStartTimeBaseUnits)
    || !positiveInteger(value.audioDurationTimeBaseUnits)
    || !positiveInteger(value.audioTimeBaseNumerator)
    || !positiveInteger(value.audioTimeBaseDenominator)
    || !positiveInteger(value.audioSampleRateHertz)
    || !positiveInteger(value.audioChannelCount)
    || Number(value.audioChannelCount) > 32
  ) throw conflict('source_analysis_probe_audio_shape_invalid')
  return Object.freeze({
    disposition: 'verified_audio_stream' as const,
    videoStreamIndex: Number(value.videoStreamIndex),
    videoStartTimeBaseUnits: Number(value.videoStartTimeBaseUnits),
    videoTimeBaseNumerator: Number(value.videoTimeBaseNumerator),
    videoTimeBaseDenominator: Number(value.videoTimeBaseDenominator),
    audioStreamIndex: Number(value.audioStreamIndex),
    audioStartTimeBaseUnits: Number(value.audioStartTimeBaseUnits),
    audioDurationTimeBaseUnits: Number(value.audioDurationTimeBaseUnits),
    audioTimeBaseNumerator: Number(value.audioTimeBaseNumerator),
    audioTimeBaseDenominator: Number(value.audioTimeBaseDenominator),
    audioSampleRateHertz: Number(value.audioSampleRateHertz),
    audioChannelCount: Number(value.audioChannelCount),
  })
}

function validateDependencies(input: {
  finalizedAuthorityReadPort: CanonicalSourceAnalysisFinalizedAuthorityReadPort
  probeAuthorityReadPort: CanonicalSourceAnalysisProbeAuthorityReadPort
  requestAuthorityRepository: CanonicalSourceAnalysisRequestAuthorityRepository
}): void {
  if (
    input.finalizedAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_FINALIZED_AUTHORITY_READ_PORT_VERSION
    || typeof input.finalizedAuthorityReadPort.readExactFinalizedSource !==
      'function'
    || input.probeAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION
    || typeof input.probeAuthorityReadPort.readCompletedExactProbe !==
      'function'
    || typeof input.requestAuthorityRepository?.persistCreateOnly !==
      'function'
    || typeof input.requestAuthorityRepository?.readExactPreparedRequest !==
      'function'
  ) throw notReadyError('source_analysis_preparation_dependencies_invalid')
}

function notReady(
  blockerCode: CanonicalSourceAnalysisPreparationResult extends infer Result
    ? Result extends { blockerCode: infer Code } ? Code : never
    : never,
  sourceIndex: number,
): CanonicalSourceAnalysisPreparationResult {
  return Object.freeze({
    status: 'not_ready' as const,
    blockerCode,
    sourceIndex,
    preparedRequestPersisted: false as const,
    transcriptDispatched: false as const,
    visualIntelligenceDispatched: false as const,
    providerCalled: false as const,
    gpuJobStarted: false as const,
    customerCreditMutated: false as const,
  })
}

function parseRef(untrusted: unknown): VisualIntelligenceEvidenceRef {
  const value = exactRecord(untrusted, ['id', 'version', 'contentHash'])
  if (
    typeof value.id !== 'string'
    || !SAFE_ID.test(value.id)
    || value.id.includes('..')
    || !positiveInteger(value.version)
    || typeof value.contentHash !== 'string'
    || !PREFIXED_SHA256.test(value.contentHash)
  ) throw conflict('source_analysis_evidence_ref_invalid')
  return Object.freeze({
    id: value.id,
    version: Number(value.version),
    contentHash: value.contentHash,
  })
}

function cloneRef(ref: VisualIntelligenceEvidenceRef) {
  return Object.freeze({ ...ref })
}

function cloneAudioProbe(
  value: CanonicalSourceLedManagedAudioProbe,
): CanonicalSourceLedManagedAudioProbe {
  return value.disposition === 'verified_no_audio_stream'
    ? Object.freeze({ disposition: 'verified_no_audio_stream' as const })
    : Object.freeze({ ...value })
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('source_analysis_preparation_record_invalid')
  }
  let prototype: object | null
  let actualKeys: readonly (string | symbol)[]
  let descriptors: PropertyDescriptorMap
  try {
    prototype = Object.getPrototypeOf(value)
    actualKeys = Reflect.ownKeys(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    throw conflict('source_analysis_preparation_record_invalid')
  }
  if (
    (prototype !== Object.prototype && prototype !== null)
    || actualKeys.some((key) => typeof key !== 'string')
    || actualKeys.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some((descriptor) =>
      'get' in descriptor || 'set' in descriptor)
  ) throw conflict('source_analysis_preparation_record_invalid')
  return value as Record<string, unknown>
}

function positiveInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function nonnegativeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function safeInteger(value: unknown): boolean {
  return Number.isSafeInteger(value)
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source-analysis preparation authority is stale or invalid.',
    409,
    { reason },
  )
}

function notReadyError(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source-analysis preparation dependencies are not ready.',
    503,
    { reason },
  )
}
