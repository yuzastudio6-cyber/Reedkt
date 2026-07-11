import {
  getFallbackChainsForTool,
  getToolQAPolicy,
  listProfessionalToolAdapterContracts,
  productionToolProfiles,
  type ProductionRegistryWorkerType,
  type ProductionToolId,
  type ProductionToolInputType,
  type ProductionToolProfile,
} from '../tool-registry'
import {
  PROFESSIONAL_TOOL_OPERATION_SEEDS,
  type ProfessionalToolOperationResourceClass,
  type ProfessionalToolOperationSeed,
} from './professional-tool-operation-seeds'
import {
  PROFESSIONAL_TOOL_OPERATION_SPEC_VERSION,
  type ProfessionalToolOperationCostEvidenceRequirements,
  type ProfessionalToolOperationCostUnit,
  type ProfessionalToolOperationDisposition,
  type ProfessionalToolOperationNetworkMode,
  type ProfessionalToolOperationNetworkPolicy,
  type ProfessionalToolOperationPolicyBlock,
  type ProfessionalToolOperationRegistrySummary,
  type ProfessionalToolOperationRequestSchema,
  type ProfessionalToolOperationResourceCeilings,
  type ProfessionalToolOperationSpec,
  type ProfessionalToolOperationWorkerRuntime,
} from './professional-tool-operation-spec-types'

const OPAQUE_ID_PATTERN = '^[A-Za-z][A-Za-z0-9_-]{7,159}$'
const SHA256_PATTERN = '^[a-f0-9]{64}$'
const PRIVATE_INTERNAL_RUNNER_VERIFIED_TOOL_IDS = new Set<ProductionToolId>([
  'audioflux',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'pyscenedetect',
  'scipy',
  'pyloudnorm',
  'pydub',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
  'audioread',
  'resampy',
  'pedalboard',
  'mir_eval',
  'mido',
  'pretty_midi',
  'noisereduce',
  'librosa',
  'viz_js',
  'animejs',
  'three_js',
  'lottie',
  'pixijs',
  'konva',
  'babylon_js',
  'playwright',
  'torch_torchvision',
  'transformers',
  'rembg',
  'deepfilternet',
  'music21',
  'kornia',
  'opencolorio',
  'openimageio',
  'streamer_render_pipeline_support',
  'rnnoise',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
])

const PROHIBITED_PROPERTY_NAMES = [
  'args',
  'arguments',
  'argv',
  'authorization',
  'code',
  'command',
  'cookie',
  'cookies',
  'cwd',
  'env',
  'environment',
  'executable',
  'file',
  'filepath',
  'filename',
  'headers',
  'html',
  'javascript',
  'modelpath',
  'outputpath',
  'path',
  'prompt',
  'rawchat',
  'rawhtml',
  'script',
  'shell',
  'signedurl',
  'sourcepath',
  'token',
  'uri',
  'url',
] as const

const PROHIBITED_STRING_FORMS = [
  'absolute filesystem path',
  'relative traversal path',
  'http/https URL',
  'file/data/javascript URI',
  'shell metacharacter sequence',
  'inline source code',
  'secret or bearer credential',
] as const

const sourceContracts = listProfessionalToolAdapterContracts()
const sourceContractByToolId = new Map(sourceContracts.map((contract) => [contract.canonicalToolId, contract]))
const profileByToolId = new Map(productionToolProfiles.map((profile) => [profile.toolId, profile]))

export const PROFESSIONAL_TOOL_OPERATION_SPECS: readonly ProfessionalToolOperationSpec[] =
  deepFreeze(PROFESSIONAL_TOOL_OPERATION_SEEDS.map(buildOperationSpec))

const specByCanonicalToolId = new Map(
  PROFESSIONAL_TOOL_OPERATION_SPECS.map((spec) => [spec.canonicalToolId, spec]),
)

const specByAlias = buildAliasMap(PROFESSIONAL_TOOL_OPERATION_SPECS)

export function listProfessionalToolOperationSpecs(): readonly ProfessionalToolOperationSpec[] {
  return PROFESSIONAL_TOOL_OPERATION_SPECS
}

export function getProfessionalToolOperationSpec(
  canonicalToolId: ProductionToolId,
): ProfessionalToolOperationSpec | undefined {
  return specByCanonicalToolId.get(canonicalToolId)
}

