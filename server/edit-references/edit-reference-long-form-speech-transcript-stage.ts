import { createHash } from 'node:crypto'
import { chmod, link, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  SpeechCaptionExecutionPipelineInput,
  SpeechCaptionExecutionPipelineResult,
} from '../workers/speech-caption'
import { runSpeechCaptionExecutionPipeline } from '../workers/speech-caption'
import { assertOutputPathInsideRoot } from '../workers/media/media-path-safety'
import {
  editReferenceLongFormDependencyArtifactKey,
  type ExecuteEditReferenceLongFormChunkMediaStageInput,
} from './edit-reference-long-form-chunk-media-executor'
import {
  createEditReferenceLongFormStudyWorkOutput,
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyOutputArtifact,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import {
  createUnmeteredEditReferenceLongFormStudyUsage,
  validateEditReferenceLongFormStudyUsage,
  type EditReferenceLongFormStudyUsageEvidence,
} from './edit-reference-long-form-study-usage-contract'
import {
  validateEditReferenceReviewedLocalFasterWhisperRuntime,
  type EditReferenceReviewedLocalFasterWhisperRuntimeReceipt,
} from './edit-reference-reviewed-local-faster-whisper-runtime'
import type {
  EditReferenceLongFormSpecialistStageExecutor,
} from './edit-reference-long-form-specialist-pipeline-stage-executor'

export const EDIT_REFERENCE_LONG_FORM_PRIVATE_TRANSCRIPT_VERSION =
  'edit-reference-long-form-private-transcript-v1' as const

export type EditReferenceLongFormSpeechPipelineRunner = (
  input: SpeechCaptionExecutionPipelineInput,
) => Promise<SpeechCaptionExecutionPipelineResult>

export interface ExecuteControlledEditReferenceLongFormSpeechTranscriptStageOptions {
  readonly localModelPath?: string
  readonly modelName?: string
  readonly language?: string
  readonly device?: 'cpu' | 'cuda' | 'auto'
  readonly computeType?: string
  readonly beamSize?: number
  readonly timeoutMs?: number
  readonly fasterWhisperCommand?: string
  readonly pythonCommand?: string
  readonly pipelineRunner?: EditReferenceLongFormSpeechPipelineRunner
}

export interface ExecuteReviewedLocalEditReferenceLongFormSpeechTranscriptStageOptions {
  readonly manifestPath: string
  readonly localModelPath: string
  readonly pythonCommand: string
  readonly language?: string
  readonly device?: 'cpu' | 'cuda' | 'auto'
  readonly computeType?: string
  readonly beamSize?: number
  readonly timeoutMs?: number
}

/**
 * Creates a deliberately single-purpose specialist executor. The scheduler
 * must pair it with `specialistStageIds: ['speech_transcript']`; other
 * specialist stages remain queued until their own reviewed runtimes exist.
 */
export function createReviewedLocalEditReferenceLongFormSpeechTranscriptStageExecutor(
  options: ExecuteReviewedLocalEditReferenceLongFormSpeechTranscriptStageOptions,
): EditReferenceLongFormSpecialistStageExecutor {
  return async (input) => {
    if (input.workItem.stageId !== 'speech_transcript') {
      throw new Error('The reviewed local Faster Whisper executor owns only speech_transcript work.')
    }
    return executeReviewedLocalEditReferenceLongFormSpeechTranscriptStage(input, options)
  }
}

export interface BuildEditReferenceLongFormSpeechTranscriptStageOutputOptions {
  readonly pipelineResult: SpeechCaptionExecutionPipelineResult
  readonly authority: 'controlled_test' | 'production'
  readonly usage: EditReferenceLongFormStudyUsageEvidence
}

type EditReferenceLongFormSpeechTranscriptRuntimeAuthority =
  | 'controlled_test'
  | 'reviewed_local'
  | 'production'

/**
 * Executes the actual reviewed local Faster Whisper runtime. Unlike the
 * controlled fixture path, this can produce authoritative backend-local
 * transcript evidence. It still cannot claim production cost/model authority,
 * call a provider, or unlock rendering/export.
 */
export async function executeReviewedLocalEditReferenceLongFormSpeechTranscriptStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  options: ExecuteReviewedLocalEditReferenceLongFormSpeechTranscriptStageOptions,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  const dependency = requireStudyAudioDependency(input)
  const sourceAudioLocalPath = requireStudyAudioLocalPath(input, dependency)
  await assertPrivateStudyAudioFile(sourceAudioLocalPath)
  const started = process.hrtime.bigint()
  const reviewedRuntime = await validateEditReferenceReviewedLocalFasterWhisperRuntime({
    manifestPath: options.manifestPath,
    localModelPath: options.localModelPath,
    pythonCommand: options.pythonCommand,
  })
  await mkdir(input.outputDirectory, { recursive: true, mode: 0o700 })
  await chmod(input.outputDirectory, 0o700)
  const runtimeDirectory = await mkdtemp(path.join(input.outputDirectory, '.faster-whisper-runtime-'))
  await chmod(runtimeDirectory, 0o700)
  try {
    const pipelineResult = await runSpeechCaptionExecutionPipeline({
      mode: 'local_dev',
      workspaceId: input.plan.workspaceId,
      projectId: input.plan.editReferenceId,
      mediaAssetId: `${input.plan.source.privateMediaArtifactId}-${input.workItem.chunkId}`,
      sourceAudioArtifactId: privateStudyAudioArtifactId(dependency),
      sourceAudioLocalPath,
      outputDirectory: runtimeDirectory,
      modelWeightManifestId: reviewedRuntime.modelManifestId,
      modelName: reviewedRuntime.modelName,
      modelVersion: reviewedRuntime.modelVersion,
      localModelPath: options.localModelPath,
      language: options.language,
      device: options.device ?? 'auto',
      computeType: options.computeType,
      wordTimestamps: true,
      vadFilter: true,
      beamSize: options.beamSize,
      timeoutMs: options.timeoutMs ?? 2 * 60 * 60 * 1_000,
      enableRealTranscription: true,
      allowModelDownload: false,
      pythonCommand: options.pythonCommand,
      enableCaptionPreview: false,
      buildSpeech: true,
      buildCaptions: false,
    })
    const observedWallClockMs = Math.max(1, Number((process.hrtime.bigint() - started) / 1_000_000n))
    const prepared = await preparePrivateTranscriptArtifact(
      input,
      pipelineResult,
      'reviewed_local',
      reviewedRuntime,
    )
    return buildEditReferenceLongFormSpeechTranscriptOutput({
      input,
      pipelineResult,
      prepared,
      authority: 'reviewed_local',
      usage: createUnmeteredEditReferenceLongFormStudyUsage({
        mode: 'backend_local_unmetered',
        observedWallClockMs,
        inputMediaSeconds: input.workItem.sourceCoverageEndSeconds - input.workItem.sourceCoverageStartSeconds,
        outputBytes: prepared.artifact.sizeBytes,
      }),
    })
  } finally {
    await rm(runtimeDirectory, { recursive: true, force: true })
  }
}

