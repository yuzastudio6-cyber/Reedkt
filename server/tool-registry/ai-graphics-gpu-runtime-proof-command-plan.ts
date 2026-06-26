import { getGpuModelWeightManifestTemplate } from '../model-weights'
import {
  AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION,
  buildAiGraphicsModelWeightManifestReviewPacket,
  type AiGraphicsModelWeightManifestEvidenceRecord,
  type AiGraphicsModelWeightManifestReviewPacket,
  type AiGraphicsModelWeightManifestToolId,
} from './ai-graphics-model-weight-manifest-readiness'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_GPU_RUNTIME_PROOF_COMMAND_PLAN_DECISION =
  'ai_graphics_gpu_runtime_proof_command_plan_prepared_with_manifest_blocks'

export type AiGraphicsGpuRuntimeProofInputStatus =
  | 'missing_private_manifests'
  | 'invalid_private_manifests'
  | 'ready_for_native_gpu_runtime_probe_input'

export interface AiGraphicsGpuRuntimeProofManifestMount {
  toolId: AiGraphicsModelWeightManifestToolId
  templateId: string
  expectedRuntimePath: string
  containerManifestPath: string
  localMountEnv: 'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT'
  localMountPlaceholder: string
  dockerMountPlaceholder: string
}

export interface AiGraphicsGpuRuntimeProofProfilePlan {
  profileId: 'gpu_worker_ai_graphics' | 'sam2' | 'birefnet' | 'real_esrgan'
  dockerfile: string
  imagePlaceholder: string
  runtimeTarget: string
  scriptPathInImage: string
  tools: AiGraphicsCanonicalToolId[]
  requiredEnv: {
    REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF: 'true'
    MODEL_DOWNLOADS_ENABLED: 'false'
    PROVIDER_EXECUTION_ENABLED: 'false'
    REEDITPRO_MODEL_WEIGHT_DIR: '/opt/reeditpro/model-weights'
  }
  requiredHostEnv: {
    REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT: 'local-only private model-weight root; value must not be committed or logged'
  }
  requiredDockerFlags: ['--rm', '--gpus all']
  modelWeightManifestFlag: '--require-model-weight-manifests'
  modelWeightManifestMounts: AiGraphicsGpuRuntimeProofManifestMount[]
  command: string
  localProofResultPath: string
  resultCaptureCommand: string
  status: 'planned_not_executed'
}

