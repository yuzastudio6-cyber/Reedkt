import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledModelFamilyBindingAuthority,
  LivingFrameControlledModelFamilyIssueCode,
} from '../../src/types/living-frame-controlled-model-family-binding'
import {
  createLivingFrameControlImageCanny,
} from '../living-frame/living-frame-control-image-canny'
import {
  createLivingFrameControlImageWorkflowBinding,
} from '../living-frame/living-frame-control-image-workflow-binding'
import {
  createLivingFrameControlledModelFamilyBinding,
  LivingFrameControlledModelFamilyBindingError,
  verifyLivingFrameControlledModelFamilyBinding,
} from '../living-frame/living-frame-controlled-model-family-binding'
import {
  createLivingFrameIpAdapterExtensionEvaluation,
} from '../living-frame/living-frame-controlled-illustration-ipadapter-extension'
import {
  compileLivingFrameControlledComfyUiWorkflowExpectation,
} from '../living-frame/living-frame-controlled-illustration-comfyui-workflow'
import {
  createLivingFrameIpAdapterMergedWorkflow,
} from '../living-frame/living-frame-ipadapter-merged-workflow'
import {
  createLivingFrameIpAdapterWorkflowExtension,
} from '../living-frame/living-frame-ipadapter-workflow-extension'

const width = 256
const height = 256
const qualificationDigest = digest('qualification')
const sourceObservationDigest = digest('source-observation')
const outputFrameDigest = digest('output-frame')
const baseCheckpointDigest = digest('base-checkpoint')
const positiveDigest = digest('positive-conditioning')
const negativeDigest = digest('negative-conditioning')
const controlNetDigest = digest('controlnet-checkpoint')
const loraDigest = digest('lora-adapter')
const ipAdapterDigest = digest('generic-ipadapter')
const clipVisionDigest = digest('clip-vision')
const referenceImageDigest = digest('approved-reference-image')

const pixels = new Uint8Array(width * height * 4)
for (let y = 56; y < 200; y += 1) {
  for (let x = 72; x < 184; x += 1) {
    const offset = (y * width + x) * 4
    pixels[offset] = 220
    pixels[offset + 1] = 170
    pixels[offset + 2] = 90
    pixels[offset + 3] = 255
  }
}
const canny = createLivingFrameControlImageCanny({
  sourceArtifactId: 'artifact.model-family.control-source',
  sourceArtifactDigestSha256: digest(pixels),
  width,
  height,
  sourceRgbaBytes: pixels,
  lowThreshold: 24,
  highThreshold: 72,
}).report

const workflow = compileLivingFrameControlledComfyUiWorkflowExpectation({
  workflowExpectationId: 'workflow.model-family.controlnet-lora',
  profile: 'controlnet_lora_txt2img',
  controlledIllustrationQualificationDigestSha256: qualificationDigest,
  controlledIllustrationSourceObservationDigestSha256:
    sourceObservationDigest,
  outputFrameExpectationDigestSha256: outputFrameDigest,
  widthPixels: width,
  heightPixels: height,
  baseCheckpointBindingDigestSha256: baseCheckpointDigest,
  positiveConditioningBindingDigestSha256: positiveDigest,
  negativeConditioningBindingDigestSha256: negativeDigest,
  controlNet: {
    checkpointBindingDigestSha256: controlNetDigest,
    controlImageArtifactBindingDigestSha256:
      canny.outputRaster.measuredOutputRgbaDigestSha256,
    strength: 0.8,
    startPercent: 0,
    endPercent: 0.9,
  },
  lora: {
    artifactBindingDigestSha256: loraDigest,
    strengthModel: 0.7,
    strengthClip: 0.55,
  },
})
const controlImageBinding =
  createLivingFrameControlImageWorkflowBinding({
    bindingId: 'binding.model-family.control-image',
    controlImageKind: 'canny',
    cannyReport: canny,
    workflowExpectation: workflow,
  })
