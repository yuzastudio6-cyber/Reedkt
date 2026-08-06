import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  persistCanonicalPrivateAudioArtifact,
  readCanonicalPrivateAudioArtifact,
} from '../../services/canonical-private-audio-artifact-storage'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineGeneratedMusicCandidateNormalizeExecutionRequest,
} from '../../tool-execution/media-binary-execution'
import { parseMotionStudioPcmWave } from '../audio-production/pcm-wave'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioLyriaD3PreflightPlan,
  MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES,
  type MotionStudioLyriaD3PreflightPlanV1,
} from './lyria-d3-preflight'
import {
  assertMotionStudioLyriaD3ExternalReadiness,
  type MotionStudioLyriaD3ExternalReadinessV1,
} from './lyria-d3-readiness'

export const MOTION_STUDIO_LYRIA_D3_PRIVATE_INGEST_READINESS_SCHEMA_VERSION =
  'motion-studio.lyria-d3-private-ingest-readiness.v1' as const
export const MOTION_STUDIO_LYRIA_D3_SUPERSEDED_NORMALIZATION_OPERATION =
  'tool.ffmpeg.normalize_storytelling_music_candidate.v1' as const

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const isoDate = z.string().datetime({ offset: true })
const gateCodeSchema = z.enum(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES)
const qaGateSchema = z.enum([
  'source_integrity',
  'canonical_operation_binding',
  'fixed_recipe_execution',
  'normalization_format',
  'duration_preservation',
  'non_silent_signal',
  'sample_peak_safety',
  'media_probe',
  'private_create_only_readback',
  'deterministic_replay',
  'creative_cue_fit',
  'originality_and_no_copy',
  'speech_context_safety',
  'human_listening_review',
])

const qaResultSchema = z.object({
  gate: qaGateSchema,
  result: z.enum(['passed', 'not_evaluated']),
  blocking: z.literal(true),
  evidenceDigest: digest,
  note: z.string().trim().min(1).max(500),
}).strict()

const readinessGateSchema = z.object({
  gateCode: gateCodeSchema,
  state: z.enum(['passed_local', 'passed_external_read_only', 'external_evidence_required']),
  evidenceId: stableId,
  evidenceDigest: digest,
  explanation: z.string().trim().min(1).max(600),
}).strict()

