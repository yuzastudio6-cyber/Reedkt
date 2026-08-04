export const CANONICAL_COMFYUI_GPU_RUNTIME_CONTRACT_VERSION =
  'canonical-comfyui-gpu-runtime-contract-v1' as const

export type CanonicalComfyUiGpuRuntimeModelRole =
  | 'base_checkpoint'
  | 'controlnet_checkpoint'
  | 'lora_adapter'
  | 'generic_ipadapter_checkpoint'
  | 'clip_vision_checkpoint'

export type CanonicalComfyUiGpuRuntimeModelSlotId =
  | 'base_checkpoint_artifact'
  | 'controlnet_checkpoint_artifact'
  | 'lora_adapter_artifact'
  | 'generic_ipadapter_checkpoint_artifact'
  | 'clip_vision_checkpoint_artifact'

export interface CanonicalComfyUiGpuRuntimeModelFile {
  readonly canonicalOrder: 0 | 1 | 2 | 3 | 4
  readonly role: CanonicalComfyUiGpuRuntimeModelRole
  readonly slotId: CanonicalComfyUiGpuRuntimeModelSlotId
  readonly fileName:
    | 'sd_xl_base_1.0.safetensors'
    | 'diffusion_pytorch_model.fp16.safetensors'
    | 'sd_xl_offset_example-lora_1.0.safetensors'
    | 'ip-adapter_sdxl.safetensors'
    | 'model.safetensors'
  readonly byteLength:
    | 6_938_078_334
    | 320_237_179
    | 49_553_604
    | 702_585_376
    | 3_689_912_664
  readonly contentSha256: string
  readonly fixedContainerMountPath: string
}

export interface CanonicalComfyUiGpuRuntimeSourceFile {
  readonly relativePath: string
  readonly byteLength: number
  readonly contentSha256: string
  readonly executable: boolean
}

