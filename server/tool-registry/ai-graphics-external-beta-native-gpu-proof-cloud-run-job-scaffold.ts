import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_CLOUD_RUN_JOB_SCAFFOLD_DECISION =
  'ai_graphics_external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_local_only'

export type AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldStatus =
  | 'external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_pending_private_cloud_run_execution'

export interface AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldSourceOperatorHandoffPacket {
  decision?: string
  sourceDecision?: string
  currentStatus?: string
  sourceNativeGpuProofCollectionBridgeAccepted?: boolean
  booleans?: {
    sourceRuntimeQueueServiceProofBridgeAccepted?: boolean
  }
}

export interface AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput {
  sourceOperatorHandoffPacket?: AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldSourceOperatorHandoffPacket
  sourceOperatorHandoffDecision?: string
  sourceOperatorHandoffStatus?: string
  cloudRunProjectRef?: string
  cloudRunRegionRef?: string
  cloudRunServiceAccountRef?: string
  gpuWorkerImageRef?: string
  privateModelWeightDeliveryMode?: 'prebaked_private_image_layer' | 'approved_private_runtime_mount'
  privateModelManifestRootRef?: string
  privateTelemetryRef?: string
  rollbackRef?: string
}

export interface AiGraphicsExternalBetaNativeGpuProofCloudRunCommand {
  commandId: string
  command: string
  outputPath: string
  performsCloudRunDeployment: boolean
  performsCloudRunExecution: boolean
  requiresExplicitConfirmation: boolean
}

