import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledClipVisionFamily,
  LivingFrameControlledModelFamily,
  LivingFrameControlledModelFamilyBinding,
  LivingFrameControlledModelFamilyBindingAuthority,
  LivingFrameControlledModelFamilyBindingDraft,
  LivingFrameControlledModelFamilyExpectation,
  LivingFrameControlledModelFamilyIssue,
  LivingFrameControlledModelFamilyIssueCode,
} from '../../src/types/living-frame-controlled-model-family-binding'
import {
  LIVING_FRAME_CONTROLLED_CLIP_VISION_FAMILIES,
  LIVING_FRAME_CONTROLLED_MODEL_FAMILIES,
  LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_CLASS,
  LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_VERSION,
  LIVING_FRAME_CONTROLLED_MODEL_FAMILY_OPEN_GATES,
} from '../../src/types/living-frame-controlled-model-family-binding'
import type {
  LivingFrameControlledComfyUiWorkflowExpectation,
} from '../../src/types/living-frame-controlled-illustration-comfyui-workflow'
import type {
  LivingFrameIpAdapterMergedWorkflow,
} from '../../src/types/living-frame-ipadapter-merged-workflow'
import {
  validateLivingFrameControlImageWorkflowBinding,
} from './living-frame-control-image-workflow-binding'
import {
  validateLivingFrameControlledComfyUiWorkflowExpectation,
} from './living-frame-controlled-illustration-comfyui-workflow'
import {
  verifyLivingFrameIpAdapterMergedWorkflow,
} from './living-frame-ipadapter-merged-workflow'
import {
  validateLivingFrameIpAdapterWorkflowExtension,
} from './living-frame-ipadapter-workflow-extension'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SHA256 = /^[a-f0-9]{64}$/

