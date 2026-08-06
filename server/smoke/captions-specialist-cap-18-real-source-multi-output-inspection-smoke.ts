import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import type {
  CaptionRealSourceMultiOutputInspectionVariant,
} from '../../src/types/caption-real-source-multi-output-inspection'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../../src/types/caption-remotion-real-source-multi-output-review'
import {
  createCaptionRealSourceMultiOutputInspectionReceipt,
  parseCaptionRealSourceMultiOutputInspectionReceipt,
  type CaptionRealSourceMultiOutputInspectionContext,
} from '../captions-specialist/caption-real-source-multi-output-inspection'
import {
  parseCaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../captions-specialist/caption-remotion-real-source-multi-output-review'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { writePrivateFileCreateOnlyWithinRoot } from
  '../security/private-local-persistence'

const FRAME_NUMBERS = [8, 21, 80, 122] as const
const OBSERVED_AT = '2026-08-05T20:33:01-04:00'
const ORIGINAL_SOURCE_SHA256 =
  'a1640b8a2da4bf076c6ecfbd57d6cf51c1c2beea3536085c1b932c04c3dbf1f0'
const evidenceDirectory = resolve(process.env
  .REEDITPRO_CAPTION_REAL_SOURCE_MULTI_OUTPUT_EVIDENCE_DIR?.trim() || join(
  homedir(), '.codex/private_caption_evidence/real-source-design-2026-08-05-v1',
  'remotion-real-source-multi-output-v3',
  'accepted-c904016798b9-a1b982d93079',
))
const persistenceRoot = resolve(process.env
  .REEDITPRO_CAPTION_REAL_SOURCE_MULTI_OUTPUT_INSPECTION_ROOT?.trim() || join(
  homedir(), '.codex/private_caption_evidence/real-source-design-2026-08-05-v1',
  'complete-time-multi-output-direct-inspection-v1',
))
const contactSheetDirectory = resolve(process.env
  .REEDITPRO_CAPTION_REAL_SOURCE_MULTI_OUTPUT_CONTACT_SHEET_DIR?.trim() || join(
  persistenceRoot, 'contact-sheets',
))

const variantFixtures = [
  {
    variant: 'widescreen_full_motion',
    specFileName: 'widescreen-full-spec.json',
    renderFileName: 'widescreen-full.mp4',
    framePrefix: 'widescreen-full',
    contactSheetFileName: 'widescreen-full-all-frames.png',
    renderSha256:
      '660d705c970159ef99b2bb8707dc1b3a8a1a091fcab4de4fde88fd497872ae97',
    contactSheetSha256:
      'e634167d94677cfa4990f2180a858873978cf7539a0e421b7e6567cb79dc924e',
    frameHashes: {
      8: '74e9c4e54c5abaa84f0ae97717d072d78ccdf0a73f6fa24e97c7889fc8ae56af',
      21: 'cbd4859d3f8e9a0383af153358f0c768e90f639a9a6b25c04f55720a511b96a4',
      80: 'b51fd7b68ad68b490a45adce8f7af7f50f37c31278d34d0c7319027170588495',
      122: 'c89ba2e1decdcce781adcc63d2330d6f3f428beedec6df603bde599db05475de',
    },
  },
  {
    variant: 'widescreen_reduced_motion',
    specFileName: 'widescreen-reduced-spec.json',
    renderFileName: 'widescreen-reduced.mp4',
    framePrefix: 'widescreen-reduced',
    contactSheetFileName: 'widescreen-reduced-all-frames.png',
    renderSha256:
      '24ed3415b097dff779bbc7250d16aa205ec75d6ebb8b45c5649d612fa90d00f7',
    contactSheetSha256:
      '7ab742a6788987e490e51b70b32f90c034e62fe80237863a1251024258f2c44e',
    frameHashes: {
      8: 'dfffbeb7582a2faf73e091d94f10224be92cbe674a2e4c9832812be9038a9fe9',
      21: 'cbd4859d3f8e9a0383af153358f0c768e90f639a9a6b25c04f55720a511b96a4',
      80: 'b51fd7b68ad68b490a45adce8f7af7f50f37c31278d34d0c7319027170588495',
      122: 'c89ba2e1decdcce781adcc63d2330d6f3f428beedec6df603bde599db05475de',
    },
  },
  {
    variant: 'square_full_motion',
    specFileName: 'square-full-spec.json',
    renderFileName: 'square-full.mp4',
    framePrefix: 'square-full',
    contactSheetFileName: 'square-full-all-frames.png',
    renderSha256:
      '1ca4755f418b07b529c0e2425e901a4040c12a40b512426839458bee9e3d6497',
    contactSheetSha256:
      '7080c6aaeef545a54f0c381807f03006f9b87033c4f62d345cb69598077415ec',
    frameHashes: {
      8: '76f9b16870464d1ca124d78c72fbc1172ca2c61203b3b5c517b848cdb992ece4',
      21: 'f2205990dd88f99882e46bc20ce85331815246e03d3bc63441c1c5f1c4e7355d',
      80: 'ff0ac1c8cfd37a666636397b97a66c933cfcad79f37698c80780467712f62887',
      122: 'bf36347d6bad0da64ac93c9c3a050d5505247b08df88bc65f4383ee9dff82130',
    },
  },
  {
    variant: 'square_reduced_motion',
    specFileName: 'square-reduced-spec.json',
    renderFileName: 'square-reduced.mp4',
    framePrefix: 'square-reduced',
    contactSheetFileName: 'square-reduced-all-frames.png',
    renderSha256:
      '5846f2055f568e9474117f602ceff99041c6a8cffa1b7dc4ed0545e915c0e5cb',
    contactSheetSha256:
      'd15dacd2295d17fae0a712a855803e9f3e988d5e286362c1d41e07ff9e6da901',
    frameHashes: {
      8: 'bf2aada66708b4319a95f0c65e8c2142f3709f8171367d2137833934de772eb2',
      21: 'f2205990dd88f99882e46bc20ce85331815246e03d3bc63441c1c5f1c4e7355d',
      80: 'ff0ac1c8cfd37a666636397b97a66c933cfcad79f37698c80780467712f62887',
      122: 'bf36347d6bad0da64ac93c9c3a050d5505247b08df88bc65f4383ee9dff82130',
    },
  },
] as const

const specs = new Map<
  CaptionRealSourceMultiOutputInspectionVariant,
  CaptionRemotionRealSourceMultiOutputReviewSpec
>()
for (const fixture of variantFixtures) {
  const value = JSON.parse(await readFile(join(
    evidenceDirectory, fixture.specFileName), 'utf8'))
  specs.set(fixture.variant,
    parseCaptionRemotionRealSourceMultiOutputReviewSpec(value))
}
const context: CaptionRealSourceMultiOutputInspectionContext = {
  widescreenFullReviewSpec: requiredSpec('widescreen_full_motion'),
  widescreenReducedReviewSpec: requiredSpec('widescreen_reduced_motion'),
  squareFullReviewSpec: requiredSpec('square_full_motion'),
  squareReducedReviewSpec: requiredSpec('square_reduced_motion'),
}

const reviewSpecs = []
const renderArtifacts = []
const contactSheets = []
const originalResolutionSpotChecks = []
for (const fixture of variantFixtures) {
  const spec = requiredSpec(fixture.variant)
  assert.equal(spec.sourceEvidence.originalSourceSha256, ORIGINAL_SOURCE_SHA256)
  const specReference = specRef(spec)
  reviewSpecs.push({
    variant: fixture.variant,
    outputFormat: spec.outputFormat,
    reducedMotion: spec.reducedMotion,
    reviewSpecRef: specReference,
    canonicalScope: spec.canonicalScope,
    confirmedOutputFrameRef: spec.confirmedOutputFrame.frameRef,
    confirmedOutputWidth: spec.confirmedOutputFrame.width,
    confirmedOutputHeight: spec.confirmedOutputFrame.height,
  })

  const renderPath = join(evidenceDirectory, fixture.renderFileName)
  const renderBytes = await readFile(renderPath)
  const renderSha256 = sha256(renderBytes)
  assert.equal(renderSha256, fixture.renderSha256)
  const renderStat = await stat(renderPath)
  const artifactRef = ref(
    `caption.real-source.multi-output.render.${fixture.variant}`,
    'caption-real-source-multi-output-private-review-render-v1',
    renderSha256,
  )
  renderArtifacts.push({
    variant: fixture.variant,
    outputFormat: spec.outputFormat,
    reducedMotion: spec.reducedMotion,
    reviewSpecRef: specReference,
    artifactRef,
    artifactSha256: renderSha256,
    mimeType: 'video/mp4' as const,
    byteLength: renderStat.size,
    rasterWidth: spec.privateReviewFrame.width,
    rasterHeight: spec.privateReviewFrame.height,
    fpsNumerator: 30 as const,
    fpsDenominator: 1 as const,
    frameCount: spec.durationFrames,
  })

  const contactSheetPath = join(
    contactSheetDirectory, fixture.contactSheetFileName)
  const contactSheetBytes = await readFile(contactSheetPath)
  const contactSheetSha256 = sha256(contactSheetBytes)
  assert.equal(contactSheetSha256, fixture.contactSheetSha256)
  const wide = spec.outputFormat === 'widescreen_16_9'
  assertPngDimensions(contactSheetBytes,
    wide ? 1_692 : 1_276, wide ? 742 : 982)
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: persistenceRoot,
    relativePath: `contact-sheets/${fixture.contactSheetFileName}`,
    content: contactSheetBytes,
  })
  contactSheets.push({
    sheetId:
      `caption.real-source.multi-output.${fixture.variant}.all-frames.sheet`,
    variant: fixture.variant,
    reviewSpecRef: specReference,
    renderArtifactRef: artifactRef,
    startFrame: 0 as const,
    endFrameExclusive: spec.durationFrames,
    representedFrameCount: spec.durationFrames,
    rasterRef: ref(
      `caption.real-source.multi-output.${fixture.variant}.all-frames.raster`,
      'caption-complete-time-contact-sheet-raster-v1',
      contactSheetSha256,
    ),
    rasterSha256: contactSheetSha256,
    rasterWidth: wide ? 1_692 as const : 1_276 as const,
    rasterHeight: wide ? 742 as const : 982 as const,
    tileColumns: 13 as const,
    tileRows: 10 as const,
    thumbnailWidth: wide ? 128 as const : 96 as const,
    thumbnailHeight: wide ? 72 as const : 96 as const,
    actualRasterOpenedAndInspected: true as const,
  })

  for (const frameNumber of FRAME_NUMBERS) {
    const frameLabel = String(frameNumber).padStart(3, '0')
    const fileName = `${fixture.framePrefix}-frame-${frameLabel}.png`
    const frameBytes = await readFile(join(evidenceDirectory, fileName))
    const frameSha256 = sha256(frameBytes)
    assert.equal(frameSha256, fixture.frameHashes[frameNumber])
    assertPngDimensions(frameBytes,
      spec.privateReviewFrame.width, spec.privateReviewFrame.height)
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: persistenceRoot,
      relativePath: `original-spot-checks/${fileName}`,
      content: frameBytes,
    })
    originalResolutionSpotChecks.push({
      inspectionItemId:
        `caption.real-source.multi-output.${fixture.variant}.frame-${frameLabel}`,
      variant: fixture.variant,
      reviewSpecRef: specReference,
      renderArtifactRef: artifactRef,
      frameNumber,
      rasterRef: ref(
        `caption.real-source.multi-output.${fixture.variant}.frame-${frameLabel}.raster`,
        'caption-original-resolution-inspection-raster-v1',
        frameSha256,
      ),
      rasterSha256: frameSha256,
      rasterWidth: spec.privateReviewFrame.width,
      rasterHeight: spec.privateReviewFrame.height,
      actualRasterOpenedAndInspected: true as const,
    })
  }
}

