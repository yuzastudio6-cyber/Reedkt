import { createHash } from 'node:crypto'

import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  CAPTION_BROLL_APPROVED_RUN_EXACT_FRAME_PROFESSIONAL_INSPECTION_VERSION,
  type CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt,
} from '../../src/types/caption-broll-approved-run-exact-frame-professional-inspection'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview,
} from './caption-remotion-broll-owner-approved-run-exact-frame-review'

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
const exactRasterSchema = z.object({
  frameNumber: z.number().int().min(0).max(126),
  rasterRef: refSchema,
  rasterWidth: z.literal(3_840),
  rasterHeight: z.literal(2_160),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()
const outputSchema = z.object({
  variant: z.enum(['full_motion', 'reduced_motion']),
  exactFrameReviewRef: refSchema,
  renderArtifactRef: refSchema,
  byteLength: z.number().int().min(1_024).max(64 * 1024 * 1024),
  width: z.literal(3_840),
  height: z.literal(2_160),
  fps: z.literal(30),
  frameCount: z.literal(127),
  codec: z.literal('h264'),
  pixelFormat: z.literal('yuv420p'),
  colorSpace: z.literal('bt709'),
  colorTransfer: z.literal('bt709'),
  colorPrimaries: z.literal('bt709'),
  durationMilliseconds: z.literal(4_288),
  everyFrameContactSheet: z.object({
    rasterRef: refSchema,
    representedFrameCount: z.literal(127),
    rasterWidth: z.literal(3_840),
    rasterHeight: z.literal(1_080),
    tileColumns: z.literal(16),
    tileRows: z.literal(8),
    thumbnailWidth: z.literal(240),
    thumbnailHeight: z.literal(135),
    actualRasterOpenedAndInspected: z.literal(true),
  }).strict(),
  exactResolutionSpotChecks: z.array(exactRasterSchema).length(5),
  transitionSpotChecks: z.array(exactRasterSchema).length(4),
}).strict()
const receiptSchema:
z.ZodType<CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt> =
z.object({
  schemaVersion: z.literal(
    CAPTION_BROLL_APPROVED_RUN_EXACT_FRAME_PROFESSIONAL_INSPECTION_VERSION),
  receiptId: safeKey,
  receiptDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  exactFrameInspectionPackageRef: refSchema,
  sourceProxyReviewPackageRef: refSchema,
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  confirmedOutputFrameRef: refSchema,
  outputs: z.tuple([
    outputSchema.extend({ variant: z.literal('full_motion') }).strict(),
    outputSchema.extend({ variant: z.literal('reduced_motion') }).strict(),
  ]),
  coverage: z.object({
    frameCountPerVariant: z.literal(127),
    variantCount: z.literal(2),
    totalRenderedFramesRepresented: z.literal(254),
    everyRenderedFrameRepresentedExactlyOnce: z.literal(true),
    everyFrameThumbnailInspectionPerformed: z.literal(true),
    exactResolutionSpotChecksComplete: z.literal(true),
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
    exactFrameTypographyDefectObserved: z.literal(false),
    exactFrameLayoutDefectObserved: z.literal(false),
  }).strict(),
  acceptedForCaptionOwnedExactFrameTypographyAndLayout: z.literal(true),
  sourceProxyUpscaleDisclosed: z.literal(true),
  sourcePictureQualityQualified: z.literal(false),
  finalCustomerCanvasClaimed: z.literal(false),
  replacesCanonicalFinalCanvas: z.literal(false),
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
  fileName: z.enum([
    'full-motion-exact-frame.mp4',
    'reduced-motion-exact-frame.mp4',
  ]),
  sha256,
  byteLength: z.number().int().min(1_024),
  width: z.literal(3_840),
  height: z.literal(2_160),
  fps: z.literal(30),
  durationFrames: z.literal(127),
  exactFrameReviewDigestSha256: sha256,
  runtimeGoldenFrameScaleNumerator: z.literal(1),
  runtimeGoldenFrameScaleDenominator: z.literal(6),
  runtimeGoldenFramesAreInspectionProxies: z.literal(true),
  exactFrameRastersMustBeExtractedFromMp4ForInspection: z.literal(true),
  sampleFrames: z.array(z.object({
    frameIndex: z.number().int().min(0).max(126),
    fileName: safeKey,
    sha256,
    width: z.literal(640),
    height: z.literal(360),
  }).strict()).length(5),
}).strict()
const packageSchema = z.object({
  schemaVersion: z.literal(
    'caption-broll-approved-run-exact-frame-review-inspection-package-v1'),
  sourceProxyReviewPackageRef: refSchema,
  confirmedOutputFrame: z.object({
    width: z.literal(3_840),
    height: z.literal(2_160),
    fps: z.literal(30),
    exactConfirmedFrameRendered: z.literal(true),
  }).strict(),
  sourceProxyFrame: z.object({
    width: z.literal(640),
    height: z.literal(360),
    sourceProxyUpscaleRequired: z.literal(true),
    sourceProxyAcceptedAsFinalPictureQuality: z.literal(false),
  }).strict(),
  outputs: z.tuple([
    packageOutputSchema.extend({
      motionVariant: z.literal('full_motion'),
      fileName: z.literal('full-motion-exact-frame.mp4'),
    }).strict(),
    packageOutputSchema.extend({
      motionVariant: z.literal('reduced_motion'),
      fileName: z.literal('reduced-motion-exact-frame.mp4'),
    }).strict(),
  ]),
  exactApprovedRunReread: z.literal(true),
  exactConfirmedFrameMatchesApprovedRun: z.literal(true),
  typographyAndLayoutEvaluatedAtConfirmedFrame: z.literal(true),
  directRasterInspectionRequired: z.literal(true),
  directRasterInspectionCompleted: z.literal(false),
  sourceQualityQualificationClaimed: z.literal(false),
  finalCustomerCanvasClaimed: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  packageSha256: sha256,
}).strict()

export interface CaptionBrollApprovedRunExactFrameInspectionContext {
  inspectionPackage: unknown
  fullMotionExactFrameReview: unknown
  reducedMotionExactFrameReview: unknown
}

type ReceiptInput = Omit<
  CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt,
  'schemaVersion' | 'receiptDigestSha256'
>

export function createCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
  input: ReceiptInput,
  context: CaptionBrollApprovedRunExactFrameInspectionContext,
): CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt {
  assertClosedContractTree(input,
    'Caption approved-run exact-frame professional inspection input')
  const withoutDigest = {
    schemaVersion:
      CAPTION_BROLL_APPROVED_RUN_EXACT_FRAME_PROFESSIONAL_INSPECTION_VERSION,
    ...structuredClone(input),
  }
  return parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt({
    ...withoutDigest,
    receiptDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      receiptDigestSha256: '',
    }, 'receiptDigestSha256'),
  }, context)
}