const AUTHORITY_BOUNDARY:
  LivingFrameControlledModelFamilyBindingAuthority =
  Object.freeze({
    controlledFamilyCoherenceExpectationOnly: true,
    currentArtifactAuthority: false,
    artifactRepositoryAuthority: false,
    artifactManifestAuthority: false,
    artifactMetadataAuthority: false,
    modelCompatibilityAuthority: false,
    modelWeightAuthority: false,
    legalReviewAuthority: false,
    installationAuthority: false,
    packageAuthority: false,
    containerAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    semanticRouteAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
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

const INPUT_KEYS = [
  'bindingId',
  'stockWorkflowExpectation',
  'controlImageWorkflowBinding',
  'ipAdapterWorkflowExtension',
  'ipAdapterMergedWorkflow',
  'baseModelFamily',
  'controlNetModelFamily',
  'loraBaseModelFamily',
  'genericIpAdapterBaseModelFamily',
  'clipVisionFamily',
] as const

export interface CreateLivingFrameControlledModelFamilyBindingInput {
  readonly bindingId: string
  readonly stockWorkflowExpectation: unknown
  readonly controlImageWorkflowBinding?: unknown
  readonly ipAdapterWorkflowExtension?: unknown
  readonly ipAdapterMergedWorkflow?: unknown
  readonly baseModelFamily: LivingFrameControlledModelFamily
  readonly controlNetModelFamily?: LivingFrameControlledModelFamily
  readonly loraBaseModelFamily?: LivingFrameControlledModelFamily
  readonly genericIpAdapterBaseModelFamily?:
    LivingFrameControlledModelFamily
  readonly clipVisionFamily?: LivingFrameControlledClipVisionFamily
}

export class LivingFrameControlledModelFamilyBindingError extends Error {
  readonly issues: readonly LivingFrameControlledModelFamilyIssue[]

  constructor(issues: readonly LivingFrameControlledModelFamilyIssue[]) {
    super('Living Frame controlled model-family binding failed.')
    this.name = 'LivingFrameControlledModelFamilyBindingError'
    this.issues = issues
  }
}

export function createLivingFrameControlledModelFamilyBinding(
  input: CreateLivingFrameControlledModelFamilyBindingInput,
): LivingFrameControlledModelFamilyBinding {
  assertInputShape(input)
  const workflowResult =
    validateLivingFrameControlledComfyUiWorkflowExpectation(
      input.stockWorkflowExpectation,
    )
  if (!workflowResult.ok) {
    throw invalid('stock_workflow_invalid', '$.stockWorkflowExpectation')
  }
  const workflow = workflowResult.expectation
  const usesControlNet =
    workflow.profile === 'controlnet_txt2img'
    || workflow.profile === 'controlnet_lora_txt2img'
  const usesLora =
    workflow.profile === 'lora_txt2img'
    || workflow.profile === 'controlnet_lora_txt2img'
  const controlImageBinding = resolveControlImageBinding(
    input,
    workflow,
    usesControlNet,
  )
  const ipAdapter = resolveIpAdapterBinding(input, workflow)
  assertFamilyDeclarations(input, usesControlNet, usesLora, ipAdapter.present)
  const familyExpectations = buildFamilyExpectations(
    input,
    workflow,
    ipAdapter.merged,
  )
  const draft: LivingFrameControlledModelFamilyBindingDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_MODEL_FAMILY_BINDING_CLASS,
    bindingId: input.bindingId,
    workflowProfile: workflow.profile,
    sourceBindings: {
      stockWorkflowExpectationId: workflow.workflowExpectationId,
      stockWorkflowExpectationDigestSha256:
        workflow.expectationDigestSha256,
      outputFrameExpectationDigestSha256:
        workflow.sourceBindings.outputFrameExpectationDigestSha256,
      controlImageWorkflowBinding: controlImageBinding,
      ipAdapterMergedWorkflow: ipAdapter.sourceBinding,
    },
    baseModelFamily: input.baseModelFamily,
    familyExpectations,
    coherenceChecks: {
      expectedRolesExactlyMatchGraph: true,
      bindingDigestsExactlyMatchGraph: true,
      allAdapterFamiliesMatchBaseExpectation: true,
      clipVisionFamilyMatchesIpAdapterExpectation: true,
      controlImageBindingMatchesWorkflowWhenRequired: true,
      ipAdapterMergedGraphMatchesWorkflowWhenPresent: true,
    },
    openGateCodes: LIVING_FRAME_CONTROLLED_MODEL_FAMILY_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    controlledDeclarationRevalidated: true,
    currentArtifactMetadataPresent: false,
    exactArtifactCompatibilityProven: false,
    executableWorkflowPresent: false,
    callerModelBytesPathsUrlsOrFilenamesPresent: false,
    providerToolWorkQueueOrCostIdentifiersPresent: false,
    auraFaceGenerationConditioningPresent: false,
    faceIdOrInsightFaceRoutePresent: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    bindingDigestSha256: digest(draft),
  }
}

export function verifyLivingFrameControlledModelFamilyBinding(
  value: unknown,
  input: CreateLivingFrameControlledModelFamilyBindingInput,
): value is LivingFrameControlledModelFamilyBinding {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'resultClass',
      'bindingId',
      'workflowProfile',
      'sourceBindings',
      'baseModelFamily',
      'familyExpectations',
      'coherenceChecks',
      'openGateCodes',
      'authorityBoundary',
      'controlledDeclarationRevalidated',
      'currentArtifactMetadataPresent',
      'exactArtifactCompatibilityProven',
      'executableWorkflowPresent',
      'callerModelBytesPathsUrlsOrFilenamesPresent',
      'providerToolWorkQueueOrCostIdentifiersPresent',
      'auraFaceGenerationConditioningPresent',
      'faceIdOrInsightFaceRoutePresent',
      'subjectSpecificRouting',
      'productionReady',
      'bindingDigestSha256',
    ])) return false
    if (
      typeof value.bindingDigestSha256 !== 'string'
      || !SHA256.test(value.bindingDigestSha256)
    ) return false
    const expected =
      createLivingFrameControlledModelFamilyBinding(input)
    return canonicalJson(expected) === canonicalJson(value)
  } catch {
    return false
  }
}

