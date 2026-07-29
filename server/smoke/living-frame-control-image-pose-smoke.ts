import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlImagePoseReport,
  LivingFrameControlImagePoseReportDraft,
  LivingFramePoseKeypoint,
  LivingFramePosePerson,
} from '../../src/types/living-frame-control-image-pose'
import {
  LIVING_FRAME_POSE_KEYPOINTS,
} from '../../src/types/living-frame-control-image-pose'
import {
  createLivingFrameControlImagePose,
  measureLivingFramePoseLandmarkPacketDigest,
  verifyLivingFrameControlImagePoseReport,
} from '../living-frame/living-frame-control-image-pose'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const width = 320
const height = 180
const persons = [genericStandingPerson()]
const packet = { width, height, persons }
const input = {
  sourceArtifactId: 'artifact.generic-pose-source',
  sourceArtifactDigestSha256: sha256AuthorityValue('pose-source'),
  poseLandmarkPacketId: 'pose-landmarks.generic-frame',
  poseLandmarkPacketDigestSha256:
    measureLivingFramePoseLandmarkPacketDigest(packet),
  width,
  height,
  minimumConfidence: 0.5,
  persons,
}
const result = createLivingFrameControlImagePose(input)

assert.equal(
  verifyLivingFrameControlImagePoseReport(
    result.report,
    input,
    result.outputRgbaBytes,
  ),
  true,
)
assert.equal(result.outputRgbaBytes.length, width * height * 4)
assert.equal(result.report.outputRaster.alphaMode, 'opaque')
assert.equal(result.report.metrics.personCount, 1)
assert.equal(
  result.report.metrics.keypointCount,
  LIVING_FRAME_POSE_KEYPOINTS.length,
)
assert.equal(result.report.metrics.visibleKeypointCount, 17)
assert.equal(result.report.metrics.renderedLimbCount, 16)
assert.equal(result.report.metrics.nonBackgroundPixelCount > 0, true)
assert.equal(
  result.report.metrics.nonBackgroundCoverageRatio > 0,
  true,
)
assert.equal(
  result.report.processingContract.lineRasterization,
  'integer_bresenham_with_disc_brush',
)
assert.equal(
  result.report.processingContract.limbTopology,
  'coco17_fixed_topology_v1',
)
assert.equal(
  result.report.poseLandmarkPacket.measuredPacketDigestSha256,
  input.poseLandmarkPacketDigestSha256,
)
assert.equal(
  result.report.outputRaster.measuredOutputRgbaDigestSha256,
  digest(result.outputRgbaBytes),
)
for (let offset = 3; offset < result.outputRgbaBytes.length; offset += 4) {
  assert.equal(result.outputRgbaBytes[offset], 255)
}
const serializedReport = JSON.stringify(result.report)
assert.equal(serializedReport.includes('person.generic'), false)
assert.equal(serializedReport.includes('xNormalized'), false)
assert.equal(serializedReport.includes('yNormalized'), false)
assert.equal(result.report.inputLandmarkCoordinatesRetained, false)
assert.equal(result.report.reportContainsRawLandmarksOrPixels, false)
assertAllAuthorityClosed(result.report)

const replay = createLivingFrameControlImagePose(input)
assert.deepEqual(replay, result)

const secondPerson = shiftedPerson(
  genericStandingPerson(),
  'person.generic-secondary',
  0.18,
)
const twoPersonInput = withPacket({
  ...input,
  persons: [
    genericStandingPerson(),
    { ...secondPerson, order: 1 },
  ],
})
const twoPerson = createLivingFrameControlImagePose(twoPersonInput)
assert.equal(twoPerson.report.metrics.personCount, 2)
assert.equal(twoPerson.report.metrics.renderedLimbCount, 32)
assert.notEqual(
  twoPerson.report.outputRaster.measuredOutputRgbaDigestSha256,
  result.report.outputRaster.measuredOutputRgbaDigestSha256,
)

const lowConfidencePersons = persons.map((person) => ({
  ...person,
  keypoints: person.keypoints.map((point) => ({
    ...point,
    confidence: 0.1,
  })),
}))
const invalidInputs: unknown[] = [
  { ...input, poseLandmarkPacketDigestSha256: digest('stale') },
  { ...input, minimumConfidence: 0 },
  { ...input, minimumConfidence: 1.1 },
  { ...input, width: 8 },
  { ...input, persons: [] },
  {
    ...input,
    persons: [
      genericStandingPerson(),
      genericStandingPerson(),
    ],
  },
  {
    ...input,
    persons: [{
      ...genericStandingPerson(),
      order: 1,
    }],
  },
  {
    ...input,
    persons: [{
      ...genericStandingPerson(),
      keypoints:
        [...genericStandingPerson().keypoints].reverse(),
    }],
  },
  {
    ...input,
    persons: [{
      ...genericStandingPerson(),
      keypoints: genericStandingPerson().keypoints.map(
        (point, order) => order === 0
          ? { ...point, xNormalized: -0.1 }
          : point,
      ),
    }],
  },
  withPacket({
    ...input,
    persons: lowConfidencePersons,
  }),
  { ...input, prompt: 'forbidden' },
  { ...input, filePath: '/tmp/forbidden' },
  { ...input, providerId: 'forbidden' },
]
for (const value of invalidInputs) {
  assert.throws(
    () => createLivingFrameControlImagePose(value as never),
    /Living Frame pose control image rejected:/,
  )
}

