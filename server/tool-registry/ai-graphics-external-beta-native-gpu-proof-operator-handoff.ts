import type {
  AiGraphicsExternalBetaNativeGpuProofCollection,
} from './ai-graphics-external-beta-native-gpu-proof-collection'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_OPERATOR_HANDOFF_DECISION =
  'ai_graphics_external_beta_native_gpu_proof_operator_handoff_prepared_with_private_evidence_runtime_blocks'

export type AiGraphicsExternalBetaNativeGpuProofOperatorHandoffStatus =
  | 'missing_external_beta_native_gpu_proof_collection'
  | 'external_beta_native_gpu_proof_collection_not_accepted'
  | 'missing_external_beta_native_gpu_proof_operator_controls'
  | 'external_beta_native_gpu_proof_operator_handoff_prepared_with_pending_private_evidence_and_native_gpu_results'
  | 'external_beta_native_gpu_proof_operator_handoff_ready_for_per_tool_recheck_not_beta_ready'

export interface AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput {
  sourceNativeGpuProofCollectionPacket?: Partial<AiGraphicsExternalBetaNativeGpuProofCollection> & {
    currentStatus?: string
    readyAfterEvidenceStatus?: string
  }
  operatorRunbookPolicyRef?: string
  operatorAccessControlRef?: string
  nativeGpuHostPoolRef?: string
  privateModelWeightRootRef?: string
  privateTelemetryRef?: string
  rollbackRef?: string
}

export interface AiGraphicsExternalBetaNativeGpuProofOperatorStep {
  stepId: string
  command: string
  outputPath: string | null
  mustRunOnNativeGpuHost: boolean
  requiresPrivateArtifacts: boolean
  performsRuntimeExecution: boolean
}