function resolveControlImageBinding(
  input: CreateLivingFrameControlledModelFamilyBindingInput,
  workflow: LivingFrameControlledComfyUiWorkflowExpectation,
  required: boolean,
):
  LivingFrameControlledModelFamilyBindingDraft['sourceBindings']['controlImageWorkflowBinding'] {
  if (!required) {
    if (input.controlImageWorkflowBinding !== undefined) {
      throw invalid(
        'control_image_binding_unexpected',
        '$.controlImageWorkflowBinding',
      )
    }
    return { present: false }
  }
  if (input.controlImageWorkflowBinding === undefined) {
    throw invalid(
      'control_image_binding_missing',
      '$.controlImageWorkflowBinding',
    )
  }
  const result = validateLivingFrameControlImageWorkflowBinding(
    input.controlImageWorkflowBinding,
  )
  if (!result.ok) {
    throw invalid(
      'control_image_binding_invalid',
      '$.controlImageWorkflowBinding',
    )
  }
  const binding = result.binding
  if (
    binding.sourceBindings.workflowExpectationId
      !== workflow.workflowExpectationId
    || binding.sourceBindings.workflowExpectationDigestSha256
      !== workflow.expectationDigestSha256
  ) {
    throw invalid(
      'control_image_lineage_mismatch',
      '$.controlImageWorkflowBinding',
    )
  }
  return {
    present: true,
    bindingId: binding.bindingId,
    bindingDigestSha256: binding.bindingDigestSha256,
  }
}

function resolveIpAdapterBinding(
  input: CreateLivingFrameControlledModelFamilyBindingInput,
  workflow: LivingFrameControlledComfyUiWorkflowExpectation,
): {
  readonly present: boolean
  readonly merged?: LivingFrameIpAdapterMergedWorkflow
  readonly sourceBinding:
    LivingFrameControlledModelFamilyBindingDraft['sourceBindings']['ipAdapterMergedWorkflow']
} {
  const hasExtension = input.ipAdapterWorkflowExtension !== undefined
  const hasMerged = input.ipAdapterMergedWorkflow !== undefined
  const hasFamily =
    input.genericIpAdapterBaseModelFamily !== undefined
    || input.clipVisionFamily !== undefined
  if (!hasExtension && !hasMerged && !hasFamily) {
    return {
      present: false,
      sourceBinding: { present: false },
    }
  }
  if (!hasExtension || !hasMerged || !hasFamily) {
    throw invalid('ipadapter_inputs_incomplete', '$')
  }
  const extensionResult = validateLivingFrameIpAdapterWorkflowExtension(
    input.ipAdapterWorkflowExtension,
  )
  if (!extensionResult.ok) {
    throw invalid(
      'ipadapter_extension_invalid',
      '$.ipAdapterWorkflowExtension',
    )
  }
  const extension = extensionResult.extension
  const mergedCandidate =
    input.ipAdapterMergedWorkflow as { mergedWorkflowId?: unknown }
  if (typeof mergedCandidate.mergedWorkflowId !== 'string') {
    throw invalid(
      'ipadapter_merged_workflow_invalid',
      '$.ipAdapterMergedWorkflow',
    )
  }
  const mergeInput = {
    mergedWorkflowId: mergedCandidate.mergedWorkflowId,
    stockWorkflowExpectation: workflow,
    ipAdapterWorkflowExtension: extension,
  }
  if (
    !verifyLivingFrameIpAdapterMergedWorkflow(
      input.ipAdapterMergedWorkflow,
      mergeInput,
    )
  ) {
    throw invalid(
      'ipadapter_merged_workflow_invalid',
      '$.ipAdapterMergedWorkflow',
    )
  }
  const merged =
    input.ipAdapterMergedWorkflow as LivingFrameIpAdapterMergedWorkflow
  if (
    merged.sourceBindings.stockWorkflowExpectationId
      !== workflow.workflowExpectationId
    || merged.sourceBindings.stockWorkflowExpectationDigestSha256
      !== workflow.expectationDigestSha256
    || merged.sourceBindings.ipAdapterExtensionId
      !== extension.extensionId
    || merged.sourceBindings.ipAdapterExtensionDigestSha256
      !== extension.extensionDigestSha256
  ) {
    throw invalid('ipadapter_lineage_mismatch', '$.ipAdapterMergedWorkflow')
  }
  return {
    present: true,
    merged,
    sourceBinding: {
      present: true,
      extensionId: extension.extensionId,
      extensionDigestSha256: extension.extensionDigestSha256,
      mergedWorkflowId: merged.mergedWorkflowId,
      mergedWorkflowDigestSha256: merged.mergedWorkflowDigestSha256,
    },
  }
}

