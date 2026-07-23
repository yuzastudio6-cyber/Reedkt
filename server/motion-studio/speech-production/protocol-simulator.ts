import { createHash } from 'node:crypto'

import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechProtocolBundleV1,
  MotionStudioSpeechProtocolCandidateV1,
  MotionStudioSpeechSegmentRequestV1,
  MotionStudioSpeechWorkspaceDto,
} from '../../../src/types/motion-studio'
import {
  motionStudioSpeechProtocolBundleV1Schema,
  motionStudioSpeechSegmentRequestV1Schema,
  motionStudioSpeechWorkspaceDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { encodeMotionStudioPcmWave, parseMotionStudioPcmWave } from '../audio-production/pcm-wave'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { compileMotionStudioSpeechProtocolRequest } from './request-compiler'

const QA_GATES = [
  'request_integrity', 'file_integrity', 'format', 'non_silent',
  'meaning_fidelity', 'consent_rights', 'disclosure', 'no_auto_selection',
] as const
const NOT_EVALUATED_GATES = new Set(['meaning_fidelity', 'consent_rights'] as const)

export function executeMotionStudioSpeechProtocolSimulator(input: {
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  createdAt: string
}): MotionStudioSpeechProtocolBundleV1 {
  const requestResult = motionStudioSpeechSegmentRequestV1Schema.safeParse(input.request)
  if (!requestResult.success) {
    throw new ApiError('VALIDATION_FAILED', 'Speech protocol request is invalid.', 400, requestResult.error.flatten())
  }
  const request = requestResult.data
  const envelope = compileMotionStudioSpeechProtocolRequest({
    request,
    capabilitySnapshot: input.capabilitySnapshot,
  })
  if (!Number.isFinite(Date.parse(input.createdAt))) {
    throw new ApiError('VALIDATION_FAILED', 'Speech protocol execution requires an exact timestamp.', 400)
  }

  const outputBytes = buildDeterministicProtocolWave(envelope.requestDigest, request.spokenText)
  const parsed = parseMotionStudioPcmWave(outputBytes)
  if (parsed.channelCount !== 1) throw blocked('Speech protocol simulator must produce exact mono PCM authority.')
  let peak = 0
  for (const sample of parsed.interleavedSamples) peak = Math.max(peak, Math.abs(sample))
  if (peak === 0) throw blocked('Speech protocol simulator cannot create silent evidence.')

  const audioSha256 = sha256Bytes(outputBytes)
  const id = (label: string) => deterministicUuid(envelope.requestDigest, label)
  const qaGateResults = QA_GATES.map((gate) => ({
    gate,
    result: NOT_EVALUATED_GATES.has(gate as 'meaning_fidelity' | 'consent_rights')
      ? 'not_evaluated' as const
      : 'passed' as const,
    blocking: true as const,
    evidenceId: id(`qa:${gate}`),
  }))
  const candidateBase = {
    ...scope(request),
    schemaVersion: 'motion-studio.speech-protocol-candidate.v1' as const,
    candidateTakeId: id('candidate-take'),
    speechRequestId: request.speechRequestId,
    requestDigest: envelope.requestDigest,
    voiceSegmentId: request.voiceSegmentId,
    approvedSnapshotId: request.approvedSnapshotId,
    approvedWorkItemId: request.approvedWorkItemId,
    jobId: request.jobId,
    attemptId: request.attemptId,
    leaseId: request.leaseId,
    costBudgetId: request.costBudgetId,
    idempotencyKeyHash: request.idempotencyKeyHash,
    attemptNumber: 1 as const,
    modelId: envelope.route.selectedModelId,
    voiceBindingId: request.voice.voiceBindingId,
    source: 'protocol_simulator_fixture' as const,
    audioAssetVersion: {
      assetId: id('audio-asset'),
      assetVersionId: id('audio-asset-version'),
      contentDigest: audioSha256,
      provenanceRecordId: id('provenance'),
      rightsEvidenceIds: [request.voice.rightsEvidenceId],
    },
    byteLength: outputBytes.byteLength,
    audioSha256,
    mimeType: 'audio/wav' as const,
    codec: 'pcm_s16le' as const,
    sampleRateHertz: 48_000 as const,
    channelCount: 1 as const,
    sampleCountPerChannel: parsed.sampleCountPerChannel,
    durationMilliseconds: parsed.durationMilliseconds,
    qaGateResults,
    reviewStatus: 'not_reviewable_protocol' as const,
    selected: false as const,
    firstTakeAutoAccepted: false as const,
    finalAssetEligible: false as const,
    privateEvidenceOnly: true as const,
    providerExecutionPerformed: false as const,
    providerCallCount: 0 as const,
    providerCostMicros: 0 as const,
    internalProductionCostMicros: 0 as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    timelineMutationPerformed: false as const,
    createdAt: new Date(input.createdAt).toISOString(),
    immutable: true as const,
  }
  const candidate: MotionStudioSpeechProtocolCandidateV1 = {
    ...candidateBase,
    qaEvidenceDigest: sha256CanonicalJson({
      requestDigest: envelope.requestDigest,
      audioSha256,
      sampleCountPerChannel: parsed.sampleCountPerChannel,
      peak,
      qaGateResults,
    }),
  }
  const createdAt = new Date(input.createdAt).toISOString()
  const attempt = {
    ...scope(request),
    schemaVersion: 'motion-studio.speech-protocol-attempt.v1' as const,
    speechRequestId: request.speechRequestId,
    requestDigest: envelope.requestDigest,
    approvedSnapshotId: request.approvedSnapshotId,
    approvedWorkItemId: request.approvedWorkItemId,
    jobId: request.jobId,
    attemptId: request.attemptId,
    leaseId: request.leaseId,
    costBudgetId: request.costBudgetId,
    idempotencyKeyHash: request.idempotencyKeyHash,
    attemptNumber: 1 as const,
    state: 'protocol_completed' as const,
    executionClass: 'protocol_simulator' as const,
    outcome: 'protocol_fixture_created' as const,
    providerSubmissionPerformed: false as const,
    providerOperationIdentityPresent: false as const,
    externalRequestCount: 0 as const,
    automaticRetry: false as const,
    fallbackPerformed: false as const,
    outcomeUnknown: false as const,
    startedAt: createdAt,
    completedAt: createdAt,
    immutable: true as const,
  }
  const usage = {
    ...scope(request),
    schemaVersion: 'motion-studio.speech-protocol-usage.v1' as const,
    usageRecordId: id('usage-record'),
    speechRequestId: request.speechRequestId,
    requestDigest: envelope.requestDigest,
    attemptId: request.attemptId,
    candidateTakeId: candidate.candidateTakeId,
    costBudgetId: request.costBudgetId,
    rateCardSnapshotId: id('protocol-zero-rate-card'),
    meteringClass: 'protocol_zero_cost' as const,
    outputByteLength: candidate.byteLength,
    outputDurationMilliseconds: candidate.durationMilliseconds,
    providerUsageUnits: 0 as const,
    providerCostMicros: 0 as const,
    localComputeCostMicros: 0 as const,
    internalProductionCostMicros: 0 as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    billingMutationPerformed: false as const,
    createdAt,
    immutable: true as const,
  }
  const alignment = {
    ...scope(request),
    schemaVersion: 'motion-studio.speech-protocol-alignment.v1' as const,
    alignmentRecordId: id('alignment-record'),
    speechRequestId: request.speechRequestId,
    requestDigest: envelope.requestDigest,
    candidateTakeId: candidate.candidateTakeId,
    audioSha256: candidate.audioSha256,
    timingAuthorityDigest: request.timingAuthorityDigest,
    state: 'not_evaluated_protocol' as const,
    source: 'none' as const,
    wordTimings: [] as const,
    blockingForSelection: true as const,
    captionMutationPerformed: false as const,
    masterTimingMutationPerformed: false as const,
    createdAt,
    immutable: true as const,
  }
  const selectionState = {
    ...scope(request),
    schemaVersion: 'motion-studio.speech-protocol-selection-state.v1' as const,
    selectionStateId: id('selection-state'),
    speechRequestId: request.speechRequestId,
    candidateTakeId: candidate.candidateTakeId,
    qaEvidenceDigest: candidate.qaEvidenceDigest,
    alignmentRecordId: alignment.alignmentRecordId,
    state: 'ineligible_protocol' as const,
    blockers: [
      'protocol_fixture', 'meaning_not_evaluated',
      'rights_not_evaluated', 'alignment_not_evaluated',
    ] as const,
    ownerReviewRecorded: false as const,
    selectionDecisionCreated: false as const,
    selected: false as const,
    finalNarrationMutationPerformed: false as const,
    timelineMutationPerformed: false as const,
    createdAt,
    immutable: true as const,
  }
  const bundle: MotionStudioSpeechProtocolBundleV1 = {
    ...scope(request),
    schemaVersion: 'motion-studio.speech-protocol-bundle.v1',
    capabilitySnapshot: input.capabilitySnapshot,
    request,
    envelope,
    attempt,
    candidate,
    usage,
    alignment,
    selectionState,
    outputBytes,
    protocolOnly: true,
    externalRequestCount: 0,
    providerCostMicros: 0,
    timelineMutationPerformed: false,
  }
  const result = motionStudioSpeechProtocolBundleV1Schema.safeParse(bundle)
  if (!result.success) {
    throw new ApiError('INTERNAL_ERROR', 'Speech protocol simulator produced invalid authority.', 500, result.error.flatten(), { internal: true })
  }
  assertMotionStudioSpeechProtocolEvidence(result.data)
  return result.data
}

export function toMotionStudioSpeechProtocolWorkspaceDto(
  bundle: MotionStudioSpeechProtocolBundleV1,
): MotionStudioSpeechWorkspaceDto {
  const parsed = motionStudioSpeechProtocolBundleV1Schema.safeParse(bundle)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Speech protocol authority is invalid.', 400, parsed.error.flatten())
  }
  assertMotionStudioSpeechProtocolEvidence(parsed.data)
  return motionStudioSpeechWorkspaceDtoSchema.parse({
    productionId: parsed.data.productionId,
    state: 'protocol_evidence_ready',
    currentModelSetting: 'auto',
    capabilityState: 'external_discovery_required',
    candidates: [{
      candidateTakeId: parsed.data.candidate.candidateTakeId,
      voiceSegmentId: parsed.data.candidate.voiceSegmentId,
      intendedModelRole: parsed.data.envelope.route.intendedRole,
      source: 'protocol_simulator_fixture',
      state: 'protocol_fixture_only',
      attemptState: parsed.data.attempt.state,
      usageState: parsed.data.usage.meteringClass,
      alignmentState: parsed.data.alignment.state,
      selectionState: parsed.data.selectionState.state,
      durationMilliseconds: parsed.data.candidate.durationMilliseconds,
      reviewStatus: 'not_reviewable_protocol',
      selected: false,
      firstTakeAutoAccepted: false,
      qaGatesPassed: parsed.data.candidate.qaGateResults
        .filter((entry) => entry.result === 'passed')
        .map((entry) => entry.gate),
      qaGatesNotEvaluated: parsed.data.candidate.qaGateResults
        .filter((entry) => entry.result === 'not_evaluated')
        .map((entry) => entry.gate),
      providerExecutionPerformed: false,
      privateEvidenceOnly: true,
    }],
    cloningEnabled: false,
    dubbingEnabled: false,
    providerExecutionEnabled: false,
    warning: 'Protocol evidence only. This tone is not a narration take and cannot be reviewed or selected; provider capability discovery and external speech execution remain disabled.',
  })
}

