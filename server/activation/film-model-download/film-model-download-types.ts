export type FilmModelDownloadStatus = 'not_started' | 'planned' | 'downloaded' | 'uploaded' | 'verified' | 'blocked' | 'failed'

export interface FilmModelDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  region?: string
  env?: string
  confirmation?: string
  bucketName?: string
  targetPrefix?: string
  sourceRepoUrl?: string
  checkpointSourceUrl?: string
  selectedArtifactRoot?: string
  localTempDir?: string
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
}

export interface FilmModelDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface FilmDriveEntry {
  id: string
  name: string
  kind: 'folder' | 'file'
  sourceFolderId: string
}

export interface FilmResolvedDriveTree {
  rootFolderId: string
  filmNetFolderId: string
  styleFolderId: string
  savedModelFolderId: string
  assetsFolderId: string
  variablesFolderId: string
  files: FilmDriveFile[]
  rejectedSiblingFolders: string[]
  resolvedAt: string
}

export interface FilmDriveFile {
  fileId: string
  fileName: string
  relativePath: string
  sourceUrl: string
}

export interface FilmSourceEvidence {
  collectedAt: string
  sourceRepo: 'google-research/frame-interpolation'
  sourceRepoUrl: string
  projectPageUrl: string
  readmeUrl: string
  licenseUrl: string
  checkpointSourceUrl: string
  selectedArtifactRoot: 'film_net/Style/saved_model'
  licenseName: 'Apache-2.0'
  licenseEvidenceSummary: string
  readmeEvidenceSummary: string
  driveEvidenceSummary: string
  sourceUrls: string[]
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'blocked'
  humanLicenseApprovalRequired: false
  blockers: string[]
  warnings: string[]
  resolvedDriveTree?: FilmResolvedDriveTree
}

export interface FilmLicenseEvidence {
  collectedAt: string
  licenseName: 'Apache-2.0'
  officialLicenseUrl: string
  sourceRepoUrl: string
  checkpointSourceUrl: string
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'blocked'
  humanLicenseApprovalRequired: false
  summary: string
  blockers: string[]
  warnings: string[]
}

export interface FilmModelDownloadCommandPlan {
  commandId: string
  phase: 'preflight' | 'source_evidence' | 'download' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  commandString: string
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface FilmChecksumEntry {
  relativePath: string
  sha256: string
  sizeBytes: number
}

export interface FilmModelTreeManifest {
  phase: '38B'
  track: 'A visual/video'
  toolFamily: 'FILM / frame interpolation / slow motion'
  modelId: 'film_net_style_saved_model'
  selectedArtifactRoot: 'film_net/Style/saved_model'
  checkpointSourceUrl: string
  sourceRepoUrl: string
  projectPageUrl: string
  licenseName: 'Apache-2.0'
  fileSha256: Record<string, string>
  aggregateSha256: string
  fileSizes: Record<string, number>
  fileCount: number
  createdAt: string
  targetGcsPath: string
  downloadAllowedInPhase38B: true
  filmRuntimeAllowed: false
  slowMotionAllowed: false
  realVideoSlowMotionAllowed: false
  fullVideoInterpolationAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface FilmUploadedObjectEvidence {
  gcsUri: string
  sizeBytes: number
  contentType?: string
  generation?: string
  metageneration?: string
  crc32c?: string
  md5Hash?: string
  updated?: string
}

export interface ApprovedFilmModelDownloadEvidence {
  phase: '38B'
  track: 'A visual/video'
  toolFamily: 'FILM / frame interpolation / slow motion'
  modelId: 'film_net_style_saved_model'
  selectedArtifactRoot: 'film_net/Style/saved_model'
  status: FilmModelDownloadStatus
  sourceRepoUrl: string
  projectPageUrl: string
  checkpointSourceUrl: string
  licenseName: 'Apache-2.0'
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'not_started' | 'blocked'
  humanLicenseApprovalRequired: boolean
  targetGcsPath: string
  aggregateSha256?: string
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
  fileChecksums: FilmChecksumEntry[]
  uploadedObjects: FilmUploadedObjectEvidence[]
  iamChanges: string[]
  blockers: string[]
  warnings: string[]
}

export interface FilmModelDownloadReport {
  reportId: 'activation-phase-38b-film-model-download'
  createdAt: string
  downloadEvidence: ApprovedFilmModelDownloadEvidence
  sourceEvidence: FilmSourceEvidence
  licenseEvidence: FilmLicenseEvidence
  executionCommandPlans: FilmModelDownloadCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase38CReadiness: {
    readyForGeneratedFrameRuntimeVerification: boolean
    readyForRuntimeExecution: false
    reason: string
  }
  notReadyFor: string[]
  filmDownloadCompleted: boolean
  filmRuntimeAllowed: false
  slowMotionAllowed: false
  realVideoSlowMotionAllowed: false
  fullVideoInterpolationAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}

export interface FilmDownloadExecutionResult {
  evidence: ApprovedFilmModelDownloadEvidence
  sourceEvidence: FilmSourceEvidence
  licenseEvidence: FilmLicenseEvidence
  localArtifacts: {
    tempDir: string
    artifactRootDir: string
    checksumManifestPath: string
    modelTreeManifestPath: string
    sourceEvidencePath: string
    licenseEvidencePath: string
    downloadReportPath: string
  }
}
