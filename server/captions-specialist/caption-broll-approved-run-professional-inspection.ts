import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CAPTION_BROLL_APPROVED_RUN_PROFESSIONAL_INSPECTION_VERSION,
  type CaptionBrollApprovedRunProfessionalInspectionReceipt,
} from '../../src/types/caption-broll-approved-run-professional-inspection'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionRemotionBrollOwnerApprovedRunReviewSpec,
} from './caption-remotion-broll-owner-approved-run-review'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const rangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) => range.endFrameExclusive > range.startFrame)
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(rangeSchema).length(1),
}).strict()
const visualRasterSchema = z.object({
  frameNumber: z.number().int().min(0).max(126),
  rasterRef: refSchema,
  rasterWidth: z.literal(640),
  rasterHeight: z.literal(360),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()
const outputSchema = z.object({
  variant: z.enum(['full_motion', 'reduced_motion']),
  reviewSpecRef: refSchema,
  renderArtifactRef: refSchema,
  byteLength: z.number().int().min(1_024).max(64 * 1024 * 1024),
  width: z.literal(640),
  height: z.literal(360),
  fps: z.literal(30),
  frameCount: z.literal(127),
  everyFrameContactSheet: z.object({
    rasterRef: refSchema,
    representedFrameCount: z.literal(127),
    rasterWidth: z.literal(2_560),
    rasterHeight: z.literal(720),
    tileColumns: z.literal(16),
    tileRows: z.literal(8),
    thumbnailWidth: z.literal(160),
    thumbnailHeight: z.literal(90),
    actualRasterOpenedAndInspected: z.literal(true),
  }).strict(),
  originalResolutionSpotChecks: z.array(visualRasterSchema).length(5),
  transitionSpotChecks: z.array(visualRasterSchema).length(4),
}).strict()
const receiptSchema:
z.ZodType<CaptionBrollApprovedRunProfessionalInspectionReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_BROLL_APPROVED_RUN_PROFESSIONAL_INSPECTION_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  inspectionPackageRef: refSchema,
  baselineTechnicalPreviewRef: refSchema,
  ownerRequestRef: refSchema,
  ownerResultRef: refSchema,
  canonicalTranscriptRef: refSchema,
  canonicalTranscriptEvidenceRef: refSchema,
  outputs: z.tuple([
    outputSchema.extend({ variant: z.literal('full_motion') }).strict(),
    outputSchema.extend({ variant: z.literal('reduced_motion') }).strict(),
  ]),
  coverage: z.object({
    frameCountPerVariant: z.literal(127),
    variantCount: z.literal(2),
    totalRenderedFramesRepresented: z.literal(254),
    everyRenderedFrameRepresentedExactlyOnce: z.literal(true),
    completeTimePixelInspectionPerformed: z.literal(true),
    originalResolutionSpotChecksComplete: z.literal(true),
    transitionEntranceHoldAndExitCoverageComplete: z.literal(true),
    fullReducedMotionSemanticParityInspected: z.literal(true),
    completeMotionPlaybackInspectionPerformed: z.literal(false),
  }).strict(),
  findings: z.object({
    sourceSubstitutionObserved: z.literal(false),
    sourceAspectDistortionObserved: z.literal(false),
    faceObstructionObserved: z.literal(false),
    gestureObstructionObserved: z.literal(false),
    captionClippingObserved: z.literal(false),
    phraseOverflowObserved: z.literal(false),
    heroAndAccessiblePlateCollisionObserved: z.literal(false),
    unstablePlacementObserved: z.literal(false),
    unusableCueTransitionObserved: z.literal(false),
    stuckCaptionLayerObserved: z.literal(false),
    tailTruncationObserved: z.literal(false),
  }).strict(),
  acceptedForCaptionOwnedProfessionalAppearance: z.literal(true),
  technicalPreviewAcceptedAsFinalCaptionDesign: z.literal(false),
  motionVariantOutputsByteDistinct: z.literal(true),
  deterministicTechnicalQaReplaced: z.literal(false),
  qualifiedSharedPostrenderAiReviewClaimed: z.literal(false),
  independentFinalQaClaimed: z.literal(false),
  browserLocalCompletionClaimed: z.literal(false),
  mediaBytesSerialized: z.literal(false),
  localPathsSerialized: z.literal(false),
  providerCallMade: z.literal(false),
  operationDispatchAuthorityGranted: z.literal(false),
  repairExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

const packageOutputSchema = z.object({
  motionVariant: z.enum(['full_motion', 'reduced_motion']),
  fileName: z.enum(['full-motion.mp4', 'reduced-motion.mp4']),
  sha256,
  byteLength: z.number().int().min(1_024),
  width: z.literal(640),
  height: z.literal(360),
  fps: z.literal(30),
  durationFrames: z.literal(127),
  reviewSpecDigestSha256: sha256,
  sampleFrames: z.array(z.object({
    frameIndex: z.number().int().min(0).max(126),
    fileName: safeKey,
    sha256,
  }).strict()).length(5),
}).strict()
const packageSchema = z.object({
  schemaVersion: z.literal(
    'caption-broll-approved-run-professional-review-inspection-package-v1'),
  baselinePreviewSha256: sha256,
  ownerRequestRef: refSchema,
  ownerResultRef: refSchema,
  inspectionSourceAuthorityRef: refSchema,
  canonicalTranscriptRef: refSchema,
  canonicalTranscriptEvidenceRef: refSchema,
  outputs: z.tuple([
    packageOutputSchema.extend({
      motionVariant: z.literal('full_motion'),
      fileName: z.literal('full-motion.mp4'),
    }).strict(),
    packageOutputSchema.extend({
      motionVariant: z.literal('reduced_motion'),
      fileName: z.literal('reduced-motion.mp4'),
    }).strict(),
  ]),
  exactApprovedRunReread: z.literal(true),
  exactBrollOwnerResultReread: z.literal(true),
  exactCanonicalTranscriptReread: z.literal(true),
  directRasterInspectionRequired: z.literal(true),
  directRasterInspectionCompleted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  packageSha256: sha256,
}).strict()

export interface CaptionBrollApprovedRunProfessionalInspectionContext {
  inspectionPackage: unknown
  fullMotionReviewSpec: unknown
  reducedMotionReviewSpec: unknown
}

type ReceiptInput = Omit<
  CaptionBrollApprovedRunProfessionalInspectionReceipt,
  'schemaVersion' | 'receiptDigestSha256'
>

export function createCaptionBrollApprovedRunProfessionalInspectionReceipt(
  input: ReceiptInput,
  context: CaptionBrollApprovedRunProfessionalInspectionContext,
): CaptionBrollApprovedRunProfessionalInspectionReceipt {
  assertClosedContractTree(input,
    'Caption approved-run B-roll professional inspection input')
  const withoutDigest = {
    schemaVersion:
      CAPTION_BROLL_APPROVED_RUN_PROFESSIONAL_INSPECTION_VERSION,
    ...structuredClone(input),
  }
  return parseCaptionBrollApprovedRunProfessionalInspectionReceipt({
    ...withoutDigest,
    receiptDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      receiptDigestSha256: '',
    }, 'receiptDigestSha256'),
  }, context)
}

