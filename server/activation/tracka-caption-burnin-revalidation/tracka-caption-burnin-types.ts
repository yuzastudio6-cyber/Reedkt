export type TrackaCaptionBurninExecutionStatus =
  | 'blocked_pending_caption_burnin_execution_confirmation'
  | 'blocked_missing_approved_private_source_ref'
  | 'blocked_missing_approved_caption_burnin_runtime_path'
  | 'blocked_approved_source_ref_access_failed'
  | 'blocked_approved_runtime_image_failed'
  | 'blocked_caption_burnin_runtime_failed'
  | 'blocked_ffprobe_validation_failed'
  | 'completed_with_corrected_caption_burnin_revalidation'

export interface TrackaCaptionBurninSourceAudit {
  status: 'passed' | 'blocked'
  sourceChainMerged: boolean
  sourcePrs: Array<{ pr: number; sha: string; summary: string }>
  approvedCaptionSourcePath: string
  executionPacketPath: string
  sourceRefPath: string
  runtimePathEvidencePath: string
  sourceRefApproved: boolean
  runtimePathApproved: boolean
  oldCaptionRejected: boolean
  activeBlockers: string[]
}

export interface TrackaCaptionBurninApprovedSourceRef {
  status: 'approved' | 'blocked'
  ref: string
  metadata: {
    size: string
    contentType: string
    generation: string
    metageneration: string
    storageClass: string
    updated: string
    crc32c: string
    md5: string
  }
  metadataEvidencePath: string
  sourceRefApproved: boolean
  activeBlockers: string[]
}

export interface TrackaCaptionBurninArtifact {
  created: boolean
  artifactType: string
  localPath?: string
  sha256?: string
  sizeBytes?: number
  blocker?: string
}

export interface TrackaCaptionBurninSidecarArtifact extends TrackaCaptionBurninArtifact {
  artifactType: 'ass_sidecar'
  lineCount: number
}

export interface TrackaCaptionBurninRuntimeResolution {
  approvedPrivateSourceRefFound: boolean
  approvedRuntimePathFound: boolean
  approvedRuntimePath: string
  runtimeSourceProvenance: string
  runtimeImageTag: string
  ffmpegPath: string
  ffprobePath: string
  assFilterPresent: boolean
  subtitlesFilterPresent: boolean
  libassIndicated: boolean
  dockerImageAvailable: boolean
  dockerImageBuildAttempted: boolean
  dockerImageBuildStatus: 'passed' | 'failed' | 'not_needed' | 'not_attempted'
  attemptedGcsAccess: boolean
  attemptedFfmpeg: boolean
  attemptedFfprobe: boolean
  attemptedRemotion: false
  blocker:
    | 'none'
    | 'blocked_missing_approved_private_source_ref'
    | 'blocked_missing_approved_caption_burnin_runtime_path'
    | 'blocked_approved_runtime_image_failed'
  rejectedCandidateReason: string
  evidencePaths: string[]
}

export interface TrackaCaptionBurninQaGate {
  gateId: string
  status: 'passed' | 'blocked'
  evidence: string
}

export interface TrackaCaptionBurninSummary {
  phase: 'TRACKA-CAPTION-QUALITY-3R3'
  runId: string
  execution: TrackaCaptionBurninExecutionStatus
  confirmationProvided: boolean
  sourceGcsReadConfirmationProvided: boolean
  approvedSourceRef: string
  sourceRefApproved: boolean
  approvedRuntimePath: string
  runtimePathApproved: boolean
  captionBurninRevalidationExecuted: boolean
  correctedCaptionVisualPreviewCreated: boolean
  assSidecarCreated: boolean
  approvedSourceCopied: boolean
  libassBurninExecuted: boolean
  remotionPreviewExecuted: boolean
  ffmpegValidationExecuted: boolean
  ffprobeValidationExecuted: boolean
  privateArtifactsCreated: boolean
  privateVisualArtifactsCreated: boolean
  gcsAccess: boolean
  gcsAccessMode: 'none' | 'exact_private_source_read_copy_only'
  signedUrlsCreated: boolean
  publicArtifactsCreated: boolean
  finalDeliveryReady: boolean
  internalBetaReady: boolean
  productionReady: boolean
  externalBetaReady: boolean
  trackaCaptionQuality4Readiness: string
  trackaPrivateE2eRevalidation1Readiness: string
  internalBetaReadiness: string
  activeBlockers: string[]
  noScopeStatement: string
}

export interface TrackaCaptionBurninBundle {
  runId: string
  localBundlePath: string
  sourceAudit: TrackaCaptionBurninSourceAudit
  approvedSourceRef: TrackaCaptionBurninApprovedSourceRef
  sourceArtifact: TrackaCaptionBurninArtifact
  sidecar: TrackaCaptionBurninSidecarArtifact
  previewArtifact: TrackaCaptionBurninArtifact
  qaReportArtifact: TrackaCaptionBurninArtifact
  artifactManifestArtifact: TrackaCaptionBurninArtifact
  ffprobeArtifact: TrackaCaptionBurninArtifact
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
  qaGates: TrackaCaptionBurninQaGate[]
  summary: TrackaCaptionBurninSummary
  report: Record<string, unknown>
}
