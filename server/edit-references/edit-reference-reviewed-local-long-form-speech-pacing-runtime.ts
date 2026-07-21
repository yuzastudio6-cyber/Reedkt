import { createHash } from 'node:crypto'
import { chmod, lstat, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import type { QwenSpeechPacingReasoningProvider } from '../services/qwen-speech-pacing-provider'
import type {
  EditReferenceSpeechPacingAuthorityEvidenceItem,
  EditReferenceSpeechPacingRuntimeInput,
  EditReferenceSpeechPacingTranscriptAuthority,
  EditReferenceSpeechPacingTranscriptAuthorityResolverInput,
} from './edit-reference-media-study'
import {
  editReferenceLongFormDependencyArtifactKey,
  type ExecuteEditReferenceLongFormChunkMediaStageInput,
} from './edit-reference-long-form-chunk-media-executor'
import type { EditReferenceLongFormSemanticWindowEvidenceBundle } from './edit-reference-long-form-semantic-window-evidence'
import type { EditReferenceLongFormSemanticWindowSpecialistRequest } from './edit-reference-long-form-semantic-window-dispatcher'
import {
  EDIT_REFERENCE_LONG_FORM_PRIVATE_TRANSCRIPT_VERSION,
} from './edit-reference-long-form-speech-transcript-stage'
import {
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'

export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_SPEECH_PACING_RUNTIME_ID =
  'edit_reference_reviewed_local_long_form_speech_pacing_runtime' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_SPEECH_PACING_RUNTIME_VERSION =
  'v2' as const

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const MAX_PRIVATE_TRANSCRIPT_BYTES = 32 * 1024 * 1024
const MAX_PRIVATE_AUDIO_BYTES = 64 * 1024 * 1024

const transcriptWordSchema = z.object({
  word: z.string().trim().min(1).max(120),
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  confidence: z.number().min(0).max(1).nullable(),
}).strict()

const privateTranscriptSchema = z.object({
  schemaVersion: z.literal(EDIT_REFERENCE_LONG_FORM_PRIVATE_TRANSCRIPT_VERSION),
  untrustedSourceText: z.literal(true),
  runId: z.string().regex(SAFE_ID_PATTERN),
  workItemId: z.string().regex(SAFE_ID_PATTERN),
  chunkId: z.string().regex(SAFE_ID_PATTERN),
  privateMediaArtifactId: z.string().regex(SAFE_ID_PATTERN),
  mediaChecksumSha256: z.string().regex(SHA256_PATTERN),
  sourceAudioOutputDigestSha256: z.string().regex(SHA256_PATTERN),
  sourceCoverageStartSeconds: z.number().nonnegative(),
  sourceCoverageEndSeconds: z.number().positive(),
  languageCode: z.string().trim().min(1).max(32).nullable(),
  confidence: z.number().min(0).max(1),
  model: z.object({
    toolId: z.literal('faster_whisper'),
    modelName: z.string().trim().min(1).max(240).nullable(),
    modelVersion: z.string().trim().min(1).max(240).nullable(),
    modelWeightManifestId: z.string().regex(SAFE_ID_PATTERN).nullable(),
  }).strict(),
  reviewedLocalRuntime: z.object({
    runtimeId: z.string().regex(SAFE_ID_PATTERN),
    receiptVersion: z.string().regex(SAFE_ID_PATTERN),
    packageName: z.literal('faster-whisper'),
    packageVersion: z.string().trim().min(1).max(64),
    runtimeKind: z.string().trim().min(1).max(120),
    modelName: z.string().trim().min(1).max(240),
    modelVersion: z.string().trim().min(1).max(240),
    modelManifestId: z.string().regex(SAFE_ID_PATTERN),
    manifestVersion: z.string().regex(SAFE_ID_PATTERN),
    manifestDigestSha256: z.string().regex(SHA256_PATTERN),
    modelDirectorySha256: z.string().regex(SHA256_PATTERN),
    license: z.string().trim().min(1).max(240),
    commercialUseStatus: z.literal('internal_testing_only'),
    approvedForInternalTesting: z.literal(true),
    allowModelDownload: z.literal(false),
    providerCallMade: z.literal(false),
    externalUrlFetched: z.literal(false),
    localPathsPersisted: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  segments: z.array(z.object({
    segmentId: z.string().regex(SAFE_ID_PATTERN),
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().positive(),
    text: z.string().trim().min(1).max(1_000),
    confidence: z.number().min(0).max(1).nullable(),
    words: z.array(transcriptWordSchema).min(1).max(1_000),
  }).strict()).min(1).max(1_000),
  rawAudioPersisted: z.literal(false),
  rawProcessOutputPersisted: z.literal(false),
  signedUrlPersisted: z.literal(false),
  localFilePathPersisted: z.literal(false),
  customerPriceCalculated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  serviceFeeIncluded: z.literal(false),
}).strict()

type PrivateTranscript = z.infer<typeof privateTranscriptSchema>

export interface ResolveEditReferenceReviewedLocalLongFormSpeechPacingRuntimeInput {
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly evidence: EditReferenceLongFormSemanticWindowEvidenceBundle
  readonly provider: QwenSpeechPacingReasoningProvider
  readonly studyGoalEvidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
  readonly sourceClaimsPresent: boolean
  readonly factSafetyEvidence?: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[]
}

/**
 * Binds the actual reviewed-local Faster Whisper artifact produced by the
 * durable long-form scheduler to one exact semantic window. Transcript text
 * remains in ephemeral 0600 artifacts inside the semantic-window cleanup
 * root; only generalized Speech/Pacing findings can enter checkpoints.
 */
export async function resolveEditReferenceReviewedLocalLongFormSpeechPacingRuntime(
  input: ResolveEditReferenceReviewedLocalLongFormSpeechPacingRuntimeInput,
): Promise<{ readonly specialistId: 'speech_pacing'; readonly runtime: EditReferenceSpeechPacingRuntimeInput }> {
  validateResolverBinding(input)
  const transcriptOutput = requireTranscriptOutput(input.stageInput, input.request)
  const transcriptArtifact = transcriptOutput.artifacts.find((artifact) => artifact.role === 'private_transcript')
  if (!transcriptArtifact || transcriptOutput.result.kind !== 'speech_transcript') {
    throw new Error('Reviewed local Speech/Pacing lacks the exact private transcript artifact.')
  }
  const transcriptPath = input.stageInput.dependencyArtifactLocalPaths[
    editReferenceLongFormDependencyArtifactKey(
      transcriptOutput.workItemId,
      transcriptArtifact.storageObjectPath,
    )
  ]
  if (!transcriptPath) {
    throw new Error('Reviewed local Speech/Pacing private transcript path is unavailable.')
  }
  const privateTranscript = await readVerifiedPrivateTranscript({
    transcriptPath,
    transcriptOutput,
    artifactChecksumSha256: transcriptArtifact.checksumSha256,
    artifactSizeBytes: transcriptArtifact.sizeBytes,
  })
  const authority = await materializeSemanticWindowTranscriptAuthority({
    input,
    transcriptOutput,
    privateTranscript,
  })
  return {
    specialistId: 'speech_pacing',
    runtime: {
      orchestrationId: `long-form-speech:${input.request.runId}:${input.request.semanticWindowOrdinal}`,
      studySessionId: input.stageInput.plan.studySessionId,
      studyGoalEvidence: input.studyGoalEvidence.map((item) => ({ ...item })),
      provider: input.provider,
      transcriptAuthorityResolver: async (resolverInput) => {
        validateTranscriptAuthorityResolverInput(input, resolverInput)
        return authority
      },
    },
  }
}

function validateResolverBinding(
  input: ResolveEditReferenceReviewedLocalLongFormSpeechPacingRuntimeInput,
): void {
  const { request, evidence, stageInput } = input
  if (
    request.specialistId !== 'speech_pacing'
    || request.executionScope !== 'controlled_test'
    || input.provider.executionMode !== 'controlled_local'
    || request.runId !== stageInput.runId
    || request.planId !== stageInput.plan.planId
    || request.planDigestSha256 !== stageInput.plan.planDigestSha256
    || request.workItemId !== stageInput.workItem.workItemId
    || request.chunkId !== stageInput.workItem.chunkId
    || request.privateMediaArtifactId !== stageInput.plan.source.privateMediaArtifactId
    || request.mediaChecksumSha256 !== stageInput.plan.source.mediaChecksumSha256
    || request.semanticWindowId !== evidence.semanticWindowId
    || request.sourceStartSeconds !== evidence.sourceStartSeconds
    || request.sourceEndSeconds !== evidence.sourceEndSeconds
    || request.sourceTimeOffsetSeconds !== evidence.sourceTimeOffsetSeconds
    || request.providerLocalEndSeconds !== evidence.durationSeconds
    || evidence.exactProviderLocalEvidencePrepared !== true
    || !evidence.privateAudioArtifact
    || !evidence.privateAudioArtifact.localFilePath
    || evidence.privateAudioArtifact.isPrivate !== true
    || evidence.privateAudioArtifact.sourceOfTruth !== true
    || input.studyGoalEvidence.length < 1
    || (input.sourceClaimsPresent && (input.factSafetyEvidence?.length ?? 0) < 1)
  ) throw new Error('Reviewed local Speech/Pacing runtime binding is incomplete or exceeds controlled authority.')
  assertUniqueSafeEvidence(input.studyGoalEvidence)
  assertUniqueSafeEvidence(input.factSafetyEvidence ?? [])
}

function requireTranscriptOutput(
  stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput,
  request: EditReferenceLongFormSemanticWindowSpecialistRequest,
): EditReferenceLongFormStudyWorkOutput {
  const output = stageInput.dependencyOutputs.find((candidate) => (
    candidate.stageId === 'speech_transcript' && candidate.chunkId === request.chunkId
  ))
  const workItem = output && stageInput.run.workItems.find((candidate) => (
    candidate.workItemId === output.workItemId
  ))
  if (
    !output
    || !workItem
    || workItem.status !== 'completed'
    || !stageInput.workItem.dependencyWorkItemIds.includes(output.workItemId)
    || output.result.kind !== 'speech_transcript'
    || !output.result.speechPresent
    || output.result.wordTimingMode !== 'exact'
    || output.result.interpolatedWordTimingUsed
    || output.result.transcriptTextPersistedInWorkOutput
    || output.runtimeSource !== 'verified_local'
    || output.completionAuthority !== 'authoritative'
    || output.toolIds.length !== 1
    || output.toolIds[0] !== 'faster_whisper'
    || output.providerCallMade
    || output.remoteMutationMade
  ) throw new Error('Reviewed local Speech/Pacing requires one completed authoritative Faster Whisper output.')
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan({
    output,
    plan: stageInput.plan,
    workItem,
  })
  return output
}

async function readVerifiedPrivateTranscript(input: {
  readonly transcriptPath: string
  readonly transcriptOutput: EditReferenceLongFormStudyWorkOutput
  readonly artifactChecksumSha256: string
  readonly artifactSizeBytes: number
}): Promise<PrivateTranscript> {
  const stat = await lstat(input.transcriptPath)
  if (
    !stat.isFile()
    || stat.isSymbolicLink()
    || stat.size !== input.artifactSizeBytes
    || stat.size < 2
    || stat.size > MAX_PRIVATE_TRANSCRIPT_BYTES
  ) throw new Error('Reviewed local private transcript file identity is invalid.')
  const bytes = await readFile(input.transcriptPath)
  if (sha256(bytes) !== input.artifactChecksumSha256) {
    throw new Error('Reviewed local private transcript checksum is invalid.')
  }
  const payload = privateTranscriptSchema.parse(JSON.parse(bytes.toString('utf8')) as unknown)
  const output = input.transcriptOutput
  if (
    output.result.kind !== 'speech_transcript'
    || payload.runId !== output.runId
    || payload.workItemId !== output.workItemId
    || payload.chunkId !== output.chunkId
    || payload.privateMediaArtifactId !== output.privateMediaArtifactId
    || payload.mediaChecksumSha256 !== output.mediaChecksumSha256
    || payload.sourceAudioOutputDigestSha256 !== output.result.sourceAudioOutputDigestSha256
    || payload.sourceCoverageStartSeconds !== output.sourceCoverageStartSeconds
    || payload.sourceCoverageEndSeconds !== output.sourceCoverageEndSeconds
    || payload.segments.length !== output.result.segmentCount
    || payload.segments.flatMap((segment) => segment.words).length !== output.result.wordCount
    || JSON.stringify(payload.segments.map((segment, index) => ({
      segmentOrdinal: index + 1,
      sourceStartSeconds: segment.startSeconds,
      sourceEndSeconds: segment.endSeconds,
      wordCount: segment.words.length,
    }))) !== JSON.stringify(output.result.segmentTimingRanges)
    || payload.model.modelWeightManifestId !== payload.reviewedLocalRuntime.modelManifestId
    || payload.model.modelName !== payload.reviewedLocalRuntime.modelName
    || payload.model.modelVersion !== payload.reviewedLocalRuntime.modelVersion
  ) throw new Error('Reviewed local private transcript does not match its durable work output.')
  validatePrivateTranscriptTiming(payload)
  return payload
}

async function materializeSemanticWindowTranscriptAuthority(input: {
  readonly input: ResolveEditReferenceReviewedLocalLongFormSpeechPacingRuntimeInput
  readonly transcriptOutput: EditReferenceLongFormStudyWorkOutput
  readonly privateTranscript: PrivateTranscript
}): Promise<EditReferenceSpeechPacingTranscriptAuthority> {
  const { request, evidence } = input.input
  const crossingBoundary = input.privateTranscript.segments.some((segment) => (
    segment.startSeconds < request.sourceEndSeconds - 0.001
    && segment.endSeconds > request.sourceStartSeconds + 0.001
    && (
      segment.startSeconds < request.sourceStartSeconds - 0.001
      || segment.endSeconds > request.sourceEndSeconds + 0.001
    )
  ))
  if (crossingBoundary) {
    throw new Error('Reviewed local transcript segment crosses a semantic-window boundary; exact timing cannot be claimed.')
  }
  const segments = input.privateTranscript.segments
    .filter((segment) => (
      segment.startSeconds >= request.sourceStartSeconds - 0.001
      && segment.endSeconds <= request.sourceEndSeconds + 0.001
    ))
    .map((segment) => ({
      segmentId: segment.segmentId,
      startSeconds: rebased(segment.startSeconds, request.sourceStartSeconds),
      endSeconds: rebased(segment.endSeconds, request.sourceStartSeconds),
      text: segment.text,
      words: segment.words.map((word) => ({
        word: word.word,
        startSeconds: rebased(word.startSeconds, request.sourceStartSeconds),
        endSeconds: rebased(word.endSeconds, request.sourceStartSeconds),
        segmentId: segment.segmentId,
        ...(word.confidence === null ? {} : { confidence: word.confidence }),
      })),
      ...(segment.confidence === null ? {} : { confidence: segment.confidence }),
    }))
  if (segments.length < 1 || segments.some((segment) => segment.words.length < 1)) {
    throw new Error('Reviewed local semantic window contains no complete exact transcript segment.')
  }
  const privateAudio = evidence.privateAudioArtifact
  if (!privateAudio?.localFilePath || !privateAudio.checksum) {
    throw new Error('Reviewed local semantic window lacks exact private audio authority.')
  }
  await verifyExactPrivateAudio(privateAudio.localFilePath, privateAudio.checksum)
  const modelInfo = {
    toolId: 'faster_whisper' as const,
    ...(input.privateTranscript.model.modelName ? { modelName: input.privateTranscript.model.modelName } : {}),
    ...(input.privateTranscript.model.modelVersion ? { modelVersion: input.privateTranscript.model.modelVersion } : {}),
    ...(input.privateTranscript.model.modelWeightManifestId
      ? { modelWeightManifestId: input.privateTranscript.model.modelWeightManifestId }
      : {}),
  }
  if (!modelInfo.modelWeightManifestId) {
    throw new Error('Reviewed local transcript lacks exact model-manifest authority.')
  }
  const transcriptPayload = {
    language: input.privateTranscript.languageCode ?? undefined,
    languageConfidence: input.privateTranscript.confidence,
    segments,
    fullText: segments.map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim(),
    durationSeconds: evidence.durationSeconds,
    sourceAudioArtifactId: privateAudio.artifactId,
    modelInfo,
    confidence: input.privateTranscript.confidence,
    issues: [],
  }
  const wordTimingPayload = {
    words: segments.flatMap((segment) => segment.words),
    sourceAudioArtifactId: privateAudio.artifactId,
    modelInfo,
  }
  const transcriptBytes = Buffer.from(`${JSON.stringify(transcriptPayload)}\n`, 'utf8')
  const wordTimingBytes = Buffer.from(`${JSON.stringify(wordTimingPayload)}\n`, 'utf8')
  const transcriptChecksumSha256 = sha256(transcriptBytes)
  const wordTimingChecksumSha256 = sha256(wordTimingBytes)
  await writeExactPrivateArtifact(
    path.join(evidence.outputRoot, 'speech-pacing-private-transcript.json'),
    evidence.outputRoot,
    transcriptBytes,
  )
  await writeExactPrivateArtifact(
    path.join(evidence.outputRoot, 'speech-pacing-private-word-timing.json'),
    evidence.outputRoot,
    wordTimingBytes,
  )
  const factSafetyEvidence = input.input.factSafetyEvidence ?? []
  return {
    privateTranscriptArtifactId: `speech-window-transcript-${transcriptChecksumSha256.slice(0, 24)}`,
    transcriptChecksumSha256,
    privateTranscriptAccessVerified: true,
    privateTranscriptFinalized: true,
    transcriptChecksumVerified: true,
    transcriptRuntimeExecuted: true,
    transcriptQaStatus: 'passed',
    transcriptRuntimeSource: 'verified_local',
    transcriptRuntimeId: EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_SPEECH_PACING_RUNTIME_ID,
    transcriptRuntimeVersion: EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_SPEECH_PACING_RUNTIME_VERSION,
    transcriptModelManifestId: modelInfo.modelWeightManifestId,
    transcriptExecutionId: `speech-window:${request.semanticWindowOrdinal}:${input.transcriptOutput.workItemId}`,
    transcriptPayload,
    segmentTimingMode: 'model_reported',
    segmentTimingAuthorityVerified: true,
    privateWordTimingArtifactId: `speech-window-words-${wordTimingChecksumSha256.slice(0, 24)}`,
    wordTimingChecksumSha256,
    wordTimingPayload,
    wordTimingMode: 'model_aligned',
    wordTimingAuthorityVerified: true,
    interpolatedWordTimingUsed: false,
    privateSpeakerSegmentationArtifactId: null,
    speakerSegmentationChecksumSha256: null,
    speakerSegments: [],
    speakerSegmentationMode: 'not_requested',
    speakerSegmentationAuthorityVerified: false,
    transcriptEvidence: [{
      evidenceId: `speech-transcript-${transcriptChecksumSha256.slice(0, 24)}`,
      summary: 'A checksummed private transcript from the reviewed local speech runtime was bounded to this semantic window.',
    }],
    segmentTimingEvidence: [{
      evidenceId: `speech-segments-${transcriptChecksumSha256.slice(0, 24)}`,
      summary: 'Model-reported segment timing was verified against the exact semantic-window source range.',
    }],
    wordTimingEvidence: [{
      evidenceId: `speech-words-${wordTimingChecksumSha256.slice(0, 24)}`,
      summary: 'Exact model-aligned word timing was retained as private evidence for caption and cadence analysis.',
    }],
    speakerSegmentationEvidence: [],
    factSafetyEvidence: factSafetyEvidence.map((item) => ({ ...item })),
    sourceClaimsPresent: input.input.sourceClaimsPresent,
    temporaryAudioCleaned: true,
  }
}

function validateTranscriptAuthorityResolverInput(
  input: ResolveEditReferenceReviewedLocalLongFormSpeechPacingRuntimeInput,
  resolverInput: EditReferenceSpeechPacingTranscriptAuthorityResolverInput,
): void {
  const audio = input.evidence.privateAudioArtifact
  if (
    !audio?.localFilePath
    || !audio.checksum
    || resolverInput.workspaceId !== input.stageInput.plan.workspaceId
    || resolverInput.editReferenceId !== input.stageInput.plan.editReferenceId
    || resolverInput.studySessionId !== input.stageInput.plan.studySessionId
    || resolverInput.privateMediaArtifactId !== input.request.privateMediaArtifactId
    || resolverInput.mediaChecksumSha256 !== input.request.mediaChecksumSha256
    || resolverInput.privateAudioArtifactId !== audio.artifactId
    || resolverInput.audioChecksumSha256 !== audio.checksum
    || resolverInput.privateAudioLocalPath !== audio.localFilePath
    || resolverInput.sourceDurationSeconds !== input.evidence.durationSeconds
  ) throw new Error('Reviewed local Speech/Pacing transcript resolver input changed after runtime binding.')
}

function validatePrivateTranscriptTiming(payload: PrivateTranscript): void {
  let previousSegmentEnd = payload.sourceCoverageStartSeconds
  for (const segment of payload.segments) {
    if (
      segment.startSeconds < payload.sourceCoverageStartSeconds - 0.001
      || segment.endSeconds > payload.sourceCoverageEndSeconds + 0.001
      || segment.endSeconds <= segment.startSeconds
      || segment.startSeconds < previousSegmentEnd - 0.001
    ) throw new Error('Reviewed local private transcript segment timing is invalid.')
    previousSegmentEnd = segment.endSeconds
    let previousWordEnd = segment.startSeconds
    for (const word of segment.words) {
      if (
        word.startSeconds < segment.startSeconds - 0.001
        || word.endSeconds > segment.endSeconds + 0.001
        || word.endSeconds <= word.startSeconds
        || word.startSeconds < previousWordEnd - 0.001
      ) throw new Error('Reviewed local private transcript word timing is invalid.')
      previousWordEnd = word.endSeconds
    }
  }
}

async function writeExactPrivateArtifact(
  outputPath: string,
  outputRoot: string,
  bytes: Buffer,
): Promise<void> {
  const resolvedRoot = `${path.resolve(outputRoot)}${path.sep}`
  const resolvedOutput = path.resolve(outputPath)
  if (!resolvedOutput.startsWith(resolvedRoot)) {
    throw new Error('Reviewed local Speech/Pacing private artifact escaped its cleanup root.')
  }
  await writeFile(resolvedOutput, bytes, { flag: 'wx', mode: 0o600 })
  await chmod(resolvedOutput, 0o600)
  const stat = await lstat(resolvedOutput)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== bytes.length) {
    throw new Error('Reviewed local Speech/Pacing private artifact identity is invalid.')
  }
}

async function verifyExactPrivateAudio(file: string, checksumSha256: string): Promise<void> {
  const stat = await lstat(file)
  if (
    !stat.isFile()
    || stat.isSymbolicLink()
    || stat.size < 44
    || stat.size > MAX_PRIVATE_AUDIO_BYTES
    || !SHA256_PATTERN.test(checksumSha256)
  ) throw new Error('Reviewed local Speech/Pacing private audio identity is invalid.')
  if (sha256(await readFile(file)) !== checksumSha256) {
    throw new Error('Reviewed local Speech/Pacing private audio checksum is invalid.')
  }
}

function assertUniqueSafeEvidence(
  evidence: readonly EditReferenceSpeechPacingAuthorityEvidenceItem[],
): void {
  if (
    evidence.some((item) => !SAFE_ID_PATTERN.test(item.evidenceId) || !item.summary.trim() || item.summary.length > 900)
    || new Set(evidence.map((item) => item.evidenceId)).size !== evidence.length
  ) throw new Error('Reviewed local Speech/Pacing evidence authority is invalid.')
}

function rebased(value: number, offset: number): number {
  const result = Number((value - offset).toFixed(3))
  return Math.abs(result) < 0.0005 ? 0 : result
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