export const motionStudioLyriaD3PrivateIngestReadinessV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_PRIVATE_INGEST_READINESS_SCHEMA_VERSION),
  evidenceId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  sourcePreflightPlanId: stableId,
  sourcePreflightDigest: digest,
  sourceExternalReadinessId: stableId,
  sourceExternalReadinessDigest: digest,
  state: z.literal('private_ingest_normalization_qa_profile_ready_execution_blocked'),
  createdAt: isoDate,
  profile: z.object({
    canonicalToolId: z.literal('ffmpeg'),
    canonicalOperationId: z.literal(OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg),
    recipeProfileId: z.literal(OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE),
    supersededProposedOperationId: z.literal(MOTION_STUDIO_LYRIA_D3_SUPERSEDED_NORMALIZATION_OPERATION),
    registrationState: z.literal('fixed_recipe_registered_under_existing_canonical_operation'),
    newGlobalOperationCreated: z.literal(false),
    outputContainer: z.literal('wav'),
    outputCodec: z.literal('pcm_s16le'),
    outputSampleRateHertz: z.literal(48_000),
    outputChannelCount: z.literal(2),
    maximumDurationMilliseconds: z.literal(30_000),
    metadataPolicy: z.literal('strip_all'),
    runtimeAuthorityHash: digest,
    runtimeImageIdentityHash: digest,
  }).strict(),
  sourceFixture: z.object({
    evidenceClass: z.literal('synthetic_private_nonprovider_pcm_wave'),
    mimeType: z.literal('audio/wav'),
    byteLength: z.number().int().min(44).max(16 * 1024 * 1024),
    sha256: digest,
    sampleRateHertz: z.number().int().min(8_000).max(192_000),
    channelCount: z.number().int().min(1).max(8),
    durationMilliseconds: z.number().int().positive().max(30_000),
    providerResponseReceived: z.literal(false),
    externalProviderRequestCount: z.literal(0),
    rawProviderPayloadPersisted: z.literal(false),
  }).strict(),
  normalizedArtifact: z.object({
    privateObjectIdentityHash: digest,
    mimeType: z.literal('audio/wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
    bitsPerSample: z.literal(16),
    sampleCountPerChannel: z.number().int().positive().max(48_000 * 30),
    durationMilliseconds: z.number().int().positive().max(30_000),
    byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    sha256: digest,
    normalizationAttestationDigest: digest,
    deterministicReplayVerified: z.literal(true),
    privateCreateOnlyReadbackVerified: z.literal(true),
  }).strict(),
  measurements: z.object({
    rmsLinear: z.number().finite().positive().max(1),
    samplePeakDbfs: z.number().finite().max(0),
    integratedLufs: z.number().finite(),
    loudnessRangeLu: z.number().finite().nonnegative(),
    truePeakDbfs: z.number().finite().max(0),
    ebuR128MeasurementExecuted: z.literal(true),
  }).strict(),
  qa: z.object({
    gateResults: z.array(qaResultSchema).length(14).readonly(),
    structuralQaPassed: z.literal(true),
    semanticAndListeningQaComplete: z.literal(false),
    futureAuthorizedCandidateProcessingReady: z.literal(true),
    actualProviderCandidateQaComplete: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    qaDigest: digest,
  }).strict(),
  gates: z.array(readinessGateSchema).length(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.length).readonly(),
  resolvedGateCode: z.literal('private_ingest_normalization_and_qa'),
  blockingGateCodes: z.array(gateCodeSchema).length(3).readonly(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    normalizedAudioPersisted: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    providerUrlPersisted: z.literal(false),
    localPathProjected: z.literal(false),
    createOnly: z.literal(true),
    evidenceObjectIdentityHash: digest,
  }).strict(),
  cost: z.object({
    providerCostMicros: z.literal(0),
    projectProductionAttemptCostMicros: z.literal(0),
    localFixtureAccountingState: z.literal('test_infrastructure_not_attributed_to_provider_candidate'),
    maximumAuthorizedLocalComputeCostMicros: z.literal(20_000),
    customerPricingIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    googleSecretManagerPayloadReadCount: z.literal(0),
    providerRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    syntheticMediaFixtureCreated: z.literal(true),
    privateNormalizedFixtureCreated: z.literal(true),
    providerCandidateCreated: z.literal(false),
    executionAuthorityIssued: z.literal(false),
    selectionPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  providerExecutionAllowed: z.literal(false),
  singleUseAuthorityIssued: z.literal(false),
  privateCandidateCreated: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  finalMixAllowed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
  evidenceDigest: digest,
}).strict().superRefine((value, context) => {
  const qaGates = value.qa.gateResults.map((entry) => entry.gate)
  if (new Set(qaGates).size !== qaGates.length) {
    context.addIssue({ code: 'custom', path: ['qa', 'gateResults'], message: 'Lyria ingest QA gates must be unique.' })
  }
  const readinessCodes = value.gates.map((entry) => entry.gateCode)
  if (new Set(readinessCodes).size !== readinessCodes.length ||
      MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.some((gate) => !readinessCodes.includes(gate))) {
    context.addIssue({ code: 'custom', path: ['gates'], message: 'Lyria ingest readiness must classify every D3 gate.' })
  }
  const unresolved = value.gates.filter((entry) => entry.state === 'external_evidence_required')
    .map((entry) => entry.gateCode)
  if (unresolved.join('|') !== value.blockingGateCodes.join('|') ||
      value.blockingGateCodes.includes(value.resolvedGateCode)) {
    context.addIssue({ code: 'custom', path: ['blockingGateCodes'], message: 'Lyria ingest blockers must match unresolved gates.' })
  }
})

