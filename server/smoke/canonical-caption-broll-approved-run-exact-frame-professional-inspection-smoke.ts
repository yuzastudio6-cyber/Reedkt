import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { promisify } from 'node:util'

import type {
  CaptionBrollApprovedRunExactFrameProfessionalInspectionOutput,
} from '../../src/types/caption-broll-approved-run-exact-frame-professional-inspection'
import {
  createCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt,
  parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt,
} from '../captions-specialist/caption-broll-approved-run-exact-frame-professional-inspection'
import {
  parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview,
} from '../captions-specialist/caption-remotion-broll-owner-approved-run-exact-frame-review'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const run = promisify(execFile)
const requestedRoot = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_EXACT_FRAME_REVIEW_ROOT?.trim() ?? ''
const expectedPackageSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_EXACT_FRAME_INSPECTED_PACKAGE_SHA256
  ?.trim() ?? ''
const expectedFullContactSheetSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_EXACT_FRAME_INSPECTED_FULL_CONTACT_SHEET_SHA256
  ?.trim() ?? ''
const expectedReducedContactSheetSha256 = process.env
  .REEDITPRO_CAPTION_BROLL_APPROVED_EXACT_FRAME_INSPECTED_REDUCED_CONTACT_SHEET_SHA256
  ?.trim() ?? ''
if (!requestedRoot || ![
  expectedPackageSha256,
  expectedFullContactSheetSha256,
  expectedReducedContactSheetSha256,
].every((value) => /^[a-f0-9]{64}$/u.test(value))) {
  throw new Error(
    'Exact-frame inspection requires one private root and all exact inspected SHA-256 bindings.',
  )
}
const root = resolve(requestedRoot)
const ffprobe = process.env.REEDITPRO_FFPROBE_BIN?.trim() || 'ffprobe'
const readJson = async (fileName: string): Promise<unknown> =>
  JSON.parse(await readFile(join(root, fileName), 'utf8')) as unknown
const sha256 = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex')
const ref = (id: string, version: string, contentHash: string) => ({
  id,
  version,
  contentHash,
})
const assertPngDimensions = (bytes: Buffer, width: number, height: number) => {
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG')
  assert.equal(bytes.readUInt32BE(16), width)
  assert.equal(bytes.readUInt32BE(20), height)
}

const inspectionPackage = await readJson('inspection-package.json') as {
  schemaVersion: string
  packageSha256: string
  sourceProxyReviewPackageRef: {
    id: string
    version: string
    contentHash: string
  }
  outputs: Array<{
    motionVariant: 'full_motion' | 'reduced_motion'
    fileName: string
    sha256: string
    byteLength: number
    exactFrameReviewDigestSha256: string
  }>
}
assert.equal(inspectionPackage.packageSha256, expectedPackageSha256)
const fullReviewValue = await readJson('full-motion-exact-frame-binding.json')
const reducedReviewValue = await readJson(
  'reduced-motion-exact-frame-binding.json')
const fullReview =
  parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview(fullReviewValue)
const reducedReview =
  parseCaptionRemotionBrollOwnerApprovedRunExactFrameReview(
    reducedReviewValue)

interface ProbeResult {
  streams: Array<{
    codec_name?: string
    width?: number
    height?: number
    pix_fmt?: string
    color_space?: string
    color_transfer?: string
    color_primaries?: string
    r_frame_rate?: string
    avg_frame_rate?: string
    nb_frames?: string
  }>
  format: { duration?: string, size?: string }
}

