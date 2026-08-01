import { createHash } from 'node:crypto'

import type {
  LivingFrameComfyUiModelArtifactIssue,
  LivingFrameComfyUiModelArtifactIssueCode,
  LivingFrameComfyUiModelArtifactRequirement,
  LivingFrameComfyUiModelArtifactRequirements,
  LivingFrameComfyUiModelArtifactRequirementsAuthority,
  LivingFrameComfyUiModelArtifactRequirementsDraft,
} from '../../src/types/living-frame-comfyui-model-artifact-requirements'
import {
  LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_ISSUES,
  LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_OPEN_GATES,
  LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_CLASS,
  LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_VERSION,
} from '../../src/types/living-frame-comfyui-model-artifact-requirements'
import type {
  LivingFrameControlledModelFamilyBinding,
  LivingFrameControlledModelFamilyExpectation,
} from '../../src/types/living-frame-controlled-model-family-binding'
import type {
  LivingFrameComfyUiDependencyLockEvidence,
} from '../../src/types/living-frame-comfyui-dependency-lock-evidence'
import {
  verifyLivingFrameControlledModelFamilyBinding,
} from './living-frame-controlled-model-family-binding'
import type {
  CreateLivingFrameControlledModelFamilyBindingInput,
} from './living-frame-controlled-model-family-binding'
import {
  verifyLivingFrameComfyUiDependencyLockEvidence,
} from './living-frame-comfyui-dependency-lock-evidence'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const SHA256 = /^[a-f0-9]{64}$/

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiModelArtifactRequirementsAuthority =
  Object.freeze({
    deterministicRequirementProjectionOnly: true,
    artifactRepositoryAuthority: false,
    artifactLocatorAuthority: false,
    artifactManifestAuthority: false,
    artifactVerificationAuthority: false,
    artifactMountAuthority: false,
    modelCompatibilityAuthority: false,
    licenseReviewAuthority: false,
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

export interface CreateLivingFrameComfyUiModelArtifactRequirementsInput {
  readonly requirementSetId: string
  readonly controlledModelFamilyBinding: unknown
  readonly controlledModelFamilyBindingInput:
    CreateLivingFrameControlledModelFamilyBindingInput
  readonly dependencyLockEvidence: unknown
}

export class LivingFrameComfyUiModelArtifactRequirementsError
  extends Error {
  readonly issues: readonly LivingFrameComfyUiModelArtifactIssue[]

  constructor(
    issues: readonly LivingFrameComfyUiModelArtifactIssue[],
  ) {
    super('Living Frame ComfyUI model-artifact requirements failed.')
    this.name =
      'LivingFrameComfyUiModelArtifactRequirementsError'
    this.issues = issues
  }
}

export function createLivingFrameComfyUiModelArtifactRequirements(
  input: CreateLivingFrameComfyUiModelArtifactRequirementsInput,
): LivingFrameComfyUiModelArtifactRequirements {
  assertInput(input)
  if (
    !verifyLivingFrameControlledModelFamilyBinding(
      input.controlledModelFamilyBinding,
      input.controlledModelFamilyBindingInput,
    )
  ) throw invalid(
    'model_family_binding_invalid',
    '$.controlledModelFamilyBinding',
  )
  const dependencyResult =
    verifyLivingFrameComfyUiDependencyLockEvidence(
      input.dependencyLockEvidence,
    )
  if (!dependencyResult.ok) throw invalid(
    'dependency_lock_evidence_invalid',
    '$.dependencyLockEvidence',
  )
  const familyBinding =
    input.controlledModelFamilyBinding as
      LivingFrameControlledModelFamilyBinding
  const dependencyLockEvidence =
    dependencyResult.evidence
  assertParentLineage(familyBinding, dependencyLockEvidence)
  const requirements = compileRequirements(familyBinding)
  const metrics = deriveMetrics(requirements)
  const draft: LivingFrameComfyUiModelArtifactRequirementsDraft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_VERSION,
    resultClass:
      LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_CLASS,
    requirementSetId: input.requirementSetId,
    requirementState: 'exact_unresolved_requirements_projected',
    sourceBindings: {
      controlledModelFamilyBindingId: familyBinding.bindingId,
      controlledModelFamilyBindingDigestSha256:
        familyBinding.bindingDigestSha256,
      stockWorkflowExpectationId:
        familyBinding.sourceBindings.stockWorkflowExpectationId,
      stockWorkflowExpectationDigestSha256:
        familyBinding.sourceBindings
          .stockWorkflowExpectationDigestSha256,
      dependencyLockEvidenceId:
        dependencyLockEvidence.evidenceId,
      dependencyLockEvidenceDigestSha256:
        dependencyLockEvidence.evidenceDigestSha256,
    },
    requirements,
    metrics,
    openGateCodes:
      LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    parentContractsRevalidated: true,
    graphSlotsExactlyCoveredByFamilyBinding: true,
    familyExpectationsExactlyMatched: true,
    dependencyLockEvidenceRevalidated: true,
    genericCanonicalArtifactRepositoryRemainsAuthority: true,
    containsArtifactLocatorManifestBytesPathUrlOrFilename: false,
    containsProviderToolOperationWorkQueueCostOrCommercialRoute: false,
    artifactRequirementsResolved: false,
    gpuWorkerAvailable: false,
    promptExecutable: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    requirementsDigestSha256: digest(draft),
  }
}

export function verifyLivingFrameComfyUiModelArtifactRequirements(
  value: unknown,
  input: CreateLivingFrameComfyUiModelArtifactRequirementsInput,
): value is LivingFrameComfyUiModelArtifactRequirements {
  try {
    if (!isRecord(value)) return false
    return canonicalJson(value) === canonicalJson(
      createLivingFrameComfyUiModelArtifactRequirements(input),
    )
  } catch {
    return false
  }
}

function assertParentLineage(
  familyBinding: LivingFrameControlledModelFamilyBinding,
  dependencyLockEvidence: LivingFrameComfyUiDependencyLockEvidence,
): void {
  if (
    !SHA256.test(familyBinding.bindingDigestSha256)
    || !SHA256.test(dependencyLockEvidence.evidenceDigestSha256)
    || familyBinding.currentArtifactMetadataPresent !== false
    || familyBinding.exactArtifactCompatibilityProven !== false
    || dependencyLockEvidence.productionReady !== false
    || dependencyLockEvidence.authorityBoundary
      .modelArtifactAuthority !== false
    || dependencyLockEvidence.authorityBoundary
      .gpuExecutionAuthority !== false
  ) throw invalid('parent_lineage_mismatch', '$.sourceBindings')
}

function compileRequirements(
  familyBinding: LivingFrameControlledModelFamilyBinding,
): LivingFrameComfyUiModelArtifactRequirement[] {
  const expected = [...familyBinding.familyExpectations]
    .sort((left, right) => left.order - right.order)
  if (
    expected.length === 0
    || expected[0]?.role !== 'base_checkpoint'
    || new Set(expected.map((entry) => entry.role)).size
      !== expected.length
  ) throw invalid('family_expectation_invalid', '$.requirements')
  return expected.map((expectation, index) => {
    if (
      expectation.order !== index + 1
      || !SHA256.test(expectation.bindingDigestSha256)
    ) throw invalid(
      'requirement_order_invalid',
      `$.requirements.${index}`,
    )
    return requirement(expectation, index + 1)
  })
}

function requirement(
  expectation: LivingFrameControlledModelFamilyExpectation,
  order: number,
): LivingFrameComfyUiModelArtifactRequirement {
  return {
    order,
    role: expectation.role,
    bindingKind: expectation.bindingKind,
    bindingDigestSha256: expectation.bindingDigestSha256,
    expectedFamily:
      expectation.role === 'clip_vision_checkpoint'
        ? {
            familyClass: 'clip_vision_model_family',
            family: expectation.expectedClipVisionFamily,
          }
        : {
            familyClass: 'diffusion_base_model_family',
            family: expectation.expectedBaseModelFamily,
          },
    executionExpectation: {
      executionClass: 'gpu_required',
      requiredExecutionTarget: 'google_cloud_run_gpu',
      accelerator: 'cuda',
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
    artifactLocatorBound: false,
    artifactManifestVerified: false,
    artifactBytesMounted: false,
    compatibilityBenchmarkPassed: false,
    paidProductionUseApproved: false,
  }
}

function deriveMetrics(
  requirements:
    readonly LivingFrameComfyUiModelArtifactRequirement[],
): LivingFrameComfyUiModelArtifactRequirementsDraft['metrics'] {
  return {
    requirementCount: requirements.length,
    diffusionCheckpointCount: requirements.filter((entry) =>
      entry.role === 'base_checkpoint'
      || entry.role === 'controlnet_checkpoint').length,
    adapterCount: requirements.filter((entry) =>
      entry.role === 'lora_adapter'
      || entry.role === 'generic_ipadapter_checkpoint').length,
    clipVisionCount: requirements.filter((entry) =>
      entry.role === 'clip_vision_checkpoint').length,
    unresolvedRequirementCount: requirements.length,
  }
}

function assertInput(
  input: CreateLivingFrameComfyUiModelArtifactRequirementsInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'requirementSetId',
      'controlledModelFamilyBinding',
      'controlledModelFamilyBindingInput',
      'dependencyLockEvidence',
    ])
    || typeof input.requirementSetId !== 'string'
    || !SAFE_ID.test(input.requirementSetId)
  ) throw invalid('input_invalid', '$')
}

function invalid(
  code: LivingFrameComfyUiModelArtifactIssueCode,
  path: string,
): LivingFrameComfyUiModelArtifactRequirementsError {
  if (
    !(LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_ISSUES as readonly string[])
      .includes(code)
  ) throw new Error('Unknown Living Frame model-artifact issue code.')
  return new LivingFrameComfyUiModelArtifactRequirementsError([
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value))
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
