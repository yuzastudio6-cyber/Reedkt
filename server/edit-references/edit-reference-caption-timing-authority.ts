import { createHash } from 'node:crypto'
import { chmod, lstat, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import {
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import type {
  EditReferenceLongFormStudyPlan,
  EditReferenceLongFormStudyWorkItem,
} from './edit-reference-long-form-study-contract'

export const EDIT_REFERENCE_PRIVATE_CAPTION_TIMING_VERSION =
  'edit-reference-private-caption-timing-v1' as const

const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const MAX_PRIVATE_TRANSCRIPT_BYTES = 32 * 1024 * 1024
const SHA256_PATTERN = /^[a-f0-9]{64}$/

const privateTranscriptSchema = z.object({
  schemaVersion: z.literal('edit-reference-long-form-private-transcript-v1'),
  untrustedSourceText: z.literal(true),
  runId: z.string().min(1).max(200),
  workItemId: z.string().min(1).max(200),
  chunkId: z.string().min(1).max(200),
  privateMediaArtifactId: z.string().min(1).max(200),
  mediaChecksumSha256: z.string().regex(SHA256_PATTERN),
  sourceAudioOutputDigestSha256: z.string().regex(SHA256_PATTERN),
  sourceCoverageStartSeconds: z.number().finite().nonnegative(),
  sourceCoverageEndSeconds: z.number().finite().positive(),
  languageCode: z.string().min(1).max(32).nullable(),
  confidence: z.number().min(0).max(1),
  model: z.object({
    toolId: z.literal('faster_whisper'),
    modelName: z.string().min(1).max(240).nullable(),
    modelVersion: z.string().min(1).max(240).nullable(),
    modelWeightManifestId: z.string().min(1).max(240).nullable(),
  }).strict(),
  reviewedLocalRuntime: z.object({
    runtimeId: z.string().min(1).max(240),
    receiptVersion: z.string().min(1).max(240),
    packageName: z.literal('faster-whisper'),
    packageVersion: z.string().min(1).max(80),
    runtimeKind: z.string().min(1).max(120),
    modelName: z.string().min(1).max(240),
    modelVersion: z.string().min(1).max(240),
    modelManifestId: z.string().min(1).max(240),
    manifestVersion: z.string().min(1).max(240),
    manifestDigestSha256: z.string().regex(SHA256_PATTERN),
    modelDirectorySha256: z.string().regex(SHA256_PATTERN),
    license: z.string().min(1).max(240),
    commercialUseStatus: z.string().min(1).max(120),
    approvedForInternalTesting: z.literal(true),
    allowModelDownload: z.literal(false),
    providerCallMade: z.literal(false),
    externalUrlFetched: z.literal(false),
    localPathsPersisted: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  segments: z.array(z.object({
    segmentId: z.string().min(1).max(240),
    startSeconds: z.number().finite().nonnegative(),
    endSeconds: z.number().finite().positive(),
    text: z.string().min(1).max(20_000),
    confidence: z.number().min(0).max(1).nullable(),
    words: z.array(z.object({
      word: z.string().min(1).max(1_000),
      startSeconds: z.number().finite().nonnegative(),
      endSeconds: z.number().finite().positive(),
      confidence: z.number().min(0).max(1).nullable(),
    }).strict()).min(1).max(10_000),
  }).strict()).min(1).max(1_000),
  rawAudioPersisted: z.literal(false),
  rawProcessOutputPersisted: z.literal(false),
  signedUrlPersisted: z.literal(false),
  localFilePathPersisted: z.literal(false),
  customerPriceCalculated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  serviceFeeIncluded: z.literal(false),
}).strict()

type EditReferencePrivateTranscript = z.infer<typeof privateTranscriptSchema>

export interface EditReferencePrivateCaptionTimingArtifact {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRIVATE_CAPTION_TIMING_VERSION
  readonly privateTranscriptArtifactId: string
  readonly transcriptChecksumSha256: string
  readonly privateWordTimingArtifactId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly sourceCoverageStartSeconds: number
  readonly sourceCoverageEndSeconds: number
  readonly transcriptRuntimeSource: 'verified_local'
  readonly transcriptRuntimeId: string
  readonly transcriptRuntimeVersion: string
  readonly transcriptModelManifestId: string
  readonly transcriptExecutionId: string
  readonly transcriptQaStatus: 'passed'
  readonly segmentTimingAuthorityVerified: true
  readonly wordTimingAuthorityVerified: true
  readonly transcriptSegmentCount: number
  readonly alignedWordCount: number
  readonly segments: readonly {
    readonly segmentOrdinal: number
    readonly startSeconds: number
    readonly endSeconds: number
    readonly wordCount: number
    readonly words: readonly {
      readonly wordOrdinal: number
      readonly startSeconds: number
      readonly endSeconds: number
    }[]
  }[]
  readonly rawTranscriptTextIncluded: false
  readonly rawTranscriptTextPersisted: false
  readonly interpolatedWordTimingUsed: false
  readonly providerCallMade: false
  readonly remoteMutationMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly productionReady: false
}

const privateCaptionTimingArtifactSchema = z.object({
  schemaVersion: z.literal(EDIT_REFERENCE_PRIVATE_CAPTION_TIMING_VERSION),
  privateTranscriptArtifactId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/),
  transcriptChecksumSha256: z.string().regex(SHA256_PATTERN),
  privateWordTimingArtifactId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/),
  privateMediaArtifactId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/),
  mediaChecksumSha256: z.string().regex(SHA256_PATTERN),
  sourceCoverageStartSeconds: z.number().finite().nonnegative(),
  sourceCoverageEndSeconds: z.number().finite().positive(),
  transcriptRuntimeSource: z.literal('verified_local'),
  transcriptRuntimeId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/),
  transcriptRuntimeVersion: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/),
  transcriptModelManifestId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/),
  transcriptExecutionId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/),
  transcriptQaStatus: z.literal('passed'),
  segmentTimingAuthorityVerified: z.literal(true),
  wordTimingAuthorityVerified: z.literal(true),
  transcriptSegmentCount: z.number().int().min(1).max(1_000),
  alignedWordCount: z.number().int().min(1).max(10_000_000),
  segments: z.array(z.object({
    segmentOrdinal: z.number().int().positive(),
    startSeconds: z.number().finite().nonnegative(),
    endSeconds: z.number().finite().positive(),
    wordCount: z.number().int().min(1).max(10_000),
    words: z.array(z.object({
      wordOrdinal: z.number().int().positive(),
      startSeconds: z.number().finite().nonnegative(),
      endSeconds: z.number().finite().positive(),
    }).strict()).min(1).max(10_000),
  }).strict()).min(1).max(1_000),
  rawTranscriptTextIncluded: z.literal(false),
  rawTranscriptTextPersisted: z.literal(false),
  interpolatedWordTimingUsed: z.literal(false),
  providerCallMade: z.literal(false),
  remoteMutationMade: z.literal(false),
  customerPriceCalculated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export interface EditReferenceCaptionTimingAuthorityReceipt {
  readonly privateTranscriptArtifactId: string
  readonly transcriptChecksumSha256: string
  readonly privateWordTimingArtifactId: string
  readonly wordTimingChecksumSha256: string
  readonly transcriptRuntimeId: string
  readonly transcriptRuntimeVersion: string
  readonly transcriptModelManifestId: string
  readonly transcriptExecutionId: string
  readonly transcriptSegmentCount: number
  readonly alignedWordCount: number
  readonly localFilePath: string
  readonly rawTranscriptTextReadBySanitizer: true
  readonly rawTranscriptTextPersisted: false
  readonly providerCallMade: false
  readonly remoteMutationMade: false
}

