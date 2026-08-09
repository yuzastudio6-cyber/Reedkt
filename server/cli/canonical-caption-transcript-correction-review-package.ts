import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import { z } from 'zod'

import {
  parseCaptionPrivateLocalTranscriptExecutionEvidence,
  parseCaptionPrivateTranscriptInspectionReceipt,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  createCanonicalCaptionTranscriptCorrectionCandidate,
  createCanonicalCaptionTranscriptCorrectionReviewPackage,
  parseCanonicalCaptionTranscriptCorrectionCandidate,
  parseCanonicalCaptionTranscriptCorrectionReviewPackage,
} from '../services/canonical-caption-transcript-correction-review-package'

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const candidateClassSchema = z.enum([
  'offline_asr_baseline_unapproved',
  'offline_asr_hotwords_unapproved',
  'offline_asr_terminology_aware_unapproved',
])
const rawCandidateSchema = z.object({
  candidateClass: candidateClassSchema,
  independentAudioTruth: z.literal(false),
  language: z.string().min(1).max(64),
  languageProbability: z.number().min(0).max(1),
  duration: z.number().positive().max(86_400),
  segments: z.array(z.object({
    id: z.string().min(1).max(128),
    start: z.number().nonnegative().max(86_400),
    end: z.number().positive().max(86_400),
    text: z.string().trim().min(1).max(20_000),
    avgLogprob: z.number().nullable(),
    words: z.array(z.object({
      text: z.string().trim().min(1).max(4_000),
      start: z.number().nonnegative().max(86_400),
      end: z.number().positive().max(86_400),
      probability: z.number().min(0).max(1).nullable(),
    }).strict()).min(1).max(100_000),
  }).strict()).min(1).max(20_000),
}).strict()
const modelManifestSchema = z.object({
  manifestVersion: z.literal(
    'reeditpro-internal-testing-faster-whisper-model-v1'),
  toolId: z.literal('faster_whisper'),
  modelName: z.string().min(1).max(240),
  modelVersion: z.string().min(1).max(240),
  localModelPath: z.string().min(1),
  allowModelDownload: z.literal(false),
  modelDirectorySha256: sha256,
}).passthrough()

assert.equal(process.env.REEDITPRO_CONFIRM_CAPTION_TRANSCRIPT_REVIEW_PACKAGE,
  'true', 'Private transcript review package creation requires confirmation.')