const tamperedPixels = new Uint8Array(result.outputRgbaBytes)
tamperedPixels[0] = 255
assert.equal(
  verifyLivingFrameControlImagePoseReport(
    result.report,
    input,
    tamperedPixels,
  ),
  false,
)

const forgedReports: unknown[] = [
  {
    ...result.report,
    reportDigestSha256: digest('forged'),
  },
  sign({
    ...withoutDigest(result.report),
    rawLandmarks: persons,
  }),
  sign({
    ...withoutDigest(result.report),
    outputRaster: {
      ...result.report.outputRaster,
      measuredOutputRgbaDigestSha256: digest('wrong-output'),
    },
  }),
  sign({
    ...withoutDigest(result.report),
    metrics: {
      ...result.report.metrics,
      renderedLimbCount:
        result.report.metrics.renderedLimbCount + 1,
    },
  }),
  sign({
    ...withoutDigest(result.report),
    inputLandmarkCoordinatesRetained: true as never,
    reportContainsRawLandmarksOrPixels: true as never,
  }),
  sign({
    ...withoutDigest(result.report),
    authorityBoundary: Object.fromEntries(
      Object.keys(result.report.authorityBoundary)
        .map((key) => [key, true]),
    ),
    poseControlImageArtifactCreated: true,
    passesCanonicalQa: true,
    subjectSpecificRouting: true,
    productionReady: true,
  }),
]
for (const forged of forgedReports) {
  assert.equal(
    verifyLivingFrameControlImagePoseReport(
      forged,
      input,
      result.outputRgbaBytes,
    ),
    false,
  )
}

console.log(JSON.stringify({
  suite: 'living-frame-control-image-pose',
  deterministicCoco17PoseRasterCreated: true,
  personCount: result.report.metrics.personCount,
  visibleKeypointCount:
    result.report.metrics.visibleKeypointCount,
  renderedLimbCount: result.report.metrics.renderedLimbCount,
  nonBackgroundPixelCount:
    result.report.metrics.nonBackgroundPixelCount,
  landmarkCoordinatesRetained: false,
  modelOrAuxBundleExecuted: false,
  adversarialAssertions: invalidInputs.length + forgedReports.length + 1,
  subjectSpecificRouting: result.report.subjectSpecificRouting,
  poseDetectionAuthorityGranted:
    result.report.authorityBoundary.poseDetectionAuthority,
  toolRouteAuthorityGranted:
    result.report.authorityBoundary.toolRouteAuthority,
  productionAuthorityGranted:
    result.report.authorityBoundary.productionAuthority,
}))

function genericStandingPerson(): LivingFramePosePerson {
  const coordinates: Record<
    LivingFramePoseKeypoint,
    readonly [number, number]
  > = {
    nose: [0.5, 0.12],
    left_eye: [0.48, 0.1],
    right_eye: [0.52, 0.1],
    left_ear: [0.45, 0.12],
    right_ear: [0.55, 0.12],
    left_shoulder: [0.4, 0.28],
    right_shoulder: [0.6, 0.28],
    left_elbow: [0.34, 0.45],
    right_elbow: [0.66, 0.45],
    left_wrist: [0.3, 0.62],
    right_wrist: [0.7, 0.62],
    left_hip: [0.44, 0.57],
    right_hip: [0.56, 0.57],
    left_knee: [0.43, 0.75],
    right_knee: [0.57, 0.75],
    left_ankle: [0.42, 0.94],
    right_ankle: [0.58, 0.94],
  }
  return {
    personId: 'person.generic',
    order: 0,
    keypoints: LIVING_FRAME_POSE_KEYPOINTS.map((keypoint) => ({
      keypoint,
      xNormalized: coordinates[keypoint][0],
      yNormalized: coordinates[keypoint][1],
      confidence: 0.95,
    })),
  }
}

function shiftedPerson(
  person: LivingFramePosePerson,
  personId: string,
  deltaX: number,
): LivingFramePosePerson {
  return {
    ...person,
    personId,
    keypoints: person.keypoints.map((point) => ({
      ...point,
      xNormalized: Math.min(1, point.xNormalized + deltaX),
    })),
  }
}

function withPacket<T extends {
  readonly width: number
  readonly height: number
  readonly persons: readonly LivingFramePosePerson[]
}>(
  value: T,
): T & { readonly poseLandmarkPacketDigestSha256: string } {
  return {
    ...value,
    poseLandmarkPacketDigestSha256:
      measureLivingFramePoseLandmarkPacketDigest(value),
  }
}

function assertAllAuthorityClosed(
  report: LivingFrameControlImagePoseReport,
): void {
  assert.equal(
    report.authorityBoundary.deterministicReferencePixelProcessingOnly,
    true,
  )
  for (const [key, value] of Object.entries(report.authorityBoundary)) {
    if (key === 'deterministicReferencePixelProcessingOnly') continue
    assert.equal(value, false, `${key} must remain false.`)
  }
  assert.equal(report.outputPixelsReturnedOutOfBand, true)
  assert.equal(report.poseControlImageArtifactCreated, false)
  assert.equal(report.passesCanonicalQa, false)
  assert.equal(report.subjectSpecificRouting, false)
  assert.equal(report.productionReady, false)
}

function withoutDigest(
  report: LivingFrameControlImagePoseReport,
): LivingFrameControlImagePoseReportDraft {
  const { reportDigestSha256: _digest, ...draft } = report
  void _digest
  return draft
}

function sign(draft: Record<string, unknown>): unknown {
  return {
    ...draft,
    reportDigestSha256: digest(canonicalJson(draft)),
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
  ) return value
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  )
}