function assertMotionStudioSpeechProtocolEvidence(bundle: MotionStudioSpeechProtocolBundleV1): void {
  if (sha256CanonicalJson(bundle.request) !== bundle.envelope.requestDigest) {
    throw blocked('Speech protocol request digest does not match the immutable request authority.')
  }
  const capabilityEvidence: Record<string, unknown> = { ...bundle.capabilitySnapshot }
  delete capabilityEvidence.evidenceDigest
  if (sha256CanonicalJson(capabilityEvidence) !== bundle.capabilitySnapshot.evidenceDigest) {
    throw blocked('Speech protocol capability digest does not match the immutable capability authority.')
  }
  const outputBytes = Buffer.from(bundle.outputBytes)
  if (sha256Bytes(outputBytes) !== bundle.candidate.audioSha256) {
    throw blocked('Speech protocol bytes do not match candidate checksum authority.')
  }
  const parsedWave = parseMotionStudioPcmWave(outputBytes)
  let peak = 0
  for (const sample of parsedWave.interleavedSamples) peak = Math.max(peak, Math.abs(sample))
  if (
    parsedWave.channelCount !== bundle.candidate.channelCount ||
    parsedWave.sampleRateHertz !== bundle.candidate.sampleRateHertz ||
    parsedWave.sampleCountPerChannel !== bundle.candidate.sampleCountPerChannel ||
    parsedWave.durationMilliseconds !== bundle.candidate.durationMilliseconds
  ) throw blocked('Speech protocol media properties do not match candidate authority.')
  const expectedQaDigest = sha256CanonicalJson({
    requestDigest: bundle.envelope.requestDigest,
    audioSha256: bundle.candidate.audioSha256,
    sampleCountPerChannel: bundle.candidate.sampleCountPerChannel,
    peak,
    qaGateResults: bundle.candidate.qaGateResults,
  })
  if (expectedQaDigest !== bundle.candidate.qaEvidenceDigest) {
    throw blocked('Speech protocol QA digest does not match the exact media and gate evidence.')
  }
}

