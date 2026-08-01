import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkAuthority,
  LivingFrameControlledSdxlCompatibilityBenchmarkCase,
  LivingFrameControlledSdxlCompatibilityBenchmarkIssue,
  LivingFrameControlledSdxlCompatibilityBenchmarkIssueCode,
  LivingFrameControlledSdxlCompatibilityBenchmarkSpec,
  LivingFrameControlledSdxlCompatibilityBenchmarkSpecDraft,
  LivingFrameControlledSdxlCompatibilityBenchmarkThreshold,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_METRICS,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_VERSION,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import type {
  LivingFrameControlledSdxlArtifactCandidateSet,
} from '../../src/types/living-frame-controlled-sdxl-artifact-candidate-set'
import type {
  LivingFrameControlledModelFamilyBinding,
} from '../../src/types/living-frame-controlled-model-family-binding'
import type {
  LivingFrameComfyUiDependencyLockEvidence,
} from '../../src/types/living-frame-comfyui-dependency-lock-evidence'
import type {
  LivingFrameComfyUiModelArtifactRequirements,
} from '../../src/types/living-frame-comfyui-model-artifact-requirements'
import type {
  CreateLivingFrameControlledSdxlArtifactCandidateSetInput,
} from './living-frame-controlled-sdxl-artifact-candidate-set'
import {
  verifyLivingFrameControlledSdxlArtifactCandidateSet,
} from './living-frame-controlled-sdxl-artifact-candidate-set'
import {
  verifyLivingFrameControlledModelFamilyBinding,
} from './living-frame-controlled-model-family-binding'
import {
  verifyLivingFrameComfyUiDependencyLockEvidence,
} from './living-frame-comfyui-dependency-lock-evidence'
import {
  verifyLivingFrameComfyUiModelArtifactRequirements,
} from './living-frame-comfyui-model-artifact-requirements'