export interface AiGraphicsExternalBetaNativeGpuProofOperatorHandoff {
  decision: AiGraphicsExternalBetaNativeGpuProofOperatorHandoffStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_OPERATOR_HANDOFF_DECISION
  sourceCollectionAccepted: boolean
  missingOperatorControls: string[]
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  modelWeightManifestRequiredTools: string[]
  runtimeProfilesRequired: string[]
  runtimeProfilesRequiredCount: 6
  operatorSteps: AiGraphicsExternalBetaNativeGpuProofOperatorStep[]
  expectedPacketPaths: {
    checksumEvidencePacket: string
    modelWeightManifestReviewPacket: string
    gpuRuntimeProofCommandPlanPacket: string
    nativeGpuHostPreflight: string
    gpuRuntimeProofResultPacket: string
    nativeGpuProofCollectionPacket: string
    perToolRuntimeProofRecheckPacket: string
  }
  completionCriteria: {
    checksumEvidenceAccepted: 5
    privateModelManifestsAccepted: 5
    nativeGpuProofProfilesAccepted: 6
    nativeGpuToolsAcceptedAfterPerToolRecheck: 8
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  booleans: {
    externalBetaNativeGpuProofOperatorHandoffPrepared: true
    sourceNativeGpuProofCollectionAccepted: boolean
    all8GpuRuntimeToolsCovered: true
    all5ModelWeightToolsCovered: true
    all6NativeGpuProfilesCovered: true
    operatorRunbookDeterministic: true
    fullPerToolRuntimeProofRecheckCommandPrepared: true
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
] as const

const runtimeProfilesRequired = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const

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

function missingControls(input: AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput): string[] {
  const controls = {
    operatorRunbookPolicyRef: input.operatorRunbookPolicyRef,
    operatorAccessControlRef: input.operatorAccessControlRef,
    nativeGpuHostPoolRef: input.nativeGpuHostPoolRef,
    privateModelWeightRootRef: input.privateModelWeightRootRef,
    privateTelemetryRef: input.privateTelemetryRef,
    rollbackRef: input.rollbackRef,
  }
  return Object.entries(controls)
    .filter(([, value]) => !hasSafePrivateRef(value))
    .map(([key]) => key)
}

function sourceCollectionAccepted(
  packet?: AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput['sourceNativeGpuProofCollectionPacket'],
): boolean {
  const counts = packet?.counts
  const booleans = packet?.booleans
  const sourceDecision = packet?.sourceDecision ?? packet?.decision
  const statusDecision = packet?.sourceDecision ? packet?.decision : packet?.currentStatus
  return Boolean(packet) &&
    sourceDecision === 'ai_graphics_external_beta_native_gpu_proof_collection_prepared_with_private_manifest_and_runtime_result_blocks' &&
    (
      statusDecision === 'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results' ||
      statusDecision === 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready' ||
      packet?.currentStatus === 'external_beta_native_gpu_proof_collection_blocked_pending_private_manifests_and_runtime_results' ||
      packet?.readyAfterEvidenceStatus === 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready'
    ) &&
    (packet?.totalAiGraphicsTools === 21 || counts?.totalAiGraphicsTools === 21) &&
    counts?.gpuRuntimeTargetedTools === 8 &&
    counts?.modelWeightManifestRequiredTools === 5 &&
    counts?.nativeGpuRuntimeProofProfilesRequired === 6 &&
    booleans?.gpuRuntimeOnDemandOnly === true &&
    booleans?.gpuRuntimeShouldStartNow === false &&
    booleans?.agentCanExecuteToolsNow === false
}

const expectedPacketPaths = {
  checksumEvidencePacket:
    '.local-artifacts/ai-graphics/model-weight-checksum-evidence/model-weight-checksum-evidence-packet.json',
  modelWeightManifestReviewPacket:
    '.local-artifacts/ai-graphics/model-weight-manifests/model-weight-manifest-review-packet.json',
  gpuRuntimeProofCommandPlanPacket:
    '.local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-command-plan-packet.json',
  nativeGpuHostPreflight:
    '.local-artifacts/ai-graphics/gpu-runtime-proof-results/native-gpu-host-preflight.json',
  gpuRuntimeProofResultPacket:
    '.local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json',
  nativeGpuProofCollectionPacket:
    '.local-artifacts/ai-graphics/gpu-runtime-proof-results/external-beta-native-gpu-proof-collection-packet.json',
  perToolRuntimeProofRecheckPacket:
    '.local-artifacts/ai-graphics/gpu-runtime-proof-results/external-beta-per-tool-runtime-proof-recheck-packet.json',
} as const

const operatorSteps: AiGraphicsExternalBetaNativeGpuProofOperatorStep[] = [
  {
    stepId: 'scaffold_private_checksum_evidence',
    command:
      'npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence',
    outputPath: '.local-artifacts/ai-graphics/model-weight-checksum-evidence',
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'validate_private_checksum_evidence',
    command:
      `npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence > ${expectedPacketPaths.checksumEvidencePacket}`,
    outputPath: expectedPacketPaths.checksumEvidencePacket,
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'author_private_model_manifests',
    command:
      'npm run --silent ai-graphics:model-weight-manifest-authoring -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --out-dir .local-artifacts/ai-graphics/model-weight-manifests',
    outputPath: '.local-artifacts/ai-graphics/model-weight-manifests',
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'validate_private_model_manifests',
    command:
      `npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests > ${expectedPacketPaths.modelWeightManifestReviewPacket}`,
    outputPath: expectedPacketPaths.modelWeightManifestReviewPacket,
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'generate_native_gpu_command_plan',
    command:
      `npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests --script-out .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh > ${expectedPacketPaths.gpuRuntimeProofCommandPlanPacket}`,
    outputPath: expectedPacketPaths.gpuRuntimeProofCommandPlanPacket,
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'verify_native_gpu_host',
    command:
      `npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible > ${expectedPacketPaths.nativeGpuHostPreflight}`,
    outputPath: expectedPacketPaths.nativeGpuHostPreflight,
    mustRunOnNativeGpuHost: true,
    requiresPrivateArtifacts: false,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'run_native_gpu_profile_proof',
    command: 'bash .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh',
    outputPath: '.local-artifacts/ai-graphics/gpu-runtime-proof-results',
    mustRunOnNativeGpuHost: true,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: true,
  },
  {
    stepId: 'validate_native_gpu_proof_results',
    command:
      `npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results > ${expectedPacketPaths.gpuRuntimeProofResultPacket}`,
    outputPath: expectedPacketPaths.gpuRuntimeProofResultPacket,
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'validate_native_gpu_proof_collection',
    command:
      `npm run --silent ai-graphics:external-beta-native-gpu-proof-collection -- --external-beta-per-tool-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json --gpu-runtime-proof-command-plan-packet ${expectedPacketPaths.gpuRuntimeProofCommandPlanPacket} --model-weight-checksum-evidence-packet ${expectedPacketPaths.checksumEvidencePacket} --model-weight-manifest-review-packet ${expectedPacketPaths.modelWeightManifestReviewPacket} --gpu-runtime-proof-result-packet ${expectedPacketPaths.gpuRuntimeProofResultPacket} --external-beta-native-gpu-proof-collection-policy-ref private://ai-graphics/external-beta/native-gpu-proof/policy --external-beta-native-gpu-proof-collection-schema-ref private://ai-graphics/external-beta/native-gpu-proof/schema --external-beta-native-gpu-proof-collection-host-pool-ref private://ai-graphics/external-beta/native-gpu-proof/host-pool/l4 --external-beta-native-gpu-proof-collection-private-artifact-namespace-ref private://ai-graphics/model-weights --external-beta-native-gpu-proof-collection-telemetry-ref private://ai-graphics/external-beta/native-gpu-proof/telemetry --external-beta-native-gpu-proof-collection-rollback-ref private://ai-graphics/external-beta/native-gpu-proof/rollback > ${expectedPacketPaths.nativeGpuProofCollectionPacket}`,
    outputPath: expectedPacketPaths.nativeGpuProofCollectionPacket,
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
  {
    stepId: 'recheck_external_beta_per_tool_runtime_proof',
    command:
      `npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --external-beta-tool-route-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json --node-runtime-proof-packet docs/tool-intelligence/ai-graphics/node-runtime-proof.json --browser-runtime-proof-packet docs/tool-intelligence/ai-graphics/browser-runtime-proof.json --satori-font-runtime-proof-packet docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json --gpu-runtime-proof-result-packet ${expectedPacketPaths.gpuRuntimeProofResultPacket} --external-beta-per-tool-runtime-proof-policy-ref private://ai-graphics/external-beta/per-tool-runtime-proof/policy --external-beta-per-tool-runtime-proof-schema-ref private://ai-graphics/external-beta/per-tool-runtime-proof/schema --external-beta-runtime-proof-evidence-ref private://ai-graphics/external-beta/per-tool-runtime-proof/evidence --external-beta-runtime-proof-telemetry-ref private://ai-graphics/external-beta/per-tool-runtime-proof/telemetry --external-beta-runtime-proof-rollback-ref private://ai-graphics/external-beta/per-tool-runtime-proof/rollback > ${expectedPacketPaths.perToolRuntimeProofRecheckPacket}`,
    outputPath: expectedPacketPaths.perToolRuntimeProofRecheckPacket,
    mustRunOnNativeGpuHost: false,
    requiresPrivateArtifacts: true,
    performsRuntimeExecution: false,
  },
]

export function buildAiGraphicsExternalBetaNativeGpuProofOperatorHandoff(
  input: AiGraphicsExternalBetaNativeGpuProofOperatorHandoffInput = {},
): AiGraphicsExternalBetaNativeGpuProofOperatorHandoff {
  const sourceAccepted = sourceCollectionAccepted(input.sourceNativeGpuProofCollectionPacket)
  const missingOperatorControls = missingControls(input)
  const readyForPerToolRuntimeProofRecheck =
    sourceAccepted &&
    missingOperatorControls.length === 0 &&
    input.sourceNativeGpuProofCollectionPacket?.decision ===
      'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready'

  const decision: AiGraphicsExternalBetaNativeGpuProofOperatorHandoffStatus = !input.sourceNativeGpuProofCollectionPacket
    ? 'missing_external_beta_native_gpu_proof_collection'
    : !sourceAccepted
      ? 'external_beta_native_gpu_proof_collection_not_accepted'
      : missingOperatorControls.length > 0
        ? 'missing_external_beta_native_gpu_proof_operator_controls'
        : readyForPerToolRuntimeProofRecheck
          ? 'external_beta_native_gpu_proof_operator_handoff_ready_for_per_tool_recheck_not_beta_ready'
          : 'external_beta_native_gpu_proof_operator_handoff_prepared_with_pending_private_evidence_and_native_gpu_results'

  return {
    decision,
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_OPERATOR_HANDOFF_DECISION,
    sourceCollectionAccepted: sourceAccepted,
    missingOperatorControls,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    runtimeProfilesRequired: [...runtimeProfilesRequired],
    runtimeProfilesRequiredCount: 6,
    operatorSteps,
    expectedPacketPaths,
    completionCriteria: {
      checksumEvidenceAccepted: 5,
      privateModelManifestsAccepted: 5,
      nativeGpuProofProfilesAccepted: 6,
      nativeGpuToolsAcceptedAfterPerToolRecheck: 8,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    booleans: {
      externalBetaNativeGpuProofOperatorHandoffPrepared: true,
      sourceNativeGpuProofCollectionAccepted: sourceAccepted,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightToolsCovered: true,
      all6NativeGpuProfilesCovered: true,
      operatorRunbookDeterministic: true,
      fullPerToolRuntimeProofRecheckCommandPrepared: true,
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
