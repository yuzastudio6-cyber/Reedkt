import { createHash } from 'node:crypto'

import type {
  LivingFrameAlphaBackgroundId,
  LivingFrameAlphaCompositeMeasurement,
  LivingFrameAlphaExpectation,
  LivingFrameAlphaFindingCode,
  LivingFrameAlphaMeasurementAuthorityBoundary,
  LivingFrameAlphaMeasurementReport,
  LivingFrameAlphaMeasurementReportDraft,
  LivingFrameAlphaPixelBounds,
  LivingFrameMeasuredAlphaMode,
} from '../../src/types/living-frame-alpha-measurement'
import {
  LIVING_FRAME_ALPHA_BACKGROUND_IDS,
  LIVING_FRAME_ALPHA_EXPECTATIONS,
  LIVING_FRAME_ALPHA_FINDING_CODES,
  LIVING_FRAME_ALPHA_MODES,
  LIVING_FRAME_ALPHA_MEASUREMENT_EVIDENCE_CLASS,
  LIVING_FRAME_ALPHA_MEASUREMENT_PROFILE,
  LIVING_FRAME_ALPHA_MEASUREMENT_VERSION,
} from '../../src/types/living-frame-alpha-measurement'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_DIMENSION = 8192
const MAX_PIXEL_COUNT = 16_777_216
const MATTE_DISTANCE_THRESHOLD = 0.1
const LOW_CONTRAST_THRESHOLD = 0.035
const ABRUPT_ALPHA_DELTA = 192

