import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import type {
  CaptionRealSourceCompleteTimeInspectionReceipt,
  CaptionRealSourceInspectionVariant,
} from '../../src/types/caption-real-source-complete-time-inspection'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import {
  createCaptionRealSourceCompleteTimeInspectionReceipt,
  parseCaptionRealSourceCompleteTimeInspectionReceipt,
} from '../captions-specialist/caption-real-source-complete-time-inspection'
import {
  parseCaptionRemotionRealSourceReviewSpec,
} from '../captions-specialist/caption-remotion-real-source-review'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { writePrivateFileCreateOnlyWithinRoot } from
  '../security/private-local-persistence'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'

const EXPECTED_ATTESTATION =
  'accepted_all_127_frames_both_variants_with_original_spot_checks_v1'
const FRAME_NUMBERS = [0, 5, 8, 12, 21, 37, 38, 45, 80, 118, 122, 126]
const EXPECTED_CONTACT_SHEET_HASHES = {
  full_motion: [
    '76adc0f5084ccede8295b296f5f63c9653da181ad1d1a2b1ca4d0ee1f4f2cde3',
    '4e00b4be74351296a5920bac02d086d31ca4d43ccc8523ac312385f8d64eaadd',
    '2ab66c96b5ae01a9bf7bc9107759ffc2dab3ece42faaf5cc9404c5258c129816',
    '42c1ea9af2873af92b8b4f5be88ae105232590c2de1f18681844ed336d6e8522',
    '9dfd7f3d50efdc3b5539a60b95d48109df63e549f85ea131ddc8aff8812c203f',
    '97834ba35b65339dd5d2a01f57125cb1ea06a4faf854eadab24343546c41821c',
  ],
  reduced_motion: [
    '593a5659e70a8cd4b06cc25e05d494a5bf19f27ae721bf5fc31a8ddca935892d',
    'f0b80a582466290eb81153eef1ccf05e6aa291f0df0dc8cc957e0650bef237d3',
    'af2abd58a271544ad1aef69cd8f9609f9d8655612c1ce2f9b0f155189df9ac34',
    '501a10f22afc9fc0c5eaa0cca5f0b7da08678a342786eaeb195c2a7522b0d8d3',
    'e9e30b14971d5b7ddb3074b76d1d1058869fe469010b1bc7607be8f2e5f31a96',
    'f76750b6baa5c5dfe1b9eee3996a286249c2fc94bd826a022c8b381d776746b4',
  ],
} as const
const SHARED_FRAME_HASHES: Record<number, string> = {
  0: 'ad69f35e780524c789e77fa969dda8a85692defa168bf0f7f7aebc6e2eb4b14c',
  5: '0643c53570cde67917cdf0ead9e9aba903cd95ba1a7824812f2111db71a6ad6a',
  12: 'f91642fedd431e2fdc2803bdf1bfbc2e8fc7caa3e3bf1fb44ad30ac176e2d7d6',
  21: '10d58c711e7bd5f34c10909ccd88fdaa2b11200662541464025863f2e826e22e',
  37: 'ae86e80d188452c5dbab66b038797640967ceef556ca05c594b4bc9d2b416857',
  38: '5289fdbb0dd76fb4a2657a7abcceec10be0e5fae17f83b287d6381683a82a002',
  45: 'f3f060cc004f08f3132b7cd19347d41eca5b3970170d16a92eb5299b69bfd2b7',
  80: 'f44d172cb6233c92feaaea24573ffe5eb1656c6b8ed133750cf43cafdfca0152',
  118: 'f883a1f316cecf1689edd372dfebe9fc16a9e05857603f7b3b529f6ae070467e',
  122: 'f8ca0bb244b819d733367d1d0fa8eff879437cf0590ba0492c5068122bed6855',
  126: '6f46da726f7e98f63b9bf0e5c1c018edec2d112844a816458ef23eb073b43ea4',
}
const EXPECTED_ORIGINAL_FRAME_HASHES: Record<
  CaptionRealSourceInspectionVariant,
  Record<number, string>
