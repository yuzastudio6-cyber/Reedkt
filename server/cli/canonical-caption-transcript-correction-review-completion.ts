import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import type { CanonicalCaptionTranscriptCorrectionReviewerSubmission } from
  '../../src/types/canonical-caption-transcript-correction-review-completion'
import {
  parseCaptionPrivateTranscriptInspectionReceipt,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  parseCanonicalCaptionIndependentAudioTruthReview,
  parseCanonicalCaptionReviewedCorrectionArtifact,
  parseCanonicalCaptionReviewedCorrectionRequest,
} from '../services/canonical-caption-reviewed-transcript-correction'
import {
  parseCanonicalCaptionTranscriptCorrectionCandidate,
  parseCanonicalCaptionTranscriptCorrectionReviewPackage,
} from '../services/canonical-caption-transcript-correction-review-package'
import {
  completeCanonicalCaptionTranscriptCorrectionReview,
  createCanonicalCaptionTranscriptCorrectionReviewerSubmission,
  parseCanonicalCaptionTranscriptCorrectionReviewerSubmission,
  parseCanonicalCaptionTranscriptCorrectionReviewCompletionReceipt,
} from '../services/canonical-caption-transcript-correction-review-completion'

assert.equal(
  process.env.REEDITPRO_CONFIRM_INDEPENDENT_CAPTION_AUDIO_TRUTH_REVIEW,
  'true',
  'Completion requires an explicit independent full-audio review confirmation.',
)

const sourceTranscriptPath = requiredPath(
  'REEDITPRO_CAPTION_REVIEW_COMPLETION_SOURCE_TRANSCRIPT_PATH')
const rejectedInspectionPath = requiredPath(
  'REEDITPRO_CAPTION_REVIEW_COMPLETION_REJECTED_INSPECTION_PATH')
const reviewPackagePath = requiredPath(
  'REEDITPRO_CAPTION_REVIEW_COMPLETION_PACKAGE_PATH')
const reviewerInputPath = requiredPath(
  'REEDITPRO_CAPTION_REVIEW_COMPLETION_REVIEWER_INPUT_PATH')
const candidatePaths = required(
  'REEDITPRO_CAPTION_REVIEW_COMPLETION_CANDIDATE_PATHS')
  .split(';').map((item) => resolve(item.trim())).filter(Boolean)
assert.ok(candidatePaths.length > 0 && candidatePaths.length <= 16,
  'One to sixteen exact private candidate artifacts are required.')
assert.equal(new Set(candidatePaths).size, candidatePaths.length,
  'Private candidate artifact paths must be unique.')

const outputRoot = resolve(required(
  'REEDITPRO_CAPTION_REVIEW_COMPLETION_OUTPUT_ROOT'))
assert.equal(outputRoot === process.cwd()
  || outputRoot.startsWith(`${process.cwd()}/`), false,
  'Private transcript review completion output must remain outside the repo.')

const [transcriptBytes, inspectionBytes, packageBytes, reviewerInputBytes] =
  await Promise.all([
    readFile(sourceTranscriptPath),
    readFile(rejectedInspectionPath),
    readFile(reviewPackagePath),
    readFile(reviewerInputPath),
  ])
const transcript = parseCaptionCanonicalTranscript(JSON.parse(
  transcriptBytes.toString('utf8')))
const inspection = parseCaptionPrivateTranscriptInspectionReceipt(JSON.parse(
  inspectionBytes.toString('utf8')))
const candidates = await Promise.all(candidatePaths.map(async (path) =>
  parseCanonicalCaptionTranscriptCorrectionCandidate(JSON.parse(
    await readFile(path, 'utf8')))))
const reviewPackage = parseCanonicalCaptionTranscriptCorrectionReviewPackage(
  JSON.parse(packageBytes.toString('utf8')), {
    transcript,
    inspection,
    candidates,
  })
const reviewerInput = JSON.parse(reviewerInputBytes.toString('utf8')) as
  Omit<CanonicalCaptionTranscriptCorrectionReviewerSubmission,
  'schemaVersion' | 'submissionDigestSha256'>
const reviewerSubmission =
  createCanonicalCaptionTranscriptCorrectionReviewerSubmission(reviewerInput)
const result = completeCanonicalCaptionTranscriptCorrectionReview({
  reviewPackage,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: inspection,
  candidates,
  reviewerSubmission,
})

