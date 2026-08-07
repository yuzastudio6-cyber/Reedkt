import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { z } from 'zod'

import type { CaptionSoundCueRequest } from
  '../../src/types/caption-sound-support'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import {
  CAPTION_SOUND_PRIVATE_RUNTIME_INSPECTION_PACKAGE_VERSION,
  completeCanonicalSoundCaptionListeningReview,
  createCanonicalSoundCaptionListeningReviewerSubmission,
  createCanonicalSoundCaptionListeningReviewRepository,
  deriveCanonicalSoundCaptionListeningReviewLineage,
  parseCanonicalSoundCaptionListeningPlaybackDerivation,
} from '../services/canonical-sound-caption-listening-review-completion'

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const reviewerInputSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sound-caption-listening-reviewer-input-v1'),
  submissionId: identity,
  reviewerClass: z.enum(['qualified_audio_ai', 'direct_private_human']),
  disposition: z.enum(['accepted', 'accepted_with_warnings']),
  completePlaybackCount: z.number().int().min(1).max(3),
  actualAudioPlaybackCompleted: z.literal(true),
  everyRequestedRangeReviewed: z.literal(true),
  voiceClarityPassed: z.literal(true),
  noCueMasksDialogue: z.literal(true),
  cueTimingAndRestraintPassed: z.literal(true),
  noUnexpectedAudioDefectsPassed: z.literal(true),
  warningCodes: z.array(identity).max(16),
  reviewedAt: timestamp,
  independentFromSoundExecutionRuntime: z.literal(true),
}).strict()
const inspectionPackageSchema = z.object({
  schemaVersion: z.literal(
    CAPTION_SOUND_PRIVATE_RUNTIME_INSPECTION_PACKAGE_VERSION),
  captionRequest: z.unknown(),
  supportRequest: z.unknown(),
  canonicalSoundRequest: z.unknown(),
  canonicalSoundResult: z.unknown(),
  finalArtifactHashes: z.array(sha256).min(1).max(128),
  actualMediaRuntimeExecuted: z.literal(true),
  directListeningReviewCompleted: z.literal(false),
  terminalQualificationClaimed: z.literal(false),
}).strict()

assert.equal(
  process.env.REEDITPRO_CONFIRM_CAPTION_SOUND_COMPLETE_TIME_REVIEW,
  'true',
  'Sound review completion requires an explicit complete-time confirmation.',
)

const packagePath = requiredPath(
  'REEDITPRO_CAPTION_SOUND_REVIEW_INSPECTION_PACKAGE_PATH')
const playbackPath = requiredPath(
  'REEDITPRO_CAPTION_SOUND_REVIEW_PLAYBACK_ARTIFACT_PATH')
const reviewerInputPath = requiredPath(
  'REEDITPRO_CAPTION_SOUND_REVIEW_REVIEWER_INPUT_PATH')
const outputRoot = requiredPath(
  'REEDITPRO_CAPTION_SOUND_REVIEW_OUTPUT_ROOT')
const privateEvidenceRoot = dirname(dirname(packagePath))
assert.equal(outputRoot === process.cwd()
  || outputRoot.startsWith(`${process.cwd()}/`), false,
'Private Sound review output must remain outside the repository.')
assert.ok(privateEvidenceRoot !== '/'
  && outputRoot.startsWith(`${privateEvidenceRoot}/`)
  && playbackPath.startsWith(`${privateEvidenceRoot}/`)
  && reviewerInputPath.startsWith(`${privateEvidenceRoot}/`),
'Sound review inputs and output must remain in one bounded private evidence root.')

const [packageBytes, playbackBytes, reviewerBytes] = await Promise.all([
  readFile(packagePath),
  readFile(playbackPath),
  readFile(reviewerInputPath),
])
const untrustedPackage = JSON.parse(packageBytes.toString('utf8')) as unknown
const untrustedReviewerInput = JSON.parse(
  reviewerBytes.toString('utf8')) as unknown
assertClosedContractTree(untrustedPackage, 'Caption Sound inspection package')
assertClosedContractTree(untrustedReviewerInput, 'Caption Sound reviewer input')
const inspectionPackage = inspectionPackageSchema.parse(untrustedPackage)
const reviewerInput = reviewerInputSchema.parse(untrustedReviewerInput)
const captionRequest = inspectionPackage.captionRequest as
  CaptionSoundCueRequest
const lineage = deriveCanonicalSoundCaptionListeningReviewLineage({
  captionSoundRequest: captionRequest,
  canonicalSoundRequest: inspectionPackage.canonicalSoundRequest,
  canonicalSoundResult: inspectionPackage.canonicalSoundResult,
})
assert.deepEqual(inspectionPackage.finalArtifactHashes,
  lineage.finalMixArtifactRefs.map((artifact) => artifact.contentHash),
'The Sound inspection package final artifacts changed.')

const derivationPath = process.env
  .REEDITPRO_CAPTION_SOUND_REVIEW_PLAYBACK_DERIVATION_PATH?.trim()
if (derivationPath) {
  assert.ok(resolve(derivationPath).startsWith(`${privateEvidenceRoot}/`),
    'Sound playback derivation must remain in the private evidence root.')
}
const playbackDerivationReceipt = derivationPath
  ? parseCanonicalSoundCaptionListeningPlaybackDerivation(JSON.parse(
    await readFile(resolve(derivationPath), 'utf8')))
  : null
