import { createHash } from 'node:crypto'

import type {
  LivingFrameControlImageCannyAuthorityBoundary,
  LivingFrameControlImageCannyMetrics,
  LivingFrameControlImageCannyReport,
  LivingFrameControlImageCannyReportDraft,
} from '../../src/types/living-frame-control-image-canny'
import {
  LIVING_FRAME_CONTROL_IMAGE_CANNY_CLASS,
  LIVING_FRAME_CONTROL_IMAGE_CANNY_PROFILE,
  LIVING_FRAME_CONTROL_IMAGE_CANNY_VERSION,
} from '../../src/types/living-frame-control-image-canny'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_DIMENSION = 4096
const MAX_PIXEL_COUNT = 4_194_304
const WEAK = 128
const STRONG = 255

const AUTHORITY_BOUNDARY:
  LivingFrameControlImageCannyAuthorityBoundary = Object.freeze({
    deterministicReferencePixelProcessingOnly: true,
    sourceAnalysisAuthority: false,
    semanticControlChoiceAuthority: false,
    selectedSceneAuthority: false,
    artifactCreationAuthority: false,
    artifactCommitmentAuthority: false,
    artifactQaAuthority: false,
    assetManifestAuthority: false,
    modelWeightAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    renderAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

const PROCESSING_CONTRACT =
  Object.freeze({
    straightAlphaInput: true as const,
    transparentPixelPolicy: 'composite_over_black' as const,
    grayscaleCoefficients: [77, 150, 29] as const,
    gaussianKernel: [1, 2, 1, 2, 4, 2, 1, 2, 1] as const,
    borderPolicy: 'clamp_to_edge' as const,
    gradientOperator: 'sobel_3x3' as const,
    orientationBucketsDegrees: [0, 45, 90, 135] as const,
    nonMaximumSuppression: true as const,
    hysteresisConnectivity: 8 as const,
    finalEdgeValue: 255 as const,
    finalBackgroundValue: 0 as const,
  })

export interface CreateLivingFrameControlImageCannyInput {
  readonly sourceArtifactId: string
  readonly sourceArtifactDigestSha256: string
  readonly width: number
  readonly height: number
  readonly sourceRgbaBytes: Uint8Array
  readonly lowThreshold: number
  readonly highThreshold: number
}

export interface CreateLivingFrameControlImageCannyResult {
  readonly outputRgbaBytes: Uint8Array
  readonly report: LivingFrameControlImageCannyReport
}

export function createLivingFrameControlImageCanny(
  input: CreateLivingFrameControlImageCannyInput,
): CreateLivingFrameControlImageCannyResult {
  assertInput(input)
  const sourceBefore = new Uint8Array(input.sourceRgbaBytes)
  const pixelCount = input.width * input.height
  const grayscale = new Float32Array(pixelCount)
  let transparentInputPixelCount = 0
  let semitransparentInputPixelCount = 0
  let opaqueInputPixelCount = 0

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4
    const alphaByte = input.sourceRgbaBytes[offset + 3]!
    if (alphaByte === 0) transparentInputPixelCount += 1
    else if (alphaByte === 255) opaqueInputPixelCount += 1
    else semitransparentInputPixelCount += 1
    const alpha = alphaByte / 255
    const red = input.sourceRgbaBytes[offset]! * alpha
    const green = input.sourceRgbaBytes[offset + 1]! * alpha
    const blue = input.sourceRgbaBytes[offset + 2]! * alpha
    grayscale[index] = (77 * red + 150 * green + 29 * blue) / 256
  }

  const blurred = gaussian3(grayscale, input.width, input.height)
  const gradients = sobel(blurred, input.width, input.height)
  const suppressed = nonMaximumSuppression(
    gradients.magnitude,
    gradients.orientation,
    input.width,
    input.height,
  )
  const classified = new Uint8Array(pixelCount)
  let nonMaximumSuppressedPixelCount = 0
  let strongSeedPixelCount = 0
  let weakCandidatePixelCount = 0
  for (let index = 0; index < pixelCount; index += 1) {
    const magnitude = suppressed[index]!
    if (magnitude > 0) nonMaximumSuppressedPixelCount += 1
    if (magnitude >= input.highThreshold) {
      classified[index] = STRONG
      strongSeedPixelCount += 1
    } else if (magnitude >= input.lowThreshold) {
      classified[index] = WEAK
      weakCandidatePixelCount += 1
    }
  }
  const { edgeMap, promotedWeakPixelCount } = hysteresis(
    classified,
    input.width,
    input.height,
  )
  const output = new Uint8Array(pixelCount * 4)
  let finalEdgePixelCount = 0
  for (let index = 0; index < pixelCount; index += 1) {
    const value = edgeMap[index]!
    if (value === STRONG) finalEdgePixelCount += 1
    const offset = index * 4
    output[offset] = value
    output[offset + 1] = value
    output[offset + 2] = value
    output[offset + 3] = 255
  }
  if (!equalBytes(sourceBefore, input.sourceRgbaBytes)) {
    throw invalid('source RGBA input was mutated.')
  }
  const nonZeroGradientPixelCount = gradients.magnitude.reduce(
    (count, magnitude) => count + (magnitude > 0 ? 1 : 0),
    0,
  )
  const metrics: LivingFrameControlImageCannyMetrics = {
    pixelCount,
    transparentInputPixelCount,
    semitransparentInputPixelCount,
    opaqueInputPixelCount,
    nonZeroGradientPixelCount,
    nonMaximumSuppressedPixelCount,
    strongSeedPixelCount,
    weakCandidatePixelCount,
    promotedWeakPixelCount,
    finalEdgePixelCount,
    finalEdgeCoverageRatio: rounded(finalEdgePixelCount / pixelCount),
  }
  const draft: LivingFrameControlImageCannyReportDraft = {
    contractVersion: LIVING_FRAME_CONTROL_IMAGE_CANNY_VERSION,
    resultClass: LIVING_FRAME_CONTROL_IMAGE_CANNY_CLASS,
    algorithmProfile: LIVING_FRAME_CONTROL_IMAGE_CANNY_PROFILE,
    sourceArtifact: {
      artifactId: input.sourceArtifactId,
      artifactDigestSha256: input.sourceArtifactDigestSha256,
      measuredSourceRgbaDigestSha256: sha256(sourceBefore),
    },
    outputRaster: {
      width: input.width,
      height: input.height,
      pixelFormat: 'rgba8',
      alphaMode: 'opaque',
      measuredOutputRgbaDigestSha256: sha256(output),
    },
    thresholds: {
      low: input.lowThreshold,
      high: input.highThreshold,
    },
    processingContract: PROCESSING_CONTRACT,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    outputPixelsReturnedOutOfBand: true,
    sourcePixelsUnmodified: true,
    reportContainsRawPixels: false,
    reportContainsPathOrUrl: false,
    reportContainsCredentials: false,
    controlImageArtifactCreated: false,
    passesCanonicalQa: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    outputRgbaBytes: output,
    report: {
      ...draft,
      reportDigestSha256: sha256(canonicalJson(draft)),
    },
  }
}

export function verifyLivingFrameControlImageCannyReport(
  value: unknown,
): value is LivingFrameControlImageCannyReport {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'resultClass',
      'algorithmProfile',
      'sourceArtifact',
      'outputRaster',
      'thresholds',
      'processingContract',
      'metrics',
      'authorityBoundary',
      'outputPixelsReturnedOutOfBand',
      'sourcePixelsUnmodified',
      'reportContainsRawPixels',
      'reportContainsPathOrUrl',
      'reportContainsCredentials',
      'controlImageArtifactCreated',
      'passesCanonicalQa',
      'subjectSpecificRouting',
      'productionReady',
      'reportDigestSha256',
    ])) return false
    const report = value as unknown as LivingFrameControlImageCannyReport
    const { reportDigestSha256, ...draft } = report
    return SHA256.test(reportDigestSha256)
      && reportDigestSha256 === sha256(canonicalJson(draft))
      && report.contractVersion === LIVING_FRAME_CONTROL_IMAGE_CANNY_VERSION
      && report.resultClass === LIVING_FRAME_CONTROL_IMAGE_CANNY_CLASS
      && report.algorithmProfile === LIVING_FRAME_CONTROL_IMAGE_CANNY_PROFILE
      && validSourceArtifact(report.sourceArtifact)
      && validOutputRaster(report.outputRaster)
      && validThresholds(report.thresholds)
      && canonicalJson(report.processingContract)
        === canonicalJson(PROCESSING_CONTRACT)
      && validMetrics(report.metrics, report.outputRaster)
      && canonicalJson(report.authorityBoundary)
        === canonicalJson(AUTHORITY_BOUNDARY)
      && report.outputPixelsReturnedOutOfBand === true
      && report.sourcePixelsUnmodified === true
      && report.reportContainsRawPixels === false
      && report.reportContainsPathOrUrl === false
      && report.reportContainsCredentials === false
      && report.controlImageArtifactCreated === false
      && report.passesCanonicalQa === false
      && report.subjectSpecificRouting === false
      && report.productionReady === false
  } catch {
    return false
  }
}