const AUTHORITY_BOUNDARY: LivingFrameAlphaMeasurementAuthorityBoundary =
  Object.freeze({
    measurementOnly: true,
    planningAuthority: false,
    qaAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    renderAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

const FIXED_BACKGROUNDS = [
  ['black', [0, 0, 0]],
  ['white', [255, 255, 255]],
  ['mid_gray', [128, 128, 128]],
  ['saturated_red', [220, 24, 42]],
] as const satisfies ReadonlyArray<
  readonly [Exclude<LivingFrameAlphaBackgroundId, 'destination_raster'>, readonly [
    number,
    number,
    number,
  ]]
>

export interface LivingFrameServerRgbaArtifact {
  readonly artifactId: string
  readonly artifactDigestSha256: string
  readonly frameIndex?: number | null
  readonly width: number
  readonly height: number
  readonly rgbaBytes: Uint8Array
  readonly alphaMode: LivingFrameMeasuredAlphaMode
  readonly alphaExpectation: LivingFrameAlphaExpectation
  readonly knownSourceMatteRgb?: readonly [number, number, number] | null
  readonly destinationRgbBytes?: Uint8Array | null
}

export function measureLivingFrameAlphaArtifact(
  input: LivingFrameServerRgbaArtifact,
): LivingFrameAlphaMeasurementReport {
  assertInput(input)

  const pixelCount = input.width * input.height
  const distribution = measureDistribution(input)
  const edgePixelIndexes = collectEdgePixelIndexes(
    input,
    distribution.semiTransparentPixelCount,
  )
  const edge = measureEdges(input, edgePixelIndexes)
  const composites = measureComposites(input, edgePixelIndexes)
  const findingCodes = deriveFindingCodes({
    alphaExpectation: input.alphaExpectation,
    distribution,
    edge,
    composites,
  })

  const draft: LivingFrameAlphaMeasurementReportDraft = {
    contractVersion: LIVING_FRAME_ALPHA_MEASUREMENT_VERSION,
    measurementProfile: LIVING_FRAME_ALPHA_MEASUREMENT_PROFILE,
    evidenceClass: LIVING_FRAME_ALPHA_MEASUREMENT_EVIDENCE_CLASS,
    artifactIdentity: {
      artifactId: input.artifactId,
      artifactDigestSha256: input.artifactDigestSha256,
      measuredRgbaDigestSha256: sha256Bytes(input.rgbaBytes),
      frameIndex: input.frameIndex ?? null,
    },
    raster: {
      width: input.width,
      height: input.height,
      alphaMode: input.alphaMode,
      alphaExpectation: input.alphaExpectation,
    },
    distribution: {
      ...distribution,
      pixelCount,
    },
    edge,
    compositeContext: {
      destinationRasterProvided: input.destinationRgbBytes != null,
      destinationRgbDigestSha256: input.destinationRgbBytes == null
        ? null
        : sha256Bytes(input.destinationRgbBytes),
    },
    composites,
    findingCodes,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawPixels: false,
    containsPathOrUrl: false,
    containsCredentials: false,
  }

  return {
    ...draft,
    reportDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameAlphaMeasurementReportDigest(
  report: unknown,
): report is LivingFrameAlphaMeasurementReport {
  if (!isLivingFrameAlphaMeasurementReportShape(report)) return false
  const { reportDigestSha256, ...draft } = report
  return SHA256.test(reportDigestSha256)
    && sha256(canonicalJsonStringify(draft)) === reportDigestSha256
}

function assertInput(input: LivingFrameServerRgbaArtifact): void {
  if (!SAFE_ID.test(input.artifactId)) {
    throw new Error('Living Frame alpha measurement artifact identity is invalid.')
  }
  if (!SHA256.test(input.artifactDigestSha256)) {
    throw new Error('Living Frame alpha measurement artifact digest is invalid.')
  }
  if (
    !Number.isInteger(input.width)
    || !Number.isInteger(input.height)
    || input.width < 1
    || input.height < 1
    || input.width > MAX_DIMENSION
    || input.height > MAX_DIMENSION
    || input.width * input.height > MAX_PIXEL_COUNT
  ) {
    throw new Error('Living Frame alpha measurement raster dimensions are invalid.')
  }
  if (!(input.rgbaBytes instanceof Uint8Array)) {
    throw new Error('Living Frame alpha measurement requires server-owned RGBA bytes.')
  }
  if (isSharedBuffer(input.rgbaBytes.buffer)) {
    throw new Error(
      'Living Frame alpha measurement rejects concurrently mutable RGBA bytes.',
    )
  }
  if (input.rgbaBytes.length !== input.width * input.height * 4) {
    throw new Error('Living Frame alpha measurement RGBA byte length is invalid.')
  }
  if (
    input.alphaMode !== 'straight_alpha'
    && input.alphaMode !== 'premultiplied_alpha'
  ) {
    throw new Error('Living Frame alpha measurement alpha mode is invalid.')
  }
  if (
    input.alphaExpectation !== 'alpha_required'
    && input.alphaExpectation !== 'opaque_plate_expected'
  ) {
    throw new Error('Living Frame alpha measurement expectation is invalid.')
  }
  if (input.frameIndex != null && (
    !Number.isInteger(input.frameIndex)
    || input.frameIndex < 0
    || input.frameIndex > 10_000_000
  )) {
    throw new Error('Living Frame alpha measurement frame index is invalid.')
  }
  if (input.knownSourceMatteRgb != null) {
    assertRgb(input.knownSourceMatteRgb)
  }
  if (input.destinationRgbBytes != null) {
    if (!(input.destinationRgbBytes instanceof Uint8Array)) {
      throw new Error(
        'Living Frame alpha measurement destination requires server-owned RGB bytes.',
      )
    }
    if (isSharedBuffer(input.destinationRgbBytes.buffer)) {
      throw new Error(
        'Living Frame alpha measurement rejects concurrently mutable destination bytes.',
      )
    }
    if (input.destinationRgbBytes.length !== input.width * input.height * 3) {
      throw new Error(
        'Living Frame alpha measurement destination RGB byte length is invalid.',
      )
    }
  }
}

function assertRgb(rgb: readonly [number, number, number]): void {
  if (rgb.length !== 3 || rgb.some((channel) =>
    !Number.isInteger(channel) || channel < 0 || channel > 255)) {
    throw new Error('Living Frame alpha measurement matte color is invalid.')
  }
}

function measureDistribution(input: LivingFrameServerRgbaArtifact) {
  let transparentPixelCount = 0
  let semiTransparentPixelCount = 0
  let opaquePixelCount = 0
  let borderPixelCount = 0
  let borderTransparentPixelCount = 0
  let borderOpaquePixelCount = 0
  let minX = input.width
  let minY = input.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const alpha = input.rgbaBytes[(y * input.width + x) * 4 + 3]!
      if (alpha === 0) transparentPixelCount += 1
      else if (alpha === 255) opaquePixelCount += 1
      else semiTransparentPixelCount += 1

      if (alpha > 0) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }

      if (isBorderPixel(x, y, input.width, input.height)) {
        borderPixelCount += 1
        if (alpha === 0) borderTransparentPixelCount += 1
        if (alpha === 255) borderOpaquePixelCount += 1
      }
    }
  }

  const pixelCount = input.width * input.height
  const nonTransparentBounds = maxX < minX || maxY < minY
    ? null
    : boundsFromExtents(input, minX, minY, maxX, maxY)

  return {
    transparentPixelCount,
    semiTransparentPixelCount,
    opaquePixelCount,
    transparentPixelRatio: ratio(transparentPixelCount, pixelCount),
    semiTransparentPixelRatio: ratio(semiTransparentPixelCount, pixelCount),
    opaquePixelRatio: ratio(opaquePixelCount, pixelCount),
    alphaCoverageRatio: ratio(
      opaquePixelCount + semiTransparentPixelCount,
      pixelCount,
    ),
    borderPixelCount,
    borderTransparentRatio: ratio(borderTransparentPixelCount, borderPixelCount),
    borderOpaqueRatio: ratio(borderOpaquePixelCount, borderPixelCount),
    nonTransparentBounds,
  }
}

function boundsFromExtents(
  input: LivingFrameServerRgbaArtifact,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): LivingFrameAlphaPixelBounds {
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    touchesTop: minY === 0,
    touchesRight: maxX === input.width - 1,
    touchesBottom: maxY === input.height - 1,
    touchesLeft: minX === 0,
  }
}

