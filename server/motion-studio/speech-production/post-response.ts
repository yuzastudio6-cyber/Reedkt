import { createHash } from 'node:crypto'

import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'
import { motionStudioSpeechSegmentRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import {
  persistCanonicalPrivateAudioArtifact,
  readCanonicalPrivateAudioArtifact,
} from '../../services/canonical-private-audio-artifact-storage'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
} from '../../tool-execution/media-binary-execution'
import {
  privateEmbeddedProcessResourceObservationSchema,
  type PrivateEmbeddedProcessResourceObservation,
} from '../../tool-execution/private-embedded-process-resource-observation'
import { parseMotionStudioPcmWave } from '../audio-production/pcm-wave'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC2ExecutionAuthority,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import {
  assertMotionStudioCompiledElevenLabsTimingRequestIntegrity,
  parseMotionStudioElevenLabsTimingResponse,
  type MotionStudioCompiledElevenLabsTimingRequest,
  type MotionStudioElevenLabsCharacterAlignment,
} from './live-request'
import {
  getMotionStudioSpeechC2TransportEvidenceClass,
  type MotionStudioSpeechC2SingleUseTransportPermit,
  type MotionStudioSpeechC2TransportResult,
} from './live-transport'
import {
  compileCanonicalMotionStudioSpeechNormalizationExecution,
} from './canonical-normalization-execution-adapter'

const SHA256 = /^[a-f0-9]{64}$/

export type MotionStudioSpeechC2PostResponseQaGate =
  | 'request_lineage'
  | 'source_integrity'
  | 'normalization_format'
  | 'non_silent'
  | 'sample_clipping'
  | 'alignment_integrity'
  | 'timing_fit'
  | 'consent_rights'
  | 'disclosure'
  | 'meaning_fidelity'
  | 'pronunciation'
  | 'voice_continuity'
  | 'loudness'

export interface MotionStudioSpeechC2WordTimingV1 {
  tokenId: string
  text: string
  characterStartIndex: number
  characterEndIndexExclusive: number
  startSeconds: number
  endSeconds: number
  startFrame: number
  endFrame: number
}