> = {
  full_motion: {
    ...SHARED_FRAME_HASHES,
    8: '0604eecb998f79c7f933a3ea358dbf338e6ff16235ae5b48c4903fce0446d6ff',
  },
  reduced_motion: {
    ...SHARED_FRAME_HASHES,
    8: '891cfb97d3b274a05a449aec6107831047382de5f11a3b053f63aeb5e05b53fc',
  },
}
const evidenceDirectory = resolve(requiredEnvironment(
  'REEDITPRO_CAPTION_REAL_SOURCE_EVIDENCE_DIR'))
const contactSheetDirectory = resolve(requiredEnvironment(
  'REEDITPRO_CAPTION_REAL_SOURCE_CONTACT_SHEET_DIR'))
const persistenceRoot = resolve(process.env
  .REEDITPRO_CAPTION_REAL_SOURCE_COMPLETE_TIME_EVIDENCE_ROOT?.trim() || join(
  homedir(), '.codex/private_caption_evidence/real-source-design-2026-08-05-v1',
  'complete-time-direct-inspection-v1',
))
const observedAt = requiredEnvironment(
  'REEDITPRO_CAPTION_REAL_SOURCE_COMPLETE_TIME_INSPECTION_OBSERVED_AT')

assert.equal(requiredEnvironment(
  'REEDITPRO_CAPTION_REAL_SOURCE_COMPLETE_TIME_INSPECTION_ATTESTATION'),
EXPECTED_ATTESTATION)

const fullSpecValue = JSON.parse(await readFile(join(
  evidenceDirectory, 'caption-real-source-full-spec.json'), 'utf8'))
const reducedSpecValue = JSON.parse(await readFile(join(
  evidenceDirectory, 'caption-real-source-reduced-spec.json'), 'utf8'))
const fullSpec = parseCaptionRemotionRealSourceReviewSpec(fullSpecValue)
const reducedSpec = parseCaptionRemotionRealSourceReviewSpec(reducedSpecValue)
const fullArtifact = await loadRenderArtifact({
  variant: 'full_motion',
  fileName: 'caption-real-source-full.mp4',
  expectedSha256:
    '200abd32615cbed07739243880ed7993998609451ad911a1bddac9e686fa939f',
})
const reducedArtifact = await loadRenderArtifact({
  variant: 'reduced_motion',
  fileName: 'caption-real-source-reduced.mp4',
  expectedSha256:
    'b8b87995c9031a0221a304bd1c06bfe6beeb1c186b5818d28758fd511f606e74',
})