export async function createEditReferenceReviewedLocalCaptionTimingAuthority(input: {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly workItem: EditReferenceLongFormStudyWorkItem
  readonly transcriptOutput: EditReferenceLongFormStudyWorkOutput
  readonly privateTranscriptRoot: string
  readonly privateTranscriptLocalPath: string
  readonly outputRoot: string
  /**
   * Optional exact source-time window used by the long-form semantic-window
   * scheduler. Window boundaries must align to whole reviewed-local transcript
   * segments; the emitted no-text timing artifact is rebased to provider-local
   * zero without interpolating or clipping words.
   */
  readonly sourceWindow?: {
    readonly startSeconds: number
    readonly endSeconds: number
    readonly rebaseToZero: true
  }
}): Promise<EditReferenceCaptionTimingAuthorityReceipt> {
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan({
    output: input.transcriptOutput,
    plan: input.plan,
    workItem: input.workItem,
  })
  if (
    input.workItem.stageId !== 'speech_transcript'
    || input.transcriptOutput.result.kind !== 'speech_transcript'
    || input.transcriptOutput.runtimeSource !== 'verified_local'
    || input.transcriptOutput.completionAuthority !== 'authoritative'
    || input.transcriptOutput.result.wordTimingMode !== 'exact'
    || input.transcriptOutput.result.interpolatedWordTimingUsed !== false
    || input.transcriptOutput.providerCallMade
    || input.transcriptOutput.remoteMutationMade
  ) throw new Error('Caption timing requires an authoritative reviewed-local exact-word transcript output.')

  const artifact = input.transcriptOutput.artifacts.find((candidate) => candidate.role === 'private_transcript')
  if (!artifact) throw new Error('Caption timing requires the exact private transcript artifact.')
  const privateTranscriptPath = await validatePrivateFile({
    root: input.privateTranscriptRoot,
    file: input.privateTranscriptLocalPath,
    expectedChecksumSha256: artifact.checksumSha256,
    maximumBytes: MAX_PRIVATE_TRANSCRIPT_BYTES,
    label: 'private transcript',
  })
  const transcriptBytes = await readFile(privateTranscriptPath)
  const parsed = privateTranscriptSchema.parse(JSON.parse(transcriptBytes.toString('utf8')) as unknown)
  assertTranscriptMatchesOutput(input, parsed, artifact.checksumSha256)

  const selected = selectCaptionTimingSegments(parsed, input.sourceWindow)

  const privateWordTimingArtifactId = `private-caption-timing-${sha256([
    input.transcriptOutput.result.privateTranscriptArtifactId,
    artifact.checksumSha256,
    input.transcriptOutput.outputDigestSha256,
    String(selected.sourceCoverageStartSeconds),
    String(selected.sourceCoverageEndSeconds),
  ].join(':')).slice(0, 24)}`
  const timingArtifact: EditReferencePrivateCaptionTimingArtifact = {
    schemaVersion: EDIT_REFERENCE_PRIVATE_CAPTION_TIMING_VERSION,
    privateTranscriptArtifactId: input.transcriptOutput.result.privateTranscriptArtifactId,
    transcriptChecksumSha256: artifact.checksumSha256,
    privateWordTimingArtifactId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceCoverageStartSeconds: selected.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: selected.sourceCoverageEndSeconds,
    transcriptRuntimeSource: 'verified_local',
    transcriptRuntimeId: parsed.reviewedLocalRuntime.runtimeId,
    transcriptRuntimeVersion: parsed.reviewedLocalRuntime.packageVersion,
    transcriptModelManifestId: parsed.reviewedLocalRuntime.modelManifestId,
    transcriptExecutionId: parsed.workItemId,
    transcriptQaStatus: 'passed',
    segmentTimingAuthorityVerified: true,
    wordTimingAuthorityVerified: true,
    transcriptSegmentCount: selected.segments.length,
    alignedWordCount: selected.segments.reduce((sum, segment) => sum + segment.words.length, 0),
    segments: selected.segments.map((segment, segmentIndex) => ({
      segmentOrdinal: segmentIndex + 1,
      startSeconds: rounded(segment.startSeconds - selected.sourceTimeOffsetSeconds),
      endSeconds: rounded(segment.endSeconds - selected.sourceTimeOffsetSeconds),
      wordCount: segment.words.length,
      words: segment.words.map((word, wordIndex) => ({
        wordOrdinal: wordIndex + 1,
        startSeconds: rounded(word.startSeconds - selected.sourceTimeOffsetSeconds),
        endSeconds: rounded(word.endSeconds - selected.sourceTimeOffsetSeconds),
      })),
    })),
    rawTranscriptTextIncluded: false,
    rawTranscriptTextPersisted: false,
    interpolatedWordTimingUsed: false,
    providerCallMade: false,
    remoteMutationMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    productionReady: false,
  }
  validateTimingSequence(timingArtifact)
  const bytes = Buffer.from(`${JSON.stringify(timingArtifact)}\n`, 'utf8')
  const wordTimingChecksumSha256 = sha256(bytes)
  const outputRoot = await validateExternalSdDirectory(input.outputRoot, 'caption timing output root')
  const outputPath = path.join(outputRoot, `private-caption-timing-${privateWordTimingArtifactId.slice(-12)}.json`)
  await writeExactPrivateArtifact(outputPath, bytes)
  return {
    privateTranscriptArtifactId: timingArtifact.privateTranscriptArtifactId,
    transcriptChecksumSha256: timingArtifact.transcriptChecksumSha256,
    privateWordTimingArtifactId,
    wordTimingChecksumSha256,
    transcriptRuntimeId: timingArtifact.transcriptRuntimeId,
    transcriptRuntimeVersion: timingArtifact.transcriptRuntimeVersion,
    transcriptModelManifestId: timingArtifact.transcriptModelManifestId,
    transcriptExecutionId: timingArtifact.transcriptExecutionId,
    transcriptSegmentCount: timingArtifact.transcriptSegmentCount,
    alignedWordCount: timingArtifact.alignedWordCount,
    localFilePath: outputPath,
    rawTranscriptTextReadBySanitizer: true,
    rawTranscriptTextPersisted: false,
    providerCallMade: false,
    remoteMutationMade: false,
  }
}