const sourceTranscriptPath = requiredPath(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_SOURCE_TRANSCRIPT_PATH')
const rejectedInspectionPath = requiredPath(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_REJECTED_INSPECTION_PATH')
const executionEvidencePath = requiredPath(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_EXECUTION_EVIDENCE_PATH')
const modelManifestPath = requiredPath(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_MODEL_MANIFEST_PATH')
const candidatePaths = required(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_CANDIDATE_PATHS')
  .split(';').map((item) => resolve(item.trim())).filter(Boolean)
assert.ok(candidatePaths.length > 0 && candidatePaths.length <= 16,
  'One to sixteen private candidate paths are required.')
assert.equal(new Set(candidatePaths).size, candidatePaths.length,
  'Private candidate paths must be unique.')

const outputRoot = resolve(required(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_OUTPUT_ROOT'))
assert.equal(outputRoot === process.cwd()
  || outputRoot.startsWith(`${process.cwd()}/`), false,
  'Private transcript review output must remain outside the repository.')
const createdAt = z.string().datetime({ offset: true }).parse(required(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_CREATED_AT'))
const ownerUserId = required(
  'REEDITPRO_CAPTION_TRANSCRIPT_REVIEW_OWNER_USER_ID')

const [transcriptBytes, inspectionBytes, executionBytes, modelManifestBytes] =
  await Promise.all([
    readFile(sourceTranscriptPath),
    readFile(rejectedInspectionPath),
    readFile(executionEvidencePath),
    readFile(modelManifestPath),
  ])
const transcript = parseCaptionCanonicalTranscript(JSON.parse(
  transcriptBytes.toString('utf8')))
const inspection = parseCaptionPrivateTranscriptInspectionReceipt(JSON.parse(
  inspectionBytes.toString('utf8')))
const execution = parseCaptionPrivateLocalTranscriptExecutionEvidence(JSON.parse(
  executionBytes.toString('utf8')))
const modelManifest = modelManifestSchema.parse(JSON.parse(
  modelManifestBytes.toString('utf8')))

assert.equal(inspection.disposition,
  'rejected_requires_reviewed_correction_or_canonical_owner')
assert.equal(execution.canonicalTranscriptRef.id, transcript.transcriptId)
assert.equal(execution.canonicalTranscriptRef.contentHash,
  transcript.transcriptDigestSha256)
assert.equal(execution.modelManifestRef.version, modelManifest.manifestVersion)
assert.equal(execution.modelManifestRef.contentHash,
  hashBytes(modelManifestBytes))

const rawCandidates = await Promise.all(candidatePaths.map(async (path) => ({
  path,
  bytes: await readFile(path),
})))
const candidates = rawCandidates.map(({ bytes }) => {
  const raw = rawCandidateSchema.parse(JSON.parse(bytes.toString('utf8')))
  const candidateId = `caption.transcript.correction.candidate.${
    hashBytes(bytes).slice(0, 32)}`
  return createCanonicalCaptionTranscriptCorrectionCandidate({
    candidateId,
    candidateClass: raw.candidateClass,
    sourceMediaRef: execution.sourceMediaRef,
    modelManifestRef: execution.modelManifestRef,
    languageCode: raw.language,
    segments: raw.segments.map((segment, segmentIndex) => ({
      candidateSegmentId: `${candidateId}.segment.${segmentIndex + 1}`,
      startMilliseconds: toMilliseconds(segment.start),
      endMillisecondsExclusive: toMilliseconds(segment.end),
      text: segment.text,
      words: segment.words.map((word) => ({
        text: word.text,
        startMilliseconds: toMilliseconds(word.start),
        endMillisecondsExclusive: toMilliseconds(word.end),
        confidenceBasisPoints: Math.round((word.probability ?? 0) * 10_000),
      })),
    })),
  })
})
const reviewPackage = createCanonicalCaptionTranscriptCorrectionReviewPackage({
  reviewScope: {
    ownerUserId,
    workspaceId: transcript.workspaceId,
    projectId: transcript.projectId,
    editSessionId: transcript.editSessionId,
  },
  targetCanonicalReadScope: null,
  sourceMediaRef: execution.sourceMediaRef,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: inspection,
  candidates,
  createdAt,
})

const candidateRoot = join(outputRoot, 'candidates')
const packageRoot = join(outputRoot, 'review-packages')
await Promise.all([
  mkdir(candidateRoot, { recursive: true }),
  mkdir(packageRoot, { recursive: true }),
])
await Promise.all(candidates.map(async (candidate) => {
  const path = join(candidateRoot, `${candidate.candidateDigestSha256}.json`)
  await persistCreateOnly(path, candidate)
  const reread = parseCanonicalCaptionTranscriptCorrectionCandidate(JSON.parse(
    await readFile(path, 'utf8')))
  assert.equal(reread.candidateDigestSha256, candidate.candidateDigestSha256)
}))
const packagePath = join(packageRoot,
  `${reviewPackage.packageDigestSha256}.json`)
await persistCreateOnly(packagePath, reviewPackage)
const packageReread = parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  JSON.parse(await readFile(packagePath, 'utf8')), {
    transcript,
    inspection,
    candidates,
  })
assert.equal(packageReread.packageDigestSha256,
  reviewPackage.packageDigestSha256)

console.log(JSON.stringify({
  status: 'created_waiting_for_independent_audio_truth_review',
  packageRef: {
    id: reviewPackage.packageId,
    version: reviewPackage.schemaVersion,
    contentHash: reviewPackage.packageDigestSha256,
  },
  sourceTranscriptRef: reviewPackage.sourceTranscriptRef,
  rejectedInspectionReceiptRef: reviewPackage.rejectedInspectionReceiptRef,
  candidateRefs: reviewPackage.candidateRefs,
  reviewItems: reviewPackage.reviewItems.length,
  itemsWithTextDisagreement: reviewPackage.reviewItems.filter((item) =>
    item.discrepancyCodes.includes('candidate_text_disagreement')).length,
  itemsWithTimingDisagreement: reviewPackage.reviewItems.filter((item) =>
    item.discrepancyCodes.includes('candidate_timing_disagreement')).length,
  itemsRequiringBrandReview: reviewPackage.reviewItems.filter((item) =>
    item.discrepancyCodes.includes('product_or_brand_review_required')).length,
  itemsRequiringClaimReview: reviewPackage.reviewItems.filter((item) =>
    item.discrepancyCodes.includes(
      'claim_sensitive_number_review_required')).length,
  disposition: reviewPackage.disposition,
  completeSourceAudioListened: false,
  correctionArtifactCreated: false,
  canonicalOwnerAdmissionAllowed: false,
  modelDownloadPerformed: false,
  providerCallMade: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

async function persistCreateOnly(path: string, value: unknown): Promise<void> {
  const bytes = `${JSON.stringify(value)}\n`
  try {
    await writeFile(path, bytes, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  } catch (error) {
    const record = error as NodeJS.ErrnoException
    if (record.code !== 'EEXIST') throw error
    assert.equal(await readFile(path, 'utf8'), bytes,
      `Create-only private evidence changed: ${basename(path)}`)
  }
}

function toMilliseconds(seconds: number): number {
  return Math.round(seconds * 1_000)
}

function required(name: string): string {
  const value = process.env[name]?.trim()
  assert.ok(value, `${name} is required.`)
  return value
}

function requiredPath(name: string): string {
  return resolve(required(name))
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