export async function executeControlledEditReferenceLongFormSpeechTranscriptStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  options: ExecuteControlledEditReferenceLongFormSpeechTranscriptStageOptions,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  const dependency = requireStudyAudioDependency(input)
  const sourceAudioLocalPath = requireStudyAudioLocalPath(input, dependency)
  await assertPrivateStudyAudioFile(sourceAudioLocalPath)
  const started = process.hrtime.bigint()
  const runner = options.pipelineRunner ?? runSpeechCaptionExecutionPipeline
  const pipelineResult = await runner({
    mode: 'local_dev',
    workspaceId: input.plan.workspaceId,
    projectId: input.plan.editReferenceId,
    mediaAssetId: `${input.plan.source.privateMediaArtifactId}-${input.workItem.chunkId}`,
    sourceAudioArtifactId: privateStudyAudioArtifactId(dependency),
    sourceAudioLocalPath,
    outputDirectory: input.outputDirectory,
    modelWeightManifestId: 'faster_whisper_model',
    modelName: options.modelName,
    localModelPath: options.localModelPath,
    language: options.language,
    device: options.device ?? 'auto',
    computeType: options.computeType,
    wordTimestamps: true,
    vadFilter: true,
    beamSize: options.beamSize,
    timeoutMs: options.timeoutMs ?? 2 * 60 * 60 * 1_000,
    enableRealTranscription: true,
    allowModelDownload: false,
    fasterWhisperCommand: options.fasterWhisperCommand,
    pythonCommand: options.pythonCommand,
    enableCaptionPreview: false,
    buildSpeech: true,
    buildCaptions: false,
  })
  const observedWallClockMs = Math.max(1, Number((process.hrtime.bigint() - started) / 1_000_000n))
  const prepared = await preparePrivateTranscriptArtifact(input, pipelineResult, 'controlled_test')
  return buildEditReferenceLongFormSpeechTranscriptOutput({
    input,
    pipelineResult,
    prepared,
    authority: 'controlled_test',
    usage: createUnmeteredEditReferenceLongFormStudyUsage({
      mode: 'controlled_test_unmetered',
      observedWallClockMs,
      inputMediaSeconds: input.workItem.sourceCoverageEndSeconds - input.workItem.sourceCoverageStartSeconds,
      outputBytes: prepared.artifact.sizeBytes,
    }),
  })
}

