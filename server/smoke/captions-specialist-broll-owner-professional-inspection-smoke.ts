import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type { CaptionBrollOwnerProfessionalInspectionReceipt } from
  '../../src/types/caption-broll-owner-professional-inspection'
import { parseBrollCaptionOwnerReadResult } from
  '../captions-specialist/caption-broll-owner-read-adapter'
import {
  createCaptionBrollOwnerProfessionalInspectionReceipt,
  parseCaptionBrollOwnerProfessionalInspectionReceipt,
  type CaptionBrollOwnerProfessionalInspectionContext,
} from '../captions-specialist/caption-broll-owner-professional-inspection'
import {
  parseCaptionRemotionBrollOwnerReviewSpec,
} from '../captions-specialist/caption-remotion-broll-owner-review'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { writePrivateFileCreateOnlyWithinRoot } from
  '../security/private-local-persistence'

const OBSERVED_AT = '2026-08-06T12:45:00-04:00'
const OWNER_RESULT_FILE_SHA256 =
  '10ba456bf5ed9ceff23aaf33356ee5b3cf5e9431f6fb65717655a60316de4e32'
const OWNER_RESULT_DIGEST_SHA256 =
  '4c816bcd9b940f0bb8aa0b0a05b5dbf96aafc414b4b50e185872f1e9ba19fe88'
const REJECTED_FULL_SPEC_DIGEST =
  'e893779339b3c8113d70ff64ec8750803be061dc474de8d3565d5f534efdd77d'
const REJECTED_REDUCED_SPEC_DIGEST =
  '1bcc1977e7cda16b9faf7cf65ca7d76a50e7c5a65d17b99b0dbc454dc5aecf8f'
const ACCEPTED_FULL_SPEC_DIGEST =
  '1e0c167c4da7d5c143f17020d0a949b6262b25d7dfd7203d731fcba1a109fa98'
const ACCEPTED_REDUCED_SPEC_DIGEST =
  '715d792bec411cd74edd5d4f113da85474c92db25680bf8e320fc0cc6704ed0e'
const REJECTED_FULL_RENDER_SHA256 =
  '8efccfa47fa9cf2d58800d98bbc2264f95ce82693213829626bc3f9625263fe0'
const REJECTED_REDUCED_RENDER_SHA256 =
  '5922aff9dd6f77ffb33e7733526b298921c0939377734c81dfc97c3ae04ddc0d'
const ACCEPTED_FULL_RENDER_SHA256 =
  'a75bcfe4dabd4ca4af1cc0893150e4ee66971efd585b826ae2082a95ae76babf'
const ACCEPTED_REDUCED_RENDER_SHA256 =
  'a6e5f9089d8be6834fffa504c9653a566412ba544cf55f854747b964f8583128'
const FULL_CONTACT_SHEET_SHA256 =
  '106980eecde584806aa0bc718c203c320ece7f15a4c08eeaf075712a3e7baf2d'
const REDUCED_CONTACT_SHEET_SHA256 =
  '381dc4977d4ee200b3343cb5291030863d5078285f9a25f71327a3caa4fdcf6b'
const INSPECTION_FRAMES = [0, 5, 11, 23, 30, 47, 71] as const