export type MotionStudioLyriaD3PrivateIngestReadinessV1 =
  z.infer<typeof motionStudioLyriaD3PrivateIngestReadinessV1Schema>

export async function proveMotionStudioLyriaD3PrivateIngestReadiness(input: {
  preflight: MotionStudioLyriaD3PreflightPlanV1
  externalReadiness: MotionStudioLyriaD3ExternalReadinessV1
  syntheticSourceWavBytes: Buffer
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioLyriaD3PrivateIngestReadinessV1> {
  assertMotionStudioLyriaD3PreflightPlan(input.preflight)
  assertMotionStudioLyriaD3ExternalReadiness(input.externalReadiness)
  assertLineage(input.preflight, input.externalReadiness)
  if (!/^\/tmp\/reeditpro-motion-studio-lyria-d3-private-ingest-[A-Za-z0-9._-]+$/.test(input.localStorageRoot)) {
    invalid('Lyria private-ingest fixture requires its server-owned bounded local root.')
  }
  if (!Buffer.isBuffer(input.syntheticSourceWavBytes) ||
      input.syntheticSourceWavBytes.byteLength > input.preflight.transportBudgetProposal.maximumCapturedResponseBytes) {
    invalid('Lyria private-ingest fixture bytes exceed the exact preflight response ceiling.')
  }
  const createdAt = exactIso(input.createdAt)
  if (createdAt < input.externalReadiness.createdAt || createdAt >= input.externalReadiness.expiresAt) {
    blocked('Lyria private-ingest readiness evidence must be created inside the frozen evidence window.')
  }

  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
    runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
    !runtimeAuthority.supportedOperations.some((entry) =>
      entry.toolId === 'ffmpeg' && entry.operationId === OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg)
  ) blocked('Canonical private FFmpeg runtime authority is unavailable for the generated-music recipe.')
  const runtime = await openPrivateOfflineMediaBinaryRuntime()
  if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
    blocked('Canonical FFmpeg runtime changed after generated-music profile verification.')
  }

  const sourceSha256 = sha256(input.syntheticSourceWavBytes)
  const normalizationRequest = validateOfflineGeneratedMusicCandidateNormalizeExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      recipeProfileId: OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE,
      mimeType: 'audio/wav',
      sourceByteLength: input.syntheticSourceWavBytes.byteLength,
      sourceSha256,
      sourceBytesBase64: input.syntheticSourceWavBytes.toString('base64'),
      outputContainer: 'wav',
      outputCodec: 'pcm_s16le',
      outputSampleRateHertz: 48_000,
      outputChannelCount: 2,
      maximumDurationMilliseconds: 30_000,
      metadataPolicy: 'strip_all',
      overwriteExistingArtifact: false,
    },
  })
  const normalized = await runtime.execute(normalizationRequest)
  const replay = await runtime.execute(normalizationRequest)
  if (
    replay.resultArtifact.sha256 !== normalized.resultArtifact.sha256 ||
    !replay.resultArtifact.bytes.equals(normalized.resultArtifact.bytes)
  ) blocked('Generated-music normalization replay produced different committed bytes.')

  const wave = parseMotionStudioPcmWave(normalized.resultArtifact.bytes)
  if (
    wave.channelCount !== 2 || wave.sampleRateHertz !== 48_000 ||
    wave.sampleCountPerChannel !== normalized.resultArtifact.sampleCountPerChannel ||
    wave.durationMilliseconds !== normalized.resultArtifact.durationMilliseconds ||
    Math.abs(wave.durationMilliseconds - input.preflight.timing.requestedDurationMilliseconds) > 2
  ) blocked('Generated-music normalized fixture does not preserve the exact D3 timing and format authority.')
  const metrics = analyzePcm(wave.interleavedSamples)
  if (metrics.rmsLinear <= 0.000_01 || metrics.samplePeakDbfs > -0.01) {
    blocked('Generated-music normalized fixture is silent or exceeds the fixed sample-peak ceiling.')
  }

  const privateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_lyria_d3_private_normalized_music_fixture_v1',
    sourceReadinessDigest: input.externalReadiness.readinessDigest,
    sourceSha256,
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
  if (!stored || stored.sha256 !== normalized.resultArtifact.sha256 ||
      stored.byteLength !== normalized.resultArtifact.byteLength ||
      !stored.bytes.equals(normalized.resultArtifact.bytes)) {
    blocked('Generated-music private normalized bytes changed after create-only persistence.')
  }

  const measurement = await runtime.execute({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix,
    payload: {
      measurementProfileId: 'motion_studio_storytelling_ebur128_v1',
      expectedSampleRateHertz: 48_000,
      expectedChannelCount: 2,
      emitMachineJsonOnly: true,
      mimeType: 'audio/wav',
      sourceByteLength: stored.byteLength,
      sourceSha256: stored.sha256,
      sourceBytesBase64: stored.bytes.toString('base64'),
      expectedSampleCountPerChannel: wave.sampleCountPerChannel,
    },
  })
  const sourceProbe = record(normalized.evidence.semanticEvidence.sourceProbe)
  const qaGateResults = createQaResults({
    sourceSha256,
    resultSha256: normalized.resultArtifact.sha256,
    attestationDigest: normalized.attestation.attestationHash,
    measurementDigest: measurement.attestation.attestationHash,
    privateObjectIdentityHash,
  })
  const qaDigest = sha256CanonicalJson(qaGateResults)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_lyria_d3_private_ingest_readiness_evidence_v1',
    sourceExternalReadinessDigest: input.externalReadiness.readinessDigest,
    normalizedSha256: normalized.resultArtifact.sha256,
    qaDigest,
  })
  const gates = input.externalReadiness.gates.map((gate) => gate.gateCode === 'private_ingest_normalization_and_qa'
    ? {
        gateCode: gate.gateCode,
        state: 'passed_local' as const,
        evidenceId: `lyria-d3-private-ingest-${evidenceObjectIdentityHash.slice(0, 32)}`,
        evidenceDigest: qaDigest,
        explanation: 'The fixed canonical FFmpeg recipe, private create-only WAV persistence and objective structural QA passed on an exact synthetic D3 fixture.',
      }
    : gate)
  const blockingGateCodes = gates.filter((gate) => gate.state === 'external_evidence_required')
    .map((gate) => gate.gateCode)
  const measurements = measurement.resultJson.document
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_PRIVATE_INGEST_READINESS_SCHEMA_VERSION,
    evidenceId: `ms012d3-private-ingest-${evidenceObjectIdentityHash.slice(0, 32)}`,
    workspaceId: input.preflight.workspaceId,
    projectId: input.preflight.projectId,
    editSessionId: input.preflight.editSessionId,
    productionId: input.preflight.productionId,
    sourcePreflightPlanId: input.preflight.preflightPlanId,
    sourcePreflightDigest: input.preflight.preflightDigest,
    sourceExternalReadinessId: input.externalReadiness.readinessId,
    sourceExternalReadinessDigest: input.externalReadiness.readinessDigest,
    state: 'private_ingest_normalization_qa_profile_ready_execution_blocked' as const,
    createdAt,
    profile: {
      canonicalToolId: 'ffmpeg' as const,
      canonicalOperationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      recipeProfileId: OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE,
      supersededProposedOperationId: MOTION_STUDIO_LYRIA_D3_SUPERSEDED_NORMALIZATION_OPERATION,
      registrationState: 'fixed_recipe_registered_under_existing_canonical_operation' as const,
      newGlobalOperationCreated: false as const,
      outputContainer: 'wav' as const,
      outputCodec: 'pcm_s16le' as const,
      outputSampleRateHertz: 48_000 as const,
      outputChannelCount: 2 as const,
      maximumDurationMilliseconds: 30_000 as const,
      metadataPolicy: 'strip_all' as const,
      runtimeAuthorityHash: runtimeAuthority.authorityHash,
      runtimeImageIdentityHash: runtime.image.imageIdentityHash,
    },
    sourceFixture: {
      evidenceClass: 'synthetic_private_nonprovider_pcm_wave' as const,
      mimeType: 'audio/wav' as const,
      byteLength: input.syntheticSourceWavBytes.byteLength,
      sha256: sourceSha256,
      sampleRateHertz: integer(sourceProbe.sampleRateHertz, 'source sample rate'),
      channelCount: integer(sourceProbe.channelCount, 'source channel count'),
      durationMilliseconds: integer(sourceProbe.durationMilliseconds, 'source duration'),
      providerResponseReceived: false as const,
      externalProviderRequestCount: 0 as const,
      rawProviderPayloadPersisted: false as const,
    },
    normalizedArtifact: {
      privateObjectIdentityHash,
      mimeType: 'audio/wav' as const,
      codec: 'pcm_s16le' as const,
      sampleRateHertz: 48_000 as const,
      channelCount: 2 as const,
      bitsPerSample: 16 as const,
      sampleCountPerChannel: wave.sampleCountPerChannel,
      durationMilliseconds: wave.durationMilliseconds,
      byteLength: stored.byteLength,
      sha256: stored.sha256,
      normalizationAttestationDigest: normalized.attestation.attestationHash,
      deterministicReplayVerified: true as const,
      privateCreateOnlyReadbackVerified: true as const,
    },
    measurements: {
      rmsLinear: metrics.rmsLinear,
      samplePeakDbfs: metrics.samplePeakDbfs,
      integratedLufs: measurements.integratedLufs,
      loudnessRangeLu: measurements.loudnessRangeLu,
      truePeakDbfs: measurements.truePeakDbfs,
      ebuR128MeasurementExecuted: true as const,
    },
    qa: {
      gateResults: qaGateResults,
      structuralQaPassed: true as const,
      semanticAndListeningQaComplete: false as const,
      futureAuthorizedCandidateProcessingReady: true as const,
      actualProviderCandidateQaComplete: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      qaDigest,
    },
    gates,
    resolvedGateCode: 'private_ingest_normalization_and_qa' as const,
    blockingGateCodes,
    persistence: {
      privateLocalOnly: true as const,
      normalizedAudioPersisted: true as const,
      evidenceRecordPersisted: true as const,
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
      createOnly: true as const,
      evidenceObjectIdentityHash,
    },
    cost: {
      providerCostMicros: 0 as const,
      projectProductionAttemptCostMicros: 0 as const,
      localFixtureAccountingState: 'test_infrastructure_not_attributed_to_provider_candidate' as const,
      maximumAuthorizedLocalComputeCostMicros: input.externalReadiness.localComputeRateCard.maximumAuthorizedLocalComputeCostMicros,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
      billingMutationPerformed: false as const,
    },
    sideEffects: {
      googleSecretManagerPayloadReadCount: 0 as const,
      providerRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      syntheticMediaFixtureCreated: true as const,
      privateNormalizedFixtureCreated: true as const,
      providerCandidateCreated: false as const,
      executionAuthorityIssued: false as const,
      selectionPerformed: false as const,
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    providerExecutionAllowed: false as const,
    singleUseAuthorityIssued: false as const,
    privateCandidateCreated: false as const,
    automaticSelectionAllowed: false as const,
    finalMixAllowed: false as const,
    productReady: false as const,
    immutable: true as const,
  }
  const evidence = parseAndFreeze({ ...base, evidenceDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3PrivateIngestReadinessV1Schema)
  await persistEvidenceRecord(input.localStorageRoot, evidence)
  return evidence
}

