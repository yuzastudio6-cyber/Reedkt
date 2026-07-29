import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_CLASS,
  LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_ISSUE_CODES,
  LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_OPEN_GATES,
  LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_STATE,
  LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_VERSION,
  type LivingFrameComfyUiOperationAdmissionCandidate,
  type LivingFrameComfyUiOperationAdmissionCandidateAuthority,
  type LivingFrameComfyUiOperationAdmissionCandidateDraft,
  type LivingFrameComfyUiOperationAdmissionCandidateIssue,
  type LivingFrameComfyUiOperationAdmissionCandidateIssueCode,
} from '../../src/types/living-frame-comfyui-operation-admission-candidate'
import {
  PRODUCTION_TOOL_IDS,
  getNonE2EToolCapabilityProfile,
  isProductionToolId,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-registry'
import {
  getLivingFrameComfyUiOfflinePackageSourceContract,
} from './living-frame-comfyui-offline-package-source-contract'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const EXPECTED_PRODUCTION_TOOL_COUNT = 50

const AUTHORITY_BOUNDARY:
  LivingFrameComfyUiOperationAdmissionCandidateAuthority =
  deepFreeze({
    admissionCandidateCompilationAuthority: true,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    toolCountAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    modelArtifactAuthority: false,
    assetManifestAuthority: false,
    actualCostAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export class LivingFrameComfyUiOperationAdmissionCandidateError
  extends Error {
  readonly issues:
    readonly LivingFrameComfyUiOperationAdmissionCandidateIssue[]

  constructor(
    issues:
      readonly LivingFrameComfyUiOperationAdmissionCandidateIssue[],
  ) {
    super(
      'Living Frame ComfyUI operation admission candidate failed.',
    )
    this.name =
      'LivingFrameComfyUiOperationAdmissionCandidateError'
    this.issues = issues
  }
}

export async function createLivingFrameComfyUiOperationAdmissionCandidate(
  input: {
    readonly candidateId: string
  },
): Promise<LivingFrameComfyUiOperationAdmissionCandidate> {
  assertInput(input)
  const source =
    await getLivingFrameComfyUiOfflinePackageSourceContract()
  assertCurrentRegistryState()
  const draft:
    LivingFrameComfyUiOperationAdmissionCandidateDraft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_VERSION,
    resultClass:
      LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_CLASS,
    candidateState:
      LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_STATE,
    candidateId: input.candidateId,
    sourceBindings: {
      offlinePackageSourceContractVersion:
        source.contractVersion,
      offlinePackageSourceContractDigestSha256:
        source.contractDigestSha256,
      offlinePackageSourceDigestSha256:
        source.sourceDigestSha256,
      fixedLaunchSpecDigestSha256:
        source.processContract.fixedLaunchSpecDigestSha256,
      lockedWheelManifestDigestSha256:
        source.dependencyClosure.wheelManifestDigestSha256,
      deniedTopLevelImports:
        source.processContract.deniedTopLevelImports,
      outOfScopeDirectVcsImportsAllowed:
        source.processContract.outOfScopeDirectVcsImportsAllowed,
    },
    currentRegistryObservation: {
      productionToolIdentityCount:
        EXPECTED_PRODUCTION_TOOL_COUNT,
      catalogIdentity: 'comfyui',
      catalogEntryPresent: true,
      catalogState: 'non_e2e_evaluation_only',
      productionToolIdentityPresent: false,
      canonicalOperationPresent: false,
      requestedPostAdmissionToolCountAsserted: false,
    },
    admissionDecision: {
      canonicalToolId: 'comfyui',
      canonicalOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      operationName: 'generate_controlled_image',
      workItemType: 'generate_image_asset',
      executableToolIdentityCountRequested: 1,
      representedCapabilityKeys: [
        'comfyui',
        'comfyui_controlnet_aux',
        'controlnet',
        'ip_adapter',
        'peft_lora',
        'auraface',
      ],
      sixCapabilityToolIdentityFanoutAllowed: false,
      fiveGpuCapabilityChargesAllowed: false,
      auraFaceExecutionPlacement: 'separate_optional_cpu_qa',
      registryMutationIncluded: false,
      backendOwnerMustResolveExactToolCountPolicy: true,
    },
    requestProjection: {
      callerRequestContainsRawPrompt: false,
      callerRequestContainsPathUrlCommandOrCredential: false,
      approvedSnapshotRequired: true,
      approvedWorkItemRequired: true,
      activeCreditReservationRequired: true,
      opaqueWorkerLeaseRequired: true,
      idempotencyKeyRequired: true,
      modelManifestRequired: true,
      exactModelRoleCount: 5,
      exactModelArtifactByteLength: 11_700_367_157,
      modelArtifactsTravelInOrdinaryArtifactBindings: false,
      privateInputArtifactMinimum: 0,
      privateInputArtifactMaximum: 2,
      privateInputArtifactKinds: ['image'],
      settings: {
        selectedSceneRequestBindingIdRequired: true,
        selectedSceneRequestBindingDigestSha256Required: true,
        outputFrameExpectationDigestSha256Required: true,
        workflowProfile:
          'living_frame_controlled_sdxl_component_v1',
        outputWidthPixels: 1024,
        outputHeightPixels: 1024,
        outputImageCount: 1,
        outputContentType: 'image/png',
      },
      benchmarkRequestMaySubstituteForSelectedSceneRequest: false,
      selectedSceneRequestProjectionImplemented: false,
    },
    workerRuntimeExpectation: {
      workerType: 'gpu_ai_worker',
      workerImageRole: 'gpu_worker',
      runtimeClass: 'python3_cuda12_gpu_worker',
      imageSourceRoot: 'docker/prod/gpu-worker/comfyui',
      accelerator: 'nvidia_l4',
      gpuCount: 1,
      cpuFallbackAllowed: false,
      networkMode: 'offline_required',
      runtimeDownloadAllowed: false,
      externalListenAllowed: false,
      readOnlyRootFilesystemRequired: true,
      unprivilegedUid: 65532,
      unprivilegedGid: 65532,
      capabilitiesDropped: true,
      noNewPrivileges: true,
      sourceAndModelArtifactsMountedReadOnly: true,
      privateInputMountedReadOnly: true,
      isolatedEphemeralWriteRootsRequired: true,
      processEntrypointKind: 'fixed_supervised_python_process',
      genericEntrypointTypeCurrentlySupportsThisKind: false,
      callerExecutableArgumentsEnvironmentOrPathAllowed: false,
    },
    resourceCeilings: {
      timeoutMilliseconds: 600_000,
      maximumAttemptsPerApprovedWorkItem: 3,
      vcpuLimit: 4,
      memoryMebibyteLimit: 16_384,
      gpuLimit: 1,
      temporaryStorageMebibyteLimit: 8_192,
      maximumPrivateInputBytes: 2_147_483_648,
      maximumOutputBytes: 4_294_967_296,
      maximumOutputArtifacts: 1,
      maximumNetworkRequests: 0,
      maximumNetworkResponseBytes: 0,
      terminateProcessTreeOnTimeout: true,
      outputVerificationBeforePromotion: true,
    },
    qaProjection: {
      immediateOperationGateTypes: [
        'render_asset_integrity',
      ],
      requiredBeforePreview: [
        'render_asset_integrity',
      ],
      requiredBeforeFinalExport: [
        'render_asset_integrity',
      ],
      downstreamLivingFrameEvidenceRequired: [
        'generated_source_integrity',
        'alpha_and_edge_quality_when_componentized',
        'visual_continuity_when_requested',
        'documentary_and_identity_safety',
        'destination_composite_legibility',
        'asset_manifest_reconciliation',
        'private_review',
        'remotion_final_composition',
      ],
      operationOutputAloneMayReachFinalExport: false,
    },
    costProjection: {
      estimateCostComponentId:
        'shared_controlled_illustration_gpu_host',
      oneOperationRequestRepresentsOneGpuAttempt: true,
      firstFiveCapabilitiesShareAttemptLifetime: true,
      auraFaceCpuQaExcludedFromGpuAttempt: true,
      exactReuseCreatesNoGpuAttempt: true,
      failedOrUnknownAttemptCostRetentionRequired: true,
      actualInternalToolCostOnly: true,
      serviceFeeIncluded: false,
      workerMayMutateWalletOrSettle: false,
      requiredMeasurements: [
        'startedAt',
        'completedAt',
        'wallTimeMilliseconds',
        'attemptNumber',
        'inputBytes',
        'outputBytes',
        'peakMemoryMiB',
        'vcpuMilliseconds',
        'gpuMilliseconds',
      ],
    },
    fallbackProjection: {
      fallbackToolIds: [],
      fallbackMayUseAiVideo: false,
      simplerApprovedStillOrExistingAssetAllowed: true,
      providerStillFallbackRequiresSeparateApprovedRoute: true,
      fallbackMustExistInApprovedSnapshot: true,
      fallbackMayIncreaseCostWithoutNewApproval: false,
      unresolvedRequiredFailureBlocksFinalExport: true,
      independentWorkMayContinue: true,
    },
    openGateCodes: [
      ...LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_OPEN_GATES,
    ],
    authorityBoundary: AUTHORITY_BOUNDARY,
    candidateOnly: true,
    registryMutated: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    productionReady: false,
  }
  assertCandidateSemantics(draft)
  assertSafe(draft)
  return deepFreeze({
    ...draft,
    candidateDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameComfyUiOperationAdmissionCandidate(
  value: unknown,
  input: {
    readonly candidateId: string
  },
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion
        !== LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_VERSION
      || value.resultClass
        !== LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_CLASS
      || value.candidateState
        !== LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_STATE
      || typeof value.candidateDigestSha256 !== 'string'
      || !SHA256.test(value.candidateDigestSha256)
    ) return false
    const {
      candidateDigestSha256,
      ...draft
    } = value
    if (candidateDigestSha256 !== digest(draft)) return false
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameComfyUiOperationAdmissionCandidate(
        input,
      ),
    )
  } catch {
    return false
  }
}

function assertCurrentRegistryState(): void {
  const profile = getNonE2EToolCapabilityProfile('comfyui')
  if (
    PRODUCTION_TOOL_IDS.length !== EXPECTED_PRODUCTION_TOOL_COUNT
    || !profile
    || profile.productionStatus !== 'evaluation_only'
    || profile.executionMode !== 'evaluation_only'
    || isProductionToolId('comfyui')
    || resolveProfessionalToolOperationSpec('comfyui') !== undefined
  ) throw invalid('current_registry_state_changed', '$.currentRegistryObservation')
}

function assertInput(
  input: {
    readonly candidateId: string
  },
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, ['candidateId'])
    || typeof input.candidateId !== 'string'
    || !SAFE_ID.test(input.candidateId)
  ) throw invalid('input_invalid', '$')
}