export function resolveProfessionalToolOperationSpec(
  requestedToolName: string,
): ProfessionalToolOperationSpec | undefined {
  const normalized = normalizeProfessionalToolOperationAlias(requestedToolName)
  return normalized ? specByAlias.get(normalized) : undefined
}

export function normalizeProfessionalToolOperationAlias(value: string): string {
  const candidate = value.trim()
  if (!candidate || candidate.length > 128) return ''
  if (
    candidate.includes('..') ||
    candidate.includes('\\') ||
    candidate.startsWith('/') ||
    /(?:[a-z][a-z0-9+.-]*:\/\/|file:|data:|javascript:)/i.test(candidate)
  ) {
    return ''
  }
  if (!/^[A-Za-z0-9@._/ +()-]+$/.test(candidate)) return ''
  return candidate
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
}

export function summarizeProfessionalToolOperationRegistry(): ProfessionalToolOperationRegistrySummary {
  const specs = listProfessionalToolOperationSpecs()
  const editOperationCandidateCount = specs.filter((spec) =>
    spec.disposition === 'edit_operation_candidate').length
  const readinessOperationCandidateCount = specs.filter((spec) =>
    spec.disposition === 'readiness_operation_candidate').length
  const policyBlockedToolIds = specs
    .filter((spec) => spec.disposition === 'policy_blocked')
    .map((spec) => spec.canonicalToolId)

  return {
    sourceContractCount: sourceContracts.length,
    canonicalOperationSpecCount: specs.length,
    serverCallableCandidateCount: editOperationCandidateCount + readinessOperationCandidateCount,
    editOperationCandidateCount,
    readinessOperationCandidateCount,
    policyBlockedCount: policyBlockedToolIds.length,
    requestedNameAliasCount: specs.filter((spec) =>
      normalizeProfessionalToolOperationAlias(spec.requestedToolName) !==
      normalizeProfessionalToolOperationAlias(spec.canonicalToolId)).length,
    resolverAliasCount: specByAlias.size - specs.length,
    productReadyCount: 0,
    policyBlockedToolIds,
    notes: [
      'Counts are derived from the bounded adapter source contracts and current production profile policy; no magic tool count is assumed.',
      'Callable candidate means the operation contract is server-invocable in principle after every runtime gate passes; it is not a production-ready claim.',
      'Every operation remains productReady=false until its exact runner, adversarial input/output, QA, cost, fallback, and deployed-runtime tests are recorded.',
      'Aliases resolve to one canonical operation spec and never create a second execution identity.',
    ],
  }
}