export interface MotionStudioSpeechC2PostResponseEvidenceV1 {
  schemaVersion: 'motion-studio.speech-c2-post-response-evidence.v1'
  evidenceClass: 'private_local_transport_fixture' | 'provider_single_submission_private_evidence'
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  candidateTakeId: string
  speechRequestId: string
  requestDigest: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  costBudgetId: string
  idempotencyKeyHash: string
  executionAuthorityId: string
  executionAuthorityDigest: string
  capabilitySnapshotId: string
  capabilitySnapshotDigest: string
  compiledRequestDigest: string
  transportPermitDigest: string
  transportOperationId: string
  transportResponseBodyDigest: string
  transportResponseCanonicalDigest: string
  providerRequestIdDigest?: string
  providerCharacterCostCredits?: number
  providerCharacterCostMicrocredits?: number
  providerCharacterCostEvidenceDigest?: string
  transportDispatchCount: 1
  externalProviderCallCount: 0 | 1
  source: {
    mimeType: 'audio/mpeg'
    byteLength: number
    sha256: string
    responseDigest: string
    persistedRawProviderBytes: false
  }
  normalizedArtifact: {
    privateObjectIdentityHash: string
    mimeType: 'audio/wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 1
    bitsPerSample: 16
    sampleCountPerChannel: number
    durationMilliseconds: number
    byteLength: number
    sha256: string
    runtimeImageIdentityDigest: string
    normalizationAttestationDigest: string
    resourceObservation: PrivateEmbeddedProcessResourceObservation
  }
  alignment: {
    source: 'elevenlabs_character_alignment'
    timingAuthorityDigest: string
    fps: 24 | 30
    segmentStartFrame: number
    segmentEndFrame: number
    spokenTextDigest: string
    providerCharacterAlignmentDigest: string
    providerNormalizedAlignmentDigest: string
    wordTimings: readonly MotionStudioSpeechC2WordTimingV1[]
    alignmentDigest: string
    captionMutationPerformed: false
    masterTimingMutationPerformed: false
  }
  qa: {
    rmsLinear: number
    samplePeakDbfs: number
    results: readonly {
      gate: MotionStudioSpeechC2PostResponseQaGate
      result: 'passed' | 'not_evaluated'
      blocking: true
      evidenceId: string
      note: string
    }[]
    qaEvidenceDigest: string
    selectionEligible: false
    finalMixEligible: false
  }
  reconciliation: {
    state: 'required_before_review_or_selection'
    method: 'account_usage_delta_required'
    accountUsageBaselineEvidenceId: string
    providerRateCardSnapshotId: string
    providerResponseUsagePresent: false
    providerCharacterCostHeaderPresent: boolean
    providerCharacterCostCredits?: number
    providerCharacterCostMicrocredits?: number
    providerCharacterCostEvidenceDigest?: string
    providerCostReconciliationRequired: true
    localComputeCostReconciliationRequired: true
    customerPricingIncluded: false
    customerCreditsIncluded: false
    billingMutationPerformed: false
  }
  selection: {
    state: 'ineligible_pending_reconciliation_and_semantic_qa'
    selected: false
    firstTakeAutoAccepted: false
    ownerReviewRecorded: false
    finalAssetEligible: false
    finalNarrationMutationPerformed: false
    timelineMutationPerformed: false
  }
  persistence: {
    privateLocalOnly: true
    evidenceObjectIdentityHash: string
    rawProviderResponsePersisted: false
    rawProviderAudioPersisted: false
    normalizedAudioPersisted: true
  }
  readiness: {
    privateReviewEvidenceReady: false
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalDeliveryReady: false
  }
  createdAt: string
  immutable: true
  evidenceDigest: string
}