export interface CanonicalComfyUiGpuRuntimeContract {
  readonly contractVersion:
    typeof CANONICAL_COMFYUI_GPU_RUNTIME_CONTRACT_VERSION
  readonly contractClass:
    'source_verified_offline_selected_scene_comfyui_gpu_operation_candidate'
  readonly operationIdentity: {
    readonly requestedToolId: 'comfyui'
    readonly operationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly sharedWorkerType: 'gpu_ai_worker'
    readonly currentCatalogClass: 'non_e2e_capability'
    readonly registryMutationAuthorized: false
    readonly registryCountIsProductCap: false
    readonly representedGpuCapabilities: readonly [
      'comfyui',
      'comfyui_controlnet_aux',
      'controlnet',
      'ip_adapter',
      'peft_lora',
    ]
    readonly representedGpuCapabilitiesShareOneAttempt: true
    readonly auraFaceExcludedAsSeparateOptionalCpuQa: true
  }
  readonly internalQualificationImage: {
    readonly image:
      'reeditpro-living-frame-comfyui-locked-candidate:local'
    readonly imageSha256:
      '1de2c0415c477537dc4035a0550cec1859b8e5c5719647a64c0172962a770a64'
    readonly sanitizedSpdxDigestSha256:
      'dd7fd3bf99acf78a25bc61b0fb97b10e309b68fdb5c70c8581db3073c270bf5d'
    readonly packageCount: 761
    readonly platform: 'linux/amd64'
    readonly derivedNonRootUid: 65_532
    readonly derivedNonRootGid: 65_532
    readonly readOnlyRootRequired: true
    readonly allCapabilitiesDroppedRequired: true
    readonly noNewPrivilegesRequired: true
    readonly networkNoneRequired: true
    readonly exactSam2TopLevelImportDenied: true
    readonly sourceCandidateOnly: true
  }
  readonly privateLocalFiveModelMountEvidence: {
    readonly evidenceCommitSha:
      '03b8a562de899e5776b1b70366e328b4ece392e4'
    readonly evidenceTreeSha:
      '38604f5021f0c17901e1edccbb294b3de17bec4a'
    readonly orderedBundleDigestSha256:
      'cf63c0109667a2e8fe9ccca62680a4823c520f3980b262565243b7f3e6ce1c20'
    readonly modelArtifactCount: 5
    readonly aggregateByteLength: 11_700_367_157
    readonly simultaneousReadOnlyMountObserved: true
    readonly everyObjectRereadAndHashed: true
    readonly exactSetRequired: true
    readonly symlinksRejected: true
    readonly writeOpenRejected: true
    readonly fixedUid: 65_532
    readonly fixedGid: 65_532
    readonly networkNoneObserved: true
    readonly readOnlyRootObserved: true
    readonly allCapabilitiesDroppedObserved: true
    readonly noNewPrivilegesObserved: true
    readonly sam2ImportDenied: true
    readonly torchVersion: '2.5.1+cu124'
    readonly torchvisionVersion: '0.20.1+cu124'
    readonly cpuEmulationOnly: true
    readonly cudaAvailable: false
    readonly modelLoadClaimed: false
    readonly inferenceClaimed: false
    readonly canonicalArtifactIngestClaimed: false
    readonly distributedMountClaimed: false
    readonly productionQualified: false
  }
  readonly cloudRunGpuPolicy: {
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly minimumCpu: 4
    readonly minimumMemory: '16Gi'
    readonly noGpuZonalRedundancy: true
    readonly taskCount: 1
    readonly parallelism: 1
    readonly internalRetries: 0
    readonly admittedExistingRegion: 'europe-west1'
    readonly crossRegionTransferAllowed: false
  }
  readonly packageIdentity: {
    readonly pythonVersion: '3.10.12'
    readonly torchVersion: '2.5.1+cu124'
    readonly cudaBuild: '12.4'
    readonly wheelArtifactCount: 35
    readonly wheelArtifactTotalByteLength: 486_459_097
    readonly wheelManifestSha256:
      'cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9'
    readonly comfyUiSourceRevision:
      '093d571b83e7a79833200e199b46b9f5a62217f9'
    readonly comfyUiSourceArchiveSha256:
      'dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948'
    readonly ipAdapterSourceRevision:
      'b188a6cb39b512a9c6da7235b880af42c78ccd0d'
    readonly ipAdapterSourceArchiveSha256:
      '8565104c6a20e2e092bc895a72b8dcf588c0165f0de0f4f01dc0f735d2af50ec'
    readonly controlNetAuxSourceRevision:
      'e8b689a513c3e6b63edc44066560ca5919c0576e'
    readonly controlNetAuxSourceArchiveSha256:
      '6ab94365c94e7c4a02be19d1ad5921c5ac490c0539bd1b38fc0d1516225d9b4e'
    readonly inheritedDirectVcsSam2Revision:
      '2b90b9f5ceec907a1c18123530e92e794ad901a4'
    readonly inheritedDirectVcsSam2RuntimeUseAllowed: false
  }
  readonly fixedFileLayout: {
    readonly packageRoot:
      '/opt/reeditpro/gpu-operations/comfyui'
    readonly pythonPath:
      '/opt/reeditpro/gpu-operations/comfyui/venv/bin/python'
    readonly runnerPath:
      '/opt/reeditpro/gpu-operations/comfyui/runner.py'
    readonly sourceRoot:
      '/opt/reeditpro/gpu-operations/comfyui/source'
    readonly privateInputRoot:
      '/mnt/reeditpro/private-input'
    readonly privateOutputRoot:
      '/mnt/reeditpro/private-output'
    readonly modelFiles: readonly [
      CanonicalComfyUiGpuRuntimeModelFile,
      CanonicalComfyUiGpuRuntimeModelFile,
      CanonicalComfyUiGpuRuntimeModelFile,
      CanonicalComfyUiGpuRuntimeModelFile,
      CanonicalComfyUiGpuRuntimeModelFile,
    ]
    readonly totalModelByteLength: 11_700_367_157
    readonly callerPathsAccepted: false
    readonly callerUrlsAccepted: false
    readonly callerBytesAccepted: false
  }
  readonly runtimeProtocol: {
    readonly requestVersion:
      'canonical-comfyui-gpu-runtime-request-v1'
    readonly responseVersion:
      'canonical-comfyui-gpu-runtime-response-v1'
    readonly maximumRequestBytes: 1_048_576
    readonly maximumOutputBytes: 67_108_864
    readonly maximumDimension: 4_096
    readonly maximumPixelCount: 8_294_400
    readonly minimumDimension: 256
    readonly dimensionMultiple: 8
    readonly outputImageCount: 1
    readonly outputContentType: 'image/png'
    readonly outputEncodingProfile:
      'opaque_rgb_or_rgba_png_v1'
    readonly device: 'cuda'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly websocketOutputOnly: true
    readonly outputBytesReturnedInReceipt: false
  }
  readonly sourceFiles: readonly CanonicalComfyUiGpuRuntimeSourceFile[]
  readonly summary: {
    readonly exactOfflinePackageClosurePinned: true
    readonly exactFiveModelIdentitiesPinned: true
    readonly privateLocalExactFiveModelBytesObserved: true
    readonly privateLocalAtomicReadOnlyMountObserved: true
    readonly selectedSceneDimensionsSupported: true
    readonly fixedSupervisedProcessImplemented: true
    readonly exactSam2ImportDenialImplemented: true
    readonly cudaL4OnlyPreflightImplemented: true
    readonly cpuFallbackDisabled: true
    readonly runtimeDownloadsDisabled: true
    readonly opaqueSinglePngOutputImplemented: true
    readonly digestOnlyReceiptImplemented: true
    readonly semanticRegistryPolicyPreserved: true
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly sourceContractVerified: true
    readonly runnerSourceImplemented: true
    readonly localConfinementEvidenceConsumedAsInput: true
    readonly privateLocalExactModelBundleBytesVerified: true
    readonly privateLocalAtomicReadOnlyMountVerified: true
    readonly runtimeImageBuiltFromCurrentSource: false
    readonly runtimeImageScannedAndSigned: false
    readonly exactModelBundleIngested: false
    readonly exactModelBundleReadOnlyMountVerified: false
    readonly modelLicenseAndPaidUseApproved: false
    readonly cloudRunL4ContainerStarted: false
    readonly cloudRunL4CudaCompatibilityVerified: false
    readonly comfyUiInferenceVerified: false
    readonly outputArtifactCommitVerified: false
    readonly outputQaAndPrivateReviewVerified: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly customerCostAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly sourceDigestSha256: string
  readonly contractDigestSha256: string
}