export function assertMotionStudioLyriaD3PrivateIngestReadiness(
  input: MotionStudioLyriaD3PrivateIngestReadinessV1,
): void {
  const parsed = motionStudioLyriaD3PrivateIngestReadinessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.evidenceDigest
  if (sha256CanonicalJson(base) !== parsed.evidenceDigest || parsed.blockingGateCodes.length !== 3 ||
      parsed.providerExecutionAllowed || parsed.singleUseAuthorityIssued || parsed.privateCandidateCreated ||
      parsed.qa.semanticAndListeningQaComplete || parsed.qa.selectionEligible || parsed.finalMixAllowed) {
    blocked('Lyria private-ingest readiness failed its immutable fail-closed boundary.')
  }
}

function assertLineage(
  preflight: MotionStudioLyriaD3PreflightPlanV1,
  readiness: MotionStudioLyriaD3ExternalReadinessV1,
): void {
  if (
    readiness.sourcePreflightPlanId !== preflight.preflightPlanId ||
    readiness.sourcePreflightDigest !== preflight.preflightDigest ||
    !readiness.blockingGateCodes.includes('private_ingest_normalization_and_qa') ||
    readiness.sideEffects.providerRequestCount !== 0 || readiness.sideEffects.mediaBytesCreated !== 0
  ) blocked('Lyria private-ingest readiness requires the exact still-blocked external-readiness authority.')
}

