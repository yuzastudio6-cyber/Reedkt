import { createHash } from 'node:crypto'

import type {
  LivingFrameComfyUiModelArtifactRequirement,
  LivingFrameComfyUiModelArtifactRequirements,
} from '../../src/types/living-frame-comfyui-model-artifact-requirements'
import type {
  CanonicalModelArtifactGpuBundleRequirement,
} from '../model-artifacts/canonical-model-artifact-cloud-run-gpu-handoff-types'
import type {
  CanonicalModelArtifactLocator,
  CanonicalModelArtifactRepositoryPort,
} from '../model-artifacts/canonical-model-artifact-types'
import {
  verifyCanonicalModelArtifact,
} from '../model-artifacts/canonical-model-artifact-repository'
import type {
  CreateLivingFrameComfyUiModelArtifactRequirementsInput,
} from './living-frame-comfyui-model-artifact-requirements'
import {
  verifyLivingFrameComfyUiModelArtifactRequirements,
} from './living-frame-comfyui-model-artifact-requirements'

export const
LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_VERSION =
  'living-frame-comfyui-canonical-model-artifact-binding-v1' as const

export const
LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_CLASS =
  'server_verified_comfyui_model_artifact_requirement_binding' as const

export const
LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_STATE =
  'repository_objects_verified_pending_canonical_gpu_operation_bundle' as const

export const
LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_OPEN_GATES = [
  'canonical_operation_owned_artifact_set_required',
  'canonical_registered_gpu_tool_operation_required',
  'exact_comfyui_dependency_and_node_schema_lock_required',
  'exact_model_bundle_compatibility_benchmark_required',
  'license_and_paid_use_review_required',
  'selected_scene_and_approved_snapshot_binding_required',
  'canonical_cloud_run_gpu_attempt_required',
  'private_gcs_distribution_and_read_only_mount_required',
  'canonical_dispatch_work_cost_asset_and_qa_binding_required',
  'private_review_required',
] as const

export type LivingFrameComfyUiCanonicalModelArtifactOpenGate =
  (typeof
    LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_OPEN_GATES)[number]