function assertFamilyDeclarations(
  input: CreateLivingFrameControlledModelFamilyBindingInput,
  usesControlNet: boolean,
  usesLora: boolean,
  usesIpAdapter: boolean,
): void {
  if (
    usesControlNet
      ? input.controlNetModelFamily === undefined
      : input.controlNetModelFamily !== undefined
  ) {
    throw invalid(
      usesControlNet
        ? 'family_declaration_missing'
        : 'family_declaration_unexpected',
      '$.controlNetModelFamily',
    )
  }
  if (
    usesLora
      ? input.loraBaseModelFamily === undefined
      : input.loraBaseModelFamily !== undefined
  ) {
    throw invalid(
      usesLora
        ? 'family_declaration_missing'
        : 'family_declaration_unexpected',
      '$.loraBaseModelFamily',
    )
  }
  if (
    usesIpAdapter
      ? input.genericIpAdapterBaseModelFamily === undefined
        || input.clipVisionFamily === undefined
      : input.genericIpAdapterBaseModelFamily !== undefined
        || input.clipVisionFamily !== undefined
  ) {
    throw invalid(
      usesIpAdapter
        ? 'family_declaration_missing'
        : 'family_declaration_unexpected',
      '$.genericIpAdapterBaseModelFamily',
    )
  }
  if (
    input.controlNetModelFamily !== undefined
      && input.controlNetModelFamily !== input.baseModelFamily
    || input.loraBaseModelFamily !== undefined
      && input.loraBaseModelFamily !== input.baseModelFamily
    || input.genericIpAdapterBaseModelFamily !== undefined
      && input.genericIpAdapterBaseModelFamily !== input.baseModelFamily
  ) {
    throw invalid('base_family_mismatch', '$')
  }
  if (
    input.clipVisionFamily !== undefined
    && input.clipVisionFamily
      !== expectedClipVisionFamily(input.baseModelFamily)
  ) {
    throw invalid('clip_vision_family_mismatch', '$.clipVisionFamily')
  }
}

function buildFamilyExpectations(
  input: CreateLivingFrameControlledModelFamilyBindingInput,
  workflow: LivingFrameControlledComfyUiWorkflowExpectation,
  merged: LivingFrameIpAdapterMergedWorkflow | undefined,
): readonly LivingFrameControlledModelFamilyExpectation[] {
  const expectations: LivingFrameControlledModelFamilyExpectation[] = [{
    order: 1,
    role: 'base_checkpoint',
    bindingKind: 'base_checkpoint_artifact_expectation',
    bindingDigestSha256: exactBindingDigest(
      workflow.externalBindingExpectations,
      'base_checkpoint_artifact_expectation',
    ),
    expectedBaseModelFamily: input.baseModelFamily,
    controlledExpectationOnly: true,
    artifactResolved: false,
    artifactMetadataVerified: false,
    compatibilityBenchmarkPassed: false,
  }]
  if (input.controlNetModelFamily !== undefined) {
    expectations.push(adapterExpectation(
      expectations.length + 1,
      'controlnet_checkpoint',
      'controlnet_checkpoint_artifact_expectation',
      exactBindingDigest(
        workflow.externalBindingExpectations,
        'controlnet_checkpoint_artifact_expectation',
      ),
      input.controlNetModelFamily,
    ))
  }
  if (input.loraBaseModelFamily !== undefined) {
    expectations.push(adapterExpectation(
      expectations.length + 1,
      'lora_adapter',
      'lora_artifact_expectation',
      exactBindingDigest(
        workflow.externalBindingExpectations,
        'lora_artifact_expectation',
      ),
      input.loraBaseModelFamily,
    ))
  }
  if (merged !== undefined) {
    expectations.push(adapterExpectation(
      expectations.length + 1,
      'generic_ipadapter_checkpoint',
      'generic_ipadapter_checkpoint_artifact',
      exactBindingDigest(
        merged.graph.externalBindings,
        'generic_ipadapter_checkpoint_artifact',
      ),
      input.genericIpAdapterBaseModelFamily!,
    ))
    expectations.push({
      order: expectations.length + 1,
      role: 'clip_vision_checkpoint',
      bindingKind: 'clip_vision_checkpoint_artifact',
      bindingDigestSha256: exactBindingDigest(
        merged.graph.externalBindings,
        'clip_vision_checkpoint_artifact',
      ),
      expectedClipVisionFamily: input.clipVisionFamily!,
      controlledExpectationOnly: true,
      artifactResolved: false,
      artifactMetadataVerified: false,
      compatibilityBenchmarkPassed: false,
    })
  }
  return expectations
}