export function parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
  value: unknown,
  context: CaptionBrollApprovedRunExactFrameInspectionContext,
): CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt {
  const receipt =
    parseClosedCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
      value)
  const reviewPackage = packageSchema.parse(context.inspectionPackage)
  const full = parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview(
    context.fullMotionExactFrameReview)
  const reduced = parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview(
    context.reducedMotionExactFrameReview)
  const { packageSha256, ...packageCore } = reviewPackage
  if (packageSha256 !== createHash('sha256')
      .update(JSON.stringify(packageCore)).digest('hex')
    || full.reducedMotion || !reduced.reducedMotion
    || !sameScope(receipt.canonicalScope, full.canonicalScope)
    || !sameScope(full.canonicalScope, reduced.canonicalScope)
    || !sameRef(receipt.exactFrameInspectionPackageRef, {
      id: 'caption.broll.approved-run.exact-frame-review.package',
      version: reviewPackage.schemaVersion,
      contentHash: reviewPackage.packageSha256,
    })
    || !sameRef(receipt.sourceProxyReviewPackageRef,
      reviewPackage.sourceProxyReviewPackageRef)
    || !sameRef(receipt.approvedSnapshotRef, full.approvedSnapshotRef)
    || !sameRef(full.approvedSnapshotRef, reduced.approvedSnapshotRef)
    || !sameRef(receipt.executionPackageRef, full.executionPackageRef)
    || !sameRef(full.executionPackageRef, reduced.executionPackageRef)
    || !sameRef(receipt.confirmedOutputFrameRef,
      full.confirmedOutputFrame.frameRef)
    || !sameRef(full.confirmedOutputFrame.frameRef,
      reduced.confirmedOutputFrame.frameRef)
    || !outputMatches(receipt.outputs[0], full, reviewPackage.outputs[0])
    || !outputMatches(receipt.outputs[1], reduced, reviewPackage.outputs[1])
    || receipt.outputs[0].renderArtifactRef.contentHash
      === receipt.outputs[1].renderArtifactRef.contentHash
    || receipt.outputs[0].everyFrameContactSheet.rasterRef.contentHash
      === receipt.outputs[1].everyFrameContactSheet.rasterRef.contentHash) {
    throw new Error(
      'Caption approved-run exact-frame inspection crossed render or approved-run lineage.',
    )
  }
  return structuredClone(receipt)
}