function buildDeterministicProtocolWave(requestDigest: string, spokenText: string): Buffer {
  const characterDuration = Math.max(0.6, Math.min(3, spokenText.length / 18))
  const sampleCount = Math.max(4_800, Math.round(characterDuration * 48_000))
  const samples = new Int16Array(sampleCount)
  const seed = Number.parseInt(requestDigest.slice(0, 8), 16)
  const firstFrequency = 180 + (seed % 140)
  const secondFrequency = firstFrequency * 1.5
  for (let index = 0; index < samples.length; index += 1) {
    const seconds = index / 48_000
    const attack = Math.min(1, index / 960)
    const release = Math.min(1, (samples.length - index - 1) / 1_920)
    const envelope = Math.max(0, Math.min(attack, release))
    const signal = Math.sin(2 * Math.PI * firstFrequency * seconds) * 0.22 +
      Math.sin(2 * Math.PI * secondFrequency * seconds) * 0.06
    samples[index] = Math.round(signal * envelope * 32_767)
  }
  return encodeMotionStudioPcmWave({ channelCount: 1, interleavedSamples: samples })
}

function scope(request: MotionStudioSpeechSegmentRequestV1) {
  return {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
  }
}

function deterministicUuid(inputDigest: string, label: string): string {
  const hex = sha256CanonicalJson({ inputDigest, label }).slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

function sha256Bytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