function collectEdgePixelIndexes(
  input: LivingFrameServerRgbaArtifact,
  edgePixelCount: number,
): Uint32Array {
  const indexes = new Uint32Array(edgePixelCount)
  let nextIndex = 0
  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const pixelIndex = y * input.width + x
      const alpha = input.rgbaBytes[pixelIndex * 4 + 3]!
      if (alpha > 0 && alpha < 255) {
        indexes[nextIndex] = pixelIndex
        nextIndex += 1
      }
    }
  }
  if (nextIndex !== edgePixelCount) {
    throw new Error(
      'Living Frame alpha measurement edge count changed during measurement.',
    )
  }
  return indexes
}

function measureEdges(
  input: LivingFrameServerRgbaArtifact,
  edgePixelIndexes: Uint32Array,
) {
  let matteSuspectCount = 0
  let premultipliedViolationCount = 0
  let transitionCount = 0
  let abruptTransitionCount = 0

  for (const pixelIndex of edgePixelIndexes) {
    const rgbaOffset = pixelIndex * 4
    const red = input.rgbaBytes[rgbaOffset]!
    const green = input.rgbaBytes[rgbaOffset + 1]!
    const blue = input.rgbaBytes[rgbaOffset + 2]!
    const alpha = input.rgbaBytes[rgbaOffset + 3]!

    if (input.knownSourceMatteRgb != null && input.alphaMode === 'straight_alpha') {
      if (normalizedRgbDistance(
        [red, green, blue],
        input.knownSourceMatteRgb,
      ) <= MATTE_DISTANCE_THRESHOLD) {
        matteSuspectCount += 1
      }
    }
    if (
      input.alphaMode === 'premultiplied_alpha'
      && (red > alpha + 2 || green > alpha + 2 || blue > alpha + 2)
    ) {
      premultipliedViolationCount += 1
    }
  }

  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const alpha = alphaAt(input, x, y)
      if (x + 1 < input.width) {
        const rightAlpha = alphaAt(input, x + 1, y)
        if (alpha !== rightAlpha) {
          transitionCount += 1
          if (Math.abs(alpha - rightAlpha) >= ABRUPT_ALPHA_DELTA) {
            abruptTransitionCount += 1
          }
        }
      }
      if (y + 1 < input.height) {
        const bottomAlpha = alphaAt(input, x, y + 1)
        if (alpha !== bottomAlpha) {
          transitionCount += 1
          if (Math.abs(alpha - bottomAlpha) >= ABRUPT_ALPHA_DELTA) {
            abruptTransitionCount += 1
          }
        }
      }
    }
  }

  return {
    edgeSampleCount: edgePixelIndexes.length,
    matteColorProvided: input.knownSourceMatteRgb != null,
    matteSuspectPixelRatio: input.knownSourceMatteRgb == null
      || input.alphaMode !== 'straight_alpha'
      ? null
      : ratio(matteSuspectCount, edgePixelIndexes.length),
    premultipliedViolationRatio: input.alphaMode !== 'premultiplied_alpha'
      ? null
      : ratio(premultipliedViolationCount, edgePixelIndexes.length),
    alphaTransitionSampleCount: transitionCount,
    abruptTransitionRatio: ratio(abruptTransitionCount, transitionCount),
    twoToneOpaquePatternScore: measureTwoToneOpaquePattern(input),
  }
}