export interface CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput {
  readonly specificationId: string
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly candidateSetInput:
    CreateLivingFrameControlledSdxlArtifactCandidateSetInput
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const EXACT_ARTIFACT_BYTE_LENGTH = 11_700_367_157

const CONDITIONING_RECIPE_ID =
  'living_frame_subject_neutral_conditioning_fixture_v1' as const
const CONTROL_IMAGE_RECIPE_ID =
  'living_frame_subject_neutral_canny_control_fixture_v1' as const
const REFERENCE_IMAGE_RECIPE_ID =
  'living_frame_subject_neutral_reference_fixture_v1' as const

const CASES:
  readonly LivingFrameControlledSdxlCompatibilityBenchmarkCase[] =
  deepFreeze([
    benchmarkCase({
      order: 0,
      caseId: 'exact_bundle_load',
      caseClass: 'load_integrity',
      comparisonCaseId: null,
      enabled: [
        'base_checkpoint',
        'controlnet_checkpoint',
        'lora_adapter',
        'generic_ipadapter_checkpoint',
        'clip_vision_checkpoint',
      ],
      seedGroup: 'load_probe',
      seed: null,
      metrics: [
        'exact_model_load_integrity',
        'network_off_confinement',
        'peak_gpu_memory_mib',
        'cold_bundle_load_duration_ms',
      ],
    }),
    benchmarkCase({
      order: 1,
      caseId: 'base_only_baseline',
      caseClass: 'baseline_generation',
      comparisonCaseId: null,
      enabled: ['base_checkpoint'],
      seedGroup: 'isolated_effect_probe',
      seed: 19_791_104,
      metrics: [
        'decoded_output_validity',
        'finite_pixel_population',
        'warm_generation_duration_ms',
      ],
    }),
    benchmarkCase({
      order: 2,
      caseId: 'lora_effect_probe',
      caseClass: 'isolated_capability_effect',
      comparisonCaseId: 'base_only_baseline',
      enabled: ['base_checkpoint', 'lora_adapter'],
      seedGroup: 'isolated_effect_probe',
      seed: 19_791_104,
      metrics: [
        'decoded_output_validity',
        'finite_pixel_population',
        'lora_effect_normalized_mae',
      ],
    }),
    benchmarkCase({
      order: 3,
      caseId: 'controlnet_effect_probe',
      caseClass: 'isolated_capability_effect',
      comparisonCaseId: 'base_only_baseline',
      enabled: [
        'base_checkpoint',
        'controlnet_checkpoint',
      ],
      seedGroup: 'isolated_effect_probe',
      seed: 19_791_104,
      metrics: [
        'decoded_output_validity',
        'finite_pixel_population',
        'controlnet_edge_f1_delta',
      ],
    }),
    benchmarkCase({
      order: 4,
      caseId: 'ipadapter_effect_probe',
      caseClass: 'isolated_capability_effect',
      comparisonCaseId: 'base_only_baseline',
      enabled: [
        'base_checkpoint',
        'generic_ipadapter_checkpoint',
        'clip_vision_checkpoint',
      ],
      seedGroup: 'isolated_effect_probe',
      seed: 19_791_104,
      metrics: [
        'decoded_output_validity',
        'finite_pixel_population',
        'ipadapter_reference_similarity_delta',
      ],
    }),
    benchmarkCase({
      order: 5,
      caseId: 'full_combined_primary',
      caseClass: 'combined_generation',
      comparisonCaseId: null,
      enabled: [
        'base_checkpoint',
        'controlnet_checkpoint',
        'lora_adapter',
        'generic_ipadapter_checkpoint',
        'clip_vision_checkpoint',
      ],
      seedGroup: 'full_combined_replay',
      seed: 420_042,
      metrics: [
        'decoded_output_validity',
        'finite_pixel_population',
        'peak_gpu_memory_mib',
        'warm_generation_duration_ms',
      ],
    }),
    benchmarkCase({
      order: 6,
      caseId: 'full_combined_replay',
      caseClass: 'deterministic_replay',
      comparisonCaseId: 'full_combined_primary',
      enabled: [
        'base_checkpoint',
        'controlnet_checkpoint',
        'lora_adapter',
        'generic_ipadapter_checkpoint',
        'clip_vision_checkpoint',
      ],
      seedGroup: 'full_combined_replay',
      seed: 420_042,
      metrics: [
        'decoded_output_validity',
        'finite_pixel_population',
        'seed_replay_normalized_mae',
      ],
    }),
  ])

const THRESHOLDS:
  readonly LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[] =
  deepFreeze([
    exactBoolean('exact_model_load_integrity', true),
    exactBoolean('network_off_confinement', true),
    exactBoolean('decoded_output_validity', true),
    exactBoolean('finite_pixel_population', true),
    atMost(
      'seed_replay_normalized_mae',
      0.005,
      'normalized_ratio',
    ),
    within(
      'lora_effect_normalized_mae',
      0.01,
      0.35,
      'normalized_ratio',
    ),
    atLeast(
      'controlnet_edge_f1_delta',
      0.1,
      'normalized_ratio',
    ),
    atLeast(
      'ipadapter_reference_similarity_delta',
      0.05,
      'normalized_ratio',
    ),
    atMost('peak_gpu_memory_mib', 23_000, 'mib'),
    atMost(
      'cold_bundle_load_duration_ms',
      300_000,
      'milliseconds',
    ),
    atMost(
      'warm_generation_duration_ms',
      180_000,
      'milliseconds',
    ),
  ])

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlCompatibilityBenchmarkAuthority =
  deepFreeze({
    controlledCandidateSetConsumed: true,
    currentModelRequirementProjectionConsumed: true,
    currentModelFamilyGraphBindingConsumed: true,
    currentDependencyLockEvidenceConsumed: true,
    deterministicBenchmarkSpecificationAuthority: true,
    canonicalArtifactBindingAuthority: false,
    artifactMountAuthority: false,
    modelCompatibilityAuthority: false,
    benchmarkAdmissionAuthority: false,
    benchmarkExecutionAuthority: false,
    benchmarkResultAuthority: false,
    legalReviewAuthority: false,
    commercialUseAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
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

export class LivingFrameControlledSdxlCompatibilityBenchmarkSpecError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlCompatibilityBenchmarkIssue[],
  ) {
    super(
      'Living Frame controlled SDXL compatibility benchmark specification failed.',
    )
    this.name =
      'LivingFrameControlledSdxlCompatibilityBenchmarkSpecError'
    this.issues = issues
  }
}

export function readLivingFrameControlledSdxlCompatibilityBenchmarkPolicy(): {
  readonly cases:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkCase[]
  readonly thresholds:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[]
} {
  assertCasePolicy(CASES)
  assertThresholdPolicy(THRESHOLDS)
  return {
    cases: CASES,
    thresholds: THRESHOLDS,
  }
}

export async function createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
  input:
    CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput,
): Promise<LivingFrameControlledSdxlCompatibilityBenchmarkSpec> {
  assertInput(input)
  if (
    !await verifyLivingFrameControlledSdxlArtifactCandidateSet(
      input.candidateSet,
      input.candidateSetInput,
    )
  ) throw invalid('candidate_set_invalid', '$.candidateSet')

  const requirements =
    input.candidateSetInput.requirements
  const requirementsInput =
    input.candidateSetInput.requirementsInput
  if (
    !verifyLivingFrameComfyUiModelArtifactRequirements(
      requirements,
      requirementsInput,
    )
  ) throw invalid(
    'model_requirements_invalid',
    '$.candidateSetInput.requirements',
  )
  if (
    !verifyLivingFrameControlledModelFamilyBinding(
      requirementsInput.controlledModelFamilyBinding,
      requirementsInput.controlledModelFamilyBindingInput,
    )
  ) throw invalid(
    'model_family_binding_invalid',
    '$.candidateSetInput.requirementsInput.controlledModelFamilyBinding',
  )
  const dependencyResult =
    verifyLivingFrameComfyUiDependencyLockEvidence(
      requirementsInput.dependencyLockEvidence,
    )
  if (!dependencyResult.ok) {
    throw invalid(
      'dependency_lock_invalid',
      '$.candidateSetInput.requirementsInput.dependencyLockEvidence',
    )
  }

  const familyBinding =
    requirementsInput.controlledModelFamilyBinding as
      LivingFrameControlledModelFamilyBinding
  const dependencyLock = dependencyResult.evidence
  assertParentLineage({
    candidateSet: input.candidateSet,
    requirements,
    familyBinding,
    dependencyLock,
  })
  assertCandidateSet(input.candidateSet)
  const ipAdapterBinding =
    familyBinding.sourceBindings.ipAdapterMergedWorkflow
  if (!ipAdapterBinding.present) {
    throw invalid(
      'ipadapter_merged_graph_required',
      '$.sourceBindings.ipAdapterMergedWorkflow',
    )
  }
  const policy =
    readLivingFrameControlledSdxlCompatibilityBenchmarkPolicy()

  const draft:
    LivingFrameControlledSdxlCompatibilityBenchmarkSpecDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_CLASS,
    specificationId: input.specificationId,
    specificationState:
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_STATE,
    sourceBindings: {
      candidateSetId: input.candidateSet.candidateSetId,
      candidateSetDigestSha256:
        input.candidateSet.candidateSetDigestSha256,
      requirementSetId: requirements.requirementSetId,
      requirementsDigestSha256:
        requirements.requirementsDigestSha256,
      controlledModelFamilyBindingId:
        familyBinding.bindingId,
      controlledModelFamilyBindingDigestSha256:
        familyBinding.bindingDigestSha256,
      dependencyLockEvidenceId:
        dependencyLock.evidenceId,
      dependencyLockEvidenceDigestSha256:
        dependencyLock.evidenceDigestSha256,
      stockWorkflowExpectationId:
        familyBinding.sourceBindings.stockWorkflowExpectationId,
      stockWorkflowExpectationDigestSha256:
        familyBinding.sourceBindings
          .stockWorkflowExpectationDigestSha256,
      ipAdapterMergedWorkflowId:
        ipAdapterBinding.mergedWorkflowId,
      ipAdapterMergedWorkflowDigestSha256:
        ipAdapterBinding.mergedWorkflowDigestSha256,
      outputFrameExpectationDigestSha256:
        familyBinding.sourceBindings
          .outputFrameExpectationDigestSha256,
    },
    fixtureRecipes: {
      conditioningRecipeId: CONDITIONING_RECIPE_ID,
      conditioningRecipeDigestSha256:
        digest(CONDITIONING_RECIPE_ID),
      controlImageRecipeId: CONTROL_IMAGE_RECIPE_ID,
      controlImageRecipeDigestSha256:
        digest(CONTROL_IMAGE_RECIPE_ID),
      referenceImageRecipeId: REFERENCE_IMAGE_RECIPE_ID,
      referenceImageRecipeDigestSha256:
        digest(REFERENCE_IMAGE_RECIPE_ID),
      containsRawPromptImageBytesPathUrlOrFilename: false,
      serverOwnedFixtureArtifactsPresent: false,
    },
    cases: policy.cases,
    thresholds: policy.thresholds,
    metrics: {
      caseCount: 7,
      candidateArtifactCount: 5,
      candidateArtifactByteLength:
        EXACT_ARTIFACT_BYTE_LENGTH,
      isolatedCapabilityProbeCount: 3,
      combinedRunCount: 2,
      requiredMetricCount: 11,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    candidateSetRevalidated: true,
    modelRequirementsRevalidated: true,
    modelFamilyGraphBindingRevalidated: true,
    dependencyLockEvidenceRevalidated: true,
    exactParentLineageMatched: true,
    allFiveCandidateRolesCovered: true,
    isolatedAndCombinedCapabilityCoverageComplete: true,
    deterministicReplayCasePresent: true,
    oneCapabilityEffectComparedAtATime: true,
    exactCanonicalArtifactsBound: false,
    exactArtifactsMounted: false,
    benchmarkAdmitted: false,
    benchmarkExecuted: false,
    benchmarkMeasurementsPresent: false,
    exactBundleCompatibilityProven: false,
    selectedSceneCreated: false,
    containsProviderToolOperationWorkQueueCostOrCommercialRoute:
      false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    specificationDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
  value: unknown,
  input:
    CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion
        !==
        LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_VERSION
      || value.resultClass
        !==
        LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_CLASS
      || value.productionReady !== false
      || typeof value.specificationDigestSha256 !== 'string'
      || !SHA256.test(value.specificationDigestSha256)
    ) return false
    const {
      specificationDigestSha256,
      ...draft
    } = value
    if (
      digest(draft) !== specificationDigestSha256
    ) return false
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
        input,
      ),
    )
  } catch {
    return false
  }
}

