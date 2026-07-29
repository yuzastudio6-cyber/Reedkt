import { createHash } from 'node:crypto'

import type {
  LivingFrameControlImagePoseAuthorityBoundary,
  LivingFrameControlImagePoseMetrics,
  LivingFrameControlImagePoseReport,
  LivingFrameControlImagePoseReportDraft,
  LivingFramePoseKeypoint,
  LivingFramePosePerson,
} from '../../src/types/living-frame-control-image-pose'
import {
  LIVING_FRAME_CONTROL_IMAGE_POSE_CLASS,
  LIVING_FRAME_CONTROL_IMAGE_POSE_PROFILE,
  LIVING_FRAME_CONTROL_IMAGE_POSE_VERSION,
  LIVING_FRAME_POSE_KEYPOINTS,
} from '../../src/types/living-frame-control-image-pose'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SHA256 = /^[a-f0-9]{64}$/
const MAX_DIMENSION = 4096
const MAX_PIXEL_COUNT = 4_194_304
const MAX_PERSON_COUNT = 8

type Rgb = readonly [number, number, number]

const LIMBS: readonly {
  readonly from: LivingFramePoseKeypoint
  readonly to: LivingFramePoseKeypoint
  readonly color: Rgb
}[] = Object.freeze([
  { from: 'nose', to: 'left_eye', color: [255, 0, 0] },
  { from: 'nose', to: 'right_eye', color: [255, 85, 0] },
  { from: 'left_eye', to: 'left_ear', color: [255, 170, 0] },
  { from: 'right_eye', to: 'right_ear', color: [255, 255, 0] },
  {
    from: 'left_shoulder',
    to: 'right_shoulder',
    color: [170, 255, 0],
  },
  {
    from: 'left_shoulder',
    to: 'left_elbow',
    color: [85, 255, 0],
  },
  {
    from: 'left_elbow',
    to: 'left_wrist',
    color: [0, 255, 0],
  },
  {
    from: 'right_shoulder',
    to: 'right_elbow',
    color: [0, 255, 85],
  },
  {
    from: 'right_elbow',
    to: 'right_wrist',
    color: [0, 255, 170],
  },
  {
    from: 'left_shoulder',
    to: 'left_hip',
    color: [0, 255, 255],
  },
  {
    from: 'right_shoulder',
    to: 'right_hip',
    color: [0, 170, 255],
  },
  { from: 'left_hip', to: 'right_hip', color: [0, 85, 255] },
  { from: 'left_hip', to: 'left_knee', color: [0, 0, 255] },
  { from: 'left_knee', to: 'left_ankle', color: [85, 0, 255] },
  {
    from: 'right_hip',
    to: 'right_knee',
    color: [170, 0, 255],
  },
  {
    from: 'right_knee',
    to: 'right_ankle',
    color: [255, 0, 255],
  },
])

const JOINT_COLORS: readonly Rgb[] = Object.freeze([
  [255, 0, 0],
  [255, 85, 0],
  [255, 170, 0],
  [255, 255, 0],
  [170, 255, 0],
  [85, 255, 0],
  [0, 255, 0],
  [0, 255, 85],
  [0, 255, 170],
  [0, 255, 255],
  [0, 170, 255],
  [0, 85, 255],
  [0, 0, 255],
  [85, 0, 255],
  [170, 0, 255],
  [255, 0, 255],
  [255, 0, 170],
])