function measureTwoToneOpaquePattern(
  input: LivingFrameServerRgbaArtifact,
): number {
  const colorCounts = new Map<number, number>()
  let opaqueCount = 0
  let neighborCount = 0
  let neighborTransitionCount = 0

  for (let y = 0; y < input.height; y += 1) {
    for (let x = 0; x < input.width; x += 1) {
      const offset = (y * input.width + x) * 4
      if (input.rgbaBytes[offset + 3] !== 255) continue
      opaqueCount += 1
      const key = quantizedColorKey(
        input.rgbaBytes[offset]!,
        input.rgbaBytes[offset + 1]!,
        input.rgbaBytes[offset + 2]!,
      )
      colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1)

      if (x + 1 < input.width) {
        const rightOffset = offset + 4
        if (input.rgbaBytes[rightOffset + 3] === 255) {
          neighborCount += 1
          if (key !== quantizedColorKey(
            input.rgbaBytes[rightOffset]!,
            input.rgbaBytes[rightOffset + 1]!,
            input.rgbaBytes[rightOffset + 2]!,
          )) neighborTransitionCount += 1
        }
      }
      if (y + 1 < input.height) {
        const bottomOffset = offset + input.width * 4
        if (input.rgbaBytes[bottomOffset + 3] === 255) {
          neighborCount += 1
          if (key !== quantizedColorKey(
            input.rgbaBytes[bottomOffset]!,
            input.rgbaBytes[bottomOffset + 1]!,
            input.rgbaBytes[bottomOffset + 2]!,
          )) neighborTransitionCount += 1
        }
      }
    }
  }

  if (opaqueCount === 0 || colorCounts.size < 2) return 0
  const topCounts = [...colorCounts.values()].sort((left, right) => right - left)
  const firstRatio = ratio(topCounts[0] ?? 0, opaqueCount)
  const secondRatio = ratio(topCounts[1] ?? 0, opaqueCount)
  const twoColorCoverage = firstRatio + secondRatio
  const balance = Math.min(firstRatio, secondRatio) * 2
  const transitionRatio = ratio(neighborTransitionCount, neighborCount)
  return rounded(
    twoColorCoverage
      * clamp01(balance)
      * clamp01(transitionRatio * 2),
  )
}

function measureComposites(
  input: LivingFrameServerRgbaArtifact,
  edgePixelIndexes: Uint32Array,
): LivingFrameAlphaCompositeMeasurement[] {
  const measurements = FIXED_BACKGROUNDS.map(([backgroundId, rgb]) =>
    measureCompositeAgainstSolid(input, edgePixelIndexes, backgroundId, rgb))

  if (input.destinationRgbBytes != null) {
    measurements.push(
      measureCompositeAgainstDestination(
        input,
        edgePixelIndexes,
        input.destinationRgbBytes,
      ),
    )
  }
  return measurements
}

function measureCompositeAgainstSolid(
  input: LivingFrameServerRgbaArtifact,
  edgePixelIndexes: Uint32Array,
  backgroundId: Exclude<LivingFrameAlphaBackgroundId, 'destination_raster'>,
  backgroundRgb: readonly [number, number, number],
): LivingFrameAlphaCompositeMeasurement {
  return compositeMeasurement(
    input,
    edgePixelIndexes,
    backgroundId,
    () => backgroundRgb,
  )
}

function measureCompositeAgainstDestination(
  input: LivingFrameServerRgbaArtifact,
  edgePixelIndexes: Uint32Array,
  destinationRgbBytes: Uint8Array,
): LivingFrameAlphaCompositeMeasurement {
  return compositeMeasurement(
    input,
    edgePixelIndexes,
    'destination_raster',
    (pixelIndex) => {
      const offset = pixelIndex * 3
      return [
        destinationRgbBytes[offset]!,
        destinationRgbBytes[offset + 1]!,
        destinationRgbBytes[offset + 2]!,
      ]
    },
  )
}

