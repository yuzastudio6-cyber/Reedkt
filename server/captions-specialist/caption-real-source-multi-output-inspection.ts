import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  CAPTION_REAL_SOURCE_MULTI_OUTPUT_INSPECTION_VERSION,
  type CaptionRealSourceMultiOutputInspectionReceipt,
  type CaptionRealSourceMultiOutputInspectionVariant,
} from '../../src/types/caption-real-source-multi-output-inspection'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../../src/types/caption-remotion-real-source-multi-output-review'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionRemotionRealSourceMultiOutputReviewSpec,
} from './caption-remotion-real-source-multi-output-review'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((range) =>
  range.endFrameExclusive > range.startFrame)
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema.nullable(),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(512),
}).strict()
const variantSchema = z.enum([
  'widescreen_full_motion',
  'widescreen_reduced_motion',
  'square_full_motion',
  'square_reduced_motion',
])
const outputFormatSchema = z.enum(['widescreen_16_9', 'square_1_1'])
const reviewSpecEvidenceSchema = z.object({
  variant: variantSchema,
  outputFormat: outputFormatSchema,
  reducedMotion: z.boolean(),
  reviewSpecRef: refSchema,
  canonicalScope: scopeSchema,
  confirmedOutputFrameRef: refSchema,
  confirmedOutputWidth: z.union([z.literal(1_920), z.literal(1_440)]),
  confirmedOutputHeight: z.union([z.literal(1_080), z.literal(1_440)]),
}).strict()
const renderArtifactSchema = z.object({
  variant: variantSchema,
  outputFormat: outputFormatSchema,
  reducedMotion: z.boolean(),
  reviewSpecRef: refSchema,
  artifactRef: refSchema,
  artifactSha256: sha256,
  mimeType: z.literal('video/mp4'),
  byteLength: z.number().int().positive().max(64 * 1024 * 1024),
  rasterWidth: z.union([z.literal(640), z.literal(480)]),
  rasterHeight: z.union([z.literal(360), z.literal(480)]),
  fpsNumerator: z.literal(30),
  fpsDenominator: z.literal(1),
  frameCount: z.number().int().min(24).max(900),
}).strict()
const contactSheetSchema = z.object({
  sheetId: safeKey,
  variant: variantSchema,
  reviewSpecRef: refSchema,
  renderArtifactRef: refSchema,
  startFrame: z.literal(0),
  endFrameExclusive: z.number().int().min(24).max(900),
  representedFrameCount: z.number().int().min(24).max(900),
  rasterRef: refSchema,
  rasterSha256: sha256,
  rasterWidth: z.union([z.literal(1_692), z.literal(1_276)]),
  rasterHeight: z.union([z.literal(742), z.literal(982)]),
  tileColumns: z.literal(13),
  tileRows: z.literal(10),
  thumbnailWidth: z.union([z.literal(128), z.literal(96)]),
  thumbnailHeight: z.union([z.literal(72), z.literal(96)]),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()
const spotCheckSchema = z.object({
  inspectionItemId: safeKey,
  variant: variantSchema,
  reviewSpecRef: refSchema,
  renderArtifactRef: refSchema,
  frameNumber: z.number().int().nonnegative().max(900),
  rasterRef: refSchema,
  rasterSha256: sha256,
  rasterWidth: z.union([z.literal(640), z.literal(480)]),
  rasterHeight: z.union([z.literal(360), z.literal(480)]),
  actualRasterOpenedAndInspected: z.literal(true),
}).strict()

const receiptSchema:
z.ZodType<CaptionRealSourceMultiOutputInspectionReceipt> = z.object({
  schemaVersion: z.literal(
    CAPTION_REAL_SOURCE_MULTI_OUTPUT_INSPECTION_VERSION),
  inspectionId: safeKey,
  inspectionDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  originalSourceRef: refSchema,
  originalSourceSha256: sha256,
  reviewSpecs: z.tuple([
    reviewSpecEvidenceSchema,
    reviewSpecEvidenceSchema,
    reviewSpecEvidenceSchema,
    reviewSpecEvidenceSchema,
  ]),
  renderArtifacts: z.tuple([
    renderArtifactSchema,
    renderArtifactSchema,
    renderArtifactSchema,
    renderArtifactSchema,
  ]),
  contactSheets: z.tuple([
    contactSheetSchema,
    contactSheetSchema,
    contactSheetSchema,
    contactSheetSchema,
  ]),
  originalResolutionSpotChecks: z.array(spotCheckSchema).length(16),
  coverage: z.object({
    outputFormatCount: z.literal(2),
    motionVariantCountPerOutput: z.literal(2),
    renderArtifactCount: z.literal(4),
    frameCountPerRender: z.number().int().min(24).max(900),
    totalRenderedFramesRepresented: z.number().int().min(96).max(3_600),
    everyRenderedFrameRepresentedExactlyOnce: z.literal(true),
    contactSheetCoverageComplete: z.literal(true),
    originalResolutionSpotCheckFrames:
      z.tuple([z.literal(8), z.literal(21), z.literal(80), z.literal(122)]),
    originalResolutionSpotChecksComplete: z.literal(true),
    outputSpecificRecompositionInspected: z.literal(true),
    fullReducedMotionSemanticParityInspected: z.literal(true),
    completeMotionPlaybackClaimed: z.literal(false),
  }).strict(),
  findings: z.object({
    sourceSubstitutionObserved: z.literal(false),
    sourceAspectDistortionObserved: z.literal(false),
    crossCanvasEvidenceReuseObserved: z.literal(false),
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
  designFindings: z.object({
    editorialSidecarReadable: z.literal(true),
    speakerPanelRemainsVisuallyPrimary: z.literal(true),
    fullReducedMotionSemanticParityAccepted: z.literal(true),
    widescreenRecompositionAccepted: z.literal(true),
    squareRecompositionAccepted: z.literal(true),
  }).strict(),
  inspectionMethod: z.literal(
    'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1'),
  inspectorClass: z.literal('codex_agent_direct_visual_inspection'),
  realSourcePixelsInspected: z.literal(true),
  syntheticEngineeringFixtureUsed: z.literal(false),
  syntheticEngineeringFixtureQualifiedProfessionalAppearance: z.literal(false),
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

export interface CaptionRealSourceMultiOutputInspectionContext {
  widescreenFullReviewSpec: unknown
  widescreenReducedReviewSpec: unknown
  squareFullReviewSpec: unknown
  squareReducedReviewSpec: unknown
}

type ReceiptInput = Omit<
  CaptionRealSourceMultiOutputInspectionReceipt,
  'schemaVersion' | 'inspectionDigestSha256'
>

const EXPECTED_VARIANTS = [
  'widescreen_full_motion',
  'widescreen_reduced_motion',
  'square_full_motion',
  'square_reduced_motion',
] as const

export function createCaptionRealSourceMultiOutputInspectionReceipt(
  input: ReceiptInput,
  context: CaptionRealSourceMultiOutputInspectionContext,
): CaptionRealSourceMultiOutputInspectionReceipt {
  assertClosedContractTree(input,
    'Caption real-source multi-output inspection input')
  const contract = {
    schemaVersion: CAPTION_REAL_SOURCE_MULTI_OUTPUT_INSPECTION_VERSION,
    ...structuredClone(input),
  }
  return parseCaptionRealSourceMultiOutputInspectionReceipt({
    ...contract,
    inspectionDigestSha256: calculateSkillContractDigest({
      ...contract,
      inspectionDigestSha256: '',
    }, 'inspectionDigestSha256'),
  }, context)
}

export function parseCaptionRealSourceMultiOutputInspectionReceipt(
  value: unknown,
  context: CaptionRealSourceMultiOutputInspectionContext,
): CaptionRealSourceMultiOutputInspectionReceipt {
  assertClosedContractTree(value,
    'Caption real-source multi-output inspection receipt')
  const receipt = receiptSchema.parse(value)
  if (receipt.inspectionDigestSha256 !== calculateSkillContractDigest(
    receipt as unknown as Record<string, unknown>,
    'inspectionDigestSha256')) {
    throw new Error('Caption multi-output inspection digest is stale.')
  }
  if (receipt.originalSourceRef.contentHash !== receipt.originalSourceSha256) {
    throw new Error('Caption multi-output inspection source is crossed.')
  }
  const specs = parseContext(context)
  verifySpecFamily(specs, receipt.originalSourceRef)
  for (const [index, variant] of EXPECTED_VARIANTS.entries()) {
    const spec = specs[variant]
    const specEvidence = receipt.reviewSpecs[index]!
    const render = receipt.renderArtifacts[index]!
    const sheet = receipt.contactSheets[index]!
    verifySpecEvidence(specEvidence, variant, spec)
    verifyRenderEvidence(render, variant, spec)
    verifyContactSheet(sheet, variant, spec, render)
    verifySpotChecks(receipt, variant, spec, render)
  }
  if (new Set(receipt.renderArtifacts.map((item) =>
    refKey(item.artifactRef))).size !== EXPECTED_VARIANTS.length
    || new Set(receipt.contactSheets.map((item) =>
      refKey(item.rasterRef))).size !== EXPECTED_VARIANTS.length
    || receipt.coverage.frameCountPerRender !== specs
      .widescreen_full_motion.durationFrames
    || receipt.coverage.totalRenderedFramesRepresented !==
      specs.widescreen_full_motion.durationFrames * EXPECTED_VARIANTS.length) {
    throw new Error('Caption multi-output inspection coverage is incomplete.')
  }
  return receipt
}

function parseContext(
  context: CaptionRealSourceMultiOutputInspectionContext,
): Record<CaptionRealSourceMultiOutputInspectionVariant,
CaptionRemotionRealSourceMultiOutputReviewSpec> {
  return {
    widescreen_full_motion:
      parseCaptionRemotionRealSourceMultiOutputReviewSpec(
        context.widescreenFullReviewSpec),
    widescreen_reduced_motion:
      parseCaptionRemotionRealSourceMultiOutputReviewSpec(
        context.widescreenReducedReviewSpec),
    square_full_motion:
      parseCaptionRemotionRealSourceMultiOutputReviewSpec(
        context.squareFullReviewSpec),
    square_reduced_motion:
      parseCaptionRemotionRealSourceMultiOutputReviewSpec(
        context.squareReducedReviewSpec),
  }
}

function verifySpecFamily(
  specs: Record<CaptionRealSourceMultiOutputInspectionVariant,
  CaptionRemotionRealSourceMultiOutputReviewSpec>,
  originalSourceRef: CaptionDomainRef,
): void {
  const ordered = EXPECTED_VARIANTS.map((variant) => specs[variant])
  const first = ordered[0]!
  if (ordered.some((spec) =>
    !sameBaseScope(first.canonicalScope, spec.canonicalScope)
    || !sameRef(first.sourceEvidence.originalSourceRef,
      spec.sourceEvidence.originalSourceRef)
    || !sameRef(originalSourceRef, spec.sourceEvidence.originalSourceRef)
    || spec.durationFrames !== first.durationFrames
    || spec.syntheticEngineeringFixtureAcceptedAsProfessionalAppearance
    || !spec.realSourcePixelsRequiredForProfessionalAppearance)) {
    throw new Error('Caption multi-output inspection specs crossed source scope.')
  }
  const wideFull = specs.widescreen_full_motion
  const wideReduced = specs.widescreen_reduced_motion
  const squareFull = specs.square_full_motion
  const squareReduced = specs.square_reduced_motion
  if (wideFull.outputFormat !== 'widescreen_16_9'
    || wideFull.reducedMotion
    || wideReduced.outputFormat !== 'widescreen_16_9'
    || !wideReduced.reducedMotion
    || squareFull.outputFormat !== 'square_1_1'
    || squareFull.reducedMotion
    || squareReduced.outputFormat !== 'square_1_1'
    || !squareReduced.reducedMotion
    || !sameScope(wideFull.canonicalScope, wideReduced.canonicalScope)
    || !sameScope(squareFull.canonicalScope, squareReduced.canonicalScope)
    || !sameRef(wideFull.confirmedOutputFrame.frameRef,
      wideReduced.confirmedOutputFrame.frameRef)
    || !sameRef(squareFull.confirmedOutputFrame.frameRef,
      squareReduced.confirmedOutputFrame.frameRef)
    || sameRef(wideFull.confirmedOutputFrame.frameRef,
      squareFull.confirmedOutputFrame.frameRef)) {
    throw new Error('Caption multi-output inspection spec family is invalid.')
  }
}

function verifySpecEvidence(
  evidence: CaptionRealSourceMultiOutputInspectionReceipt['reviewSpecs'][number],
  variant: CaptionRealSourceMultiOutputInspectionVariant,
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec,
): void {
  if (evidence.variant !== variant
    || evidence.outputFormat !== spec.outputFormat
    || evidence.reducedMotion !== spec.reducedMotion
    || !sameRef(evidence.reviewSpecRef, specRef(spec))
    || !sameScope(evidence.canonicalScope, spec.canonicalScope)
    || !sameRef(evidence.confirmedOutputFrameRef,
      spec.confirmedOutputFrame.frameRef)
    || evidence.confirmedOutputWidth !== spec.confirmedOutputFrame.width
    || evidence.confirmedOutputHeight !== spec.confirmedOutputFrame.height) {
    throw new Error(`Caption ${variant} inspection spec evidence diverged.`)
  }
}

function verifyRenderEvidence(
  render: CaptionRealSourceMultiOutputInspectionReceipt[
    'renderArtifacts'][number],
  variant: CaptionRealSourceMultiOutputInspectionVariant,
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec,
): void {
  if (render.variant !== variant
    || render.outputFormat !== spec.outputFormat
    || render.reducedMotion !== spec.reducedMotion
    || !sameRef(render.reviewSpecRef, specRef(spec))
    || render.artifactRef.contentHash !== render.artifactSha256
    || render.rasterWidth !== spec.privateReviewFrame.width
    || render.rasterHeight !== spec.privateReviewFrame.height
    || render.frameCount !== spec.durationFrames) {
    throw new Error(`Caption ${variant} inspection render diverged.`)
  }
}

function verifyContactSheet(
  sheet: CaptionRealSourceMultiOutputInspectionReceipt[
    'contactSheets'][number],
  variant: CaptionRealSourceMultiOutputInspectionVariant,
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec,
  render: CaptionRealSourceMultiOutputInspectionReceipt[
    'renderArtifacts'][number],
): void {
  const wide = spec.outputFormat === 'widescreen_16_9'
  if (sheet.variant !== variant
    || !sameRef(sheet.reviewSpecRef, specRef(spec))
    || !sameRef(sheet.renderArtifactRef, render.artifactRef)
    || sheet.endFrameExclusive !== spec.durationFrames
    || sheet.representedFrameCount !== spec.durationFrames
    || sheet.rasterRef.contentHash !== sheet.rasterSha256
    || sheet.rasterWidth !== (wide ? 1_692 : 1_276)
    || sheet.rasterHeight !== (wide ? 742 : 982)
    || sheet.thumbnailWidth !== (wide ? 128 : 96)
    || sheet.thumbnailHeight !== (wide ? 72 : 96)) {
    throw new Error(`Caption ${variant} contact-sheet evidence diverged.`)
  }
}

function verifySpotChecks(
  receipt: CaptionRealSourceMultiOutputInspectionReceipt,
  variant: CaptionRealSourceMultiOutputInspectionVariant,
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec,
  render: CaptionRealSourceMultiOutputInspectionReceipt[
    'renderArtifacts'][number],
): void {
  const expectedFrames = receipt.coverage.originalResolutionSpotCheckFrames
  const checks = receipt.originalResolutionSpotChecks
    .filter((item) => item.variant === variant)
    .sort((left, right) => left.frameNumber - right.frameNumber)
  if (checks.map((item) => item.frameNumber).join('|') !==
      expectedFrames.join('|')
    || new Set(checks.map((item) => item.inspectionItemId)).size
      !== checks.length
    || checks.some((item) =>
      !sameRef(item.reviewSpecRef, specRef(spec))
      || !sameRef(item.renderArtifactRef, render.artifactRef)
      || item.rasterRef.contentHash !== item.rasterSha256
      || item.rasterWidth !== spec.privateReviewFrame.width
      || item.rasterHeight !== spec.privateReviewFrame.height)) {
    throw new Error(`Caption ${variant} original-resolution checks diverged.`)
  }
}

function specRef(
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec,
): CaptionDomainRef {
  return {
    id: spec.reviewSpecId,
    version: spec.schemaVersion,
    contentHash: spec.reviewSpecDigestSha256,
  }
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function sameScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return sameBaseScope(left, right)
    && left.outputId === right.outputId
    && left.sceneId === right.sceneId
    && JSON.stringify(left.authorizedFrameRanges) ===
      JSON.stringify(right.authorizedFrameRanges)
}

function sameBaseScope(
  left: CaptionDomainCanonicalScope,
  right: CaptionDomainCanonicalScope,
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.planVersionId === right.planVersionId
    && sameNullableRef(left.approvedSnapshotRef, right.approvedSnapshotRef)
}

function sameNullableRef(
  left: CaptionDomainRef | null,
  right: CaptionDomainRef | null,
): boolean {
  return left === null || right === null
    ? left === right
    : sameRef(left, right)
}
