export const LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_VERSION =
  'living-frame-comfyui-hardened-runtime-host-evidence-v1' as const

export const LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_CLASS =
  'private_internal_sealed_ephemeral_runtime_closure_evidence' as const

export const LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_STATUS =
  'sealed_ephemeral_runtime_closure_verified' as const

export type LivingFrameComfyUiHardenedCacheRole =
  | 'core'
  | 'remediation'
  | 'transformers_closure'

export interface LivingFrameComfyUiHardenedCacheObservation {
  readonly role: LivingFrameComfyUiHardenedCacheRole
  readonly artifactCount: number
  readonly beforeSetDigestSha256: string
  readonly afterSetDigestSha256: string
  readonly hostReadOnlyModeVerified: true
  readonly containerReadOnlyMountVerified: true
  readonly beforeAfterRehashStable: true
  readonly pathSerialized: false
}

export interface LivingFrameComfyUiHardenedRuntimeVerifierObservation {
  readonly contract:
    'living-frame-comfyui-hardened-runtime-private-build-verifier-v1'
  readonly status: 'passed'
  readonly uid: 65532
  readonly gid: 65532
  readonly distributionCount: 33
  readonly torch: '2.6.0+cu124'
  readonly torchCudaBuild: '12.4'
  readonly torchvision: '0.21.0+cu124'
  readonly torchaudio: '2.6.0+cu124'
  readonly pillow: '12.3.0'
  readonly transformers: '5.5.0'
  readonly huggingfaceHub: '1.5.0'
  readonly sam2ImportDenied: true
  readonly modelWeightsLoaded: false
  readonly graphExecuted: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiHardenedRuntimeHostObservation {
  readonly sourceContractCommitSha:
    '31e1bca64f76fbde11050129d842eb3a2a90e479'
  readonly sourceContractTreeSha:
    'b450107244f85c3001eb43251fc87334655750d7'
  readonly evidenceRunnerCommitSha: string
  readonly evidenceRunnerTreeSha: string
  readonly sourceWorktreeClean: true
  readonly sourceContractFilesMatchFrozenCommit: true
  readonly frozenCommitIsRunnerAncestor: true
  readonly parentImageReference:
    'reeditpro-living-frame-comfyui-canonical-offline:private-internal-bffa1ec0'
  readonly parentImageDigest:
    'sha256:84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b'
  readonly platform: 'linux/amd64'
  readonly networkMode: 'none'
  readonly processLimit: 256
  readonly memoryLimit: '12g'
  readonly cpuLimit: '4'
  readonly noNewPrivileges: true
  readonly gpuAccessGranted: false
  readonly packageCacheBindings: readonly [
    LivingFrameComfyUiHardenedCacheObservation,
    LivingFrameComfyUiHardenedCacheObservation,
    LivingFrameComfyUiHardenedCacheObservation,
  ]
  readonly dockerAttemptCount: 1
  readonly disposableOverlayUsed: true
  readonly containerRemovedAfterRun: true
  readonly installerIdentity: 'ephemeral_overlay_root'
  readonly finalVerifierIdentity: 'non_root_65532'
  readonly installerCompleted: true
  readonly nonRootVerifierCompleted: true
  readonly verifierObservation:
    LivingFrameComfyUiHardenedRuntimeVerifierObservation
  readonly verifierOutputDigestSha256: string
  readonly packageRuntimeCompatibilityVerified: true
  readonly controlledGenerationRuntimeExecuted: false
  readonly modelWeightsMounted: false
  readonly sourceMediaMounted: false
  readonly promptMaterialMounted: false
  readonly credentialMaterialMounted: false
  readonly imageBuilt: false
  readonly imageScanned: false
  readonly gpuAttemptCreated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly assetCreated: false
  readonly actualCostReceiptCreated: false
  readonly customerChargeCreated: false
  readonly publicDeliveryCreated: false
  readonly productionReady: false
  readonly pathSerialized: false
  readonly bytePayloadSerialized: false
}

export interface LivingFrameComfyUiHardenedRuntimeHostEvidence {
  readonly contractVersion:
    typeof LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_CLASS
  readonly status:
    typeof LIVING_FRAME_COMFYUI_HARDENED_RUNTIME_HOST_EVIDENCE_STATUS
  readonly evidenceId: string
  readonly evidenceDigestSha256: string
  readonly observationDigestSha256: string
  readonly sourceContractCommitSha:
    LivingFrameComfyUiHardenedRuntimeHostObservation['sourceContractCommitSha']
  readonly sourceContractTreeSha:
    LivingFrameComfyUiHardenedRuntimeHostObservation['sourceContractTreeSha']
  readonly evidenceRunnerCommitSha: string
  readonly evidenceRunnerTreeSha: string
  readonly parentImageDigest:
    LivingFrameComfyUiHardenedRuntimeHostObservation['parentImageDigest']
  readonly packageArtifactCount: 33
  readonly packageCacheSetDigestsSha256: readonly [
    string,
    string,
    string,
  ]
  readonly cacheRehashStable: true
  readonly cacheHostReadOnlyModeVerified: true
  readonly cacheContainerReadOnlyMountVerified: true
  readonly packageRuntimeCompatibilityVerified: true
  readonly nonRootRuntimeIdentityVerified: true
  readonly canonicalRunnerLineageVerified: true
  readonly sam2ImportDenied: true
  readonly networkDenied: true
  readonly gpuAccessGranted: false
  readonly containerRemovedAfterRun: true
  readonly ephemeralInstallerRootOnly: true
  readonly finalVerifierNonRoot: true
  readonly imageBuilt: false
  readonly imageScanned: false
  readonly controlledGenerationRuntimeExecuted: false
  readonly modelWeightsMounted: false
  readonly gpuAttemptCreated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly assetCreated: false
  readonly actualCostReceiptCreated: false
  readonly customerChargeCreated: false
  readonly publicDeliveryCreated: false
  readonly productionReady: false
  readonly pathSerialized: false
  readonly bytePayloadSerialized: false
}
