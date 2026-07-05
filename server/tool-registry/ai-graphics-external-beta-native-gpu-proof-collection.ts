import type {
  AiGraphicsExternalBetaPerToolRuntimeProof,
} from './ai-graphics-external-beta-per-tool-runtime-proof'
import type {
  AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket,
} from './ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector'
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
import type {
  AiGraphicsModelWeightPrivateEvidenceIntakePacket,
} from './ai-graphics-model-weight-private-evidence-intake'
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
  modelWeightPrivateEvidenceIntakePacket?: AiGraphicsModelWeightPrivateEvidenceIntakePacket
  gpuRuntimeProofResultPacket?: AiGraphicsGpuRuntimeProofResultPacket
  cloudRunResultCollectorPacket?: AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket
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
  sourcePerToolRuntimeProofBridgeAccepted: boolean
  sourceCloudRunResultCollectorAccepted: boolean
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
    totalAiGraphicsTools: 21
    gpuRuntimeTargetedTools: 8
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: number
    sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence: number
    modelWeightChecksumEvidenceRequiredTools: 5
    modelWeightChecksumEvidenceAccepted: number
    modelWeightManifestRequiredTools: 5
    modelWeightManifestReviewAccepted: number
    modelWeightPrivateEvidenceIntakeAccepted: number
    nativeGpuRuntimeProofProfilesRequired: 6
    nativeGpuRuntimeProofProfilesAccepted: number
    cloudRunResultCollectorProfilesAccepted: number
    nativeGpuRuntimeProofAcceptedTools: number
    blockedPendingPrivateManifestTools: number
    blockedPendingNativeGpuRuntimeProofTools: number
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  requiredCollectionCommands: {
    checksumEvidenceScaffold: 'npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence'
    checksumEvidenceValidate: 'npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence'
    privateEvidenceIntake: 'npm run --silent ai-graphics:model-weight-private-evidence-intake -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --manifest-supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests'
    manifestAuthoring: 'npm run --silent ai-graphics:model-weight-manifest-authoring -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --out-dir .local-artifacts/ai-graphics/model-weight-manifests'
    manifestReviewValidate: 'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests'
    nativeGpuProofScriptGenerate: 'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests --script-out .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh'
    nativeGpuHostPreflight: 'npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible'
    nativeGpuProofResultValidate: 'npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results'
    cloudRunResultCollector: 'npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector -- --source-cloud-run-job-scaffold-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json --logs-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results --out-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results'
    externalPerToolRuntimeProofRecheck: 'npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --external-beta-tool-route-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json --node-runtime-proof-packet docs/tool-intelligence/ai-graphics/node-runtime-proof.json --browser-runtime-proof-packet docs/tool-intelligence/ai-graphics/browser-runtime-proof.json --satori-font-runtime-proof-packet docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json --external-beta-per-tool-runtime-proof-policy-ref private://ai-graphics/external-beta/per-tool-runtime-proof/policy --external-beta-per-tool-runtime-proof-schema-ref private://ai-graphics/external-beta/per-tool-runtime-proof/schema --external-beta-runtime-proof-evidence-ref private://ai-graphics/external-beta/per-tool-runtime-proof/evidence --external-beta-runtime-proof-telemetry-ref private://ai-graphics/external-beta/per-tool-runtime-proof/telemetry --external-beta-runtime-proof-rollback-ref private://ai-graphics/external-beta/per-tool-runtime-proof/rollback'
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
    sourceRuntimeQueueServiceProofBridgeAccepted: boolean
    sourceCloudRunResultCollectorAccepted: boolean
    sourceNativeGpuProofCollectionBridgeAccepted: boolean
    commandPlanAccepted: boolean
    checksumEvidenceAcceptedForAll5ModelTools: boolean
    privateModelManifestsAcceptedForAll5ModelTools: boolean
    privateModelWeightEvidenceIntakeAcceptedForAll5ModelTools: boolean
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
  const sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence =
    packet?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence ??
    counts?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence ??
    0
  const sourceRuntimeQueueServiceProofBridgeAccepted =
    packet?.sourceToolRouteRuntimeProofBridgeAccepted === true &&
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet?.records?.length === 21 &&
    packet.records.every((record) => record.sourceRuntimeQueueServiceProofBridgeAccepted === true) &&
    packet?.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted === true
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
    sourceRuntimeQueueServiceProofBridgeAccepted &&
    packet?.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet?.booleans?.gpuRuntimeShouldStartNow === false &&
    packet?.booleans?.agentCanExecuteToolsNow === false
}

