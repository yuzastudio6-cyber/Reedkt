import assert from 'node:assert/strict'

import type {
  LivingFrameControlledComfyUiWorkflowExpectation,
} from '../../src/types/living-frame-controlled-illustration-comfyui-workflow'
import {
  compileLivingFrameControlledComfyUiWorkflowExpectation,
  LivingFrameControlledComfyUiWorkflowError,
  validateLivingFrameControlledComfyUiWorkflowExpectation,
  verifyLivingFrameControlledComfyUiWorkflowExpectation,
} from '../living-frame/living-frame-controlled-illustration-comfyui-workflow'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const digest = (label: string) => sha256AuthorityValue(label)
const common = {
  workflowExpectationId: 'workflow.generic-controlled-illustration',
  controlledIllustrationQualificationDigestSha256:
    digest('qualification'),
  controlledIllustrationSourceObservationDigestSha256:
    digest('source-observation'),
  outputFrameExpectationDigestSha256: digest('output-frame'),
  widthPixels: 1024,
  heightPixels: 576,
  baseCheckpointBindingDigestSha256: digest('base-checkpoint'),
  positiveConditioningBindingDigestSha256:
    digest('positive-conditioning'),
  negativeConditioningBindingDigestSha256:
    digest('negative-conditioning'),
}

const base =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    ...common,
    profile: 'base_txt2img',
  })
const control =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    ...common,
    workflowExpectationId: 'workflow.generic-controlnet',
    profile: 'controlnet_txt2img',
    controlNet: {
      checkpointBindingDigestSha256: digest('controlnet-checkpoint'),
      controlImageArtifactBindingDigestSha256: digest('control-image'),
      strength: 0.85,
      startPercent: 0,
      endPercent: 0.9,
    },
  })
const lora =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    ...common,
    workflowExpectationId: 'workflow.generic-lora',
    profile: 'lora_txt2img',
    lora: {
      artifactBindingDigestSha256: digest('lora-artifact'),
      strengthModel: 0.7,
      strengthClip: 0.55,
    },
  })
const controlLora =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    ...common,
    workflowExpectationId: 'workflow.generic-controlnet-lora',
    profile: 'controlnet_lora_txt2img',
    controlNet: {
      checkpointBindingDigestSha256: digest('controlnet-checkpoint'),
      controlImageArtifactBindingDigestSha256: digest('control-image'),
      strength: 0.75,
      startPercent: 0.1,
      endPercent: 1,
    },
    lora: {
      artifactBindingDigestSha256: digest('lora-artifact'),
      strengthModel: 0.7,
      strengthClip: 0.55,
    },
  })

for (const expectation of [base, lora, control, controlLora]) {
  assert.equal(
    verifyLivingFrameControlledComfyUiWorkflowExpectation(expectation),
    true,
  )
  assert.equal(
    validateLivingFrameControlledComfyUiWorkflowExpectation(expectation).ok,
    true,
  )
  assertAllAuthorityClosed(expectation)
  assert.equal(expectation.subjectSpecificRouting, false)
  assert.equal(expectation.executableWorkflowPresent, false)
  assert.equal(expectation.customNodePresent, false)
  assert.equal(expectation.rawPromptPresent, false)
  assert.equal(expectation.fileOrUrlPresent, false)
  assert.equal(
    JSON.stringify(expectation).includes('://'),
    false,
  )
  assert.equal(
    JSON.stringify(expectation).includes('/Users/'),
    false,
  )
  assert.equal(
    expectation.openGateCodes.includes(
      'ip_adapter_runtime_binding_unavailable_in_stock_host',
    ),
    true,
  )
}

