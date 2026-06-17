export type TrackaCaptionBurninExecutionStatus =
  | 'blocked_pending_caption_burnin_execution_confirmation'
  | 'blocked_missing_approved_private_source_ref'
  | 'blocked_missing_approved_caption_burnin_runtime_path'
  | 'blocked_caption_burnin_runtime_failed'
  | 'completed_with_guarded_caption_burnin_revalidation'

export interface TrackaCaptionBurninSourceAudit {
  status: 'passed' | 'blocked'
  sourceChainMerged: boolean
  sourcePrs: Array<{ pr: number; sha: string; summary: string }>
  approvedCaptionSourcePath: string
  executionPacketPath: string
  oldCaptionRejected: boolean
  activeBlockers: string[]
}

export interface TrackaCaptionBurninSidecarArtifact {
  created: boolean
  localPath?: string
  sha256?: string
  sizeBytes?: number
  lineCount: number
}

export interface TrackaCaptionBurninRuntimeResolution {
  approvedPrivateSourceRefFound: boolean
  approvedRuntimePathFound: boolean
  attemptedGcsAccess: false
  attemptedFfmpeg: false
  attemptedFfprobe: false
  attemptedRemotion: false
  blocker: 'blocked_missing_approved_private_source_ref' | 'blocked_missing_approved_caption_burnin_runtime_path'
  rejectedCandidateReason: string
  evidencePaths: string[]
}

export interface TrackaCaptionBurninQaGate {
  gateId: string
  status: 'passed' | 'blocked'
  evidence: string
}

export interface TrackaCaptionBurninSummary {
  phase: 'TRACKA-CAPTION-QUALITY-3R'
  runId: string
  execution: TrackaCaptionBurninExecutionStatus
  confirmationProvided: boolean
  captionBurninRevalidationExecuted: boolean
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
  sidecar: TrackaCaptionBurninSidecarArtifact
  runtimeResolution: TrackaCaptionBurninRuntimeResolution
  qaGates: TrackaCaptionBurninQaGate[]
  summary: TrackaCaptionBurninSummary
  report: Record<string, unknown>
}