export function validateEditReferencePrivateCaptionTimingArtifact(
  value: unknown,
): asserts value is EditReferencePrivateCaptionTimingArtifact {
  const parsed = privateCaptionTimingArtifactSchema.safeParse(value)
  if (!parsed.success) throw new Error('Private caption timing artifact crossed its exact no-text authority boundary.')
  validateTimingSequence(parsed.data)
}

function assertTranscriptMatchesOutput(
  input: Parameters<typeof createEditReferenceReviewedLocalCaptionTimingAuthority>[0],
  value: z.infer<typeof privateTranscriptSchema>,
  checksumSha256: string,
): void {
  const result = input.transcriptOutput.result
  if (result.kind !== 'speech_transcript') throw new Error('Caption timing transcript output kind changed.')
  const wordCount = value.segments.reduce((sum, segment) => sum + segment.words.length, 0)
  if (
    value.runId !== input.transcriptOutput.runId
    || value.workItemId !== input.workItem.workItemId
    || value.chunkId !== input.workItem.chunkId
    || value.privateMediaArtifactId !== input.plan.source.privateMediaArtifactId
    || value.mediaChecksumSha256 !== input.plan.source.mediaChecksumSha256
    || value.sourceCoverageStartSeconds !== input.workItem.sourceCoverageStartSeconds
    || value.sourceCoverageEndSeconds !== input.workItem.sourceCoverageEndSeconds
    || value.segments.length !== result.segmentCount
    || wordCount !== result.wordCount
    || checksumSha256 !== input.transcriptOutput.artifacts.find((candidate) => candidate.role === 'private_transcript')?.checksumSha256
    || value.model.toolId !== 'faster_whisper'
    || value.model.modelName !== value.reviewedLocalRuntime.modelName
    || value.model.modelVersion !== value.reviewedLocalRuntime.modelVersion
    || value.model.modelWeightManifestId !== value.reviewedLocalRuntime.modelManifestId
  ) throw new Error('Private transcript bytes do not match their exact reviewed-local work output.')
}