function compositeMeasurement(
  input: LivingFrameServerRgbaArtifact,
  edgePixelIndexes: Uint32Array,
  backgroundId: LivingFrameAlphaBackgroundId,
  backgroundAt: (pixelIndex: number) => readonly [number, number, number],
): LivingFrameAlphaCompositeMeasurement {
  if (edgePixelIndexes.length === 0) {
    return {
      backgroundId,
      edgeSampleCount: 0,
      meanEdgeContrast: null,
      lowContrastEdgeRatio: null,
    }
  }

  let totalContrast = 0
  let lowContrastCount = 0
  for (const pixelIndex of edgePixelIndexes) {
    const sourceOffset = pixelIndex * 4
    const source: readonly [number, number, number] = [
      input.rgbaBytes[sourceOffset]!,
      input.rgbaBytes[sourceOffset + 1]!,
      input.rgbaBytes[sourceOffset + 2]!,
    ]
    const alpha = input.rgbaBytes[sourceOffset + 3]! / 255
    const background = backgroundAt(pixelIndex)
    const composite = input.alphaMode === 'straight_alpha'
      ? source.map((channel, index) =>
          clampChannel(channel * alpha + background[index]! * (1 - alpha)))
      : source.map((channel, index) =>
          clampChannel(channel + background[index]! * (1 - alpha)))
    const contrast = normalizedRgbDistance(composite, background)
    totalContrast += contrast
    if (contrast < LOW_CONTRAST_THRESHOLD) lowContrastCount += 1
  }

  return {
    backgroundId,
    edgeSampleCount: edgePixelIndexes.length,
    meanEdgeContrast: rounded(totalContrast / edgePixelIndexes.length),
    lowContrastEdgeRatio: ratio(lowContrastCount, edgePixelIndexes.length),
  }
}

function deriveFindingCodes(input: {
  readonly alphaExpectation: LivingFrameAlphaExpectation
  readonly distribution: ReturnType<typeof measureDistribution>
  readonly edge: ReturnType<typeof measureEdges>
  readonly composites: readonly LivingFrameAlphaCompositeMeasurement[]
}): LivingFrameAlphaFindingCode[] {
  const findings = new Set<LivingFrameAlphaFindingCode>()
  const { distribution, edge } = input
  const bounds = distribution.nonTransparentBounds

  const populatedAlphaClasses = [
    distribution.transparentPixelCount,
    distribution.semiTransparentPixelCount,
    distribution.opaquePixelCount,
  ].filter((count) => count > 0).length
  if (populatedAlphaClasses > 1) {
    findings.add('alpha_channel_variation_present')
  }
  if (distribution.opaquePixelRatio === 1) {
    findings.add('alpha_channel_fully_opaque')
  }
  if (distribution.transparentPixelRatio === 1) {
    findings.add('alpha_channel_fully_transparent')
  }
  if (
    input.alphaExpectation === 'alpha_required'
    && distribution.opaquePixelRatio >= 0.995
    && distribution.borderOpaqueRatio >= 0.99
  ) findings.add('opaque_rectangle_detected')
  if (
    input.alphaExpectation === 'alpha_required'
    && distribution.opaquePixelRatio >= 0.95
    && edge.twoToneOpaquePatternScore >= 0.55
  ) findings.add('checkerboard_encoded_as_pixels_suspected')
  if (
    edge.matteSuspectPixelRatio != null
    && edge.edgeSampleCount >= 4
    && edge.matteSuspectPixelRatio >= 0.35
  ) findings.add('matte_edge_contamination_suspected')
  if (
    edge.premultipliedViolationRatio != null
    && edge.premultipliedViolationRatio > 0
  ) findings.add('premultiplied_alpha_violation')
  if (bounds != null && (
    bounds.touchesTop
    && bounds.touchesRight
    && bounds.touchesBottom
    && bounds.touchesLeft
  )) findings.add('alpha_bounds_touch_all_edges')
  if (
    input.alphaExpectation === 'alpha_required'
    && distribution.borderTransparentRatio < 0.05
  ) findings.add('insufficient_transparent_margin')
  if (
    edge.alphaTransitionSampleCount >= 8
    && edge.abruptTransitionRatio >= 0.8
  ) findings.add('edge_discontinuity_high')
  const destination = input.composites.find(
    (measurement) => measurement.backgroundId === 'destination_raster',
  )
  if (
    destination?.lowContrastEdgeRatio != null
    && destination.edgeSampleCount >= 4
    && destination.lowContrastEdgeRatio >= 0.8
  ) findings.add('destination_edge_contrast_low')

  return [...findings].sort()
}

