import assert from 'node:assert/strict'

import {
  createLivingFrameIpAdapterExtensionEvaluation,
} from '../living-frame/living-frame-controlled-illustration-ipadapter-extension'
import {
  compileLivingFrameControlledComfyUiWorkflowExpectation,
} from '../living-frame/living-frame-controlled-illustration-comfyui-workflow'
import {
  createLivingFrameIpAdapterWorkflowExtension,
  validateLivingFrameIpAdapterWorkflowExtension,
} from '../living-frame/living-frame-ipadapter-workflow-extension'

const workflow = compileLivingFrameControlledComfyUiWorkflowExpectation({
  workflowExpectationId: 'workflow.ipadapter.base.v1',
  profile: 'base_txt2img',
  controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
  controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
  outputFrameExpectationDigestSha256: '3'.repeat(64),
  widthPixels: 1024,
  heightPixels: 1024,
  baseCheckpointBindingDigestSha256: '4'.repeat(64),
  positiveConditioningBindingDigestSha256: '5'.repeat(64),
  negativeConditioningBindingDigestSha256: '6'.repeat(64),
})
const evaluation = createLivingFrameIpAdapterExtensionEvaluation({
  evaluationId: 'evaluation.ipadapter.generic.v1',
  controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
  controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
  stockComfyUiGraphExpectationDigestSha256:
    workflow.expectationDigestSha256,
})
const extension = createLivingFrameIpAdapterWorkflowExtension({
  extensionId: 'extension.ipadapter.generic.v1',
  stockWorkflowExpectation: workflow,
  ipAdapterSourceEvaluation: evaluation,
  genericIpAdapterCheckpointBindingDigestSha256: '7'.repeat(64),
  clipVisionCheckpointBindingDigestSha256: '8'.repeat(64),
  approvedReferenceImageBindingDigestSha256: '9'.repeat(64),
  weight: 0.85,
  weightType: 'linear',
  combineEmbeds: 'average',
  startPercent: 0,
  endPercent: 0.9,
  embedsScaling: 'v_only',
})

assert.equal(validateLivingFrameIpAdapterWorkflowExtension(extension).ok, true)
assert.deepEqual(
  extension.nodes.map((node) => node.nodeClass),
  ['CLIPVisionLoader', 'IPAdapterModelLoader', 'IPAdapterAdvanced'],
)
assert.equal(
  extension.replacedModelEdgeExpectation.stockWorkflowMutationPerformed,
  false,
)
assert.equal(extension.genericRouteOnly, true)
assert.equal(extension.faceIdRoutePresent, false)
assert.equal(extension.insightFaceRoutePresent, false)
assert.equal(extension.auraFaceGenerationConditioningPresent, false)
assert.equal(extension.authorityBoundary.modelWeightAuthority, false)
assert.equal(extension.authorityBoundary.dispatchAuthority, false)
assert.equal(extension.authorityBoundary.runtimeAuthority, false)
assert.equal(extension.subjectSpecificRouting, false)
assert.equal(extension.productionReady, false)

const negativeCases: readonly [string, unknown][] = [
  ['unknown key', { ...extension, providerId: 'forbidden' }],
  ['digest tamper', {
    ...extension,
    extensionDigestSha256: '0'.repeat(64),
  }],
  ['FaceID promotion', { ...extension, faceIdRoutePresent: true }],
  ['InsightFace promotion', {
    ...extension,
    insightFaceRoutePresent: true,
  }],
  ['AuraFace generation promotion', {
    ...extension,
    auraFaceGenerationConditioningPresent: true,
  }],
  ['runtime promotion', {
    ...extension,
    authorityBoundary: {
      ...extension.authorityBoundary,
      runtimeAuthority: true,
    },
  }],
  ['resolved artifact claim', {
    ...extension,
    externalBindings: extension.externalBindings.map((binding, index) =>
      index === 0 ? { ...binding, artifactResolved: true } : binding),
  }],
  ['FaceID node', {
    ...extension,
    nodes: extension.nodes.map((node, index) =>
      index === 2 ? { ...node, nodeClass: 'IPAdapterFaceID' } : node),
  }],
  ['swapped allowed node class', {
    ...extension,
    nodes: extension.nodes.map((node, index) =>
      index === 0
        ? { ...node, nodeClass: 'IPAdapterModelLoader' }
        : node),
  }],
  ['dangling extension edge', {
    ...extension,
    edges: extension.edges.map((edge, index) =>
      index === 3
        ? { ...edge, toNodeId: 'node.missing.sampler' }
        : edge),
  }],
  ['wrong external binding target', {
    ...extension,
    externalBindings: extension.externalBindings.map((binding, index) =>
      index === 2
        ? { ...binding, targetNodeId: 'extension.node.01.clip_vision_loader' }
        : binding),
  }],
  ['node order tamper', {
    ...extension,
    nodes: [...extension.nodes].reverse(),
  }],
  ['edge order tamper', {
    ...extension,
    edges: [...extension.edges].reverse(),
  }],
  ['parameter range', {
    ...extension,
    applyParameters: {
      ...extension.applyParameters,
      weight: 8,
    },
  }],
  ['subject-specific route', {
    ...extension,
    subjectSpecificRouting: true,
  }],
  ['gate omission', {
    ...extension,
    openGateCodes: extension.openGateCodes.slice(1),
  }],
]
for (const [label, value] of negativeCases) {
  assert.equal(
    validateLivingFrameIpAdapterWorkflowExtension(value).ok,
    false,
    label,
  )
}

const wrongEvaluation = createLivingFrameIpAdapterExtensionEvaluation({
  evaluationId: 'evaluation.ipadapter.wrong-parent.v1',
  controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
  controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
  stockComfyUiGraphExpectationDigestSha256: 'a'.repeat(64),
})
assert.throws(
  () => createLivingFrameIpAdapterWorkflowExtension({
    extensionId: 'extension.ipadapter.wrong-parent.v1',
    stockWorkflowExpectation: workflow,
    ipAdapterSourceEvaluation: wrongEvaluation,
    genericIpAdapterCheckpointBindingDigestSha256: '7'.repeat(64),
    clipVisionCheckpointBindingDigestSha256: '8'.repeat(64),
    approvedReferenceImageBindingDigestSha256: '9'.repeat(64),
    weight: 0.85,
    weightType: 'linear',
    combineEmbeds: 'average',
    startPercent: 0,
    endPercent: 0.9,
    embedsScaling: 'v_only',
  }),
  /generic IP-Adapter workflow extension failed/,
)

console.log(
  'Living Frame IP-Adapter workflow extension smoke passed: generic graph rewiring and 17 adversarial cases.',
)