async function output(
  variant: 'full_motion' | 'reduced_motion',
  review: typeof fullReview,
  expectedContactSheetSha256: string,
): Promise<CaptionBrollApprovedRunExactFrameProfessionalInspectionOutput> {
  const prefix = variant === 'full_motion' ? 'full-motion' : 'reduced-motion'
  const packageOutput = inspectionPackage.outputs.find((item) =>
    item.motionVariant === variant)
  assert.ok(packageOutput)
  const videoPath = join(root, packageOutput.fileName)
  const videoBytes = await readFile(videoPath)
  assert.equal(videoBytes.byteLength, packageOutput.byteLength)
  assert.equal(sha256(videoBytes), packageOutput.sha256)
  assert.equal(packageOutput.exactFrameReviewDigestSha256,
    review.exactFrameReviewDigestSha256)
  const { stdout } = await run(ffprobe, [
    '-v', 'error',
    '-show_entries',
    'stream=codec_name,width,height,pix_fmt,color_space,color_transfer,color_primaries,r_frame_rate,avg_frame_rate,nb_frames:format=duration,size',
    '-of', 'json',
    videoPath,
  ], { maxBuffer: 2 * 1024 * 1024 })
  const probe = JSON.parse(stdout) as ProbeResult
  const stream = probe.streams.find((item) => item.width === 3_840)
  assert.ok(stream)
  assert.deepEqual({
    codec: stream.codec_name,
    width: stream.width,
    height: stream.height,
    pixelFormat: stream.pix_fmt,
    colorSpace: stream.color_space,
    colorTransfer: stream.color_transfer,
    colorPrimaries: stream.color_primaries,
    realFps: stream.r_frame_rate,
    averageFps: stream.avg_frame_rate,
    frameCount: stream.nb_frames,
    duration: probe.format.duration,
    size: probe.format.size,
  }, {
    codec: 'h264',
    width: 3_840,
    height: 2_160,
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    colorTransfer: 'bt709',
    colorPrimaries: 'bt709',
    realFps: '30/1',
    averageFps: '30/1',
    frameCount: '127',
    duration: '4.288000',
    size: String(packageOutput.byteLength),
  })
  const contactName =
    `direct-${prefix}-exact-every-frame-contact-sheet.png`
  const contactBytes = await readFile(join(root, contactName))
  assertPngDimensions(contactBytes, 3_840, 1_080)
  const contactHash = sha256(contactBytes)
  assert.equal(contactHash, expectedContactSheetSha256)
  const exactResolutionSpotChecks = await Promise.all(
    review.inspectionFrameNumbers.map(async (frameNumber) => {
      const fileName = `direct-${prefix}-exact-frame-${frameNumber}.png`
      const bytes = await readFile(join(root, fileName))
      assertPngDimensions(bytes, 3_840, 2_160)
      return {
        frameNumber,
        rasterRef: ref(
          `caption.broll.approved-run.exact-frame.${variant}.frame.${frameNumber}`,
          'caption-direct-inspection-exact-frame-raster-v1',
          sha256(bytes),
        ),
        rasterWidth: 3_840 as const,
        rasterHeight: 2_160 as const,
        actualRasterOpenedAndInspected: true as const,
      }
    }),
  )
  const transitionSpotChecks = await Promise.all(
    [48, 52, 56, 60].map(async (frameNumber) => {
      const fileName = `direct-${prefix}-exact-frame-${frameNumber}.png`
      const bytes = await readFile(join(root, fileName))
      assertPngDimensions(bytes, 3_840, 2_160)
      return {
        frameNumber,
        rasterRef: ref(
          `caption.broll.approved-run.exact-frame.${variant}.transition.${frameNumber}`,
          'caption-direct-inspection-exact-frame-raster-v1',
          sha256(bytes),
        ),
        rasterWidth: 3_840 as const,
        rasterHeight: 2_160 as const,
        actualRasterOpenedAndInspected: true as const,
      }
    }),
  )
  return {
    variant,
    exactFrameReviewRef: ref(
      review.exactFrameReviewId,
      review.schemaVersion,
      review.exactFrameReviewDigestSha256,
    ),
    renderArtifactRef: ref(
      `caption.broll.approved-run.exact-frame.${variant}.render`,
      'video-mp4-private-review-v1',
      packageOutput.sha256,
    ),
    byteLength: packageOutput.byteLength,
    width: 3_840,
    height: 2_160,
    fps: 30,
    frameCount: 127,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    colorTransfer: 'bt709',
    colorPrimaries: 'bt709',
    durationMilliseconds: 4_288,
    everyFrameContactSheet: {
      rasterRef: ref(
        `caption.broll.approved-run.exact-frame.${variant}.every-frame-contact-sheet`,
        'caption-direct-inspection-exact-frame-contact-sheet-v1',
        contactHash,
      ),
      representedFrameCount: 127,
      rasterWidth: 3_840,
      rasterHeight: 1_080,
      tileColumns: 16,
      tileRows: 8,
      thumbnailWidth: 240,
      thumbnailHeight: 135,
      actualRasterOpenedAndInspected: true,
    },
    exactResolutionSpotChecks,
    transitionSpotChecks,
  }
}

const full = await output(
  'full_motion', fullReview, expectedFullContactSheetSha256)