function gaussian3(
  source: Float32Array,
  width: number,
  height: number,
): Float32Array {
  const output = new Float32Array(source.length)
  const kernel = PROCESSING_CONTRACT.gaussianKernel
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let weighted = 0
      let kernelIndex = 0
      for (let ky = -1; ky <= 1; ky += 1) {
        const sampleY = clamp(y + ky, 0, height - 1)
        for (let kx = -1; kx <= 1; kx += 1) {
          const sampleX = clamp(x + kx, 0, width - 1)
          weighted += source[sampleY * width + sampleX]!
            * kernel[kernelIndex]!
          kernelIndex += 1
        }
      }
      output[y * width + x] = weighted / 16
    }
  }
  return output
}

function sobel(
  source: Float32Array,
  width: number,
  height: number,
): {
  readonly magnitude: Float32Array
  readonly orientation: Uint8Array
} {
  const magnitude = new Float32Array(source.length)
  const orientation = new Uint8Array(source.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const topLeft = sample(source, width, height, x - 1, y - 1)
      const top = sample(source, width, height, x, y - 1)
      const topRight = sample(source, width, height, x + 1, y - 1)
      const left = sample(source, width, height, x - 1, y)
      const right = sample(source, width, height, x + 1, y)
      const bottomLeft = sample(source, width, height, x - 1, y + 1)
      const bottom = sample(source, width, height, x, y + 1)
      const bottomRight = sample(source, width, height, x + 1, y + 1)
      const gx =
        -topLeft + topRight - 2 * left + 2 * right
        - bottomLeft + bottomRight
      const gy =
        -topLeft - 2 * top - topRight
        + bottomLeft + 2 * bottom + bottomRight
      const index = y * width + x
      magnitude[index] = Math.min(255, Math.hypot(gx, gy))
      orientation[index] = orientationBucket(Math.atan2(gy, gx))
    }
  }
  return { magnitude, orientation }
}