function selectCaptionTimingSegments(
  transcript: EditReferencePrivateTranscript,
  sourceWindow: Parameters<typeof createEditReferenceReviewedLocalCaptionTimingAuthority>[0]['sourceWindow'],
): {
  readonly sourceCoverageStartSeconds: number
  readonly sourceCoverageEndSeconds: number
  readonly sourceTimeOffsetSeconds: number
  readonly segments: EditReferencePrivateTranscript['segments']
} {
  if (!sourceWindow) {
    return {
      sourceCoverageStartSeconds: transcript.sourceCoverageStartSeconds,
      sourceCoverageEndSeconds: transcript.sourceCoverageEndSeconds,
      sourceTimeOffsetSeconds: 0,
      segments: transcript.segments,
    }
  }
  if (
    !Number.isFinite(sourceWindow.startSeconds)
    || !Number.isFinite(sourceWindow.endSeconds)
    || sourceWindow.startSeconds < transcript.sourceCoverageStartSeconds - 0.001
    || sourceWindow.endSeconds > transcript.sourceCoverageEndSeconds + 0.001
    || sourceWindow.endSeconds <= sourceWindow.startSeconds
  ) throw new Error('Caption timing semantic window is outside the exact transcript coverage.')
  const crossingBoundary = transcript.segments.some((segment) => (
    segment.startSeconds < sourceWindow.endSeconds - 0.001
    && segment.endSeconds > sourceWindow.startSeconds + 0.001
    && (
      segment.startSeconds < sourceWindow.startSeconds - 0.001
      || segment.endSeconds > sourceWindow.endSeconds + 0.001
    )
  ))
  if (crossingBoundary) {
    throw new Error('Caption timing semantic window would clip an exact transcript segment.')
  }
  const segments = transcript.segments.filter((segment) => (
    segment.startSeconds >= sourceWindow.startSeconds - 0.001
    && segment.endSeconds <= sourceWindow.endSeconds + 0.001
  ))
  if (segments.length < 1 || segments.some((segment) => segment.words.length < 1)) {
    throw new Error('Caption timing semantic window contains no complete exact transcript segment.')
  }
  return {
    sourceCoverageStartSeconds: 0,
    sourceCoverageEndSeconds: rounded(sourceWindow.endSeconds - sourceWindow.startSeconds),
    sourceTimeOffsetSeconds: sourceWindow.startSeconds,
    segments,
  }
}

