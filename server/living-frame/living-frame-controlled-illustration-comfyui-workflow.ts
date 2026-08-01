import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledComfyUiAuthorityBoundary,
  LivingFrameControlledComfyUiBindingKind,
  LivingFrameControlledComfyUiCapabilityBoundary,
  LivingFrameControlledComfyUiControlImagePreparation,
  LivingFrameControlledComfyUiExternalBindingExpectation,
  LivingFrameControlledComfyUiGraphEdge,
  LivingFrameControlledComfyUiGraphNode,
  LivingFrameControlledComfyUiIssue,
  LivingFrameControlledComfyUiIssueCode,
  LivingFrameControlledComfyUiNodeRole,
  LivingFrameControlledComfyUiOpenGateCode,
  LivingFrameControlledComfyUiPort,
  LivingFrameControlledComfyUiValidationResult,
  LivingFrameControlledComfyUiWorkflowExpectation,
  LivingFrameControlledComfyUiWorkflowExpectationDraft,
  LivingFrameControlledComfyUiWorkflowProfile,
} from '../../src/types/living-frame-controlled-illustration-comfyui-workflow'
import {
  LIVING_FRAME_CONTROLLED_COMFYUI_BUILTIN_NODE_CLASSES,
  LIVING_FRAME_CONTROLLED_COMFYUI_NODES_SOURCE_DIGEST_SHA256,
  LIVING_FRAME_CONTROLLED_COMFYUI_SOURCE_REVISION,
  LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_CLASS,
  LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_PROFILES,
  LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_VERSION,
} from '../../src/types/living-frame-controlled-illustration-comfyui-workflow'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_DIMENSION = 4096
const MIN_DIMENSION = 256

const INPUT_KEYS = [
  'workflowExpectationId',
  'profile',
  'controlledIllustrationQualificationDigestSha256',
  'controlledIllustrationSourceObservationDigestSha256',
  'outputFrameExpectationDigestSha256',
  'widthPixels',
  'heightPixels',
  'baseCheckpointBindingDigestSha256',
  'positiveConditioningBindingDigestSha256',
  'negativeConditioningBindingDigestSha256',
  'controlNet',
  'lora',
] as const