/**
 * Adapts a completed result from the shared speech-caption worker into the
 * long-form Edit Reference output. Production callers must provide a
 * production-ready shared-worker result and settled integer-micro internal
 * cost evidence. This function never calls a provider or mutates credits.
 */
export async function buildEditReferenceLongFormSpeechTranscriptStageOutput(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  options: BuildEditReferenceLongFormSpeechTranscriptStageOutputOptions,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  const prepared = await preparePrivateTranscriptArtifact(input, options.pipelineResult, options.authority)
  return buildEditReferenceLongFormSpeechTranscriptOutput({
    input,
    pipelineResult: options.pipelineResult,
    prepared,
    authority: options.authority,
    usage: options.usage,
  })
}

async function buildEditReferenceLongFormSpeechTranscriptOutput(input: {
  readonly input: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly pipelineResult: SpeechCaptionExecutionPipelineResult
  readonly prepared: PreparedPrivateTranscriptArtifact
  readonly authority: EditReferenceLongFormSpeechTranscriptRuntimeAuthority
  readonly usage: EditReferenceLongFormStudyUsageEvidence
}): Promise<EditReferenceLongFormStudyWorkOutput> {
  const dependency = requireStudyAudioDependency(input.input)
  validateEditReferenceLongFormStudyUsage(input.usage)
  if (input.usage.outputBytes !== input.prepared.artifact.sizeBytes) {
    throw new Error('Speech transcript cost evidence does not match its exact private output bytes.')
  }
  const production = input.authority === 'production'
  const reviewedLocal = input.authority === 'reviewed_local'
  const expectedUsageMode = production
    ? 'production_metered'
    : reviewedLocal
      ? 'backend_local_unmetered'
      : 'controlled_test_unmetered'
  if (input.usage.mode !== expectedUsageMode) {
    throw new Error('Speech transcript runtime authority does not match its internal-cost authority.')
  }
  if (production && !input.usage.productionCostAuthoritySatisfied) {
    throw new Error('Production speech transcript requires settled internal-cost authority.')
  }
  const transcript = input.pipelineResult.transcript
  if (!transcript) throw new Error('Shared speech worker completed without a transcript payload.')
  const words = transcript.segments.flatMap((segment) => segment.words)
  const speechPresent = transcript.segments.length > 0
  const result = {
    kind: 'speech_transcript' as const,
    sourceAudioOutputDigestSha256: dependency.outputDigestSha256,
    privateTranscriptArtifactId: input.prepared.privateTranscriptArtifactId,
    transcriptArtifactChecksumSha256: input.prepared.artifact.checksumSha256,
    speechPresent,
    segmentCount: transcript.segments.length,
    wordCount: words.length,
    segmentTimingRanges: speechPresent
      ? transcript.segments.map((segment, index) => ({
        segmentOrdinal: index + 1,
        sourceStartSeconds: rounded(input.input.workItem.sourceCoverageStartSeconds + segment.startSeconds),
        sourceEndSeconds: rounded(input.input.workItem.sourceCoverageStartSeconds + segment.endSeconds),
        wordCount: segment.words.length,
      }))
      : [],
    languageCode: normalizeLanguageCode(transcript.language),
    confidence: boundedConfidence(transcript.confidence),
    segmentTimingCoverageRatio: 1 as const,
    wordTimingMode: speechPresent ? 'exact' as const : 'not_available' as const,
    speakerSegmentationMode: 'not_requested' as const,
    fullCoreCoverage: true as const,
    transcriptTextPersistedInWorkOutput: false as const,
    rawAudioPersisted: false as const,
    interpolatedWordTimingUsed: false as const,
  }
  return createEditReferenceLongFormStudyWorkOutput({
    runId: input.input.runId,
    planId: input.input.plan.planId,
    planDigestSha256: input.input.plan.planDigestSha256,
    workItemId: input.input.workItem.workItemId,
    stageId: result.kind,
    chunkId: input.input.workItem.chunkId,
    privateMediaArtifactId: input.input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.input.plan.source.mediaChecksumSha256,
    sourceCoverageStartSeconds: input.input.workItem.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: input.input.workItem.sourceCoverageEndSeconds,
    toolIds: input.authority === 'controlled_test' ? ['controlled_specialist_fixture'] : ['faster_whisper'],
    artifacts: [input.prepared.artifact],
    result,
    runtimeSource: production ? 'verified_live' : reviewedLocal ? 'verified_local' : 'verified_mock',
    completionAuthority: input.authority === 'controlled_test' ? 'controlled_mock' : 'authoritative',
    usage: input.usage,
    originalRemainsImmutable: true,
    rawProcessOutputPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
    createdAt: input.input.createdAt,
  })
}

