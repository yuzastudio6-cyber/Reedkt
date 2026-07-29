import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createLivingFrameComfyUiDependencyLockEvidence,
  createLivingFrameComfyUiDependencyLockObservationReader,
} from '../living-frame/living-frame-comfyui-dependency-lock-evidence'
import {
  LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION,
} from '../living-frame/living-frame-comfyui-dependency-lock-manifest'
import {
  createLivingFrameComfyUiModelArtifactRequirements,
  verifyLivingFrameComfyUiModelArtifactRequirements,
} from '../living-frame/living-frame-comfyui-model-artifact-requirements'
import {
  createLivingFrameControlImageCanny,
} from '../living-frame/living-frame-control-image-canny'
import {
  createLivingFrameControlImageWorkflowBinding,
} from '../living-frame/living-frame-control-image-workflow-binding'
import {
  createLivingFrameControlledModelFamilyBinding,
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
const hash = (value: string | Uint8Array): string =>
  createHash('sha256').update(value).digest('hex')
const pixels = new Uint8Array(width * height * 4)
for (let y = 48; y < 208; y += 1) {
  for (let x = 64; x < 192; x += 1) {
    const offset = (y * width + x) * 4
    pixels[offset] = 220
    pixels[offset + 1] = 150
    pixels[offset + 2] = 70
    pixels[offset + 3] = 255
  }
}

const canny = createLivingFrameControlImageCanny({
  sourceArtifactId: 'artifact.model-requirements.control-source',
  sourceArtifactDigestSha256: hash(pixels),
  width,
  height,
  sourceRgbaBytes: pixels,
  lowThreshold: 24,
  highThreshold: 72,
}).report
const workflow = compileLivingFrameControlledComfyUiWorkflowExpectation({
  workflowExpectationId: 'workflow.model-requirements.complete',
  profile: 'controlnet_lora_txt2img',
  controlledIllustrationQualificationDigestSha256: hash('qualification'),
  controlledIllustrationSourceObservationDigestSha256:
    hash('source-observation'),
  outputFrameExpectationDigestSha256: hash('output-frame'),
  widthPixels: width,
  heightPixels: height,
  baseCheckpointBindingDigestSha256: hash('base-checkpoint'),
  positiveConditioningBindingDigestSha256: hash('positive'),
  negativeConditioningBindingDigestSha256: hash('negative'),
  controlNet: {
    checkpointBindingDigestSha256: hash('controlnet'),
    controlImageArtifactBindingDigestSha256:
      canny.outputRaster.measuredOutputRgbaDigestSha256,
    strength: 0.8,
    startPercent: 0,
    endPercent: 0.9,
  },
  lora: {
    artifactBindingDigestSha256: hash('lora'),
    strengthModel: 0.7,
    strengthClip: 0.55,
  },
})
const controlImageBinding = createLivingFrameControlImageWorkflowBinding({
  bindingId: 'binding.model-requirements.control-image',
  controlImageKind: 'canny',
  cannyReport: canny,
  workflowExpectation: workflow,
})
const evaluation = createLivingFrameIpAdapterExtensionEvaluation({
  evaluationId: 'evaluation.model-requirements.ipadapter',
  controlledIllustrationQualificationDigestSha256: hash('qualification'),
  controlledIllustrationSourceObservationDigestSha256:
    hash('source-observation'),
  stockComfyUiGraphExpectationDigestSha256:
    workflow.expectationDigestSha256,
})
const extension = createLivingFrameIpAdapterWorkflowExtension({
  extensionId: 'extension.model-requirements.ipadapter',
  stockWorkflowExpectation: workflow,
  ipAdapterSourceEvaluation: evaluation,
  genericIpAdapterCheckpointBindingDigestSha256: hash('ipadapter'),
  clipVisionCheckpointBindingDigestSha256: hash('clip-vision'),
  approvedReferenceImageBindingDigestSha256: hash('reference-image'),
  weight: 0.8,
  weightType: 'linear',
  combineEmbeds: 'average',
  startPercent: 0,
  endPercent: 0.9,
  embedsScaling: 'v_only',
})
const merged = createLivingFrameIpAdapterMergedWorkflow({
  mergedWorkflowId: 'merged.model-requirements.ipadapter',
  stockWorkflowExpectation: workflow,
  ipAdapterWorkflowExtension: extension,
})
const familyInput = {
  bindingId: 'binding.model-requirements.family',
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
const familyBinding =
  createLivingFrameControlledModelFamilyBinding(familyInput)
const dependencyLockEvidence =
  await createLivingFrameComfyUiDependencyLockEvidence({
    evidenceId: 'evidence.model-requirements.dependencies',
    observationReader:
      createLivingFrameComfyUiDependencyLockObservationReader({
        readControlledDependencyLockObservation:
          async () => LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION,
      }),
  })
const input = {
  requirementSetId: 'requirements.comfyui.complete',
  controlledModelFamilyBinding: familyBinding,
  controlledModelFamilyBindingInput: familyInput,
  dependencyLockEvidence,
}
const requirements =
  createLivingFrameComfyUiModelArtifactRequirements(input)

assert.equal(
  verifyLivingFrameComfyUiModelArtifactRequirements(requirements, input),
  true,
)
assert.deepEqual(
  requirements.requirements.map((entry) => entry.role),
  [
    'base_checkpoint',
    'controlnet_checkpoint',
    'lora_adapter',
    'generic_ipadapter_checkpoint',
    'clip_vision_checkpoint',
  ],
)
assert.deepEqual(
  requirements.requirements.map((entry) => entry.order),
  [1, 2, 3, 4, 5],
)
assert.equal(requirements.metrics.requirementCount, 5)
assert.equal(requirements.metrics.unresolvedRequirementCount, 5)
assert.equal(requirements.dependencyLockEvidenceRevalidated, true)
assert.equal(
  requirements.requirements.every((entry) =>
    entry.executionExpectation.executionClass === 'gpu_required'
    && entry.executionExpectation.requiredExecutionTarget
      === 'google_cloud_run_gpu'
    && entry.executionExpectation.accelerator === 'cuda'
    && entry.executionExpectation.cpuFallbackAllowed === false
    && entry.executionExpectation.runtimeDownloadAllowed === false
    && entry.executionExpectation.networkFetchAllowed === false
    && entry.artifactLocatorBound === false
    && entry.artifactManifestVerified === false
    && entry.artifactBytesMounted === false
    && entry.compatibilityBenchmarkPassed === false
    && entry.paidProductionUseApproved === false),
  true,
)

await assert.rejects(
  async () => createLivingFrameComfyUiModelArtifactRequirements({
    ...input,
    dependencyLockEvidence: {
      ...dependencyLockEvidence,
      productionReady: true,
    },
  }),
  /model-artifact requirements failed/,
)
await assert.rejects(
  async () => createLivingFrameComfyUiModelArtifactRequirements({
    ...input,
    controlledModelFamilyBinding: {
      ...familyBinding,
      productionReady: true,
    },
  }),
  /model-artifact requirements failed/,
)
await assert.rejects(
  async () => createLivingFrameComfyUiModelArtifactRequirements({
    ...input,
    callerModelPath: '/tmp/model.safetensors',
  } as never),
  /model-artifact requirements failed/,
)

assertRejectedVerification({
  ...requirements,
  requirements: [
    requirements.requirements[1],
    requirements.requirements[0],
    ...requirements.requirements.slice(2),
  ],
})
assertRejectedVerification({
  ...requirements,
  requirements: requirements.requirements.map((entry, index) =>
    index === 0
      ? { ...entry, artifactLocatorBound: true }
      : entry),
})
assertRejectedVerification({
  ...requirements,
  authorityBoundary: {
    ...requirements.authorityBoundary,
    artifactMountAuthority: true,
  },
})
assertRejectedVerification({
  ...requirements,
  dependencyLockEvidenceRevalidated: false,
})
assertRejectedVerification({
  ...requirements,
  subjectSpecificRouting: true,
})
assertRejectedVerification({
  ...requirements,
  productionReady: true,
})
assertRejectedVerification({
  ...requirements,
  modelPath: '/tmp/untrusted.safetensors',
})

console.log(
  'Living Frame ComfyUI model-artifact requirements smoke passed: '
  + '5 exact unresolved roles, 10 adversarial assertions.',
)

function assertRejectedVerification(
  candidate: unknown,
): void {
  assert.equal(
    verifyLivingFrameComfyUiModelArtifactRequirements(candidate, input),
    false,
  )
}

export const modelArtifactRequirementSmokeFixture = {
  input,
  requirements,
} as const
