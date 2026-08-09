import { z } from 'zod'

import {
  CAPTION_BROLL_OWNER_PROFESSIONAL_INSPECTION_VERSION,
  type CaptionBrollOwnerProfessionalInspectionReceipt,
} from '../../src/types/caption-broll-owner-professional-inspection'
import type { CaptionDomainCanonicalScope } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseBrollCaptionOwnerReadResult } from
  './caption-broll-owner-read-adapter'
import {
  assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult,
} from './caption-remotion-broll-owner-review'

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
const variantSchema = z.enum(['full_motion', 'reduced_motion'])
const acceptedSpecRefSchema = z.object({
  variant: variantSchema,
  reviewSpecRef: refSchema,
}).strict()
const renderArtifactSchema = z.object({
  variant: variantSchema,
  reviewSpecRef: refSchema,
  artifactRef: refSchema,
  artifactSha256: sha256,
  mimeType: z.literal('video/mp4'),
  byteLength: z.number().int().min(1_024).max(64 * 1024 * 1024),
  rasterWidth: z.literal(640),
  rasterHeight: z.literal(360),
  fpsNumerator: z.literal(24),
  fpsDenominator: z.literal(1),
  frameCount: z.literal(72),
}).strict()
const contactSheetSchema = z.object({
  variant: variantSchema,
  renderArtifactRef: refSchema,
  startFrame: z.literal(0),
  endFrameExclusive: z.literal(72),
  representedFrameCount: z.literal(72),
  rasterRef: refSchema,
  rasterSha256: sha256,
  rasterWidth: z.literal(1_536),
  rasterHeight: z.literal(432),
  tileColumns: z.literal(12),
  tileRows: z.literal(6),
  thumbnailWidth: z.literal(128),
  thumbnailHeight: z.literal(72),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()
const spotCheckSchema = z.object({
  inspectionItemId: safeKey,
  variant: variantSchema,
  reviewSpecRef: refSchema,
  renderArtifactRef: refSchema,
  frameNumber: z.number().int().min(0).max(71),
  rasterRef: refSchema,
  rasterSha256: sha256,
  rasterWidth: z.literal(640),
  rasterHeight: z.literal(360),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()
const rejectedFrameSchema = z.object({
  frameNumber: z.number().int().min(0).max(71),
  rasterRef: refSchema,
  rasterSha256: sha256,
  rasterWidth: z.literal(640),
  rasterHeight: z.literal(360),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()

const receiptSchema:
z.ZodType<CaptionBrollOwnerProfessionalInspectionReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_BROLL_OWNER_PROFESSIONAL_INSPECTION_VERSION),
  inspectionId: safeKey,
  inspectionDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  ownerResultRef: refSchema,
  acceptedReviewSpecRefs: z.tuple([
    acceptedSpecRefSchema.extend({
      variant: z.literal('full_motion'),
    }).strict(),
    acceptedSpecRefSchema.extend({
      variant: z.literal('reduced_motion'),
    }).strict(),
  ]),
  rejectedAttempt: z.object({
    fullMotionReviewSpecRef: refSchema,
    reducedMotionReviewSpecRef: refSchema,
    fullMotionRenderArtifactRef: refSchema,
    reducedMotionRenderArtifactRef: refSchema,
    inspectedFrameEvidence: z.array(rejectedFrameSchema).min(4).max(12),
    rejectionReasonCodes: z.tuple([
      z.literal('face_obstruction_by_hero_typography'),
    ]),
    deterministicTechnicalPassNotSufficient: z.literal(true),
    professionalAppearanceAccepted: z.literal(false),
    retainedAsFailedEvidence: z.literal(true),
  }).strict(),
  acceptedRenderArtifacts: z.tuple([
    renderArtifactSchema.extend({
      variant: z.literal('full_motion'),
    }).strict(),
    renderArtifactSchema.extend({
      variant: z.literal('reduced_motion'),
    }).strict(),
  ]),
  contactSheets: z.tuple([
    contactSheetSchema.extend({
      variant: z.literal('full_motion'),
    }).strict(),
    contactSheetSchema.extend({
      variant: z.literal('reduced_motion'),
    }).strict(),
  ]),
  originalResolutionSpotChecks:
    z.array(spotCheckSchema).length(14),
  coverage: z.object({
    frameCountPerVariant: z.literal(72),
    variantCount: z.literal(2),
    totalRenderedFramesRepresented: z.literal(144),
    everyRenderedFrameRepresentedExactlyOnce: z.literal(true),
    contactSheetCoverageComplete: z.literal(true),
    originalResolutionSpotChecksComplete: z.literal(true),
    cueEntranceHoldAndExitCoverageComplete: z.literal(true),
    fullReducedMotionSemanticParityInspected: z.literal(true),
    completeMotionPlaybackClaimed: z.literal(false),
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
  repair: z.object({
    repairReason: z.literal('hero_typography_obscured_speaker_face'),
    repairAction: z.literal(
      'reposition_hero_typography_to_open_left_side_outside_face_and_gesture'),
    rejectedAndAcceptedArtifactsVersionSeparated: z.literal(true),
    acceptedHeroPlacement: z.literal('open_left_side'),
    acceptedStableCaptionPlacement: z.literal('lower_safe_band'),
    repairDidNotChangeOwnerSelectionCropOrTiming: z.literal(true),
  }).strict(),
  inspectionMethod: z.literal(
    'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1'),
  inspectorClass: z.literal('codex_agent_direct_visual_inspection'),
  realSourcePixelsInspected: z.literal(true),
  syntheticEngineeringFixtureUsed: z.literal(false),
  acceptedForCaptionOwnedProfessionalAppearance: z.literal(true),
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

export interface CaptionBrollOwnerProfessionalInspectionContext {
  ownerResult: unknown
  acceptedFullMotionSpec: unknown
  acceptedReducedMotionSpec: unknown
  rejectedFullMotionSpec: unknown
  rejectedReducedMotionSpec: unknown
}

type ReceiptInput = Omit<
  CaptionBrollOwnerProfessionalInspectionReceipt,
  'schemaVersion' | 'inspectionDigestSha256'
>

export function createCaptionBrollOwnerProfessionalInspectionReceipt(
  input: ReceiptInput,
  context: CaptionBrollOwnerProfessionalInspectionContext,
): CaptionBrollOwnerProfessionalInspectionReceipt {
  assertClosedContractTree(input,
    'Caption B-roll-owner professional inspection input')
  const contract = {
    schemaVersion: CAPTION_BROLL_OWNER_PROFESSIONAL_INSPECTION_VERSION,
    ...structuredClone(input),
  }
  return parseCaptionBrollOwnerProfessionalInspectionReceipt({
    ...contract,
    inspectionDigestSha256: calculateSkillContractDigest({
      ...contract,
      inspectionDigestSha256: '',
    }, 'inspectionDigestSha256'),
  }, context)
}

export function parseCaptionBrollOwnerProfessionalInspectionReceipt(
  value: unknown,
  context: CaptionBrollOwnerProfessionalInspectionContext,
): CaptionBrollOwnerProfessionalInspectionReceipt {
  assertClosedContractTree(value,
    'Caption B-roll-owner professional inspection receipt')
  const receipt = receiptSchema.parse(value)
  const ownerResult = parseBrollCaptionOwnerReadResult(context.ownerResult)
  const acceptedFull =
    assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult({
      spec: context.acceptedFullMotionSpec,
      ownerResult,
    })
  const acceptedReduced =
    assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult({
      spec: context.acceptedReducedMotionSpec,
      ownerResult,
    })
  const rejectedFull =
    assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult({
      spec: context.rejectedFullMotionSpec,
      ownerResult,
    })
  const rejectedReduced =
    assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult({
      spec: context.rejectedReducedMotionSpec,
      ownerResult,
    })
  const acceptedFullRender = receipt.acceptedRenderArtifacts[0]
  const acceptedReducedRender = receipt.acceptedRenderArtifacts[1]
  if (receipt.inspectionDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'inspectionDigestSha256')) {
    throw new Error('Caption B-roll-owner inspection digest is stale.')
  }
  if (
    acceptedFull.reducedMotion
    || !acceptedReduced.reducedMotion
    || rejectedFull.reducedMotion
    || !rejectedReduced.reducedMotion
    || !sameScope(receipt.canonicalScope, acceptedFull.canonicalScope)
    || !sameScope(acceptedFull.canonicalScope,
      acceptedReduced.canonicalScope)
    || !sameScope(acceptedFull.canonicalScope, rejectedFull.canonicalScope)
    || !sameScope(rejectedFull.canonicalScope, rejectedReduced.canonicalScope)
    || !sameRef(receipt.ownerResultRef, {
      id: ownerResult.resultId,
      version: ownerResult.schemaVersion,
      contentHash: ownerResult.resultDigestSha256,
    })
    || !sameRef(receipt.acceptedReviewSpecRefs[0].reviewSpecRef,
      specRef(acceptedFull))
    || !sameRef(receipt.acceptedReviewSpecRefs[1].reviewSpecRef,
      specRef(acceptedReduced))
    || !sameRef(receipt.rejectedAttempt.fullMotionReviewSpecRef,
      specRef(rejectedFull))
    || !sameRef(receipt.rejectedAttempt.reducedMotionReviewSpecRef,
      specRef(rejectedReduced))
    || sameRef(specRef(acceptedFull), specRef(rejectedFull))
    || sameRef(specRef(acceptedReduced), specRef(rejectedReduced))
    || acceptedFull.sceneGroupRef.contentHash
      === rejectedFull.sceneGroupRef.contentHash
    || JSON.stringify(acceptedFull.sourceEvidence)
      !== JSON.stringify(rejectedFull.sourceEvidence)
    || JSON.stringify(acceptedFull.brollOwnerLineage)
      !== JSON.stringify(rejectedFull.brollOwnerLineage)
    || acceptedFull.masterTimingHash !== rejectedFull.masterTimingHash
    || acceptedFull.masterTimelineStartFrame
      !== rejectedFull.masterTimelineStartFrame
    || acceptedFull.masterTimelineEndFrameExclusive
      !== rejectedFull.masterTimelineEndFrameExclusive
    || !acceptedFull.layers.filter((layer) =>
      layer.presentationKind === 'hero_typography').every((layer) =>
        layer.layoutBasisPoints.x === 700
        && layer.layoutBasisPoints.width === 2_600
        && layer.typography.textAlign === 'left')
    || !rejectedFull.layers.filter((layer) =>
      layer.presentationKind === 'hero_typography').every((layer) =>
        layer.layoutBasisPoints.x === 800
        && layer.layoutBasisPoints.width === 8_400
        && layer.typography.textAlign === 'center')
    || !sameRef(acceptedFullRender.reviewSpecRef, specRef(acceptedFull))
    || !sameRef(acceptedReducedRender.reviewSpecRef,
      specRef(acceptedReduced))
    || acceptedFullRender.artifactRef.contentHash
      !== acceptedFullRender.artifactSha256
    || acceptedReducedRender.artifactRef.contentHash
      !== acceptedReducedRender.artifactSha256
    || sameRef(acceptedFullRender.artifactRef,
      receipt.rejectedAttempt.fullMotionRenderArtifactRef)
    || sameRef(acceptedReducedRender.artifactRef,
      receipt.rejectedAttempt.reducedMotionRenderArtifactRef)
  ) {
    throw new Error(
      'Caption B-roll-owner inspection crossed owner, render, or repair lineage.',
    )
  }
  verifyContactSheet(receipt.contactSheets[0], acceptedFullRender.artifactRef)
  verifyContactSheet(receipt.contactSheets[1],
    acceptedReducedRender.artifactRef)
  verifySpotChecks(receipt, 'full_motion', specRef(acceptedFull),
    acceptedFullRender.artifactRef, acceptedFull.inspectionFrameNumbers)
  verifySpotChecks(receipt, 'reduced_motion', specRef(acceptedReduced),
    acceptedReducedRender.artifactRef, acceptedReduced.inspectionFrameNumbers)
  const rejectedFrames = receipt.rejectedAttempt.inspectedFrameEvidence
  if (rejectedFrames.map((item) => item.frameNumber).join('|')
      !== '5|11|30|47'
    || new Set(rejectedFrames.map((item) => item.rasterSha256)).size
      !== rejectedFrames.length
    || rejectedFrames.some((item) =>
      item.rasterRef.contentHash !== item.rasterSha256)) {
    throw new Error('Caption rejected visual evidence is incomplete.')
  }
  return receipt
}

function verifyContactSheet(
  sheet: CaptionBrollOwnerProfessionalInspectionReceipt['contactSheets'][number],
  renderRef: CaptionBrollOwnerProfessionalInspectionReceipt[
    'acceptedRenderArtifacts'][number]['artifactRef'],
): void {
  if (!sameRef(sheet.renderArtifactRef, renderRef)
    || sheet.rasterRef.contentHash !== sheet.rasterSha256) {
    throw new Error('Caption B-roll-owner contact sheet is crossed.')
  }
}

function verifySpotChecks(
  receipt: CaptionBrollOwnerProfessionalInspectionReceipt,
  variant: 'full_motion' | 'reduced_motion',
  reviewSpecRef: CaptionBrollOwnerProfessionalInspectionReceipt[
    'acceptedReviewSpecRefs'][number]['reviewSpecRef'],
  renderRef: CaptionBrollOwnerProfessionalInspectionReceipt[
    'acceptedRenderArtifacts'][number]['artifactRef'],
  expectedFrames: number[],
): void {
  const checks = receipt.originalResolutionSpotChecks
    .filter((item) => item.variant === variant)
    .sort((left, right) => left.frameNumber - right.frameNumber)
  if (checks.map((item) => item.frameNumber).join('|')
      !== expectedFrames.join('|')
    || new Set(checks.map((item) => item.inspectionItemId)).size
      !== checks.length
    || checks.some((item) => !sameRef(item.reviewSpecRef, reviewSpecRef)
      || !sameRef(item.renderArtifactRef, renderRef)
      || item.rasterRef.contentHash !== item.rasterSha256)) {
    throw new Error(`Caption ${variant} visual spot checks diverged.`)
  }
}

function specRef(spec: ReturnType<
  typeof assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult>,
) {
  return {
    id: spec.reviewSpecId,
    version: spec.schemaVersion,
    contentHash: spec.reviewSpecDigestSha256,
  }
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
