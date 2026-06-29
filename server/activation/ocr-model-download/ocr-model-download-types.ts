export type OcrModelDownloadStatus = 'not_started' | 'planned' | 'downloaded' | 'uploaded' | 'verified' | 'blocked' | 'failed'
export type OcrModelDownloadReportStatus = 'asset_selection_approved_download_pending' | 'download_verified' | 'blocked'
export type OcrModelAssetRole = 'text_detection' | 'text_recognition' | 'recognition_dictionary' | 'textline_orientation_classifier'
export type OcrModelAssetSelectionStatus = 'selected_for_phase37b_safe_zone_v1' | 'optional_deferred'
export type OcrModelAssetSourceKind = 'official_paddlex_inference_model' | 'official_paddleocr_dictionary'
export type OcrChecksumStatus = 'pending_until_download' | 'computed'

export interface OcrModelDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  region?: string
  env?: string
  downloadConfirmation?: string
  privateGcsUploadConfirmation?: string
  bucketName?: string
  targetPrefix?: string
  assetUrls?: string[]
  localTempDir?: string
  providerExecutionEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
  betaReady?: string
}

export interface OcrModelDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface OcrModelAssetRecord {
  assetId: string
  fileName: string
  role: OcrModelAssetRole
  selectionStatus: OcrModelAssetSelectionStatus
  modelFamily: 'PP-OCRv5'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  sourceUrl: string
  sourceKind: OcrModelAssetSourceKind
  localRelativePath: string
  gcsRelativePath: string
  requiredForSafeZoneV1: boolean
  runtimeAutoDownloadBlocked: true
  reason: string
}

export interface OcrAssetSelectionManifest {
  phase: '37B'
  manifestId: 'paddleocr_ppocrv5_exact_assets_paddle3_mobile_safe_zone_v1'
  selectedAt: string
  selectedBy: 'codex_phase37b_static_registry'
  modelFamily: 'PP-OCRv5'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  targetGcsPath: string
  selectedAssets: OcrModelAssetRecord[]
  optionalDeferredAssets: OcrModelAssetRecord[]
  safeZoneRuntimeProfile: {
    use_doc_orientation_classify: false
    use_doc_unwarping: false
    use_textline_orientation: false
    blockTextlineOrientationAutoDownload: true
  }
  exactAssetSelectionApproved: true
  downloadExecuted: boolean
  privateGcsUploadVerified: boolean
  blockers: string[]
  warnings: string[]
}

export interface OcrModelSourceEvidence {
  collectedAt: string
  sourceRepo: 'PaddlePaddle/PaddleOCR'
  sourceRepoUrl: string
  docsUrl: string
  dictionarySourceUrl: string
  modelHostBaseUrl: string
  selectedAssets: OcrModelAssetRecord[]
  optionalDeferredAssets: OcrModelAssetRecord[]
  docsEvidenceSummary: string
  modelSourceEvidenceSummary: string
  dictionaryEvidenceSummary: string
  sourceUrls: string[]
  blockers: string[]
  warnings: string[]
}

export interface OcrModelLicenseEvidence {
  collectedAt: string
  licenseName: 'Apache-2.0'
  sourceRepoUrl: string
  licenseUrls: string[]
  repoLicenseEvidenceSummary: string
  modelAssetEvidenceSummary: string
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'blocked'
  humanLicenseApprovalRequired: false
  productionLegalApprovalComplete: false
  blockers: string[]
  warnings: string[]
}

