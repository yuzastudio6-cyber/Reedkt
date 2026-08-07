import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const evidenceRoot = resolve(
  process.env.REEDITPRO_CAPTION_FINAL_SOURCE_OUTPUT_ROOT?.trim()
    || join(
      homedir(),
      '.codex/private_caption_evidence',
      'caption-original-source-final-quality-2026-08-07-v1',
    ),
)
const inspectionRoot = join(evidenceRoot, 'direct-raster-inspection')
const runtimeIndexPath = join(
  evidenceRoot,
  'caption-original-source-final-quality-runtime-index.json',
)
const finalArtifactPath = join(
  evidenceRoot,
  'caption-original-source-final-quality.mp4',
)
const receiptPath = join(
  inspectionRoot,
  'canonical-caption-original-source-final-quality-direct-inspection-receipt.json',
)

const expectedSampleHashes = {
  'frame-000.png': '7603555a80ac65214174d1aab770165b13d72efbabc8dfe50838c75cb6e13b3f',
  'frame-004.png': '8bfec2433455de15db204d4fa528b7565051ad8f806bbc4a15c3443565a9a277',
  'frame-005.png': 'c5e59eb25f35f16a9958d36bea16319c5f4dce11f880080515f1ca2aea81d329',
  'frame-020.png': '77e64749be859a63b139da4a8dce72379261d079600fbc7c0e62b040d2b5e66e',
  'frame-037.png': 'a942f971003d1bb92ee265b8f77f4220eec69bcd8fa1c4abbe4c83fb091decad',
  'frame-038.png': '32b7608c8add59315a32229eca2d6ec44f2bdf1d3984cf70958a988cc7f5ed99',
  'frame-080.png': '37b63ea3f3da12026f64a8958efe24e561ec44733aacebaf6843e1d5c79336e3',
  'frame-122.png': '685e1ad2995ba1fc8c82c0b046455a033bd5be04c701f0755a7bbc73ac1bb213',
  'frame-123.png': 'ea5a7a3c3989ebc818cdc53cec91085fa7f856b5706354c1eb273a967c682ce6',
  'frame-126.png': '4234c14cb2fa85521de79cc77b625e76ecefb93f78f85a702f3e0cdf740ebcce',
} as const
const expectedCompleteTimeSheetHashes = {
  'all-frames-000-031.png': 'c22ee292d20dfbb6bec415bca278a7e7cb9b820d62cc72146a1e4ca0b9d966df',
  'all-frames-032-063.png': '5c08154ba3c56ffac3dd590bc414486e4d068ea429d01784131fcf2209c2b64c',
  'all-frames-064-095.png': '5741814806ae30813bff07ec2bb142ad17c97595678f987e567473d88d9a9d82',
  'all-frames-096-126.png': 'c86234d0cad0064d1399c280dfbb55c7c0068cef9baa778ebc541a49bb197313',
} as const

const runtimeIndexBytes = await readFile(runtimeIndexPath)
const runtimeIndex = JSON.parse(runtimeIndexBytes.toString('utf8')) as Record<string, unknown>
const finalArtifact = record(runtimeIndex.finalArtifact)
const directVisualInspection = record(runtimeIndex.directVisualInspection)
const authority = record(runtimeIndex.authority)
assert.equal(
  runtimeIndex.schemaVersion,
  'canonical-caption-original-source-final-quality-runtime-index-v1',
)
assert.deepEqual({
  sha256: finalArtifact.sha256,
  byteLength: finalArtifact.byteLength,
  width: finalArtifact.width,
  height: finalArtifact.height,
  fps: finalArtifact.fps,
  frameCount: finalArtifact.frameCount,
  videoCodec: finalArtifact.videoCodec,
  audioCodec: finalArtifact.audioCodec,
}, {
  sha256: '2d73a761c667c4d40ced1c160d0a5f550bdc4f5987cd3cc70c868892b7b79840',
  byteLength: 19_312_956,
  width: 2_160,
  height: 3_840,
  fps: 30,
  frameCount: 127,
  videoCodec: 'h264',
  audioCodec: 'aac',
})
assert.deepEqual(directVisualInspection, {
  required: true,
  completed: false,
  receiptRef: null,
})
assert.equal(authority.terminalQualificationClaimed, false)
assert.equal(authority.finalQaApprovalGranted, false)
assert.equal(authority.publicDeliveryGranted, false)
assert.equal(authority.productionAuthorityGranted, false)
assert.equal(
  sha256(await readFile(finalArtifactPath)),
  finalArtifact.sha256,
)

