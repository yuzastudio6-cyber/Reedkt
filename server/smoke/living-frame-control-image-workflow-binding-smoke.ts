import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFramePoseKeypoint,
  LivingFramePosePerson,
} from '../../src/types/living-frame-control-image-pose'
import {
  LIVING_FRAME_POSE_KEYPOINTS,
} from '../../src/types/living-frame-control-image-pose'
import {
  createLivingFrameControlImageCanny,
} from '../living-frame/living-frame-control-image-canny'
import {
  createLivingFrameControlImageDepth,
  measureLivingFrameDepthSamplePacketDigest,
} from '../living-frame/living-frame-control-image-depth'
import {
  createLivingFrameControlImagePose,
  measureLivingFramePoseLandmarkPacketDigest,
} from '../living-frame/living-frame-control-image-pose'
import {
  createLivingFrameControlImageWorkflowBinding,
  validateLivingFrameControlImageWorkflowBinding,
} from '../living-frame/living-frame-control-image-workflow-binding'
import {
  compileLivingFrameControlledComfyUiWorkflowExpectation,
} from '../living-frame/living-frame-controlled-illustration-comfyui-workflow'

const width = 256
const height = 256
const pixels = new Uint8Array(width * height * 4)
for (let y = 64; y < 192; y += 1) {
  for (let x = 64; x < 192; x += 1) {
    const offset = (y * width + x) * 4
    pixels[offset] = 240
    pixels[offset + 1] = 180
    pixels[offset + 2] = 80
    pixels[offset + 3] = 255
  }
}

const sourceDigest = sha256(pixels)
const { report: cannyReport } = createLivingFrameControlImageCanny({
  sourceArtifactId: 'artifact.source.reference.v1',
  sourceArtifactDigestSha256: sourceDigest,
  width,
  height,
  sourceRgbaBytes: pixels,
  lowThreshold: 24,
  highThreshold: 72,
})
const cannyWorkflow = controlNetWorkflow(
  'workflow.controlnet.canny.reference.v1',
  cannyReport.outputRaster.measuredOutputRgbaDigestSha256,
  width,
  height,
)
const cannyBinding = createLivingFrameControlImageWorkflowBinding({
  bindingId: 'binding.control-image.canny.workflow.v2',
  controlImageKind: 'canny',
  cannyReport,
  workflowExpectation: cannyWorkflow,
})
assert.equal(
  validateLivingFrameControlImageWorkflowBinding(cannyBinding).ok,
  true,
)
assert.equal(
  cannyBinding.sourceBindings.controlImage.controlImageKind,
  'canny',
)
assert.equal(
  cannyBinding.sourceBindings.measuredControlImageRgbaDigestSha256,
  cannyReport.outputRaster.measuredOutputRgbaDigestSha256,
)
assert.equal(
  cannyBinding.frameExpectation.controlImageAndWorkflowFramesMatch,
  true,
)

const depthSamples = new Uint16Array(width * height)
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    depthSamples[y * width + x] =
      Math.round((x / (width - 1)) * 65_535)
  }
}
const depthVerificationInput = {
  sourceArtifactId: 'artifact.depth-source.reference.v1',
  sourceArtifactDigestSha256: sha256('depth-source-reference'),
  depthSamplePacketId: 'depth-packet.reference.v1',
  depthSamplePacketDigestSha256:
    measureLivingFrameDepthSamplePacketDigest({
      width,
      height,
      depthSamples,
    }),
  width,
  height,
  depthSamples,
}
const depth = createLivingFrameControlImageDepth(
  depthVerificationInput,
)
const depthWorkflow = controlNetWorkflow(
  'workflow.controlnet.depth.reference.v1',
  depth.report.outputRaster.measuredOutputRgbaDigestSha256,
  width,
  height,
)
const depthBinding = createLivingFrameControlImageWorkflowBinding({
  bindingId: 'binding.control-image.depth.workflow.v3',
  controlImageKind: 'depth',
  depthReport: depth.report,
  depthVerificationInput,
  depthOutputRgbaBytes: depth.outputRgbaBytes,
  workflowExpectation: depthWorkflow,
})
assert.equal(
  validateLivingFrameControlImageWorkflowBinding(depthBinding).ok,
  true,
)
assert.equal(
  depthBinding.sourceBindings.controlImage.controlImageKind,
  'depth',
)
assert.equal(
  depthBinding.sourceBindings.measuredControlImageRgbaDigestSha256,
  depth.report.outputRaster.measuredOutputRgbaDigestSha256,
)
assert.equal(
  depthBinding.authorityBoundary.depthEstimationAuthority,
  false,
)
assert.equal(depthBinding.rawPixelsPresent, false)