export interface AiGraphicsGpuRuntimeProofCommandPlan {
  decision: typeof AI_GRAPHICS_GPU_RUNTIME_PROOF_COMMAND_PLAN_DECISION
  sourceManifestReviewDecision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  manifestReviewPacket: AiGraphicsModelWeightManifestReviewPacket
  nativeGpuProofInputStatus: AiGraphicsGpuRuntimeProofInputStatus
  runtimeProfiles: AiGraphicsGpuRuntimeProofProfilePlan[]
  localProofResultDirectory: '.local-artifacts/ai-graphics/gpu-runtime-proof-results'
  proofResultValidatorCommand: 'npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results'
  blockers: string[]
  booleans: {
    gpuRuntimeProofCommandPlanPrepared: true
    sourceManifestReviewPacketAccepted: true
    all8GpuRuntimeToolsCovered: true
    all5ModelWeightManifestToolsCovered: true
    all4RuntimeProfilesCovered: true
    privateArtifactRefsNotLogged: true
    dockerGpuFlagRequired: true
    explicitRuntimeProofOptInRequired: true
    modelWeightManifestMountsPlanned: true
    nativeGpuRuntimeProofStillRequired: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
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

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

const localDirectoryByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

const localProofResultDirectory = '.local-artifacts/ai-graphics/gpu-runtime-proof-results'
const proofResultValidatorCommand =
  'npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results'
const privateModelWeightRootEnv = 'REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT'
const privateModelWeightRootMountPrefix = '$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT'

const runtimeProfileSpecs = [
  {
    profileId: 'gpu_worker_ai_graphics',
    dockerfile: 'docker/prod/gpu-worker/Dockerfile',
    imagePlaceholder: '<gpu-worker-image>',
    scriptPathInImage: '/usr/local/bin/ai-graphics-gpu-runtime-readiness.py',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    tools: [
      'torch_torchvision',
      'transformers',
      'sam2',
      'real_esrgan',
      'kornia',
      'rembg',
      'transparent_background',
    ],
    requiredManifestTools: modelWeightManifestRequiredTools,
    scriptCommand: 'python3 /usr/local/bin/ai-graphics-gpu-runtime-readiness.py',
  },
  {
    profileId: 'sam2',
    dockerfile: 'docker/prod/sam2-runtime/Dockerfile',
    imagePlaceholder: '<sam2-runtime-image>',
    scriptPathInImage: '/app/ai-graphics-gpu-runtime-readiness.py',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_sam2_runtime',
    tools: ['sam2', 'torch_torchvision'],
    requiredManifestTools: ['sam2'],
    scriptCommand: 'python3 ./ai-graphics-gpu-runtime-readiness.py',
  },
  {
    profileId: 'birefnet',
    dockerfile: 'docker/prod/birefnet-runtime/Dockerfile',
    imagePlaceholder: '<birefnet-runtime-image>',
    scriptPathInImage: '/usr/local/bin/ai-graphics-gpu-runtime-readiness.py',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
    tools: ['birefnet', 'transformers', 'kornia', 'torch_torchvision'],
    requiredManifestTools: ['birefnet'],
    scriptCommand: 'python3 /usr/local/bin/ai-graphics-gpu-runtime-readiness.py',
  },
  {
    profileId: 'real_esrgan',
    dockerfile: 'docker/prod/real-esrgan-runtime/Dockerfile',
    imagePlaceholder: '<real-esrgan-runtime-image>',
    scriptPathInImage: '/usr/local/bin/ai-graphics-gpu-runtime-readiness.py',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
    tools: ['real_esrgan', 'torch_torchvision'],
    requiredManifestTools: ['real_esrgan'],
    scriptCommand: 'python3 /usr/local/bin/ai-graphics-gpu-runtime-readiness.py',
  },
] as const satisfies readonly {
  profileId: AiGraphicsGpuRuntimeProofProfilePlan['profileId']
  dockerfile: string
  imagePlaceholder: string
  scriptPathInImage: string
  runtimeTarget: string
  tools: readonly AiGraphicsCanonicalToolId[]
  requiredManifestTools: readonly AiGraphicsModelWeightManifestToolId[]
  scriptCommand: string
}[]

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function manifestMountForTool(toolId: AiGraphicsModelWeightManifestToolId): AiGraphicsGpuRuntimeProofManifestMount {
  const templateId = templateIdByTool[toolId]
  const template = getGpuModelWeightManifestTemplate(templateId)
  if (!template) {
    throw new Error(`Missing model-weight manifest template for ${toolId}: ${templateId}`)
  }

  const expectedRuntimePath = trimTrailingSlash(template.expectedPath)
  const localMountPlaceholder = `${privateModelWeightRootMountPrefix}/${localDirectoryByTool[toolId]}`

  return {
    toolId,
    templateId,
    expectedRuntimePath,
    containerManifestPath: `${expectedRuntimePath}/model_tree_manifest.json`,
    localMountEnv: privateModelWeightRootEnv,
    localMountPlaceholder,
    dockerMountPlaceholder: `--mount type=bind,src=${localMountPlaceholder},dst=${expectedRuntimePath},readonly`,
  }
}

function statusForManifestReviewPacket(
  packet: AiGraphicsModelWeightManifestReviewPacket,
): AiGraphicsGpuRuntimeProofInputStatus {
  if (packet.manifestRecordsProvided === 0) {
    return 'missing_private_manifests'
  }

  const allAccepted = packet.manifestRecordsProvided === 5 &&
    packet.schemaValidManifestRecords === 5 &&
    packet.reviewAcceptedManifestRecords === 5 &&
    packet.nativeGpuProofInputEligibleRecords === 5

  return allAccepted ? 'ready_for_native_gpu_runtime_probe_input' : 'invalid_private_manifests'
}

function buildProfilePlan(
  spec: typeof runtimeProfileSpecs[number],
): AiGraphicsGpuRuntimeProofProfilePlan {
  const mounts = spec.requiredManifestTools.map(manifestMountForTool)
  const command = [
    'docker run',
    '--rm',
    '--gpus all',
    '-e REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true',
    '-e MODEL_DOWNLOADS_ENABLED=false',
    '-e PROVIDER_EXECUTION_ENABLED=false',
    '-e REEDITPRO_MODEL_WEIGHT_DIR=/opt/reeditpro/model-weights',
    ...mounts.map((mount) => mount.dockerMountPlaceholder),
    spec.imagePlaceholder,
    spec.scriptCommand,
    `--profile ${spec.profileId}`,
    '--require-model-weight-manifests',
  ].join(' ')
  const localProofResultPath = `${localProofResultDirectory}/${spec.profileId}.json`
  const hostEnvGuard = `test -n "$${privateModelWeightRootEnv}" && test -d "$${privateModelWeightRootEnv}"`
  const resultCaptureCommand = `${hostEnvGuard} && mkdir -p ${localProofResultDirectory} && ${command} > ${localProofResultPath}`

  return {
    profileId: spec.profileId,
    dockerfile: spec.dockerfile,
    imagePlaceholder: spec.imagePlaceholder,
    runtimeTarget: spec.runtimeTarget,
    scriptPathInImage: spec.scriptPathInImage,
    tools: [...spec.tools],
    requiredEnv: {
      REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF: 'true',
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      REEDITPRO_MODEL_WEIGHT_DIR: '/opt/reeditpro/model-weights',
    },
    requiredHostEnv: {
      REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT:
        'local-only private model-weight root; value must not be committed or logged',
    },
    requiredDockerFlags: ['--rm', '--gpus all'],
    modelWeightManifestFlag: '--require-model-weight-manifests',
    modelWeightManifestMounts: mounts,
    command,
    localProofResultPath,
    resultCaptureCommand,
    status: 'planned_not_executed',
  }
}

export function buildAiGraphicsGpuRuntimeProofCommandPlan(
  evidenceRecords: readonly Partial<AiGraphicsModelWeightManifestEvidenceRecord>[] = [],
): AiGraphicsGpuRuntimeProofCommandPlan {
  const manifestReviewPacket = buildAiGraphicsModelWeightManifestReviewPacket(evidenceRecords)
  const nativeGpuProofInputStatus = statusForManifestReviewPacket(manifestReviewPacket)

  const blockers = [
    nativeGpuProofInputStatus === 'missing_private_manifests'
      ? 'Reviewed private model-weight manifests are missing for sam2, birefnet, real_esrgan, rembg, and transparent_background.'
      : undefined,
    nativeGpuProofInputStatus === 'invalid_private_manifests'
      ? 'One or more private model-weight manifests failed schema, checksum, review, or private-reference validation.'
      : undefined,
    'Native linux/amd64 NVIDIA L4 proof still must run outside this planning command with docker --gpus all.',
    'Tool Route, Worker, provider/model, browser/WebGL/canvas, artifact, beta, and production gates remain blocked.',
  ].filter((entry): entry is string => Boolean(entry))

  return {
    decision: AI_GRAPHICS_GPU_RUNTIME_PROOF_COMMAND_PLAN_DECISION,
    sourceManifestReviewDecision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    manifestReviewPacket,
    nativeGpuProofInputStatus,
    runtimeProfiles: runtimeProfileSpecs.map(buildProfilePlan),
    localProofResultDirectory,
    proofResultValidatorCommand,
    blockers,
    booleans: {
      gpuRuntimeProofCommandPlanPrepared: true,
      sourceManifestReviewPacketAccepted: true,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightManifestToolsCovered: true,
      all4RuntimeProfilesCovered: true,
      privateArtifactRefsNotLogged: true,
      dockerGpuFlagRequired: true,
      explicitRuntimeProofOptInRequired: true,
      modelWeightManifestMountsPlanned: true,
      nativeGpuRuntimeProofStillRequired: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
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
