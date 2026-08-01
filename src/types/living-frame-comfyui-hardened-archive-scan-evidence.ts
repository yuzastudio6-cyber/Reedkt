export const LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_VERSION =
  'living-frame-comfyui-hardened-archive-scan-evidence-v1' as const

export const LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_STATUS =
  'archive_input_verified_scan_incomplete' as const

export const LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_OPEN_GATES = [
  'reproducible_source_bound_oci_build_required',
  'complete_linux_fast_local_storage_scan_required',
  'license_vcs_signature_and_provenance_disposition_required',
  'canonical_private_image_ingest_required',
  'real_l4_five_model_graph_regression_required',
] as const

export interface LivingFrameComfyUiHardenedArchiveScanObservation {
  readonly observedAt: '2026-07-30'
  readonly sourceEvidenceCommitSha:
    '3b6ce879da055dd7d8ea09ec0bf2914327ea0da3'
  readonly image: {
    readonly digestSha256:
      'd4aa31e9f99d5e66db666484a7ba203b3119d970846523933a27d3a1280657bd'
    readonly byteLength: 12657282187
    readonly operatingSystem: 'linux'
    readonly architecture: 'amd64'
    readonly sanitizedLocalDerivative: true
  }
  readonly archive: {
    readonly format: 'docker_save_tar'
    readonly digestSha256:
      'bc37a857b7c962df846d4f61874feb6f100b5a1f4bdf7e53798c95bec509fe06'
    readonly byteLength: 12657311744
    readonly sourceImageDigestRevalidated: true
    readonly sourceImageReferenceMatched: true
    readonly privateTemporaryArtifact: true
  }
  readonly scan: {
    readonly scanner: 'docker_scout'
    readonly scannerVersion: '1.20.4'
    readonly inputScheme: 'archive'
    readonly requestedPlatform: 'linux/amd64'
    readonly boundedSeconds: 1200
    readonly archiveReadStarted: true
    readonly scratchRedirectedToPrivateBackupVolume: true
    readonly scratchWorkspaceObservedNonEmpty: true
    readonly reportCreated: false
    readonly fullImageScanCompleted: false
    readonly terminatedAtBound: true
    readonly exitCode: 255
    readonly failureCode:
      'private_external_volume_archive_indexing_timeout_no_report'
    readonly vulnerabilityClearanceGranted: false
  }
  readonly cleanup: {
    readonly scannerProcessStopped: true
    readonly scoutTemporaryDataPruned: true
    readonly archiveDeleted: true
    readonly temporaryRootDeleted: true
    readonly backupCapacityRestored: true
    readonly sanitizedDockerImageRetained: true
  }
  readonly authority: {
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
  }
  readonly pathSerialized: false
  readonly bytePayloadSerialized: false
}

export interface LivingFrameComfyUiHardenedArchiveScanEvidence {
  readonly contractVersion:
    typeof LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_VERSION
  readonly status:
    typeof LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_EVIDENCE_STATUS
  readonly evidenceId: string
  readonly evidenceDigestSha256: string
  readonly observationDigestSha256: string
  readonly imageDigestSha256: string
  readonly archiveDigestSha256: string
  readonly archiveByteLength: 12657311744
  readonly archiveInputVerified: true
  readonly fullImageScanCompleted: false
  readonly vulnerabilityClearanceGranted: false
  readonly archiveAndScratchDeleted: true
  readonly sanitizedDockerImageRetained: true
  readonly releaseDisposition:
    'blocked_linux_fast_local_storage_scan_required'
  readonly openGateCodes:
    typeof LIVING_FRAME_COMFYUI_HARDENED_ARCHIVE_SCAN_OPEN_GATES
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