assert.deepEqual(
  base.nodes.map((node) => node.nodeClass),
  [
    'CheckpointLoaderSimple',
    'CLIPTextEncode',
    'CLIPTextEncode',
    'EmptyLatentImage',
    'KSampler',
    'VAEDecode',
  ],
)
assert.deepEqual(
  lora.nodes.map((node) => node.nodeClass),
  [
    'CheckpointLoaderSimple',
    'LoraLoader',
    'CLIPTextEncode',
    'CLIPTextEncode',
    'EmptyLatentImage',
    'KSampler',
    'VAEDecode',
  ],
)
assert.deepEqual(
  control.nodes.map((node) => node.nodeClass),
  [
    'CheckpointLoaderSimple',
    'CLIPTextEncode',
    'CLIPTextEncode',
    'ControlNetLoader',
    'ControlNetApplyAdvanced',
    'EmptyLatentImage',
    'KSampler',
    'VAEDecode',
  ],
)
assert.deepEqual(
  controlLora.nodes.map((node) => node.nodeClass),
  [
    'CheckpointLoaderSimple',
    'LoraLoader',
    'CLIPTextEncode',
    'CLIPTextEncode',
    'ControlNetLoader',
    'ControlNetApplyAdvanced',
    'EmptyLatentImage',
    'KSampler',
    'VAEDecode',
  ],
)
assert.equal(base.externalBindingExpectations.length, 3)
assert.equal(lora.externalBindingExpectations.length, 4)
assert.equal(control.externalBindingExpectations.length, 5)
assert.equal(controlLora.externalBindingExpectations.length, 6)
assert.equal(
  control.openGateCodes.some(
    (code) =>
      String(code)
        === 'controlnet_aux_preprocessor_execution_unavailable',
  ),
  false,
)
assert.deepEqual(control.controlImagePreparation, {
  mode: 'external_precomputed_control_image_only',
  controlImageRequired: true,
  externalContentAddressedArtifactRequired: true,
  inGraphPreprocessorPresent: false,
  customPreprocessorRequired: false,
  controlNetAuxRequired: false,
  controlImageEvidenceAndQaRequired: true,
})
assert.deepEqual(base.controlImagePreparation, {
  mode: 'not_applicable',
  controlImageRequired: false,
  externalContentAddressedArtifactRequired: false,
  inGraphPreprocessorPresent: false,
  customPreprocessorRequired: false,
  controlNetAuxRequired: false,
  controlImageEvidenceAndQaRequired: false,
})
assert.equal(
  lora.openGateCodes.includes(
    'lora_artifact_resolution_required',
  ),
  true,
)
assert.equal(
  lora.openGateCodes.includes(
    'controlnet_checkpoint_artifact_resolution_required',
  ),
  false,
)
assert.equal(
  controlLora.openGateCodes.includes(
    'lora_artifact_resolution_required',
  ),
  true,
)

const replay =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    ...common,
    profile: 'base_txt2img',
  })
assert.deepEqual(replay, base)

const changedFrame =
  compileLivingFrameControlledComfyUiWorkflowExpectation({
    ...common,
    profile: 'base_txt2img',
    widthPixels: 1280,
    heightPixels: 720,
  })
assert.notEqual(
  changedFrame.expectationDigestSha256,
  base.expectationDigestSha256,
)