const firstSpec = requiredSpec('widescreen_full_motion')
const receipt = createCaptionRealSourceMultiOutputInspectionReceipt({
  inspectionId:
    'caption.real-source.multi-output.direct-inspection-2026-08-05-v1',
  observedAt: OBSERVED_AT,
  originalSourceRef: firstSpec.sourceEvidence.originalSourceRef,
  originalSourceSha256: ORIGINAL_SOURCE_SHA256,
  reviewSpecs: asTuple4(reviewSpecs),
  renderArtifacts: asTuple4(renderArtifacts),
  contactSheets: asTuple4(contactSheets),
  originalResolutionSpotChecks,
  coverage: {
    outputFormatCount: 2,
    motionVariantCountPerOutput: 2,
    renderArtifactCount: 4,
    frameCountPerRender: 127,
    totalRenderedFramesRepresented: 508,
    everyRenderedFrameRepresentedExactlyOnce: true,
    contactSheetCoverageComplete: true,
    originalResolutionSpotCheckFrames: [8, 21, 80, 122],
    originalResolutionSpotChecksComplete: true,
    outputSpecificRecompositionInspected: true,
    fullReducedMotionSemanticParityInspected: true,
    completeMotionPlaybackClaimed: false,
  },
  findings: {
    sourceSubstitutionObserved: false,
    sourceAspectDistortionObserved: false,
    crossCanvasEvidenceReuseObserved: false,
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
  designFindings: {
    editorialSidecarReadable: true,
    speakerPanelRemainsVisuallyPrimary: true,
    fullReducedMotionSemanticParityAccepted: true,
    widescreenRecompositionAccepted: true,
    squareRecompositionAccepted: true,
  },
  inspectionMethod:
    'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1',
  inspectorClass: 'codex_agent_direct_visual_inspection',
  realSourcePixelsInspected: true,
  syntheticEngineeringFixtureUsed: false,
  syntheticEngineeringFixtureQualifiedProfessionalAppearance: false,
  acceptedForCaptionOwnedProfessionalAppearance: true,
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
}, context)

const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
const receiptRelativePath =
  'receipts/caption-real-source-multi-output-direct-inspection-v1.json'
await writePrivateFileCreateOnlyWithinRoot({
  rootPath: persistenceRoot,
  relativePath: receiptRelativePath,
  content: receiptBytes,
})
const reread = await readFile(join(persistenceRoot, receiptRelativePath))
assert.deepEqual(reread, receiptBytes)
assert.deepEqual(parseCaptionRealSourceMultiOutputInspectionReceipt(
  JSON.parse(reread.toString('utf8')), context), receipt)

let adversarialChecks = 0
expectInvalid(withDigest({
  ...structuredClone(receipt),
  renderArtifacts: [
    receipt.renderArtifacts[0],
    { ...receipt.renderArtifacts[1], artifactRef:
      receipt.renderArtifacts[0].artifactRef },
    receipt.renderArtifacts[2],
    receipt.renderArtifacts[3],
  ],
}), /inspection render diverged/u)
adversarialChecks += 1
expectInvalid(withDigest({
  ...structuredClone(receipt),
  contactSheets: receipt.contactSheets.map((sheet, index) => index === 2
    ? { ...sheet, rasterWidth: 1_692 }
    : sheet),
}), /contact-sheet evidence diverged/u)
adversarialChecks += 1
expectInvalid(withDigest({
  ...structuredClone(receipt),
  originalResolutionSpotChecks:
    receipt.originalResolutionSpotChecks.slice(1),
}), /Too small:[\s\S]*16 items/u)
adversarialChecks += 1
expectInvalid(withDigest({
  ...structuredClone(receipt),
  syntheticEngineeringFixtureUsed: true,
}), /expected false/u)
adversarialChecks += 1
expectInvalid(withDigest({
  ...structuredClone(receipt),
  finalQaApprovalGranted: true,
}), /expected false/u)
adversarialChecks += 1
expectInvalid(withDigest({
  ...structuredClone(receipt),
  originalSourceSha256: '0'.repeat(64),
}), /source is crossed/u)
adversarialChecks += 1

const serialized = JSON.stringify(receipt)
assert.equal(serialized.includes(evidenceDirectory), false)
assert.equal(serialized.includes(contactSheetDirectory), false)
assert.equal(serialized.includes(persistenceRoot), false)

console.log(JSON.stringify({
  smoke:
    'captions-specialist-cap-18-real-source-multi-output-inspection',
  status: 'passed',
  inspectionDigestSha256: receipt.inspectionDigestSha256,
  receiptByteSha256: sha256(receiptBytes),
  outputFormatsInspected: 2,
  renderVariantsInspected: 4,
  renderedFramesRepresented: 508,
  originalResolutionSpotChecks: 16,
  adversarialChecks,
  realSourcePixelsInspected: true,
  syntheticEngineeringFixtureUsed: false,
  syntheticEngineeringFixtureQualifiedProfessionalAppearance: false,
  acceptedForCaptionOwnedProfessionalAppearance: true,
  qualifiedSharedPostrenderAiReviewClaimed: false,
  independentFinalQaClaimed: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function requiredSpec(
  variant: CaptionRealSourceMultiOutputInspectionVariant,
): CaptionRemotionRealSourceMultiOutputReviewSpec {
  const spec = specs.get(variant)
  assert.ok(spec)
  return spec
}

function specRef(
  spec: CaptionRemotionRealSourceMultiOutputReviewSpec,
): CaptionDomainRef {
  return ref(
    spec.reviewSpecId,
    spec.schemaVersion,
    spec.reviewSpecDigestSha256,
  )
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function assertPngDimensions(
  bytes: Buffer,
  expectedWidth: number,
  expectedHeight: number,
): void {
  assert.ok(bytes.byteLength >= 24)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR')
  assert.equal(bytes.readUInt32BE(16), expectedWidth)
  assert.equal(bytes.readUInt32BE(20), expectedHeight)
}

function asTuple4<T>(items: T[]): [T, T, T, T] {
  assert.equal(items.length, 4)
  return [items[0]!, items[1]!, items[2]!, items[3]!]
}

function withDigest(receiptValue: unknown): unknown {
  assert.ok(receiptValue && typeof receiptValue === 'object')
  const record = receiptValue as Record<string, unknown>
  return {
    ...record,
    inspectionDigestSha256: calculateSkillContractDigest(
      record,
      'inspectionDigestSha256',
    ),
  }
}

function expectInvalid(value: unknown, message: RegExp): void {
  assert.throws(() => parseCaptionRealSourceMultiOutputInspectionReceipt(
    value, context), message)
}
