import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePlanningEvidenceAdmission,
} from '../../src/types/visual-intelligence'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import { ApiError } from '../errors/api-error'
import {
  canonicalSourceLedTranscriptEvidenceSchema,
  type CanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisSourceInput,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
  CanonicalSourceLedProfessionalContentAnalysisSource,
} from './canonical-source-led-professional-content-analysis-port'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

type TranscriptEvidence = CanonicalSourceLedContentAnalysisSourceInput[
  'transcript'
]

export interface CanonicalVisualIntelligenceSourceTranscriptResult {
  readonly schemaVersion:
    'canonical-visual-intelligence-source-transcript-result-v1'
  readonly transcriptAuthorityRef: VisualIntelligenceEvidenceRef
  readonly transcript: TranscriptEvidence
  readonly execution: {
    readonly executionOwner:
      'canonical_quality_first_source_transcript_router'
    readonly sourceAudioDisposition:
      | 'transcribed_on_nvidia_a100_80gb_primary'
      | 'transcribed_on_nvidia_l4_classified_fallback'
      | 'verified_no_audio_stream'
    readonly routeProfileId:
      | 'quality_a100_80gb_user_triggered_heavy_job_v1'
      | 'quality_l4_user_triggered_heavy_fallback_job_v1'
      | null
    readonly acceleratorClass: 'nvidia_a100_80gb' | 'nvidia_l4' | null
    readonly primaryAttemptOutcome:
      | 'completed'
      | 'not_started_terminal'
      | 'not_required_no_audio'
    readonly fallbackAttemptOutcome: 'not_attempted' | 'completed'
    readonly primaryAttemptTerminalFailureClass:
      | 'a100_capacity_unavailable_before_attempt_start'
      | 'a100_job_boot_failed_before_private_media_read'
      | 'a100_runtime_qualification_blocked_before_dispatch'
      | 'a100_driver_or_cuda_incompatible_before_model_load'
      | null
    readonly primaryAttemptReceiptRef: VisualIntelligenceEvidenceRef | null
    readonly completedAttemptReceiptRef: VisualIntelligenceEvidenceRef | null
    readonly completedRuntimeReleaseRef: VisualIntelligenceEvidenceRef | null
    readonly fallbackAdmissionRef: VisualIntelligenceEvidenceRef | null
    readonly attemptCostEvidenceRefs: readonly VisualIntelligenceEvidenceRef[]
    readonly routePolicyDigestSha256: string
    readonly gpuAccelerationUsed: boolean
    readonly cpuInferenceFallbackUsed: false
    readonly completeAudioTimelineProcessed: true
    readonly modelBytesPinnedBeforeExecution: boolean
    readonly runtimeDownloadPerformed: false
    readonly rawAudioPersisted: false
    readonly transcriptRereadVerified: true
    readonly customerCreditMutated: false
    readonly systemFailureChargedToCustomer: false
    readonly unapprovedOverageChargedToCustomer: false
  }
}

/**
 * Admission used by the canonical Visual Intelligence execution owner. Head
 * Intelligence and source-cleanup reconciliation do not receive this port.
 */
export interface CanonicalSourceVisualIntelligencePlanningAdmissionPort {
  admit(input: {
    readonly requestId: string
    readonly idempotencyKey: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly analysisRunId: string
    readonly source: CanonicalSourceLedProfessionalContentAnalysisSource
    readonly transcriptResult:
      CanonicalVisualIntelligenceSourceTranscriptResult
  }): Promise<VisualIntelligencePlanningEvidenceAdmission>
}

export function createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity(
  untrustedRequest: CanonicalSourceLedProfessionalContentAnalysisInput,
): {
  readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
  readonly requestDigest: string
  readonly analysisRunId: string
} {
  const request = verifyCanonicalSourceLedProfessionalContentAnalysisInput(
    untrustedRequest,
  )
  const requestDigest = rawDigest({
    schemaVersion:
      'canonical-source-led-visual-intelligence-analysis-request-v1',
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    planningDirectionDigestSha256:
      request.planningDirectionDigestSha256,
    userInstructionDigestSha256: request.userInstructionDigestSha256,
    fps: request.fps,
    sources: request.sources.map(
      canonicalSourceLedProfessionalContentAnalysisSourceIdentity,
    ),
  })
  return Object.freeze({
    request,
    requestDigest,
    analysisRunId: `source_analysis_${requestDigest}`,
  })
}