const invalidCompileInputs: Array<{
  readonly value: unknown
  readonly expectedCode: string
}> = [
  {
    value: {
      ...common,
      profile: 'base_txt2img',
      prompt: 'raw prompt is forbidden',
    },
    expectedCode: 'unknown_key',
  },
  {
    value: {
      ...common,
      profile: 'base_txt2img',
      modelPath: '/tmp/model.safetensors',
    },
    expectedCode: 'unknown_key',
  },
  {
    value: {
      ...common,
      profile: 'base_txt2img',
      providerId: 'forbidden',
    },
    expectedCode: 'unknown_key',
  },
  {
    value: {
      ...common,
      profile: 'base_txt2img',
      widthPixels: 1001,
    },
    expectedCode: 'frame_invalid',
  },
  {
    value: {
      ...common,
      profile: 'controlnet_txt2img',
    },
    expectedCode: 'profile_configuration_invalid',
  },
  {
    value: {
      ...common,
      profile: 'base_txt2img',
      controlNet: {
        checkpointBindingDigestSha256: digest('controlnet'),
        controlImageArtifactBindingDigestSha256: digest('image'),
        strength: 1,
        startPercent: 0,
        endPercent: 1,
      },
    },
    expectedCode: 'profile_configuration_invalid',
  },
  {
    value: {
      ...common,
      profile: 'controlnet_lora_txt2img',
      controlNet: {
        checkpointBindingDigestSha256: digest('controlnet'),
        controlImageArtifactBindingDigestSha256: digest('image'),
        strength: 1,
        startPercent: 0.8,
        endPercent: 0.2,
      },
      lora: {
        artifactBindingDigestSha256: digest('lora'),
        strengthModel: 0.5,
        strengthClip: 0.5,
      },
    },
    expectedCode: 'profile_configuration_invalid',
  },
  {
    value: {
      ...common,
      profile: 'controlnet_lora_txt2img',
      controlNet: {
        checkpointBindingDigestSha256: digest('controlnet'),
        controlImageArtifactBindingDigestSha256: digest('image'),
        strength: 1,
        startPercent: 0,
        endPercent: 1,
      },
    },
    expectedCode: 'profile_configuration_invalid',
  },
]

for (const fixture of invalidCompileInputs) {
  let caught: unknown
  try {
    compileLivingFrameControlledComfyUiWorkflowExpectation(
      fixture.value as never,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(caught instanceof LivingFrameControlledComfyUiWorkflowError)
  assert.ok(
    caught.issues.some((issue) => issue.code === fixture.expectedCode),
    `${fixture.expectedCode} must be reported.`,
  )
  assert.equal(
    caught.message,
    'Living Frame controlled ComfyUI workflow expectation failed.',
  )
}

const forgedExpectations: Array<{
  readonly value: unknown
  readonly expectedCode: string
}> = [
  {
    value: sign({
      ...withoutDigest(control),
      sourceBindings: {
        ...control.sourceBindings,
        comfyUiRevisionSha1:
          '0000000000000000000000000000000000000000',
      },
    }),
    expectedCode: 'source_binding_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      nodes: control.nodes.map((node, index) =>
        index === 0
          ? { ...node, nodeClass: 'IPAdapterModelLoader' }
          : node),
    }),
    expectedCode: 'node_class_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      nodes: control.nodes.map((node, index) =>
        index === 3
          ? { ...node, nodeClass: 'AIO_Preprocessor' }
          : node),
    }),
    expectedCode: 'node_class_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      nodes: [
        control.nodes[0],
        control.nodes[0],
        ...control.nodes.slice(2),
      ],
    }),
    expectedCode: 'duplicate_node',
  },
  {
    value: sign({
      ...withoutDigest(control),
      nodes: [
        control.nodes[1],
        control.nodes[0],
        ...control.nodes.slice(2),
      ],
    }),
    expectedCode: 'node_order_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      edges: control.edges.map((edge, index) =>
        index === 0
          ? { ...edge, fromNodeId: 'node.missing' }
          : edge),
    }),
    expectedCode: 'dangling_edge',
  },
  {
    value: sign({
      ...withoutDigest(control),
      edges: [
        ...control.edges,
        {
          edgeId: 'edge.cycle',
          fromNodeId: control.terminalImageNodeId,
          fromPort: 'samples',
          toNodeId: control.nodes[0]!.nodeId,
          toPort: 'model',
        },
      ],
    }),
    expectedCode: 'cyclic_graph',
  },
  {
    value: sign({
      ...withoutDigest(control),
      edges: [...control.edges, control.edges[0]!],
    }),
    expectedCode: 'duplicate_edge',
  },
  {
    value: sign({
      ...withoutDigest(control),
      externalBindingExpectations:
        control.externalBindingExpectations.map((binding, index) =>
          index === 0
            ? { ...binding, targetNodeId: control.terminalImageNodeId }
            : binding),
    }),
    expectedCode: 'binding_target_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      externalBindingExpectations:
        control.externalBindingExpectations.map((binding, index) =>
          index === 0
            ? {
                ...binding,
                pathPresent: true,
                runtimeValuePresent: true,
                artifactResolved: true,
              }
            : binding),
    }),
    expectedCode: 'authority_promotion_forbidden',
  },
  {
    value: sign({
      ...withoutDigest(control),
      openGateCodes: control.openGateCodes.filter(
        (code) =>
          code
            !== 'ip_adapter_runtime_binding_unavailable_in_stock_host',
      ),
    }),
    expectedCode: 'gate_set_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      controlImagePreparation: {
        ...control.controlImagePreparation,
        customPreprocessorRequired: true,
        controlNetAuxRequired: true,
      },
    }),
    expectedCode: 'control_image_preparation_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      capabilityBoundary: {
        ...control.capabilityBoundary,
        stockIpAdapterNodeObserved: true,
        ipAdapterExecutionSupported: true,
      },
    }),
    expectedCode: 'capability_boundary_invalid',
  },
  {
    value: sign({
      ...withoutDigest(control),
      authorityBoundary: Object.fromEntries(
        Object.keys(control.authorityBoundary).map((key) => [key, true]),
      ),
      rawPromptPresent: true,
      fileOrUrlPresent: true,
      executableWorkflowPresent: true,
      customNodePresent: true,
      providerOrToolIdentifierPresent: true,
      workOrQueueIdentifierPresent: true,
      subjectSpecificRouting: true,
      productionReady: true,
    }),
    expectedCode: 'authority_promotion_forbidden',
  },
  {
    value: {
      ...control,
      expectationDigestSha256: digest('forged'),
    },
    expectedCode: 'digest_mismatch',
  },
]