export interface OcrModelDownloadExecutionCommandPlan {
  commandId: string
  phase: 'preflight' | 'source_evidence' | 'download' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  commandString: string
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD' | 'REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface OcrChecksumEntry {
  relativePath: string
  sha256?: string
  sizeBytes?: number
  checksumStatus: OcrChecksumStatus
}

export interface OcrChecksumManifest {
  phase: '37B'
  manifestId: 'paddleocr_ppocrv5_checksum_manifest_v1'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  generatedAt: string
  status: OcrChecksumStatus
  entries: OcrChecksumEntry[]
  aggregateSha256?: string
  blockers: string[]
  warnings: string[]
}

export interface OcrModelTreeManifest {
  phase: '37B'
  manifestId: 'paddleocr_ppocrv5_model_tree_manifest_v1'
  modelFamily: 'PP-OCRv5'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  selectedAssets: OcrModelAssetRecord[]
  optionalDeferredAssets: OcrModelAssetRecord[]
  licenseName: 'Apache-2.0'
  fileSha256: Record<string, string>
  fileSizes: Record<string, number | null>
  aggregateSha256: string
  createdAt: string
  targetGcsPath: string
  localTempPath: string
  downloadAllowedInPhase37B: true
  privateGcsUploadAllowedInPhase37B: true
  runtimeAutoDownloadAllowed: false
  textlineOrientationAutoDownloadAllowed: false
  ocrRuntimeAllowed: false
  ocrInferenceAllowed: false
  realMediaOcrAllowed: false
  realVideoOcrAllowed: false
  captionRenderIntegrationAllowed: false
  publicOutputAllowed: false
  signedUrlSourceOfTruthAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
}

export interface OcrUploadedObjectEvidence {
  gcsUri: string
  sizeBytes: number
  contentType?: string
  generation?: string
  metageneration?: string
  crc32c?: string
  md5Hash?: string
  updated?: string
}

export interface OcrPrivateGcsUploadReport {
  phase: '37B'
  reportId: 'paddleocr_ppocrv5_private_gcs_upload_report_v1'
  createdAt: string
  targetGcsPath: string
  privateStorageRequired: true
  publicAccessAllowed: false
  signedUrlSourceOfTruthAllowed: false
  sourceMediaBucketAllowed: false
  uploadedObjects: OcrUploadedObjectEvidence[]
  uploadVerified: boolean
  blockers: string[]
  warnings: string[]
}

export interface ApprovedOcrModelDownloadEvidence {
  phase: '37B'
  modelFamily: 'PP-OCRv5'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  status: OcrModelDownloadStatus
  selectedAssets: OcrModelAssetRecord[]
  optionalDeferredAssets: OcrModelAssetRecord[]
  licenseName: 'Apache-2.0'
  codexLicenseDecision: 'staging_download_approved_by_codex' | 'not_started' | 'blocked'
  humanLicenseApprovalRequired: false
  productionLegalApprovalComplete: false
  exactAssetSelectionApproved: true
  targetGcsPath: string
  assetSha256: Record<string, string>
  aggregateSha256?: string
  assetSizeBytes: Record<string, number>
  fileCount?: number
  uploadedObjectCount?: number
  downloadedAt?: string
  uploadedAt?: string
  verifiedAt?: string
  gcsAssetSelectionManifestPath?: string
  gcsChecksumManifestPath?: string
  gcsChecksumTextPath?: string
  gcsModelTreeManifestPath?: string
  gcsSourceEvidencePath?: string
  gcsLicenseEvidencePath?: string
  gcsDownloadReportPath?: string
  gcsPrivateUploadReportPath?: string
  gcsPhaseReportPath?: string
  sanitizedLocalTempPath?: string
  uploadedObjects: OcrUploadedObjectEvidence[]
  iamChanges: string[]
  blockers: string[]
  warnings: string[]
}

export interface OcrModelDownloadReport {
  reportId: 'activation-phase-37b-paddleocr-exact-assets-download'
  createdAt: string
  status: OcrModelDownloadReportStatus
  downloadEvidence: ApprovedOcrModelDownloadEvidence
  sourceEvidence: OcrModelSourceEvidence
  licenseEvidence: OcrModelLicenseEvidence
  assetSelectionManifest: OcrAssetSelectionManifest
  checksumManifest: OcrChecksumManifest
  modelTreeManifest: OcrModelTreeManifest
  privateGcsUploadReport: OcrPrivateGcsUploadReport
  executionCommandPlans: OcrModelDownloadExecutionCommandPlan[]
  expectedArtifacts: string[]
  blockers: string[]
  warnings: string[]
  phase37CReadiness: {
    readyForGeneratedOcrRuntimeVerification: boolean
    readyForRuntimeExecution: false
    reason: string
  }
  notReadyFor: string[]
  ocrModelDownloadCompleted: boolean
  exactAssetSelectionApproved: true
  ocrRuntimeAllowed: false
  ocrInferenceAllowed: false
  realMediaOcrAllowed: false
  realVideoOcrAllowed: false
  captionRenderIntegrationAllowed: false
  runtimeAutoDownloadAllowed: false
  textlineOrientationAutoDownloadAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  publicOutputAllowed: false
  signedUrlSourceOfTruthAllowed: false
}

export interface OcrModelDownloadExecutionResult {
  evidence: ApprovedOcrModelDownloadEvidence
  sourceEvidence: OcrModelSourceEvidence
  licenseEvidence: OcrModelLicenseEvidence
  assetSelectionManifest: OcrAssetSelectionManifest
  checksumManifest: OcrChecksumManifest
  modelTreeManifest: OcrModelTreeManifest
  privateGcsUploadReport: OcrPrivateGcsUploadReport
  localArtifacts: {
    tempDir: string
    sourceEvidencePath: string
    licenseEvidencePath: string
    assetSelectionManifestPath: string
    checksumManifestPath: string
    checksumTextPath: string
    modelTreeManifestPath: string
    downloadReportPath: string
    privateGcsUploadReportPath: string
    phaseReportPath: string
  }
}
