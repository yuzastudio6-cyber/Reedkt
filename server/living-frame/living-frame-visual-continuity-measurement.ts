import { createHash } from 'node:crypto'

import type {
  LivingFrameVisualContinuityArtifactIdentity,
  LivingFrameVisualContinuityFindingCode,
  LivingFrameVisualContinuityMeasurementAuthorityBoundary,
  LivingFrameVisualContinuityMeasurementReport,
  LivingFrameVisualContinuityMeasurementReportDraft,
  LivingFrameVisualContinuityMetrics,
} from '../../src/types/living-frame-visual-continuity-measurement'
import {
  LIVING_FRAME_VISUAL_CONTINUITY_COMPARISON_MODE,
  LIVING_FRAME_VISUAL_CONTINUITY_FINDING_CODES,
  LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_CLASS,
  LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_PROFILE,
  LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_VERSION,
} from '../../src/types/living-frame-visual-continuity-measurement'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_DIMENSION = 8192
const MAX_PIXEL_COUNT = 16_777_216
const BINARY_ALPHA_THRESHOLD = 128
const HISTOGRAM_BIN_COUNT = 16

const SILHOUETTE_IOU_THRESHOLD = 0.8
const COVERAGE_DRIFT_THRESHOLD = 0.1
const CENTROID_SHIFT_THRESHOLD = 0.03
const ALPHA_DRIFT_THRESHOLD = 0.08
const BOUNDARY_DRIFT_THRESHOLD = 0.35
const PALETTE_DRIFT_THRESHOLD = 0.12
const LUMINANCE_DRIFT_THRESHOLD = 0.12
const OVERLAP_COLOR_DRIFT_THRESHOLD = 0.15