const AUTHORITY_BOUNDARY:
  LivingFrameControlImagePoseAuthorityBoundary =
  Object.freeze({
    deterministicReferencePixelProcessingOnly: true,
    poseDetectionAuthority: false,
    poseEvidenceAuthority: false,
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

export interface CreateLivingFrameControlImagePoseInput {
  readonly sourceArtifactId: string
  readonly sourceArtifactDigestSha256: string
  readonly poseLandmarkPacketId: string
  readonly poseLandmarkPacketDigestSha256: string
  readonly width: number
  readonly height: number
  readonly minimumConfidence: number
  readonly persons: readonly LivingFramePosePerson[]
}

export interface CreateLivingFrameControlImagePoseResult {
  readonly outputRgbaBytes: Uint8Array
  readonly report: LivingFrameControlImagePoseReport
}

export function measureLivingFramePoseLandmarkPacketDigest(
  input: Pick<
    CreateLivingFrameControlImagePoseInput,
    'width' | 'height' | 'persons'
  >,
): string {
  assertDimensions(input.width, input.height)
  assertPersons(input.persons)
  return sha256(canonicalJson({
    width: input.width,
    height: input.height,
    persons: input.persons,
  }))
}

export function createLivingFrameControlImagePose(
  input: CreateLivingFrameControlImagePoseInput,
): CreateLivingFrameControlImagePoseResult {
  assertInput(input)
  const lineWidthPixels = clamp(
    Math.round(Math.min(input.width, input.height) * 0.0125),
    2,
    32,
  )
  const jointRadiusPixels = clamp(
    Math.round(lineWidthPixels * 0.75),
    2,
    24,
  )
  const output = new Uint8Array(input.width * input.height * 4)
  for (let offset = 3; offset < output.length; offset += 4) {
    output[offset] = 255
  }
  let visibleKeypointCount = 0
  let renderedLimbCount = 0

  for (const person of input.persons) {
    const points = new Map(
      person.keypoints.map((point) => [point.keypoint, point]),
    )
    visibleKeypointCount += person.keypoints.filter((point) =>
      point.confidence >= input.minimumConfidence).length
    for (const limb of LIMBS) {
      const from = points.get(limb.from)!
      const to = points.get(limb.to)!
      if (
        from.confidence < input.minimumConfidence
        || to.confidence < input.minimumConfidence
      ) continue
      drawLine(
        output,
        input.width,
        input.height,
        pointToPixel(from, input.width, input.height),
        pointToPixel(to, input.width, input.height),
        limb.color,
        lineWidthPixels,
      )
      renderedLimbCount += 1
    }
    person.keypoints.forEach((point, index) => {
      if (point.confidence < input.minimumConfidence) return
      const pixel = pointToPixel(point, input.width, input.height)
      drawDisc(
        output,
        input.width,
        input.height,
        pixel.x,
        pixel.y,
        jointRadiusPixels,
        JOINT_COLORS[index]!,
      )
    })
  }
  if (visibleKeypointCount < 5 || renderedLimbCount < 1) {
    throw invalid('pose packet has insufficient visible structure.')
  }
  let nonBackgroundPixelCount = 0
  for (let offset = 0; offset < output.length; offset += 4) {
    if (
      output[offset] !== 0
      || output[offset + 1] !== 0
      || output[offset + 2] !== 0
    ) nonBackgroundPixelCount += 1
  }
  const metrics: LivingFrameControlImagePoseMetrics = {
    pixelCount: input.width * input.height,
    personCount: input.persons.length,
    keypointCount:
      input.persons.length * LIVING_FRAME_POSE_KEYPOINTS.length,
    visibleKeypointCount,
    renderedLimbCount,
    nonBackgroundPixelCount,
    nonBackgroundCoverageRatio: rounded(
      nonBackgroundPixelCount / (input.width * input.height),
    ),
  }
  const draft: LivingFrameControlImagePoseReportDraft = {
    contractVersion: LIVING_FRAME_CONTROL_IMAGE_POSE_VERSION,
    resultClass: LIVING_FRAME_CONTROL_IMAGE_POSE_CLASS,
    algorithmProfile: LIVING_FRAME_CONTROL_IMAGE_POSE_PROFILE,
    sourceArtifact: {
      artifactId: input.sourceArtifactId,
      artifactDigestSha256: input.sourceArtifactDigestSha256,
    },
    poseLandmarkPacket: {
      packetId: input.poseLandmarkPacketId,
      measuredPacketDigestSha256:
        input.poseLandmarkPacketDigestSha256,
      coordinateSystem: 'normalized_output_frame_xy',
      keypointSchema: 'coco17',
    },
    outputRaster: {
      width: input.width,
      height: input.height,
      pixelFormat: 'rgba8',
      alphaMode: 'opaque',
      measuredOutputRgbaDigestSha256: sha256(output),
    },
    processingContract: {
      minimumConfidence: input.minimumConfidence,
      coordinateQuantization:
        'round_normalized_to_nearest_output_pixel',
      lineRasterization: 'integer_bresenham_with_disc_brush',
      lineWidthPixels,
      jointRadiusPixels,
      backgroundRgba: [0, 0, 0, 255],
      colorPaletteProfile: 'openpose_style_fixed_rgb_v1',
      limbTopology: 'coco17_fixed_topology_v1',
    },
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    outputPixelsReturnedOutOfBand: true,
    inputLandmarkCoordinatesRetained: false,
    reportContainsRawLandmarksOrPixels: false,
    reportContainsPathOrUrl: false,
    reportContainsCredentialsOrRawInstructions: false,
    poseControlImageArtifactCreated: false,
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

export function verifyLivingFrameControlImagePoseReport(
  value: unknown,
  input: CreateLivingFrameControlImagePoseInput,
  outputRgbaBytes: Uint8Array,
): value is LivingFrameControlImagePoseReport {
  try {
    if (
      !isRecord(value)
      || !hasExactKeys(value, [
        'contractVersion',
        'resultClass',
        'algorithmProfile',
        'sourceArtifact',
        'poseLandmarkPacket',
        'outputRaster',
        'processingContract',
        'metrics',
        'authorityBoundary',
        'outputPixelsReturnedOutOfBand',
        'inputLandmarkCoordinatesRetained',
        'reportContainsRawLandmarksOrPixels',
        'reportContainsPathOrUrl',
        'reportContainsCredentialsOrRawInstructions',
        'poseControlImageArtifactCreated',
        'passesCanonicalQa',
        'subjectSpecificRouting',
        'productionReady',
        'reportDigestSha256',
      ])
      || !(outputRgbaBytes instanceof Uint8Array)
    ) return false
    const expected = createLivingFrameControlImagePose(input)
    return equalBytes(expected.outputRgbaBytes, outputRgbaBytes)
      && canonicalJson(expected.report) === canonicalJson(value)
  } catch {
    return false
  }
}

function assertInput(
  input: CreateLivingFrameControlImagePoseInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'sourceArtifactId',
      'sourceArtifactDigestSha256',
      'poseLandmarkPacketId',
      'poseLandmarkPacketDigestSha256',
      'width',
      'height',
      'minimumConfidence',
      'persons',
    ])
    || !SAFE_ID.test(input.sourceArtifactId)
    || !SHA256.test(input.sourceArtifactDigestSha256)
    || !SAFE_ID.test(input.poseLandmarkPacketId)
    || !SHA256.test(input.poseLandmarkPacketDigestSha256)
  ) throw invalid('input shape or source lineage is invalid.')
  assertDimensions(input.width, input.height)
  assertPersons(input.persons)
  if (
    !Number.isFinite(input.minimumConfidence)
    || input.minimumConfidence < 0.1
    || input.minimumConfidence > 1
  ) throw invalid('minimum confidence is outside bounds.')
  const measured = measureLivingFramePoseLandmarkPacketDigest(input)
  if (input.poseLandmarkPacketDigestSha256 !== measured) {
    throw invalid('pose landmark packet digest is stale.')
  }
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

function assertPersons(
  persons: readonly LivingFramePosePerson[],
): void {
  if (
    !Array.isArray(persons)
    || persons.length < 1
    || persons.length > MAX_PERSON_COUNT
  ) throw invalid('person count is outside bounds.')
  const ids = new Set<string>()
  persons.forEach((person, order) => {
    const personId = person.personId
    if (
      !isRecord(person)
      || !hasExactKeys(person, ['personId', 'order', 'keypoints'])
      || typeof personId !== 'string'
      || !SAFE_ID.test(personId)
      || ids.has(personId)
      || person.order !== order
      || !Array.isArray(person.keypoints)
      || person.keypoints.length !== LIVING_FRAME_POSE_KEYPOINTS.length
    ) throw invalid('pose person identity or ordering is invalid.')
    ids.add(personId)
    person.keypoints.forEach((point, pointOrder) => {
      if (
        !isRecord(point)
        || !hasExactKeys(point, [
          'keypoint',
          'xNormalized',
          'yNormalized',
          'confidence',
        ])
        || point.keypoint !== LIVING_FRAME_POSE_KEYPOINTS[pointOrder]
        || !unit(point.xNormalized)
        || !unit(point.yNormalized)
        || !unit(point.confidence)
      ) throw invalid('pose keypoint value or ordering is invalid.')
    })
  })
}

function pointToPixel(
  point: {
    readonly xNormalized: number
    readonly yNormalized: number
  },
  width: number,
  height: number,
): { readonly x: number; readonly y: number } {
  return {
    x: Math.round(point.xNormalized * (width - 1)),
    y: Math.round(point.yNormalized * (height - 1)),
  }
}

function drawLine(
  output: Uint8Array,
  width: number,
  height: number,
  from: { readonly x: number; readonly y: number },
  to: { readonly x: number; readonly y: number },
  color: Rgb,
  lineWidth: number,
): void {
  let x = from.x
  let y = from.y
  const deltaX = Math.abs(to.x - from.x)
  const stepX = from.x < to.x ? 1 : -1
  const deltaY = -Math.abs(to.y - from.y)
  const stepY = from.y < to.y ? 1 : -1
  let error = deltaX + deltaY
  const radius = Math.max(1, Math.floor(lineWidth / 2))
  while (true) {
    drawDisc(output, width, height, x, y, radius, color)
    if (x === to.x && y === to.y) break
    const twiceError = 2 * error
    if (twiceError >= deltaY) {
      error += deltaY
      x += stepX
    }
    if (twiceError <= deltaX) {
      error += deltaX
      y += stepY
    }
  }
}

function drawDisc(
  output: Uint8Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  color: Rgb,
): void {
  const radiusSquared = radius * radius
  for (let y = centerY - radius; y <= centerY + radius; y += 1) {
    if (y < 0 || y >= height) continue
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      if (
        x < 0
        || x >= width
        || (x - centerX) ** 2 + (y - centerY) ** 2
          > radiusSquared
      ) continue
      const offset = (y * width + x) * 4
      output[offset] = color[0]
      output[offset + 1] = color[1]
      output[offset + 2] = color[2]
      output[offset + 3] = 255
    }
  }
}

function rounded(value: number): number {
  return Number(value.toFixed(8))
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function unit(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= 1
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  throw invalid('input or report contains a non-JSON value.')
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return canonicalJson(Object.keys(value).sort())
    === canonicalJson([...keys].sort())
}

function invalid(detail: string): Error {
  return new Error(
    `Living Frame pose control image rejected: ${detail}`,
  )
}