const contactSheets = []
const originalResolutionSpotChecks = []
for (const [variant, prefix, renderArtifact] of [
  ['full_motion', 'full', fullArtifact],
  ['reduced_motion', 'reduced', reducedArtifact],
] as const) {
  for (let sheetIndex = 0; sheetIndex < 6; sheetIndex += 1) {
    const fileName = `${prefix}-sheet-${sheetIndex}.png`
    const bytes = await readFile(join(contactSheetDirectory, fileName))
    assertPngDimensions(bytes, 924, 1_624)
    const rasterSha256 = sha256(bytes)
    assert.equal(rasterSha256, EXPECTED_CONTACT_SHEET_HASHES[variant][sheetIndex])
    const startFrame = sheetIndex * 25
    const endFrameExclusive = Math.min(127, startFrame + 25)
    await persistInspectedRaster({
      relativePath: `contact-sheets/${fileName}`,
      bytes,
    })
    contactSheets.push({
      sheetId: `caption.real-source.complete-time.${prefix}.sheet-${sheetIndex}`,
      variant,
      renderArtifactRef: renderArtifact.artifactRef,
      sheetIndex,
      startFrame,
      endFrameExclusive,
      representedFrameCount: endFrameExclusive - startFrame,
      rasterRef: ref(
        `caption.real-source.complete-time.${prefix}.sheet-${sheetIndex}.raster`,
        'caption-complete-time-contact-sheet-raster-v1',
        rasterSha256,
      ),
      rasterSha256,
      rasterWidth: 924 as const,
      rasterHeight: 1_624 as const,
      tileColumns: 5 as const,
      tileRows: 5 as const,
      thumbnailWidth: 180 as const,
      thumbnailHeight: 320 as const,
      actualRasterOpenedAndInspected: true as const,
    })
  }
  for (const frameNumber of FRAME_NUMBERS) {
    const frameLabel = String(frameNumber).padStart(3, '0')
    const fileName = `${prefix}-frame-${frameLabel}.png`
    const bytes = await readFile(join(evidenceDirectory, fileName))
    assertPngDimensions(bytes, 360, 640)
    const rasterSha256 = sha256(bytes)
    assert.equal(
      rasterSha256,
      EXPECTED_ORIGINAL_FRAME_HASHES[variant][frameNumber],
    )
    await persistInspectedRaster({
      relativePath: `original-spot-checks/${fileName}`,
      bytes,
    })
    originalResolutionSpotChecks.push({
      inspectionItemId:
        `caption.real-source.complete-time.${prefix}.frame-${frameLabel}`,
      variant,
      renderArtifactRef: renderArtifact.artifactRef,
      frameNumber,
      rasterRef: ref(
        `caption.real-source.complete-time.${prefix}.frame-${frameLabel}.raster`,
        'caption-original-resolution-inspection-raster-v1',
        rasterSha256,
      ),
      rasterSha256,
      rasterWidth: 360 as const,
      rasterHeight: 640 as const,
      actualRasterOpenedAndInspected: true as const,
    })
  }
}

const receipt = createCaptionRealSourceCompleteTimeInspectionReceipt({
  inspectionId: 'caption.real-source.complete-time.direct-inspection-2026-08-05-v1',
  observedAt,
  canonicalScope: fullSpec.canonicalScope,
  fullMotionReviewSpecRef: reviewSpecRef(fullSpec),
  reducedMotionReviewSpecRef: reviewSpecRef(reducedSpec),
  renderArtifacts: [fullArtifact, reducedArtifact],
  contactSheets,
  originalResolutionSpotChecks,
  coverage: {
    frameCountPerVariant: 127,
    variantCount: 2,
    totalRenderedFramesRepresented: 254,
    everyFrameRepresentedExactlyOnce: true,
    contactSheetCoverageComplete: true,
    originalResolutionSpotChecksComplete: true,
    completeMotionPlaybackClaimed: false,
  },
  findings: {
    faceObstructionObserved: false,
    gestureObstructionObserved: false,
    captionClippingObserved: false,
    phraseOverflowObserved: false,
    heroAndAccessiblePlateCollisionObserved: false,
    unstablePlacementObserved: false,
    unusableCueTransitionObserved: false,
    tailTruncationObserved: false,
  },
  inspectionMethod:
    'every_rendered_frame_contact_sheet_plus_original_resolution_spot_checks_v1',
  inspectorClass: 'codex_agent_direct_visual_inspection',
  realSourcePixelsInspected: true,
  syntheticEngineeringFixtureUsed: false,
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
}, {
  fullMotionReviewSpec: fullSpec,
  reducedMotionReviewSpec: reducedSpec,
})

const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
const objectPort = createCanonicalPrivateLocalJsonObjectPort({
  localStorageRoot: persistenceRoot,
})
const receiptObjectPath =
  'receipts/caption-real-source-complete-time-direct-inspection-v1.json'
assert.ok(['created', 'already_exists'].includes(await objectPort.createOnly({
  objectPath: receiptObjectPath,
  body: receiptBytes,
  contentSha256: sha256(receiptBytes),
})))
const reread = await objectPort.readExact(receiptObjectPath)
assert.ok(reread)
assert.deepEqual(reread, receiptBytes)
assert.deepEqual(parseCaptionRealSourceCompleteTimeInspectionReceipt(
  JSON.parse(reread.toString('utf8')), {
    fullMotionReviewSpec: fullSpec,
    reducedMotionReviewSpec: reducedSpec,
  }), receipt)