const AUTHORITY_BOUNDARY:
  LivingFrameVisualContinuityMeasurementAuthorityBoundary = Object.freeze({
    measurementOnly: true,
    identityVerificationAuthority: false,
    likenessSafetyAuthority: false,
    documentaryFactAuthority: false,
    continuityQaAuthority: false,
    visualQaAuthority: false,
    planningAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    timingAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    renderAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameServerVisualContinuityArtifact {
  readonly artifactId: string
  readonly artifactDigestSha256: string
  readonly rgbaBytes: Uint8Array
}

export interface LivingFrameServerVisualContinuityMeasurementInput {
  readonly comparisonMode:
    typeof LIVING_FRAME_VISUAL_CONTINUITY_COMPARISON_MODE
  readonly width: number
  readonly height: number
  readonly reference: LivingFrameServerVisualContinuityArtifact
  readonly candidate: LivingFrameServerVisualContinuityArtifact
}

interface ArtifactMeasurement {
  readonly visiblePixelCount: number
  readonly weightedArea: number
  readonly centroidX: number | null
  readonly centroidY: number | null
  readonly binaryMask: Uint8Array
  readonly boundaryMask: Uint8Array
  readonly rgbHistograms: readonly [
    readonly number[],
    readonly number[],
    readonly number[],
  ]
  readonly luminanceHistogram: readonly number[]
}

export function measureLivingFrameVisualContinuity(
  input: LivingFrameServerVisualContinuityMeasurementInput,
): LivingFrameVisualContinuityMeasurementReport {
  assertInput(input)
  const reference = measureArtifact(
    input.reference.rgbaBytes,
    input.width,
    input.height,
  )
  const candidate = measureArtifact(
    input.candidate.rgbaBytes,
    input.width,
    input.height,
  )
  const metrics = compareArtifacts(input, reference, candidate)
  const findingCodes = deriveFindingCodes(metrics)
  const draft: LivingFrameVisualContinuityMeasurementReportDraft = {
    contractVersion: LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_VERSION,
    measurementProfile: LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_PROFILE,
    measurementClass: LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_CLASS,
    comparisonMode: LIVING_FRAME_VISUAL_CONTINUITY_COMPARISON_MODE,
    dimensions: {
      width: input.width,
      height: input.height,
    },
    referenceArtifact: artifactIdentity(input.reference),
    candidateArtifact: artifactIdentity(input.candidate),
    metrics,
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

export function verifyLivingFrameVisualContinuityMeasurementReportDigest(
  value: unknown,
): value is LivingFrameVisualContinuityMeasurementReport {
  if (!isReportShape(value)) return false
  const { reportDigestSha256, ...draft } = value
  return reportDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInput(
  input: LivingFrameServerVisualContinuityMeasurementInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'comparisonMode',
      'width',
      'height',
      'reference',
      'candidate',
    ])
  ) {
    throw new Error(
      'Living Frame visual continuity measurement input shape is invalid.',
    )
  }
  if (
    input.comparisonMode !== LIVING_FRAME_VISUAL_CONTINUITY_COMPARISON_MODE
  ) {
    throw new Error(
      'Living Frame visual continuity comparison mode is invalid.',
    )
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
    throw new Error(
      'Living Frame visual continuity dimensions are invalid.',
    )
  }
  assertArtifact(input.reference, input.width, input.height, 'reference')
  assertArtifact(input.candidate, input.width, input.height, 'candidate')
  if (input.reference.artifactId === input.candidate.artifactId) {
    throw new Error(
      'Living Frame visual continuity artifacts must have unique identities.',
    )
  }
}

function assertArtifact(
  artifact: LivingFrameServerVisualContinuityArtifact,
  width: number,
  height: number,
  role: 'reference' | 'candidate',
): void {
  if (
    !hasExactKeysUnknown(artifact, [
      'artifactId',
      'artifactDigestSha256',
      'rgbaBytes',
    ])
  ) {
    throw new Error(
      `Living Frame visual continuity ${role} artifact shape is invalid.`,
    )
  }
  if (
    !SAFE_ID.test(artifact.artifactId)
    || !SHA256.test(artifact.artifactDigestSha256)
  ) {
    throw new Error(
      `Living Frame visual continuity ${role} identity is invalid.`,
    )
  }
  if (
    !(artifact.rgbaBytes instanceof Uint8Array)
    || artifact.rgbaBytes.length !== width * height * 4
    || isSharedBuffer(artifact.rgbaBytes.buffer)
  ) {
    throw new Error(
      `Living Frame visual continuity ${role} RGBA bytes are invalid.`,
    )
  }
}

function artifactIdentity(
  artifact: LivingFrameServerVisualContinuityArtifact,
): LivingFrameVisualContinuityArtifactIdentity {
  return {
    artifactId: artifact.artifactId,
    artifactDigestSha256: artifact.artifactDigestSha256,
    measuredRgbaDigestSha256: sha256Bytes(artifact.rgbaBytes),
  }
}

function measureArtifact(
  rgbaBytes: Uint8Array,
  width: number,
  height: number,
): ArtifactMeasurement {
  const pixelCount = width * height
  const binaryMask = new Uint8Array(pixelCount)
  const red = new Array<number>(HISTOGRAM_BIN_COUNT).fill(0)
  const green = new Array<number>(HISTOGRAM_BIN_COUNT).fill(0)
  const blue = new Array<number>(HISTOGRAM_BIN_COUNT).fill(0)
  const luminance = new Array<number>(HISTOGRAM_BIN_COUNT).fill(0)
  let visiblePixelCount = 0
  let alphaSum = 0
  let weightedX = 0
  let weightedY = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x
      const byteIndex = pixelIndex * 4
      const alphaByte = rgbaBytes[byteIndex + 3]!
      if (alphaByte >= BINARY_ALPHA_THRESHOLD) {
        binaryMask[pixelIndex] = 1
        visiblePixelCount += 1
      }
      if (alphaByte === 0) continue
      const alphaWeight = alphaByte / 255
      alphaSum += alphaWeight
      weightedX += x * alphaWeight
      weightedY += y * alphaWeight
      const redByte = rgbaBytes[byteIndex]!
      const greenByte = rgbaBytes[byteIndex + 1]!
      const blueByte = rgbaBytes[byteIndex + 2]!
      red[histogramBin(redByte)]! += alphaWeight
      green[histogramBin(greenByte)]! += alphaWeight
      blue[histogramBin(blueByte)]! += alphaWeight
      const luma = Math.round(
        redByte * 0.2126 + greenByte * 0.7152 + blueByte * 0.0722,
      )
      luminance[histogramBin(luma)]! += alphaWeight
    }
  }

  return {
    visiblePixelCount,
    weightedArea: alphaSum,
    centroidX: alphaSum === 0
      ? null
      : rounded((weightedX / alphaSum) / Math.max(1, width - 1)),
    centroidY: alphaSum === 0
      ? null
      : rounded((weightedY / alphaSum) / Math.max(1, height - 1)),
    binaryMask,
    boundaryMask: deriveBoundaryMask(binaryMask, width, height),
    rgbHistograms: [
      normalizeHistogram(red, alphaSum),
      normalizeHistogram(green, alphaSum),
      normalizeHistogram(blue, alphaSum),
    ],
    luminanceHistogram: normalizeHistogram(luminance, alphaSum),
  }
}