export async function processMotionStudioSpeechC2Response(input: {
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  compiledRequest: MotionStudioCompiledElevenLabsTimingRequest
  transportPermit: MotionStudioSpeechC2SingleUseTransportPermit
  transportResult: MotionStudioSpeechC2TransportResult
  fps: 24 | 30
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioSpeechC2PostResponseEvidenceV1> {
  const request = motionStudioSpeechSegmentRequestV1Schema.parse(input.request)
  const authority = assertMotionStudioSpeechC2ExecutionAuthority(
    input.executionAuthority,
    request,
    input.capabilitySnapshot,
  )
  assertMotionStudioCompiledElevenLabsTimingRequestIntegrity(input.compiledRequest)
  assertTransportLineage(input.compiledRequest, authority, input.transportPermit, input.transportResult)
  const evidenceClass = getMotionStudioSpeechC2TransportEvidenceClass(input.transportResult)
  if (input.transportResult.status !== 'response_received') {
    blocked('Speech post-response processing requires one recognized provider response.')
  }
  if (![24, 30].includes(input.fps)) invalid('Speech alignment requires an approved 24/1 or 30/1 timing base.')
  const createdAt = exactIso(input.createdAt)
  const parsed = parseMotionStudioElevenLabsTimingResponse({
    value: input.transportResult.responseBody,
    expectedSpokenText: request.spokenText,
  })
  const providerCharacterCostCredits = input.transportResult.providerCharacterCostCredits
  const providerCharacterCostMicrocredits = input.transportResult.providerCharacterCostMicrocredits
  const providerCharacterCostEvidenceDigest = providerCharacterCostCredits === undefined
    ? undefined
    : sha256CanonicalJson({
        compiledRequestDigest: input.compiledRequest.compiledRequestDigest,
        transportPermitDigest: input.transportPermit.permitDigest,
        providerCharacterCostCredits,
        providerCharacterCostMicrocredits,
      })

  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
    runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
    !runtimeAuthority.supportedOperations.some((entry) =>
      entry.toolId === 'ffmpeg' &&
      entry.operationId === OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg) ||
    !runtimeAuthority.supportedRecipeProfiles.includes(
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID)
  ) blocked('Pinned private speech normalization runtime authority is unavailable.')
  const runtime = await openPrivateOfflineMediaBinaryRuntime()
  if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
    blocked('Pinned speech normalization runtime changed after authority verification.')
  }
  const spokenTextDigest = sha256Text(request.spokenText)
  const alignmentContentSha256 = sha256CanonicalJson({
    domain: 'motion-studio:speech-c2-provider-alignment:v1',
    responseDigest: parsed.responseDigest,
    sourceAudioSha256: parsed.audioSha256,
    spokenTextDigest,
    alignment: parsed.alignment,
    normalizedAlignment: parsed.normalizedAlignment,
  })
  const normalization =
    compileCanonicalMotionStudioSpeechNormalizationExecution({
      productionId: request.productionId,
      productionAuthorityDigest: authority.authorityDigest,
      providerOutputAuthorityDigest:
        input.transportResult.parsedResponseCanonicalDigest,
      preparedScriptSegmentId: request.preparedScriptSegmentId,
      sceneId: request.sceneId,
      voiceBibleVersionId: request.voiceBibleArtifactVersion.versionId,
      voiceBibleContentDigest: request.voiceBibleContentDigest,
      spokenTextDigest,
      timingAuthorityDigest: request.timingAuthorityDigest,
      startFrame: request.range.startFrame,
      endFrameExclusive: request.range.endFrame,
      frameRate: input.fps,
      sourceAudio: {
        mimeType: parsed.mimeType,
        bytes: parsed.audioBytes,
        byteLength: parsed.audioByteLength,
        sha256: parsed.audioSha256,
      },
      alignmentBinding: {
        contentSha256: alignmentContentSha256,
        sourceAudioSha256: parsed.audioSha256,
        preparedScriptSegmentId: request.preparedScriptSegmentId,
        voiceBibleContentDigest: request.voiceBibleContentDigest,
        spokenTextDigest,
        timingAuthorityDigest: request.timingAuthorityDigest,
      },
    })
  const normalized = await runtime.executeServerInjected(
    normalization.request,
    normalization.source,
  )
  const wave = parseMotionStudioPcmWave(normalized.resultArtifact.bytes)
  if (
    normalized.resultArtifact.mimeType !== 'audio/wav' ||
    wave.channelCount !== 1 || wave.sampleRateHertz !== 48_000 ||
    wave.sampleCountPerChannel !== normalized.resultArtifact.sampleCountPerChannel ||
    wave.durationMilliseconds !== normalized.resultArtifact.durationMilliseconds ||
    normalized.evidence.sourceSha256 !== parsed.audioSha256 ||
    normalized.evidence.resultSha256 !== normalized.resultArtifact.sha256 ||
    normalized.evidence.semanticEvidence.recipeProfileId !==
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID ||
    normalized.evidence.semanticEvidence.sourceAuthorityDigest !==
      normalization.sourceAuthorityDigest ||
    normalized.evidence.semanticEvidence.productionAuthorityHash !==
      normalization.productionAuthorityHash
  ) blocked('Normalized speech bytes diverged from exact runtime evidence.')

  const alignment = deriveWordTimings({
    request,
    alignment: parsed.alignment,
    normalizedAlignment: parsed.normalizedAlignment,
    audioDurationMilliseconds: wave.durationMilliseconds,
    fps: input.fps,
  })
  const audioMetrics = analyzePcm(wave.interleavedSamples)
  if (audioMetrics.rmsLinear <= 0.000_01) blocked('Normalized speech is silent or below the fixed signal floor.')
  if (audioMetrics.samplePeakDbfs > -0.01) blocked('Normalized speech is clipped or exceeds the fixed sample-peak ceiling.')

  const privateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_private_speech_take_v1',
    workspaceId: request.workspaceId,
    productionId: request.productionId,
    speechRequestId: request.speechRequestId,
    attemptId: request.attemptId,
    normalizedSha256: normalized.resultArtifact.sha256,
  })
  await persistCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash,
    bytes: normalized.resultArtifact.bytes,
    expectedSha256: normalized.resultArtifact.sha256,
  })
  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== normalized.resultArtifact.sha256 ||
    stored.byteLength !== normalized.resultArtifact.byteLength
  ) blocked('Private normalized speech bytes changed after create-only persistence.')

  const passedGates = [
    'request_lineage', 'source_integrity', 'normalization_format', 'non_silent',
    'sample_clipping', 'alignment_integrity', 'timing_fit', 'consent_rights', 'disclosure',
  ] as const satisfies readonly MotionStudioSpeechC2PostResponseQaGate[]
  const notEvaluatedGates = [
    'meaning_fidelity', 'pronunciation', 'voice_continuity', 'loudness',
  ] as const satisfies readonly MotionStudioSpeechC2PostResponseQaGate[]
  const qaResults = [
    ...passedGates.map((gate) => ({
      gate,
      result: 'passed' as const,
      blocking: true as const,
      evidenceId: evidenceId(gate, normalized.attestation.attestationHash, alignment.alignmentDigest),
      note: passedGateNote(gate),
    })),
    ...notEvaluatedGates.map((gate) => ({
      gate,
      result: 'not_evaluated' as const,
      blocking: true as const,
      evidenceId: evidenceId(gate, normalized.attestation.attestationHash, alignment.alignmentDigest),
      note: 'Requires semantic or listening review before any take selection.',
    })),
  ]
  const qaEvidenceDigest = sha256CanonicalJson({
    rmsLinear: audioMetrics.rmsLinear,
    samplePeakDbfs: audioMetrics.samplePeakDbfs,
    results: qaResults,
  })
  const candidateTakeId = `speech-candidate-${sha256CanonicalJson({
    speechRequestId: request.speechRequestId,
    attemptId: request.attemptId,
    normalizedSha256: normalized.resultArtifact.sha256,
  }).slice(0, 48)}`
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_speech_c2_post_response_evidence_v1',
    candidateTakeId,
    attemptId: request.attemptId,
    normalizedSha256: normalized.resultArtifact.sha256,
  })
  const base: Omit<MotionStudioSpeechC2PostResponseEvidenceV1, 'evidenceDigest'> = {
    schemaVersion: 'motion-studio.speech-c2-post-response-evidence.v1',
    evidenceClass,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    candidateTakeId,
    speechRequestId: request.speechRequestId,
    requestDigest: authority.speechRequestDigest,
    approvedSnapshotId: request.approvedSnapshotId,
    approvedSnapshotDigest: request.approvedSnapshotDigest,
    approvedWorkItemId: request.approvedWorkItemId,
    jobId: request.jobId,
    attemptId: request.attemptId,
    leaseId: request.leaseId,
    costBudgetId: request.costBudgetId,
    idempotencyKeyHash: request.idempotencyKeyHash,
    executionAuthorityId: authority.authorityId,
    executionAuthorityDigest: authority.authorityDigest,
    capabilitySnapshotId: authority.capabilitySnapshotId,
    capabilitySnapshotDigest: authority.capabilitySnapshotDigest,
    compiledRequestDigest: input.compiledRequest.compiledRequestDigest,
    transportPermitDigest: input.transportPermit.permitDigest,
    transportOperationId: input.transportPermit.operationId,
    transportResponseBodyDigest: input.transportResult.responseBodyDigest,
    transportResponseCanonicalDigest: input.transportResult.parsedResponseCanonicalDigest,
    ...(input.transportResult.providerRequestIdDigest
      ? { providerRequestIdDigest: input.transportResult.providerRequestIdDigest }
      : {}),
    ...(providerCharacterCostCredits !== undefined ? { providerCharacterCostCredits } : {}),
    ...(providerCharacterCostMicrocredits !== undefined ? { providerCharacterCostMicrocredits } : {}),
    ...(providerCharacterCostEvidenceDigest ? { providerCharacterCostEvidenceDigest } : {}),
    transportDispatchCount: 1,
    externalProviderCallCount: evidenceClass === 'provider_single_submission_private_evidence' ? 1 : 0,
    source: {
      mimeType: 'audio/mpeg',
      byteLength: parsed.audioByteLength,
      sha256: parsed.audioSha256,
      responseDigest: parsed.responseDigest,
      persistedRawProviderBytes: false,
    },
    normalizedArtifact: {
      privateObjectIdentityHash,
      mimeType: 'audio/wav',
      codec: 'pcm_s16le',
      sampleRateHertz: 48_000,
      channelCount: 1,
      bitsPerSample: 16,
      sampleCountPerChannel: wave.sampleCountPerChannel,
      durationMilliseconds: wave.durationMilliseconds,
      byteLength: normalized.resultArtifact.byteLength,
      sha256: normalized.resultArtifact.sha256,
      runtimeImageIdentityDigest: normalized.image.imageIdentityHash,
      normalizationAttestationDigest: normalized.attestation.attestationHash,
      resourceObservation: normalized.evidence.resourceObservation,
    },
    alignment,
    qa: {
      rmsLinear: audioMetrics.rmsLinear,
      samplePeakDbfs: audioMetrics.samplePeakDbfs,
      results: qaResults,
      qaEvidenceDigest,
      selectionEligible: false,
      finalMixEligible: false,
    },
    reconciliation: {
      state: 'required_before_review_or_selection',
      method: authority.costReconciliationMethod,
      accountUsageBaselineEvidenceId: authority.accountUsageBaselineEvidenceId,
      providerRateCardSnapshotId: authority.providerRateCardSnapshotId,
      providerResponseUsagePresent: false,
      providerCharacterCostHeaderPresent: providerCharacterCostCredits !== undefined,
      ...(providerCharacterCostCredits !== undefined ? { providerCharacterCostCredits } : {}),
      ...(providerCharacterCostMicrocredits !== undefined ? { providerCharacterCostMicrocredits } : {}),
      ...(providerCharacterCostEvidenceDigest ? { providerCharacterCostEvidenceDigest } : {}),
      providerCostReconciliationRequired: true,
      localComputeCostReconciliationRequired: true,
      customerPricingIncluded: false,
      customerCreditsIncluded: false,
      billingMutationPerformed: false,
    },
    selection: {
      state: 'ineligible_pending_reconciliation_and_semantic_qa',
      selected: false,
      firstTakeAutoAccepted: false,
      ownerReviewRecorded: false,
      finalAssetEligible: false,
      finalNarrationMutationPerformed: false,
      timelineMutationPerformed: false,
    },
    persistence: {
      privateLocalOnly: true,
      evidenceObjectIdentityHash,
      rawProviderResponsePersisted: false,
      rawProviderAudioPersisted: false,
      normalizedAudioPersisted: true,
    },
    readiness: {
      privateReviewEvidenceReady: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      finalDeliveryReady: false,
    },
    createdAt,
    immutable: true,
  }
  const evidence = deepFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) })
  await persistEvidence(input.localStorageRoot, evidence)
  return evidence
}