const evaluation = createLivingFrameIpAdapterExtensionEvaluation({
  evaluationId: 'evaluation.model-family.ipadapter',
  controlledIllustrationQualificationDigestSha256: qualificationDigest,
  controlledIllustrationSourceObservationDigestSha256:
    sourceObservationDigest,
  stockComfyUiGraphExpectationDigestSha256:
    workflow.expectationDigestSha256,
})
const extension = createLivingFrameIpAdapterWorkflowExtension({
  extensionId: 'extension.model-family.ipadapter',
  stockWorkflowExpectation: workflow,
  ipAdapterSourceEvaluation: evaluation,
  genericIpAdapterCheckpointBindingDigestSha256: ipAdapterDigest,
  clipVisionCheckpointBindingDigestSha256: clipVisionDigest,
  approvedReferenceImageBindingDigestSha256: referenceImageDigest,
  weight: 0.8,
  weightType: 'linear',
  combineEmbeds: 'average',
  startPercent: 0,
  endPercent: 0.9,
  embedsScaling: 'v_only',
})
const merged = createLivingFrameIpAdapterMergedWorkflow({
  mergedWorkflowId: 'merged.model-family.ipadapter',
  stockWorkflowExpectation: workflow,
  ipAdapterWorkflowExtension: extension,
})
const sdxlInput = {
  bindingId: 'binding.model-family.sdxl',
  stockWorkflowExpectation: workflow,
  controlImageWorkflowBinding: controlImageBinding,
  ipAdapterWorkflowExtension: extension,
  ipAdapterMergedWorkflow: merged,
  baseModelFamily: 'stable_diffusion_xl_base_1_0' as const,
  controlNetModelFamily: 'stable_diffusion_xl_base_1_0' as const,
  loraBaseModelFamily: 'stable_diffusion_xl_base_1_0' as const,
  genericIpAdapterBaseModelFamily:
    'stable_diffusion_xl_base_1_0' as const,
  clipVisionFamily: 'clip_vision_vit_big_g_14' as const,
}
const binding = createLivingFrameControlledModelFamilyBinding(sdxlInput)

assert.equal(
  verifyLivingFrameControlledModelFamilyBinding(binding, sdxlInput),
  true,
)
assert.deepEqual(
  binding.familyExpectations.map((expectation) => expectation.role),
  [
    'base_checkpoint',
    'controlnet_checkpoint',
    'lora_adapter',
    'generic_ipadapter_checkpoint',
    'clip_vision_checkpoint',
  ],
)
assert.deepEqual(
  binding.familyExpectations.map((expectation) => expectation.order),
  [1, 2, 3, 4, 5],
)
assert.equal(
  binding.familyExpectations[0].bindingDigestSha256,
  baseCheckpointDigest,
)
assert.equal(
  binding.familyExpectations[1].bindingDigestSha256,
  controlNetDigest,
)
assert.equal(
  binding.familyExpectations[2].bindingDigestSha256,
  loraDigest,
)
assert.equal(
  binding.familyExpectations[3].bindingDigestSha256,
  ipAdapterDigest,
)
assert.equal(
  binding.familyExpectations[4].bindingDigestSha256,
  clipVisionDigest,
)
assert.equal(
  binding.sourceBindings.controlImageWorkflowBinding.present,
  true,
)
assert.equal(
  binding.sourceBindings.ipAdapterMergedWorkflow.present,
  true,
)
assert.equal(binding.currentArtifactMetadataPresent, false)
assert.equal(binding.exactArtifactCompatibilityProven, false)
assert.equal(binding.executableWorkflowPresent, false)
assert.equal(binding.auraFaceGenerationConditioningPresent, false)
assert.equal(binding.faceIdOrInsightFaceRoutePresent, false)
assert.equal(binding.subjectSpecificRouting, false)
assert.equal(binding.productionReady, false)
assertAllAuthorityClosed(binding.authorityBoundary)

const replay = createLivingFrameControlledModelFamilyBinding(sdxlInput)
assert.deepEqual(replay, binding)

const baseWorkflow =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    workflowExpectationId: 'workflow.model-family.sd15-base',
    profile: 'base_txt2img',
    controlledIllustrationQualificationDigestSha256:
      qualificationDigest,
    controlledIllustrationSourceObservationDigestSha256:
      sourceObservationDigest,
    outputFrameExpectationDigestSha256: outputFrameDigest,
    widthPixels: width,
    heightPixels: height,
    baseCheckpointBindingDigestSha256: baseCheckpointDigest,
    positiveConditioningBindingDigestSha256: positiveDigest,
    negativeConditioningBindingDigestSha256: negativeDigest,
  })