function buildOperationSpec(seed: ProfessionalToolOperationSeed): ProfessionalToolOperationSpec {
  const contract = sourceContractByToolId.get(seed.canonicalToolId)
  const profile = profileByToolId.get(seed.canonicalToolId)
  if (!contract) throw new Error(`Missing bounded adapter source contract for ${seed.canonicalToolId}.`)
  if (!profile) throw new Error(`Missing production tool profile for ${seed.canonicalToolId}.`)

  const operationId = `tool.${seed.canonicalToolId}.${seed.operationName}.v1`
  const { disposition, policyBlocks, policyBlockReasons } = dispositionForProfile(profile)
  const networkMode = seed.networkMode ?? 'offline_required'
  const resourceCeilings = resourceCeilingsFor(seed.resourceClass, networkMode)
  const qaPolicy = getToolQAPolicy(seed.canonicalToolId)
  const fallbackChains = getFallbackChainsForTool(seed.canonicalToolId)
  const aliases = unique([
    contract.requestedToolName,
    seed.canonicalToolId,
    ...seed.aliases,
  ])
  const privateInternalRunnerVerified =
    PRIVATE_INTERNAL_RUNNER_VERIFIED_TOOL_IDS.has(seed.canonicalToolId)

  return {
    schemaVersion: PROFESSIONAL_TOOL_OPERATION_SPEC_VERSION,
    requestedToolName: contract.requestedToolName,
    canonicalToolId: seed.canonicalToolId,
    aliases,
    allowedOperationIds: [operationId],
    disposition,
    policyBlocks,
    policyBlockReasons,
    sourceContractModes: [...contract.modes],
    requestSchema: buildRequestSchema({
      operationId,
      inputKinds: contract.privateInputManifestKinds,
      settingsSchema: seed.settingsSchema,
      resourceCeilings,
      modelManifestRequired: profile.modelWeightPolicy.required,
      networkGrantRequired: networkMode === 'conditional_approved_destination',
      captureAuthorizationRequired: seed.captureAuthorizationRequired === true,
    }),
    declaredPrivateInputArtifactKinds: [...contract.privateInputManifestKinds],
    declaredPrivateOutputArtifactKinds: [...contract.privateOutputManifestKinds],
    workerRuntime: workerRuntimeFor(profile, seed),
    networkPolicy: networkPolicyFor(networkMode),
    resourceCeilings,
    licenseGate: {
      registryStatus: profile.productionStatus,
      declaredLicense: profile.license,
      licenseFamily: profile.licenseFamily,
      licenseRisk: profile.licenseRisk,
      commercialUseStatus: profile.commercialUseStatus,
      distributionRisk: profile.distributionRisk,
      evidenceRecordRequired: true,
      ownerApprovalRequired: requiresOwnerLicenseApproval(profile),
      blocksUntilSatisfied: true,
    },
    modelGate: {
      modelWeightsRequired: profile.modelWeightPolicy.required,
      exactManifestRequired: profile.modelWeightPolicy.required,
      checkpointHashRequired: profile.modelWeightPolicy.required,
      commercialUseApprovalRequired: profile.modelWeightPolicy.required,
      downloadAtRuntimeAllowed: false,
      callerSelectedModelAllowed: false,
      serverMountedModelOnly: true,
    },
    credentialGate: {
      callerSuppliedCredentialsAllowed: false,
      providerCredentialsAllowed: false,
      secretValuesInRequestAllowed: false,
      serverServiceIdentityRequired: true,
      privateStorageIdentityRequired: true,
      scopedSecretLeaseRequired: false,
      captureAuthorizationRequired: seed.captureAuthorizationRequired === true,
    },
    entrypoint: {
      ...seed.entrypoint,
      fixedInvocationProfileId: `entrypoint.${seed.canonicalToolId}.${seed.operationName}.v1`,
      serverOwned: true,
      implementationStatus: privateInternalRunnerVerified
        ? 'private_internal_runner_verified'
        : 'declared_not_runner_tested',
      callerSuppliedExecutableAllowed: false,
      callerSuppliedArgumentsAllowed: false,
      shellAllowed: false,
      dynamicImportSpecifierAllowed: false,
    },
    qa: {
      gateTypes: [...qaPolicy.gateTypes],
      requiredBeforePreview: [...qaPolicy.requiredBeforePreview],
      requiredBeforeFinalExport: [...qaPolicy.requiredBeforeFinalExport],
      runtimeQaEvidenceRequired: true,
      outputArtifactLineageRequired: true,
      failedRequiredGateBlocksPromotion: true,
      failedRequiredGateBlocksFinalExport: true,
    },
    costEvidence: costEvidenceFor(seed.resourceClass),
    fallback: {
      fallbackToolIds: [...profile.fallbackToolIds],
      fallbackChainIds: fallbackChains.map((chain) => chain.chainId),
      fallbackMustExistInApprovedSnapshot: true,
      fallbackMustPreserveArtifactContract: true,
      fallbackMayNotIncreaseCostWithoutNewApproval: true,
      automaticProviderSubstitutionAllowed: false,
      aiVideoFallbackAllowed: false,
      unresolvedRequiredFailureBlocksFinalExport: true,
      independentWorkMayContinue: true,
      userReviewTriggers: unique([
        'meaning_or_source_truth_change',
        'privacy_or_capture_authorization_change',
        'unapproved_cost_overage',
        'required_output_cannot_pass_qa',
        ...(profile.modelWeightPolicy.required ? ['model_or_checkpoint_substitution'] : []),
      ]),
    },
    requiresApprovedSnapshot: true,
    requiresApprovedWorkItem: true,
    requiresOpaqueWorkerLease: true,
    requiresPrivateArtifacts: true,
    frontendExecutionAllowed: false,
    productReady: false,
    privateInternalExecutionReady: privateInternalRunnerVerified,
    runnerTestEvidenceStatus: privateInternalRunnerVerified
      ? 'private_internal_verified'
      : 'not_verified',
    nextRequiredGate: privateInternalRunnerVerified
      ? 'canonical_private_execution_coordinator_integration'
      : 'tool_specific_runner_integration_and_adversarial_output_test',
  }
}