function assertParentLineage(input: {
  readonly candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet
  readonly requirements:
    LivingFrameComfyUiModelArtifactRequirements
  readonly familyBinding:
    LivingFrameControlledModelFamilyBinding
  readonly dependencyLock:
    LivingFrameComfyUiDependencyLockEvidence
}): void {
  if (
    input.candidateSet.sourceBindings.requirementSetId
      !== input.requirements.requirementSetId
    || input.candidateSet.sourceBindings.requirementsDigestSha256
      !== input.requirements.requirementsDigestSha256
    || input.candidateSet.sourceBindings
      .controlledModelFamilyBindingId
      !== input.familyBinding.bindingId
    || input.candidateSet.sourceBindings
      .controlledModelFamilyBindingDigestSha256
      !== input.familyBinding.bindingDigestSha256
    || input.requirements.sourceBindings
      .controlledModelFamilyBindingId
      !== input.familyBinding.bindingId
    || input.requirements.sourceBindings
      .controlledModelFamilyBindingDigestSha256
      !== input.familyBinding.bindingDigestSha256
    || input.requirements.sourceBindings
      .dependencyLockEvidenceId
      !== input.dependencyLock.evidenceId
    || input.requirements.sourceBindings
      .dependencyLockEvidenceDigestSha256
      !== input.dependencyLock.evidenceDigestSha256
  ) throw invalid(
    'parent_lineage_mismatch',
    '$.sourceBindings',
  )
}

