import { z } from 'zod'

import {
  CAPTION_REAL_SOURCE_COMPLETE_TIME_INSPECTION_VERSION,
  type CaptionRealSourceCompleteTimeInspectionReceipt,
} from '../../src/types/caption-real-source-complete-time-inspection'
import type { CaptionDomainCanonicalScope } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionRemotionRealSourceReviewSpec,
} from './caption-remotion-real-source-review'

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
  authorizedFrameRanges: z.array(rangeSchema).min(1).max(512),
}).strict()
const variantSchema = z.enum(['full_motion', 'reduced_motion'])
const renderArtifactSchema = z.object({
  variant: variantSchema,
  artifactRef: refSchema,
  mimeType: z.literal('video/mp4'),
  byteLength: z.number().int().positive().max(64 * 1024 * 1024),
  rasterWidth: z.literal(360),
  rasterHeight: z.literal(640),
  fpsNumerator: z.literal(30),
  fpsDenominator: z.literal(1),
  frameCount: z.number().int().min(24).max(900),
}).strict()
const contactSheetSchema = z.object({
  sheetId: safeKey,
  variant: variantSchema,
  renderArtifactRef: refSchema,
  sheetIndex: z.number().int().nonnegative().max(100),
  startFrame: z.number().int().nonnegative().max(1_000_000),
  endFrameExclusive: z.number().int().positive().max(1_000_000),
  representedFrameCount: z.number().int().positive().max(25),
  rasterRef: refSchema,
  rasterSha256: sha256,
  rasterWidth: z.literal(924),
  rasterHeight: z.literal(1624),
  tileColumns: z.literal(5),
  tileRows: z.literal(5),
  thumbnailWidth: z.literal(180),
  thumbnailHeight: z.literal(320),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()
const spotCheckSchema = z.object({
  inspectionItemId: safeKey,
  variant: variantSchema,
  renderArtifactRef: refSchema,
  frameNumber: z.number().int().nonnegative().max(1_000_000),
  rasterRef: refSchema,
  rasterSha256: sha256,
  rasterWidth: z.literal(360),
  rasterHeight: z.literal(640),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()

const receiptSchema:
z.ZodType<CaptionRealSourceCompleteTimeInspectionReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_REAL_SOURCE_COMPLETE_TIME_INSPECTION_VERSION),
  inspectionId: safeKey,
  inspectionDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  fullMotionReviewSpecRef: refSchema,
  reducedMotionReviewSpecRef: refSchema,
  renderArtifacts: z.tuple([
    renderArtifactSchema.extend({ variant: z.literal('full_motion') }).strict(),
    renderArtifactSchema.extend({ variant: z.literal('reduced_motion') }).strict(),
  ]),
  contactSheets: z.array(contactSheetSchema).min(2).max(202),
  originalResolutionSpotChecks: z.array(spotCheckSchema).min(8).max(32),
  coverage: z.object({
    frameCountPerVariant: z.number().int().min(24).max(900),
    variantCount: z.literal(2),
    totalRenderedFramesRepresented:
      z.number().int().min(48).max(1_800),
    everyFrameRepresentedExactlyOnce: z.literal(true),
    contactSheetCoverageComplete: z.literal(true),
    originalResolutionSpotChecksComplete: z.literal(true),
    completeMotionPlaybackClaimed: z.literal(false),
  }).strict(),
  findings: z.object({
    faceObstructionObserved: z.literal(false),
    gestureObstructionObserved: z.literal(false),
    captionClippingObserved: z.literal(false),
    phraseOverflowObserved: z.literal(false),
    heroAndAccessiblePlateCollisionObserved: z.literal(false),
    unstablePlacementObserved: z.literal(false),
    unusableCueTransitionObserved: z.literal(false),
    tailTruncationObserved: z.literal(false),
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

type ReceiptInput = Omit<
  CaptionRealSourceCompleteTimeInspectionReceipt,
  'schemaVersion' | 'inspectionDigestSha256'
>

export function createCaptionRealSourceCompleteTimeInspectionReceipt(
  input: ReceiptInput,
  context: { fullMotionReviewSpec: unknown; reducedMotionReviewSpec: unknown },
): CaptionRealSourceCompleteTimeInspectionReceipt {
  assertClosedContractTree(input,
    'Caption real-source complete-time inspection input')
  const contract = {
    schemaVersion: CAPTION_REAL_SOURCE_COMPLETE_TIME_INSPECTION_VERSION,
    ...structuredClone(input),
  }
  return parseCaptionRealSourceCompleteTimeInspectionReceipt({
    ...contract,
    inspectionDigestSha256: calculateSkillContractDigest({
      ...contract,
      inspectionDigestSha256: '',
    }, 'inspectionDigestSha256'),
  }, context)
}

export function parseCaptionRealSourceCompleteTimeInspectionReceipt(
  value: unknown,
  context: { fullMotionReviewSpec: unknown; reducedMotionReviewSpec: unknown },
): CaptionRealSourceCompleteTimeInspectionReceipt {
  assertClosedContractTree(value,
    'Caption real-source complete-time inspection receipt')
  const receipt = receiptSchema.parse(value)
  const fullSpec = parseCaptionRemotionRealSourceReviewSpec(
    context.fullMotionReviewSpec)
  const reducedSpec = parseCaptionRemotionRealSourceReviewSpec(
    context.reducedMotionReviewSpec)
  if (receipt.inspectionDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'inspectionDigestSha256')) {
    throw new Error('Caption complete-time inspection digest is stale.')
  }
  const fullRender = receipt.renderArtifacts[0]
  const reducedRender = receipt.renderArtifacts[1]
  if (fullSpec.reducedMotion
    || !reducedSpec.reducedMotion
    || !sameScope(fullSpec.canonicalScope, reducedSpec.canonicalScope)
    || !sameScope(receipt.canonicalScope, fullSpec.canonicalScope)
    || !sameRef(receipt.fullMotionReviewSpecRef, specRef(fullSpec))
    || !sameRef(receipt.reducedMotionReviewSpecRef, specRef(reducedSpec))
    || fullSpec.durationFrames !== reducedSpec.durationFrames
    || fullRender.frameCount !== fullSpec.durationFrames
    || reducedRender.frameCount !== reducedSpec.durationFrames
    || fullRender.artifactRef.contentHash.length !== 64
    || reducedRender.artifactRef.contentHash.length !== 64
    || sameRef(fullRender.artifactRef, reducedRender.artifactRef)
    || receipt.coverage.frameCountPerVariant !== fullSpec.durationFrames
    || receipt.coverage.totalRenderedFramesRepresented !==
      fullSpec.durationFrames * 2) {
    throw new Error('Caption complete-time inspection crossed render scope.')
  }
  verifySheetCoverage(receipt, 'full_motion', fullRender.artifactRef,
    fullSpec.durationFrames)
  verifySheetCoverage(receipt, 'reduced_motion', reducedRender.artifactRef,
    reducedSpec.durationFrames)
  verifySpotChecks(receipt, 'full_motion', fullRender.artifactRef,
    fullSpec.inspectionFrameNumbers)
  verifySpotChecks(receipt, 'reduced_motion', reducedRender.artifactRef,
    reducedSpec.inspectionFrameNumbers)
  return receipt
}

function verifySheetCoverage(
  receipt: CaptionRealSourceCompleteTimeInspectionReceipt,
  variant: 'full_motion' | 'reduced_motion',
  renderRef: CaptionRealSourceCompleteTimeInspectionReceipt[
    'renderArtifacts'][number]['artifactRef'],
  frameCount: number,
): void {
  const sheets = receipt.contactSheets
    .filter((sheet) => sheet.variant === variant)
    .sort((left, right) => left.sheetIndex - right.sheetIndex)
  const expectedSheetCount = Math.ceil(frameCount / 25)
  if (sheets.length !== expectedSheetCount
    || new Set(sheets.map((sheet) => sheet.sheetId)).size !== sheets.length
    || new Set(sheets.map((sheet) => sheet.rasterSha256)).size !== sheets.length) {
    throw new Error(`Caption ${variant} contact-sheet set is incomplete.`)
  }
  let cursor = 0
  for (const [index, sheet] of sheets.entries()) {
    const expectedEnd = Math.min(frameCount, cursor + 25)
    if (sheet.sheetIndex !== index
      || sheet.startFrame !== cursor
      || sheet.endFrameExclusive !== expectedEnd
      || sheet.representedFrameCount !== expectedEnd - cursor
      || !sameRef(sheet.renderArtifactRef, renderRef)
      || sheet.rasterRef.contentHash !== sheet.rasterSha256) {
      throw new Error(`Caption ${variant} contact-sheet coverage diverged.`)
    }
    cursor = expectedEnd
  }
  if (cursor !== frameCount) {
    throw new Error(`Caption ${variant} contact sheets omit rendered frames.`)
  }
}

function verifySpotChecks(
  receipt: CaptionRealSourceCompleteTimeInspectionReceipt,
  variant: 'full_motion' | 'reduced_motion',
  renderRef: CaptionRealSourceCompleteTimeInspectionReceipt[
    'renderArtifacts'][number]['artifactRef'],
  expectedFrames: number[],
): void {
  const checks = receipt.originalResolutionSpotChecks
    .filter((item) => item.variant === variant)
    .sort((left, right) => left.frameNumber - right.frameNumber)
  if (checks.map((item) => item.frameNumber).join('|') !==
      expectedFrames.join('|')
    || new Set(checks.map((item) => item.inspectionItemId)).size !== checks.length
    || checks.some((item) => !sameRef(item.renderArtifactRef, renderRef)
      || item.rasterRef.contentHash !== item.rasterSha256)) {
    throw new Error(`Caption ${variant} original-resolution checks diverged.`)
  }
}

function specRef(spec: ReturnType<
  typeof parseCaptionRemotionRealSourceReviewSpec>,
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
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.planVersionId === right.planVersionId
    && left.outputId === right.outputId
    && left.sceneId === right.sceneId
    && sameNullableRef(left.approvedSnapshotRef, right.approvedSnapshotRef)
    && JSON.stringify(left.authorizedFrameRanges) ===
      JSON.stringify(right.authorizedFrameRanges)
}

function sameNullableRef(
  left: { id: string; version: string; contentHash: string } | null,
  right: { id: string; version: string; contentHash: string } | null,
): boolean {
  return left === null || right === null
    ? left === right
    : sameRef(left, right)
}