function alphaAt(
  input: LivingFrameServerRgbaArtifact,
  x: number,
  y: number,
): number {
  return input.rgbaBytes[(y * input.width + x) * 4 + 3]!
}

function isBorderPixel(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return x === 0 || y === 0 || x === width - 1 || y === height - 1
}

function quantizedColorKey(red: number, green: number, blue: number): number {
  return (Math.floor(red / 32) << 6)
    | (Math.floor(green / 32) << 3)
    | Math.floor(blue / 32)
}

function normalizedRgbDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  const distance = Math.sqrt(
    ((left[0] ?? 0) - (right[0] ?? 0)) ** 2
    + ((left[1] ?? 0) - (right[1] ?? 0)) ** 2
    + ((left[2] ?? 0) - (right[2] ?? 0)) ** 2,
  )
  return distance / Math.sqrt(3 * 255 ** 2)
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : rounded(numerator / denominator)
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, value))
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function sha256Bytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map((item) => canonicalize(item))
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, canonicalize(object[key])]),
    )
  }
  throw new Error('Living Frame alpha measurement report is not canonical JSON.')
}

function isLivingFrameAlphaMeasurementReportShape(
  value: unknown,
): value is LivingFrameAlphaMeasurementReport {
  if (!isRecord(value) || !hasExactKeys(value, [
    'contractVersion',
    'measurementProfile',
    'evidenceClass',
    'artifactIdentity',
    'raster',
    'distribution',
    'edge',
    'compositeContext',
    'composites',
    'findingCodes',
    'authorityBoundary',
    'containsRawPixels',
    'containsPathOrUrl',
    'containsCredentials',
    'reportDigestSha256',
  ])) return false
  if (
    value.contractVersion !== LIVING_FRAME_ALPHA_MEASUREMENT_VERSION
    || value.measurementProfile !== LIVING_FRAME_ALPHA_MEASUREMENT_PROFILE
    || value.evidenceClass !== LIVING_FRAME_ALPHA_MEASUREMENT_EVIDENCE_CLASS
    || value.containsRawPixels !== false
    || value.containsPathOrUrl !== false
    || value.containsCredentials !== false
    || typeof value.reportDigestSha256 !== 'string'
  ) return false

  if (!isRecord(value.artifactIdentity) || !hasExactKeys(
    value.artifactIdentity,
    [
      'artifactId',
      'artifactDigestSha256',
      'measuredRgbaDigestSha256',
      'frameIndex',
    ],
  )) return false
  if (
    typeof value.artifactIdentity.artifactId !== 'string'
    || !SAFE_ID.test(value.artifactIdentity.artifactId)
    || typeof value.artifactIdentity.artifactDigestSha256 !== 'string'
    || !SHA256.test(value.artifactIdentity.artifactDigestSha256)
    || typeof value.artifactIdentity.measuredRgbaDigestSha256 !== 'string'
    || !SHA256.test(value.artifactIdentity.measuredRgbaDigestSha256)
    || !(value.artifactIdentity.frameIndex === null
      || isIntegerBetween(value.artifactIdentity.frameIndex, 0, 10_000_000))
  ) return false

  if (!isRecord(value.raster) || !hasExactKeys(
    value.raster,
    ['width', 'height', 'alphaMode', 'alphaExpectation'],
  )) return false
  if (
    !isIntegerBetween(value.raster.width, 1, MAX_DIMENSION)
    || !isIntegerBetween(value.raster.height, 1, MAX_DIMENSION)
    || !includesString(LIVING_FRAME_ALPHA_MODES, value.raster.alphaMode)
    || !includesString(
      LIVING_FRAME_ALPHA_EXPECTATIONS,
      value.raster.alphaExpectation,
    )
  ) return false

  if (!isDistributionShape(value.distribution)) return false
  if (!isEdgeShape(value.edge)) return false
  const distribution = value.distribution
  const edge = value.edge
  if (!distributionRelationsMatch(
    distribution,
    value.raster.width,
    value.raster.height,
  )) return false
  if (
    edge.edgeSampleCount
    !== distribution.semiTransparentPixelCount
  ) return false
  if (!isRecord(value.compositeContext) || !hasExactKeys(
    value.compositeContext,
    ['destinationRasterProvided', 'destinationRgbDigestSha256'],
  )) return false
  if (
    typeof value.compositeContext.destinationRasterProvided !== 'boolean'
    || !(
      value.compositeContext.destinationRgbDigestSha256 === null
      || (
        typeof value.compositeContext.destinationRgbDigestSha256 === 'string'
        && SHA256.test(value.compositeContext.destinationRgbDigestSha256)
      )
    )
    || (
      value.compositeContext.destinationRasterProvided
      !== (value.compositeContext.destinationRgbDigestSha256 !== null)
    )
  ) return false

  if (!Array.isArray(value.composites) || ![4, 5].includes(value.composites.length)) {
    return false
  }
  const expectedBackgroundIds = value.compositeContext.destinationRasterProvided
    ? LIVING_FRAME_ALPHA_BACKGROUND_IDS
    : LIVING_FRAME_ALPHA_BACKGROUND_IDS.slice(0, 4)
  if (!value.composites.every((composite, index) =>
    isCompositeShape(composite, expectedBackgroundIds[index]))) return false
  if (!value.composites.every((composite) =>
    composite.edgeSampleCount === edge.edgeSampleCount
    && (
      edge.edgeSampleCount === 0
        ? composite.meanEdgeContrast === null
          && composite.lowContrastEdgeRatio === null
        : composite.meanEdgeContrast !== null
          && composite.lowContrastEdgeRatio !== null
    ))) return false

  const findingCodes = value.findingCodes
  if (
    !Array.isArray(findingCodes)
    || !findingCodes.every((code) =>
      includesString(LIVING_FRAME_ALPHA_FINDING_CODES, code))
    || new Set(findingCodes).size !== findingCodes.length
    || [...findingCodes].sort().some(
      (code, index) => code !== findingCodes[index],
    )
  ) return false

  if (!isAuthorityBoundaryShape(value.authorityBoundary)) return false
  const expectedFindingCodes = deriveFindingCodes({
    alphaExpectation: value.raster.alphaExpectation,
    distribution,
    edge,
    composites: value.composites,
  })
  return expectedFindingCodes.length === findingCodes.length
    && expectedFindingCodes.every((code, index) => code === findingCodes[index])
}

