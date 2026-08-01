import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkRequestBlueprint,
  LivingFrameControlledSdxlBenchmarkRequestBlueprintAuthority,
  LivingFrameControlledSdxlBenchmarkRequestBlueprintDraft,
  LivingFrameControlledSdxlBenchmarkRequestBlueprintIssue,
  LivingFrameControlledSdxlBenchmarkRequestBlueprintIssueCode,
  LivingFrameControlledSdxlBenchmarkRequestRecipe,
  LivingFrameControlledSdxlBenchmarkRequestSlot,
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_VERSION,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkAdmissionAudit,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-admission-audit'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCase,
  LivingFrameControlledSdxlCompatibilityBenchmarkComponent,
  LivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import type {
  CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput,
} from './living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  verifyLivingFrameControlledSdxlBenchmarkAdmissionAudit,
} from './living-frame-controlled-sdxl-benchmark-admission-audit'
import type {
  CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export interface CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput {
  readonly blueprintId: string
  readonly benchmarkSpecification:
    LivingFrameControlledSdxlCompatibilityBenchmarkSpec
  readonly benchmarkSpecificationInput:
    CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput
  readonly benchmarkAdmissionAudit:
    LivingFrameControlledSdxlBenchmarkAdmissionAudit
  readonly benchmarkAdmissionAuditInput:
    CreateLivingFrameControlledSdxlBenchmarkAdmissionAuditInput
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const COMPONENT_SLOT: Readonly<
  Record<
    LivingFrameControlledSdxlCompatibilityBenchmarkComponent,
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  >
> = Object.freeze({
  base_checkpoint: 'base_checkpoint_artifact',
  controlnet_checkpoint: 'controlnet_checkpoint_artifact',
  lora_adapter: 'lora_adapter_artifact',
  generic_ipadapter_checkpoint:
    'generic_ipadapter_checkpoint_artifact',
  clip_vision_checkpoint: 'clip_vision_checkpoint_artifact',
})

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlBenchmarkRequestBlueprintAuthority =
  deepFreeze({
    deterministicRequestBlueprintAuthority: true,
    benchmarkSpecificationAuthority: false,
    benchmarkAdmissionAuthority: false,
    artifactRepositoryAuthority: false,
    artifactMountAuthority: false,
    fixtureArtifactAuthority: false,
    promptAuthority: false,
    requestMaterializationAuthority: false,
    currentNodeSchemaAuthority: false,
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

export class LivingFrameControlledSdxlBenchmarkRequestBlueprintError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlBenchmarkRequestBlueprintIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlBenchmarkRequestBlueprintIssue[],
  ) {
    super(
      'Living Frame controlled SDXL benchmark request blueprint failed.',
    )
    this.name =
      'LivingFrameControlledSdxlBenchmarkRequestBlueprintError'
    this.issues = issues
  }
}

export async function createLivingFrameControlledSdxlBenchmarkRequestBlueprint(
  input:
    CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput,
): Promise<LivingFrameControlledSdxlBenchmarkRequestBlueprint> {
  assertInput(input)
  if (
    !await verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
      input.benchmarkSpecification,
      input.benchmarkSpecificationInput,
    )
  ) throw invalid(
    'benchmark_specification_invalid',
    '$.benchmarkSpecification',
  )
  if (
    !await verifyLivingFrameControlledSdxlBenchmarkAdmissionAudit(
      input.benchmarkAdmissionAudit,
      input.benchmarkAdmissionAuditInput,
    )
  ) throw invalid(
    'admission_audit_invalid',
    '$.benchmarkAdmissionAudit',
  )
  assertSourceLineage(input)
  assertAdmissionRemainsBlocked(input.benchmarkAdmissionAudit)

  const recipes =
    input.benchmarkSpecification.cases.map(
      (benchmarkCase, expectedOrder) =>
        buildRecipe(benchmarkCase, expectedOrder),
    )
  assertRecipeSet(input.benchmarkSpecification, recipes)
  const unresolvedBindingSlotCount = recipes.reduce(
    (total, recipe) =>
      total + recipe.requiredBindingSlots.length,
    0,
  )
  const distinctBindingSlotSetCount = new Set(
    recipes.map((recipe) =>
      canonicalJson(
        recipe.requiredBindingSlots.map((slot) => slot.slotKind),
      )),
  ).size
  if (
    unresolvedBindingSlotCount !== 41
    || distinctBindingSlotSetCount !== 6
  ) throw invalid(
    'binding_slot_policy_mismatch',
    '$.recipes',
  )

  const specification =
    input.benchmarkSpecification
  const audit = input.benchmarkAdmissionAudit
  const draft:
    LivingFrameControlledSdxlBenchmarkRequestBlueprintDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_CLASS,
    blueprintId: input.blueprintId,
    blueprintState:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_STATE,
    sourceBindings: {
      benchmarkSpecificationId:
        specification.specificationId,
      benchmarkSpecificationDigestSha256:
        specification.specificationDigestSha256,
      benchmarkAdmissionAuditId: audit.auditId,
      benchmarkAdmissionAuditDigestSha256:
        audit.auditDigestSha256,
      candidateSetDigestSha256:
        specification.sourceBindings.candidateSetDigestSha256,
      requirementsDigestSha256:
        specification.sourceBindings.requirementsDigestSha256,
      dependencyLockEvidenceDigestSha256:
        specification.sourceBindings
          .dependencyLockEvidenceDigestSha256,
      outputFrameExpectationDigestSha256:
        specification.sourceBindings
          .outputFrameExpectationDigestSha256,
    },
    admissionProjection: {
      exactArtifactEvidenceState:
        audit.exactArtifactEvidenceState.state,
      canonicalOperationContractState: 'not_registered',
      canonicalOperationContractDigestSha256: null,
      distributedPrivateModelMountDigestSha256: null,
      signedGpuImageDigestSha256: null,
      serverOwnedFixtureSetDigestSha256: null,
      currentGpuNodeSchemaDigestSha256: null,
    },
    recipes,
    metrics: {
      caseCount: 7,
      loadOnlyRecipeCount: 1,
      generationRecipeCount: 6,
      unresolvedBindingSlotCount: 41,
      distinctBindingSlotSetCount: 6,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    benchmarkSpecificationRevalidated: true,
    benchmarkAdmissionAuditRevalidated: true,
    exactSourceLineageMatched: true,
    caseSetOrderComponentsAndComparisonsMatched: true,
    requestBlueprintProjected: true,
    requestMaterialized: false,
    dispatchReady: false,
    benchmarkExecuted: false,
    benchmarkMeasurementsPresent: false,
    actualAttemptCostEvidencePresent: false,
    selectedSceneCreated: false,
    containsRawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommand:
      false,
    containsProviderToolOperationWorkQueueCostOrCommercialRoute:
      false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  assertOutputSafe(draft)
  return deepFreeze({
    ...draft,
    blueprintDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint(
  value: unknown,
  input:
    CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_VERSION
      || value.resultClass
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_CLASS
      || value.productionReady !== false
      || typeof value.blueprintDigestSha256 !== 'string'
      || !SHA256.test(value.blueprintDigestSha256)
    ) return false
    const {
      blueprintDigestSha256,
      ...draft
    } = value
    if (digest(draft) !== blueprintDigestSha256) return false
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameControlledSdxlBenchmarkRequestBlueprint(
        input,
      ),
    )
  } catch {
    return false
  }
}

function buildRecipe(
  benchmarkCase:
    LivingFrameControlledSdxlCompatibilityBenchmarkCase,
  expectedOrder: number,
): LivingFrameControlledSdxlBenchmarkRequestRecipe {
  if (benchmarkCase.order !== expectedOrder) {
    throw invalid(
      'case_set_or_order_mismatch',
      `$.benchmarkSpecification.cases.${expectedOrder}`,
    )
  }
  const loadOnly =
    benchmarkCase.caseClass === 'load_integrity'
  const slotKinds:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind[] = [
    ...benchmarkCase.enabledComponents.map(
      (component) => COMPONENT_SLOT[component],
    ),
    ...(loadOnly
      ? []
      : [
          'positive_conditioning_text',
          'negative_conditioning_text',
        ] as const),
    ...(benchmarkCase.enabledComponents.includes(
      'controlnet_checkpoint',
    ) && !loadOnly
      ? ['control_image_artifact'] as const
      : []),
    ...(benchmarkCase.enabledComponents.includes(
      'generic_ipadapter_checkpoint',
    ) && !loadOnly
      ? ['reference_image_artifact'] as const
      : []),
  ]
  const requiredBindingSlots =
    slotKinds.map((slotKind, order) =>
      bindingSlot(slotKind, order))
  const recipeDraft = {
    order: expectedOrder,
    caseId: benchmarkCase.caseId,
    recipeClass: loadOnly
      ? 'load_only_bundle_probe'
      : 'unmaterialized_generation_request',
    comparisonCaseId: benchmarkCase.comparisonCaseId,
    enabledComponents: benchmarkCase.enabledComponents,
    disabledComponents: benchmarkCase.disabledComponents,
    runtimePolicy: loadOnly
      ? null
      : {
          seed: benchmarkCase.seed as 19_791_104 | 420_042,
          outputWidthPixels: benchmarkCase.outputWidthPixels,
          outputHeightPixels: benchmarkCase.outputHeightPixels,
          sampler: benchmarkCase.sampler,
          scheduler: benchmarkCase.scheduler,
          stepCount: benchmarkCase.stepCount,
          cfg: benchmarkCase.cfg,
          denoise: benchmarkCase.denoise,
        },
    requiredBindingSlots,
    exactCasePolicyProjected: true,
    allBindingsRemainServerResolved: true,
    promptTextPresent: false,
    imageBytesPresent: false,
    modelBytesPathUrlOrFilenamePresent: false,
    executableRequestPresent: false,
  } as const
  return deepFreeze({
    ...recipeDraft,
    recipeDigestSha256: digest(recipeDraft),
  })
}

function bindingSlot(
  slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
  order: number,
): LivingFrameControlledSdxlBenchmarkRequestSlot {
  return {
    order,
    slotKind,
    sourceClass:
      slotKind.endsWith('_checkpoint_artifact')
      || slotKind === 'lora_adapter_artifact'
        ? 'canonical_model_artifact'
        : slotKind.endsWith('_conditioning_text')
          ? 'server_owned_conditioning'
          : slotKind === 'control_image_artifact'
            ? 'server_owned_control_image'
            : 'server_owned_reference_image',
    required: true,
    resolved: false,
    valuePresent: false,
  }
}

function assertSourceLineage(
  input:
    CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput,
): void {
  const specification = input.benchmarkSpecification
  const audit = input.benchmarkAdmissionAudit
  const auditInput = input.benchmarkAdmissionAuditInput
  if (
    audit.sourceBindings.benchmarkSpecificationId
      !== specification.specificationId
    || audit.sourceBindings.benchmarkSpecificationDigestSha256
      !== specification.specificationDigestSha256
    || audit.sourceBindings.candidateSetDigestSha256
      !== specification.sourceBindings.candidateSetDigestSha256
    || audit.sourceBindings.requirementsDigestSha256
      !== specification.sourceBindings.requirementsDigestSha256
    || audit.sourceBindings.dependencyLockEvidenceDigestSha256
      !== specification.sourceBindings
        .dependencyLockEvidenceDigestSha256
    || auditInput.benchmarkSpecification.specificationDigestSha256
      !== specification.specificationDigestSha256
    || auditInput.benchmarkSpecificationInput.specificationId
      !== input.benchmarkSpecificationInput.specificationId
  ) throw invalid(
    'source_lineage_mismatch',
    '$.sourceBindings',
  )
}

function assertAdmissionRemainsBlocked(
  audit:
    LivingFrameControlledSdxlBenchmarkAdmissionAudit,
): void {
  if (
    audit.registryObservation.exactOperationContractPresent
      !== false
    || audit.registryObservation.privateGpuRunnerVerified !== false
    || audit.registryObservation.productReady !== false
    || audit.benchmarkRequestReady !== false
    || audit.releasedGpuAttemptPresent !== false
    || audit.canonicalGpuMetricAttestationPresent !== false
    || audit.canonicalInternalCostReceiptPresent !== false
    || audit.productionReady !== false
  ) throw invalid(
    'admission_state_promotion_forbidden',
    '$.benchmarkAdmissionAudit',
  )
}

function assertRecipeSet(
  specification:
    LivingFrameControlledSdxlCompatibilityBenchmarkSpec,
  recipes:
    readonly LivingFrameControlledSdxlBenchmarkRequestRecipe[],
): void {
  if (
    recipes.length !== 7
    || recipes.some((recipe, index) => {
      const source = specification.cases[index]
      return (
        source === undefined
        || recipe.order !== index
        || recipe.caseId !== source.caseId
        || recipe.comparisonCaseId !== source.comparisonCaseId
        || canonicalJson(recipe.enabledComponents)
          !== canonicalJson(source.enabledComponents)
        || canonicalJson(recipe.disabledComponents)
          !== canonicalJson(source.disabledComponents)
      )
    })
  ) throw invalid(
    'case_set_or_order_mismatch',
    '$.recipes',
  )
  for (const recipe of recipes) {
    const slots =
      recipe.requiredBindingSlots.map((slot) => slot.slotKind)
    if (
      new Set(slots).size !== slots.length
      || recipe.requiredBindingSlots.some(
        (slot, index) =>
          slot.order !== index
          || slot.resolved !== false
          || slot.valuePresent !== false,
      )
    ) throw invalid(
      'binding_slot_policy_mismatch',
      `$.recipes.${recipe.order}.requiredBindingSlots`,
    )
  }
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'blueprintId',
      'benchmarkSpecification',
      'benchmarkSpecificationInput',
      'benchmarkAdmissionAudit',
      'benchmarkAdmissionAuditInput',
    ])
    || typeof input.blueprintId !== 'string'
    || !SAFE_ID.test(input.blueprintId)
    || !isRecord(input.benchmarkSpecification)
    || !isRecord(input.benchmarkSpecificationInput)
    || !isRecord(input.benchmarkAdmissionAudit)
    || !isRecord(input.benchmarkAdmissionAuditInput)
  ) throw invalid('input_invalid', '$')
}