function assertCandidateSet(
  candidateSet:
    LivingFrameControlledSdxlArtifactCandidateSet,
): void {
  const expectedRoles = [
    ...LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS,
  ]
  if (
    candidateSet.metrics.artifactCount !== 5
    || candidateSet.metrics.totalReportedByteLength
      !== EXACT_ARTIFACT_BYTE_LENGTH
    || candidateSet.artifacts.length !== 5
    || canonicalJson(
      candidateSet.artifacts.map((artifact) => artifact.role),
    ) !== canonicalJson(expectedRoles)
    || candidateSet.artifacts.some((artifact) =>
      artifact.fullContentDigestIndependentlyVerified !== false
      || artifact.compatibilityBenchmarkPassed !== false
      || artifact.paidProductionUseApproved !== false)
  ) throw invalid(
    'candidate_artifact_set_mismatch',
    '$.candidateSet.artifacts',
  )
}

function assertCasePolicy(
  cases:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkCase[],
): void {
  const expectedIds = [
    ...LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
  ]
  if (
    cases.length !== expectedIds.length
    || canonicalJson(cases.map((entry) => entry.caseId))
      !== canonicalJson(expectedIds)
    || cases.some((entry, index) => {
      const enabled = new Set(entry.enabledComponents)
      const disabled = new Set(entry.disabledComponents)
      return (
        entry.order !== index
        || enabled.size !== entry.enabledComponents.length
        || disabled.size !== entry.disabledComponents.length
        || [...enabled].some((component) => disabled.has(component))
        || enabled.size + disabled.size
          !==
          LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS
            .length
        || entry.metricCodes.length === 0
        || new Set(entry.metricCodes).size
          !== entry.metricCodes.length
      )
    })
    || cases.filter((entry) =>
      entry.caseClass === 'isolated_capability_effect').length !== 3
    || cases[5]?.seed !== cases[6]?.seed
    || cases[6]?.comparisonCaseId !== 'full_combined_primary'
  ) throw invalid('case_policy_invalid', '$.cases')
}