interface PreparedPrivateTranscriptArtifact {
  readonly artifact: EditReferenceLongFormStudyOutputArtifact
  readonly privateTranscriptArtifactId: string
}

async function preparePrivateTranscriptArtifact(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  pipelineResult: SpeechCaptionExecutionPipelineResult,
  authority: EditReferenceLongFormSpeechTranscriptRuntimeAuthority,
  reviewedRuntime?: EditReferenceReviewedLocalFasterWhisperRuntimeReceipt,
): Promise<PreparedPrivateTranscriptArtifact> {
  validateSharedSpeechResult(input, pipelineResult, authority, reviewedRuntime)
  const transcript = pipelineResult.transcript
  if (!transcript) throw new Error('Shared speech worker did not return its validated transcript.')
  const coreStart = input.workItem.sourceCoverageStartSeconds
  const privatePayload = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_PRIVATE_TRANSCRIPT_VERSION,
    untrustedSourceText: true,
    runId: input.runId,
    workItemId: input.workItem.workItemId,
    chunkId: input.workItem.chunkId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceAudioOutputDigestSha256: requireStudyAudioDependency(input).outputDigestSha256,
    sourceCoverageStartSeconds: input.workItem.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: input.workItem.sourceCoverageEndSeconds,
    languageCode: normalizeLanguageCode(transcript.language),
    confidence: boundedConfidence(transcript.confidence),
    model: {
      toolId: transcript.modelInfo.toolId,
      modelName: safeOptionalModelName(transcript.modelInfo.modelName),
      modelVersion: safeOptionalIdentifier(transcript.modelInfo.modelVersion),
      modelWeightManifestId: safeOptionalIdentifier(transcript.modelInfo.modelWeightManifestId),
    },
    reviewedLocalRuntime: reviewedRuntime ? {
      runtimeId: reviewedRuntime.runtimeId,
      receiptVersion: reviewedRuntime.receiptVersion,
      packageName: reviewedRuntime.packageName,
      packageVersion: reviewedRuntime.packageVersion,
      runtimeKind: reviewedRuntime.runtimeKind,
      modelName: reviewedRuntime.modelName,
      modelVersion: reviewedRuntime.modelVersion,
      modelManifestId: reviewedRuntime.modelManifestId,
      manifestVersion: reviewedRuntime.manifestVersion,
      manifestDigestSha256: reviewedRuntime.manifestDigestSha256,
      modelDirectorySha256: reviewedRuntime.modelDirectorySha256,
      license: reviewedRuntime.license,
      commercialUseStatus: reviewedRuntime.commercialUseStatus,
      approvedForInternalTesting: reviewedRuntime.approvedForInternalTesting,
      allowModelDownload: false,
      providerCallMade: false,
      externalUrlFetched: false,
      localPathsPersisted: false,
      productionReady: false,
    } : null,
    segments: transcript.segments.map((segment) => ({
      segmentId: segment.segmentId,
      startSeconds: rounded(coreStart + segment.startSeconds),
      endSeconds: rounded(coreStart + segment.endSeconds),
      text: segment.text,
      confidence: segment.confidence === undefined ? null : boundedConfidence(segment.confidence),
      words: segment.words.map((word) => ({
        word: word.word,
        startSeconds: rounded(coreStart + word.startSeconds),
        endSeconds: rounded(coreStart + word.endSeconds),
        confidence: word.confidence === undefined ? null : boundedConfidence(word.confidence),
      })),
    })),
    rawAudioPersisted: false,
    rawProcessOutputPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
  const bytes = Buffer.from(`${JSON.stringify(privatePayload)}\n`, 'utf8')
  if (bytes.length > 32 * 1024 * 1024) {
    throw new Error('Private transcript artifact exceeds the bounded section output size.')
  }
  const checksumSha256 = sha256(bytes)
  const outputPath = assertOutputPathInsideRoot(
    path.join(input.outputDirectory, 'private-transcript.json'),
    input.outputDirectory,
  )
  await writeOrRecoverExactPrivateArtifact(outputPath, bytes)
  const stat = await lstat(outputPath)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== bytes.length) {
    throw new Error('Private transcript artifact failed its exact file identity check.')
  }
  return {
    privateTranscriptArtifactId: `private-transcript-${sha256([
      input.runId,
      input.workItem.workItemId,
      checksumSha256,
    ].join(':')).slice(0, 24)}`,
    artifact: {
      role: 'private_transcript',
      storageObjectPath: 'private-transcript.json',
      contentType: 'application/json',
      sizeBytes: stat.size,
      checksumSha256,
    },
  }
}

