export const LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_VERSION =
  'living-frame-comfyui-hardened-local-image-evidence-v1' as const

export const LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_CLASS =
  'private_internal_local_hardened_derivative_evidence' as const

export const LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_STATUS =
  'local_hardened_derivative_verified_scan_incomplete' as const

export const LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_OPEN_GATES = [
  'reproducible_source_bound_oci_build_required',
  'complete_linux_host_sbom_and_vulnerability_scan_required',
  'license_vcs_signature_and_provenance_disposition_required',
  'canonical_private_image_ingest_required',
  'real_l4_five_model_graph_regression_required',
] as const

export interface LivingFrameComfyUiHardenedLocalImageObservation {
  readonly observedAt: '2026-07-30'
  readonly source: {
    readonly closureCommitSha:
      '31e1bca64f76fbde11050129d842eb3a2a90e479'
    readonly closureTreeSha:
      'b450107244f85c3001eb43251fc87334655750d7'
    readonly hostEvidenceCommitSha:
      '897d22d83236b5bbca1a0a19efc6ee304b762aa6'
    readonly hostEvidenceDigestSha256:
      '285d63bb14ad0ed3545d98c7f6d7488f923db45fed2aa7b47261de6f8ac22155'
    readonly parentImageDigestSha256:
      '84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b'
  }
  readonly image: {
    readonly localReference:
      'reeditpro-living-frame-comfyui-hardened:private-internal-closure-31e1bca6-sanitized'
    readonly digestSha256:
      'd4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd'
    readonly byteLength: 12657282187
    readonly operatingSystem: 'linux'
    readonly architecture: 'amd64'
    readonly defaultUid: 65532
    readonly defaultGid: 65532
    readonly canonicalRunnerEntrypointMatched: true
    readonly packageArtifactCount: 33
    readonly modelWeightsBakedIntoImage: false
    readonly localImageOnly: true
  }
  readonly materialization: {
    readonly method:
      'sealed_container_overlay_commit_then_metadata_sanitize'
    readonly exactParentDigestRevalidated: true
    readonly exactClosureRevalidated: true
    readonly networkDisabled: true
    readonly packageInputsReadOnly: true
    readonly rootLimitedToDisposableOverlay: true
    readonly finalVerifierUid: 65532
    readonly finalVerifierGid: 65532
    readonly unsafeIntermediateHostPathLeakDetected: true
    readonly unsafeIntermediateDigestSha256:
      'f23caf6ab721156005ac7096d88ff5d12a30fe92e46adff871c0300d553d48a3'
    readonly unsafeIntermediateTagRemoved: true
    readonly unsafeIntermediateImageDeleted: true
    readonly temporaryContainersRemoved: true
    readonly sanitizedImageConfigHostPathAbsent: true
    readonly sanitizedImageHistoryHostPathAbsent: true
    readonly reproducibleOciBuildCompleted: false
    readonly buildProvenanceCreated: false
  }
  readonly strictVerification: {
    readonly rootFilesystemReadOnly: true
    readonly tmpfsPath: '/tmp'
    readonly tmpfsByteLimit: 268435456
    readonly tmpfsNoExec: true
    readonly allCapabilitiesDropped: true
    readonly noNewPrivileges: true
    readonly networkDisabled: true
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
    readonly canonicalRunnerLineageVerified: true
    readonly sam2ImportDenied: true
    readonly modelWeightsLoaded: false
    readonly graphExecuted: false
  }
  readonly scan: {
    readonly scanner: 'docker_scout'
    readonly scannerVersion: '1.20.4'
    readonly fullImageAttempted: true
    readonly fullImageCompleted: false
    readonly boundedSeconds: 1200
    readonly scratchRedirectedToPrivateBackupVolume: true
    readonly failureCode:
      'external_volume_indexing_timeout_no_report'
    readonly reportCreated: false
    readonly incompleteTemporaryDataCleaned: true
    readonly vulnerabilityClearanceGranted: false
  }
  readonly runtime: {
    readonly modelWeightsMounted: false
    readonly controlledGenerationExecuted: false
    readonly gpuAttemptCreated: false
  }
  readonly authority: {
    readonly canonicalImageIngested: false
    readonly operationRegistered: false
    readonly dispatchGranted: false
    readonly assetCreated: false
    readonly actualCostReceiptCreated: false
    readonly customerChargeCreated: false
    readonly publicDeliveryCreated: false
    readonly productionReady: false
  }
  readonly pathSerialized: false
  readonly bytePayloadSerialized: false
}

export interface LivingFrameComfyUiHardenedLocalImageEvidence {
  readonly contractVersion:
    typeof LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_CLASS
  readonly status:
    typeof LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_EVIDENCE_STATUS
  readonly evidenceId: string
  readonly evidenceDigestSha256: string
  readonly observationDigestSha256: string
  readonly imageDigestSha256: string
  readonly imageByteLength: 12657282187
  readonly packageArtifactCount: 33
  readonly strictNonRootVerificationPassed: true
  readonly sanitizedImageHostPathAbsent: true
  readonly unsafeIntermediateRemoved: true
  readonly reproducibleOciBuildCompleted: false
  readonly fullImageScanCompleted: false
  readonly vulnerabilityClearanceGranted: false
  readonly releaseDisposition:
    'blocked_reproducible_build_and_complete_scan_required'
  readonly openGateCodes:
    typeof LIVING_FRAME_COMFYUI_HARDENED_LOCAL_IMAGE_OPEN_GATES
  readonly modelWeightsMounted: false
  readonly controlledGenerationExecuted: false
  readonly gpuAttemptCreated: false
  readonly canonicalImageIngested: false
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