export async function readMotionStudioSpeechC2PostResponseEvidence(input: {
  localStorageRoot: string
  evidenceObjectIdentityHash: string
}): Promise<MotionStudioSpeechC2PostResponseEvidenceV1 | undefined> {
  if (!SHA256.test(input.evidenceObjectIdentityHash)) invalid('Private speech evidence identity is invalid.')
  const relativePath = evidenceRelativePath(input.evidenceObjectIdentityHash)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 256 || bytes.byteLength > 2 * 1024 * 1024) {
    blocked('Private speech evidence is outside its bounded record size.')
  }
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) } catch {
    blocked('Private speech evidence is invalid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    blocked('Private speech evidence envelope is invalid.')
  }
  const envelope = parsed as Record<string, unknown>
  if (
    Object.keys(envelope).sort().join('|') !== 'checksumSha256|evidence|recordVersion' ||
    envelope.recordVersion !== 'motion-studio-speech-c2-post-response-evidence-record-v1' ||
    typeof envelope.checksumSha256 !== 'string' || !SHA256.test(envelope.checksumSha256) ||
    !envelope.evidence || typeof envelope.evidence !== 'object' || Array.isArray(envelope.evidence)
  ) blocked('Private speech evidence envelope fields are invalid.')
  const evidence = envelope.evidence as MotionStudioSpeechC2PostResponseEvidenceV1
  const { evidenceDigest, ...base } = evidence
  const observation = evidence.normalizedArtifact?.resourceObservation
  const observedPeakMemoryBytes = observation
    ? Math.max(
        observation.start.memoryPeakBytes,
        observation.finish.memoryPeakBytes,
        observation.finish.memoryCurrentBytes,
      )
    : 0
  if (
    evidence.schemaVersion !== 'motion-studio.speech-c2-post-response-evidence.v1' ||
    evidence.immutable !== true || evidenceDigest !== envelope.checksumSha256 ||
    sha256CanonicalJson(base) !== evidenceDigest ||
    evidence.persistence?.evidenceObjectIdentityHash !== input.evidenceObjectIdentityHash ||
    evidence.persistence.privateLocalOnly !== true || evidence.persistence.normalizedAudioPersisted !== true ||
    evidence.selection?.selected !== false || evidence.selection.finalAssetEligible !== false ||
    evidence.selection.timelineMutationPerformed !== false || evidence.readiness?.productReady !== false ||
    !observation ||
    observation.observerKind !== 'media_container_cgroup_v2_attempt_aggregate_v1' ||
    observation.measurementAgentVersion !== 'embedded_media_cgroup_v2_attempt_aggregate_v1' ||
    observation.finish.cpuUsageNanoseconds <= observation.start.cpuUsageNanoseconds ||
    observedPeakMemoryBytes <= 0 || observedPeakMemoryBytes > 2_147_483_648 ||
    !privateEmbeddedProcessResourceObservationSchema.safeParse(observation).success
  ) blocked('Private speech evidence failed its immutable boundary.')
  const storedAudio = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: evidence.normalizedArtifact.privateObjectIdentityHash,
  })
  if (
    !storedAudio || storedAudio.sha256 !== evidence.normalizedArtifact.sha256 ||
    storedAudio.byteLength !== evidence.normalizedArtifact.byteLength
  ) blocked('Private speech evidence lost its exact normalized audio artifact.')
  return deepFreeze(evidence)
}