function buildRequestSchema(input: {
  operationId: string
  inputKinds: readonly ProductionToolInputType[]
  settingsSchema: ProfessionalToolOperationRequestSchema['properties']['settings']
  resourceCeilings: ProfessionalToolOperationResourceCeilings
  modelManifestRequired: boolean
  networkGrantRequired: boolean
  captureAuthorizationRequired: boolean
}): ProfessionalToolOperationRequestSchema {
  const artifactKinds = input.inputKinds.filter((kind) => kind !== 'none')
  const required = [
    'operationId',
    'approvedSnapshotId',
    'approvedSnapshotHash',
    'workItemId',
    'workItemHash',
    'creditEstimateId',
    'creditReservationId',
    'workerLeaseId',
    'idempotencyKey',
    'artifactBindings',
    'settings',
    ...(input.modelManifestRequired ? ['modelManifestId'] : []),
    ...(input.networkGrantRequired ? ['networkGrantId'] : []),
    ...(input.captureAuthorizationRequired ? ['captureAuthorizationId'] : []),
  ]
  const opaqueId = {
    type: 'string' as const,
    minLength: 8,
    maxLength: 160,
    pattern: OPAQUE_ID_PATTERN,
  }
  const properties: ProfessionalToolOperationRequestSchema['properties'] = {
    operationId: { type: 'string', const: input.operationId },
    approvedSnapshotId: opaqueId,
    approvedSnapshotHash: { type: 'string', pattern: SHA256_PATTERN, minLength: 64, maxLength: 64 },
    workItemId: opaqueId,
    workItemHash: { type: 'string', pattern: SHA256_PATTERN, minLength: 64, maxLength: 64 },
    creditEstimateId: opaqueId,
    creditReservationId: opaqueId,
    workerLeaseId: opaqueId,
    idempotencyKey: opaqueId,
    artifactBindings: {
      type: 'array',
      minItems: artifactKinds.length > 0 ? 1 : 0,
      maxItems: 64,
      uniqueArtifactIds: true,
      serverManifestResolutionRequired: true,
      literalPathsAllowed: false,
      literalUrlsAllowed: false,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['artifactId', 'kind', 'sha256', 'byteLength'],
        properties: {
          artifactId: opaqueId,
          kind: { type: 'string', enum: artifactKinds },
          sha256: { type: 'string', pattern: SHA256_PATTERN, minLength: 64, maxLength: 64 },
          byteLength: {
            type: 'integer',
            minimum: 0,
            maximum: input.resourceCeilings.maxInputBytes,
          },
        },
      },
    },
    settings: input.settingsSchema,
  }
  if (input.modelManifestRequired) properties.modelManifestId = opaqueId
  if (input.networkGrantRequired) properties.networkGrantId = opaqueId
  if (input.captureAuthorizationRequired) properties.captureAuthorizationId = opaqueId

  return {
    schemaId: `${input.operationId}.request`,
    type: 'object',
    additionalProperties: false,
    maxSerializedBytes: 128 * 1024,
    required,
    properties,
    prohibitedPropertyNames: PROHIBITED_PROPERTY_NAMES,
    prohibitedStringForms: PROHIBITED_STRING_FORMS,
    callerSelectedWorkspaceOrProjectAllowed: false,
    rawChatOrPromptAllowed: false,
    arbitraryCommandAllowed: false,
    arbitraryArgumentsAllowed: false,
    arbitraryCodeAllowed: false,
    arbitraryEnvironmentAllowed: false,
    arbitraryPathsAllowed: false,
    arbitraryUrlsAllowed: false,
  }
}