function validateTimingSequence(value: EditReferencePrivateCaptionTimingArtifact): void {
  if (
    !Number.isFinite(value.sourceCoverageStartSeconds)
    || !Number.isFinite(value.sourceCoverageEndSeconds)
    || value.sourceCoverageStartSeconds < 0
    || value.sourceCoverageEndSeconds <= value.sourceCoverageStartSeconds
    || !Number.isSafeInteger(value.transcriptSegmentCount)
    || value.transcriptSegmentCount < 1
    || value.transcriptSegmentCount !== value.segments.length
    || !Number.isSafeInteger(value.alignedWordCount)
    || value.alignedWordCount < 1
  ) throw new Error('Private caption timing coverage is invalid.')
  let previousSegmentEnd = value.sourceCoverageStartSeconds
  let observedWords = 0
  for (const [segmentIndex, segment] of value.segments.entries()) {
    if (
      segment.segmentOrdinal !== segmentIndex + 1
      || !Number.isFinite(segment.startSeconds)
      || !Number.isFinite(segment.endSeconds)
      || segment.startSeconds < previousSegmentEnd - 0.001
      || segment.endSeconds <= segment.startSeconds
      || segment.endSeconds > value.sourceCoverageEndSeconds + 0.001
      || segment.wordCount !== segment.words.length
      || segment.words.length < 1
    ) throw new Error('Private caption timing segment sequence is invalid.')
    previousSegmentEnd = segment.endSeconds
    let previousWordEnd = segment.startSeconds
    for (const [wordIndex, word] of segment.words.entries()) {
      if (
        word.wordOrdinal !== wordIndex + 1
        || !Number.isFinite(word.startSeconds)
        || !Number.isFinite(word.endSeconds)
        || word.startSeconds < previousWordEnd - 0.001
        || word.endSeconds <= word.startSeconds
        || word.endSeconds > segment.endSeconds + 0.001
      ) throw new Error('Private caption word timing sequence is invalid.')
      previousWordEnd = word.endSeconds
      observedWords += 1
    }
  }
  if (observedWords !== value.alignedWordCount) {
    throw new Error('Private caption timing word count is inconsistent.')
  }
}