function assertTransportLineage(
  compiled: MotionStudioCompiledElevenLabsTimingRequest,
  authority: MotionStudioSpeechC2ExecutionAuthorityV1,
  permit: MotionStudioSpeechC2SingleUseTransportPermit,
  result: MotionStudioSpeechC2TransportResult,
): void {
  const { permitDigest, ...permitBase } = permit
  if (
    !SHA256.test(permitDigest) || sha256CanonicalJson(permitBase) !== permitDigest ||
    permit.compiledRequestDigest !== compiled.compiledRequestDigest ||
    permit.executionAuthorityId !== authority.authorityId ||
    permit.executionAuthorityDigest !== authority.authorityDigest ||
    permit.credentialReferenceId !== authority.credentialReferenceId ||
    result.compiledRequestDigest !== compiled.compiledRequestDigest ||
    result.executionAuthorityDigest !== authority.authorityDigest ||
    result.transportPermitDigest !== permit.permitDigest ||
    result.operationId !== permit.operationId || result.networkCallCount !== 1 ||
    result.permitConsumed !== true
  ) blocked('Speech transport result does not bind the exact request, authority, permit, and attempt.')
  if (result.status === 'response_received' && (
    result.httpStatus < 200 || result.httpStatus >= 300 ||
    result.safeToLogResponseBody !== false || result.safeToPersistRawResponseBody !== false ||
    !SHA256.test(result.responseBodyDigest) || !SHA256.test(result.parsedResponseCanonicalDigest) ||
    sha256CanonicalJson(result.responseBody) !== result.parsedResponseCanonicalDigest
  )) blocked('Speech transport response receipt is outside the private recognized-response contract.')
  if (
    result.status !== 'outcome_unknown' && (
      (result.providerCharacterCostCredits === undefined) !==
        (result.providerCharacterCostMicrocredits === undefined) ||
      (result.providerCharacterCostMicrocredits !== undefined && (
        !Number.isSafeInteger(result.providerCharacterCostMicrocredits) ||
        result.providerCharacterCostMicrocredits < 0 ||
        result.providerCharacterCostMicrocredits > 1_000_000_000_000_000 ||
        result.providerCharacterCostCredits !== result.providerCharacterCostMicrocredits / 1_000_000
      ))
    )
  ) blocked('Speech transport character-cost evidence is outside its exact microcredit bound.')
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(deepFreeze)
  else Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
}