function compareArtifacts(
  input: LivingFrameServerVisualContinuityMeasurementInput,
  reference: ArtifactMeasurement,
  candidate: ArtifactMeasurement,
): LivingFrameVisualContinuityMetrics {
  const pixelCount = input.width * input.height
  let intersection = 0
  let union = 0
  let absoluteAlphaDelta = 0
  let overlapRgbDelta = 0
  let overlapPixelCount = 0
  let exactRgbaMatch = true

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const byteIndex = pixelIndex * 4
    const referenceBinary = reference.binaryMask[pixelIndex]!
    const candidateBinary = candidate.binaryMask[pixelIndex]!
    if (referenceBinary === 1 && candidateBinary === 1) {
      intersection += 1
      overlapPixelCount += 1
      overlapRgbDelta += Math.abs(
        input.reference.rgbaBytes[byteIndex]!
          - input.candidate.rgbaBytes[byteIndex]!,
      )
      overlapRgbDelta += Math.abs(
        input.reference.rgbaBytes[byteIndex + 1]!
          - input.candidate.rgbaBytes[byteIndex + 1]!,
      )
      overlapRgbDelta += Math.abs(
        input.reference.rgbaBytes[byteIndex + 2]!
          - input.candidate.rgbaBytes[byteIndex + 2]!,
      )
    }
    if (referenceBinary === 1 || candidateBinary === 1) union += 1
    absoluteAlphaDelta += Math.abs(
      input.reference.rgbaBytes[byteIndex + 3]!
        - input.candidate.rgbaBytes[byteIndex + 3]!,
    )
    for (let channelIndex = 0; channelIndex < 4; channelIndex += 1) {
      if (
        input.reference.rgbaBytes[byteIndex + channelIndex]
          !== input.candidate.rgbaBytes[byteIndex + channelIndex]
      ) exactRgbaMatch = false
    }
  }

  const normalizedCentroidShift =
    reference.centroidX == null
    || reference.centroidY == null
    || candidate.centroidX == null
    || candidate.centroidY == null
      ? null
      : rounded(Math.sqrt(
          (reference.centroidX - candidate.centroidX) ** 2
          + (reference.centroidY - candidate.centroidY) ** 2,
        ) / Math.sqrt(2))

  return {
    pixelCount,
    referenceVisiblePixelCount: reference.visiblePixelCount,
    candidateVisiblePixelCount: candidate.visiblePixelCount,
    exactRgbaMatch,
    binarySilhouetteIntersectionOverUnion: union === 0
      ? null
      : rounded(intersection / union),
    weightedCoverageChangeRatio: rounded(
      Math.abs(reference.weightedArea - candidate.weightedArea)
        / Math.max(1, reference.weightedArea, candidate.weightedArea),
    ),
    normalizedCentroidShift,
    meanAbsoluteAlphaDelta: rounded(
      absoluteAlphaDelta / (pixelCount * 255),
    ),
    alphaBoundaryDisagreementRatio: measureBoundaryDisagreement(
      reference.boundaryMask,
      candidate.boundaryMask,
      input.width,
      input.height,
    ),
    normalizedRgbHistogramDistance:
      reference.weightedArea === 0 || candidate.weightedArea === 0
        ? null
        : rounded(
            (
              histogramL1(
                reference.rgbHistograms[0],
                candidate.rgbHistograms[0],
              )
              + histogramL1(
                reference.rgbHistograms[1],
                candidate.rgbHistograms[1],
              )
              + histogramL1(
                reference.rgbHistograms[2],
                candidate.rgbHistograms[2],
              )
            ) / 6,
          ),
    normalizedLuminanceHistogramDistance:
      reference.weightedArea === 0 || candidate.weightedArea === 0
        ? null
        : rounded(
            histogramL1(
              reference.luminanceHistogram,
              candidate.luminanceHistogram,
            ) / 2,
          ),
    normalizedOverlapRgbDelta: overlapPixelCount === 0
      ? null
      : rounded(overlapRgbDelta / (overlapPixelCount * 3 * 255)),
  }
}