let adversarialChecks = 0
expectInvalid(withDigest({
  ...structuredClone(receipt),
  renderArtifacts: [
    receipt.renderArtifacts[0],
    { ...receipt.renderArtifacts[1], artifactRef: receipt.renderArtifacts[0].artifactRef },
  ],
}), /crossed render scope/u)
adversarialChecks += 1
expectInvalid(withDigest({
  ...structuredClone(receipt),
  contactSheets: receipt.contactSheets.slice(1),
}), /contact-sheet set is incomplete/u)
adversarialChecks += 1
expectInvalid(withDigest({
  ...structuredClone(receipt),
  originalResolutionSpotChecks: receipt.originalResolutionSpotChecks.slice(1),
}), /original-resolution checks diverged/u)
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

const serialized = JSON.stringify(receipt)
assert.equal(serialized.includes(evidenceDirectory), false)
assert.equal(serialized.includes(contactSheetDirectory), false)
assert.equal(serialized.includes(persistenceRoot), false)

console.log(JSON.stringify({
  smoke: 'captions-specialist-cap-14-real-source-complete-time-inspection',
  status: 'passed',
  inspectionDigestSha256: receipt.inspectionDigestSha256,
  receiptByteSha256: sha256(receiptBytes),
  variantsInspected: 2,
  renderedFramesRepresented: 254,
  originalResolutionSpotChecks: 24,
  adversarialChecks,
  realSourcePixelsInspected: true,
  syntheticEngineeringFixtureUsed: false,
  acceptedForCaptionOwnedProfessionalAppearance: true,
  completeMotionPlaybackClaimed: false,
  qualifiedSharedPostrenderAiReviewClaimed: false,
  independentFinalQaClaimed: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

async function loadRenderArtifact(input: {
  variant: CaptionRealSourceInspectionVariant
  fileName: string
  expectedSha256: string
}) {
  const path = join(evidenceDirectory, input.fileName)
  const bytes = await readFile(path)
  const fileStat = await stat(path)
  const artifactSha256 = sha256(bytes)
  assert.equal(artifactSha256, input.expectedSha256)
  return {
    variant: input.variant,
    artifactRef: ref(
      `caption.real-source.render.${input.variant}`,
      'caption-real-source-private-review-render-v1',
      artifactSha256,
    ),
    mimeType: 'video/mp4' as const,
    byteLength: fileStat.size,
    rasterWidth: 360 as const,
    rasterHeight: 640 as const,
    fpsNumerator: 30 as const,
    fpsDenominator: 1 as const,
    frameCount: 127,
  }
}

async function persistInspectedRaster(input: {
  relativePath: string
  bytes: Buffer
}): Promise<void> {
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: persistenceRoot,
    relativePath: input.relativePath,
    content: input.bytes,
  })
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function reviewSpecRef(spec: {
  reviewSpecId: string
  schemaVersion: string
  reviewSpecDigestSha256: string
}): CaptionDomainRef {
  return ref(spec.reviewSpecId, spec.schemaVersion, spec.reviewSpecDigestSha256)
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

function withDigest(
  receipt: CaptionRealSourceCompleteTimeInspectionReceipt,
): CaptionRealSourceCompleteTimeInspectionReceipt {
  return {
    ...receipt,
    inspectionDigestSha256: calculateSkillContractDigest(
      receipt as unknown as Record<string, unknown>,
      'inspectionDigestSha256',
    ),
  }
}

function expectInvalid(
  receipt: CaptionRealSourceCompleteTimeInspectionReceipt,
  message: RegExp,
): void {
  assert.throws(() => parseCaptionRealSourceCompleteTimeInspectionReceipt(
    receipt, {
      fullMotionReviewSpec: fullSpec,
      reducedMotionReviewSpec: reducedSpec,
    }), message)
}