function dispositionForProfile(profile: ProductionToolProfile): {
  disposition: ProfessionalToolOperationDisposition
  policyBlocks: ProfessionalToolOperationPolicyBlock[]
  policyBlockReasons: string[]
} {
  const policyBlocks: ProfessionalToolOperationPolicyBlock[] = []
  const policyBlockReasons: string[] = []
  if (profile.productionStatus === 'evaluation_only') {
    policyBlocks.push('evaluation_only')
    policyBlockReasons.push(`${profile.toolId} is evaluation-only and cannot receive an execution lease.`)
  }
  if (profile.productionStatus === 'future') {
    policyBlocks.push('future_only')
    policyBlockReasons.push(`${profile.toolId} is future-only and has not been promoted into the callable tool lane.`)
  }
  if (profile.workerType === 'planning_only') {
    policyBlocks.push('planning_only')
    policyBlockReasons.push(`${profile.toolId} has planning metadata only and no approved worker ownership.`)
  }
  if (profile.productionStatus === 'blocked') {
    policyBlocks.push('registry_blocked')
    policyBlockReasons.push(`${profile.toolId} is blocked by the production tool registry.`)
  }
  if (policyBlocks.length > 0) return { disposition: 'policy_blocked', policyBlocks, policyBlockReasons }
  if (profile.executionMode === 'readiness_check') {
    return { disposition: 'readiness_operation_candidate', policyBlocks, policyBlockReasons }
  }
  return { disposition: 'edit_operation_candidate', policyBlocks, policyBlockReasons }
}

function workerRuntimeFor(
  profile: ProductionToolProfile,
  seed: ProfessionalToolOperationSeed,
): ProfessionalToolOperationWorkerRuntime {
  if (profile.workerType === 'planning_only') {
    return {
      registryWorkerType: profile.workerType,
      imageRole: 'none_policy_blocked',
      imageDefinition: 'not_assigned_until_product_policy_promotion',
      runtimeClass: 'not_assignable_policy_blocked',
      privateFilesystemRequired: true,
      readOnlyRootFilesystemRequired: true,
      unprivilegedUserRequired: true,
      isolatedTemporaryDirectoryRequired: true,
      sourceArtifactsMountedReadOnly: true,
    }
  }

  const imageRole = imageRoleFor(profile.workerType)
  const imageDefinition = imageDefinitionFor(imageRole)
  let runtimeClass: ProfessionalToolOperationWorkerRuntime['runtimeClass']
  if (seed.entrypoint.kind === 'fixed_binary') {
    runtimeClass = imageRole === 'render_worker' ? 'native_render_worker' : 'native_cpu_worker'
  } else if (seed.entrypoint.kind === 'node_library') {
    runtimeClass = imageRole === 'render_worker' ? 'node24_render_worker' : 'node24_cpu_worker'
  } else {
    runtimeClass = imageRole === 'gpu_worker' ? 'python3_cuda12_gpu_worker' : 'python3_cpu_worker'
  }

  return {
    registryWorkerType: profile.workerType,
    imageRole,
    imageDefinition,
    runtimeClass,
    privateFilesystemRequired: true,
    readOnlyRootFilesystemRequired: true,
    unprivilegedUserRequired: true,
    isolatedTemporaryDirectoryRequired: true,
    sourceArtifactsMountedReadOnly: true,
  }
}

function imageRoleFor(workerType: ProductionRegistryWorkerType): ProfessionalToolOperationWorkerRuntime['imageRole'] {
  if (workerType === 'gpu_ai_worker') return 'gpu_worker'
  if (workerType === 'render_worker') return 'render_worker'
  if (workerType === 'tool_readiness_worker') return 'tool_readiness_worker'
  return 'cpu_worker'
}

function imageDefinitionFor(imageRole: ProfessionalToolOperationWorkerRuntime['imageRole']): string {
  if (imageRole === 'gpu_worker') return 'docker/prod/gpu-worker/Dockerfile'
  if (imageRole === 'render_worker') return 'docker/prod/render-worker/Dockerfile'
  if (imageRole === 'tool_readiness_worker') return 'docker/prod/tool-readiness-worker/Dockerfile'
  if (imageRole === 'cpu_worker') return 'docker/prod/cpu-worker/Dockerfile'
  return 'not_assigned_until_product_policy_promotion'
}

