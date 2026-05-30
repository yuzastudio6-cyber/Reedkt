export type DeepFilterNetArtifactKind = 'linux_x86_64_cli_binary' | 'deepfilternet3_onnx_model_archive'
export type DeepFilterNetDownloadStatus = 'not_started' | 'planned' | 'downloaded' | 'uploaded' | 'verified' | 'blocked' | 'failed'

export interface DeepFilterNetDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  region?: string
  env?: string
  confirmation?: string
  bucketName?: string
  targetPrefix?: string
  artifactUrls?: string[]
  localTempDir?: string
  providerExecutionEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
}

export interface DeepFilterNetDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetSelectedArtifact {
  artifactId: string
  fileName: string
  kind: DeepFilterNetArtifactKind
  sourceUrl: string
  sourceKind: 'github_release_asset' | 'github_raw_repo_model'
  reason: string
}

export interface DeepFilterNetSourceEvidence {
  collectedAt: string
  sourceRepo: 'Rikorose/DeepFilterNet'
  sourceRepoUrl: string
  releaseTag: 'v0.5.6'
  releaseUrl: string
  readmeUrl: string
  selectedArtifacts: DeepFilterNetSelectedArtifact[]
  releaseAssetNames: string[]
  repoModelPaths: string[]
  releaseEvidenceSummary: string
  modelEvidenceSummary: string
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetLicenseEvidence {
  collectedAt: string
  licenseName: 'MIT OR Apache-2.0'
  licenseUrls: string[]
  cargoLicenseEvidence: string
  readmeEvidenceSummary: string
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'not_started' | 'blocked'
  humanLicenseApprovalRequired: boolean
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetDownloadExecutionCommandPlan {
  commandId: string
  phase: 'preflight' | 'source_evidence' | 'download' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  commandString: string
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface DeepFilterNetChecksumEntry {
  relativePath: string
  sha256: string
  sizeBytes: number
}

export interface DeepFilterNetModelTreeManifest {
  phase: '36B'
  toolFamily: 'audio_ai'
  toolId: 'deepfilternet'
  selectedVersion: 'v0.5.6'
  sourceRepo: 'Rikorose/DeepFilterNet'
  selectedArtifacts: DeepFilterNetSelectedArtifact[]
  licenseName: 'MIT OR Apache-2.0'
  fileSha256: Record<string, string>
  aggregateSha256: string
  fileSizes: Record<string, number>
  createdAt: string
  targetGcsPath: string
  downloadAllowedInPhase36B: true
  runtimeAllowed: false
  audioProcessingAllowed: false
  realVideoAudioAiCleanupAllowed: false
  rnnoiseDownloadAllowed: false
  demucsDownloadAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
}

export interface DeepFilterNetUploadedObjectEvidence {
  gcsUri: string
  sizeBytes: number
  contentType?: string
  generation?: string
  metageneration?: string
  crc32c?: string
  md5Hash?: string
  updated?: string
}

export interface ApprovedDeepFilterNetDownloadEvidence {
  phase: '36B'
  toolFamily: 'audio_ai'
  toolId: 'deepfilternet'
  selectedVersion: 'v0.5.6'
  status: DeepFilterNetDownloadStatus
  selectedArtifacts: DeepFilterNetSelectedArtifact[]
  licenseName: 'MIT OR Apache-2.0'
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'not_started' | 'blocked'
  humanLicenseApprovalRequired: boolean
  targetGcsPath: string
  cliSha256?: string
  modelArchiveSha256?: string
  aggregateSha256?: string
  cliSizeBytes?: number
  modelArchiveSizeBytes?: number
  fileCount?: number
  uploadedObjectCount?: number
  downloadedAt?: string
  uploadedAt?: string
  verifiedAt?: string
  gcsManifestPath?: string
  gcsChecksumPath?: string
  gcsSourceEvidencePath?: string
  gcsLicenseEvidencePath?: string
  gcsDownloadReportPath?: string
  sanitizedLocalTempPath?: string
  uploadedObjects: DeepFilterNetUploadedObjectEvidence[]
  iamChanges: string[]
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetDownloadReport {
  reportId: 'activation-phase-36b-deepfilternet-download'
  createdAt: string
  downloadEvidence: ApprovedDeepFilterNetDownloadEvidence
  sourceEvidence: DeepFilterNetSourceEvidence
  licenseEvidence: DeepFilterNetLicenseEvidence
  executionCommandPlans: DeepFilterNetDownloadExecutionCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase36CReadiness: {
    readyForGeneratedAudioRuntimeVerification: boolean
    readyForRuntimeExecution: false
    reason: string
  }
  notReadyFor: string[]
  deepFilterNetDownloadCompleted: boolean
  deepFilterNetRuntimeAllowed: false
  audioProcessingAllowed: false
  realVideoAudioAiCleanupAllowed: false
  rnnoiseDownloadAllowed: false
  rnnoiseRuntimeAllowed: false
  demucsDownloadAllowed: false
  demucsRuntimeAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
}

export interface DeepFilterNetDownloadExecutionResult {
  evidence: ApprovedDeepFilterNetDownloadEvidence
  sourceEvidence: DeepFilterNetSourceEvidence
  licenseEvidence: DeepFilterNetLicenseEvidence
  localArtifacts: {
    tempDir: string
    checksumManifestPath: string
    modelTreeManifestPath: string
    sourceEvidencePath: string
    licenseEvidencePath: string
    downloadReportPath: string
  }
}