export function parseCaptionBrollApprovedRunProfessionalInspectionReceipt(
  value: unknown,
  context: CaptionBrollApprovedRunProfessionalInspectionContext,
): CaptionBrollApprovedRunProfessionalInspectionReceipt {
  assertClosedContractTree(value,
    'Caption approved-run B-roll professional inspection receipt')
  const receipt = receiptSchema.parse(value)
  const reviewPackage = packageSchema.parse(context.inspectionPackage)
  const fullSpec = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(
    context.fullMotionReviewSpec)
  const reducedSpec = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(
    context.reducedMotionReviewSpec)
  const { packageSha256, ...packageCore } = reviewPackage
  if (receipt.receiptDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>, 'receiptDigestSha256')
    || packageSha256 !== createHash('sha256')
      .update(JSON.stringify(packageCore)).digest('hex')) {
    throw new Error('Caption approved-run B-roll inspection digest is stale.')
  }
  const full = receipt.outputs[0]
  const reduced = receipt.outputs[1]
  if (!sameScope(receipt.canonicalScope, fullSpec.canonicalScope)
    || !sameScope(fullSpec.canonicalScope, reducedSpec.canonicalScope)
    || fullSpec.reducedMotion || !reducedSpec.reducedMotion
    || fullSpec.durationFrames !== 127 || reducedSpec.durationFrames !== 127
    || !sameRef(receipt.inspectionPackageRef, {
      id: 'caption.broll.approved-run.professional-review.package',
      version: reviewPackage.schemaVersion,
      contentHash: reviewPackage.packageSha256,
    })
    || receipt.baselineTechnicalPreviewRef.contentHash
      !== reviewPackage.baselinePreviewSha256
    || !sameRef(receipt.ownerRequestRef, reviewPackage.ownerRequestRef)
    || !sameRef(receipt.ownerResultRef, reviewPackage.ownerResultRef)
    || !sameRef(receipt.canonicalTranscriptRef,
      reviewPackage.canonicalTranscriptRef)
    || !sameRef(receipt.canonicalTranscriptEvidenceRef,
      reviewPackage.canonicalTranscriptEvidenceRef)
    || !outputMatches(full, fullSpec, reviewPackage.outputs[0])
    || !outputMatches(reduced, reducedSpec, reviewPackage.outputs[1])
    || full.renderArtifactRef.contentHash
      === reduced.renderArtifactRef.contentHash
    || full.everyFrameContactSheet.rasterRef.contentHash
      === reduced.everyFrameContactSheet.rasterRef.contentHash) {
    throw new Error(
      'Caption approved-run B-roll inspection crossed render or owner lineage.',
    )
  }
  return structuredClone(receipt)
}