const acceptedFrameHashes = {
  full_motion: {
    0: '5b1eb247a6702f8b6c836fc3cd2955e0396b3d61949c6966cc79d28ede691d09',
    5: '78ba4df116347e1ce7b6945667ef6e896fc4b48c738cfe3d9f710ef6157ce2e1',
    11: 'cfb9bca2c4f4b42daac6ff5bd1b5a49983effc459a590cd5dfed5454ae450667',
    23: '09ddd66ce6a4330435d30f9f42980d008ce489c3ebc0060e6c0ca4b2a1203ef8',
    30: 'ebebe009d5669ca51d5cd95e78ff883ae35545b192c5bd0825d364b429ff7253',
    47: '29e3f59aafa965caf17bbe41f1a5ff79c7b2a2a038b2afd003486f119595b80f',
    71: '0a8afe2409e997916ca7150403fcea9758fe4ba960785a71def62a9471d1bb23',
  },
  reduced_motion: {
    0: '5b1eb247a6702f8b6c836fc3cd2955e0396b3d61949c6966cc79d28ede691d09',
    5: '09315cba1402b67e011a4012ed1f2776ac427f3b22d622451c9714b468b12999',
    11: 'cfb9bca2c4f4b42daac6ff5bd1b5a49983effc459a590cd5dfed5454ae450667',
    23: '09ddd66ce6a4330435d30f9f42980d008ce489c3ebc0060e6c0ca4b2a1203ef8',
    30: 'eb5a5c7e9cf887564974686c0ae92438a19a2aea034d66298a649f309ab26d9f',
    47: '29e3f59aafa965caf17bbe41f1a5ff79c7b2a2a038b2afd003486f119595b80f',
    71: '0a8afe2409e997916ca7150403fcea9758fe4ba960785a71def62a9471d1bb23',
  },
} as const
const rejectedFrameHashes = {
  5: 'e453dc01aaaf520582d513bd208d1aa323965d71876d6170a02bd11b2c03878b',
  11: '5b37706dac10ab55e37849b60dda45c79d5d62fd15536c9509297c370d7dba09',
  30: '4eed6eae7de66cab1841aa0230c21df2398f5b037c04e45bfd6e6c3a7f59ae84',
  47: '8776bd16348e944d3158a33dfabb8e7b8430b6a246f59b69374d5f83520ae0d2',
} as const

const evidenceRoot = resolve(process.env
  .REEDITPRO_CAPTION_BROLL_PROFESSIONAL_EVIDENCE_ROOT?.trim() || join(
  homedir(), '.codex/private_caption_evidence',
  'broll-owner-professional-caption-2026-08-06-v1'))
const ownerEvidenceRoot = resolve(process.env
  .REEDITPRO_CAPTION_BROLL_OWNER_EVIDENCE_ROOT?.trim() || join(
  homedir(), '.codex/private_caption_evidence',
  'broll-owner-real-source-2026-08-06-v1'))
const ownerResultPath = join(
  ownerEvidenceRoot,
  'private/internal/caption-broll-evidence/v1/owner-results',
  '81d3f3ebc4ea2971a60abbde7aec705817b4705c6039d9fd98e7b6e80a4c483d.json')
const rejectedDirectory = join(
  evidenceRoot, 'rendered-e893779339b3-1bcc1977e7cd')
const acceptedDirectory = join(
  evidenceRoot, 'rendered-1e0c167c4da7-715d792bec41')
const persistenceRoot = resolve(process.env
  .REEDITPRO_CAPTION_BROLL_PROFESSIONAL_INSPECTION_ROOT?.trim() || join(
  evidenceRoot, 'direct-inspection-v1'))

const ownerResultBytes = await readFile(ownerResultPath)
assert.equal(sha256(ownerResultBytes), OWNER_RESULT_FILE_SHA256)
const ownerResult = parseBrollCaptionOwnerReadResult(
  JSON.parse(ownerResultBytes.toString('utf8')))
assert.equal(ownerResult.resultDigestSha256, OWNER_RESULT_DIGEST_SHA256)

const rejectedFull = await readSpec(
  rejectedDirectory, 'broll-owner-full-spec.json', REJECTED_FULL_SPEC_DIGEST)
const rejectedReduced = await readSpec(
  rejectedDirectory, 'broll-owner-reduced-spec.json',
  REJECTED_REDUCED_SPEC_DIGEST)
const acceptedFull = await readSpec(
  acceptedDirectory, 'broll-owner-full-spec.json', ACCEPTED_FULL_SPEC_DIGEST)
const acceptedReduced = await readSpec(
  acceptedDirectory, 'broll-owner-reduced-spec.json',
  ACCEPTED_REDUCED_SPEC_DIGEST)
const context: CaptionBrollOwnerProfessionalInspectionContext = {
  ownerResult,
  acceptedFullMotionSpec: acceptedFull,
  acceptedReducedMotionSpec: acceptedReduced,
  rejectedFullMotionSpec: rejectedFull,
  rejectedReducedMotionSpec: rejectedReduced,
}