export function verifyCanonicalVisualIntelligenceSourceTranscriptResult(
  source: CanonicalSourceLedProfessionalContentAnalysisSource,
  raw: CanonicalVisualIntelligenceSourceTranscriptResult,
): CanonicalVisualIntelligenceSourceTranscriptResult {
  const transcript = canonicalSourceLedTranscriptEvidenceSchema.parse(
    raw.transcript,
  )
  const authority = source.managedApiAuthority!
  const execution = raw.execution
  const policy = createCanonicalQualityFirstUserTriggeredGpuPolicy()
  const primary = execution.sourceAudioDisposition ===
    'transcribed_on_nvidia_a100_80gb_primary'
  const fallback = execution.sourceAudioDisposition ===
    'transcribed_on_nvidia_l4_classified_fallback'
  const noAudio = execution.sourceAudioDisposition ===
    'verified_no_audio_stream'
  const validPrimary = primary
    && authority.hasAudio
    && execution.routeProfileId ===
      'quality_a100_80gb_user_triggered_heavy_job_v1'
    && execution.acceleratorClass === 'nvidia_a100_80gb'
    && execution.primaryAttemptOutcome === 'completed'
    && execution.fallbackAttemptOutcome === 'not_attempted'
    && execution.primaryAttemptTerminalFailureClass === null
    && execution.primaryAttemptReceiptRef !== null
    && execution.completedAttemptReceiptRef !== null
    && refKey(execution.completedAttemptReceiptRef) ===
      refKey(execution.primaryAttemptReceiptRef)
    && execution.fallbackAdmissionRef === null
    && execution.attemptCostEvidenceRefs.length === 1
    && execution.gpuAccelerationUsed
    && execution.modelBytesPinnedBeforeExecution
  const validFallback = fallback
    && authority.hasAudio
    && execution.routeProfileId ===
      'quality_l4_user_triggered_heavy_fallback_job_v1'
    && execution.acceleratorClass === 'nvidia_l4'
    && execution.primaryAttemptOutcome === 'not_started_terminal'
    && execution.fallbackAttemptOutcome === 'completed'
    && execution.primaryAttemptTerminalFailureClass !== null
    && policy.fallbackAdmission.allowedPrimaryFailureClasses.includes(
      execution.primaryAttemptTerminalFailureClass,
    )
    && execution.primaryAttemptReceiptRef !== null
    && execution.completedAttemptReceiptRef !== null
    && refKey(execution.completedAttemptReceiptRef) !==
      refKey(execution.primaryAttemptReceiptRef)
    && execution.fallbackAdmissionRef !== null
    && execution.attemptCostEvidenceRefs.length === 2
    && execution.gpuAccelerationUsed
    && execution.modelBytesPinnedBeforeExecution
  const validNoAudio = noAudio
    && !authority.hasAudio
    && execution.routeProfileId === null
    && execution.acceleratorClass === null
    && execution.primaryAttemptOutcome === 'not_required_no_audio'
    && execution.fallbackAttemptOutcome === 'not_attempted'
    && execution.primaryAttemptTerminalFailureClass === null
    && execution.primaryAttemptReceiptRef === null
    && execution.completedAttemptReceiptRef === null
    && execution.fallbackAdmissionRef === null
    && execution.attemptCostEvidenceRefs.length === 0
    && !execution.gpuAccelerationUsed
    && !execution.modelBytesPinnedBeforeExecution
    && transcript.status === 'no_speech'
    && transcript.segments.length === 0
  const transcriptCoverage = { ...transcript.coverage }
  Reflect.deleteProperty(transcriptCoverage, 'coverageDigestSha256')
  const refs = [
    execution.primaryAttemptReceiptRef,
    execution.completedAttemptReceiptRef,
    execution.fallbackAdmissionRef,
    ...execution.attemptCostEvidenceRefs,
  ].filter((value): value is VisualIntelligenceEvidenceRef => value !== null)
  if (
    raw.schemaVersion !==
      'canonical-visual-intelligence-source-transcript-result-v1'
    || !validRef(raw.transcriptAuthorityRef)
    || raw.transcriptAuthorityRef.contentHash !==
      `sha256:${transcript.transcriptDigestSha256}`
    || execution.executionOwner !==
      'canonical_quality_first_source_transcript_router'
    || (!validPrimary && !validFallback && !validNoAudio)
    || execution.routePolicyDigestSha256 !== `sha256:${policy.policyHash}`
    || refs.some((ref) => !validRef(ref))
    || new Set(execution.attemptCostEvidenceRefs.map(refKey)).size !==
      execution.attemptCostEvidenceRefs.length
    || execution.cpuInferenceFallbackUsed
    || !execution.completeAudioTimelineProcessed
    || execution.runtimeDownloadPerformed
    || execution.rawAudioPersisted
    || !execution.transcriptRereadVerified
    || execution.customerCreditMutated
    || execution.systemFailureChargedToCustomer
    || execution.unapprovedOverageChargedToCustomer
    || transcript.coverage.coveredEndFrameExclusive !== source.durationFrames
    || transcript.transcriptDigestSha256 !== rawDigest(transcript.segments)
    || transcript.coverage.coverageDigestSha256 !==
      rawDigest(transcriptCoverage)
    || (transcript.status === 'completed') !==
      (transcript.segments.length > 0)
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Visual Intelligence source transcript is not complete, GPU-routed, source-bound, and reread verified.',
      409,
    )
  }
  return { ...raw, transcript }
}

