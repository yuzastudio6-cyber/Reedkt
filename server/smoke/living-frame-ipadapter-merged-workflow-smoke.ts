import assert from 'node:assert/strict'

import type {
  LivingFrameIpAdapterMergedWorkflowAuthorityBoundary,
} from '../../src/types/living-frame-ipadapter-merged-workflow'
import {
  createLivingFrameIpAdapterExtensionEvaluation,
} from '../living-frame/living-frame-controlled-illustration-ipadapter-extension'
import {
  compileLivingFrameControlledComfyUiWorkflowExpectation,
} from '../living-frame/living-frame-controlled-illustration-comfyui-workflow'
import {
  createLivingFrameIpAdapterMergedWorkflow,
  verifyLivingFrameIpAdapterMergedWorkflow,
} from '../living-frame/living-frame-ipadapter-merged-workflow'
import {
  createLivingFrameIpAdapterWorkflowExtension,
} from '../living-frame/living-frame-ipadapter-workflow-extension'

const workflow = compileLivingFrameControlledComfyUiWorkflowExpectation({
  workflowExpectationId: 'workflow.ipadapter.merge.base.v1',
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
  evaluationId: 'evaluation.ipadapter.merge.generic.v1',
  controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
  controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
  stockComfyUiGraphExpectationDigestSha256:
    workflow.expectationDigestSha256,
})
const extension = createLivingFrameIpAdapterWorkflowExtension({
  extensionId: 'extension.ipadapter.merge.generic.v1',
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
const input = {
  mergedWorkflowId: 'merged.ipadapter.generic.v1',
  stockWorkflowExpectation: workflow,
  ipAdapterWorkflowExtension: extension,
}
const merged = createLivingFrameIpAdapterMergedWorkflow(input)

assert.equal(
  verifyLivingFrameIpAdapterMergedWorkflow(merged, input),
  true,
)
assert.equal(
  merged.metrics.effectiveNodeCount,
  workflow.nodes.length + extension.nodes.length,
)
assert.equal(
  merged.metrics.effectiveEdgeCount,
  workflow.edges.length - 1 + extension.edges.length,
)
assert.equal(
  merged.metrics.externalBindingCount,
  workflow.externalBindingExpectations.length
    + extension.externalBindings.length,
)
assert.equal(merged.graph.directStockModelEdgePresent, false)
assert.equal(
  merged.graph.effectiveEdges.some(
    (edge) =>
      edge.edgeId ===
        extension.replacedModelEdgeExpectation.stockEdgeId,
  ),
  false,
)
assert.equal(
  merged.graph.effectiveEdges.filter(
    (edge) => edge.edgeOrigin === 'ipadapter_extension',
  ).length,
  4,
)
assert.equal(
  new Set(merged.graph.topologicalNodeIds).size,
  merged.metrics.effectiveNodeCount,
)
assert.equal(
  merged.graph.topologicalNodeIds.length,
  merged.metrics.effectiveNodeCount,
)
assert.equal(
  merged.graph.nodes.every(
    (node, index) => node.topologicalOrder === index + 1,
  ),
  true,
)
const topologicalOrder = new Map(
  merged.graph.topologicalNodeIds.map(
    (nodeId, index) => [nodeId, index],
  ),
)
assert.equal(
  merged.graph.effectiveEdges.every(
    (edge) =>
      topologicalOrder.get(edge.fromNodeId)!
        < topologicalOrder.get(edge.toNodeId)!,
  ),
  true,
)
assert.equal(
  merged.graph.nodes.some(
    (node) => String(node.nodeClass).includes('FaceID'),
  ),
  false,
)
assert.equal(merged.parentObjectsMutated, false)
assert.equal(merged.genericRouteOnly, true)
assert.equal(merged.faceIdRoutePresent, false)
assert.equal(merged.insightFaceRoutePresent, false)
assert.equal(merged.auraFaceGenerationConditioningPresent, false)
assert.equal(merged.executableWorkflowPresent, false)
assert.equal(merged.subjectSpecificRouting, false)
assert.equal(merged.productionReady, false)
assertAllAuthorityClosed(merged.authorityBoundary)

const replay = createLivingFrameIpAdapterMergedWorkflow(input)
assert.deepEqual(replay, merged)

const additionalProfiles = [
  {
    profile: 'lora_txt2img' as const,
    lora: {
      artifactBindingDigestSha256: 'a'.repeat(64),
      strengthModel: 0.7,
      strengthClip: 0.55,
    },
  },
  {
    profile: 'controlnet_txt2img' as const,
    controlNet: {
      checkpointBindingDigestSha256: 'b'.repeat(64),
      controlImageArtifactBindingDigestSha256: 'c'.repeat(64),
      strength: 0.8,
      startPercent: 0,
      endPercent: 0.9,
    },
  },
  {
    profile: 'controlnet_lora_txt2img' as const,
    controlNet: {
      checkpointBindingDigestSha256: 'b'.repeat(64),
      controlImageArtifactBindingDigestSha256: 'c'.repeat(64),
      strength: 0.8,
      startPercent: 0,
      endPercent: 0.9,
    },
    lora: {
      artifactBindingDigestSha256: 'a'.repeat(64),
      strengthModel: 0.7,
      strengthClip: 0.55,
    },
  },
] as const
for (const [index, profileInput] of additionalProfiles.entries()) {
  const parent =
    compileLivingFrameControlledComfyUiWorkflowExpectation({
      workflowExpectationId: `workflow.ipadapter.merge.profile.${index + 2}`,
      profile: profileInput.profile,
      controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
      controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
      outputFrameExpectationDigestSha256: '3'.repeat(64),
      widthPixels: 1024,
      heightPixels: 1024,
      baseCheckpointBindingDigestSha256: '4'.repeat(64),
      positiveConditioningBindingDigestSha256: '5'.repeat(64),
      negativeConditioningBindingDigestSha256: '6'.repeat(64),
      controlNet: 'controlNet' in profileInput
        ? profileInput.controlNet
        : undefined,
      lora: 'lora' in profileInput
        ? profileInput.lora
        : undefined,
    })
  const parentEvaluation =
    createLivingFrameIpAdapterExtensionEvaluation({
      evaluationId: `evaluation.ipadapter.merge.profile.${index + 2}`,
      controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
      controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
      stockComfyUiGraphExpectationDigestSha256:
        parent.expectationDigestSha256,
    })
  const parentExtension =
    createLivingFrameIpAdapterWorkflowExtension({
      extensionId: `extension.ipadapter.merge.profile.${index + 2}`,
      stockWorkflowExpectation: parent,
      ipAdapterSourceEvaluation: parentEvaluation,
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
  const profileMergeInput = {
    mergedWorkflowId: `merged.ipadapter.profile.${index + 2}`,
    stockWorkflowExpectation: parent,
    ipAdapterWorkflowExtension: parentExtension,
  }
  const profileMerged =
    createLivingFrameIpAdapterMergedWorkflow(profileMergeInput)
  assert.equal(
    verifyLivingFrameIpAdapterMergedWorkflow(
      profileMerged,
      profileMergeInput,
    ),
    true,
  )
  assert.equal(profileMerged.profile, profileInput.profile)
  assert.equal(profileMerged.graph.directStockModelEdgePresent, false)
  assert.equal(
    profileMerged.metrics.effectiveEdgeCount,
    parent.edges.length - 1 + parentExtension.edges.length,
  )
}

const forgedValues: unknown[] = [
  { ...merged, rawPrompt: 'forbidden' },
  {
    ...merged,
    mergedWorkflowDigestSha256: '0'.repeat(64),
  },
  {
    ...merged,
    graph: {
      ...merged.graph,
      directStockModelEdgePresent: true,
    },
  },
  {
    ...merged,
    graph: {
      ...merged.graph,
      effectiveEdges: [
        ...merged.graph.effectiveEdges,
        {
          edgeId:
            extension.replacedModelEdgeExpectation.stockEdgeId,
          edgeOrigin: 'stock_workflow',
          sourceOrder: 99,
          fromNodeId:
            extension.replacedModelEdgeExpectation.modelSourceNodeId,
          fromPort: 'model',
          toNodeId:
            extension.replacedModelEdgeExpectation.samplerNodeId,
          toPort: 'model',
        },
      ],
    },
  },
  {
    ...merged,
    graph: {
      ...merged.graph,
      topologicalNodeIds: [...merged.graph.topologicalNodeIds].reverse(),
    },
  },
  {
    ...merged,
    graph: {
      ...merged.graph,
      nodes: merged.graph.nodes.map((node, index) =>
        index === 0
          ? { ...node, nodeClass: 'IPAdapterFaceID' }
          : node),
    },
  },
  {
    ...merged,
    authorityBoundary: Object.fromEntries(
      Object.keys(merged.authorityBoundary)
        .map((key) => [key, true]),
    ),
    faceIdRoutePresent: true,
    insightFaceRoutePresent: true,
    auraFaceGenerationConditioningPresent: true,
    rawPromptOrReferenceImagePresent: true,
    filenamePathOrUrlPresent: true,
    providerOrToolIdentifierPresent: true,
    executableWorkflowPresent: true,
    subjectSpecificRouting: true,
    productionReady: true,
  },
]
for (const forged of forgedValues) {
  assert.equal(
    verifyLivingFrameIpAdapterMergedWorkflow(forged, input),
    false,
  )
}

const otherWorkflow =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    ...{
      workflowExpectationId: 'workflow.ipadapter.merge.other.v1',
      controlledIllustrationQualificationDigestSha256: '1'.repeat(64),
      controlledIllustrationSourceObservationDigestSha256: '2'.repeat(64),
      outputFrameExpectationDigestSha256: '3'.repeat(64),
      widthPixels: 1024,
      heightPixels: 1024,
      baseCheckpointBindingDigestSha256: '4'.repeat(64),
      positiveConditioningBindingDigestSha256: '5'.repeat(64),
      negativeConditioningBindingDigestSha256: '6'.repeat(64),
    },
    profile: 'base_txt2img',
  })
assert.throws(
  () => createLivingFrameIpAdapterMergedWorkflow({
    mergedWorkflowId: 'merged.ipadapter.cross-parent.rejected',
    stockWorkflowExpectation: otherWorkflow,
    ipAdapterWorkflowExtension: extension,
  }),
  /Living Frame IP-Adapter merge rejected:/,
)
assert.throws(
  () => createLivingFrameIpAdapterMergedWorkflow({
    ...input,
    providerId: 'forbidden',
  } as never),
  /Living Frame IP-Adapter merge rejected:/,
)

console.log(JSON.stringify({
  suite: 'living-frame-ipadapter-merged-workflow',
  stockAndExtensionMerged: true,
  stockNodeCount: merged.metrics.stockNodeCount,
  extensionNodeCount: merged.metrics.extensionNodeCount,
  effectiveNodeCount: merged.metrics.effectiveNodeCount,
  effectiveEdgeCount: merged.metrics.effectiveEdgeCount,
  directStockModelEdgePresent:
    merged.graph.directStockModelEdgePresent,
  graphAcyclic: merged.graph.acyclic,
  parentObjectsMutated: merged.parentObjectsMutated,
  faceIdRoutePresent: merged.faceIdRoutePresent,
  auraFaceGenerationConditioningPresent:
    merged.auraFaceGenerationConditioningPresent,
  adversarialAssertions: forgedValues.length + 2,
  supportedStockProfiles: 1 + additionalProfiles.length,
  toolRouteAuthorityGranted:
    merged.authorityBoundary.toolRouteAuthority,
  runtimeAuthorityGranted:
    merged.authorityBoundary.runtimeAuthority,
  productionAuthorityGranted:
    merged.authorityBoundary.productionAuthority,
}))

function assertAllAuthorityClosed(
  boundary: LivingFrameIpAdapterMergedWorkflowAuthorityBoundary,
): void {
  assert.equal(boundary.deterministicGraphMaterializationOnly, true)
  for (const [key, value] of Object.entries(boundary)) {
    if (key === 'deterministicGraphMaterializationOnly') continue
    assert.equal(value, false, `${key} must remain false.`)
  }
}
