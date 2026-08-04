import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from '../living-frame/living-frame-alpha-measurement'

const clean = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.clean',
  artifactDigestSha256: digest('clean'),
  width: 8,
  height: 8,
  rgbaBytes: cleanCutout(),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  knownSourceMatteRgb: [255, 255, 255],
  destinationRgbBytes: solidRgb(8, 8, [18, 24, 32]),
})

assert.equal(verifyLivingFrameAlphaMeasurementReportDigest(clean), true)
assert.equal(clean.containsRawPixels, false)
assert.equal(clean.authorityBoundary.qaAuthority, false)
assert.equal(clean.authorityBoundary.runtimePromotionAuthority, false)
assert.ok(clean.findingCodes.includes('alpha_channel_variation_present'))
assert.ok(!clean.findingCodes.includes('opaque_rectangle_detected'))
assert.ok(!clean.findingCodes.includes('matte_edge_contamination_suspected'))
assert.equal(JSON.stringify(clean).includes('rgbaBytes'), false)
assert.equal(
  clean.artifactIdentity.measuredRgbaDigestSha256,
  createHash('sha256').update(cleanCutout()).digest('hex'),
)
assert.equal(clean.compositeContext.destinationRasterProvided, true)
assert.ok(clean.compositeContext.destinationRgbDigestSha256)
assert.deepEqual(
  clean.composites.map((measurement) => measurement.backgroundId),
  ['black', 'white', 'mid_gray', 'saturated_red', 'destination_raster'],
)
assert.equal(
  measureLivingFrameAlphaArtifact({
    artifactId: 'living-frame.alpha.clean',
    artifactDigestSha256: digest('clean'),
    width: 8,
    height: 8,
    rgbaBytes: cleanCutout(),
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
    knownSourceMatteRgb: [255, 255, 255],
    destinationRgbBytes: solidRgb(8, 8, [18, 24, 32]),
  }).reportDigestSha256,
  clean.reportDigestSha256,
)

const checkerboard = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.fake-checkerboard',
  artifactDigestSha256: digest('fake-checkerboard'),
  width: 8,
  height: 8,
  rgbaBytes: opaqueCheckerboard(),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
})
assert.ok(checkerboard.findingCodes.includes('alpha_channel_fully_opaque'))
assert.ok(checkerboard.findingCodes.includes('opaque_rectangle_detected'))
assert.ok(
  checkerboard.findingCodes.includes(
    'checkerboard_encoded_as_pixels_suspected',
  ),
)

const whiteHalo = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.white-halo',
  artifactDigestSha256: digest('white-halo'),
  width: 8,
  height: 8,
  rgbaBytes: haloCutout(),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  knownSourceMatteRgb: [255, 255, 255],
})
assert.ok(
  whiteHalo.findingCodes.includes('matte_edge_contamination_suspected'),
)

const invalidPremultiplied = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.invalid-premultiplied',
  artifactDigestSha256: digest('invalid-premultiplied'),
  width: 8,
  height: 8,
  rgbaBytes: invalidPremultipliedCutout(),
  alphaMode: 'premultiplied_alpha',
  alphaExpectation: 'alpha_required',
})
assert.ok(
  invalidPremultiplied.findingCodes.includes('premultiplied_alpha_violation'),
)

const lowContrastDestination = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.low-contrast-destination',
  artifactDigestSha256: digest('low-contrast-destination'),
  width: 8,
  height: 8,
  rgbaBytes: lowContrastCutout(),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  destinationRgbBytes: solidRgb(8, 8, [128, 128, 128]),
})
assert.ok(
  lowContrastDestination.findingCodes.includes(
    'destination_edge_contrast_low',
  ),
)

const opaquePlate = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.opaque-plate',
  artifactDigestSha256: digest('opaque-plate'),
  width: 8,
  height: 8,
  rgbaBytes: solidRgba(8, 8, [12, 24, 36, 255]),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'opaque_plate_expected',
})
assert.ok(!opaquePlate.findingCodes.includes('opaque_rectangle_detected'))

const forgedAuthorityInput = {
  artifactId: 'living-frame.alpha.forged-authority',
  artifactDigestSha256: digest('forged-authority'),
  width: 8,
  height: 8,
  rgbaBytes: cleanCutout(),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  qaAuthority: true,
  approvalAuthority: true,
  runtimePromotionAuthority: true,
} as const
const forgedAuthorityReport = measureLivingFrameAlphaArtifact(
  forgedAuthorityInput,
)
assert.equal(forgedAuthorityReport.authorityBoundary.qaAuthority, false)
assert.equal(forgedAuthorityReport.authorityBoundary.approvalAuthority, false)
assert.equal(
  forgedAuthorityReport.authorityBoundary.runtimePromotionAuthority,
  false,
)

const binaryEdge = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.binary-edge',
  artifactDigestSha256: digest('binary-edge'),
  width: 8,
  height: 8,
  rgbaBytes: binaryCutout(),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
})
assert.ok(binaryEdge.findingCodes.includes('edge_discontinuity_high'))

