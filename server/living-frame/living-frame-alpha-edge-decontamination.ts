import { createHash } from 'node:crypto'

import type {
  LivingFrameAlphaEdgeDecontaminationAuthorityBoundary,
  LivingFrameAlphaEdgeDecontaminationFindingCode,
  LivingFrameAlphaEdgeDecontaminationMetrics,
  LivingFrameAlphaEdgeDecontaminationReport,
  LivingFrameAlphaEdgeDecontaminationReportDraft,
} from '../../src/types/living-frame-alpha-edge-decontamination'
import {
  LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_FINDING_CODES,
  LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_PROFILE,
  LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_RESULT_CLASS,
  LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_VERSION,
  LIVING_FRAME_ALPHA_EDGE_INPUT_MODE,
  LIVING_FRAME_ALPHA_EDGE_OUTPUT_MODE,
} from '../../src/types/living-frame-alpha-edge-decontamination'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_DIMENSION = 8192
const MAX_PIXEL_COUNT = 16_777_216
const LOW_ALPHA_MAXIMUM = 32
const EXCESSIVE_CLAMP_RATIO = 0.15

const AUTHORITY_BOUNDARY:
  LivingFrameAlphaEdgeDecontaminationAuthorityBoundary = Object.freeze({
    deterministicProcessingPrimitiveOnly: true,
    artifactQaAuthority: false,
    planningAuthority: false,
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
    assetManifestAuthority: false,
    renderAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameServerAlphaEdgeDecontaminationInput {
  readonly artifactId: string
  readonly artifactDigestSha256: string
  readonly width: number
  readonly height: number
  readonly rgbaBytes: Uint8Array
  readonly inputAlphaMode: typeof LIVING_FRAME_ALPHA_EDGE_INPUT_MODE
  readonly knownSourceMatteRgb: readonly [number, number, number]
}

export interface LivingFrameServerAlphaEdgeDecontaminationResult {
  readonly outputRgbaBytes: Uint8Array
  readonly report: LivingFrameAlphaEdgeDecontaminationReport
}

export function decontaminateLivingFrameAlphaEdges(
  input: LivingFrameServerAlphaEdgeDecontaminationInput,
): LivingFrameServerAlphaEdgeDecontaminationResult {
  assertInput(input)

  const output = new Uint8Array(input.rgbaBytes.length)
  const pixelCount = input.width * input.height
  let transparentPixelCount = 0
  let semitransparentPixelCount = 0
  let opaquePixelCount = 0
  let lowAlphaPixelCount = 0
  let changedPixelCount = 0
  let transparentRgbCleanupPixelCount = 0
  let clampedChannelCount = 0
  let maximumRgbChannelDelta = 0
  let semitransparentRgbChannelDelta = 0

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const byteIndex = pixelIndex * 4
    const alphaByte = input.rgbaBytes[byteIndex + 3]!
    output[byteIndex + 3] = alphaByte

    if (alphaByte === 0) {
      transparentPixelCount += 1
      const hadRgbPayload = input.rgbaBytes[byteIndex] !== 0
        || input.rgbaBytes[byteIndex + 1] !== 0
        || input.rgbaBytes[byteIndex + 2] !== 0
      if (hadRgbPayload) {
        changedPixelCount += 1
        transparentRgbCleanupPixelCount += 1
      }
      continue
    }

    if (alphaByte === 255) {
      opaquePixelCount += 1
      output[byteIndex] = input.rgbaBytes[byteIndex]!
      output[byteIndex + 1] = input.rgbaBytes[byteIndex + 1]!
      output[byteIndex + 2] = input.rgbaBytes[byteIndex + 2]!
      continue
    }

    semitransparentPixelCount += 1
    if (alphaByte <= LOW_ALPHA_MAXIMUM) lowAlphaPixelCount += 1
    const alpha = alphaByte / 255
    let pixelChanged = false
    for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
      const source = input.rgbaBytes[byteIndex + channelIndex]!
      const matte = input.knownSourceMatteRgb[channelIndex]
      const recovered = (source - matte * (1 - alpha)) / alpha
      const clamped = clampByte(recovered)
      if (recovered < 0 || recovered > 255) clampedChannelCount += 1
      output[byteIndex + channelIndex] = clamped
      const delta = Math.abs(source - clamped)
      semitransparentRgbChannelDelta += delta
      maximumRgbChannelDelta = Math.max(maximumRgbChannelDelta, delta)
      if (delta > 0) pixelChanged = true
    }
    if (pixelChanged) changedPixelCount += 1
  }

  const metrics: LivingFrameAlphaEdgeDecontaminationMetrics = {
    pixelCount,
    transparentPixelCount,
    semitransparentPixelCount,
    opaquePixelCount,
    lowAlphaPixelCount,
    changedPixelCount,
    transparentRgbCleanupPixelCount,
    clampedChannelCount,
    semitransparentPixelRatio: rounded(
      semitransparentPixelCount / pixelCount,
    ),
    changedPixelRatio: rounded(changedPixelCount / pixelCount),
    clampedSemitransparentChannelRatio: rounded(
      clampedChannelCount / Math.max(1, semitransparentPixelCount * 3),
    ),
    maximumRgbChannelDelta,
    meanSemitransparentRgbChannelDelta: rounded(
      semitransparentRgbChannelDelta
        / Math.max(1, semitransparentPixelCount * 3),
    ),
  }
  const findingCodes = deriveFindingCodes(metrics)
  const draft: LivingFrameAlphaEdgeDecontaminationReportDraft = {
    contractVersion: LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_VERSION,
    processingProfile: LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_PROFILE,
    resultClass: LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_RESULT_CLASS,
    sourceArtifact: {
      artifactId: input.artifactId,
      artifactDigestSha256: input.artifactDigestSha256,
      measuredInputRgbaDigestSha256: sha256Bytes(input.rgbaBytes),
    },
    outputArtifact: {
      measuredOutputRgbaDigestSha256: sha256Bytes(output),
      width: input.width,
      height: input.height,
      inputAlphaMode: LIVING_FRAME_ALPHA_EDGE_INPUT_MODE,
      outputAlphaMode: LIVING_FRAME_ALPHA_EDGE_OUTPUT_MODE,
      knownSourceMatteRgb: [...input.knownSourceMatteRgb],
    },
    metrics,
    findingCodes,
    authorityBoundary: AUTHORITY_BOUNDARY,
    reportContainsRawPixels: false,
    reportContainsPathOrUrl: false,
    reportContainsCredentials: false,
  }

  return {
    outputRgbaBytes: output,
    report: {
      ...draft,
      reportDigestSha256: sha256(canonicalJsonStringify(draft)),
    },
  }
}

