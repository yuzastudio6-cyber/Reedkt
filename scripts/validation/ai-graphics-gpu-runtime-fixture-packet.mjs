export const gpuRuntimeTargetedTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

export const gpuModelWeightManifestTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

export const gpuRuntimeProfiles = [
  'gpu_worker_ai_graphics',
  'sam2',
  'birefnet',
  'real_esrgan',
]

export const expectedGpuRuntimeTargets = {
  torch_torchvision: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transformers: 'native_linux_amd64_nvidia_l4_gpu_worker',
  sam2: 'native_linux_amd64_nvidia_l4_sam2_runtime',
  birefnet: 'native_linux_amd64_nvidia_l4_birefnet_runtime',
  real_esrgan: 'native_linux_amd64_nvidia_l4_real_esrgan_runtime',
  kornia: 'native_linux_amd64_nvidia_l4_gpu_worker',
  rembg: 'native_linux_amd64_nvidia_l4_gpu_worker',
  transparent_background: 'native_linux_amd64_nvidia_l4_gpu_worker',
}

export function acceptedGpuRuntimeProofValidationResults() {
  return gpuRuntimeProfiles.map((profileId) => ({
    profileId,
    resultProvided: true,
    acceptedForOwnerReview: true,
    proofMetadataAccepted: true,
    requiredImportsPresent: true,
    nvidiaSmiAccepted: true,
    cudaAccepted: true,
    modelManifestChecksAccepted: true,
    rawPrivateRefsNotLogged: true,
    runtimeSideEffectsBlocked: true,
    errors: [],
    warnings: [],
  }))
}

export function acceptedGpuRuntimeProofResultPacket() {
  return {
    decision: 'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results',
    status: 'ready_for_owner_review_not_beta_ready',
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools,
    expectedGpuRuntimeTargets,
    gpuRuntimePolicy: {
      onDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      proofContainerIsEphemeral: true,
      cpuFallbackAllowedForHeavyTools: false,
    },
    modelWeightManifestRequiredTools: gpuModelWeightManifestTools,
    runtimeProfilesRequired: gpuRuntimeProfiles,
    runtimeProofResultsProvided: gpuRuntimeProfiles.length,
    runtimeProofResultsAcceptedForOwnerReview: gpuRuntimeProfiles.length,
    nativeGpuRuntimeProofResultsAccepted: true,
    requiredProofChecks: [
      'native_linux_amd64_nvidia_l4_runtime_confirmed',
      'nvidia_smi_available',
      'cuda_available',
      'required_imports_present',
      'model_manifest_inputs_validated_without_logging_private_refs',
      'model_manifest_private_namespace_enforced',
      'runtime_side_effects_blocked',
      'no_model_download_or_inference_claimed',
    ],
    validationResults: acceptedGpuRuntimeProofValidationResults(),
    blockers: [
      'Owner review, Tool Route, Worker, provider/model, artifact, beta, and production gates remain blocked even if native proof results are accepted.',
    ],
    booleans: {
      gpuRuntimeProofResultValidatorPrepared: true,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightManifestToolsCovered: true,
      all4RuntimeProfilesCovered: true,
      gpuRuntimeTargetsExact: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      privateArtifactRefNamespaceRequired: true,
      privateArtifactRefsNotLogged: true,
      nativeGpuRuntimeProofResultsAcceptedForOwnerReview: true,
      ownerReviewStillRequired: true,
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