function deriveWordTimings(input: {
  request: MotionStudioSpeechSegmentRequestV1
  alignment: MotionStudioElevenLabsCharacterAlignment
  normalizedAlignment: MotionStudioElevenLabsCharacterAlignment
  audioDurationMilliseconds: number
  fps: 24 | 30
}): MotionStudioSpeechC2PostResponseEvidenceV1['alignment'] {
  const characters = input.alignment.characters
  if (characters.join('') !== input.request.spokenText) blocked('Speech alignment changed after response parsing.')
  const maximumAlignmentEnd = Math.max(...input.alignment.characterEndTimesSeconds)
  const audioDurationSeconds = input.audioDurationMilliseconds / 1_000
  const segmentFrameCount = input.request.range.endFrame - input.request.range.startFrame
  if (
    maximumAlignmentEnd > audioDurationSeconds + 0.15 ||
    Math.ceil(audioDurationSeconds * input.fps) > segmentFrameCount + 1
  ) blocked('Speech audio or provider alignment exceeds the approved segment timing authority.')

  const wordTimings: MotionStudioSpeechC2WordTimingV1[] = []
  let index = 0
  let previousEndFrame = input.request.range.startFrame
  while (index < characters.length) {
    while (index < characters.length && /^\s+$/u.test(characters[index]!)) index += 1
    if (index >= characters.length) break
    const startIndex = index
    while (index < characters.length && !/^\s+$/u.test(characters[index]!)) index += 1
    const endIndex = index
    const startSeconds = input.alignment.characterStartTimesSeconds[startIndex]!
    const endSeconds = input.alignment.characterEndTimesSeconds[endIndex - 1]!
    const startFrame = Math.max(
      previousEndFrame,
      input.request.range.startFrame + Math.floor(startSeconds * input.fps),
    )
    const endFrame = Math.max(
      startFrame + 1,
      input.request.range.startFrame + Math.ceil(endSeconds * input.fps),
    )
    if (endFrame > input.request.range.endFrame) {
      blocked('Derived speech word timing exceeds the approved segment frame range.')
    }
    const text = characters.slice(startIndex, endIndex).join('')
    wordTimings.push({
      tokenId: `speech-word-${sha256CanonicalJson({
        speechRequestId: input.request.speechRequestId,
        startIndex,
        endIndex,
        text,
      }).slice(0, 48)}`,
      text,
      characterStartIndex: startIndex,
      characterEndIndexExclusive: endIndex,
      startSeconds: rounded(startSeconds),
      endSeconds: rounded(endSeconds),
      startFrame,
      endFrame,
    })
    previousEndFrame = endFrame
  }
  if (!wordTimings.length) blocked('Speech response did not produce any aligned words.')
  const providerCharacterAlignmentDigest = sha256CanonicalJson(input.alignment)
  const providerNormalizedAlignmentDigest = sha256CanonicalJson(input.normalizedAlignment)
  const alignmentBase = {
    source: 'elevenlabs_character_alignment' as const,
    timingAuthorityDigest: input.request.timingAuthorityDigest,
    fps: input.fps,
    segmentStartFrame: input.request.range.startFrame,
    segmentEndFrame: input.request.range.endFrame,
    spokenTextDigest: sha256Text(input.request.spokenText),
    providerCharacterAlignmentDigest,
    providerNormalizedAlignmentDigest,
    wordTimings,
    captionMutationPerformed: false as const,
    masterTimingMutationPerformed: false as const,
  }
  return {
    ...alignmentBase,
    alignmentDigest: sha256CanonicalJson(alignmentBase),
  }
}

