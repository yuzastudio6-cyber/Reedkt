import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'
import type { AiGraphicsGpuRuntimeProofProfileId } from './ai-graphics-gpu-runtime-proof-result'

export const AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_CLOUD_RUN_RESULT_COLLECTOR_DECISION =
  'ai_graphics_external_beta_native_gpu_proof_cloud_run_result_collector_prepared_local_only'

export type AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorStatus =
  | 'external_beta_native_gpu_proof_cloud_run_result_collector_prepared_pending_private_cloud_run_logs'

export interface AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorSourceScaffoldPacket {
  decision?: string
  currentStatus?: string
  sourceOperatorHandoffBridgeAccepted?: boolean
  booleans?: {
    sourceNativeGpuProofCollectionBridgeAccepted?: boolean
  }
}

export interface AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorInput {
  sourceCloudRunJobScaffoldPacket?: AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorSourceScaffoldPacket
  sourceCloudRunJobScaffoldDecision?: string
  sourceCloudRunJobScaffoldStatus?: string
  logsDirectory?: string
  outputDirectory?: string
}

export interface AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_CLOUD_RUN_RESULT_COLLECTOR_DECISION
  currentStatus: AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorStatus
  sourceCloudRunJobScaffoldDecisionAccepted: boolean
  sourceCloudRunJobScaffoldStatusAccepted: boolean
  sourceCloudRunJobScaffoldBridgeAccepted: boolean
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  runtimeProfilesRequired: AiGraphicsGpuRuntimeProofProfileId[]
  expectedLogFiles: Record<AiGraphicsGpuRuntimeProofProfileId, string>
  outputFiles: {
    extractedProfileResultDirectory: string
    collectorPacket: string
    gpuRuntimeProofResultPacket: string
  }
  followUpValidationCommand: string
  booleans: {
    externalBetaNativeGpuProofCloudRunResultCollectorPrepared: true
    sourceCloudRunJobScaffoldAccepted: boolean
    sourceNativeGpuProofCollectionBridgeAccepted: boolean
    all8GpuRuntimeToolsCovered: true
    all6NativeGpuProfilesCovered: true
    parsesCloudRunLogsOnly: true
    writesLocalExtractedJsonOnly: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    cpuFallbackAllowedForHeavyTools: false
    cloudRunDeploymentPerformed: false
    cloudRunJobExecutionPerformed: false
    localOnlyCollector: true
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

const runtimeProfilesRequired = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsGpuRuntimeProofProfileId[]

export function listAiGraphicsExternalBetaCloudRunProofProfiles(): readonly AiGraphicsGpuRuntimeProofProfileId[] {
  return [...runtimeProfilesRequired]
}

export function buildAiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket(
  input: AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorInput = {},
): AiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket {
  const logsDirectory =
    input.logsDirectory ?? '.local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results'
  const outputDirectory =
    input.outputDirectory ?? '.local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results'
  const sourcePacket = input.sourceCloudRunJobScaffoldPacket
  const sourceDecision = sourcePacket?.decision ?? input.sourceCloudRunJobScaffoldDecision
  const sourceStatus = sourcePacket?.currentStatus ?? input.sourceCloudRunJobScaffoldStatus
  const sourceDecisionAccepted = sourceDecision ===
    'ai_graphics_external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_local_only'
  const sourceStatusAccepted = sourceStatus ===
    'external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_pending_private_cloud_run_execution'
  const sourceBridgeAccepted = Boolean(sourcePacket) &&
    sourcePacket?.sourceOperatorHandoffBridgeAccepted === true &&
    sourcePacket?.booleans?.sourceNativeGpuProofCollectionBridgeAccepted === true

  const expectedLogFiles = Object.fromEntries(
    runtimeProfilesRequired.map((profile) => [
      profile,
      `${logsDirectory}/native-gpu-profile-${profile}-logs.txt`,
    ]),
  ) as Record<AiGraphicsGpuRuntimeProofProfileId, string>

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_CLOUD_RUN_RESULT_COLLECTOR_DECISION,
    currentStatus: 'external_beta_native_gpu_proof_cloud_run_result_collector_prepared_pending_private_cloud_run_logs',
    sourceCloudRunJobScaffoldDecisionAccepted: sourceDecisionAccepted,
    sourceCloudRunJobScaffoldStatusAccepted: sourceStatusAccepted,
    sourceCloudRunJobScaffoldBridgeAccepted: sourceBridgeAccepted,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    runtimeProfilesRequired: [...runtimeProfilesRequired],
    expectedLogFiles,
    outputFiles: {
      extractedProfileResultDirectory: outputDirectory,
      collectorPacket: `${outputDirectory}/cloud-run-native-gpu-proof-result-collector-packet.json`,
      gpuRuntimeProofResultPacket:
        '.local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json',
    },
    followUpValidationCommand:
      `npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir ${outputDirectory} > .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json`,
    booleans: {
      externalBetaNativeGpuProofCloudRunResultCollectorPrepared: true,
      sourceCloudRunJobScaffoldAccepted:
        sourceDecisionAccepted && sourceStatusAccepted && sourceBridgeAccepted,
      sourceNativeGpuProofCollectionBridgeAccepted: sourceBridgeAccepted,
      all8GpuRuntimeToolsCovered: true,
      all6NativeGpuProfilesCovered: true,
      parsesCloudRunLogsOnly: true,
      writesLocalExtractedJsonOnly: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      cpuFallbackAllowedForHeavyTools: false,
      cloudRunDeploymentPerformed: false,
      cloudRunJobExecutionPerformed: false,
      localOnlyCollector: true,
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