function deriveFindingCodes(
  metrics: LivingFrameVisualContinuityMetrics,
): LivingFrameVisualContinuityFindingCode[] {
  const findings = new Set<LivingFrameVisualContinuityFindingCode>()
  if (
    metrics.referenceVisiblePixelCount === 0
    || metrics.candidateVisiblePixelCount === 0
  ) findings.add('empty_reference_or_candidate')
  if (
    metrics.binarySilhouetteIntersectionOverUnion != null
    && metrics.binarySilhouetteIntersectionOverUnion
      < SILHOUETTE_IOU_THRESHOLD
  ) findings.add('silhouette_overlap_low')
  if (
    metrics.weightedCoverageChangeRatio >= COVERAGE_DRIFT_THRESHOLD
  ) findings.add('silhouette_coverage_drift_high')
  if (
    metrics.normalizedCentroidShift != null
    && metrics.normalizedCentroidShift >= CENTROID_SHIFT_THRESHOLD
  ) findings.add('silhouette_centroid_shift_high')
  if (
    metrics.meanAbsoluteAlphaDelta >= ALPHA_DRIFT_THRESHOLD
  ) findings.add('alpha_distribution_drift_high')
  if (
    metrics.alphaBoundaryDisagreementRatio != null
    && metrics.alphaBoundaryDisagreementRatio >= BOUNDARY_DRIFT_THRESHOLD
  ) findings.add('alpha_boundary_drift_high')
  if (
    metrics.normalizedRgbHistogramDistance != null
    && metrics.normalizedRgbHistogramDistance >= PALETTE_DRIFT_THRESHOLD
  ) findings.add('palette_drift_high')
  if (
    metrics.normalizedLuminanceHistogramDistance != null
    && metrics.normalizedLuminanceHistogramDistance
      >= LUMINANCE_DRIFT_THRESHOLD
  ) findings.add('luminance_drift_high')
  if (
    metrics.normalizedOverlapRgbDelta != null
    && metrics.normalizedOverlapRgbDelta >= OVERLAP_COLOR_DRIFT_THRESHOLD
  ) findings.add('overlap_color_drift_high')
  return [...findings].sort()
}

function deriveBoundaryMask(
  binaryMask: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const boundary = new Uint8Array(binaryMask.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      if (binaryMask[index] === 0) continue
      if (
        x === 0
        || y === 0
        || x === width - 1
        || y === height - 1
        || binaryMask[index - 1] === 0
        || binaryMask[index + 1] === 0
        || binaryMask[index - width] === 0
        || binaryMask[index + width] === 0
      ) boundary[index] = 1
    }
  }
  return boundary
}