export function verifyLivingFrameAlphaEdgeDecontaminationReportDigest(
  value: unknown,
): value is LivingFrameAlphaEdgeDecontaminationReport {
  if (!isReportShape(value)) return false
  const { reportDigestSha256, ...draft } = value
  return reportDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function assertInput(
  input: LivingFrameServerAlphaEdgeDecontaminationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'artifactId',
      'artifactDigestSha256',
      'width',
      'height',
      'rgbaBytes',
      'inputAlphaMode',
      'knownSourceMatteRgb',
    ])
  ) {
    throw new Error(
      'Living Frame alpha edge decontamination input shape is invalid.',
    )
  }
  if (
    typeof input.artifactId !== 'string'
    || !SAFE_ID.test(input.artifactId)
    || typeof input.artifactDigestSha256 !== 'string'
    || !SHA256.test(input.artifactDigestSha256)
  ) {
    throw new Error(
      'Living Frame alpha edge decontamination artifact identity is invalid.',
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
      'Living Frame alpha edge decontamination dimensions are invalid.',
    )
  }
  if (
    !(input.rgbaBytes instanceof Uint8Array)
    || input.rgbaBytes.length !== input.width * input.height * 4
    || isSharedBuffer(input.rgbaBytes.buffer)
  ) {
    throw new Error(
      'Living Frame alpha edge decontamination RGBA bytes are invalid.',
    )
  }
  if (input.inputAlphaMode !== LIVING_FRAME_ALPHA_EDGE_INPUT_MODE) {
    throw new Error(
      'Living Frame alpha edge decontamination input alpha mode is invalid.',
    )
  }
  if (
    !Array.isArray(input.knownSourceMatteRgb)
    || input.knownSourceMatteRgb.length !== 3
    || !input.knownSourceMatteRgb.every((channel) =>
      Number.isInteger(channel) && channel >= 0 && channel <= 255)
  ) {
    throw new Error(
      'Living Frame alpha edge decontamination source matte is invalid.',
    )
  }
}