const persons = [genericStandingPerson()]
const poseVerificationInput = {
  sourceArtifactId: 'artifact.pose-source.reference.v1',
  sourceArtifactDigestSha256: sha256('pose-source-reference'),
  poseLandmarkPacketId: 'pose-landmarks.reference.v1',
  poseLandmarkPacketDigestSha256:
    measureLivingFramePoseLandmarkPacketDigest({
      width,
      height,
      persons,
    }),
  width,
  height,
  minimumConfidence: 0.5,
  persons,
}
const pose = createLivingFrameControlImagePose(poseVerificationInput)
const poseWorkflow = controlNetWorkflow(
  'workflow.controlnet.pose.reference.v1',
  pose.report.outputRaster.measuredOutputRgbaDigestSha256,
  width,
  height,
)
const poseBinding = createLivingFrameControlImageWorkflowBinding({
  bindingId: 'binding.control-image.pose.workflow.v2',
  controlImageKind: 'pose',
  poseReport: pose.report,
  poseVerificationInput,
  poseOutputRgbaBytes: pose.outputRgbaBytes,
  workflowExpectation: poseWorkflow,
})
assert.equal(
  validateLivingFrameControlImageWorkflowBinding(poseBinding).ok,
  true,
)
assert.equal(
  poseBinding.sourceBindings.controlImage.controlImageKind,
  'pose',
)
assert.equal(
  poseBinding.sourceBindings.measuredControlImageRgbaDigestSha256,
  pose.report.outputRaster.measuredOutputRgbaDigestSha256,
)
assert.equal(poseBinding.rawLandmarksPresent, false)
assert.equal(poseBinding.rawPixelsPresent, false)
assert.equal(poseBinding.controlImageBinding.artifactResolved, false)
assert.equal(poseBinding.authorityBoundary.poseDetectionAuthority, false)
assert.equal(poseBinding.authorityBoundary.artifactCreationAuthority, false)
assert.equal(poseBinding.authorityBoundary.dispatchAuthority, false)
assert.equal(poseBinding.authorityBoundary.runtimeAuthority, false)
assert.equal(poseBinding.subjectSpecificRouting, false)
assert.equal(poseBinding.productionReady, false)

const negativeBindings: readonly [string, () => unknown][] = [
  ['unknown key', () => ({ ...poseBinding, rawTranscript: 'forbidden' })],
  ['digest tamper', () => ({
    ...poseBinding,
    bindingDigestSha256: '0'.repeat(64),
  })],
  ['runtime promotion', () => ({
    ...poseBinding,
    authorityBoundary: {
      ...poseBinding.authorityBoundary,
      runtimeAuthority: true,
    },
  })],
  ['pose evidence promotion', () => ({
    ...poseBinding,
    authorityBoundary: {
      ...poseBinding.authorityBoundary,
      poseEvidenceAuthority: true,
    },
  })],
  ['artifact promotion', () => ({
    ...poseBinding,
    controlImageBinding: {
      ...poseBinding.controlImageBinding,
      artifactResolved: true,
    },
  })],
  ['raw landmark claim', () => ({
    ...poseBinding,
    rawLandmarksPresent: true,
  })],
  ['subject-specific route', () => ({
    ...poseBinding,
    subjectSpecificRouting: true,
  })],
  ['gate omission', () => ({
    ...poseBinding,
    openGateCodes: poseBinding.openGateCodes.slice(1),
  })],
  ['frame claim', () => ({
    ...poseBinding,
    frameExpectation: {
      ...poseBinding.frameExpectation,
      widthPixels: width + 1,
    },
  })],
  ['unknown control kind', () => ({
    ...poseBinding,
    sourceBindings: {
      ...poseBinding.sourceBindings,
      controlImage: {
        ...poseBinding.sourceBindings.controlImage,
        controlImageKind: 'depth',
      },
    },
  })],
]
for (const [label, createValue] of negativeBindings) {
  assert.equal(
    validateLivingFrameControlImageWorkflowBinding(createValue()).ok,
    false,
    label,
  )
}

const baseWorkflow =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    workflowExpectationId: 'workflow.base.reference.v1',
    profile: 'base_txt2img',
    controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
    controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
    outputFrameExpectationDigestSha256: '3'.repeat(64),
    widthPixels: width,
    heightPixels: height,
    baseCheckpointBindingDigestSha256: '4'.repeat(64),
    positiveConditioningBindingDigestSha256: '5'.repeat(64),
    negativeConditioningBindingDigestSha256: '6'.repeat(64),
  })
assert.throws(
  () => createLivingFrameControlImageWorkflowBinding({
    bindingId: 'binding.base.rejected.v2',
    controlImageKind: 'pose',
    poseReport: pose.report,
    poseVerificationInput,
    poseOutputRgbaBytes: pose.outputRgbaBytes,
    workflowExpectation: baseWorkflow,
  }),
  /control-image workflow binding failed/,
)