function validateSharedSpeechResult(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  result: SpeechCaptionExecutionPipelineResult,
  authority: EditReferenceLongFormSpeechTranscriptRuntimeAuthority,
  reviewedRuntime?: EditReferenceReviewedLocalFasterWhisperRuntimeReceipt,
): void {
  const expectedMode = authority === 'production' ? 'production_ready' : 'local_dev'
  if (
    input.workItem.stageId !== 'speech_transcript'
    || !input.workItem.chunkId
    || result.mode !== expectedMode
    || result.status !== 'completed'
    || result.skippedReasons.length !== 0
    || !result.transcript
    || result.transcript.modelInfo.toolId !== 'faster_whisper'
    || result.transcript.sourceAudioArtifactId !== privateStudyAudioArtifactId(requireStudyAudioDependency(input))
    || (authority === 'production' && result.modelWeightStatus !== 'approved')
    || result.qaResults.some((gate) => gate.blocking || gate.status === 'blocked' || gate.status === 'failed')
  ) throw new Error('Shared speech worker result is incomplete, skipped, mocked, or lacks required authority.')

  if (authority === 'reviewed_local') {
    if (
      !reviewedRuntime
      || result.modelWeightStatus !== 'needs_review'
      || result.blocksFinalExport !== true
      || result.blocksPreview
      || result.transcript.modelInfo.modelName !== reviewedRuntime.modelName
      || result.transcript.modelInfo.modelVersion !== reviewedRuntime.modelVersion
      || result.transcript.modelInfo.modelWeightManifestId !== reviewedRuntime.modelManifestId
      || !result.wordTimestamps
      || result.wordTimestamps.sourceAudioArtifactId !== result.transcript.sourceAudioArtifactId
      || result.wordTimestamps.modelInfo.modelName !== reviewedRuntime.modelName
      || result.wordTimestamps.modelInfo.modelVersion !== reviewedRuntime.modelVersion
      || result.wordTimestamps.modelInfo.modelWeightManifestId !== reviewedRuntime.modelManifestId
      || result.wordTimestamps.words.length !== result.transcript.segments.flatMap((segment) => segment.words).length
      || result.transcriptArtifacts.filter((artifact) => artifact.artifactType === 'transcript_json').length !== 1
      || result.transcriptArtifacts.filter((artifact) => artifact.artifactType === 'word_timestamps_json').length !== 1
      || result.captionSegments.length !== 0
      || result.captionFiles.length !== 0
    ) throw new Error('Reviewed local speech worker result lacks exact runtime, model, or export-block authority.')
  } else if (reviewedRuntime) {
    throw new Error('Reviewed local speech runtime evidence was attached to another authority mode.')
  } else if (result.blocksFinalExport) {
    throw new Error('Shared speech worker result remains blocked for this authority mode.')
  }

  const duration = input.workItem.sourceCoverageEndSeconds - input.workItem.sourceCoverageStartSeconds
  const segments = result.transcript.segments
  let previousEnd = 0
  for (const segment of segments) {
    if (
      !safeIdentifier(segment.segmentId)
      || !segment.text.trim()
      || !Number.isFinite(segment.startSeconds)
      || !Number.isFinite(segment.endSeconds)
      || segment.startSeconds < 0
      || segment.endSeconds <= segment.startSeconds
      || segment.endSeconds > duration + 0.25
      || segment.startSeconds < previousEnd - 0.001
      || segment.words.length < 1
    ) throw new Error('Shared speech transcript segment timing or content is invalid.')
    previousEnd = segment.endSeconds
    let previousWordEnd = segment.startSeconds
    for (const word of segment.words) {
      if (
        !word.word.trim()
        || !Number.isFinite(word.startSeconds)
        || !Number.isFinite(word.endSeconds)
        || word.startSeconds < segment.startSeconds - 0.001
        || word.endSeconds > segment.endSeconds + 0.001
        || word.endSeconds <= word.startSeconds
        || word.startSeconds < previousWordEnd - 0.001
      ) throw new Error('Shared speech transcript word timing is invalid or interpolated.')
      previousWordEnd = word.endSeconds
    }
  }
  if (segments.length === 0 && result.transcript.fullText.trim()) {
    throw new Error('Shared speech transcript has text without timed segments.')
  }
}

