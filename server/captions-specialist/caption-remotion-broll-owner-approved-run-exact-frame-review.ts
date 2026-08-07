import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { BrollCaptionOwnerReadResult } from
  '../../src/types/caption-broll-owner-read-adapter'
import {
  CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_PROFILE,
  CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_REVIEW_VERSION,
  type CaptionRemotionBrollOwnerApprovedRunExactFrameReview,
} from '../../src/types/caption-remotion-broll-owner-approved-run-exact-frame-review'
import type { CaptionRemotionBrollOwnerApprovedRunReviewSpec } from
  '../../src/types/caption-remotion-broll-owner-approved-run-review'
import {
  type OfflineRemotionCaptionBrollOwnerApprovedRunExactFrameSceneGroupPayload,
  type OfflineRemotionRenderRequest,
  validateOfflineRemotionRenderRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  buildCaptionRemotionBrollOwnerApprovedRunReviewRequest,
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
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(z.object({
    startFrame: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
  }).strict()).length(1),
}).strict()
const reviewSchema:
z.ZodType<CaptionRemotionBrollOwnerApprovedRunExactFrameReview> = z.object({
  schemaVersion: z.literal(
    CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_REVIEW_VERSION),
  exactFrameReviewId: safeKey,
  exactFrameReviewDigestSha256: sha256,
  sourceReviewSpecRef: refSchema,
  canonicalScope: scopeSchema,
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  sceneGroupRef: refSchema,
  motionLockRef: refSchema,
  storyTimingResolutionRef: refSchema,
  confirmedOutputFrame: z.object({
    frameRef: refSchema,
    outputId: safeKey,
    width: z.literal(3_840),
    height: z.literal(2_160),
    fps: z.literal(30),
    exactConfirmedFrameRendered: z.literal(true),
  }).strict(),
  inputSourceFrame: z.object({
    width: z.literal(640),
    height: z.literal(360),
    profileId: z.literal(
      'approved_b_roll_remotion_preview_proxy_matroska_v1'),
    sourceProxyUpscaleRequired: z.literal(true),
    sourceProxyAcceptedAsFinalPictureQuality: z.literal(false),
  }).strict(),
  compositionProfileId: z.literal(
    CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_PROFILE),
  durationFrames: z.number().int().min(24).max(900),
  reducedMotion: z.boolean(),
  inspectionFrameNumbers: z.array(z.number().int().nonnegative())
    .min(4).max(16),
  exactV2ReviewSpecReread: z.literal(true),
  exactConfirmedFrameMatchesApprovedRun: z.literal(true),
  typographyAndLayoutEvaluatedAtConfirmedFrame: z.literal(true),
  sourceQualityQualificationClaimed: z.literal(false),
  finalCustomerCanvasClaimed: z.literal(false),
  replacesCanonicalFinalCanvas: z.literal(false),
  privateInternalOnly: z.literal(true),
  runtimeExecutionGranted: z.literal(false),
  assetCreationGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()

export function createCaptionRemotionBrollOwnerApprovedRunExactFrameReview(
  input: {
    exactFrameReviewId: string
    sourceReviewSpec: CaptionRemotionBrollOwnerApprovedRunReviewSpec
  },
): CaptionRemotionBrollOwnerApprovedRunExactFrameReview {
  assertClosedContractTree(input,
    'Caption approved-run exact-frame review input')
  const source = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(
    input.sourceReviewSpec)
  const withoutDigest: Omit<
    CaptionRemotionBrollOwnerApprovedRunExactFrameReview,
    'exactFrameReviewDigestSha256'> = {
    schemaVersion:
      CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_REVIEW_VERSION,
    exactFrameReviewId: safeKey.parse(input.exactFrameReviewId),
    sourceReviewSpecRef: {
      id: source.reviewSpecId,
      version: source.schemaVersion,
      contentHash: source.reviewSpecDigestSha256,
    },
    canonicalScope: structuredClone(source.canonicalScope),
    approvedSnapshotRef: structuredClone(
      source.approvedRunLineage.approvedSnapshotRef),
    executionPackageRef: structuredClone(
      source.approvedRunLineage.executionPackageRef),
    sceneGroupRef: structuredClone(source.sceneGroupRef),
    motionLockRef: structuredClone(source.motionLockRef),
    storyTimingResolutionRef: structuredClone(
      source.storyTimingResolutionRef),
    confirmedOutputFrame: {
      frameRef: structuredClone(source.confirmedOutputFrame.frameRef),
      outputId: source.confirmedOutputFrame.outputId,
      width: 3_840,
      height: 2_160,
      fps: 30,
      exactConfirmedFrameRendered: true,
    },
    inputSourceFrame: {
      width: 640,
      height: 360,
      profileId: 'approved_b_roll_remotion_preview_proxy_matroska_v1',
      sourceProxyUpscaleRequired: true,
      sourceProxyAcceptedAsFinalPictureQuality: false,
    },
    compositionProfileId:
      CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_PROFILE,
    durationFrames: source.durationFrames,
    reducedMotion: source.reducedMotion,
    inspectionFrameNumbers: structuredClone(source.inspectionFrameNumbers),
    exactV2ReviewSpecReread: true,
    exactConfirmedFrameMatchesApprovedRun: true,
    typographyAndLayoutEvaluatedAtConfirmedFrame: true,
    sourceQualityQualificationClaimed: false,
    finalCustomerCanvasClaimed: false,
    replacesCanonicalFinalCanvas: false,
    privateInternalOnly: true,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  return parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview({
    ...withoutDigest,
    exactFrameReviewDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      exactFrameReviewDigestSha256: '',
    } as unknown as Record<string, unknown>,
    'exactFrameReviewDigestSha256'),
  })
}

export function parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview(
  value: unknown,
): CaptionRemotionBrollOwnerApprovedRunExactFrameReview {
  assertClosedContractTree(value,
    'Caption approved-run exact-frame review')
  const parsed = reviewSchema.parse(value)
  const range = parsed.canonicalScope.authorizedFrameRanges[0]!
  if (parsed.exactFrameReviewDigestSha256
      !== calculateSkillContractDigest(
        parsed as unknown as Record<string, unknown>,
        'exactFrameReviewDigestSha256')
    || parsed.canonicalScope.approvedSnapshotRef === null
    || !sameRef(parsed.canonicalScope.approvedSnapshotRef,
      parsed.approvedSnapshotRef)
    || parsed.canonicalScope.outputId !== parsed.confirmedOutputFrame.outputId
    || range.endFrameExclusive - range.startFrame !== parsed.durationFrames
    || new Set(parsed.inspectionFrameNumbers).size
      !== parsed.inspectionFrameNumbers.length
    || parsed.inspectionFrameNumbers.some((frame, index) =>
      frame >= parsed.durationFrames
      || (index > 0 && frame <= parsed.inspectionFrameNumbers[index - 1]!))) {
    throw new Error(
      'Caption approved-run exact-frame review lineage is inconsistent.')
  }
  return structuredClone(parsed)
}

export function buildCaptionRemotionBrollOwnerApprovedRunExactFrameRequest(
  input: {
    exactFrameReview: CaptionRemotionBrollOwnerApprovedRunExactFrameReview
    sourceReviewSpec: CaptionRemotionBrollOwnerApprovedRunReviewSpec
    ownerResult: BrollCaptionOwnerReadResult
    remotionProxyBytes: Buffer
  },
): OfflineRemotionRenderRequest & {
  payload:
    OfflineRemotionCaptionBrollOwnerApprovedRunExactFrameSceneGroupPayload
} {
  const exact = parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview(
    input.exactFrameReview)
  const source = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(
    input.sourceReviewSpec)
  if (!sameRef(exact.sourceReviewSpecRef, {
    id: source.reviewSpecId,
    version: source.schemaVersion,
    contentHash: source.reviewSpecDigestSha256,
  }) || !sameRef(exact.approvedSnapshotRef,
    source.approvedRunLineage.approvedSnapshotRef)
    || !sameRef(exact.executionPackageRef,
      source.approvedRunLineage.executionPackageRef)
    || !sameRef(exact.sceneGroupRef, source.sceneGroupRef)
    || !sameRef(exact.motionLockRef, source.motionLockRef)
    || !sameRef(exact.storyTimingResolutionRef,
      source.storyTimingResolutionRef)
    || exact.reducedMotion !== source.reducedMotion
    || exact.inspectionFrameNumbers.join('|')
      !== source.inspectionFrameNumbers.join('|')) {
    throw new Error(
      'Caption approved-run exact-frame review crossed its V2 source spec.')
  }
  const proxyRequest =
    buildCaptionRemotionBrollOwnerApprovedRunReviewRequest({
      spec: source,
      ownerResult: input.ownerResult,
      remotionProxyBytes: input.remotionProxyBytes,
    })
  const request = validateOfflineRemotionRenderRequest({
    ...proxyRequest,
    payload: {
      ...proxyRequest.payload,
      compositionProfileId:
        CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_PROFILE,
      width: 3_840,
      height: 2_160,
      privateReviewScaleNumerator: 1,
      privateReviewScaleDenominator: 1,
    },
  })
  if (request.payload.compositionProfileId
      !== CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_PROFILE) {
    throw new Error(
      'Caption approved-run exact-frame request lost its V6 profile.')
  }
  return request as OfflineRemotionRenderRequest & {
    payload:
      OfflineRemotionCaptionBrollOwnerApprovedRunExactFrameSceneGroupPayload
  }
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