function createQaResults(input: {
  sourceSha256: string
  resultSha256: string
  attestationDigest: string
  measurementDigest: string
  privateObjectIdentityHash: string
}): MotionStudioLyriaD3PrivateIngestReadinessV1['qa']['gateResults'] {
  const passed = [
    'source_integrity', 'canonical_operation_binding', 'fixed_recipe_execution',
    'normalization_format', 'duration_preservation', 'non_silent_signal',
    'sample_peak_safety', 'media_probe', 'private_create_only_readback', 'deterministic_replay',
  ] as const
  const notEvaluated = [
    'creative_cue_fit', 'originality_and_no_copy', 'speech_context_safety', 'human_listening_review',
  ] as const
  return [
    ...passed.map((gate) => ({
      gate,
      result: 'passed' as const,
      blocking: true as const,
      evidenceDigest: sha256CanonicalJson({ gate, ...input }),
      note: gate === 'canonical_operation_binding'
        ? 'The generated-music recipe executed under the existing canonical FFmpeg operation.'
        : 'The synthetic private fixture passed this objective structural normalization gate.',
    })),
    ...notEvaluated.map((gate) => ({
      gate,
      result: 'not_evaluated' as const,
      blocking: true as const,
      evidenceDigest: sha256CanonicalJson({ gate, ...input, state: 'not_evaluated' }),
      note: 'Requires an actual authorized provider candidate and human listening/context review.',
    })),
  ]
}