function sourcePerToolRuntimeProofBridgeAccepted(
  packet?: AiGraphicsExternalBetaPerToolRuntimeProof,
): boolean {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  const sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence =
    packet?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence ??
    counts?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence ??
    0
  return Boolean(packet) &&
    packet?.sourceToolRouteRuntimeProofBridgeAccepted === true &&
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet?.records?.length === 21 &&
    packet.records.every((record) => record.sourceRuntimeQueueServiceProofBridgeAccepted === true) &&
    packet?.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted === true
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

function privateEvidenceIntakeAccepted(
  packet?: AiGraphicsModelWeightPrivateEvidenceIntakePacket,
): number {
  return packet?.status === 'private_model_weight_evidence_ready_for_native_gpu_proof_not_beta_ready' &&
    packet?.booleans?.readyForNativeGpuProofInput === true &&
    packet?.booleans?.checksumEvidenceAcceptedForAll5 === true &&
    packet?.booleans?.manifestSupplementsAcceptedForAll5 === true &&
    packet?.booleans?.localPrivateManifestDraftsReadyForAll5 === true &&
    packet?.booleans?.reviewedPrivateManifestsAcceptedForAll5 === true &&
    packet?.privateArtifactRefsLogged === 0
    ? packet.readyForNativeGpuProofInputRecords
    : 0
}

function nativeGpuRuntimeProfilesAccepted(packet?: AiGraphicsGpuRuntimeProofResultPacket): number {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  return packet?.runtimeProofResultsAcceptedForOwnerReview ??
    counts?.runtimeProofResultsAcceptedForOwnerReview ??
    0
}

function cloudRunResultCollectorProfilesAccepted(
  packet?: AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket,
): number {
  const counts = (packet as unknown as { counts?: Record<string, number> } | undefined)?.counts
  return counts?.runtimeProfilesExtracted ?? 0
}

function cloudRunResultCollectorAccepted(
  packet?: AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket,
): boolean {
  return Boolean(packet) &&
    packet?.decision === 'ai_graphics_external_beta_native_gpu_proof_cloud_run_result_collector_prepared_local_only' &&
    packet?.currentStatus ===
      'external_beta_native_gpu_proof_cloud_run_result_collector_prepared_pending_private_cloud_run_logs' &&
    packet?.sourceCloudRunJobScaffoldBridgeAccepted === true &&
    packet?.runtimeProfilesRequired?.length === 6 &&
    cloudRunResultCollectorProfilesAccepted(packet) === 6 &&
    packet?.booleans?.sourceCloudRunJobScaffoldAccepted === true &&
    packet?.booleans?.sourceNativeGpuProofCollectionBridgeAccepted === true &&
    packet?.booleans?.gpuRuntimeApprovedNow === false &&
    packet?.booleans?.externalBetaReadyNow === false &&
    packet?.booleans?.productionReadyNow === false
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
  const sourceBridgeAccepted =
    sourcePerToolRuntimeProofBridgeAccepted(input.sourcePerToolRuntimeProofPacket)
  const missingNativeGpuProofCollectionControls = missingControls(input)
  const commandAccepted = commandPlanAccepted(input.gpuRuntimeProofCommandPlanPacket)
  const checksumAccepted = checksumEvidenceAccepted(input.modelWeightChecksumEvidencePacket)
  const manifestAccepted = manifestReviewAccepted(input.modelWeightManifestReviewPacket)
  const privateEvidenceIntakeAcceptedRecords = privateEvidenceIntakeAccepted(
    input.modelWeightPrivateEvidenceIntakePacket,
  )
  const nativeProfilesAccepted = nativeGpuRuntimeProfilesAccepted(input.gpuRuntimeProofResultPacket)
  const cloudRunCollectorProfilesAccepted =
    cloudRunResultCollectorProfilesAccepted(input.cloudRunResultCollectorPacket)
  const cloudRunCollectorAccepted =
    cloudRunResultCollectorAccepted(input.cloudRunResultCollectorPacket)
  const readyForPerToolRuntimeProofRecheck =
    sourceAccepted &&
    commandAccepted &&
    cloudRunCollectorAccepted &&
    missingNativeGpuProofCollectionControls.length === 0 &&
    checksumAccepted === 5 &&
    manifestAccepted === 5 &&
    privateEvidenceIntakeAcceptedRecords === 5 &&
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
      'private_model_weight_evidence_intake_for_5_model_tools',
      privateEvidenceIntakeAcceptedRecords,
      5,
      'blocked_pending_private_evidence',
      'Run the combined private model-weight evidence intake after checksum evidence, manifest supplements, local manifest authoring, and manifest review are complete.',
    ),
    buildRequirement(
      'native_gpu_runtime_proof_results_for_6_profiles',
      nativeProfilesAccepted,
      6,
      'blocked_pending_native_gpu_result',
      'Run the native linux/amd64 NVIDIA L4 proof script and validate six profile JSON results.',
    ),
    buildRequirement(
      'cloud_run_result_collector_bridge_for_6_profiles',
      cloudRunCollectorProfilesAccepted,
      6,
      'blocked_pending_native_gpu_result',
      'Run the local-only Cloud Run result collector from saved private L4 proof logs and preserve the native GPU proof collection bridge.',
    ),
  ]

  const blockedPendingPrivateManifestTools = Math.max(0, 5 - Math.min(manifestAccepted, 5))
  const blockedPendingNativeGpuRuntimeProofTools = readyForPerToolRuntimeProofRecheck ? 0 : 8

  return {
    decision,
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION,
    sourcePerToolRuntimeProofAccepted: sourceAccepted,
    sourcePerToolRuntimeProofBridgeAccepted: sourceBridgeAccepted,
    sourceCloudRunResultCollectorAccepted: cloudRunCollectorAccepted,
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
      totalAiGraphicsTools: 21,
      gpuRuntimeTargetedTools: 8,
      sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence:
        sourceBridgeAccepted ? 21 : 0,
      sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence:
        cloudRunCollectorAccepted ? 6 : 0,
      modelWeightChecksumEvidenceRequiredTools: 5,
      modelWeightChecksumEvidenceAccepted: checksumAccepted,
      modelWeightManifestRequiredTools: 5,
      modelWeightManifestReviewAccepted: manifestAccepted,
      modelWeightPrivateEvidenceIntakeAccepted: privateEvidenceIntakeAcceptedRecords,
      nativeGpuRuntimeProofProfilesRequired: 6,
      nativeGpuRuntimeProofProfilesAccepted: nativeProfilesAccepted,
      cloudRunResultCollectorProfilesAccepted: cloudRunCollectorProfilesAccepted,
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
      privateEvidenceIntake:
        'npm run --silent ai-graphics:model-weight-private-evidence-intake -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --manifest-supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests',
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
      cloudRunResultCollector:
        'npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector -- --source-cloud-run-job-scaffold-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json --logs-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results --out-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results',
      externalPerToolRuntimeProofRecheck:
        'npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --external-beta-tool-route-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json --node-runtime-proof-packet docs/tool-intelligence/ai-graphics/node-runtime-proof.json --browser-runtime-proof-packet docs/tool-intelligence/ai-graphics/browser-runtime-proof.json --satori-font-runtime-proof-packet docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json --external-beta-per-tool-runtime-proof-policy-ref private://ai-graphics/external-beta/per-tool-runtime-proof/policy --external-beta-per-tool-runtime-proof-schema-ref private://ai-graphics/external-beta/per-tool-runtime-proof/schema --external-beta-runtime-proof-evidence-ref private://ai-graphics/external-beta/per-tool-runtime-proof/evidence --external-beta-runtime-proof-telemetry-ref private://ai-graphics/external-beta/per-tool-runtime-proof/telemetry --external-beta-runtime-proof-rollback-ref private://ai-graphics/external-beta/per-tool-runtime-proof/rollback',
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
      sourceRuntimeQueueServiceProofBridgeAccepted: sourceBridgeAccepted,
      sourceCloudRunResultCollectorAccepted: cloudRunCollectorAccepted,
      sourceNativeGpuProofCollectionBridgeAccepted: cloudRunCollectorAccepted,
      commandPlanAccepted: commandAccepted,
      checksumEvidenceAcceptedForAll5ModelTools: checksumAccepted === 5,
      privateModelManifestsAcceptedForAll5ModelTools: manifestAccepted === 5,
      privateModelWeightEvidenceIntakeAcceptedForAll5ModelTools:
        privateEvidenceIntakeAcceptedRecords === 5,
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
