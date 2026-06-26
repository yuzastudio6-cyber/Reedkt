import {
  buildAiGraphicsGpuRuntimeProofCommandPlan,
  type AiGraphicsGpuRuntimeProofInputStatus,
} from './ai-graphics-gpu-runtime-proof-command-plan'
import {
  buildAiGraphicsGpuRuntimeProofResultPacket,
  type AiGraphicsGpuRuntimeProofAggregateStatus,
} from './ai-graphics-gpu-runtime-proof-result'
import type {
  AiGraphicsModelWeightManifestEvidenceRecord,
} from './ai-graphics-model-weight-manifest-readiness'

export const AI_GRAPHICS_GPU_RUNTIME_PROOF_LOCAL_PREFLIGHT_DECISION =
  'ai_graphics_gpu_runtime_proof_local_preflight_prepared_with_manifest_and_result_blocks'

export interface AiGraphicsGpuRuntimeProofLocalPreflight {
  decision: typeof AI_GRAPHICS_GPU_RUNTIME_PROOF_LOCAL_PREFLIGHT_DECISION
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: 8
  modelWeightManifestRequiredTools: 5
  runtimeProfilesRequired: 4
  localManifestFilesRead: number
  localProofResultFilesRead: number
  manifestInputStatus: AiGraphicsGpuRuntimeProofInputStatus
  proofResultInputStatus: AiGraphicsGpuRuntimeProofAggregateStatus
  modelManifestsReadyForGpuProof: boolean
  nativeGpuProofResultsAcceptedForOwnerReview: boolean
  allGpuRuntimeEvidenceReadyForOwnerReview: boolean
  localProofResultDirectory: '.local-artifacts/ai-graphics/gpu-runtime-proof-results'
  proofResultValidatorCommand: 'npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results'
  requiredNextCommands: string[]
  missingLocalEvidence: string[]
  booleans: {
    gpuRuntimeProofLocalPreflightPrepared: true
    commandPlanAccepted: true
    proofResultPacketAccepted: true
    all8GpuRuntimeToolsCovered: true
    all5ModelWeightManifestToolsCovered: true
    all4RuntimeProfilesCovered: true
    privateArtifactRefsNotLogged: true
    modelManifestsReadyForGpuProof: boolean
    nativeGpuProofResultsAcceptedForOwnerReview: boolean
    allGpuRuntimeEvidenceReadyForOwnerReview: boolean
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

export function buildAiGraphicsGpuRuntimeProofLocalPreflight(input: {
  manifestRecords?: readonly Partial<AiGraphicsModelWeightManifestEvidenceRecord>[]
  proofResults?: readonly unknown[]
  localManifestFilesRead?: number
  localProofResultFilesRead?: number
} = {}): AiGraphicsGpuRuntimeProofLocalPreflight {
  const commandPlan = buildAiGraphicsGpuRuntimeProofCommandPlan(input.manifestRecords ?? [])
  const proofResultPacket = buildAiGraphicsGpuRuntimeProofResultPacket(input.proofResults ?? [])
  const modelManifestsReadyForGpuProof =
    commandPlan.nativeGpuProofInputStatus === 'ready_for_native_gpu_runtime_probe_input'
  const nativeGpuProofResultsAcceptedForOwnerReview =
    proofResultPacket.nativeGpuRuntimeProofResultsAccepted === true
  const allGpuRuntimeEvidenceReadyForOwnerReview =
    modelManifestsReadyForGpuProof && nativeGpuProofResultsAcceptedForOwnerReview

  const missingLocalEvidence = [
    !modelManifestsReadyForGpuProof ? 'reviewed_private_model_weight_manifests' : undefined,
    !nativeGpuProofResultsAcceptedForOwnerReview ? 'native_gpu_runtime_proof_results' : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  const requiredNextCommands = [
    'npm run --silent ai-graphics:model-weight-manifest-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-manifests',
    'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests',
    'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests',
    commandPlan.proofResultValidatorCommand,
    'npm run --silent ai-graphics:beta-evidence-bundle:validate -- --use-committed-js-runtime-proofs --all-shared-gates-passed --browser-canvas-webgl-sandbox-passed --model-weight-manifest-review-packet <private-reviewed-manifest-packet.json> --gpu-runtime-proof-result-packet <native-gpu-proof-result-packet.json> --require-all-21-beta-ready',
  ]

  return {
    decision: AI_GRAPHICS_GPU_RUNTIME_PROOF_LOCAL_PREFLIGHT_DECISION,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: 8,
    modelWeightManifestRequiredTools: 5,
    runtimeProfilesRequired: 4,
    localManifestFilesRead: input.localManifestFilesRead ?? 0,
    localProofResultFilesRead: input.localProofResultFilesRead ?? 0,
    manifestInputStatus: commandPlan.nativeGpuProofInputStatus,
    proofResultInputStatus: proofResultPacket.status,
    modelManifestsReadyForGpuProof,
    nativeGpuProofResultsAcceptedForOwnerReview,
    allGpuRuntimeEvidenceReadyForOwnerReview,
    localProofResultDirectory: commandPlan.localProofResultDirectory,
    proofResultValidatorCommand: commandPlan.proofResultValidatorCommand,
    requiredNextCommands,
    missingLocalEvidence,
    booleans: {
      gpuRuntimeProofLocalPreflightPrepared: true,
      commandPlanAccepted: true,
      proofResultPacketAccepted: true,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightManifestToolsCovered: true,
      all4RuntimeProfilesCovered: true,
      privateArtifactRefsNotLogged: true,
      modelManifestsReadyForGpuProof,
      nativeGpuProofResultsAcceptedForOwnerReview,
      allGpuRuntimeEvidenceReadyForOwnerReview,
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