const AUTHORITY_BOUNDARY:
  LivingFrameControlledComfyUiAuthorityBoundary = Object.freeze({
    controlledSourceGraphExpectationOnly: true,
    sourceCurrentTruthAuthority: false,
    installationAuthority: false,
    packageAuthority: false,
    containerAuthority: false,
    modelWeightAuthority: false,
    promptAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const CAPABILITY_BOUNDARY:
  LivingFrameControlledComfyUiCapabilityBoundary = Object.freeze({
    stockCheckpointLoaderObserved: true,
    stockControlNetNodesObserved: true,
    stockLoraLoaderObserved: true,
    stockIpAdapterNodeObserved: false,
    stockControlNetAuxPreprocessorObserved: false,
    customNodeExecutionAllowed: false,
    customPreprocessorExecutionAllowed: false,
    ipAdapterExecutionSupported: false,
    auraFaceGenerationConditioningSupported: false,
    auraFaceContinuityQaIsSeparate: true,
    copiedAnnotatorsQualified: false,
    modelWeightsQualified: false,
    runtimeDependencyClosurePresent: false,
  })

const COMMON_GATES = [
  'base_checkpoint_artifact_resolution_required',
  'approved_conditioning_resolution_required',
  'runtime_model_weight_manifest_required',
  'sampler_scheduler_allowlist_required',
  'comfyui_execution_host_qualification_required',
  'canonical_artifact_manifest_binding_required',
  'canonical_dispatch_admission_required',
  'ip_adapter_runtime_binding_unavailable_in_stock_host',
] as const satisfies readonly LivingFrameControlledComfyUiOpenGateCode[]

const EXPECTED_ROLES_BY_PROFILE: Readonly<
Record<
  LivingFrameControlledComfyUiWorkflowProfile,
  readonly LivingFrameControlledComfyUiNodeRole[]
>
> = {
  base_txt2img: [
    'base_checkpoint_loader',
    'positive_conditioning_encoder',
    'negative_conditioning_encoder',
    'empty_latent',
    'sampler',
    'vae_decoder',
  ],
  lora_txt2img: [
    'base_checkpoint_loader',
    'lora_loader',
    'positive_conditioning_encoder',
    'negative_conditioning_encoder',
    'empty_latent',
    'sampler',
    'vae_decoder',
  ],
  controlnet_txt2img: [
    'base_checkpoint_loader',
    'positive_conditioning_encoder',
    'negative_conditioning_encoder',
    'controlnet_loader',
    'controlnet_conditioning',
    'empty_latent',
    'sampler',
    'vae_decoder',
  ],
  controlnet_lora_txt2img: [
    'base_checkpoint_loader',
    'lora_loader',
    'positive_conditioning_encoder',
    'negative_conditioning_encoder',
    'controlnet_loader',
    'controlnet_conditioning',
    'empty_latent',
    'sampler',
    'vae_decoder',
  ],
}

const CLASS_BY_ROLE = {
  base_checkpoint_loader: 'CheckpointLoaderSimple',
  lora_loader: 'LoraLoader',
  positive_conditioning_encoder: 'CLIPTextEncode',
  negative_conditioning_encoder: 'CLIPTextEncode',
  empty_latent: 'EmptyLatentImage',
  controlnet_loader: 'ControlNetLoader',
  controlnet_conditioning: 'ControlNetApplyAdvanced',
  sampler: 'KSampler',
  vae_decoder: 'VAEDecode',
} as const

const OUTPUT_PORTS_BY_ROLE: Readonly<
Record<LivingFrameControlledComfyUiNodeRole, readonly LivingFrameControlledComfyUiPort[]>
> = {
  base_checkpoint_loader: ['model', 'clip', 'vae'],
  lora_loader: ['model', 'clip'],
  positive_conditioning_encoder: ['conditioning'],
  negative_conditioning_encoder: ['conditioning'],
  empty_latent: ['latent_image'],
  controlnet_loader: ['control_net'],
  controlnet_conditioning: ['positive', 'negative'],
  sampler: ['samples'],
  vae_decoder: [],
}

const INPUT_PORTS_BY_ROLE: Readonly<
Record<LivingFrameControlledComfyUiNodeRole, readonly LivingFrameControlledComfyUiPort[]>
> = {
  base_checkpoint_loader: [],
  lora_loader: ['model', 'clip'],
  positive_conditioning_encoder: ['clip'],
  negative_conditioning_encoder: ['clip'],
  empty_latent: [],
  controlnet_loader: [],
  controlnet_conditioning: [
    'positive',
    'negative',
    'control_net',
    'image',
  ],
  sampler: ['model', 'positive', 'negative', 'latent_image'],
  vae_decoder: ['samples', 'vae'],
}

const EXTERNAL_TARGET_BY_KIND: Readonly<
Record<
  LivingFrameControlledComfyUiBindingKind,
  { readonly role: LivingFrameControlledComfyUiNodeRole; readonly port: LivingFrameControlledComfyUiPort }
>
> = {
  base_checkpoint_artifact_expectation: {
    role: 'base_checkpoint_loader',
    port: 'ckpt_name',
  },
  positive_conditioning_expectation: {
    role: 'positive_conditioning_encoder',
    port: 'text',
  },
  negative_conditioning_expectation: {
    role: 'negative_conditioning_encoder',
    port: 'text',
  },
  controlnet_checkpoint_artifact_expectation: {
    role: 'controlnet_loader',
    port: 'control_net_name',
  },
  control_image_artifact_expectation: {
    role: 'controlnet_conditioning',
    port: 'image',
  },
  lora_artifact_expectation: {
    role: 'lora_loader',
    port: 'lora_name',
  },
}

export interface CompileLivingFrameControlledComfyUiWorkflowInput {
  readonly workflowExpectationId: string
  readonly profile: LivingFrameControlledComfyUiWorkflowProfile
  readonly controlledIllustrationQualificationDigestSha256: string
  readonly controlledIllustrationSourceObservationDigestSha256: string
  readonly outputFrameExpectationDigestSha256: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly baseCheckpointBindingDigestSha256: string
  readonly positiveConditioningBindingDigestSha256: string
  readonly negativeConditioningBindingDigestSha256: string
  readonly controlNet?: {
    readonly checkpointBindingDigestSha256: string
    readonly controlImageArtifactBindingDigestSha256: string
    readonly strength: number
    readonly startPercent: number
    readonly endPercent: number
  }
  readonly lora?: {
    readonly artifactBindingDigestSha256: string
    readonly strengthModel: number
    readonly strengthClip: number
  }
}

export class LivingFrameControlledComfyUiWorkflowError extends Error {
  readonly issues: readonly LivingFrameControlledComfyUiIssue[]

  constructor(issues: readonly LivingFrameControlledComfyUiIssue[]) {
    super('Living Frame controlled ComfyUI workflow expectation failed.')
    this.name = 'LivingFrameControlledComfyUiWorkflowError'
    this.issues = issues
  }
}

export function compileLivingFrameControlledComfyUiWorkflowExpectation(
  input: CompileLivingFrameControlledComfyUiWorkflowInput,
): LivingFrameControlledComfyUiWorkflowExpectation {
  assertCompileInput(input)
  const roles = EXPECTED_ROLES_BY_PROFILE[input.profile]
  const nodes = roles.map((role, index) =>
    createNode(role, index + 1, input))
  const nodeIdByRole = new Map(
    nodes.map((node) => [node.nodeRole, node.nodeId] as const),
  )
  const edges = createEdges(input.profile, nodeIdByRole)
  const externalBindingExpectations =
    createExternalBindingExpectations(input, nodeIdByRole)
  const openGateCodes = createOpenGates(input.profile)
  const controlImagePreparation =
    createControlImagePreparation(input.profile)
  const draft: LivingFrameControlledComfyUiWorkflowExpectationDraft = {
    contractVersion: LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_VERSION,
    resultClass: LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_CLASS,
    workflowExpectationId: input.workflowExpectationId,
    profile: input.profile,
    sourceBindings: {
      comfyUiRevisionSha1: LIVING_FRAME_CONTROLLED_COMFYUI_SOURCE_REVISION,
      nodesSourceDigestSha256:
        LIVING_FRAME_CONTROLLED_COMFYUI_NODES_SOURCE_DIGEST_SHA256,
      controlledIllustrationQualificationDigestSha256:
        input.controlledIllustrationQualificationDigestSha256,
      controlledIllustrationSourceObservationDigestSha256:
        input.controlledIllustrationSourceObservationDigestSha256,
      outputFrameExpectationDigestSha256:
        input.outputFrameExpectationDigestSha256,
    },
    frameExpectation: {
      widthPixels: input.widthPixels,
      heightPixels: input.heightPixels,
      batchSize: 1,
      exactOutputFrameRevalidationRequired: true,
    },
    nodes,
    edges,
    externalBindingExpectations,
    controlImagePreparation,
    terminalImageNodeId: nodeIdByRole.get('vae_decoder')!,
    openGateCodes,
    capabilityBoundary: CAPABILITY_BOUNDARY,
    authorityBoundary: AUTHORITY_BOUNDARY,
    graphAcyclic: true,
    graphDeterministicallyOrdered: true,
    rawPromptPresent: false,
    fileOrUrlPresent: false,
    executableWorkflowPresent: false,
    customNodePresent: false,
    providerOrToolIdentifierPresent: false,
    workOrQueueIdentifierPresent: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    expectationDigestSha256: digest(draft),
  }
}

export function verifyLivingFrameControlledComfyUiWorkflowExpectation(
  value: unknown,
): value is LivingFrameControlledComfyUiWorkflowExpectation {
  return validateLivingFrameControlledComfyUiWorkflowExpectation(value).ok
}

export function validateLivingFrameControlledComfyUiWorkflowExpectation(
  value: unknown,
): LivingFrameControlledComfyUiValidationResult {
  const issues: LivingFrameControlledComfyUiIssue[] = []
  if (!isRecord(value)) {
    return invalidResult('input_invalid', '$')
  }
  const expectedKeys = [
    'contractVersion',
    'resultClass',
    'workflowExpectationId',
    'profile',
    'sourceBindings',
    'frameExpectation',
    'nodes',
    'edges',
    'externalBindingExpectations',
    'controlImagePreparation',
    'terminalImageNodeId',
    'openGateCodes',
    'capabilityBoundary',
    'authorityBoundary',
    'graphAcyclic',
    'graphDeterministicallyOrdered',
    'rawPromptPresent',
    'fileOrUrlPresent',
    'executableWorkflowPresent',
    'customNodePresent',
    'providerOrToolIdentifierPresent',
    'workOrQueueIdentifierPresent',
    'subjectSpecificRouting',
    'productionReady',
    'expectationDigestSha256',
  ] as const
  pushExactKeyIssues(value, expectedKeys, '$', issues)
  if (issues.length > 0) return { ok: false, issues }

  const expectation =
    value as unknown as LivingFrameControlledComfyUiWorkflowExpectation
  if (
    expectation.contractVersion
      !== LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_VERSION
    || expectation.resultClass
      !== LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_CLASS
  ) push(issues, 'input_invalid', '$')
  if (!SAFE_ID.test(expectation.workflowExpectationId)) {
    push(issues, 'unsafe_input', '$.workflowExpectationId')
  }
  if (!includes(LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_PROFILES, expectation.profile)) {
    push(issues, 'profile_invalid', '$.profile')
  }
  validateSourceBindings(expectation.sourceBindings, issues)
  validateFrame(expectation.frameExpectation, issues)
  validateNodes(expectation, issues)
  validateEdges(expectation, issues)
  validateBindings(expectation, issues)
  validateControlImagePreparation(expectation, issues)
  validateGates(expectation, issues)
  if (canonicalJson(expectation.capabilityBoundary) !== canonicalJson(CAPABILITY_BOUNDARY)) {
    push(issues, 'capability_boundary_invalid', '$.capabilityBoundary')
  }
  if (canonicalJson(expectation.authorityBoundary) !== canonicalJson(AUTHORITY_BOUNDARY)) {
    push(issues, 'authority_promotion_forbidden', '$.authorityBoundary')
  }
  if (
    expectation.graphAcyclic !== true
    || expectation.graphDeterministicallyOrdered !== true
    || expectation.rawPromptPresent !== false
    || expectation.fileOrUrlPresent !== false
    || expectation.executableWorkflowPresent !== false
    || expectation.customNodePresent !== false
    || expectation.providerOrToolIdentifierPresent !== false
    || expectation.workOrQueueIdentifierPresent !== false
    || expectation.productionReady !== false
  ) push(issues, 'authority_promotion_forbidden', '$')
  if (expectation.subjectSpecificRouting !== false) {
    push(issues, 'subject_specific_routing_forbidden', '$.subjectSpecificRouting')
  }
  if (
    typeof expectation.expectationDigestSha256 !== 'string'
    || !SHA256.test(expectation.expectationDigestSha256)
  ) {
    push(issues, 'digest_mismatch', '$.expectationDigestSha256')
  } else {
    const { expectationDigestSha256, ...draft } = expectation
    if (digest(draft) !== expectationDigestSha256) {
      push(issues, 'digest_mismatch', '$.expectationDigestSha256')
    }
  }
  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, expectation }
}

function createNode(
  role: LivingFrameControlledComfyUiNodeRole,
  order: number,
  input: CompileLivingFrameControlledComfyUiWorkflowInput,
): LivingFrameControlledComfyUiGraphNode {
  const literalInputs: LivingFrameControlledComfyUiGraphNode['literalInputs'] =
    role === 'empty_latent'
      ? {
          kind: 'empty_latent',
          widthPixels: input.widthPixels,
          heightPixels: input.heightPixels,
          batchSize: 1,
        }
      : role === 'controlnet_conditioning'
        ? {
            kind: 'controlnet_application',
            strength: input.controlNet!.strength,
            startPercent: input.controlNet!.startPercent,
            endPercent: input.controlNet!.endPercent,
          }
        : role === 'lora_loader'
          ? {
              kind: 'lora_strength',
              strengthModel: input.lora!.strengthModel,
              strengthClip: input.lora!.strengthClip,
            }
          : role === 'sampler'
            ? {
                kind: 'sampler_policy',
                seedBindingRequired: true,
                samplerAllowlistBindingRequired: true,
                schedulerAllowlistBindingRequired: true,
                stepCountBindingRequired: true,
                cfgBindingRequired: true,
                denoiseBindingRequired: true,
              }
            : { kind: 'none' }
  return {
    nodeId: `node.${String(order).padStart(2, '0')}.${role}`,
    order,
    nodeClass: CLASS_BY_ROLE[role],
    nodeRole: role,
    literalInputs,
    builtinSourceObservedOnly: true,
    executableNode: false,
  }
}

function createEdges(
  profile: LivingFrameControlledComfyUiWorkflowProfile,
  ids: ReadonlyMap<LivingFrameControlledComfyUiNodeRole, string>,
): readonly LivingFrameControlledComfyUiGraphEdge[] {
  const usesLora =
    profile === 'lora_txt2img'
    || profile === 'controlnet_lora_txt2img'
  const usesControlNet =
    profile === 'controlnet_txt2img'
    || profile === 'controlnet_lora_txt2img'
  const modelSource = usesLora
    ? 'lora_loader'
    : 'base_checkpoint_loader'
  const clipSource = modelSource
  const conditioningTarget = usesControlNet
    ? 'controlnet_conditioning'
    : 'sampler'
  const specs: Array<readonly [
    LivingFrameControlledComfyUiNodeRole,
    LivingFrameControlledComfyUiPort,
    LivingFrameControlledComfyUiNodeRole,
    LivingFrameControlledComfyUiPort,
  ]> = []
  if (usesLora) {
    specs.push(
      ['base_checkpoint_loader', 'model', 'lora_loader', 'model'],
      ['base_checkpoint_loader', 'clip', 'lora_loader', 'clip'],
    )
  }
  specs.push(
    [clipSource, 'clip', 'positive_conditioning_encoder', 'clip'],
    [clipSource, 'clip', 'negative_conditioning_encoder', 'clip'],
    [
      'positive_conditioning_encoder',
      'conditioning',
      conditioningTarget,
      'positive',
    ],
    [
      'negative_conditioning_encoder',
      'conditioning',
      conditioningTarget,
      'negative',
    ],
  )
  if (usesControlNet) {
    specs.push(
      [
        'controlnet_loader',
        'control_net',
        'controlnet_conditioning',
        'control_net',
      ],
      ['controlnet_conditioning', 'positive', 'sampler', 'positive'],
      ['controlnet_conditioning', 'negative', 'sampler', 'negative'],
    )
  }
  specs.push(
    [modelSource, 'model', 'sampler', 'model'],
    ['empty_latent', 'latent_image', 'sampler', 'latent_image'],
    ['sampler', 'samples', 'vae_decoder', 'samples'],
    ['base_checkpoint_loader', 'vae', 'vae_decoder', 'vae'],
  )
  return specs.map(([fromRole, fromPort, toRole, toPort], index) => ({
    edgeId: `edge.${String(index + 1).padStart(2, '0')}`,
    fromNodeId: ids.get(fromRole)!,
    fromPort,
    toNodeId: ids.get(toRole)!,
    toPort,
  }))
}

function createExternalBindingExpectations(
  input: CompileLivingFrameControlledComfyUiWorkflowInput,
  ids: ReadonlyMap<LivingFrameControlledComfyUiNodeRole, string>,
): readonly LivingFrameControlledComfyUiExternalBindingExpectation[] {
  const values: Array<readonly [
    LivingFrameControlledComfyUiBindingKind,
    string,
  ]> = [
    [
      'base_checkpoint_artifact_expectation',
      input.baseCheckpointBindingDigestSha256,
    ],
    [
      'positive_conditioning_expectation',
      input.positiveConditioningBindingDigestSha256,
    ],
    [
      'negative_conditioning_expectation',
      input.negativeConditioningBindingDigestSha256,
    ],
  ]
  if (input.controlNet) {
    values.push(
      [
        'controlnet_checkpoint_artifact_expectation',
        input.controlNet.checkpointBindingDigestSha256,
      ],
      [
        'control_image_artifact_expectation',
        input.controlNet.controlImageArtifactBindingDigestSha256,
      ],
    )
  }
  if (input.lora) {
    values.push([
      'lora_artifact_expectation',
      input.lora.artifactBindingDigestSha256,
    ])
  }
  return values.map(([bindingKind, bindingDigestSha256], index) => {
    const target = EXTERNAL_TARGET_BY_KIND[bindingKind]
    return {
      bindingExpectationId:
        `binding.${String(index + 1).padStart(2, '0')}.${bindingKind}`,
      bindingKind,
      bindingDigestSha256,
      targetNodeId: ids.get(target.role)!,
      targetPort: target.port,
      runtimeValuePresent: false,
      filenamePresent: false,
      pathPresent: false,
      urlPresent: false,
      promptTextPresent: false,
      providerOrToolIdPresent: false,
      artifactResolved: false,
    }
  })
}

function createOpenGates(
  profile: LivingFrameControlledComfyUiWorkflowProfile,
): readonly LivingFrameControlledComfyUiOpenGateCode[] {
  const gates: LivingFrameControlledComfyUiOpenGateCode[] = [...COMMON_GATES]
  const usesControlNet =
    profile === 'controlnet_txt2img'
    || profile === 'controlnet_lora_txt2img'
  const usesLora =
    profile === 'lora_txt2img'
    || profile === 'controlnet_lora_txt2img'
  if (usesControlNet) {
    gates.push(
      'controlnet_checkpoint_artifact_resolution_required',
      'control_image_artifact_resolution_required',
    )
  }
  if (usesLora) {
    gates.push('lora_artifact_resolution_required')
  }
  return [...gates].sort()
}

function createControlImagePreparation(
  profile: LivingFrameControlledComfyUiWorkflowProfile,
): LivingFrameControlledComfyUiControlImagePreparation {
  const usesControlNet =
    profile === 'controlnet_txt2img'
    || profile === 'controlnet_lora_txt2img'
  return usesControlNet
    ? {
        mode: 'external_precomputed_control_image_only',
        controlImageRequired: true,
        externalContentAddressedArtifactRequired: true,
        inGraphPreprocessorPresent: false,
        customPreprocessorRequired: false,
        controlNetAuxRequired: false,
        controlImageEvidenceAndQaRequired: true,
      }
    : {
        mode: 'not_applicable',
        controlImageRequired: false,
        externalContentAddressedArtifactRequired: false,
        inGraphPreprocessorPresent: false,
        customPreprocessorRequired: false,
        controlNetAuxRequired: false,
        controlImageEvidenceAndQaRequired: false,
      }
}

function assertCompileInput(
  value: CompileLivingFrameControlledComfyUiWorkflowInput,
): void {
  const issues: LivingFrameControlledComfyUiIssue[] = []
  if (!isRecord(value)) throw new LivingFrameControlledComfyUiWorkflowError([
    { code: 'input_invalid', path: '$' },
  ])
  pushExactKeyIssues(
    value as unknown as Record<string, unknown>,
    INPUT_KEYS,
    '$',
    issues,
    true,
  )
  if (typeof value.workflowExpectationId !== 'string'
    || !SAFE_ID.test(value.workflowExpectationId)) {
    push(issues, 'unsafe_input', '$.workflowExpectationId')
  }
  if (!includes(LIVING_FRAME_CONTROLLED_COMFYUI_WORKFLOW_PROFILES, value.profile)) {
    push(issues, 'profile_invalid', '$.profile')
  }
  for (const [key, digestValue] of Object.entries({
    controlledIllustrationQualificationDigestSha256:
      value.controlledIllustrationQualificationDigestSha256,
    controlledIllustrationSourceObservationDigestSha256:
      value.controlledIllustrationSourceObservationDigestSha256,
    outputFrameExpectationDigestSha256:
      value.outputFrameExpectationDigestSha256,
    baseCheckpointBindingDigestSha256:
      value.baseCheckpointBindingDigestSha256,
    positiveConditioningBindingDigestSha256:
      value.positiveConditioningBindingDigestSha256,
    negativeConditioningBindingDigestSha256:
      value.negativeConditioningBindingDigestSha256,
  })) {
    if (typeof digestValue !== 'string' || !SHA256.test(digestValue)) {
      push(issues, 'source_binding_invalid', `$.${key}`)
    }
  }
  if (!validDimension(value.widthPixels) || !validDimension(value.heightPixels)) {
    push(issues, 'frame_invalid', '$.frame')
  }
  const requiresControlNet =
    value.profile === 'controlnet_txt2img'
    || value.profile === 'controlnet_lora_txt2img'
  const requiresLora =
    value.profile === 'lora_txt2img'
    || value.profile === 'controlnet_lora_txt2img'
  if (requiresControlNet !== isRecord(value.controlNet)) {
    push(issues, 'profile_configuration_invalid', '$.controlNet')
  } else if (requiresControlNet) {
    validateControlNetInput(value.controlNet!, issues)
  }
  if (requiresLora !== isRecord(value.lora)) {
    push(issues, 'profile_configuration_invalid', '$.lora')
  } else if (requiresLora) {
    validateLoraInput(value.lora!, issues)
  }
  if (issues.length > 0) {
    throw new LivingFrameControlledComfyUiWorkflowError(dedupeIssues(issues))
  }
}

function validateControlNetInput(
  value: Record<string, unknown>,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  pushExactKeyIssues(value, [
    'checkpointBindingDigestSha256',
    'controlImageArtifactBindingDigestSha256',
    'strength',
    'startPercent',
    'endPercent',
  ], '$.controlNet', issues)
  if (!SHA256.test(String(value.checkpointBindingDigestSha256))) {
    push(issues, 'source_binding_invalid', '$.controlNet.checkpointBindingDigestSha256')
  }
  if (!SHA256.test(String(value.controlImageArtifactBindingDigestSha256))) {
    push(issues, 'source_binding_invalid', '$.controlNet.controlImageArtifactBindingDigestSha256')
  }
  if (!finiteInRange(value.strength, 0, 10)
    || !finiteInRange(value.startPercent, 0, 1)
    || !finiteInRange(value.endPercent, 0, 1)
    || Number(value.startPercent) >= Number(value.endPercent)) {
    push(issues, 'profile_configuration_invalid', '$.controlNet')
  }
}

function validateLoraInput(
  value: Record<string, unknown>,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  pushExactKeyIssues(value, [
    'artifactBindingDigestSha256',
    'strengthModel',
    'strengthClip',
  ], '$.lora', issues)
  if (!SHA256.test(String(value.artifactBindingDigestSha256))) {
    push(issues, 'source_binding_invalid', '$.lora.artifactBindingDigestSha256')
  }
  if (!finiteInRange(value.strengthModel, -10, 10)
    || !finiteInRange(value.strengthClip, -10, 10)) {
    push(issues, 'profile_configuration_invalid', '$.lora')
  }
}

function validateSourceBindings(
  value: unknown,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  if (!isRecord(value)) {
    push(issues, 'source_binding_invalid', '$.sourceBindings')
    return
  }
  pushExactKeyIssues(value, [
    'comfyUiRevisionSha1',
    'nodesSourceDigestSha256',
    'controlledIllustrationQualificationDigestSha256',
    'controlledIllustrationSourceObservationDigestSha256',
    'outputFrameExpectationDigestSha256',
  ], '$.sourceBindings', issues)
  if (
    value.comfyUiRevisionSha1 !== LIVING_FRAME_CONTROLLED_COMFYUI_SOURCE_REVISION
    || value.nodesSourceDigestSha256
      !== LIVING_FRAME_CONTROLLED_COMFYUI_NODES_SOURCE_DIGEST_SHA256
  ) push(issues, 'source_binding_invalid', '$.sourceBindings')
  for (const key of [
    'controlledIllustrationQualificationDigestSha256',
    'controlledIllustrationSourceObservationDigestSha256',
    'outputFrameExpectationDigestSha256',
  ] as const) {
    if (typeof value[key] !== 'string' || !SHA256.test(value[key])) {
      push(issues, 'source_binding_invalid', `$.sourceBindings.${key}`)
    }
  }
}

function validateFrame(
  value: unknown,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  if (!isRecord(value)) {
    push(issues, 'frame_invalid', '$.frameExpectation')
    return
  }
  pushExactKeyIssues(value, [
    'widthPixels',
    'heightPixels',
    'batchSize',
    'exactOutputFrameRevalidationRequired',
  ], '$.frameExpectation', issues)
  if (
    !validDimension(value.widthPixels)
    || !validDimension(value.heightPixels)
    || value.batchSize !== 1
    || value.exactOutputFrameRevalidationRequired !== true
  ) push(issues, 'frame_invalid', '$.frameExpectation')
}

function validateNodes(
  expectation: LivingFrameControlledComfyUiWorkflowExpectation,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  if (!Array.isArray(expectation.nodes)) {
    push(issues, 'node_set_invalid', '$.nodes')
    return
  }
  const expectedRoles = EXPECTED_ROLES_BY_PROFILE[expectation.profile]
  if (!expectedRoles || expectation.nodes.length !== expectedRoles.length) {
    push(issues, 'node_set_invalid', '$.nodes')
    return
  }
  const ids = new Set<string>()
  expectation.nodes.forEach((node, index) => {
    const path = `$.nodes[${index}]`
    if (!isRecord(node)) {
      push(issues, 'node_set_invalid', path)
      return
    }
    pushExactKeyIssues(node, [
      'nodeId',
      'order',
      'nodeClass',
      'nodeRole',
      'literalInputs',
      'builtinSourceObservedOnly',
      'executableNode',
    ], path, issues)
    if (typeof node.nodeId !== 'string' || !SAFE_ID.test(node.nodeId)) {
      push(issues, 'node_set_invalid', `${path}.nodeId`)
    } else if (ids.has(node.nodeId)) {
      push(issues, 'duplicate_node', `${path}.nodeId`)
    } else ids.add(node.nodeId)
    if (node.order !== index + 1) {
      push(issues, 'node_order_invalid', `${path}.order`)
    }
    const expectedRole = expectedRoles[index]
    if (node.nodeRole !== expectedRole) {
      push(issues, 'node_role_invalid', `${path}.nodeRole`)
    }
    if (
      !includes(LIVING_FRAME_CONTROLLED_COMFYUI_BUILTIN_NODE_CLASSES, node.nodeClass)
      || (expectedRole && node.nodeClass !== CLASS_BY_ROLE[expectedRole])
    ) push(issues, 'node_class_invalid', `${path}.nodeClass`)
    validateLiteralInputs(
      node as unknown as LivingFrameControlledComfyUiGraphNode,
      path,
      expectation.frameExpectation,
      issues,
    )
    if (
      node.builtinSourceObservedOnly !== true
      || node.executableNode !== false
    ) push(issues, 'authority_promotion_forbidden', path)
  })
  const terminal = expectation.nodes.find(
    (node) => node.nodeId === expectation.terminalImageNodeId,
  )
  if (!terminal || terminal.nodeRole !== 'vae_decoder') {
    push(issues, 'output_binding_invalid', '$.terminalImageNodeId')
  }
}

function validateLiteralInputs(
  node: LivingFrameControlledComfyUiGraphNode,
  path: string,
  frame: LivingFrameControlledComfyUiWorkflowExpectation['frameExpectation'],
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  if (!isRecord(node.literalInputs) || typeof node.literalInputs.kind !== 'string') {
    push(issues, 'node_input_contract_invalid', `${path}.literalInputs`)
    return
  }
  const literal = node.literalInputs
  const expectedKind =
    node.nodeRole === 'empty_latent'
      ? 'empty_latent'
      : node.nodeRole === 'controlnet_conditioning'
        ? 'controlnet_application'
        : node.nodeRole === 'lora_loader'
          ? 'lora_strength'
          : node.nodeRole === 'sampler'
            ? 'sampler_policy'
            : 'none'
  if (literal.kind !== expectedKind) {
    push(issues, 'node_input_contract_invalid', `${path}.literalInputs.kind`)
    return
  }
  if (literal.kind === 'none') {
    pushExactKeyIssues(literal, ['kind'], `${path}.literalInputs`, issues)
  } else if (literal.kind === 'empty_latent') {
    pushExactKeyIssues(literal, [
      'kind',
      'widthPixels',
      'heightPixels',
      'batchSize',
    ], `${path}.literalInputs`, issues)
    if (
      literal.widthPixels !== frame.widthPixels
      || literal.heightPixels !== frame.heightPixels
      || literal.batchSize !== 1
    ) push(issues, 'node_input_contract_invalid', `${path}.literalInputs`)
  } else if (literal.kind === 'controlnet_application') {
    pushExactKeyIssues(literal, [
      'kind',
      'strength',
      'startPercent',
      'endPercent',
    ], `${path}.literalInputs`, issues)
    if (
      !finiteInRange(literal.strength, 0, 10)
      || !finiteInRange(literal.startPercent, 0, 1)
      || !finiteInRange(literal.endPercent, 0, 1)
      || literal.startPercent >= literal.endPercent
    ) push(issues, 'node_input_contract_invalid', `${path}.literalInputs`)
  } else if (literal.kind === 'lora_strength') {
    pushExactKeyIssues(literal, [
      'kind',
      'strengthModel',
      'strengthClip',
    ], `${path}.literalInputs`, issues)
    if (
      !finiteInRange(literal.strengthModel, -10, 10)
      || !finiteInRange(literal.strengthClip, -10, 10)
    ) push(issues, 'node_input_contract_invalid', `${path}.literalInputs`)
  } else if (literal.kind === 'sampler_policy') {
    pushExactKeyIssues(literal, [
      'kind',
      'seedBindingRequired',
      'samplerAllowlistBindingRequired',
      'schedulerAllowlistBindingRequired',
      'stepCountBindingRequired',
      'cfgBindingRequired',
      'denoiseBindingRequired',
    ], `${path}.literalInputs`, issues)
    if (Object.values(literal).slice(1).some((entry) => entry !== true)) {
      push(issues, 'node_input_contract_invalid', `${path}.literalInputs`)
    }
  }
}

function validateEdges(
  expectation: LivingFrameControlledComfyUiWorkflowExpectation,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  if (!Array.isArray(expectation.edges)) {
    push(issues, 'edge_set_invalid', '$.edges')
    return
  }
  const expectedNodeMap = new Map(
    expectation.nodes.map((node) => [node.nodeId, node]),
  )
  const edgeIds = new Set<string>()
  const edgeTuples = new Set<string>()
  expectation.edges.forEach((edge, index) => {
    const path = `$.edges[${index}]`
    if (!isRecord(edge)) {
      push(issues, 'edge_set_invalid', path)
      return
    }
    pushExactKeyIssues(edge, [
      'edgeId',
      'fromNodeId',
      'fromPort',
      'toNodeId',
      'toPort',
    ], path, issues)
    if (typeof edge.edgeId !== 'string' || !SAFE_ID.test(edge.edgeId)) {
      push(issues, 'edge_set_invalid', `${path}.edgeId`)
    } else if (edgeIds.has(edge.edgeId)) {
      push(issues, 'duplicate_edge', `${path}.edgeId`)
    } else edgeIds.add(edge.edgeId)
    const from = expectedNodeMap.get(String(edge.fromNodeId))
    const to = expectedNodeMap.get(String(edge.toNodeId))
    if (!from || !to) {
      push(issues, 'dangling_edge', path)
      return
    }
    if (
      !OUTPUT_PORTS_BY_ROLE[from.nodeRole].includes(
        edge.fromPort as LivingFrameControlledComfyUiPort,
      )
      || !INPUT_PORTS_BY_ROLE[to.nodeRole].includes(
        edge.toPort as LivingFrameControlledComfyUiPort,
      )
    ) push(issues, 'edge_set_invalid', path)
    const tuple = `${edge.fromNodeId}:${edge.fromPort}->${edge.toNodeId}:${edge.toPort}`
    if (edgeTuples.has(tuple)) push(issues, 'duplicate_edge', path)
    edgeTuples.add(tuple)
  })
  if (hasCycle(expectation.nodes, expectation.edges)) {
    push(issues, 'cyclic_graph', '$.edges')
  }
  if (
    expectation.profile in EXPECTED_ROLES_BY_PROFILE
    && canonicalJson(expectation.edges)
      !== canonicalJson(createEdges(
        expectation.profile,
        new Map(expectation.nodes.map(
          (node) => [node.nodeRole, node.nodeId] as const,
        )),
      ))
  ) push(issues, 'edge_set_invalid', '$.edges')
}

function validateBindings(
  expectation: LivingFrameControlledComfyUiWorkflowExpectation,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  if (!Array.isArray(expectation.externalBindingExpectations)) {
    push(issues, 'binding_set_invalid', '$.externalBindingExpectations')
    return
  }
  const nodeById = new Map(
    expectation.nodes.map((node) => [node.nodeId, node]),
  )
  const ids = new Set<string>()
  const kinds = new Set<LivingFrameControlledComfyUiBindingKind>()
  expectation.externalBindingExpectations.forEach((binding, index) => {
    const path = `$.externalBindingExpectations[${index}]`
    if (!isRecord(binding)) {
      push(issues, 'binding_set_invalid', path)
      return
    }
    pushExactKeyIssues(binding, [
      'bindingExpectationId',
      'bindingKind',
      'bindingDigestSha256',
      'targetNodeId',
      'targetPort',
      'runtimeValuePresent',
      'filenamePresent',
      'pathPresent',
      'urlPresent',
      'promptTextPresent',
      'providerOrToolIdPresent',
      'artifactResolved',
    ], path, issues)
    if (
      typeof binding.bindingExpectationId !== 'string'
      || !SAFE_ID.test(binding.bindingExpectationId)
    ) push(issues, 'binding_set_invalid', `${path}.bindingExpectationId`)
    else if (ids.has(binding.bindingExpectationId)) {
      push(issues, 'duplicate_binding', `${path}.bindingExpectationId`)
    } else ids.add(binding.bindingExpectationId)
    const bindingKind = binding.bindingKind as unknown
    const validBindingKind =
      typeof bindingKind === 'string'
      && Object.hasOwn(EXTERNAL_TARGET_BY_KIND, bindingKind)
    if (!validBindingKind) {
      push(issues, 'binding_set_invalid', `${path}.bindingKind`)
    } else if (
      kinds.has(bindingKind as LivingFrameControlledComfyUiBindingKind)
    ) {
      push(issues, 'duplicate_binding', `${path}.bindingKind`)
    } else {
      kinds.add(bindingKind as LivingFrameControlledComfyUiBindingKind)
    }
    if (
      typeof binding.bindingDigestSha256 !== 'string'
      || !SHA256.test(binding.bindingDigestSha256)
    ) {
      push(issues, 'binding_set_invalid', `${path}.bindingDigestSha256`)
    }
    const node = typeof binding.targetNodeId === 'string'
      ? nodeById.get(binding.targetNodeId)
      : undefined
    const expectedTarget = validBindingKind
      ? EXTERNAL_TARGET_BY_KIND[
          bindingKind as LivingFrameControlledComfyUiBindingKind
        ]
      : undefined
    if (
      !node
      || !expectedTarget
      || node.nodeRole !== expectedTarget.role
      || binding.targetPort !== expectedTarget.port
    ) push(issues, 'binding_target_invalid', path)
    if (
      binding.runtimeValuePresent !== false
      || binding.filenamePresent !== false
      || binding.pathPresent !== false
      || binding.urlPresent !== false
      || binding.promptTextPresent !== false
      || binding.providerOrToolIdPresent !== false
      || binding.artifactResolved !== false
    ) push(issues, 'authority_promotion_forbidden', path)
  })
  const requiredKinds: LivingFrameControlledComfyUiBindingKind[] = [
    'base_checkpoint_artifact_expectation',
    'positive_conditioning_expectation',
    'negative_conditioning_expectation',
  ]
  const usesControlNet =
    expectation.profile === 'controlnet_txt2img'
    || expectation.profile === 'controlnet_lora_txt2img'
  const usesLora =
    expectation.profile === 'lora_txt2img'
    || expectation.profile === 'controlnet_lora_txt2img'
  if (usesControlNet) {
    requiredKinds.push(
      'controlnet_checkpoint_artifact_expectation',
      'control_image_artifact_expectation',
    )
  }
  if (usesLora) {
    requiredKinds.push('lora_artifact_expectation')
  }
  if (
    canonicalJson([...kinds].sort())
      !== canonicalJson([...requiredKinds].sort())
  ) push(issues, 'binding_set_invalid', '$.externalBindingExpectations')
}

function validateGates(
  expectation: LivingFrameControlledComfyUiWorkflowExpectation,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  if (
    !Array.isArray(expectation.openGateCodes)
    || new Set(expectation.openGateCodes).size
      !== expectation.openGateCodes.length
    || canonicalJson(expectation.openGateCodes)
      !== canonicalJson(createOpenGates(expectation.profile))
  ) push(issues, 'gate_set_invalid', '$.openGateCodes')
}

function hasCycle(
  nodes: readonly LivingFrameControlledComfyUiGraphNode[],
  edges: readonly LivingFrameControlledComfyUiGraphEdge[],
): boolean {
  const adjacency = new Map(nodes.map((node) => [node.nodeId, [] as string[]]))
  for (const edge of edges) {
    adjacency.get(edge.fromNodeId)?.push(edge.toNodeId)
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const next of adjacency.get(id) ?? []) {
      if (visit(next)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }
  return nodes.some((node) => visit(node.nodeId))
}

function pushExactKeyIssues(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: LivingFrameControlledComfyUiIssue[],
  allowOptional = false,
): void {
  const expectedSet = new Set(expected)
  for (const key of Object.keys(value)) {
    if (!expectedSet.has(key)) push(issues, 'unknown_key', `${path}.${key}`)
  }
  if (!allowOptional) {
    for (const key of expected) {
      if (!Object.hasOwn(value, key)) push(issues, 'unknown_key', `${path}.${key}`)
    }
  } else {
    for (const key of expected.slice(0, 10)) {
      if (!Object.hasOwn(value, key)) push(issues, 'unknown_key', `${path}.${key}`)
    }
  }
}

function validateControlImagePreparation(
  expectation: LivingFrameControlledComfyUiWorkflowExpectation,
  issues: LivingFrameControlledComfyUiIssue[],
): void {
  const path = '$.controlImagePreparation'
  const value = expectation.controlImagePreparation
  if (!isRecord(value)) {
    push(issues, 'control_image_preparation_invalid', path)
    return
  }
  pushExactKeyIssues(value, [
    'mode',
    'controlImageRequired',
    'externalContentAddressedArtifactRequired',
    'inGraphPreprocessorPresent',
    'customPreprocessorRequired',
    'controlNetAuxRequired',
    'controlImageEvidenceAndQaRequired',
  ], path, issues)
  if (
    canonicalJson(value)
      !== canonicalJson(createControlImagePreparation(expectation.profile))
  ) push(issues, 'control_image_preparation_invalid', path)
}

function validDimension(value: unknown): boolean {
  return Number.isInteger(value)
    && Number(value) >= MIN_DIMENSION
    && Number(value) <= MAX_DIMENSION
    && Number(value) % 8 === 0
}

function finiteInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= min
    && value <= max
}

function invalidResult(
  code: LivingFrameControlledComfyUiIssueCode,
  path: string,
): LivingFrameControlledComfyUiValidationResult {
  return { ok: false, issues: [{ code, path }] }
}

function push(
  issues: LivingFrameControlledComfyUiIssue[],
  code: LivingFrameControlledComfyUiIssueCode,
  path: string,
): void {
  issues.push({ code, path })
}

function dedupeIssues(
  issues: readonly LivingFrameControlledComfyUiIssue[],
): readonly LivingFrameControlledComfyUiIssue[] {
  return [...new Map(
    issues.map((issue) => [`${issue.code}:${issue.path}`, issue]),
  ).values()]
}

function includes<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && values.includes(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}