function analyzePcm(samples: Int16Array): { rmsLinear: number; samplePeakDbfs: number } {
  let sumSquares = 0
  let peak = 0
  for (const sample of samples) {
    const linear = sample / 32_768
    sumSquares += linear * linear
    peak = Math.max(peak, Math.abs(linear))
  }
  return {
    rmsLinear: rounded(Math.sqrt(sumSquares / samples.length)),
    samplePeakDbfs: rounded(20 * Math.log10(Math.max(peak, Number.EPSILON))),
  }
}

async function persistEvidence(
  root: string,
  evidence: MotionStudioSpeechC2PostResponseEvidenceV1,
): Promise<void> {
  const envelope = Buffer.from(`${JSON.stringify({
    recordVersion: 'motion-studio-speech-c2-post-response-evidence-record-v1',
    evidence,
    checksumSha256: evidence.evidenceDigest,
  })}\n`, 'utf8')
  const relativePath = evidenceRelativePath(evidence.persistence.evidenceObjectIdentityHash)
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: envelope })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored || !stored.equals(envelope)) blocked('Private speech evidence changed during create-only persistence.')
}

function evidenceRelativePath(identity: string): string {
  return `motion-studio-speech-c2/private-v1/${identity.slice(0, 2)}/${identity}.json`
}