function isDistributionShape(
  value: unknown,
): value is ReturnType<typeof measureDistribution> & {
  readonly pixelCount: number
} {
  if (!isRecord(value) || !hasExactKeys(value, [
    'pixelCount',
    'transparentPixelCount',
    'semiTransparentPixelCount',
    'opaquePixelCount',
    'transparentPixelRatio',
    'semiTransparentPixelRatio',
    'opaquePixelRatio',
    'alphaCoverageRatio',
    'borderPixelCount',
    'borderTransparentRatio',
    'borderOpaqueRatio',
    'nonTransparentBounds',
  ])) return false
  const integerKeys = [
    'pixelCount',
    'transparentPixelCount',
    'semiTransparentPixelCount',
    'opaquePixelCount',
    'borderPixelCount',
  ] as const
  const ratioKeys = [
    'transparentPixelRatio',
    'semiTransparentPixelRatio',
    'opaquePixelRatio',
    'alphaCoverageRatio',
    'borderTransparentRatio',
    'borderOpaqueRatio',
  ] as const
  if (!integerKeys.every((key) =>
    isIntegerBetween(value[key], 0, MAX_PIXEL_COUNT))) return false
  if (!ratioKeys.every((key) => isRatio(value[key]))) return false
  return value.nonTransparentBounds === null
    || isBoundsShape(value.nonTransparentBounds)
}