const playbackHash = sha(playbackBytes)
const playbackArtifactRef = playbackDerivationReceipt
  ? playbackDerivationReceipt.playbackArtifactRef
  : lineage.finalMixArtifactRefs.find((artifact) =>
    artifact.contentHash === playbackHash)
assert.ok(playbackArtifactRef,
  'Playback bytes are not the final mix and lack a derivation receipt.')
assert.equal(playbackArtifactRef.contentHash, playbackHash,
  'Playback bytes changed after their review lineage was authored.')
if (playbackDerivationReceipt) {
  assert.ok(lineage.finalMixArtifactRefs.some((artifact) =>
    exactRef(artifact,
      playbackDerivationReceipt.sourceFinalMixArtifactRef)),
  'Playback derivation does not bind the exact final mix.')
}

const inspectionPackageRef = {
  id: `caption.sound.inspection.${sha(packageBytes).slice(0, 32)}`,
  version: CAPTION_SOUND_PRIVATE_RUNTIME_INSPECTION_PACKAGE_VERSION,
  contentHash: sha(packageBytes),
}
const reviewerSubmission =
  createCanonicalSoundCaptionListeningReviewerSubmission({
    schemaVersion:
      'canonical-sound-caption-listening-reviewer-submission-v1',
    submissionId: reviewerInput.submissionId,
    inspectionPackageRef,
    captionSoundRequestRef: lineage.captionSoundRequestRef,
    canonicalSoundRequestRef: lineage.canonicalSoundRequestRef,
    canonicalSoundResultRef: lineage.canonicalSoundResultRef,
    finalMixArtifactRefs: lineage.finalMixArtifactRefs,
    playbackArtifactRef,
    playbackDerivationReceiptRef: playbackDerivationReceipt
      ? {
          id: playbackDerivationReceipt.derivationId,
          version: playbackDerivationReceipt.schemaVersion,
          contentHash: playbackDerivationReceipt.derivationDigestSha256,
        }
      : null,
    reviewerClass: reviewerInput.reviewerClass,
    disposition: reviewerInput.disposition,
    completePlaybackCount: reviewerInput.completePlaybackCount,
    actualAudioPlaybackCompleted: true,
    everyRequestedRangeReviewed: true,
    voiceClarityPassed: true,
    noCueMasksDialogue: true,
    cueTimingAndRestraintPassed: true,
    noUnexpectedAudioDefectsPassed: true,
    observationCodes: [
      'complete_time_coverage',
      'voice_clarity',
      'dialogue_masking',
      'cue_timing_and_restraint',
      'unexpected_audio_defects',
    ],
    warningCodes: reviewerInput.warningCodes,
    reviewedAt: reviewerInput.reviewedAt,
    independentFromSoundExecutionRuntime: true,
    sourceBytesIncluded: false,
    mediaLocatorIncluded: false,
    rawChatIncluded: false,
    providerCallMade: false,
    runtimeAuthorityGrantedToCaption: false,
    assetAuthorityGrantedToCaption: false,
    mixAuthorityGrantedToCaption: false,
    costOrBillingAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
const record = completeCanonicalSoundCaptionListeningReview({
  inspectionPackageRef,
  captionSoundRequest: captionRequest,
  canonicalSoundRequest: inspectionPackage.canonicalSoundRequest,
  canonicalSoundResult: inspectionPackage.canonicalSoundResult,
  reviewerSubmission,
  playbackDerivationReceipt,
})
const objectPort = createCanonicalPrivateLocalJsonObjectPort({
  localStorageRoot: outputRoot,
})
const repository = createCanonicalSoundCaptionListeningReviewRepository({
  objectPort,
  prefix: 'canonical-sound-caption-listening-review',
})
const persistence = await repository.persistCreateOnly(record)
const first = await repository.rereadExact(lineage)
const second = await repository.rereadExact(lineage)
assert.ok(first && second,
  'Canonical Sound listening record disappeared after persistence.')
assert.equal(first.recordDigestSha256, record.recordDigestSha256)
assert.equal(second.recordDigestSha256, record.recordDigestSha256)

console.log(JSON.stringify({
  status: 'canonical_sound_caption_listening_review_completed',
  persistence,
  reviewerSubmissionRef: record.completionReceipt.reviewerSubmissionRef,
  listeningReviewRef: record.completionReceipt.listeningReviewRef,
  completionReceiptRef: {
    id: record.completionReceipt.receiptId,
    version: record.completionReceipt.schemaVersion,
    contentHash: record.completionReceipt.receiptDigestSha256,
  },
  recordRef: {
    id: record.recordId,
    version: record.schemaVersion,
    contentHash: record.recordDigestSha256,
  },
  playbackUsedExactFinalMix: playbackDerivationReceipt === null,
  playbackDerivationVerified: playbackDerivationReceipt !== null,
  actualAudioPlaybackCompleted: true,
  everyRequestedRangeReviewed: true,
  voiceClarityPassed: true,
  noCueMasksDialogue: true,
  soundExecutionOwnedByCaption: false,
  finalQaApprovalGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function required(name: string): string {
  const value = process.env[name]?.trim()
  assert.ok(value, `${name} is required.`)
  return value
}

function requiredPath(name: string): string {
  return resolve(required(name))
}

function sha(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function exactRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
