import { createHash } from 'node:crypto'

import type {
  LivingFrameControlImageDepthAuthorityBoundary,
  LivingFrameControlImageDepthMetrics,
  LivingFrameControlImageDepthReport,
  LivingFrameControlImageDepthReportDraft,
} from '../../src/types/living-frame-control-image-depth'
import {
  LIVING_FRAME_CONTROL_IMAGE_DEPTH_CLASS,
  LIVING_FRAME_CONTROL_IMAGE_DEPTH_PROFILE,
  LIVING_FRAME_CONTROL_IMAGE_DEPTH_VERSION,
} from '../../src/types/living-frame-control-image-depth'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_DIMENSION = 4096
const MAX_PIXEL_COUNT = 4_194_304
const UINT16_MAX = 65_535

const AUTHORITY_BOUNDARY:
  LivingFrameControlImageDepthAuthorityBoundary =
  Object.freeze({
    deterministicReferencePixelProcessingOnly: true,
    depthEstimationAuthority: false,
    depthEvidenceAuthority: false,
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

export interface CreateLivingFrameControlImageDepthInput {
  readonly sourceArtifactId: string
  readonly sourceArtifactDigestSha256: string
  readonly depthSamplePacketId: string
  readonly depthSamplePacketDigestSha256: string
  readonly width: number
  readonly height: number
  readonly depthSamples: Uint16Array
}

export interface CreateLivingFrameControlImageDepthResult {
  readonly outputRgbaBytes: Uint8Array
  readonly report: LivingFrameControlImageDepthReport
}

export function measureLivingFrameDepthSamplePacketDigest(
  input: Pick<
    CreateLivingFrameControlImageDepthInput,
    'width' | 'height' | 'depthSamples'
  >,
): string {
  assertDimensions(input.width, input.height)
  assertDepthSamples(input.depthSamples, input.width, input.height)
  const bytes = new Uint8Array(input.depthSamples.length * 2)
  input.depthSamples.forEach((sample, index) => {
    bytes[index * 2] = sample >>> 8
    bytes[index * 2 + 1] = sample & 0xff
  })
  return createHash('sha256')
    .update(canonicalJson({
      width: input.width,
      height: input.height,
      sampleEncoding: 'uint16_big_endian',
    }))
    .update(bytes)
    .digest('hex')
}

export function createLivingFrameControlImageDepth(
  input: CreateLivingFrameControlImageDepthInput,
): CreateLivingFrameControlImageDepthResult {
  assertInput(input)
  const output = new Uint8Array(input.depthSamples.length * 4)
  let minimumDepthSample = UINT16_MAX
  let maximumDepthSample = 0
  let nonZeroSampleCount = 0
  let fullScaleSampleCount = 0
  let sampleSum = 0
  input.depthSamples.forEach((sample, index) => {
    minimumDepthSample = Math.min(minimumDepthSample, sample)
    maximumDepthSample = Math.max(maximumDepthSample, sample)
    if (sample > 0) nonZeroSampleCount += 1
    if (sample === UINT16_MAX) fullScaleSampleCount += 1
    sampleSum += sample
    const value = Math.round((sample * 255) / UINT16_MAX)
    const offset = index * 4
    output[offset] = value
    output[offset + 1] = value
    output[offset + 2] = value
    output[offset + 3] = 255
  })
  if (minimumDepthSample >= maximumDepthSample) {
    throw invalid('depth packet must contain measurable depth variation.')
  }
  const metrics: LivingFrameControlImageDepthMetrics = {
    pixelCount: input.depthSamples.length,
    minimumDepthSample,
    maximumDepthSample,
    nonZeroSampleCount,
    fullScaleSampleCount,
    meanNormalizedDepth: rounded(
      sampleSum / input.depthSamples.length / UINT16_MAX,
    ),
    dynamicRange: maximumDepthSample - minimumDepthSample,
  }
  const draft: LivingFrameControlImageDepthReportDraft = {
    contractVersion: LIVING_FRAME_CONTROL_IMAGE_DEPTH_VERSION,
    resultClass: LIVING_FRAME_CONTROL_IMAGE_DEPTH_CLASS,
    algorithmProfile: LIVING_FRAME_CONTROL_IMAGE_DEPTH_PROFILE,
    sourceArtifact: {
      artifactId: input.sourceArtifactId,
      artifactDigestSha256: input.sourceArtifactDigestSha256,
    },
    depthSamplePacket: {
      packetId: input.depthSamplePacketId,
      measuredPacketDigestSha256:
        input.depthSamplePacketDigestSha256,
      sampleEncoding: 'uint16_big_endian_digest',
      coordinateSystem: 'output_frame_raster_order',
      polarity: 'larger_value_is_nearer',
    },
    outputRaster: {
      width: input.width,
      height: input.height,
      pixelFormat: 'rgba8',
      alphaMode: 'opaque',
      measuredOutputRgbaDigestSha256: sha256(output),
    },
    processingContract: {
      normalization: 'uint16_full_range_to_uint8_round_nearest',
      nearColor: [255, 255, 255, 255],
      farColor: [0, 0, 0, 255],
      channelMapping: 'equal_rgb',
      alphaValue: 255,
    },
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    outputPixelsReturnedOutOfBand: true,
    inputDepthSamplesRetained: false,
    reportContainsRawDepthOrPixels: false,
    reportContainsPathOrUrl: false,
    reportContainsCredentialsOrRawInstructions: false,
    depthControlImageArtifactCreated: false,
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

export function verifyLivingFrameControlImageDepthReport(
  value: unknown,
  input: CreateLivingFrameControlImageDepthInput,
  outputRgbaBytes: Uint8Array,
): value is LivingFrameControlImageDepthReport {
  try {
    if (
      !isRecord(value)
      || !hasExactKeys(value, [
        'contractVersion',
        'resultClass',
        'algorithmProfile',
        'sourceArtifact',
        'depthSamplePacket',
        'outputRaster',
        'processingContract',
        'metrics',
        'authorityBoundary',
        'outputPixelsReturnedOutOfBand',
        'inputDepthSamplesRetained',
        'reportContainsRawDepthOrPixels',
        'reportContainsPathOrUrl',
        'reportContainsCredentialsOrRawInstructions',
        'depthControlImageArtifactCreated',
        'passesCanonicalQa',
        'subjectSpecificRouting',
        'productionReady',
        'reportDigestSha256',
      ])
      || !(outputRgbaBytes instanceof Uint8Array)
    ) return false
    const expected = createLivingFrameControlImageDepth(input)
    return equalBytes(expected.outputRgbaBytes, outputRgbaBytes)
      && canonicalJson(expected.report) === canonicalJson(value)
  } catch {
    return false
  }
}

function assertInput(
  input: CreateLivingFrameControlImageDepthInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'sourceArtifactId',
      'sourceArtifactDigestSha256',
      'depthSamplePacketId',
      'depthSamplePacketDigestSha256',
      'width',
      'height',
      'depthSamples',
    ])
    || !SAFE_ID.test(input.sourceArtifactId)
    || !SHA256.test(input.sourceArtifactDigestSha256)
    || !SAFE_ID.test(input.depthSamplePacketId)
    || !SHA256.test(input.depthSamplePacketDigestSha256)
  ) throw invalid('input shape or source lineage is invalid.')
  assertDimensions(input.width, input.height)
  assertDepthSamples(input.depthSamples, input.width, input.height)
  if (
    input.depthSamplePacketDigestSha256
      !== measureLivingFrameDepthSamplePacketDigest(input)
  ) throw invalid('depth sample packet digest is stale.')
}

function assertDimensions(width: number, height: number): void {
  if (
    !Number.isInteger(width)
    || width < 16
    || width > MAX_DIMENSION
    || !Number.isInteger(height)
    || height < 16
    || height > MAX_DIMENSION
    || width * height > MAX_PIXEL_COUNT
  ) throw invalid('output dimensions are outside bounds.')
}

function assertDepthSamples(
  value: unknown,
  width: number,
  height: number,
): asserts value is Uint16Array {
  if (
    !(value instanceof Uint16Array)
    || value.length !== width * height
  ) throw invalid('depth samples do not match the output raster.')
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function invalid(message: string): Error {
  return new Error(`Living Frame depth control image rejected: ${message}`)
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
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
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}