function orientationBucket(radians: number): number {
  let degrees = radians * 180 / Math.PI
  if (degrees < 0) degrees += 180
  if (degrees < 22.5 || degrees >= 157.5) return 0
  if (degrees < 67.5) return 1
  if (degrees < 112.5) return 2
  return 3
}

function nonMaximumSuppression(
  magnitude: Float32Array,
  orientation: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const output = new Uint8Array(magnitude.length)
  const directions = [
    [[-1, 0], [1, 0]],
    [[-1, -1], [1, 1]],
    [[0, -1], [0, 1]],
    [[1, -1], [-1, 1]],
  ] as const
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      const current = magnitude[index]!
      const direction = directions[orientation[index]!]!
      const before = sample(
        magnitude,
        width,
        height,
        x + direction[0][0],
        y + direction[0][1],
      )
      const after = sample(
        magnitude,
        width,
        height,
        x + direction[1][0],
        y + direction[1][1],
      )
      if (current >= before && current >= after) {
        output[index] = Math.min(255, Math.round(current))
      }
    }
  }
  return output
}

function hysteresis(
  classified: Uint8Array,
  width: number,
  height: number,
): {
  readonly edgeMap: Uint8Array
  readonly promotedWeakPixelCount: number
} {
  const output = new Uint8Array(classified.length)
  const stack: number[] = []
  for (let index = 0; index < classified.length; index += 1) {
    if (classified[index] === STRONG) {
      output[index] = STRONG
      stack.push(index)
    }
  }
  let promotedWeakPixelCount = 0
  while (stack.length > 0) {
    const index = stack.pop()!
    const x = index % width
    const y = Math.floor(index / width)
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue
        const nextX = x + dx
        const nextY = y + dy
        if (
          nextX < 0 || nextX >= width
          || nextY < 0 || nextY >= height
        ) continue
        const next = nextY * width + nextX
        if (classified[next] === WEAK && output[next] !== STRONG) {
          output[next] = STRONG
          promotedWeakPixelCount += 1
          stack.push(next)
        }
      }
    }
  }
  return { edgeMap: output, promotedWeakPixelCount }
}