export interface AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffold {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_CLOUD_RUN_JOB_SCAFFOLD_DECISION
  currentStatus: AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldStatus
  sourceOperatorHandoffDecisionAccepted: boolean
  sourceOperatorHandoffStatusAccepted: boolean
  sourceOperatorHandoffBridgeAccepted: boolean
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  modelWeightManifestRequiredTools: string[]
  runtimeProfilesRequired: string[]
  cloudRunRuntimeTarget: {
    platform: 'google_cloud_run_jobs'
    gpuType: 'nvidia-l4'
    gpuCount: 1
    cpu: '4'
    memory: '16Gi'
    tasks: 1
    parallelism: 1
    maxRetries: 0
    startsGpuOnlyDuringJobExecution: true
    idleGpuServiceApproved: false
  }
  privateModelWeightDelivery: {
    allowedModes: Array<'prebaked_private_image_layer' | 'approved_private_runtime_mount'>
    selectedMode: 'prebaked_private_image_layer' | 'approved_private_runtime_mount'
    rawGcsRefsAllowedAsEvidence: false
    publicRefsAllowedAsEvidence: false
    signedUrlsAllowedAsEvidence: false
  }
  generatedFiles: {
    jobPlan: string
    deployScript: string
    executeScript: string
    checklist: string
  }
  expectedLocalOutputPaths: {
    jobPlanPacket: string
    profileResultDirectory: string
    profileResultPrefix: string
    assembledGpuProofResultPacket: string
  }
  cloudRunCommands: AiGraphicsExternalBetaNativeGpuProofCloudRunCommand[]
  booleans: {
    externalBetaNativeGpuProofCloudRunJobScaffoldPrepared: true
    sourceOperatorHandoffAccepted: boolean
    sourceNativeGpuProofCollectionBridgeAccepted: boolean
    all8GpuRuntimeToolsCovered: true
    all5ModelWeightToolsCovered: true
    all6NativeGpuProfilesCovered: true
    cloudRunJobUsesNvidiaL4: true
    cloudRunJobUsesOneGpuPerExecution: true
    cloudRunJobUsesTasksOneParallelismOne: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedProofJob: true
    cpuFallbackAllowedForHeavyTools: false
    cloudRunDeploymentPerformed: false
    cloudRunJobExecutionPerformed: false
    localOnlyScaffoldGenerated: true
    privateModelWeightDeliveryRequired: true
    privateArtifactRefsRequired: true
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

const expectedLocalOutputPaths = {
  jobPlanPacket:
    '.local-artifacts/ai-graphics/cloud-run-native-gpu-proof/cloud-run-native-gpu-proof-job-plan.json',
  profileResultDirectory:
    '.local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results',
  profileResultPrefix:
    '.local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results/native-gpu-profile',
  assembledGpuProofResultPacket:
    '.local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json',
} as const

const generatedFiles = {
  jobPlan: 'cloud-run-native-gpu-proof-job-plan.json',
  deployScript: 'deploy-cloud-run-native-gpu-proof-job.sh',
  executeScript: 'execute-cloud-run-native-gpu-proof-job.sh',
  checklist: 'cloud-run-native-gpu-proof-operator-checklist.md',
} as const

function sourceOperatorHandoffAccepted(input: AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput): boolean {
  const packet = input.sourceOperatorHandoffPacket
  const decision = packet?.sourceDecision ?? packet?.decision ?? input.sourceOperatorHandoffDecision
  return decision ===
    'ai_graphics_external_beta_native_gpu_proof_operator_handoff_prepared_with_private_evidence_runtime_blocks'
}

function sourceOperatorHandoffStatusAccepted(input: AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput): boolean {
  const packet = input.sourceOperatorHandoffPacket
  const status = packet?.sourceDecision
    ? packet.decision
    : packet?.currentStatus ?? input.sourceOperatorHandoffStatus
  return status ===
    'external_beta_native_gpu_proof_operator_handoff_prepared_with_pending_private_evidence_and_native_gpu_results' ||
    status ===
      'external_beta_native_gpu_proof_operator_handoff_ready_for_per_tool_recheck_not_beta_ready'
}

function sourceOperatorHandoffBridgeAccepted(
  input: AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput,
): boolean {
  const packet = input.sourceOperatorHandoffPacket
  return Boolean(packet) &&
    packet?.sourceNativeGpuProofCollectionBridgeAccepted === true &&
    packet?.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted === true
}

const cloudRunCommands: AiGraphicsExternalBetaNativeGpuProofCloudRunCommand[] = [
  {
    commandId: 'write_local_job_plan',
    command:
      'npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold -- --source-operator-handoff-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-operator-handoff.json --out-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof',
    outputPath: expectedLocalOutputPaths.jobPlanPacket,
    performsCloudRunDeployment: false,
    performsCloudRunExecution: false,
    requiresExplicitConfirmation: false,
  },
  {
    commandId: 'deploy_on_demand_l4_proof_job',
    command: './deploy-cloud-run-native-gpu-proof-job.sh',
    outputPath: '.local-artifacts/ai-graphics/cloud-run-native-gpu-proof/cloud-run-job-deploy-output.json',
    performsCloudRunDeployment: true,
    performsCloudRunExecution: false,
    requiresExplicitConfirmation: true,
  },
  {
    commandId: 'execute_l4_proof_job_per_profile',
    command: './execute-cloud-run-native-gpu-proof-job.sh',
    outputPath: expectedLocalOutputPaths.profileResultDirectory,
    performsCloudRunDeployment: false,
    performsCloudRunExecution: true,
    requiresExplicitConfirmation: true,
  },
  {
    commandId: 'validate_assembled_native_gpu_result_packet',
    command:
      `npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir ${expectedLocalOutputPaths.profileResultDirectory} > ${expectedLocalOutputPaths.assembledGpuProofResultPacket}`,
    outputPath: expectedLocalOutputPaths.assembledGpuProofResultPacket,
    performsCloudRunDeployment: false,
    performsCloudRunExecution: false,
    requiresExplicitConfirmation: false,
  },
]

export function buildAiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffold(
  input: AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffoldInput = {},
): AiGraphicsExternalBetaNativeGpuProofCloudRunJobScaffold {
  const selectedMode = input.privateModelWeightDeliveryMode ?? 'prebaked_private_image_layer'
  const sourceDecisionAccepted = sourceOperatorHandoffAccepted(input)
  const sourceStatusAccepted = sourceOperatorHandoffStatusAccepted(input)
  const sourceBridgeAccepted = sourceOperatorHandoffBridgeAccepted(input)

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_CLOUD_RUN_JOB_SCAFFOLD_DECISION,
    currentStatus: 'external_beta_native_gpu_proof_cloud_run_job_scaffold_prepared_pending_private_cloud_run_execution',
    sourceOperatorHandoffDecisionAccepted: sourceDecisionAccepted,
    sourceOperatorHandoffStatusAccepted: sourceStatusAccepted,
    sourceOperatorHandoffBridgeAccepted: sourceBridgeAccepted,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    runtimeProfilesRequired: [...runtimeProfilesRequired],
    cloudRunRuntimeTarget: {
      platform: 'google_cloud_run_jobs',
      gpuType: 'nvidia-l4',
      gpuCount: 1,
      cpu: '4',
      memory: '16Gi',
      tasks: 1,
      parallelism: 1,
      maxRetries: 0,
      startsGpuOnlyDuringJobExecution: true,
      idleGpuServiceApproved: false,
    },
    privateModelWeightDelivery: {
      allowedModes: ['prebaked_private_image_layer', 'approved_private_runtime_mount'],
      selectedMode,
      rawGcsRefsAllowedAsEvidence: false,
      publicRefsAllowedAsEvidence: false,
      signedUrlsAllowedAsEvidence: false,
    },
    generatedFiles,
    expectedLocalOutputPaths,
    cloudRunCommands,
    booleans: {
      externalBetaNativeGpuProofCloudRunJobScaffoldPrepared: true,
      sourceOperatorHandoffAccepted:
        sourceDecisionAccepted && sourceStatusAccepted && sourceBridgeAccepted,
      sourceNativeGpuProofCollectionBridgeAccepted: sourceBridgeAccepted,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightToolsCovered: true,
      all6NativeGpuProfilesCovered: true,
      cloudRunJobUsesNvidiaL4: true,
      cloudRunJobUsesOneGpuPerExecution: true,
      cloudRunJobUsesTasksOneParallelismOne: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedProofJob: true,
      cpuFallbackAllowedForHeavyTools: false,
      cloudRunDeploymentPerformed: false,
      cloudRunJobExecutionPerformed: false,
      localOnlyScaffoldGenerated: true,
      privateModelWeightDeliveryRequired: true,
      privateArtifactRefsRequired: true,
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