async function persistEvidenceRecord(
  localStorageRoot: string,
  evidence: MotionStudioLyriaD3PrivateIngestReadinessV1,
): Promise<void> {
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const relativePath = `motion-studio/lyria-d3-private-ingest-readiness/${evidence.persistence.evidenceObjectIdentityHash.slice(0, 2)}/${evidence.persistence.evidenceObjectIdentityHash}.json`
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: localStorageRoot, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  if (!stored || !stored.equals(bytes)) blocked('Lyria private-ingest readiness evidence changed after create-only persistence.')
}

function analyzePcm(samples: Int16Array): { rmsLinear: number; samplePeakDbfs: number } {
  let sumSquares = 0
  let peak = 0
  for (const sample of samples) {
    const value = sample / 32_768
    sumSquares += value * value
    peak = Math.max(peak, Math.abs(value))
  }
  const rmsLinear = rounded(Math.sqrt(sumSquares / samples.length))
  const samplePeakDbfs = rounded(20 * Math.log10(Math.max(peak, Number.EPSILON)))
  return { rmsLinear, samplePeakDbfs }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) blocked('Lyria normalization evidence is malformed.')
  return value as Record<string, unknown>
}
function integer(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) blocked(`Lyria normalization ${label} is invalid.`)
  return Number(value)
}
function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) invalid('Lyria readiness time must be canonical ISO-8601.')
  return value
}
function parseAndFreeze<T>(value: unknown, schema: z.ZodType<T>): T {
  return deepFreeze(schema.parse(value))
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
function rounded(value: number): number { return Number(value.toFixed(9)) }
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): never { throw new ApiError('VALIDATION_FAILED', message, 400) }
function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_lyria_d3_private_ingest_readiness',
  })
}