export const
LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_ISSUES = [
  'input_invalid',
  'requirements_invalid',
  'repository_invalid',
  'resolver_invalid',
  'locator_resolution_failed',
  'artifact_role_mismatch',
  'model_family_mismatch',
  'artifact_format_mismatch',
  'consumer_scope_mismatch',
  'gpu_execution_policy_mismatch',
  'requirement_order_mismatch',
  'duplicate_artifact_record',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameComfyUiCanonicalModelArtifactBindingIssueCode =
  (typeof
    LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_ISSUES)[number]

export interface LivingFrameComfyUiCanonicalModelArtifactLocatorResolverPort {
  readonly resolverClass:
    'process_bound_server_owned_comfyui_model_artifact_locator_resolver'
  readonly consumerScope: 'comfyui.private-inference'
  readonly callerLocatorAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly callerBytesAccepted: false
  readonly toolRouteAuthority: false
  readonly modelExecutionAuthority: false
  readonly productionReady: false
  resolveServerOwnedLocator(
    requirement: Readonly<{
      order: number
      role: LivingFrameComfyUiModelArtifactRequirement['role']
      bindingKind:
        LivingFrameComfyUiModelArtifactRequirement['bindingKind']
      bindingDigestSha256: string
      expectedModelFamily: string
    }>,
  ): Promise<CanonicalModelArtifactLocator>
}

export interface LivingFrameComfyUiCanonicalModelArtifactBindingEntry {
  readonly canonicalOrder: number
  readonly sourceRequirementOrder: number
  readonly role: LivingFrameComfyUiModelArtifactRequirement['role']
  readonly bindingKind:
    LivingFrameComfyUiModelArtifactRequirement['bindingKind']
  readonly bindingDigestSha256: string
  readonly expectedModelFamily: string
  readonly locator: CanonicalModelArtifactLocator
  readonly descriptorDigestSha256: string
  readonly objectIdentityDigestSha256: string
  readonly artifactId: string
  readonly revision: string
  readonly artifactFormat: 'safetensors'
  readonly artifactRole: string
  readonly modelFamily: string
  readonly byteLength: number
  readonly contentSha256: string
  readonly repositoryAdmission:
    | 'controlled_internal_test'
    | 'reviewed_repository_candidate'
  readonly consumerScope: string
  readonly commercialUseStatus:
    | 'allowed'
    | 'blocked'
    | 'unknown'
    | 'needs_review'
  readonly reviewStatus:
    | 'not_reviewed'
    | 'needs_review'
    | 'approved'
    | 'blocked'
    | 'evaluation_only'
  readonly paidProductionUseApproved: boolean
  readonly fullRepositoryChecksumVerified: true
  readonly gpuExecutionPolicyVerified: true
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly cpuFallbackAllowed: false
  readonly compatibilityBenchmarkPassed: false
  readonly gpuBundleRequirement:
    CanonicalModelArtifactGpuBundleRequirement
}

export interface LivingFrameComfyUiCanonicalModelArtifactBindingAuthority {
  readonly canonicalRepositoryVerificationConsumed: true
  readonly serverOwnedLocatorResolutionConsumed: true
  readonly artifactRepositoryMutationAuthority: false
  readonly artifactIngestAuthority: false
  readonly artifactMountAuthority: false
  readonly artifactCompatibilityAuthority: false
  readonly licenseApprovalAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactCreationAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComfyUiCanonicalModelArtifactBindingDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_CLASS
  readonly bindingId: string
  readonly bindingState:
    typeof
      LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_STATE
  readonly sourceBindings: {
    readonly requirementSetId: string
    readonly requirementsDigestSha256: string
  }
  readonly consumerScope: 'comfyui.private-inference'
  readonly entries:
    readonly LivingFrameComfyUiCanonicalModelArtifactBindingEntry[]
  readonly canonicalGpuBundleRequirements:
    readonly CanonicalModelArtifactGpuBundleRequirement[]
  readonly metrics: {
    readonly requiredArtifactCount: number
    readonly verifiedArtifactCount: number
    readonly totalByteLength: number
    readonly reviewedRepositoryCandidateCount: number
    readonly paidProductionUseApprovedCount: number
    readonly compatibilityBenchmarkPassedCount: 0
  }
  readonly openGateCodes:
    readonly LivingFrameComfyUiCanonicalModelArtifactOpenGate[]
  readonly authorityBoundary:
    LivingFrameComfyUiCanonicalModelArtifactBindingAuthority
  readonly sourceRequirementsRevalidated: true
  readonly everyLocatorResolvedByProcessBoundServerPort: true
  readonly everyRepositoryObjectFullyChecksumVerified: true
  readonly exactRoleFamilyFormatAndGpuPolicyVerified: true
  readonly canonicalGpuBundleRequirementProjectionComplete: true
  readonly canonicalOperationArtifactSetVerified: false
  readonly artifactsMounted: false
  readonly modelInferenceExecuted: false
  readonly containsPathUrlCredentialBytesFilenameOrMountAlias: false
  readonly containsCallerSelectedToolOperationProviderOrRoute: false
  readonly createsWorkDispatchQueueCostAssetOrQaState: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiCanonicalModelArtifactBinding
  extends LivingFrameComfyUiCanonicalModelArtifactBindingDraft {
  readonly bindingDigestSha256: string
}

export interface BindLivingFrameComfyUiCanonicalModelArtifactsInput {
  readonly bindingId: string
  readonly requirements: LivingFrameComfyUiModelArtifactRequirements
  readonly requirementsInput:
    CreateLivingFrameComfyUiModelArtifactRequirementsInput
  readonly repository: CanonicalModelArtifactRepositoryPort | null
  readonly locatorResolver:
    LivingFrameComfyUiCanonicalModelArtifactLocatorResolverPort | null
}

export interface LivingFrameComfyUiCanonicalModelArtifactBindingIssue {
  readonly code:
    LivingFrameComfyUiCanonicalModelArtifactBindingIssueCode
  readonly path: string
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/

const resolverPorts = new WeakSet<object>()

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiCanonicalModelArtifactBindingAuthority =
  Object.freeze({
    canonicalRepositoryVerificationConsumed: true,
    serverOwnedLocatorResolutionConsumed: true,
    artifactRepositoryMutationAuthority: false,
    artifactIngestAuthority: false,
    artifactMountAuthority: false,
    artifactCompatibilityAuthority: false,
    licenseApprovalAuthority: false,
    toolRegistryAuthority: false,
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

export class LivingFrameComfyUiCanonicalModelArtifactBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameComfyUiCanonicalModelArtifactBindingIssue[]

  constructor(
    issues:
      readonly LivingFrameComfyUiCanonicalModelArtifactBindingIssue[],
  ) {
    super('Living Frame canonical model-artifact binding failed.')
    this.name =
      'LivingFrameComfyUiCanonicalModelArtifactBindingError'
    this.issues = issues
  }
}

export function createLivingFrameComfyUiCanonicalModelArtifactLocatorResolver(
  input: {
    readonly consumerScope: 'comfyui.private-inference'
    readonly resolveServerOwnedLocator:
      LivingFrameComfyUiCanonicalModelArtifactLocatorResolverPort[
        'resolveServerOwnedLocator'
      ]
  },
): LivingFrameComfyUiCanonicalModelArtifactLocatorResolverPort {
  if (
    input.consumerScope !== 'comfyui.private-inference'
    || typeof input.resolveServerOwnedLocator !== 'function'
  ) throw invalid('resolver_invalid', '$.locatorResolver')
  const port =
    Object.freeze<
      LivingFrameComfyUiCanonicalModelArtifactLocatorResolverPort
    >({
      resolverClass:
        'process_bound_server_owned_comfyui_model_artifact_locator_resolver',
      consumerScope: input.consumerScope,
      callerLocatorAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      callerBytesAccepted: false,
      toolRouteAuthority: false,
      modelExecutionAuthority: false,
      productionReady: false,
      resolveServerOwnedLocator:
        input.resolveServerOwnedLocator.bind(undefined),
    })
  resolverPorts.add(port)
  return port
}

export async function bindLivingFrameComfyUiCanonicalModelArtifacts(
  input: BindLivingFrameComfyUiCanonicalModelArtifactsInput,
): Promise<LivingFrameComfyUiCanonicalModelArtifactBinding> {
  assertInput(input)
  if (
    !verifyLivingFrameComfyUiModelArtifactRequirements(
      input.requirements,
      input.requirementsInput,
    )
  ) throw invalid('requirements_invalid', '$.requirements')
  const resolver = requireResolver(input.locatorResolver)
  const entries:
    LivingFrameComfyUiCanonicalModelArtifactBindingEntry[] = []
  const artifactRecordIds = new Set<string>()

  for (
    let canonicalOrder = 0;
    canonicalOrder < input.requirements.requirements.length;
    canonicalOrder += 1
  ) {
    const requirement =
      input.requirements.requirements[canonicalOrder]!
    if (requirement.order !== canonicalOrder + 1) {
      throw invalid(
        'requirement_order_mismatch',
        `$.requirements.${canonicalOrder}`,
      )
    }
    let locator: CanonicalModelArtifactLocator
    try {
      locator = await resolver.resolveServerOwnedLocator({
        order: requirement.order,
        role: requirement.role,
        bindingKind: requirement.bindingKind,
        bindingDigestSha256: requirement.bindingDigestSha256,
        expectedModelFamily:
          requirement.expectedFamily.family,
      })
    } catch {
      throw invalid(
        'locator_resolution_failed',
        `$.requirements.${canonicalOrder}`,
      )
    }
    let verified
    try {
      verified = await verifyCanonicalModelArtifact({
        repository: input.repository,
        locator,
      })
    } catch {
      throw invalid(
        'repository_invalid',
        `$.requirements.${canonicalOrder}`,
      )
    }
    const descriptor = verified.manifest.descriptor
    assertDescriptor({
      descriptor,
      requirement,
      consumerScope: resolver.consumerScope,
      path: `$.requirements.${canonicalOrder}`,
    })
    if (artifactRecordIds.has(locator.artifactRecordId)) {
      throw invalid(
        'duplicate_artifact_record',
        `$.requirements.${canonicalOrder}`,
      )
    }
    artifactRecordIds.add(locator.artifactRecordId)
    const gpuBundleRequirement:
      CanonicalModelArtifactGpuBundleRequirement = {
      canonicalOrder,
      slotId: `living-frame-${requirement.role}`,
      locator,
      expectedArtifactId: descriptor.artifactId,
      expectedRevision: descriptor.revision,
      expectedArtifactFormat: descriptor.artifactFormat,
      expectedArtifactRole: descriptor.artifactRole,
      expectedModelFamily: descriptor.modelFamily,
      expectedByteLength: descriptor.byteLength,
      expectedContentSha256: descriptor.contentSha256,
      required: true,
    }
    entries.push({
      canonicalOrder,
      sourceRequirementOrder: requirement.order,
      role: requirement.role,
      bindingKind: requirement.bindingKind,
      bindingDigestSha256: requirement.bindingDigestSha256,
      expectedModelFamily:
        requirement.expectedFamily.family,
      locator,
      descriptorDigestSha256:
        verified.manifest.descriptorDigestSha256,
      objectIdentityDigestSha256:
        verified.objectIdentityDigestSha256,
      artifactId: descriptor.artifactId,
      revision: descriptor.revision,
      artifactFormat: 'safetensors',
      artifactRole: descriptor.artifactRole,
      modelFamily: descriptor.modelFamily,
      byteLength: descriptor.byteLength,
      contentSha256: descriptor.contentSha256,
      repositoryAdmission: descriptor.repositoryAdmission,
      consumerScope: resolver.consumerScope,
      commercialUseStatus:
        descriptor.licensePolicy.commercialUseStatus,
      reviewStatus: descriptor.licensePolicy.reviewStatus,
      paidProductionUseApproved:
        descriptor.licensePolicy.paidProductionUseApproved,
      fullRepositoryChecksumVerified: true,
      gpuExecutionPolicyVerified: true,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
      cpuFallbackAllowed: false,
      compatibilityBenchmarkPassed: false,
      gpuBundleRequirement,
    })
  }

  const draft:
    LivingFrameComfyUiCanonicalModelArtifactBindingDraft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_VERSION,
    resultClass:
      LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_CLASS,
    bindingId: input.bindingId,
    bindingState:
      LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_STATE,
    sourceBindings: {
      requirementSetId: input.requirements.requirementSetId,
      requirementsDigestSha256:
        input.requirements.requirementsDigestSha256,
    },
    consumerScope: resolver.consumerScope,
    entries,
    canonicalGpuBundleRequirements:
      entries.map((entry) => entry.gpuBundleRequirement),
    metrics: {
      requiredArtifactCount: entries.length,
      verifiedArtifactCount: entries.length,
      totalByteLength:
        entries.reduce((sum, entry) => sum + entry.byteLength, 0),
      reviewedRepositoryCandidateCount:
        entries.filter((entry) =>
          entry.repositoryAdmission
            === 'reviewed_repository_candidate').length,
      paidProductionUseApprovedCount:
        entries.filter((entry) =>
          entry.paidProductionUseApproved).length,
      compatibilityBenchmarkPassedCount: 0,
    },
    openGateCodes:
      LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    sourceRequirementsRevalidated: true,
    everyLocatorResolvedByProcessBoundServerPort: true,
    everyRepositoryObjectFullyChecksumVerified: true,
    exactRoleFamilyFormatAndGpuPolicyVerified: true,
    canonicalGpuBundleRequirementProjectionComplete: true,
    canonicalOperationArtifactSetVerified: false,
    artifactsMounted: false,
    modelInferenceExecuted: false,
    containsPathUrlCredentialBytesFilenameOrMountAlias: false,
    containsCallerSelectedToolOperationProviderOrRoute: false,
    createsWorkDispatchQueueCostAssetOrQaState: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    bindingDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameComfyUiCanonicalModelArtifactBinding(
  value: unknown,
  input: BindLivingFrameComfyUiCanonicalModelArtifactsInput,
): Promise<boolean> {
  try {
    return canonicalJson(value) === canonicalJson(
      await bindLivingFrameComfyUiCanonicalModelArtifacts(input),
    )
  } catch {
    return false
  }
}

function assertInput(
  input: BindLivingFrameComfyUiCanonicalModelArtifactsInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'bindingId',
      'requirements',
      'requirementsInput',
      'repository',
      'locatorResolver',
    ])
    || typeof input.bindingId !== 'string'
    || !SAFE_ID.test(input.bindingId)
  ) throw invalid('input_invalid', '$')
}

function requireResolver(
  value:
    LivingFrameComfyUiCanonicalModelArtifactLocatorResolverPort | null,
): LivingFrameComfyUiCanonicalModelArtifactLocatorResolverPort {
  if (
    !value
    || !resolverPorts.has(value)
    || value.resolverClass
      !==
      'process_bound_server_owned_comfyui_model_artifact_locator_resolver'
    || value.consumerScope !== 'comfyui.private-inference'
    || value.callerLocatorAccepted !== false
    || value.callerPathAccepted !== false
    || value.callerUrlAccepted !== false
    || value.callerBytesAccepted !== false
    || value.toolRouteAuthority !== false
    || value.modelExecutionAuthority !== false
    || value.productionReady !== false
    || typeof value.resolveServerOwnedLocator !== 'function'
  ) throw invalid('resolver_invalid', '$.locatorResolver')
  return value
}

function assertDescriptor(input: {
  descriptor: Awaited<
    ReturnType<typeof verifyCanonicalModelArtifact>
  >['manifest']['descriptor']
  requirement: LivingFrameComfyUiModelArtifactRequirement
  consumerScope: string
  path: string
}): void {
  const { descriptor, requirement, consumerScope, path } = input
  if (descriptor.artifactRole !== requirement.role) {
    throw invalid('artifact_role_mismatch', path)
  }
  if (
    descriptor.modelFamily
      !== requirement.expectedFamily.family
  ) throw invalid('model_family_mismatch', path)
  if (descriptor.artifactFormat !== 'safetensors') {
    throw invalid('artifact_format_mismatch', path)
  }
  if (!descriptor.consumerScopes.includes(consumerScope)) {
    throw invalid('consumer_scope_mismatch', path)
  }
  if (
    descriptor.executionPolicy.executionClass !== 'gpu_required'
    || descriptor.executionPolicy.requiredExecutionTarget
      !== 'google_cloud_run_gpu'
    || descriptor.executionPolicy.accelerator !== 'cuda'
    || descriptor.executionPolicy.cpuFallbackAllowed !== false
    || descriptor.executionPolicy.runtimeDownloadAllowed !== false
    || descriptor.executionPolicy.networkFetchAllowed !== false
  ) throw invalid('gpu_execution_policy_mismatch', path)
}

function invalid(
  code:
    LivingFrameComfyUiCanonicalModelArtifactBindingIssueCode,
  path: string,
): LivingFrameComfyUiCanonicalModelArtifactBindingError {
  if (
    !(LIVING_FRAME_COMFYUI_CANONICAL_MODEL_ARTIFACT_BINDING_ISSUES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown Living Frame model binding issue.')
  return new LivingFrameComfyUiCanonicalModelArtifactBindingError([
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
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [
        key,
        canonicalize(value[key]),
      ]),
    )
  }
  throw invalid('input_invalid', '$')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested)
    }
  }
  return value
}
