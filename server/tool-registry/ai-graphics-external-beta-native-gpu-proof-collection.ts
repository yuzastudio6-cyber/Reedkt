import type {
  AiGraphicsExternalBetaPerToolRuntimeProof,
} from './ai-graphics-external-beta-per-tool-runtime-proof'
import type {
  AiGraphicsGpuRuntimeProofCommandPlan,
} from './ai-graphics-gpu-runtime-proof-command-plan'
import {
  listAiGraphicsExpectedGpuRuntimeTargets,
  listAiGraphicsGpuRuntimeProofRequiredProfiles,
  type AiGraphicsGpuRuntimeProofProfileId,
  type AiGraphicsGpuRuntimeProofResultPacket,
} from './ai-graphics-gpu-runtime-proof-result'
import type {
  AiGraphicsModelWeightChecksumEvidencePacket,
} from './ai-graphics-model-weight-checksum-evidence'
import type {
  AiGraphicsModelWeightManifestReviewPacket,
  AiGraphicsModelWeightManifestToolId,
} from './ai-graphics-model-weight-manifest-readiness'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION =
  'ai_graphics_external_beta_native_gpu_proof_collection_prepared_with_private_manifest_and_runtime_result_blocks'

export type AiGraphicsExternalBetaNativeGpuProofCollectionStatus =
  | 'missing_external_beta_per_tool_runtime_proof'
  | 'external_beta_per_tool_runtime_proof_rejected'
  | 'missing_external_beta_native_gpu_proof_collection_controls'
  | 'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results'
  | 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready'

export interface AiGraphicsExternalBetaNativeGpuProofCollectionInput {
  sourcePerToolRuntimeProofPacket?: AiGraphicsExternalBetaPerToolRuntimeProof
  gpuRuntimeProofCommandPlanPacket?: AiGraphicsGpuRuntimeProofCommandPlan
  modelWeightChecksumEvidencePacket?: AiGraphicsModelWeightChecksumEvidencePacket
  modelWeightManifestReviewPacket?: AiGraphicsModelWeightManifestReviewPacket
  gpuRuntimeProofResultPacket?: AiGraphicsGpuRuntimeProofResultPacket
  externalBetaNativeGpuProofCollectionPolicyRef?: string
  externalBetaNativeGpuProofCollectionSchemaRef?: string
  externalBetaNativeGpuProofCollectionHostPoolRef?: string
  externalBetaNativeGpuProofCollectionPrivateArtifactNamespaceRef?: string
  externalBetaNativeGpuProofCollectionTelemetryRef?: string
  externalBetaNativeGpuProofCollectionRollbackRef?: string
}

export interface AiGraphicsExternalBetaNativeGpuProofCollectionRequirement {
  requirementId: string
  status:
    | 'accepted_with_provided_evidence'
    | 'blocked_pending_private_evidence'
    | 'blocked_pending_native_gpu_result'
    | 'missing_or_invalid'
  currentAccepted: number
  requiredAccepted: number
  blocker: string | null
}

