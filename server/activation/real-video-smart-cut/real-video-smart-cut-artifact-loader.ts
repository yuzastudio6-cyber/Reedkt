import { execFile } from 'node:child_process'
import { readFile, rm, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { resolvePhase28ArtifactUris, assertApprovedPhase28Object } from './real-video-smart-cut-source-resolver'
import type { RealVideoSmartCutLoadedArtifacts, RealVideoSmartCutNormalizedInput } from './real-video-smart-cut-types'

const execFileAsync = promisify(execFile)

export async function loadPhase28Artifacts(input: {
  workDir: string
}): Promise<RealVideoSmartCutLoadedArtifacts> {
  await rm(input.workDir, { recursive: true, force: true })
  await mkdir(input.workDir, { recursive: true })
  const uris = resolvePhase28ArtifactUris()
  for (const uri of Object.values(uris)) assertApprovedPhase28Object(uri)

  return {
    phase28Report: await downloadJson(uris.phase28Report, path.join(input.workDir, 'phase28-report.json')),
    mediaProbe: await downloadJson(uris.mediaProbe, path.join(input.workDir, 'media-probe.json')),
    transcript: await downloadJson(uris.transcript, path.join(input.workDir, 'transcript.json')),
    wordTimestamps: await downloadJson(uris.wordTimestamps, path.join(input.workDir, 'word-timestamps.json')),
    captionSegments: await downloadJson(uris.captionSegments, path.join(input.workDir, 'caption-segments.json')),
    captionQa: await downloadJson(uris.captionQa, path.join(input.workDir, 'caption-qa.json')),
  }
}

export function normalizePhase28Artifacts(loaded: RealVideoSmartCutLoadedArtifacts): RealVideoSmartCutNormalizedInput {
  const source = readObject(loaded.phase28Report.source)
  const duration = readNumber(source.durationSeconds)
  if (!duration || duration <= 0) throw new Error('Phase 28 source duration is missing or invalid.')

  const transcriptSegments = readArray(loaded.transcript.segments).map((segment, index) => normalizeTranscriptSegment(segment, index))
  const wordTimestamps = readArray(loaded.wordTimestamps.words).map((word, index) => normalizeWord(word, index))
  const captionSegments = readArray(loaded.captionSegments.segments).map((caption, index) => normalizeCaptionSegment(caption, index))
  if (transcriptSegments.length === 0) throw new Error('Phase 28 transcript has no segments.')
  if (wordTimestamps.length === 0) throw new Error('Phase 28 word timestamp artifact has no words.')
  if (captionSegments.length === 0) throw new Error('Phase 28 caption artifact has no segments.')

  return {
    sourceGcsUri: String(source.sourceGcsUri),
    sourceDurationSeconds: duration,
    width: readOptionalNumber(source.width),
    height: readOptionalNumber(source.height),
    transcriptSegments,
    wordTimestamps,
    captionSegments,
    captionArtifactIds: [
      'phase28-caption-segments-json',
      'phase28-captions-srt',
      'phase28-captions-webvtt',
      'phase28-captions-ass',
    ],
    transcriptArtifactIds: [
      'phase28-transcript-json',
      'phase28-word-timestamps-json',
    ],
  }
}

async function downloadJson(gcsUri: string, localPath: string): Promise<Record<string, unknown>> {
  await execFileAsync('gcloud', ['storage', 'cp', gcsUri, localPath], {
    timeout: 2 * 60_000,
    maxBuffer: 8 * 1024 * 1024,
  })
  return JSON.parse(await readFile(localPath, 'utf8')) as Record<string, unknown>
}

function normalizeTranscriptSegment(value: unknown, index: number): RealVideoSmartCutNormalizedInput['transcriptSegments'][number] {
  const object = readObject(value)
  const segmentId = String(object.segmentId ?? object.id ?? `phase28-segment-${index + 1}`)
  const words = readArray(object.words).map((word, wordIndex) => normalizeWord({ ...readObject(word), segmentId }, wordIndex))
  return {
    segmentId,
    startSeconds: readNumber(object.startSeconds ?? object.start),
    endSeconds: readNumber(object.endSeconds ?? object.end),
    text: String(object.text ?? ''),
    words,
    confidence: readOptionalNumber(object.confidence),
  }
}

function normalizeWord(value: unknown, index: number): RealVideoSmartCutNormalizedInput['wordTimestamps'][number] {
  const object = readObject(value)
  return {
    word: String(object.word ?? ''),
    startSeconds: readNumber(object.startSeconds ?? object.start),
    endSeconds: readNumber(object.endSeconds ?? object.end),
    confidence: readOptionalNumber(object.confidence ?? object.probability),
    segmentId: String(object.segmentId ?? `phase28-segment-${index + 1}`),
  }
}

function normalizeCaptionSegment(value: unknown, index: number): RealVideoSmartCutNormalizedInput['captionSegments'][number] {
  const object = readObject(value)
  const startSeconds = readNumber(object.startSeconds ?? object.start)
  const endSeconds = readNumber(object.endSeconds ?? object.end)
  const text = String(object.text ?? '')
  return {
    captionId: String(object.captionId ?? object.id ?? `phase28-caption-${index + 1}`),
    startSeconds,
    endSeconds,
    text,
    lines: readArray(object.lines).map(String),
    words: [],
    styleHints: {
      presetId: 'clean_subtitle',
      placement: 'bottom_safe',
      emphasisWords: [],
    },
  }
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected JSON object.')
  return value as Record<string, unknown>
}

function readArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) return []
  return value
}

function readNumber(value: unknown): number {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) throw new Error(`Expected finite number, received ${String(value)}.`)
  return Number(numberValue.toFixed(6))
}

function readOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  return readNumber(value)
}