const paths = {
  reviewerSubmission: join(outputRoot, 'reviewer-submissions',
    `${reviewerSubmission.submissionDigestSha256}.json`),
  independentReview: join(outputRoot, 'independent-audio-truth-reviews',
    `${result.independentAudioTruthReview.reviewDigestSha256}.json`),
  correctionArtifact: join(outputRoot, 'correction-artifacts',
    `${result.correctionArtifact.artifactDigestSha256}.json`),
  correctionRequest: join(outputRoot, 'canonical-owner-requests',
    `${result.correctionRequest.requestDigestSha256}.json`),
  completionReceipt: join(outputRoot, 'completion-receipts',
    `${result.completionReceipt.receiptDigestSha256}.json`),
}
await Promise.all(Object.values(paths).map((path) =>
  mkdir(resolve(path, '..'), { recursive: true })))
await Promise.all([
  persistCreateOnly(paths.reviewerSubmission, reviewerSubmission),
  persistCreateOnly(paths.independentReview,
    result.independentAudioTruthReview),
  persistCreateOnly(paths.correctionArtifact, result.correctionArtifact),
  persistCreateOnly(paths.correctionRequest, result.correctionRequest),
  persistCreateOnly(paths.completionReceipt, result.completionReceipt),
])

const [submissionReread, reviewReread, artifactReread, requestReread,
  receiptReread] = await Promise.all([
  rereadJson(paths.reviewerSubmission),
  rereadJson(paths.independentReview),
  rereadJson(paths.correctionArtifact),
  rereadJson(paths.correctionRequest),
  rereadJson(paths.completionReceipt),
])
assert.equal(parseCanonicalCaptionTranscriptCorrectionReviewerSubmission(
  submissionReread).submissionDigestSha256,
reviewerSubmission.submissionDigestSha256)
assert.equal(parseCanonicalCaptionIndependentAudioTruthReview(
  reviewReread).reviewDigestSha256,
result.independentAudioTruthReview.reviewDigestSha256)
assert.equal(parseCanonicalCaptionReviewedCorrectionArtifact(
  artifactReread).artifactDigestSha256,
result.correctionArtifact.artifactDigestSha256)
assert.equal(parseCanonicalCaptionReviewedCorrectionRequest(
  requestReread).requestDigestSha256,
result.correctionRequest.requestDigestSha256)
assert.equal(parseCanonicalCaptionTranscriptCorrectionReviewCompletionReceipt(
  receiptReread).receiptDigestSha256,
result.completionReceipt.receiptDigestSha256)

const replay = completeCanonicalCaptionTranscriptCorrectionReview({
  reviewPackage,
  sourceTranscript: transcript,
  rejectedInspectionReceipt: inspection,
  candidates,
  reviewerSubmission: submissionReread,
})
assert.equal(replay.completionReceipt.receiptDigestSha256,
  result.completionReceipt.receiptDigestSha256,
  'Transcript review completion replay changed.')

console.log(JSON.stringify({
  status: 'completed_waiting_for_canonical_transcript_owner_reconciliation',
  reviewPackageRef: reviewerSubmission.reviewPackageRef,
  reviewerSubmissionRef: {
    id: reviewerSubmission.submissionId,
    version: reviewerSubmission.schemaVersion,
    contentHash: reviewerSubmission.submissionDigestSha256,
  },
  independentAudioTruthReviewRef:
    result.completionReceipt.independentAudioTruthReviewRef,
  correctionArtifactRef: result.completionReceipt.correctionArtifactRef,
  correctionRequestRef: result.completionReceipt.correctionRequestRef,
  completionReceiptRef: {
    id: result.completionReceipt.receiptId,
    version: result.completionReceipt.schemaVersion,
    contentHash: result.completionReceipt.receiptDigestSha256,
  },
  reviewedSegments: reviewerSubmission.decisions.length,
  completeSourceAudioListened: true,
  everyCorrectedWordTextAndTimingReviewedAgainstAudio: true,
  canonicalOwnerRereadStillRequired: true,
  canonicalTranscriptMutationPerformed: false,
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

async function rereadJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'))
}

function required(name: string): string {
  const value = process.env[name]?.trim()
  assert.ok(value, `${name} is required.`)
  return value
}

function requiredPath(name: string): string {
  return resolve(required(name))
}