export function verifyCanonicalSourceLedProfessionalContentAnalysisInput(
  input: CanonicalSourceLedProfessionalContentAnalysisInput,
): CanonicalSourceLedProfessionalContentAnalysisInput {
  if (
    !safeId(input.workspaceId)
    || !safeId(input.projectId)
    || !safeId(input.editSessionId)
    || input.fps !== 30
    || !RAW_SHA256.test(input.planningDirectionDigestSha256)
    || !RAW_SHA256.test(input.userInstructionDigestSha256)
    || input.planningDirection !== input.planningDirection.trim()
    || input.planningDirection.length < 1
    || input.planningDirection.length > 8_000
    || rawDigestText(input.planningDirection) !==
      input.planningDirectionDigestSha256
    || input.sources.length < 1
    || input.sources.length > 8
  ) throw invalid('visual_intelligence_source_request_invalid')
  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  let ownerUserId: string | undefined
  input.sources.forEach((source, index) => {
    const authority = source.managedApiAuthority
    if (
      !safeId(source.sourceSequenceItemId)
      || !safeId(source.mediaAssetId)
      || source.uploadedOrder !== index + 1
      || sourceIds.has(source.sourceSequenceItemId)
      || mediaIds.has(source.mediaAssetId)
      || source.storageProvider !== 'google_cloud_storage'
      || !RAW_SHA256.test(source.checksumSha256)
      || !Number.isSafeInteger(source.byteLength)
      || source.byteLength < 1
      || !Number.isSafeInteger(source.durationFrames)
      || source.durationFrames < 1
      || !authority
      || !safeId(authority.ownerUserId)
      || (ownerUserId !== undefined && authority.ownerUserId !== ownerUserId)
      || authority.storageBucket !== source.storageBucket
      || authority.storagePath !== source.storagePath
      || authority.contentType !== 'video/mp4'
      || (authority.hasAudio !==
        (authority.audioProbe.disposition === 'verified_audio_stream'))
      || authority.frameCount !== source.durationFrames
      || !positiveInteger(authority.fpsNumerator)
      || !positiveInteger(authority.fpsDenominator)
      || !positiveInteger(authority.sourceTimeBaseNumerator)
      || !positiveInteger(authority.sourceTimeBaseDenominator)
      || !positiveInteger(authority.width)
      || !positiveInteger(authority.height)
      || !validRefSet([
        authority.finalizedMediaAuthorityRef,
        authority.finalizedStorageObjectAuthorityRef,
        authority.sourceProbeAuthorityRef,
      ])
    ) throw invalid(`visual_intelligence_source_${index + 1}_invalid`)
    sourceIds.add(source.sourceSequenceItemId)
    mediaIds.add(source.mediaAssetId)
    ownerUserId = authority.ownerUserId
  })
  return input
}

export function canonicalSourceLedProfessionalContentAnalysisSourceIdentity(
  source: CanonicalSourceLedProfessionalContentAnalysisSource,
): Record<string, unknown> {
  const authority = source.managedApiAuthority!
  return {
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    durationFrames: source.durationFrames,
    storageGeneration: authority.storageGeneration,
    storageEtag: authority.storageEtag,
    width: authority.width,
    height: authority.height,
    fpsNumerator: authority.fpsNumerator,
    fpsDenominator: authority.fpsDenominator,
    frameCount: authority.frameCount,
    sourceTimeBaseNumerator: authority.sourceTimeBaseNumerator,
    sourceTimeBaseDenominator: authority.sourceTimeBaseDenominator,
    finalizedMediaAuthorityRef: authority.finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef:
      authority.finalizedStorageObjectAuthorityRef,
    sourceProbeAuthorityRef: authority.sourceProbeAuthorityRef,
  }
}

export function stripCanonicalSourceLedContentAnalysisSelections(
  source: CanonicalSourceLedContentAnalysisEvidence['sources'][number],
): CanonicalSourceLedContentAnalysisSourceInput {
  const {
    selectedRanges: _selectedRanges,
    removedRanges: _removedRanges,
    embeddedEditInstructions: _embeddedEditInstructions,
    ...specialist
  } = source
  void _selectedRanges
  void _removedRanges
  void _embeddedEditInstructions
  return specialist
}

function validRef(ref: VisualIntelligenceEvidenceRef): boolean {
  return safeId(ref.id)
    && positiveInteger(ref.version)
    && PREFIXED_SHA256.test(ref.contentHash)
}

function validRefSet(refs: readonly VisualIntelligenceEvidenceRef[]): boolean {
  return refs.every(validRef)
    && new Set(refs.map(refKey)).size === refs.length
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function safeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID.test(value)
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0
}

function rawDigest(value: unknown): string {
  return rawDigestText(stableStringify(value))
}

function rawDigestText(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function invalid(code: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    `Canonical source Visual Intelligence validation failed: ${code}.`,
    409,
    { blockerCode: code },
  )
}