function assertThresholdPolicy(
  thresholds:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[],
): void {
  const metricCodes =
    thresholds.map((threshold) => threshold.metricCode)
  if (
    thresholds.length
      !==
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_METRICS
        .length
    || new Set(metricCodes).size !== metricCodes.length
    || !LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_METRICS
      .every((metric) => metricCodes.includes(metric))
  ) throw invalid('threshold_policy_invalid', '$.thresholds')
}

function benchmarkCase(
  input: {
    readonly order: number
    readonly caseId:
      LivingFrameControlledSdxlCompatibilityBenchmarkCase[
        'caseId'
      ]
    readonly caseClass:
      LivingFrameControlledSdxlCompatibilityBenchmarkCase[
        'caseClass'
      ]
    readonly comparisonCaseId:
      LivingFrameControlledSdxlCompatibilityBenchmarkCase[
        'comparisonCaseId'
      ]
    readonly enabled:
      readonly LivingFrameControlledSdxlCompatibilityBenchmarkCase[
        'enabledComponents'
      ][number][]
    readonly seedGroup:
      LivingFrameControlledSdxlCompatibilityBenchmarkCase[
        'seedGroup'
      ]
    readonly seed:
      LivingFrameControlledSdxlCompatibilityBenchmarkCase['seed']
    readonly metrics:
      readonly LivingFrameControlledSdxlCompatibilityBenchmarkCase[
        'metricCodes'
      ][number][]
  },
): LivingFrameControlledSdxlCompatibilityBenchmarkCase {
  const enabled = [...input.enabled]
  return {
    order: input.order,
    caseId: input.caseId,
    caseClass: input.caseClass,
    comparisonCaseId: input.comparisonCaseId,
    enabledComponents: enabled,
    disabledComponents:
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS
        .filter((component) => !enabled.includes(component)),
    seedGroup: input.seedGroup,
    seed: input.seed,
    outputWidthPixels: 1024,
    outputHeightPixels: 1024,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
    stepCount: 24,
    cfg: 5.5,
    denoise: 1,
    metricCodes: [...input.metrics],
  }
}

function exactBoolean(
  metricCode:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[
      'metricCode'
    ],
  exactBooleanValue: boolean,
): LivingFrameControlledSdxlCompatibilityBenchmarkThreshold {
  return {
    metricCode,
    comparison: 'equals',
    unit: 'boolean',
    minimum: null,
    maximum: null,
    exactBoolean: exactBooleanValue,
  }
}

function atMost(
  metricCode:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[
      'metricCode'
    ],
  maximum: number,
  unit:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold['unit'],
): LivingFrameControlledSdxlCompatibilityBenchmarkThreshold {
  return {
    metricCode,
    comparison: 'less_than_or_equal',
    unit,
    minimum: null,
    maximum,
    exactBoolean: null,
  }
}

function atLeast(
  metricCode:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[
      'metricCode'
    ],
  minimum: number,
  unit:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold['unit'],
): LivingFrameControlledSdxlCompatibilityBenchmarkThreshold {
  return {
    metricCode,
    comparison: 'greater_than_or_equal',
    unit,
    minimum,
    maximum: null,
    exactBoolean: null,
  }
}

function within(
  metricCode:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[
      'metricCode'
    ],
  minimum: number,
  maximum: number,
  unit:
    LivingFrameControlledSdxlCompatibilityBenchmarkThreshold['unit'],
): LivingFrameControlledSdxlCompatibilityBenchmarkThreshold {
  return {
    metricCode,
    comparison: 'within_inclusive_range',
    unit,
    minimum,
    maximum,
    exactBoolean: null,
  }
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlCompatibilityBenchmarkSpecInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'specificationId',
      'candidateSet',
      'candidateSetInput',
    ])
    || typeof input.specificationId !== 'string'
    || !SAFE_ID.test(input.specificationId)
    || !isRecord(input.candidateSet)
    || !isRecord(input.candidateSetInput)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code:
    LivingFrameControlledSdxlCompatibilityBenchmarkIssueCode,
  path: string,
): LivingFrameControlledSdxlCompatibilityBenchmarkSpecError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown Living Frame benchmark issue code.')
  return new LivingFrameControlledSdxlCompatibilityBenchmarkSpecError([
    { code, path },
  ])
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

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
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

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  )
}

function deepFreeze<T>(value: T): T {
  if (
    typeof value !== 'object'
    || value === null
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(value)) {
    deepFreeze(child)
  }
  return value
}
