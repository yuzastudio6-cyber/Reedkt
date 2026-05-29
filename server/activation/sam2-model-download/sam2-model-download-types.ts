export type Sam2ModelDownloadStatus = 'not_started' | 'planned' | 'downloaded' | 'uploaded' | 'verified' | 'blocked' | 'failed'

export interface Sam2ModelDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  region?: string
  env?: string
  confirmation?: string
  bucketName?: string
  targetPrefix?: string
  checkpointSourceUrl?: string
  configSourceUrl?: string
  localTempDir?: string
  providerExecutionEnabled?: string
}

export interface Sam2ModelDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface Sam2SourceEvidence {
  collectedAt: string
  sourceRepo: 'facebookresearch/sam2'
  sourceRepoUrl: string
  checkpointSourceUrl: string
  configSourceUrl: string
  licenseName: 'Apache-2.0'
  licenseEvidenceSummary: string
  modelCardOrReadmeEvidenceSummary: string
  sourceUrls: string[]
  codexLicenseDecision: 'staging_download_approved_by_codex'
  humanLicenseApprovalRequired: false
  blockers: string[]
  warnings: string[]
}

export interface Sam2DownloadExecutionCommandPlan {
  commandId: string
  phase: 'preflight' | 'source_evidence' | 'download' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  commandString: string
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface Sam2ChecksumEntry {
  relativePath: string
  sha256: string
  sizeBytes: number
}

export interface Sam2ModelTreeManifest {
  phase: '35B'
  modelFamily: 'SAM2 / Segment Anything Model 2'
  modelId: 'sam2.1_hiera_tiny'
  checkpointFileName: 'sam2.1_hiera_tiny.pt'
  configFileName: 'sam2.1_hiera_t.yaml'
  checkpointSourceUrl: string
  configSourceUrl: string
  licenseName: 'Apache-2.0'
  fileSha256: Record<string, string>
  aggregateSha256: string
  fileSizes: Record<string, number>
  createdAt: string
  targetGcsPath: string
  downloadAllowedInPhase35B: true
  runtimeAllowed: false
  temporalTrackingAllowed: false
  fullVideoMaskAllowed: false
  fullVideoTextBehindSubjectAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface Sam2UploadedObjectEvidence {
  gcsUri: string
  sizeBytes: number
  contentType?: string
  generation?: string
  metageneration?: string
  crc32c?: string
  md5Hash?: string
  updated?: string
}

export interface ApprovedSam2ModelDownloadEvidence {
  phase: '35B'
  modelFamily: 'SAM2 / Segment Anything Model 2'
  modelId: 'sam2.1_hiera_tiny'
  checkpointFileName: 'sam2.1_hiera_tiny.pt'
  configFileName: 'sam2.1_hiera_t.yaml'
  status: Sam2ModelDownloadStatus
  checkpointSourceUrl: string
  configSourceUrl: string
  licenseName: 'Apache-2.0'
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'not_started'
  humanLicenseApprovalRequired: boolean
  targetGcsPath: string
  checkpointSha256?: string
  configSha256?: string
  aggregateSha256?: string
  checkpointSizeBytes?: number
  configSizeBytes?: number
  fileCount?: number
  uploadedObjectCount?: number
  downloadedAt?: string
  uploadedAt?: string
  verifiedAt?: string
  gcsManifestPath?: string
  gcsChecksumPath?: string
  gcsSourceEvidencePath?: string
  sanitizedLocalTempPath?: string
  uploadedObjects: Sam2UploadedObjectEvidence[]
  iamChanges: string[]
  blockers: string[]
  warnings: string[]
}

export interface Sam2ModelDownloadReport {
  reportId: 'activation-phase-35b-sam2-model-download'
  createdAt: string
  downloadEvidence: ApprovedSam2ModelDownloadEvidence
  sourceEvidence: Sam2SourceEvidence
  executionCommandPlans: Sam2DownloadExecutionCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase35CReadiness: {
    readyForGeneratedSyntheticRuntimeVerification: boolean
    readyForRuntimeExecution: false
    reason: string
  }
  notReadyFor: string[]
  sam2DownloadCompleted: boolean
  sam2RuntimeAllowed: false
  sam2TemporalTrackingAllowed: false
  sam2FullVideoMaskAllowed: false
  fullVideoTextBehindSubjectAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}

export interface Sam2DownloadExecutionResult {
  evidence: ApprovedSam2ModelDownloadEvidence
  sourceEvidence: Sam2SourceEvidence
  localArtifacts: {
    tempDir: string
    checksumManifestPath: string
    modelTreeManifestPath: string
    sourceEvidencePath: string
  }
}