function assertOutputSafe(
  draft:
    LivingFrameControlledSdxlBenchmarkRequestBlueprintDraft,
): void {
  if (
    draft.requestMaterialized !== false
    || draft.dispatchReady !== false
    || draft.benchmarkExecuted !== false
    || draft.benchmarkMeasurementsPresent !== false
    || draft.actualAttemptCostEvidencePresent !== false
    || draft.selectedSceneCreated !== false
    || draft.productionReady !== false
    || Object.entries(draft.authorityBoundary).some(
      ([key, value]) =>
        value !== (
          key === 'deterministicRequestBlueprintAuthority'
        ),
    )
  ) throw invalid(
    'authority_promotion_forbidden',
    '$.authorityBoundary',
  )
  const serialized = canonicalJson(draft).toLowerCase()
  for (const forbidden of [
    'https://',
    'file://',
    '/tmp/',
    'sk-proj-',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    if (serialized.includes(forbidden)) {
      throw invalid('unsafe_payload_forbidden', '$')
    }
  }
}

function invalid(
  code:
    LivingFrameControlledSdxlBenchmarkRequestBlueprintIssueCode,
  path: string,
): LivingFrameControlledSdxlBenchmarkRequestBlueprintError {
  if (
    !LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_ISSUES
      .includes(code)
  ) throw new Error(
    'Unknown Living Frame benchmark request blueprint issue code.',
  )
  return new LivingFrameControlledSdxlBenchmarkRequestBlueprintError([
    { code, path },
  ])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  throw invalid('input_invalid', '$')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return canonicalJson(actual) === canonicalJson(sortedExpected)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}