/**
 * Revalidates the immutable receipt itself without accepting caller-provided
 * media bytes or local locators. Canonical preterminal persistence uses this
 * closed parser after the original inspection step has already validated the
 * receipt against its exact render bindings and inspection package. Terminal
 * qualification must still reread and validate those referenced authorities.
 */
export function parseClosedCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
  value: unknown,
): CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt {
  assertClosedContractTree(value,
    'Caption approved-run exact-frame professional inspection receipt')
  const receipt = receiptSchema.parse(value)
  const scopeRange = receipt.canonicalScope.authorizedFrameRanges[0]!
  const rasterKeys = receipt.outputs.flatMap((output) => [
    refKey(output.everyFrameContactSheet.rasterRef),
    ...output.exactResolutionSpotChecks.map((item) => refKey(item.rasterRef)),
    ...output.transitionSpotChecks.map((item) => refKey(item.rasterRef)),
  ])
  if (receipt.receiptDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>, 'receiptDigestSha256')
    || receipt.canonicalScope.approvedSnapshotRef === null
    || receipt.canonicalScope.sceneId === null
    || !sameRef(receipt.canonicalScope.approvedSnapshotRef,
      receipt.approvedSnapshotRef)
    || scopeRange.startFrame !== 0
    || scopeRange.endFrameExclusive !== 127
    || receipt.outputs[0].exactResolutionSpotChecks
      .map((item) => item.frameNumber).join('|') !== '0|24|49|88|126'
    || receipt.outputs[1].exactResolutionSpotChecks
      .map((item) => item.frameNumber).join('|') !== '0|24|49|88|126'
    || receipt.outputs[0].transitionSpotChecks
      .map((item) => item.frameNumber).join('|') !== '48|52|56|60'
    || receipt.outputs[1].transitionSpotChecks
      .map((item) => item.frameNumber).join('|') !== '48|52|56|60'
    || new Set(rasterKeys).size !== rasterKeys.length
    || sameRef(receipt.outputs[0].renderArtifactRef,
      receipt.outputs[1].renderArtifactRef)
    || sameRef(receipt.exactFrameInspectionPackageRef,
      receipt.sourceProxyReviewPackageRef)) {
    throw new Error(
      'Caption approved-run exact-frame inspection receipt is inconsistent.',
    )
  }
  return structuredClone(receipt)
}

function outputMatches(
  output: CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt[
    'outputs'][number],
  review: ReturnType<
    typeof parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview>,
  packageOutput: z.infer<typeof packageOutputSchema>,
): boolean {
  const exactFrames = output.exactResolutionSpotChecks
    .map((item) => item.frameNumber)
  const transitionFrames = output.transitionSpotChecks
    .map((item) => item.frameNumber)
  const rasterHashes = [
    output.everyFrameContactSheet.rasterRef.contentHash,
    ...output.exactResolutionSpotChecks.map((item) =>
      item.rasterRef.contentHash),
    ...output.transitionSpotChecks.map((item) =>
      item.rasterRef.contentHash),
  ]
  return output.variant === packageOutput.motionVariant
    && output.variant === (review.reducedMotion
      ? 'reduced_motion' : 'full_motion')
    && sameRef(output.exactFrameReviewRef, {
      id: review.exactFrameReviewId,
      version: review.schemaVersion,
      contentHash: review.exactFrameReviewDigestSha256,
    })
    && output.renderArtifactRef.version === 'video-mp4-private-review-v1'
    && output.renderArtifactRef.contentHash === packageOutput.sha256
    && output.byteLength === packageOutput.byteLength
    && packageOutput.exactFrameReviewDigestSha256
      === review.exactFrameReviewDigestSha256
    && exactFrames.join('|') === review.inspectionFrameNumbers.join('|')
    && transitionFrames.join('|') === '48|52|56|60'
    && new Set(rasterHashes).size === rasterHashes.length
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(
  value: { id: string, version: string, contentHash: string },
): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function sameScope(
  left: CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt[
    'canonicalScope'],
  right: CaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt[
    'canonicalScope'],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
