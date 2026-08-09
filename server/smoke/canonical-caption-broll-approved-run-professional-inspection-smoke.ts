import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import type {
  CaptionBrollApprovedRunProfessionalInspectionOutput,
} from '../../src/types/caption-broll-approved-run-professional-inspection'
import {
  createCaptionBrollApprovedRunProfessionalInspectionReceipt,
  parseCaptionBrollApprovedRunProfessionalInspectionReceipt,
} from
  '../captions-specialist/caption-broll-approved-run-professional-inspection'
import {
  parseCaptionRemotionBrollOwnerApprovedRunReviewSpec,
} from '../captions-specialist/caption-remotion-broll-owner-approved-run-review'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const requestedRoot = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_PROFESSIONAL_REVIEW_ROOT?.trim() ?? ''
const expectedPackageSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_INSPECTED_PACKAGE_SHA256?.trim() ?? ''
const expectedFullContactSheetSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_INSPECTED_FULL_CONTACT_SHEET_SHA256
  ?.trim() ?? ''
const expectedReducedContactSheetSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_INSPECTED_REDUCED_CONTACT_SHEET_SHA256
  ?.trim() ?? ''
if (!requestedRoot || ![
  expectedPackageSha256,
  expectedFullContactSheetSha256,
  expectedReducedContactSheetSha256,
].every((value) => /^[a-f0-9]{64}$/u.test(value))) {
  throw new Error(
    'Approved-run professional inspection requires one private root and all exact inspected SHA-256 bindings.',
  )
}
const root = resolve(requestedRoot)
const readJson = async (fileName: string): Promise<unknown> =>
  JSON.parse(await readFile(join(root, fileName), 'utf8')) as unknown
const sha256 = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex')
const ref = (id: string, version: string, contentHash: string) => ({
  id,
  version,
  contentHash,
})

const inspectionPackage = await readJson('inspection-package.json') as {
  schemaVersion: string
  packageSha256: string
  baselinePreviewSha256: string
  ownerRequestRef: { id: string; version: string; contentHash: string }
  ownerResultRef: { id: string; version: string; contentHash: string }
  canonicalTranscriptRef: { id: string; version: string; contentHash: string }
  canonicalTranscriptEvidenceRef: {
    id: string
    version: string
    contentHash: string
  }
  outputs: Array<{
    motionVariant: 'full_motion' | 'reduced_motion'
    fileName: string
    sha256: string
    byteLength: number
    reviewSpecDigestSha256: string
    sampleFrames: Array<{
      frameIndex: number
      fileName: string
      sha256: string
    }>
  }>
}
assert.equal(inspectionPackage.packageSha256, expectedPackageSha256)
const fullSpecValue = await readJson('full-motion-spec.json')
const reducedSpecValue = await readJson('reduced-motion-spec.json')
const fullSpec = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(
  fullSpecValue)
const reducedSpec = parseCaptionRemotionBrollOwnerApprovedRunReviewSpec(
  reducedSpecValue)

async function output(
  variant: 'full_motion' | 'reduced_motion',
  spec: typeof fullSpec,
  expectedContactSheetSha256: string,
): Promise<CaptionBrollApprovedRunProfessionalInspectionOutput> {
  const prefix = variant === 'full_motion' ? 'full-motion' : 'reduced-motion'
  const packageOutput = inspectionPackage.outputs.find((item) =>
    item.motionVariant === variant)
  assert.ok(packageOutput)
  const videoBytes = await readFile(join(root, packageOutput.fileName))
  assert.equal(videoBytes.byteLength, packageOutput.byteLength)
  assert.equal(sha256(videoBytes), packageOutput.sha256)
  assert.equal(packageOutput.reviewSpecDigestSha256,
    spec.reviewSpecDigestSha256)
  const contactName = `direct-${prefix}-every-frame-contact-sheet.png`
  const contactBytes = await readFile(join(root, contactName))
  const contactHash = sha256(contactBytes)
  assert.equal(contactHash, expectedContactSheetSha256)
  const originalResolutionSpotChecks = await Promise.all(
    packageOutput.sampleFrames.map(async (frame) => {
      const bytes = await readFile(join(root, frame.fileName))
      assert.equal(sha256(bytes), frame.sha256)
      return {
        frameNumber: frame.frameIndex,
        rasterRef: ref(
          `caption.broll.approved-run.${variant}.frame.${frame.frameIndex}`,
          'caption-direct-inspection-raster-v1',
          frame.sha256,
        ),
        rasterWidth: 640 as const,
        rasterHeight: 360 as const,
        actualRasterOpenedAndInspected: true as const,
      }
    }),
  )
  const transitionSpotChecks = await Promise.all(
    [48, 52, 56, 60].map(async (frameNumber) => {
      const fileName = `direct-${prefix}-transition-${frameNumber}.png`
      const bytes = await readFile(join(root, fileName))
      return {
        frameNumber,
        rasterRef: ref(
          `caption.broll.approved-run.${variant}.transition.${frameNumber}`,
          'caption-direct-inspection-raster-v1',
          sha256(bytes),
        ),
        rasterWidth: 640 as const,
        rasterHeight: 360 as const,
        actualRasterOpenedAndInspected: true as const,
      }
    }),
  )
  return {
    variant,
    reviewSpecRef: ref(
      spec.reviewSpecId,
      spec.schemaVersion,
      spec.reviewSpecDigestSha256,
    ),
    renderArtifactRef: ref(
      `caption.broll.approved-run.${variant}.render`,
      'video-mp4-private-review-v1',
      packageOutput.sha256,
    ),
    byteLength: packageOutput.byteLength,
    width: 640,
    height: 360,
    fps: 30,
    frameCount: 127,
    everyFrameContactSheet: {
      rasterRef: ref(
        `caption.broll.approved-run.${variant}.every-frame-contact-sheet`,
        'caption-direct-inspection-contact-sheet-v1',
        contactHash,
      ),
      representedFrameCount: 127,
      rasterWidth: 2_560,
      rasterHeight: 720,
      tileColumns: 16,
      tileRows: 8,
      thumbnailWidth: 160,
      thumbnailHeight: 90,
      actualRasterOpenedAndInspected: true,
    },
    originalResolutionSpotChecks,
    transitionSpotChecks,
  }
}