function measureBoundaryDisagreement(
  reference: Uint8Array,
  candidate: Uint8Array,
  width: number,
  height: number,
): number | null {
  let referenceCount = 0
  let candidateCount = 0
  let unmatched = 0
  for (let index = 0; index < reference.length; index += 1) {
    if (reference[index] === 1) {
      referenceCount += 1
      if (!hasBoundaryNeighbor(candidate, index, width, height)) unmatched += 1
    }
    if (candidate[index] === 1) {
      candidateCount += 1
      if (!hasBoundaryNeighbor(reference, index, width, height)) unmatched += 1
    }
  }
  return referenceCount + candidateCount === 0
    ? null
    : rounded(unmatched / (referenceCount + candidateCount))
}

function hasBoundaryNeighbor(
  boundary: Uint8Array,
  index: number,
  width: number,
  height: number,
): boolean {
  const x = index % width
  const y = Math.floor(index / width)
  for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      const candidateX = x + xOffset
      const candidateY = y + yOffset
      if (
        candidateX >= 0
        && candidateX < width
        && candidateY >= 0
        && candidateY < height
        && boundary[candidateY * width + candidateX] === 1
      ) return true
    }
  }
  return false
}

function histogramBin(value: number): number {
  return Math.min(
    HISTOGRAM_BIN_COUNT - 1,
    Math.floor(value / (256 / HISTOGRAM_BIN_COUNT)),
  )
}

function normalizeHistogram(
  values: readonly number[],
  totalWeight: number,
): number[] {
  return values.map((value) =>
    totalWeight === 0 ? 0 : value / totalWeight)
}

function histogramL1(
  reference: readonly number[],
  candidate: readonly number[],
): number {
  return reference.reduce(
    (sum, value, index) => sum + Math.abs(value - candidate[index]!),
    0,
  )
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
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
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  throw new Error(
    'Living Frame visual continuity report is not canonical JSON.',
  )
}

function isReportShape(
  value: unknown,
): value is LivingFrameVisualContinuityMeasurementReport {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'measurementProfile',
      'measurementClass',
      'comparisonMode',
      'dimensions',
      'referenceArtifact',
      'candidateArtifact',
      'metrics',
      'findingCodes',
      'authorityBoundary',
      'containsRawPixels',
      'containsPathOrUrl',
      'containsCredentials',
      'reportDigestSha256',
    ])
  ) return false
  if (
    value.contractVersion !== LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_VERSION
    || value.measurementProfile
      !== LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_PROFILE
    || value.measurementClass
      !== LIVING_FRAME_VISUAL_CONTINUITY_MEASUREMENT_CLASS
    || value.comparisonMode
      !== LIVING_FRAME_VISUAL_CONTINUITY_COMPARISON_MODE
    || value.containsRawPixels !== false
    || value.containsPathOrUrl !== false
    || value.containsCredentials !== false
    || typeof value.reportDigestSha256 !== 'string'
    || !SHA256.test(value.reportDigestSha256)
  ) return false
  if (!isDimensions(value.dimensions)) return false
  if (!isArtifactIdentity(value.referenceArtifact)) return false
  if (!isArtifactIdentity(value.candidateArtifact)) return false
  if (value.referenceArtifact.artifactId === value.candidateArtifact.artifactId) {
    return false
  }
  if (!isMetrics(value.metrics)) return false
  if (
    value.metrics.pixelCount !== value.dimensions.width * value.dimensions.height
  ) return false
  if (
    !Array.isArray(value.findingCodes)
    || !value.findingCodes.every((code) =>
      includesString(LIVING_FRAME_VISUAL_CONTINUITY_FINDING_CODES, code))
  ) return false
  const findingCodes =
    value.findingCodes as LivingFrameVisualContinuityFindingCode[]
  if (
    new Set(findingCodes).size !== findingCodes.length
    || [...findingCodes].sort().some(
      (code, index) => code !== findingCodes[index],
    )
  ) return false
  if (!isAuthorityBoundary(value.authorityBoundary)) return false
  const expectedFindings = deriveFindingCodes(value.metrics)
  return expectedFindings.length === findingCodes.length
    && expectedFindings.every(
      (finding, index) => finding === findingCodes[index],
    )
}