for (const fixture of forgedExpectations) {
  const result =
    validateLivingFrameControlledComfyUiWorkflowExpectation(fixture.value)
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.ok(
      result.issues.some((issue) => issue.code === fixture.expectedCode),
      `${fixture.expectedCode} must be reported; got ${
        result.issues.map((issue) => issue.code).join(', ')
      }.`,
    )
  }
}

function assertAllAuthorityClosed(
  expectation: LivingFrameControlledComfyUiWorkflowExpectation,
): void {
  assert.equal(
    expectation.authorityBoundary.controlledSourceGraphExpectationOnly,
    true,
  )
  for (const [key, value] of Object.entries(expectation.authorityBoundary)) {
    if (key === 'controlledSourceGraphExpectationOnly') continue
    assert.equal(value, false, `${key} must remain false.`)
  }
  assert.equal(expectation.capabilityBoundary.stockIpAdapterNodeObserved, false)
  assert.equal(
    expectation.capabilityBoundary.stockControlNetAuxPreprocessorObserved,
    false,
  )
  assert.equal(expectation.capabilityBoundary.customNodeExecutionAllowed, false)
  assert.equal(expectation.capabilityBoundary.ipAdapterExecutionSupported, false)
  assert.equal(
    expectation.capabilityBoundary.auraFaceGenerationConditioningSupported,
    false,
  )
  assert.equal(expectation.capabilityBoundary.auraFaceContinuityQaIsSeparate, true)
  assert.equal(expectation.capabilityBoundary.modelWeightsQualified, false)
}

function withoutDigest(
  value: LivingFrameControlledComfyUiWorkflowExpectation,
): Record<string, unknown> {
  const { expectationDigestSha256: _digest, ...draft } = value
  void _digest
  return draft
}

function sign(
  draft: Record<string, unknown>,
): unknown {
  return {
    ...draft,
    expectationDigestSha256: digest(canonicalJson(draft)),
  }
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

console.log(
  'Living Frame controlled ComfyUI workflow smoke passed: '
    + '4 generic profiles, stock built-in graph boundary, '
    + `${forgedExpectations.length + invalidCompileInputs.length} adversarial cases.`,
)