function assertInput(input: CreateLivingFrameControlImageCannyInput): void {
  if (!isRecord(input) || !hasExactKeys(input as unknown as Record<string, unknown>, [
    'sourceArtifactId',
    'sourceArtifactDigestSha256',
    'width',
    'height',
    'sourceRgbaBytes',
    'lowThreshold',
    'highThreshold',
  ])) throw invalid('input shape is invalid.')
  if (
    typeof input.sourceArtifactId !== 'string'
    || !SAFE_ID.test(input.sourceArtifactId)
    || typeof input.sourceArtifactDigestSha256 !== 'string'
    || !SHA256.test(input.sourceArtifactDigestSha256)
  ) throw invalid('source artifact identity is invalid.')
  if (
    !Number.isInteger(input.width)
    || !Number.isInteger(input.height)
    || input.width < 3
    || input.height < 3
    || input.width > MAX_DIMENSION
    || input.height > MAX_DIMENSION
    || input.width * input.height > MAX_PIXEL_COUNT
  ) throw invalid('dimensions are invalid.')
  if (
    !(input.sourceRgbaBytes instanceof Uint8Array)
    || isSharedBuffer(input.sourceRgbaBytes.buffer)
    || input.sourceRgbaBytes.length !== input.width * input.height * 4
  ) throw invalid('source RGBA bytes are invalid.')
  if (
    !Number.isInteger(input.lowThreshold)
    || !Number.isInteger(input.highThreshold)
    || input.lowThreshold < 0
    || input.lowThreshold > 254
    || input.highThreshold < 1
    || input.highThreshold > 255
    || input.lowThreshold >= input.highThreshold
  ) throw invalid('thresholds are invalid.')
}

function validSourceArtifact(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'artifactId',
      'artifactDigestSha256',
      'measuredSourceRgbaDigestSha256',
    ])
    && typeof value.artifactId === 'string'
    && SAFE_ID.test(value.artifactId)
    && typeof value.artifactDigestSha256 === 'string'
    && SHA256.test(value.artifactDigestSha256)
    && typeof value.measuredSourceRgbaDigestSha256 === 'string'
    && SHA256.test(value.measuredSourceRgbaDigestSha256)
}

function validOutputRaster(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'width',
      'height',
      'pixelFormat',
      'alphaMode',
      'measuredOutputRgbaDigestSha256',
    ])
    && integerBetween(value.width, 3, MAX_DIMENSION)
    && integerBetween(value.height, 3, MAX_DIMENSION)
    && value.width * value.height <= MAX_PIXEL_COUNT
    && value.pixelFormat === 'rgba8'
    && value.alphaMode === 'opaque'
    && typeof value.measuredOutputRgbaDigestSha256 === 'string'
    && SHA256.test(value.measuredOutputRgbaDigestSha256)
}

function validThresholds(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['low', 'high'])
    && integerBetween(value.low, 0, 254)
    && integerBetween(value.high, 1, 255)
    && value.low < value.high
}

function validMetrics(
  value: unknown,
  raster: LivingFrameControlImageCannyReport['outputRaster'],
): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'pixelCount',
    'transparentInputPixelCount',
    'semitransparentInputPixelCount',
    'opaqueInputPixelCount',
    'nonZeroGradientPixelCount',
    'nonMaximumSuppressedPixelCount',
    'strongSeedPixelCount',
    'weakCandidatePixelCount',
    'promotedWeakPixelCount',
    'finalEdgePixelCount',
    'finalEdgeCoverageRatio',
  ])) return false
  const pixelCount = raster.width * raster.height
  const integerKeys = [
    'transparentInputPixelCount',
    'semitransparentInputPixelCount',
    'opaqueInputPixelCount',
    'nonZeroGradientPixelCount',
    'nonMaximumSuppressedPixelCount',
    'strongSeedPixelCount',
    'weakCandidatePixelCount',
    'promotedWeakPixelCount',
    'finalEdgePixelCount',
  ] as const
  const transparentInputPixelCount = Number(value.transparentInputPixelCount)
  const semitransparentInputPixelCount = Number(
    value.semitransparentInputPixelCount,
  )
  const opaqueInputPixelCount = Number(value.opaqueInputPixelCount)
  const finalEdgePixelCount = Number(value.finalEdgePixelCount)
  return value.pixelCount === pixelCount
    && integerKeys.every((key) => integerBetween(value[key], 0, pixelCount))
    && transparentInputPixelCount
      + semitransparentInputPixelCount
      + opaqueInputPixelCount === pixelCount
    && typeof value.finalEdgeCoverageRatio === 'number'
    && Number.isFinite(value.finalEdgeCoverageRatio)
    && value.finalEdgeCoverageRatio >= 0
    && value.finalEdgeCoverageRatio <= 1
    && value.finalEdgeCoverageRatio
      === rounded(finalEdgePixelCount / pixelCount)
}

function sample(
  source: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  return source[
    clamp(y, 0, height - 1) * width + clamp(x, 0, width - 1)
  ]!
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function rounded(value: number): number {
  return Number(value.toFixed(8))
}

function integerBetween(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function isSharedBuffer(buffer: ArrayBufferLike): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
    && buffer instanceof SharedArrayBuffer
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}

function invalid(reason: string): Error {
  return new Error(`Living Frame Canny control image rejected: ${reason}`)
}