function deriveFindingCodes(
  metrics: LivingFrameAlphaEdgeDecontaminationMetrics,
): LivingFrameAlphaEdgeDecontaminationFindingCode[] {
  const findings =
    new Set<LivingFrameAlphaEdgeDecontaminationFindingCode>()
  if (metrics.semitransparentPixelCount === 0) {
    findings.add('no_semitransparent_edge_pixels')
  }
  if (metrics.lowAlphaPixelCount > 0) {
    findings.add('low_alpha_recovery_present')
  }
  if (metrics.transparentRgbCleanupPixelCount > 0) {
    findings.add('transparent_rgb_cleanup_applied')
  }
  if (metrics.clampedChannelCount > 0) {
    findings.add('channel_clamping_observed')
  }
  if (
    metrics.clampedSemitransparentChannelRatio
      >= EXCESSIVE_CLAMP_RATIO
  ) {
    findings.add('excessive_channel_clamping_observed')
  }
  return [...findings].sort()
}

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
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
    'Living Frame alpha edge decontamination report is not canonical JSON.',
  )
}

function isReportShape(
  value: unknown,
): value is LivingFrameAlphaEdgeDecontaminationReport {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'processingProfile',
      'resultClass',
      'sourceArtifact',
      'outputArtifact',
      'metrics',
      'findingCodes',
      'authorityBoundary',
      'reportContainsRawPixels',
      'reportContainsPathOrUrl',
      'reportContainsCredentials',
      'reportDigestSha256',
    ])
  ) return false
  if (
    value.contractVersion !== LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_VERSION
    || value.processingProfile
      !== LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_PROFILE
    || value.resultClass
      !== LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_RESULT_CLASS
    || value.reportContainsRawPixels !== false
    || value.reportContainsPathOrUrl !== false
    || value.reportContainsCredentials !== false
    || typeof value.reportDigestSha256 !== 'string'
    || !SHA256.test(value.reportDigestSha256)
  ) return false
  if (!isSourceArtifact(value.sourceArtifact)) return false
  if (!isOutputArtifact(value.outputArtifact)) return false
  if (!isMetrics(value.metrics)) return false
  if (
    value.metrics.pixelCount
      !== value.outputArtifact.width * value.outputArtifact.height
  ) return false
  if (
    !Array.isArray(value.findingCodes)
    || !value.findingCodes.every((code) =>
      includesString(
        LIVING_FRAME_ALPHA_EDGE_DECONTAMINATION_FINDING_CODES,
        code,
      ))
  ) return false
  const findingCodes =
    value.findingCodes as LivingFrameAlphaEdgeDecontaminationFindingCode[]
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

function isSourceArtifact(
  value: unknown,
): value is LivingFrameAlphaEdgeDecontaminationReport['sourceArtifact'] {
  return isRecord(value)
    && hasExactKeys(value, [
      'artifactId',
      'artifactDigestSha256',
      'measuredInputRgbaDigestSha256',
    ])
    && typeof value.artifactId === 'string'
    && SAFE_ID.test(value.artifactId)
    && typeof value.artifactDigestSha256 === 'string'
    && SHA256.test(value.artifactDigestSha256)
    && typeof value.measuredInputRgbaDigestSha256 === 'string'
    && SHA256.test(value.measuredInputRgbaDigestSha256)
}