const sd15Input = {
  bindingId: 'binding.model-family.sd15-base',
  stockWorkflowExpectation: baseWorkflow,
  baseModelFamily: 'stable_diffusion_1_5' as const,
}
const sd15 = createLivingFrameControlledModelFamilyBinding(sd15Input)
assert.equal(sd15.familyExpectations.length, 1)
assert.equal(
  sd15.sourceBindings.controlImageWorkflowBinding.present,
  false,
)
assert.equal(
  sd15.sourceBindings.ipAdapterMergedWorkflow.present,
  false,
)
assert.notEqual(sd15.bindingDigestSha256, binding.bindingDigestSha256)

assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sdxlInput,
    controlNetModelFamily: 'stable_diffusion_1_5',
  }),
  'base_family_mismatch',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sdxlInput,
    loraBaseModelFamily: 'stable_diffusion_1_5',
  }),
  'base_family_mismatch',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sdxlInput,
    genericIpAdapterBaseModelFamily: 'stable_diffusion_1_5',
  }),
  'base_family_mismatch',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sdxlInput,
    clipVisionFamily: 'clip_vision_vit_h_14',
  }),
  'clip_vision_family_mismatch',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sdxlInput,
    controlImageWorkflowBinding: undefined,
  }),
  'control_image_binding_missing',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sd15Input,
    controlImageWorkflowBinding: controlImageBinding,
  }),
  'control_image_binding_unexpected',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sdxlInput,
    ipAdapterWorkflowExtension: undefined,
  }),
  'ipadapter_inputs_incomplete',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sd15Input,
    loraBaseModelFamily: 'stable_diffusion_1_5',
  }),
  'family_declaration_unexpected',
)
assertIssue(
  () => createLivingFrameControlledModelFamilyBinding({
    ...sdxlInput,
    unexpectedProvider: 'forbidden',
  } as typeof sdxlInput),
  'unknown_key',
)

const forged = structuredClone(binding) as unknown as Record<string, unknown>
forged.exactArtifactCompatibilityProven = true
forged.productionReady = true
assert.equal(
  verifyLivingFrameControlledModelFamilyBinding(forged, sdxlInput),
  false,
)
const reordered = structuredClone(binding) as unknown as Record<string, unknown>
reordered.familyExpectations = structuredClone(
  Array.from(binding.familyExpectations),
).reverse()
assert.equal(
  verifyLivingFrameControlledModelFamilyBinding(reordered, sdxlInput),
  false,
)
const tamperedDigest =
  structuredClone(binding) as unknown as Record<string, unknown>
const tamperedExpectations = structuredClone(
  Array.from(binding.familyExpectations),
)
tamperedExpectations[0] = {
  ...tamperedExpectations[0],
  bindingDigestSha256: digest('wrong-base-checkpoint'),
}
tamperedDigest.familyExpectations = tamperedExpectations
assert.equal(
  verifyLivingFrameControlledModelFamilyBinding(
    tamperedDigest,
    sdxlInput,
  ),
  false,
)

console.log(
  'Living Frame controlled model-family binding smoke passed: '
  + '2 coherent family fixtures, 10 adversarial assertions.',
)

function assertIssue(
  action: () => unknown,
  expected: LivingFrameControlledModelFamilyIssueCode,
): void {
  assert.throws(action, (error: unknown) => {
    assert.equal(
      error instanceof LivingFrameControlledModelFamilyBindingError,
      true,
    )
    assert.equal(
      (error as LivingFrameControlledModelFamilyBindingError)
        .issues.some((issue) => issue.code === expected),
      true,
    )
    return true
  })
}

function assertAllAuthorityClosed(
  authority: LivingFrameControlledModelFamilyBindingAuthority,
): void {
  const entries = Object.entries(authority)
  assert.equal(
    entries.filter(([, value]) => value === true).length,
    1,
  )
  assert.equal(authority.controlledFamilyCoherenceExpectationOnly, true)
  assert.equal(
    entries
      .filter(([key]) => key !== 'controlledFamilyCoherenceExpectationOnly')
      .every(([, value]) => value === false),
    true,
  )
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