function isBoundsShape(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'x',
    'y',
    'width',
    'height',
    'touchesTop',
    'touchesRight',
    'touchesBottom',
    'touchesLeft',
  ])) return false
  return isIntegerBetween(value.x, 0, MAX_DIMENSION)
    && isIntegerBetween(value.y, 0, MAX_DIMENSION)
    && isIntegerBetween(value.width, 1, MAX_DIMENSION)
    && isIntegerBetween(value.height, 1, MAX_DIMENSION)
    && ['touchesTop', 'touchesRight', 'touchesBottom', 'touchesLeft'].every(
      (key) => typeof value[key] === 'boolean',
    )
}

function isEdgeShape(
  value: unknown,
): value is ReturnType<typeof measureEdges> {
  if (!isRecord(value) || !hasExactKeys(value, [
    'edgeSampleCount',
    'matteColorProvided',
    'matteSuspectPixelRatio',
    'premultipliedViolationRatio',
    'alphaTransitionSampleCount',
    'abruptTransitionRatio',
    'twoToneOpaquePatternScore',
  ])) return false
  return isIntegerBetween(value.edgeSampleCount, 0, MAX_PIXEL_COUNT)
    && typeof value.matteColorProvided === 'boolean'
    && (value.matteSuspectPixelRatio === null
      || isRatio(value.matteSuspectPixelRatio))
    && (value.premultipliedViolationRatio === null
      || isRatio(value.premultipliedViolationRatio))
    && isIntegerBetween(
      value.alphaTransitionSampleCount,
      0,
      MAX_PIXEL_COUNT * 2,
    )
    && isRatio(value.abruptTransitionRatio)
    && isRatio(value.twoToneOpaquePatternScore)
}

function isCompositeShape(
  value: unknown,
  expectedBackgroundId: unknown,
): value is LivingFrameAlphaCompositeMeasurement {
  if (!isRecord(value) || !hasExactKeys(value, [
    'backgroundId',
    'edgeSampleCount',
    'meanEdgeContrast',
    'lowContrastEdgeRatio',
  ])) return false
  return value.backgroundId === expectedBackgroundId
    && isIntegerBetween(value.edgeSampleCount, 0, MAX_PIXEL_COUNT)
    && (value.meanEdgeContrast === null || isRatio(value.meanEdgeContrast))
    && (value.lowContrastEdgeRatio === null
      || isRatio(value.lowContrastEdgeRatio))
}

function isAuthorityBoundaryShape(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'measurementOnly',
    'planningAuthority',
    'qaAuthority',
    'approvalAuthority',
    'snapshotAuthority',
    'timingAuthority',
    'soundAuthority',
    'estimateAuthority',
    'costAuthority',
    'providerAuthority',
    'toolRouteAuthority',
    'workGraphAuthority',
    'queueAuthority',
    'renderAuthority',
    'runtimePromotionAuthority',
    'productionAuthority',
  ])) return false
  return value.measurementOnly === true
    && Object.entries(value)
      .filter(([key]) => key !== 'measurementOnly')
      .every(([, authority]) => authority === false)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const keys = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  return keys.length === expected.length
    && keys.every((key, index) => key === expected[index])
}

function isIntegerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= minimum
    && value <= maximum
}

function isRatio(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
}

function includesString<const Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] {
  return typeof value === 'string' && values.includes(value)
}

function isSharedBuffer(
  buffer: ArrayBufferLike,
): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
    && buffer instanceof SharedArrayBuffer
}

function distributionRelationsMatch(
  distribution: ReturnType<typeof measureDistribution> & {
    readonly pixelCount: number
  },
  width: number,
  height: number,
): boolean {
  const pixelCount = width * height
  const borderPixelCount = width === 1 || height === 1
    ? pixelCount
    : width * 2 + height * 2 - 4
  return distribution.pixelCount === pixelCount
    && distribution.borderPixelCount === borderPixelCount
    && (
      distribution.transparentPixelCount
      + distribution.semiTransparentPixelCount
      + distribution.opaquePixelCount
    ) === pixelCount
    && distribution.transparentPixelRatio
      === ratio(distribution.transparentPixelCount, pixelCount)
    && distribution.semiTransparentPixelRatio
      === ratio(distribution.semiTransparentPixelCount, pixelCount)
    && distribution.opaquePixelRatio
      === ratio(distribution.opaquePixelCount, pixelCount)
    && distribution.alphaCoverageRatio === ratio(
      distribution.semiTransparentPixelCount + distribution.opaquePixelCount,
      pixelCount,
    )
}