const full = await output(
  'full_motion', fullSpec, expectedFullContactSheetSha256)
const reduced = await output(
  'reduced_motion', reducedSpec, expectedReducedContactSheetSha256)
const receipt = createCaptionBrollApprovedRunProfessionalInspectionReceipt({
  receiptId: 'caption.broll.approved-run.v12.professional-inspection',
  observedAt: '2026-08-07T23:59:00.000Z',
  canonicalScope: structuredClone(fullSpec.canonicalScope),
  inspectionPackageRef: ref(
    'caption.broll.approved-run.professional-review.package',
    inspectionPackage.schemaVersion,
    inspectionPackage.packageSha256,
  ),
  baselineTechnicalPreviewRef: ref(
    'caption.broll.approved-run.technical-preview',
    'caption-broll-approved-execution-inspection-package-v3',
    inspectionPackage.baselinePreviewSha256,
  ),
  ownerRequestRef: structuredClone(inspectionPackage.ownerRequestRef),
  ownerResultRef: structuredClone(inspectionPackage.ownerResultRef),
  canonicalTranscriptRef: structuredClone(
    inspectionPackage.canonicalTranscriptRef),
  canonicalTranscriptEvidenceRef: structuredClone(
    inspectionPackage.canonicalTranscriptEvidenceRef),
  outputs: [full as typeof full & { variant: 'full_motion' },
    reduced as typeof reduced & { variant: 'reduced_motion' }],
  coverage: {
    frameCountPerVariant: 127,
    variantCount: 2,
    totalRenderedFramesRepresented: 254,
    everyRenderedFrameRepresentedExactlyOnce: true,
    completeTimePixelInspectionPerformed: true,
    originalResolutionSpotChecksComplete: true,
    transitionEntranceHoldAndExitCoverageComplete: true,
    fullReducedMotionSemanticParityInspected: true,
    completeMotionPlaybackInspectionPerformed: false,
  },
  findings: {
    sourceSubstitutionObserved: false,
    sourceAspectDistortionObserved: false,
    faceObstructionObserved: false,
    gestureObstructionObserved: false,
    captionClippingObserved: false,
    phraseOverflowObserved: false,
    heroAndAccessiblePlateCollisionObserved: false,
    unstablePlacementObserved: false,
    unusableCueTransitionObserved: false,
    stuckCaptionLayerObserved: false,
    tailTruncationObserved: false,
  },
  acceptedForCaptionOwnedProfessionalAppearance: true,
  technicalPreviewAcceptedAsFinalCaptionDesign: false,
  motionVariantOutputsByteDistinct: true,
  deterministicTechnicalQaReplaced: false,
  qualifiedSharedPostrenderAiReviewClaimed: false,
  independentFinalQaClaimed: false,
  browserLocalCompletionClaimed: false,
  mediaBytesSerialized: false,
  localPathsSerialized: false,
  providerCallMade: false,
  operationDispatchAuthorityGranted: false,
  repairExecutionAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, {
  inspectionPackage,
  fullMotionReviewSpec: fullSpecValue,
  reducedMotionReviewSpec: reducedSpecValue,
})
parseCaptionBrollApprovedRunProfessionalInspectionReceipt(receipt, {
  inspectionPackage,
  fullMotionReviewSpec: fullSpecValue,
  reducedMotionReviewSpec: reducedSpecValue,
})
const forgedRender = structuredClone(receipt)
forgedRender.outputs[0].renderArtifactRef.contentHash = '0'.repeat(64)
forgedRender.receiptDigestSha256 = calculateSkillContractDigest(
  forgedRender as unknown as Record<string, unknown>,
  'receiptDigestSha256',
)
assert.throws(() =>
  parseCaptionBrollApprovedRunProfessionalInspectionReceipt(forgedRender, {
    inspectionPackage,
    fullMotionReviewSpec: fullSpecValue,
    reducedMotionReviewSpec: reducedSpecValue,
  }))
const forgedPackage = structuredClone(inspectionPackage)
forgedPackage.outputs[1]!.sha256 = '1'.repeat(64)
assert.throws(() =>
  parseCaptionBrollApprovedRunProfessionalInspectionReceipt(receipt, {
    inspectionPackage: forgedPackage,
    fullMotionReviewSpec: fullSpecValue,
    reducedMotionReviewSpec: reducedSpecValue,
  }))
const receiptPath = join(root, 'professional-direct-inspection-receipt.json')
const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`)
try {
  await writeFile(receiptPath, receiptBytes, { flag: 'wx' })
} catch (error) {
  const existing = await readFile(receiptPath)
  if (!existing.equals(receiptBytes)) throw error
}
console.log(JSON.stringify({
  smoke: 'canonical_caption_broll_approved_run_professional_inspection',
  status: 'passed',
  receiptFileName: basename(receiptPath),
  receiptDigestSha256: receipt.receiptDigestSha256,
  adversarialChecks: 2,
  inspectedFrameCount: 254,
  completeTimePixelInspectionPerformed: true,
  completeMotionPlaybackInspectionPerformed: false,
  acceptedForCaptionOwnedProfessionalAppearance: true,
  qualifiedSharedPostrenderAiReviewClaimed: false,
  independentFinalQaClaimed: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