const wrongFrameWorkflow = controlNetWorkflow(
  'workflow.wrong-frame.reference.v2',
  pose.report.outputRaster.measuredOutputRgbaDigestSha256,
  width + 64,
  height,
)
assert.throws(
  () => createLivingFrameControlImageWorkflowBinding({
    bindingId: 'binding.wrong-frame.rejected.v2',
    controlImageKind: 'pose',
    poseReport: pose.report,
    poseVerificationInput,
    poseOutputRgbaBytes: pose.outputRgbaBytes,
    workflowExpectation: wrongFrameWorkflow,
  }),
  /control-image workflow binding failed/,
)

const wrongDigestWorkflow = controlNetWorkflow(
  'workflow.wrong-digest.reference.v2',
  '8'.repeat(64),
  width,
  height,
)
assert.throws(
  () => createLivingFrameControlImageWorkflowBinding({
    bindingId: 'binding.wrong-digest.rejected.v2',
    controlImageKind: 'pose',
    poseReport: pose.report,
    poseVerificationInput,
    poseOutputRgbaBytes: pose.outputRgbaBytes,
    workflowExpectation: wrongDigestWorkflow,
  }),
  /control-image workflow binding failed/,
)

const tamperedPosePixels = new Uint8Array(pose.outputRgbaBytes)
tamperedPosePixels[0] = 255
assert.throws(
  () => createLivingFrameControlImageWorkflowBinding({
    bindingId: 'binding.tampered-pose.rejected.v2',
    controlImageKind: 'pose',
    poseReport: pose.report,
    poseVerificationInput,
    poseOutputRgbaBytes: tamperedPosePixels,
    workflowExpectation: poseWorkflow,
  }),
  /control-image workflow binding failed/,
)
const tamperedDepthPixels = new Uint8Array(depth.outputRgbaBytes)
tamperedDepthPixels[0] = 255
assert.throws(
  () => createLivingFrameControlImageWorkflowBinding({
    bindingId: 'binding.tampered-depth.rejected.v3',
    controlImageKind: 'depth',
    depthReport: depth.report,
    depthVerificationInput,
    depthOutputRgbaBytes: tamperedDepthPixels,
    workflowExpectation: depthWorkflow,
  }),
  /control-image workflow binding failed/,
)
assert.throws(
  () => createLivingFrameControlImageWorkflowBinding({
    bindingId: 'binding.cross-kind.rejected.v2',
    controlImageKind: 'pose',
    poseReport: cannyReport,
    poseVerificationInput,
    poseOutputRgbaBytes: pose.outputRgbaBytes,
    workflowExpectation: poseWorkflow,
  }),
  /control-image workflow binding failed/,
)

console.log(JSON.stringify({
  suite: 'living-frame-control-image-workflow-binding',
  cannyControlImageBound: true,
  depthControlImageBound: true,
  poseControlImageBound: true,
  exactFrameAndPixelDigestBound: true,
  poseVerificationContextReRead: true,
  rawLandmarksPresent: poseBinding.rawLandmarksPresent,
  artifactCreated: poseBinding.controlImageBinding.artifactResolved,
  adversarialAssertions: negativeBindings.length + 6,
  subjectSpecificRouting: poseBinding.subjectSpecificRouting,
  poseDetectionAuthorityGranted:
    poseBinding.authorityBoundary.poseDetectionAuthority,
  depthEstimationAuthorityGranted:
    depthBinding.authorityBoundary.depthEstimationAuthority,
  toolRouteAuthorityGranted:
    poseBinding.authorityBoundary.toolRouteAuthority,
  runtimeAuthorityGranted:
    poseBinding.authorityBoundary.runtimeAuthority,
  productionAuthorityGranted:
    poseBinding.authorityBoundary.productionAuthority,
}))

function controlNetWorkflow(
  workflowExpectationId: string,
  controlImageDigest: string,
  widthPixels: number,
  heightPixels: number,
) {
  return compileLivingFrameControlledComfyUiWorkflowExpectation({
    workflowExpectationId,
    profile: 'controlnet_txt2img',
    controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
    controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
    outputFrameExpectationDigestSha256: '3'.repeat(64),
    widthPixels,
    heightPixels,
    baseCheckpointBindingDigestSha256: '4'.repeat(64),
    positiveConditioningBindingDigestSha256: '5'.repeat(64),
    negativeConditioningBindingDigestSha256: '6'.repeat(64),
    controlNet: {
      checkpointBindingDigestSha256: '7'.repeat(64),
      controlImageArtifactBindingDigestSha256: controlImageDigest,
      strength: 0.8,
      startPercent: 0,
      endPercent: 0.85,
    },
  })
}

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

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex')
}