const tampered = {
  ...clean,
  distribution: {
    ...clean.distribution,
    opaquePixelCount: clean.distribution.opaquePixelCount + 1,
  },
}
assert.equal(verifyLivingFrameAlphaMeasurementReportDigest(tampered), false)
assert.equal(
  verifyLivingFrameAlphaMeasurementReportDigest({
    ...clean,
    providerModel: 'forged-provider',
  }),
  false,
)
assert.equal(
  verifyLivingFrameAlphaMeasurementReportDigest({
    ...clean,
    composites: clean.composites.map((composite, index) =>
      index === 0 ? { ...composite, approved: true } : composite),
  }),
  false,
)

const fullyTransparent = measureLivingFrameAlphaArtifact({
  artifactId: 'living-frame.alpha.fully-transparent',
  artifactDigestSha256: digest('fully-transparent'),
  width: 8,
  height: 8,
  rgbaBytes: solidRgba(8, 8, [0, 0, 0, 0]),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
})
assert.ok(
  fullyTransparent.findingCodes.includes('alpha_channel_fully_transparent'),
)
assert.ok(
  !fullyTransparent.findingCodes.includes('alpha_channel_variation_present'),
)

assert.throws(
  () => measureLivingFrameAlphaArtifact({
    artifactId: 'living-frame.alpha.invalid-length',
    artifactDigestSha256: digest('invalid-length'),
    width: 8,
    height: 8,
    rgbaBytes: new Uint8Array(7),
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
  }),
  /RGBA byte length is invalid/,
)

assert.throws(
  () => measureLivingFrameAlphaArtifact({
    artifactId: 'https://unsafe.example/path',
    artifactDigestSha256: digest('unsafe-id'),
    width: 1,
    height: 1,
    rgbaBytes: new Uint8Array([0, 0, 0, 0]),
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
  }),
  /artifact identity is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-alpha-measurement',
  controlledArtifacts: 9,
  adversarialAssertions: 19,
  authorityPromoted: false,
  rawPixelsReturned: false,
}))

function cleanCutout(): Uint8Array {
  const bytes = solidRgba(8, 8, [0, 0, 0, 0])
  fillRect(bytes, 8, 2, 2, 5, 5, [190, 36, 44, 255])
  drawEdge(bytes, 8, [190, 36, 44, 96])
  return bytes
}

function haloCutout(): Uint8Array {
  const bytes = solidRgba(8, 8, [0, 0, 0, 0])
  fillRect(bytes, 8, 2, 2, 5, 5, [190, 36, 44, 255])
  drawEdge(bytes, 8, [255, 255, 255, 96])
  return bytes
}

function invalidPremultipliedCutout(): Uint8Array {
  const bytes = solidRgba(8, 8, [0, 0, 0, 0])
  fillRect(bytes, 8, 2, 2, 5, 5, [48, 18, 12, 255])
  drawEdge(bytes, 8, [200, 160, 100, 64])
  return bytes
}

function lowContrastCutout(): Uint8Array {
  const bytes = solidRgba(8, 8, [0, 0, 0, 0])
  fillRect(bytes, 8, 2, 2, 5, 5, [128, 128, 128, 255])
  drawEdge(bytes, 8, [128, 128, 128, 32])
  return bytes
}

function opaqueCheckerboard(): Uint8Array {
  const bytes = new Uint8Array(8 * 8 * 4)
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const value = (x + y) % 2 === 0 ? 192 : 224
      setRgba(bytes, 8, x, y, [value, value, value, 255])
    }
  }
  return bytes
}

function binaryCutout(): Uint8Array {
  const bytes = solidRgba(8, 8, [0, 0, 0, 0])
  fillRect(bytes, 8, 2, 2, 5, 5, [36, 96, 186, 255])
  return bytes
}

function drawEdge(
  bytes: Uint8Array,
  width: number,
  rgba: readonly [number, number, number, number],
): void {
  for (let coordinate = 2; coordinate <= 5; coordinate += 1) {
    setRgba(bytes, width, coordinate, 1, rgba)
    setRgba(bytes, width, coordinate, 6, rgba)
    setRgba(bytes, width, 1, coordinate, rgba)
    setRgba(bytes, width, 6, coordinate, rgba)
  }
}

function fillRect(
  bytes: Uint8Array,
  width: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  rgba: readonly [number, number, number, number],
): void {
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      setRgba(bytes, width, x, y, rgba)
    }
  }
}

function solidRgba(
  width: number,
  height: number,
  rgba: readonly [number, number, number, number],
): Uint8Array {
  const bytes = new Uint8Array(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    bytes.set(rgba, index * 4)
  }
  return bytes
}

function solidRgb(
  width: number,
  height: number,
  rgb: readonly [number, number, number],
): Uint8Array {
  const bytes = new Uint8Array(width * height * 3)
  for (let index = 0; index < width * height; index += 1) {
    bytes.set(rgb, index * 3)
  }
  return bytes
}

function setRgba(
  bytes: Uint8Array,
  width: number,
  x: number,
  y: number,
  rgba: readonly [number, number, number, number],
): void {
  bytes.set(rgba, (y * width + x) * 4)
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