async function validatePrivateFile(input: {
  readonly root: string
  readonly file: string
  readonly expectedChecksumSha256: string
  readonly maximumBytes: number
  readonly label: string
}): Promise<string> {
  const root = await validateExternalSdDirectory(input.root, `${input.label} root`)
  const configured = path.resolve(input.file)
  const fileStat = await lstat(configured)
  if (!fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.size < 1 || fileStat.size > input.maximumBytes) {
    throw new Error(`Caption timing ${input.label} is missing, linked, empty, or oversized.`)
  }
  const resolved = await realpath(configured)
  const relative = path.relative(root, resolved)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Caption timing ${input.label} escaped its private root.`)
  }
  const bytes = await readFile(resolved)
  if (sha256(bytes) !== input.expectedChecksumSha256) {
    throw new Error(`Caption timing ${input.label} checksum changed.`)
  }
  return resolved
}

async function validateExternalSdDirectory(value: string, label: string): Promise<string> {
  const configured = path.resolve(value)
  const fileStat = await lstat(configured)
  if (!fileStat.isDirectory() || fileStat.isSymbolicLink()) {
    throw new Error(`${label} is not a private no-symlink directory.`)
  }
  const resolved = await realpath(configured)
  if (!resolved.startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error(`${label} must remain on the authorized external SD volume.`)
  }
  return resolved
}

async function writeExactPrivateArtifact(outputPath: string, bytes: Buffer): Promise<void> {
  try {
    const existingStat = await lstat(outputPath)
    if (!existingStat.isFile() || existingStat.isSymbolicLink()) {
      throw new Error('Caption timing artifact path is not one private regular file.')
    }
    const existing = await readFile(outputPath)
    if (!existing.equals(bytes)) throw new Error('Caption timing artifact already exists with different bytes.')
    return
  } catch (error) {
    if (!isNodeError(error, 'ENOENT')) throw error
  }
  const partial = `${outputPath}.${process.pid}.${sha256(bytes).slice(0, 12)}.partial`
  await rm(partial, { force: true })
  await writeFile(partial, bytes, { mode: 0o600, flag: 'wx' })
  await chmod(partial, 0o600)
  try {
    await import('node:fs/promises').then(({ link }) => link(partial, outputPath))
  } catch (error) {
    if (!isNodeError(error, 'EEXIST')) throw error
    const existingStat = await lstat(outputPath)
    if (!existingStat.isFile() || existingStat.isSymbolicLink()) {
      throw new Error('Concurrent caption timing artifact path is not one private regular file.', { cause: error })
    }
    const existing = await readFile(outputPath)
    if (!existing.equals(bytes)) throw new Error('Concurrent caption timing artifact differs.', { cause: error })
  } finally {
    await rm(partial, { force: true })
  }
  await chmod(outputPath, 0o600)
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