function adapterExpectation(
  order: number,
  role:
    | 'controlnet_checkpoint'
    | 'lora_adapter'
    | 'generic_ipadapter_checkpoint',
  bindingKind:
    | 'controlnet_checkpoint_artifact_expectation'
    | 'lora_artifact_expectation'
    | 'generic_ipadapter_checkpoint_artifact',
  bindingDigestSha256: string,
  expectedBaseModelFamily: LivingFrameControlledModelFamily,
): LivingFrameControlledModelFamilyExpectation {
  return {
    order,
    role,
    bindingKind,
    bindingDigestSha256,
    expectedBaseModelFamily,
    controlledExpectationOnly: true,
    artifactResolved: false,
    artifactMetadataVerified: false,
    compatibilityBenchmarkPassed: false,
  }
}

function exactBindingDigest(
  bindings: readonly {
    readonly bindingKind: string
    readonly bindingDigestSha256: string
  }[],
  kind: string,
): string {
  const matches = bindings.filter((binding) => binding.bindingKind === kind)
  if (matches.length === 0) {
    throw invalid('binding_expectation_missing', `$.bindings.${kind}`)
  }
  if (matches.length !== 1) {
    throw invalid('binding_expectation_duplicate', `$.bindings.${kind}`)
  }
  return matches[0].bindingDigestSha256
}

function expectedClipVisionFamily(
  family: LivingFrameControlledModelFamily,
): LivingFrameControlledClipVisionFamily {
  return family === 'stable_diffusion_1_5'
    ? 'clip_vision_vit_h_14'
    : 'clip_vision_vit_big_g_14'
}

function assertInputShape(
  input: CreateLivingFrameControlledModelFamilyBindingInput,
): void {
  if (!isRecord(input)) throw invalid('input_invalid', '$')
  const unknown = Object.keys(input).filter(
    (key) => !INPUT_KEYS.includes(key as typeof INPUT_KEYS[number]),
  )
  if (unknown.length > 0) throw invalid('unknown_key', '$')
  if (
    typeof input.bindingId !== 'string'
    || !SAFE_ID.test(input.bindingId)
  ) throw invalid('unsafe_input', '$.bindingId')
  if (
    !LIVING_FRAME_CONTROLLED_MODEL_FAMILIES.includes(
      input.baseModelFamily,
    )
  ) throw invalid('input_invalid', '$.baseModelFamily')
  for (const [path, value] of [
    ['$.controlNetModelFamily', input.controlNetModelFamily],
    ['$.loraBaseModelFamily', input.loraBaseModelFamily],
    [
      '$.genericIpAdapterBaseModelFamily',
      input.genericIpAdapterBaseModelFamily,
    ],
  ] as const) {
    if (
      value !== undefined
      && !LIVING_FRAME_CONTROLLED_MODEL_FAMILIES.includes(value)
    ) throw invalid('input_invalid', path)
  }
  if (
    input.clipVisionFamily !== undefined
    && !LIVING_FRAME_CONTROLLED_CLIP_VISION_FAMILIES.includes(
      input.clipVisionFamily,
    )
  ) throw invalid('input_invalid', '$.clipVisionFamily')
}

function invalid(
  code: LivingFrameControlledModelFamilyIssueCode,
  path: string,
): LivingFrameControlledModelFamilyBindingError {
  return new LivingFrameControlledModelFamilyBindingError([{ code, path }])
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

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
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