function networkPolicyFor(mode: ProfessionalToolOperationNetworkMode): ProfessionalToolOperationNetworkPolicy {
  if (mode === 'conditional_approved_destination') {
    return {
      mode,
      denyByDefault: true,
      packageOrModelDownloadsAllowed: false,
      providerCallsAllowed: false,
      callerSuppliedTargetsAllowed: false,
      rawUrlsAllowed: false,
      fileDataJavascriptSchemesAllowed: false,
      privateIpTargetsAllowed: false,
      redirectReauthorizationRequired: true,
      dnsAndResolvedIpRevalidationRequired: true,
      approvedDestinationKinds: ['server_authorized_map_tile_proxy'],
      networkGrantRequired: true,
      notes: [
        'The request carries only an opaque server-issued network grant; the worker resolves its exact allowlisted destination.',
        'Redirects, DNS results, resolved IPs, byte ceilings, and request count must be revalidated by the egress boundary.',
      ],
    }
  }
  return {
    mode,
    denyByDefault: true,
    packageOrModelDownloadsAllowed: false,
    providerCallsAllowed: false,
    callerSuppliedTargetsAllowed: false,
    rawUrlsAllowed: false,
    fileDataJavascriptSchemesAllowed: false,
    privateIpTargetsAllowed: false,
    redirectReauthorizationRequired: true,
    dnsAndResolvedIpRevalidationRequired: true,
    approvedDestinationKinds: [],
    networkGrantRequired: false,
    notes: [
      'The operation must complete with worker egress disabled.',
      'All packages, models, fonts, styles, and source artifacts must already exist in approved private runtime inputs.',
    ],
  }
}

function resourceCeilingsFor(
  resourceClass: ProfessionalToolOperationResourceClass,
  networkMode: ProfessionalToolOperationNetworkMode,
): ProfessionalToolOperationResourceCeilings {
  const base = resourceCeilingBase(resourceClass)
  return {
    ...base,
    maxNetworkRequests: networkMode === 'conditional_approved_destination' ? 200 : 0,
    maxNetworkResponseBytes: networkMode === 'conditional_approved_destination' ? 64 * 1024 * 1024 : 0,
    terminateProcessTreeOnTimeout: true,
    outputVerificationBeforePromotion: true,
  }
}

function resourceCeilingBase(resourceClass: ProfessionalToolOperationResourceClass): Omit<
  ProfessionalToolOperationResourceCeilings,
  'maxNetworkRequests' | 'maxNetworkResponseBytes' | 'terminateProcessTreeOnTimeout' | 'outputVerificationBeforePromotion'
> {
  if (resourceClass === 'render_2d') return ceilings(300_000, 2, 2_048, 0, 2_048, 128, 512, 600, 18_000, 4)
  if (resourceClass === 'render_3d') return ceilings(600_000, 4, 4_096, 0, 4_096, 512, 2_048, 300, 9_000, 4)
  if (resourceClass === 'runtime_readiness') return ceilings(30_000, 1, 2_048, 1, 256, 1, 4, 0, 0, 1)
  if (resourceClass === 'gpu_image') return ceilings(600_000, 4, 16_384, 1, 8_192, 2_048, 4_096, 0, 240, 4)
  if (resourceClass === 'gpu_video') return ceilings(1_800_000, 4, 16_384, 1, 16_384, 4_096, 8_192, 600, 18_000, 8)
  if (resourceClass === 'gpu_audio') return ceilings(3_600_000, 4, 16_384, 1, 8_192, 4_096, 4_096, 14_400, 0, 8)
  if (resourceClass === 'cpu_audio_analysis') return ceilings(900_000, 4, 8_192, 0, 4_096, 4_096, 1_024, 14_400, 0, 8)
  if (resourceClass === 'cpu_audio_process') return ceilings(1_200_000, 4, 8_192, 0, 8_192, 4_096, 4_096, 14_400, 0, 8)
  if (resourceClass === 'cpu_media_analysis') return ceilings(1_800_000, 4, 8_192, 0, 16_384, 8_192, 8_192, 7_200, 216_000, 16)
  if (resourceClass === 'cpu_image_process') return ceilings(600_000, 4, 8_192, 0, 8_192, 4_096, 4_096, 0, 2_000, 64)
  if (resourceClass === 'browser_capture') return ceilings(60_000, 2, 4_096, 0, 1_024, 16, 8, 0, 1, 1)
  return ceilings(120_000, 2, 2_048, 0, 2_048, 8_192, 64, 7_200, 216_000, 4)
}