function passedGateNote(gate: MotionStudioSpeechC2PostResponseQaGate): string {
  const notes: Record<string, string> = {
    request_lineage: 'Exact approved request, authority, permit, and transport receipt are bound.',
    source_integrity: 'Recognized MP3 bytes match the parsed provider response digest.',
    normalization_format: 'Confined FFmpeg produced exact 48 kHz mono signed-PCM WAV.',
    non_silent: 'PCM signal exceeds the fixed non-silence floor without clipping.',
    sample_clipping: 'PCM sample peak remains below the fixed clipping ceiling.',
    alignment_integrity: 'Character alignment binds the exact approved spoken text and derived words.',
    timing_fit: 'Audio and derived word frames remain within the approved segment range.',
    consent_rights: 'Execution authority binds a verified provider catalog voice and rights evidence.',
    disclosure: 'The approved AI-generated-voice disclosure remains bound to the candidate.',
  }
  return notes[gate] ?? 'Structural post-response gate passed.'
}

function evidenceId(gate: string, attestation: string, alignment: string): string {
  return `speech-evidence-${sha256CanonicalJson({ gate, attestation, alignment }).slice(0, 48)}`
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
}

function exactIso(value: string): string {
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    invalid('Speech post-response evidence time must be exact ISO-8601.')
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_speech_c2_post_response_evidence',
  })
}