const rejectedFullRenderRef = await renderRef({
  directory: rejectedDirectory,
  fileName: 'broll-owner-full.mp4',
  id: 'caption.broll-owner.professional.rejected.full.render',
  expectedSha256: REJECTED_FULL_RENDER_SHA256,
})
const rejectedReducedRenderRef = await renderRef({
  directory: rejectedDirectory,
  fileName: 'broll-owner-reduced.mp4',
  id: 'caption.broll-owner.professional.rejected.reduced.render',
  expectedSha256: REJECTED_REDUCED_RENDER_SHA256,
})
const acceptedFullArtifact = await renderArtifact({
  variant: 'full_motion',
  spec: acceptedFull,
  directory: acceptedDirectory,
  fileName: 'broll-owner-full.mp4',
  id: 'caption.broll-owner.professional.accepted.full.render',
  expectedSha256: ACCEPTED_FULL_RENDER_SHA256,
})
const acceptedReducedArtifact = await renderArtifact({
  variant: 'reduced_motion',
  spec: acceptedReduced,
  directory: acceptedDirectory,
  fileName: 'broll-owner-reduced.mp4',
  id: 'caption.broll-owner.professional.accepted.reduced.render',
  expectedSha256: ACCEPTED_REDUCED_RENDER_SHA256,
})

const rejectedEvidence = []
for (const frameNumber of [5, 11, 30, 47] as const) {
  const frameLabel = String(frameNumber).padStart(3, '0')
  const bytes = await readFile(join(
    rejectedDirectory, `broll-owner-full-frame-${frameLabel}.png`))
  const frameSha256 = sha256(bytes)
  assert.equal(frameSha256, rejectedFrameHashes[frameNumber])
  assertPngDimensions(bytes, 640, 360)
  rejectedEvidence.push({
    frameNumber,
    rasterRef: ref(
      `caption.broll-owner.rejected.face-obstruction.frame-${frameLabel}`,
      'caption-rejected-professional-inspection-raster-v1', frameSha256),
    rasterSha256: frameSha256,
    rasterWidth: 640 as const,
    rasterHeight: 360 as const,
    actualRasterOpenedAndInspected: true as const,
  })
}

const contactSheets:
CaptionBrollOwnerProfessionalInspectionReceipt['contactSheets'] = [
  await contactSheet({
    variant: 'full_motion',
    fileName: 'broll-owner-full-all-72-frames.png',
    renderArtifactRef: acceptedFullArtifact.artifactRef,
    expectedSha256: FULL_CONTACT_SHEET_SHA256,
  }),
  await contactSheet({
    variant: 'reduced_motion',
    fileName: 'broll-owner-reduced-all-72-frames.png',
    renderArtifactRef: acceptedReducedArtifact.artifactRef,
    expectedSha256: REDUCED_CONTACT_SHEET_SHA256,
  }),
]

const originalResolutionSpotChecks = []
for (const [variant, prefix, spec, artifact] of [
  ['full_motion', 'broll-owner-full', acceptedFull, acceptedFullArtifact],
  ['reduced_motion', 'broll-owner-reduced', acceptedReduced,
    acceptedReducedArtifact],
] as const) {
  for (const frameNumber of INSPECTION_FRAMES) {
    const frameLabel = String(frameNumber).padStart(3, '0')
    const bytes = await readFile(join(
      acceptedDirectory, `${prefix}-frame-${frameLabel}.png`))
    const frameSha256 = sha256(bytes)
    assert.equal(frameSha256,
      acceptedFrameHashes[variant][frameNumber])
    assertPngDimensions(bytes, 640, 360)
    originalResolutionSpotChecks.push({
      inspectionItemId:
        `caption.broll-owner.accepted.${variant}.frame-${frameLabel}`,
      variant,
      reviewSpecRef: specRef(spec),
      renderArtifactRef: artifact.artifactRef,
      frameNumber,
      rasterRef: ref(
        `caption.broll-owner.accepted.${variant}.frame-${frameLabel}.raster`,
        'caption-original-resolution-inspection-raster-v1', frameSha256),
      rasterSha256: frameSha256,
      rasterWidth: 640 as const,
      rasterHeight: 360 as const,
      actualRasterOpenedAndInspected: true as const,
    })
  }
}

