export type TrackaCaptionBurninExecutionStatus =
  | 'blocked_pending_caption_burnin_execution_confirmation'
  | 'blocked_missing_approved_private_source_ref'
  | 'blocked_missing_approved_caption_burnin_runtime_path'
  | 'blocked_approved_source_ref_access_failed'
  | 'blocked_caption_burnin_runtime_failed'
  | 'completed_with_corrected_caption_burnin_revalidation'

export interface TrackaCaptionBurninSourceAudit {
  status: 'passed' | 'blocked'
  sourceChainMerged: boolean
  sourcePrs: Array<{ pr: number; sha: string; summary: string }>
  approvedCaptionSourcePath: string
  executionPacketPath: string
  sourceRefPath: string
  sourceRefApproved: boolean
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
}

export interface TrackaCaptionBurninSidecarArtifact extends TrackaCaptionBurninArtifact {
  artifactType: 'ass_sidecar'
  lineCount: number
}

export interface TrackaCaptionBurninRuntimeResolution {
  approvedPrivateSourceRefFound: boolean
  approvedRuntimePathFound: boolean
  localFfmpegPath: string
  localFfprobePath: string
  attemptedGcsAccess: false
  attemptedFfmpeg: false
  attemptedFfprobe: false
  attemptedRemotion: false
  blocker: 'none' | 'blocked_missing_approved_private_source_ref' | 'blocked_missing_approved_caption_burnin_runtime_path'
  rejectedCandidateReason: string
  evidencePaths: string[]
}

export interface TrackaCaptionBurninQaGate {
  gateId: string
  status: 'passed' | 'blocked'
  evidence: string
}

export interface TrackaCaptionBurninSummary {
  phase: 'TRACKA-CAPTION-QUALITY-3R2'
  runId: string
  execution: TrackaCaptionBurninExecutionStatus
  confirmationProvided: boolean
  approvedSourceRef: string
  sourceRefApproved: boolean
  captionBurninRevalidationExecuted: boolean
  correctedCaptionVisualPreviewCreated: boolean
  assSidecarCreated: boolean
  libassBurninExecuted: boolean
  remotionPreviewExecuted: boolean
  ffmpegValidationExecuted: boolean
  ffprobeValidationExecuted: boolean
  privateArtifactsCreated: boolean
  privateVisualArtifactsCreated: boolean
  gcsAccess: boolean
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
  sidecar: TrackaCaptionBurninSidecarArtifact
  qaReportArtifact: TrackaCaptionBurninArtifact
  artifactManifestArtifact: TrackaCaptionBurninArtifact
  ffprobeArtifact: TrackaCaptionBurninArtifact
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
  qaGates: TrackaCaptionBurninQaGate[]
  summary: TrackaCaptionBurninSummary
  report: Record<string, unknown>
}