export interface AiGraphicsExternalBetaNativeGpuProofCollection {
  decision: AiGraphicsExternalBetaNativeGpuProofCollectionStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION
  sourcePerToolRuntimeProofAccepted: boolean
  missingNativeGpuProofCollectionControls: string[]
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  runtimeProfilesRequired: readonly AiGraphicsGpuRuntimeProofProfileId[]
  expectedGpuRuntimeTargets: Record<string, string>
  gpuRuntimePolicy: {
    onDemandOnly: true
    noIdleGpuRuntimeApproved: true
    startsOnlyForApprovedWorkerOrToolCall: true
    proofContainerIsEphemeral: true
    cpuFallbackAllowedForHeavyTools: false
  }
  proofCollectionRequirements: AiGraphicsExternalBetaNativeGpuProofCollectionRequirement[]
  counts: {
    gpuRuntimeTargetedTools: 8
    modelWeightChecksumEvidenceRequiredTools: 5
    modelWeightChecksumEvidenceAccepted: number
    modelWeightManifestRequiredTools: 5
    modelWeightManifestReviewAccepted: number
    nativeGpuRuntimeProofProfilesRequired: 6
    nativeGpuRuntimeProofProfilesAccepted: number
    nativeGpuRuntimeProofAcceptedTools: number
    blockedPendingPrivateManifestTools: number
    blockedPendingNativeGpuRuntimeProofTools: number
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  requiredCollectionCommands: {
    checksumEvidenceScaffold: 'npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence'
    checksumEvidenceValidate: 'npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence'
    manifestAuthoring: 'npm run --silent ai-graphics:model-weight-manifest-authoring -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --out-dir .local-artifacts/ai-graphics/model-weight-manifests'
    manifestReviewValidate: 'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests'
    nativeGpuProofScriptGenerate: 'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests --script-out .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh'
    nativeGpuHostPreflight: 'npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible'
    nativeGpuProofResultValidate: 'npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results'
    externalPerToolRuntimeProofRecheck: 'npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json'
  }
  localOnlyEvidencePaths: {
    checksumEvidenceDir: '.local-artifacts/ai-graphics/model-weight-checksum-evidence'
    privateManifestDir: '.local-artifacts/ai-graphics/model-weight-manifests'
    nativeGpuProofResultDir: '.local-artifacts/ai-graphics/gpu-runtime-proof-results'
  }
  nextGate: 'external_beta_per_tool_runtime_proof_recheck_after_native_gpu_results'
  booleans: {
    externalBetaNativeGpuProofCollectionPrepared: true
    sourcePerToolRuntimeProofAccepted: boolean
    commandPlanAccepted: boolean
    checksumEvidenceAcceptedForAll5ModelTools: boolean
    privateModelManifestsAcceptedForAll5ModelTools: boolean
    nativeGpuRuntimeProofResultsAcceptedForAll6Profiles: boolean
    all8GpuRuntimeToolsCovered: true
    all5ModelWeightToolsCovered: true
    all6NativeGpuProfilesCovered: true
    gpuRuntimeTargetsExact: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    cpuFallbackAllowedForHeavyTools: false
    localOnlyEvidenceCollection: true
    privateArtifactRefsRequired: true
    privateArtifactRefsNotLogged: true
    readyForPerToolRuntimeProofRecheck: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const gpuRuntimeTargetedTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

const acceptedPrivateRefNamespaces = [
  'private://',
  'reeditpro-private://',
  'backend-evidence://',
  'external-beta-evidence://',
]

const forbiddenRefPrefixes = [
  'http://',
  'https://',
  'signed-url://',
  'public://',
  'gs://',
  'gcs://',
]

function hasSafePrivateRef(value?: string): boolean {
  if (!value?.trim()) return false
  const ref = value.trim()
  if (forbiddenRefPrefixes.some((prefix) => ref.startsWith(prefix))) return false
  return acceptedPrivateRefNamespaces.some((prefix) => ref.startsWith(prefix) && ref.length > prefix.length)
}

function missingControls(input: AiGraphicsExternalBetaNativeGpuProofCollectionInput): string[] {
  const controls = {
    externalBetaNativeGpuProofCollectionPolicyRef:
      input.externalBetaNativeGpuProofCollectionPolicyRef,
    externalBetaNativeGpuProofCollectionSchemaRef:
      input.externalBetaNativeGpuProofCollectionSchemaRef,
    externalBetaNativeGpuProofCollectionHostPoolRef:
      input.externalBetaNativeGpuProofCollectionHostPoolRef,
    externalBetaNativeGpuProofCollectionPrivateArtifactNamespaceRef:
      input.externalBetaNativeGpuProofCollectionPrivateArtifactNamespaceRef,
    externalBetaNativeGpuProofCollectionTelemetryRef:
      input.externalBetaNativeGpuProofCollectionTelemetryRef,
    externalBetaNativeGpuProofCollectionRollbackRef:
      input.externalBetaNativeGpuProofCollectionRollbackRef,
  }
  return Object.entries(controls)
    .filter(([, value]) => !hasSafePrivateRef(value))
    .map(([key]) => key)
}

function sourcePerToolRuntimeProofAccepted(
  packet?: AiGraphicsExternalBetaPerToolRuntimeProof,
): boolean {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  return Boolean(packet) &&
    (
      packet?.decision === 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks' ||
      packet?.sourceDecision === 'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks'
    ) &&
    (packet?.totalAiGraphicsTools === 21 || counts?.totalAiGraphicsTools === 21) &&
    (packet?.gpuRuntimeTargetedTools === 8 || counts?.gpuRuntimeTargetedTools === 8) &&
    (
      packet?.jsRuntimeProofAcceptedWithProvidedEvidenceTools === 13 ||
      counts?.jsRuntimeProofAcceptedWithProvidedEvidenceTools === 13
    ) &&
    (
      packet?.blockedPendingNativeGpuRuntimeProofTools === 8 ||
      counts?.blockedPendingNativeGpuRuntimeProofTools === 8
    ) &&
    packet?.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet?.booleans?.gpuRuntimeShouldStartNow === false &&
    packet?.booleans?.agentCanExecuteToolsNow === false
}

function commandPlanAccepted(packet?: AiGraphicsGpuRuntimeProofCommandPlan): boolean {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  return Boolean(packet) &&
    packet?.decision === 'ai_graphics_gpu_runtime_proof_command_plan_prepared_with_manifest_blocks' &&
    (packet?.totalAiGraphicsTools === 21 || counts?.totalAiGraphicsTools === 21) &&
    packet?.gpuRuntimeTargetedTools?.length === 8 &&
    packet?.modelWeightManifestRequiredTools?.length === 5 &&
    packet?.runtimeProfiles?.length === 6 &&
    packet?.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet?.booleans?.noIdleGpuRuntimeApproved === true &&
    packet?.booleans?.startsOnlyForApprovedWorkerOrToolCall === true &&
    packet?.booleans?.cpuFallbackAllowedForHeavyTools === false
}

function checksumEvidenceAccepted(packet?: AiGraphicsModelWeightChecksumEvidencePacket): number {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  return packet?.checksumEvidenceRecordsAccepted ?? counts?.checksumEvidenceRecordsAccepted ?? 0
}

function manifestReviewAccepted(packet?: AiGraphicsModelWeightManifestReviewPacket): number {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  return packet?.reviewAcceptedManifestRecords ?? counts?.reviewAcceptedManifestRecords ?? 0
}

function nativeGpuRuntimeProfilesAccepted(packet?: AiGraphicsGpuRuntimeProofResultPacket): number {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  return packet?.runtimeProofResultsAcceptedForOwnerReview ??
    counts?.runtimeProofResultsAcceptedForOwnerReview ??
    0
}

function buildRequirement(
  requirementId: string,
  currentAccepted: number,
  requiredAccepted: number,
  pendingStatus: AiGraphicsExternalBetaNativeGpuProofCollectionRequirement['status'],
  blocker: string,
): AiGraphicsExternalBetaNativeGpuProofCollectionRequirement {
  return {
    requirementId,
    status: currentAccepted >= requiredAccepted
      ? 'accepted_with_provided_evidence'
      : pendingStatus,
    currentAccepted,
    requiredAccepted,
    blocker: currentAccepted >= requiredAccepted ? null : blocker,
  }
}

export function buildAiGraphicsExternalBetaNativeGpuProofCollection(
  input: AiGraphicsExternalBetaNativeGpuProofCollectionInput = {},
): AiGraphicsExternalBetaNativeGpuProofCollection {
  const sourceAccepted = sourcePerToolRuntimeProofAccepted(input.sourcePerToolRuntimeProofPacket)
  const missingNativeGpuProofCollectionControls = missingControls(input)
  const commandAccepted = commandPlanAccepted(input.gpuRuntimeProofCommandPlanPacket)
  const checksumAccepted = checksumEvidenceAccepted(input.modelWeightChecksumEvidencePacket)
  const manifestAccepted = manifestReviewAccepted(input.modelWeightManifestReviewPacket)
  const nativeProfilesAccepted = nativeGpuRuntimeProfilesAccepted(input.gpuRuntimeProofResultPacket)
  const readyForPerToolRuntimeProofRecheck =
    sourceAccepted &&
    commandAccepted &&
    missingNativeGpuProofCollectionControls.length === 0 &&
    checksumAccepted === 5 &&
    manifestAccepted === 5 &&
    nativeProfilesAccepted === 6 &&
    input.gpuRuntimeProofResultPacket?.nativeGpuRuntimeProofResultsAccepted === true

  const decision: AiGraphicsExternalBetaNativeGpuProofCollectionStatus = !input.sourcePerToolRuntimeProofPacket
    ? 'missing_external_beta_per_tool_runtime_proof'
    : !sourceAccepted
      ? 'external_beta_per_tool_runtime_proof_rejected'
      : missingNativeGpuProofCollectionControls.length > 0 || !commandAccepted
        ? 'missing_external_beta_native_gpu_proof_collection_controls'
        : readyForPerToolRuntimeProofRecheck
          ? 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready'
          : 'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results'

  const proofCollectionRequirements = [
    buildRequirement(
      'model_weight_checksum_evidence_for_5_model_tools',
      checksumAccepted,
      5,
      'blocked_pending_private_evidence',
      'Collect owner-reviewed private checksum evidence for sam2, birefnet, real_esrgan, rembg, and transparent_background.',
    ),
    buildRequirement(
      'private_model_manifest_review_for_5_model_tools',
      manifestAccepted,
      5,
      'blocked_pending_private_evidence',
      'Author and validate reviewed private model manifests with private artifact refs for the five model-weight tools.',
    ),
    buildRequirement(
      'native_gpu_runtime_proof_results_for_6_profiles',
      nativeProfilesAccepted,
      6,
      'blocked_pending_native_gpu_result',
      'Run the native linux/amd64 NVIDIA L4 proof script and validate six profile JSON results.',
    ),
  ]

  const blockedPendingPrivateManifestTools = Math.max(0, 5 - Math.min(manifestAccepted, 5))
  const blockedPendingNativeGpuRuntimeProofTools = readyForPerToolRuntimeProofRecheck ? 0 : 8

  return {
    decision,
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION,
    sourcePerToolRuntimeProofAccepted: sourceAccepted,
    missingNativeGpuProofCollectionControls,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    runtimeProfilesRequired: listAiGraphicsGpuRuntimeProofRequiredProfiles(),
    expectedGpuRuntimeTargets: listAiGraphicsExpectedGpuRuntimeTargets(),
    gpuRuntimePolicy: {
      onDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      proofContainerIsEphemeral: true,
      cpuFallbackAllowedForHeavyTools: false,
    },
    proofCollectionRequirements,
    counts: {
      gpuRuntimeTargetedTools: 8,
      modelWeightChecksumEvidenceRequiredTools: 5,
      modelWeightChecksumEvidenceAccepted: checksumAccepted,
      modelWeightManifestRequiredTools: 5,
      modelWeightManifestReviewAccepted: manifestAccepted,
      nativeGpuRuntimeProofProfilesRequired: 6,
      nativeGpuRuntimeProofProfilesAccepted: nativeProfilesAccepted,
      nativeGpuRuntimeProofAcceptedTools: readyForPerToolRuntimeProofRecheck ? 8 : 0,
      blockedPendingPrivateManifestTools,
      blockedPendingNativeGpuRuntimeProofTools,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    requiredCollectionCommands: {
      checksumEvidenceScaffold:
        'npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence',
      checksumEvidenceValidate:
        'npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence',
      manifestAuthoring:
        'npm run --silent ai-graphics:model-weight-manifest-authoring -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --out-dir .local-artifacts/ai-graphics/model-weight-manifests',
      manifestReviewValidate:
        'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests',
      nativeGpuProofScriptGenerate:
        'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests --script-out .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh',
      nativeGpuHostPreflight:
        'npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible',
      nativeGpuProofResultValidate:
        'npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results',
      externalPerToolRuntimeProofRecheck:
        'npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json',
    },
    localOnlyEvidencePaths: {
      checksumEvidenceDir: '.local-artifacts/ai-graphics/model-weight-checksum-evidence',
      privateManifestDir: '.local-artifacts/ai-graphics/model-weight-manifests',
      nativeGpuProofResultDir: '.local-artifacts/ai-graphics/gpu-runtime-proof-results',
    },
    nextGate: 'external_beta_per_tool_runtime_proof_recheck_after_native_gpu_results',
    booleans: {
      externalBetaNativeGpuProofCollectionPrepared: true,
      sourcePerToolRuntimeProofAccepted: sourceAccepted,
      commandPlanAccepted: commandAccepted,
      checksumEvidenceAcceptedForAll5ModelTools: checksumAccepted === 5,
      privateModelManifestsAcceptedForAll5ModelTools: manifestAccepted === 5,
      nativeGpuRuntimeProofResultsAcceptedForAll6Profiles: nativeProfilesAccepted === 6,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightToolsCovered: true,
      all6NativeGpuProfilesCovered: true,
      gpuRuntimeTargetsExact: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      localOnlyEvidenceCollection: true,
      privateArtifactRefsRequired: true,
      privateArtifactRefsNotLogged: true,
      readyForPerToolRuntimeProofRecheck,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