const receipt = createCaptionBrollOwnerProfessionalInspectionReceipt({
  inspectionId:
    'caption.broll-owner.professional.direct-inspection-2026-08-06-v1',
  observedAt: OBSERVED_AT,
  canonicalScope: acceptedFull.canonicalScope,
  ownerResultRef: {
    id: ownerResult.resultId,
    version: ownerResult.schemaVersion,
    contentHash: ownerResult.resultDigestSha256,
  },
  acceptedReviewSpecRefs: [
    { variant: 'full_motion', reviewSpecRef: specRef(acceptedFull) },
    { variant: 'reduced_motion', reviewSpecRef: specRef(acceptedReduced) },
  ],
  rejectedAttempt: {
    fullMotionReviewSpecRef: specRef(rejectedFull),
    reducedMotionReviewSpecRef: specRef(rejectedReduced),
    fullMotionRenderArtifactRef: rejectedFullRenderRef,
    reducedMotionRenderArtifactRef: rejectedReducedRenderRef,
    inspectedFrameEvidence: rejectedEvidence,
    rejectionReasonCodes: ['face_obstruction_by_hero_typography'],
    deterministicTechnicalPassNotSufficient: true,
    professionalAppearanceAccepted: false,
    retainedAsFailedEvidence: true,
  },
  acceptedRenderArtifacts: [
    acceptedFullArtifact,
    acceptedReducedArtifact,
  ],
  contactSheets,
  originalResolutionSpotChecks,
  coverage: {
    frameCountPerVariant: 72,
    variantCount: 2,
    totalRenderedFramesRepresented: 144,
    everyRenderedFrameRepresentedExactlyOnce: true,
    contactSheetCoverageComplete: true,
    originalResolutionSpotChecksComplete: true,
    cueEntranceHoldAndExitCoverageComplete: true,
    fullReducedMotionSemanticParityInspected: true,
    completeMotionPlaybackClaimed: false,
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
  repair: {
    repairReason: 'hero_typography_obscured_speaker_face',
    repairAction:
      'reposition_hero_typography_to_open_left_side_outside_face_and_gesture',
    rejectedAndAcceptedArtifactsVersionSeparated: true,
    acceptedHeroPlacement: 'open_left_side',
    acceptedStableCaptionPlacement: 'lower_safe_band',
    repairDidNotChangeOwnerSelectionCropOrTiming: true,
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
}, context)

const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`)
const receiptRelativePath =
  'receipts/caption-broll-owner-professional-direct-inspection-v1.json'
await writePrivateFileCreateOnlyWithinRoot({
  rootPath: persistenceRoot,
  relativePath: receiptRelativePath,
  content: receiptBytes,
})
const reread = await readFile(join(persistenceRoot, receiptRelativePath))
assert.deepEqual(reread, receiptBytes)
assert.deepEqual(parseCaptionBrollOwnerProfessionalInspectionReceipt(
  JSON.parse(reread.toString('utf8')), context), receipt)

let adversarialChecks = 0
expectInvalid(redigest({
  ...structuredClone(receipt),
  acceptedRenderArtifacts: [
    receipt.acceptedRenderArtifacts[0],
    { ...receipt.acceptedRenderArtifacts[1], artifactRef:
      receipt.acceptedRenderArtifacts[0].artifactRef },
  ],
}), /inspection crossed/u)
adversarialChecks += 1
expectInvalid(redigest({
  ...structuredClone(receipt),
  rejectedAttempt: {
    ...receipt.rejectedAttempt,
    rejectionReasonCodes: [],
  },
}), /expected array to have >=1 items/u)
adversarialChecks += 1
expectInvalid(redigest({
  ...structuredClone(receipt),
  findings: { ...receipt.findings, faceObstructionObserved: true },
}), /expected false/u)
adversarialChecks += 1
expectInvalid(redigest({
  ...structuredClone(receipt),
  finalQaApprovalGranted: true,
}), /expected false/u)
adversarialChecks += 1
expectInvalid(redigest({
  ...structuredClone(receipt),
  originalResolutionSpotChecks:
    receipt.originalResolutionSpotChecks.slice(1),
}), /expected array to have >=14 items/u)
adversarialChecks += 1

const serialized = JSON.stringify(receipt)
assert.equal(serialized.includes(evidenceRoot), false)
assert.equal(serialized.includes(ownerEvidenceRoot), false)
assert.equal(serialized.includes(acceptedDirectory), false)
assert.equal(serialized.includes(rejectedDirectory), false)

console.log(JSON.stringify({
  smoke: 'captions-specialist-broll-owner-professional-inspection',
  status: 'passed',
  inspectionDigestSha256: receipt.inspectionDigestSha256,
  receiptByteSha256: sha256(receiptBytes),
  rejectedVisualAttemptRetained: true,
  acceptedRenderVariants: 2,
  renderedFramesRepresented: 144,
  originalResolutionSpotChecks: 14,
  adversarialChecks,
  realSourcePixelsInspected: true,
  syntheticEngineeringFixtureUsed: false,
  acceptedForCaptionOwnedProfessionalAppearance: true,
  qualifiedSharedPostrenderAiReviewClaimed: false,
  independentFinalQaClaimed: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

async function readSpec(
  directory: string,
  fileName: string,
  expectedDigest: string,
) {
  const spec = parseCaptionRemotionBrollOwnerReviewSpec(
    JSON.parse(await readFile(join(directory, fileName), 'utf8')))
  assert.equal(spec.reviewSpecDigestSha256, expectedDigest)
  return spec
}

async function renderRef(input: {
  directory: string
  fileName: string
  id: string
  expectedSha256: string
}): Promise<CaptionDomainRef> {
  const bytes = await readFile(join(input.directory, input.fileName))
  const actual = sha256(bytes)
  assert.equal(actual, input.expectedSha256)
  return ref(input.id,
    'caption-broll-owner-professional-private-render-v1', actual)
}

async function renderArtifact<
  T extends 'full_motion' | 'reduced_motion',
>(input: {
  variant: T
  spec: Awaited<ReturnType<typeof readSpec>>
  directory: string
  fileName: string
  id: string
  expectedSha256: string
}) {
  const artifactRef = await renderRef(input)
  const fileStat = await stat(join(input.directory, input.fileName))
  return {
    variant: input.variant,
    reviewSpecRef: specRef(input.spec),
    artifactRef,
    artifactSha256: artifactRef.contentHash,
    mimeType: 'video/mp4' as const,
    byteLength: fileStat.size,
    rasterWidth: 640 as const,
    rasterHeight: 360 as const,
    fpsNumerator: 24 as const,
    fpsDenominator: 1 as const,
    frameCount: 72 as const,
  }
}

async function contactSheet<
  T extends 'full_motion' | 'reduced_motion',
>(input: {
  variant: T
  fileName: string
  renderArtifactRef: CaptionDomainRef
  expectedSha256: string
}) {
  const bytes = await readFile(join(acceptedDirectory, input.fileName))
  const actual = sha256(bytes)
  assert.equal(actual, input.expectedSha256)
  assertPngDimensions(bytes, 1_536, 432)
  return {
    variant: input.variant,
    renderArtifactRef: input.renderArtifactRef,
    startFrame: 0 as const,
    endFrameExclusive: 72 as const,
    representedFrameCount: 72 as const,
    rasterRef: ref(
      `caption.broll-owner.accepted.${input.variant}.all-frames.raster`,
      'caption-complete-time-contact-sheet-raster-v1', actual),
    rasterSha256: actual,
    rasterWidth: 1_536 as const,
    rasterHeight: 432 as const,
    tileColumns: 12 as const,
    tileRows: 6 as const,
    thumbnailWidth: 128 as const,
    thumbnailHeight: 72 as const,
    actualRasterOpenedAndInspected: true as const,
  }
}

function specRef(
  spec: Awaited<ReturnType<typeof readSpec>>,
): CaptionDomainRef {
  return ref(spec.reviewSpecId, spec.schemaVersion,
    spec.reviewSpecDigestSha256)
}

function ref(
  id: string,
  version: string,
  contentHash: string,
): CaptionDomainRef {
  return { id, version, contentHash }
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function assertPngDimensions(
  bytes: Buffer,
  width: number,
  height: number,
): void {
  assert.ok(bytes.subarray(0, 8).equals(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
  assert.equal(bytes.readUInt32BE(16), width)
  assert.equal(bytes.readUInt32BE(20), height)
}

function redigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  value.inspectionDigestSha256 = calculateSkillContractDigest(
    value,
    'inspectionDigestSha256')
  return value
}

function expectInvalid(
  value: unknown,
  message: RegExp,
): void {
  assert.throws(() =>
    parseCaptionBrollOwnerProfessionalInspectionReceipt(value, context),
  message)
}