function ceilings(
  timeoutMs: number,
  vcpuLimit: number,
  memoryMiBLimit: number,
  gpuLimit: 0 | 1,
  temporaryStorageMiBLimit: number,
  maxInputMiB: number,
  maxOutputMiB: number,
  maxInputDurationSeconds: number,
  maxFrames: number,
  maxOutputArtifacts: number,
): Omit<
  ProfessionalToolOperationResourceCeilings,
  'maxNetworkRequests' | 'maxNetworkResponseBytes' | 'terminateProcessTreeOnTimeout' | 'outputVerificationBeforePromotion'
> {
  return {
    timeoutMs,
    maxAttemptsPerApprovedWorkItem: 3,
    vcpuLimit,
    memoryMiBLimit,
    gpuLimit,
    temporaryStorageMiBLimit,
    maxInputBytes: maxInputMiB * 1024 * 1024,
    maxOutputBytes: maxOutputMiB * 1024 * 1024,
    maxInputDurationSeconds,
    maxFrames,
    maxOutputArtifacts,
  }
}

function costEvidenceFor(
  resourceClass: ProfessionalToolOperationResourceClass,
): ProfessionalToolOperationCostEvidenceRequirements {
  const deterministicRenderer = resourceClass === 'render_2d' || resourceClass === 'render_3d'
  const gpu = resourceClass === 'gpu_image' || resourceClass === 'gpu_video' || resourceClass === 'gpu_audio'
  const units: ProfessionalToolOperationCostUnit[] = ['operation', 'cpu_millisecond', 'input_mebibyte']
  if (gpu) units.push('gpu_millisecond')
  if (resourceClass.includes('audio')) units.push('input_audio_second')
  if (resourceClass === 'gpu_video' || resourceClass === 'cpu_media_analysis') units.push('input_video_second')
  if (deterministicRenderer) units.push('output_frame', 'output_megapixel')

  return {
    sourceKind: deterministicRenderer ? 'deterministic_renderer' : 'infrastructure_runtime',
    units: unique(units),
    requiredMeasurements: unique([
      'startedAt',
      'completedAt',
      'wallTimeMilliseconds',
      'attemptNumber',
      'inputBytes',
      'outputBytes',
      'peakMemoryMiB',
      'vcpuMilliseconds',
      ...(gpu ? ['gpuMilliseconds'] : []),
      ...(resourceClass.includes('audio') ? ['inputAudioSeconds'] : []),
      ...(resourceClass === 'gpu_video' || resourceClass === 'cpu_media_analysis'
        ? ['inputVideoSeconds']
        : []),
      ...(deterministicRenderer ? ['outputFrames', 'outputMegapixelFrames'] : []),
    ]),
    estimateLineItemRequiredBeforeExecution: true,
    activeReservationRequiredBeforeExecution: true,
    actualCostEventRequiredAfterActualWork: true,
    exactOperationAndAttemptLineageRequired: true,
    idempotentCostEventRequired: true,
    actualInternalToolCostOnly: true,
    serviceFeeIncluded: false,
    callerSuppliedCostAllowed: false,
    walletMutationAllowedByRunner: false,
    settlementAllowedByRunner: false,
  }
}

function requiresOwnerLicenseApproval(profile: ProductionToolProfile): boolean {
  return profile.licenseRisk !== 'low' ||
    profile.commercialUseStatus !== 'allowed' ||
    profile.distributionRisk !== 'low' ||
    profile.licenseFamily === 'gpl' ||
    profile.licenseFamily === 'lgpl' ||
    profile.modelWeightPolicy.required
}

function buildAliasMap(
  specs: readonly ProfessionalToolOperationSpec[],
): Map<string, ProfessionalToolOperationSpec> {
  const aliases = new Map<string, ProfessionalToolOperationSpec>()
  for (const spec of specs) {
    for (const alias of spec.aliases) {
      const normalized = normalizeProfessionalToolOperationAlias(alias)
      if (!normalized) throw new Error(`Invalid tool alias declared for ${spec.canonicalToolId}: ${alias}`)
      const existing = aliases.get(normalized)
      if (existing && existing.canonicalToolId !== spec.canonicalToolId) {
        throw new Error(
          `Tool alias collision: ${alias} resolves to both ${existing.canonicalToolId} and ${spec.canonicalToolId}.`,
        )
      }
      aliases.set(normalized, spec)
    }
  }
  return aliases
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  return value
}