function isOutputArtifact(
  value: unknown,
): value is LivingFrameAlphaEdgeDecontaminationReport['outputArtifact'] {
  return isRecord(value)
    && hasExactKeys(value, [
      'measuredOutputRgbaDigestSha256',
      'width',
      'height',
      'inputAlphaMode',
      'outputAlphaMode',
      'knownSourceMatteRgb',
    ])
    && typeof value.measuredOutputRgbaDigestSha256 === 'string'
    && SHA256.test(value.measuredOutputRgbaDigestSha256)
    && isIntegerBetween(value.width, 1, MAX_DIMENSION)
    && isIntegerBetween(value.height, 1, MAX_DIMENSION)
    && value.width * value.height <= MAX_PIXEL_COUNT
    && value.inputAlphaMode === LIVING_FRAME_ALPHA_EDGE_INPUT_MODE
    && value.outputAlphaMode === LIVING_FRAME_ALPHA_EDGE_OUTPUT_MODE
    && isRgbTuple(value.knownSourceMatteRgb)
}

function isMetrics(
  value: unknown,
): value is LivingFrameAlphaEdgeDecontaminationMetrics {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'pixelCount',
      'transparentPixelCount',
      'semitransparentPixelCount',
      'opaquePixelCount',
      'lowAlphaPixelCount',
      'changedPixelCount',
      'transparentRgbCleanupPixelCount',
      'clampedChannelCount',
      'semitransparentPixelRatio',
      'changedPixelRatio',
      'clampedSemitransparentChannelRatio',
      'maximumRgbChannelDelta',
      'meanSemitransparentRgbChannelDelta',
    ])
  ) return false
  if (
    !isIntegerBetween(value.pixelCount, 1, MAX_PIXEL_COUNT)
    || !isIntegerBetween(value.transparentPixelCount, 0, value.pixelCount)
    || !isIntegerBetween(value.semitransparentPixelCount, 0, value.pixelCount)
    || !isIntegerBetween(value.opaquePixelCount, 0, value.pixelCount)
    || value.transparentPixelCount
      + value.semitransparentPixelCount
      + value.opaquePixelCount !== value.pixelCount
    || !isIntegerBetween(
      value.lowAlphaPixelCount,
      0,
      value.semitransparentPixelCount,
    )
    || !isIntegerBetween(value.changedPixelCount, 0, value.pixelCount)
    || !isIntegerBetween(
      value.transparentRgbCleanupPixelCount,
      0,
      value.transparentPixelCount,
    )
    || !isIntegerBetween(
      value.clampedChannelCount,
      0,
      value.semitransparentPixelCount * 3,
    )
    || !isRatio(value.semitransparentPixelRatio)
    || !isRatio(value.changedPixelRatio)
    || !isRatio(value.clampedSemitransparentChannelRatio)
    || !isIntegerBetween(value.maximumRgbChannelDelta, 0, 255)
    || typeof value.meanSemitransparentRgbChannelDelta !== 'number'
    || !Number.isFinite(value.meanSemitransparentRgbChannelDelta)
    || value.meanSemitransparentRgbChannelDelta < 0
    || value.meanSemitransparentRgbChannelDelta > 255
  ) return false
  return value.semitransparentPixelRatio === rounded(
    value.semitransparentPixelCount / value.pixelCount,
  )
    && value.changedPixelRatio === rounded(
      value.changedPixelCount / value.pixelCount,
    )
    && value.clampedSemitransparentChannelRatio === rounded(
      value.clampedChannelCount
        / Math.max(1, value.semitransparentPixelCount * 3),
    )
}

function isAuthorityBoundary(value: unknown): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'deterministicProcessingPrimitiveOnly',
      'artifactQaAuthority',
      'planningAuthority',
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
      'assetManifestAuthority',
      'renderAuthority',
      'runtimePromotionAuthority',
      'productionAuthority',
    ])
  ) return false
  return value.deterministicProcessingPrimitiveOnly === true
    && Object.entries(value)
      .filter(([key]) => key !== 'deterministicProcessingPrimitiveOnly')
      .every(([, authority]) => authority === false)
}

function isRgbTuple(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((channel) => isIntegerBetween(channel, 0, 255))
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