function requireStudyAudioDependency(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
): EditReferenceLongFormStudyWorkOutput {
  const dependency = input.dependencyOutputs.find((candidate) => (
    candidate.stageId === 'audio_extract' && candidate.chunkId === input.workItem.chunkId
  ))
  if (!dependency || dependency.result.kind !== 'audio_extract') {
    throw new Error('Speech transcript requires the exact completed study-audio output.')
  }
  const dependencyItem = input.run.workItems.find((candidate) => candidate.workItemId === dependency.workItemId)
  if (
    !dependencyItem
    || !input.workItem.dependencyWorkItemIds.includes(dependency.workItemId)
    || dependencyItem.status !== 'completed'
  ) throw new Error('Speech transcript study-audio dependency is not completed in the exact run checkpoint.')
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan({
    output: dependency,
    plan: input.plan,
    workItem: dependencyItem,
  })
  return dependency
}

function requireStudyAudioLocalPath(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  dependency: EditReferenceLongFormStudyWorkOutput,
): string {
  const artifact = dependency.artifacts.find((candidate) => candidate.role === 'study_audio')
  if (!artifact) throw new Error('Speech transcript study-audio artifact is unavailable.')
  const localPath = input.dependencyArtifactLocalPaths[editReferenceLongFormDependencyArtifactKey(
    dependency.workItemId,
    artifact.storageObjectPath,
  )]
  if (!localPath) throw new Error('Speech transcript private study-audio path is unavailable.')
  return localPath
}

function privateStudyAudioArtifactId(dependency: EditReferenceLongFormStudyWorkOutput): string {
  return `study-audio-${sha256(`${dependency.workItemId}:${dependency.outputDigestSha256}`).slice(0, 24)}`
}

async function assertPrivateStudyAudioFile(file: string): Promise<void> {
  const stat = await lstat(file)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0) {
    throw new Error('Speech transcript private study-audio file is missing, empty, or unsafe.')
  }
}

async function writeOrRecoverExactPrivateArtifact(outputPath: string, bytes: Buffer): Promise<void> {
  try {
    const existing = await readFile(outputPath)
    if (!existing.equals(bytes)) throw new Error('A private transcript artifact already exists with different content.')
    return
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) throw error
  }
  const partial = `${outputPath}.${process.pid}.${sha256(bytes).slice(0, 12)}.partial`
  await rm(partial, { force: true })
  await writeFile(partial, bytes, { mode: 0o600, flag: 'wx' })
  await chmod(partial, 0o600)
  try {
    await link(partial, outputPath)
  } catch (error) {
    if (!isNodeError(error, 'EEXIST')) throw error
    const existing = await readFile(outputPath)
    if (!existing.equals(bytes)) {
      throw new Error('A concurrent private transcript artifact has different content.', { cause: error })
    }
  } finally {
    await rm(partial, { force: true })
  }
  await chmod(outputPath, 0o600)
}

function normalizeLanguageCode(value: string | undefined): string | null {
  if (!value) return null
  return /^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(value) ? value : null
}

function safeOptionalIdentifier(value: string | undefined): string | null {
  return value && safeIdentifier(value) ? value : null
}

function safeOptionalModelName(value: string | undefined): string | null {
  return value
    && /^[A-Za-z0-9][A-Za-z0-9._/-]{0,239}$/.test(value)
    && !value.includes('..')
    && !value.startsWith('/')
    ? value
    : null
}

function safeIdentifier(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)
}

function boundedConfidence(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('Shared speech transcript confidence is invalid.')
  }
  return Number(value.toFixed(4))
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function isNodeError(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}