function outputMatches(
  output: CaptionBrollApprovedRunProfessionalInspectionReceipt['outputs'][number],
  spec: ReturnType<
    typeof parseCaptionRemotionBrollOwnerApprovedRunReviewSpec>,
  packageOutput: z.infer<typeof packageOutputSchema>,
): boolean {
  const originalFrames = output.originalResolutionSpotChecks
    .map((item) => item.frameNumber)
  const packageFrames = packageOutput.sampleFrames
    .map((item) => item.frameIndex)
  const transitionFrames = output.transitionSpotChecks
    .map((item) => item.frameNumber)
  const allRasterHashes = [
    output.everyFrameContactSheet.rasterRef.contentHash,
    ...output.originalResolutionSpotChecks.map((item) =>
      item.rasterRef.contentHash),
    ...output.transitionSpotChecks.map((item) =>
      item.rasterRef.contentHash),
  ]
  return output.reviewSpecRef.id === spec.reviewSpecId
    && output.variant === packageOutput.motionVariant
    && output.variant === (spec.reducedMotion
      ? 'reduced_motion' : 'full_motion')
    && output.reviewSpecRef.version === spec.schemaVersion
    && output.reviewSpecRef.contentHash === spec.reviewSpecDigestSha256
    && output.renderArtifactRef.version === 'video-mp4-private-review-v1'
    && output.renderArtifactRef.contentHash === packageOutput.sha256
    && output.byteLength === packageOutput.byteLength
    && packageOutput.reviewSpecDigestSha256 === spec.reviewSpecDigestSha256
    && originalFrames.join('|') === spec.inspectionFrameNumbers.join('|')
    && originalFrames.join('|') === packageFrames.join('|')
    && output.originalResolutionSpotChecks.every((item, index) =>
      item.rasterRef.contentHash === packageOutput.sampleFrames[index]?.sha256)
    && transitionFrames.join('|') === '48|52|56|60'
    && new Set(allRasterHashes).size === allRasterHashes.length
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameScope(
  left: CaptionBrollApprovedRunProfessionalInspectionReceipt['canonicalScope'],
  right: CaptionBrollApprovedRunProfessionalInspectionReceipt['canonicalScope'],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