const reduced = await output(
  'reduced_motion', reducedReview, expectedReducedContactSheetSha256)
const receipt =
  createCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt({
    receiptId: 'caption.broll.approved-run.v14.exact-frame-professional-inspection',
    observedAt: '2026-08-07T23:59:30.000Z',
    canonicalScope: structuredClone(fullReview.canonicalScope),
    exactFrameInspectionPackageRef: ref(
      'caption.broll.approved-run.exact-frame-review.package',
      inspectionPackage.schemaVersion,
      inspectionPackage.packageSha256,
    ),
    sourceProxyReviewPackageRef: structuredClone(
      inspectionPackage.sourceProxyReviewPackageRef),
    approvedSnapshotRef: structuredClone(fullReview.approvedSnapshotRef),
    executionPackageRef: structuredClone(fullReview.executionPackageRef),
    confirmedOutputFrameRef: structuredClone(
      fullReview.confirmedOutputFrame.frameRef),
    outputs: [full as typeof full & { variant: 'full_motion' },
      reduced as typeof reduced & { variant: 'reduced_motion' }],
    coverage: {
      frameCountPerVariant: 127,
      variantCount: 2,
      totalRenderedFramesRepresented: 254,
      everyRenderedFrameRepresentedExactlyOnce: true,
      everyFrameThumbnailInspectionPerformed: true,
      exactResolutionSpotChecksComplete: true,
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
      exactFrameTypographyDefectObserved: false,
      exactFrameLayoutDefectObserved: false,
    },
    acceptedForCaptionOwnedExactFrameTypographyAndLayout: true,
    sourceProxyUpscaleDisclosed: true,
    sourcePictureQualityQualified: false,
    finalCustomerCanvasClaimed: false,
    replacesCanonicalFinalCanvas: false,
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
    fullMotionExactFrameReview: fullReviewValue,
    reducedMotionExactFrameReview: reducedReviewValue,
  })
const context = {
  inspectionPackage,
  fullMotionExactFrameReview: fullReviewValue,
  reducedMotionExactFrameReview: reducedReviewValue,
}
parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
  receipt, context)
const forgedRender = structuredClone(receipt)
forgedRender.outputs[0].renderArtifactRef.contentHash = '0'.repeat(64)
forgedRender.receiptDigestSha256 = calculateSkillContractDigest(
  forgedRender as unknown as Record<string, unknown>,
  'receiptDigestSha256',
)
assert.throws(() =>
  parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
    forgedRender, context))
const crossedFrame = structuredClone(receipt)
crossedFrame.outputs[1].exactResolutionSpotChecks[1]!.frameNumber = 25
crossedFrame.receiptDigestSha256 = calculateSkillContractDigest(
  crossedFrame as unknown as Record<string, unknown>,
  'receiptDigestSha256',
)
assert.throws(() =>
  parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
    crossedFrame, context))
const elevatedAuthority = structuredClone(receipt) as unknown as Record<
  string, unknown>
elevatedAuthority.finalCustomerCanvasClaimed = true
elevatedAuthority.receiptDigestSha256 = calculateSkillContractDigest(
  elevatedAuthority, 'receiptDigestSha256')
assert.throws(() =>
  parseCaptionBrollApprovedRunExactFrameProfessionalInspectionReceipt(
    elevatedAuthority, context))
const receiptPath = join(
  root, 'exact-frame-professional-direct-inspection-receipt.json')
const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`)
try {
  await writeFile(receiptPath, receiptBytes, { flag: 'wx' })
} catch (error) {
  const existing = await readFile(receiptPath)
  if (!existing.equals(receiptBytes)) throw error
}
console.log(JSON.stringify({
  smoke:
    'canonical_caption_broll_approved_run_exact_frame_professional_inspection',
  status: 'passed',
  receiptFileName: basename(receiptPath),
  receiptDigestSha256: receipt.receiptDigestSha256,
  adversarialChecks: 3,
  exactRenderedFrame: '3840x2160@30',
  inspectedFrameCount: 254,
  everyFrameThumbnailInspectionPerformed: true,
  exactResolutionSpotChecksComplete: true,
  acceptedForCaptionOwnedExactFrameTypographyAndLayout: true,
  sourcePictureQualityQualified: false,
  finalCustomerCanvasClaimed: false,
  qualifiedSharedPostrenderAiReviewClaimed: false,
  independentFinalQaClaimed: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