function isDimensions(
  value: unknown,
): value is { readonly width: number; readonly height: number } {
  return isRecord(value)
    && hasExactKeys(value, ['width', 'height'])
    && isIntegerBetween(value.width, 1, MAX_DIMENSION)
    && isIntegerBetween(value.height, 1, MAX_DIMENSION)
    && value.width * value.height <= MAX_PIXEL_COUNT
}

function isArtifactIdentity(
  value: unknown,
): value is LivingFrameVisualContinuityArtifactIdentity {
  return isRecord(value)
    && hasExactKeys(value, [
      'artifactId',
      'artifactDigestSha256',
      'measuredRgbaDigestSha256',
    ])
    && typeof value.artifactId === 'string'
    && SAFE_ID.test(value.artifactId)
    && typeof value.artifactDigestSha256 === 'string'
    && SHA256.test(value.artifactDigestSha256)
    && typeof value.measuredRgbaDigestSha256 === 'string'
    && SHA256.test(value.measuredRgbaDigestSha256)
}

function isMetrics(
  value: unknown,
): value is LivingFrameVisualContinuityMetrics {
  return isRecord(value)
    && hasExactKeys(value, [
      'pixelCount',
      'referenceVisiblePixelCount',
      'candidateVisiblePixelCount',
      'exactRgbaMatch',
      'binarySilhouetteIntersectionOverUnion',
      'weightedCoverageChangeRatio',
      'normalizedCentroidShift',
      'meanAbsoluteAlphaDelta',
      'alphaBoundaryDisagreementRatio',
      'normalizedRgbHistogramDistance',
      'normalizedLuminanceHistogramDistance',
      'normalizedOverlapRgbDelta',
    ])
    && isIntegerBetween(value.pixelCount, 1, MAX_PIXEL_COUNT)
    && isIntegerBetween(
      value.referenceVisiblePixelCount,
      0,
      value.pixelCount,
    )
    && isIntegerBetween(
      value.candidateVisiblePixelCount,
      0,
      value.pixelCount,
    )
    && typeof value.exactRgbaMatch === 'boolean'
    && nullableRatio(value.binarySilhouetteIntersectionOverUnion)
    && isRatio(value.weightedCoverageChangeRatio)
    && nullableRatio(value.normalizedCentroidShift)
    && isRatio(value.meanAbsoluteAlphaDelta)
    && nullableRatio(value.alphaBoundaryDisagreementRatio)
    && nullableRatio(value.normalizedRgbHistogramDistance)
    && nullableRatio(value.normalizedLuminanceHistogramDistance)
    && nullableRatio(value.normalizedOverlapRgbDelta)
}

function isAuthorityBoundary(value: unknown): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'measurementOnly',
      'identityVerificationAuthority',
      'likenessSafetyAuthority',
      'documentaryFactAuthority',
      'continuityQaAuthority',
      'visualQaAuthority',
      'planningAuthority',
      'approvalAuthority',
      'snapshotAuthority',
      'timingAuthority',
      'estimateAuthority',
      'costAuthority',
      'providerAuthority',
      'toolRouteAuthority',
      'workGraphAuthority',
      'queueAuthority',
      'assetManifestAuthority',
      'renderAuthority',
      'runtimePromotionAuthority',
      'productionAuthority',
    ])
  ) return false
  return value.measurementOnly === true
    && Object.entries(value)
      .filter(([key]) => key !== 'measurementOnly')
      .every(([, authority]) => authority === false)
}

function nullableRatio(value: unknown): boolean {
  return value === null || isRatio(value)
}

function isRatio(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
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

function hasExactKeysUnknown(
  value: unknown,
  expectedKeys: readonly string[],
): boolean {
  return isRecord(value) && hasExactKeys(value, expectedKeys)
}

function includesString<const Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] {
  return typeof value === 'string' && values.includes(value)
}

function isSharedBuffer(buffer: ArrayBufferLike): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
    && buffer instanceof SharedArrayBuffer
}