function assertCandidateSemantics(
  draft: LivingFrameComfyUiOperationAdmissionCandidateDraft,
): void {
  const {
    admissionCandidateCompilationAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  if (
    draft.admissionDecision.executableToolIdentityCountRequested !== 1
    || draft.admissionDecision.representedCapabilityKeys.length !== 6
    || new Set(
      draft.admissionDecision.representedCapabilityKeys,
    ).size !== 6
    || draft.admissionDecision.sixCapabilityToolIdentityFanoutAllowed
      !== false
    || draft.admissionDecision.fiveGpuCapabilityChargesAllowed !== false
    || draft.requestProjection.modelArtifactsTravelInOrdinaryArtifactBindings
      !== false
    || draft.requestProjection.exactModelRoleCount !== 5
    || draft.requestProjection.exactModelArtifactByteLength
      !== 11_700_367_157
    || draft.requestProjection.benchmarkRequestMaySubstituteForSelectedSceneRequest
      !== false
    || draft.workerRuntimeExpectation.processEntrypointKind
      !== 'fixed_supervised_python_process'
    || draft.workerRuntimeExpectation.genericEntrypointTypeCurrentlySupportsThisKind
      !== false
    || draft.resourceCeilings.maximumNetworkRequests !== 0
    || draft.resourceCeilings.maximumNetworkResponseBytes !== 0
    || canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_OPEN_GATES,
      )
    || admissionCandidateCompilationAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.candidateOnly !== true
    || draft.registryMutated !== false
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.runtimeExecuted !== false
    || draft.productionReady !== false
  ) throw invalid('candidate_semantics_invalid', '$')
}

function assertSafe(value: unknown): void {
  const serialized = canonicalJson(value)
  if (
    /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu.test(serialized)
    || /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u
      .test(serialized)
    || serialized.includes('/Users/')
    || serialized.includes('/Volumes/')
    || serialized.includes('/private/tmp/')
  ) throw invalid('unsafe_candidate_forbidden', '$')
}

function invalid(
  code: LivingFrameComfyUiOperationAdmissionCandidateIssueCode,
  path: string,
): LivingFrameComfyUiOperationAdmissionCandidateError {
  if (
    !(LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_ISSUE_CODES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown ComfyUI admission-candidate issue.')
  return new LivingFrameComfyUiOperationAdmissionCandidateError([
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
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
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

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}