const sampleFrames = await exactArtifacts(expectedSampleHashes)
const completeTimeSheets = await exactArtifacts(expectedCompleteTimeSheetHashes)
const existing = await readExistingReceipt()
const reviewedAt = existing?.reviewedAt
assert.ok(
  reviewedAt === undefined ||
    (typeof reviewedAt === 'string' && Number.isFinite(Date.parse(reviewedAt))),
)
const receiptWithoutDigest = {
  schemaVersion:
    'canonical-caption-original-source-final-quality-direct-inspection-receipt-v1',
  reviewedAt: reviewedAt ?? new Date().toISOString(),
  reviewerType: 'codex_direct_raster_review_v1',
  runtimeIndexRef: {
    schemaVersion: runtimeIndex.schemaVersion,
    sha256: sha256(runtimeIndexBytes),
  },
  finalArtifactRef: {
    sha256: finalArtifact.sha256,
    byteLength: finalArtifact.byteLength,
    width: finalArtifact.width,
    height: finalArtifact.height,
    fps: finalArtifact.fps,
    frameCount: finalArtifact.frameCount,
  },
  inspectionScope: {
    completeTimeFrameRange: { startFrame: 0, endFrameExclusive: 127 },
    completeTimeSheets,
    exactBoundaryAndMidCueSamples: sampleFrames,
    fullResolutionSamplesReviewed: [
      'frame-020.png',
      'frame-038.png',
      'frame-123.png',
    ],
  },
  findings: {
    all127FramesVisuallyReviewed: true,
    sourcePictureContinuousAndVisible: true,
    captionCueOneAbsentThroughFrame4: true,
    captionCueOneVisibleFrames5Through37: true,
    captionCueTwoVisibleFrames38Through122: true,
    captionsAbsentFrames123Through126: true,
    glyphRasterCrispAtDeliveryFrame: true,
    captionTextReadable: true,
    safeHorizontalMarginsPreserved: true,
    captionClippingAbsent: true,
    faceOcclusionAbsent: true,
    darkOutlineContrastAcceptable: true,
    sourceColorContinuityAcceptable: true,
    professionalStableCaptionBaselineAccepted: true,
    creativeMotionAppearanceClaimed: false,
    qualifiedVisualIntelligenceReviewClaimed: false,
    independentFinalQaClaimed: false,
  },
  disposition: 'accepted_private_stable_caption_baseline',
  authority: {
    directRasterInspectionCompleted: true,
    captionTerminalQualificationGranted: false,
    providerCallMade: false,
    modelCallMade: false,
    visualIntelligenceQaApprovalGranted: false,
    independentFinalQaGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  },
}
const receipt = {
  ...receiptWithoutDigest,
  receiptDigestSha256: authoritySha256(receiptWithoutDigest),
}
const serialized = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`)
if (existing) {
  assert.deepEqual(existing, receipt)
  assert.equal(sha256(await readFile(receiptPath)), sha256(serialized))
} else {
  await writeFile(receiptPath, serialized, { flag: 'wx', mode: 0o600 })
}

process.stdout.write(`${JSON.stringify({
  status: 'actual_private_original_source_complete_time_direct_inspection_accepted',
  receiptPath,
  receiptDigestSha256: receipt.receiptDigestSha256,
  finalArtifactSha256: finalArtifact.sha256,
  completeTimeFrameCount: 127,
  professionalStableCaptionBaselineAccepted: true,
  creativeMotionAppearanceClaimed: false,
  qualifiedVisualIntelligenceReviewClaimed: false,
  captionTerminalQualificationGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)

async function exactArtifacts(
  expected: Readonly<Record<string, string>>,
): Promise<Array<{ fileName: string; sha256: string; byteLength: number }>> {
  const artifacts = []
  for (const [fileName, expectedSha256] of Object.entries(expected)) {
    const bytes = await readFile(join(inspectionRoot, fileName))
    assert.equal(sha256(bytes), expectedSha256)
    artifacts.push({ fileName, sha256: expectedSha256, byteLength: bytes.byteLength })
  }
  return artifacts
}

async function readExistingReceipt(): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse((await readFile(receiptPath)).toString('utf8')) as
      Record<string, unknown>
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

function record(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function authoritySha256(value: unknown): string {
  return `sha256:${sha256(Buffer.from(JSON.stringify(canonical(value))))}`
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, child]) => [key, canonical(child)]),
  )
}
