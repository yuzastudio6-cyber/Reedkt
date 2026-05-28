import type {
  EnhancementModelDownloadCommandPlan,
  EnhancementModelStoragePlan,
  EnhancementModelWeightManifestRecord,
} from '../enhancement-model-approval/enhancement-model-approval-types'

export type EnhancementModelDownloadStatus =
  | 'not_started'
  | 'planned'
  | 'downloaded'
  | 'uploaded'
  | 'verified'
  | 'blocked'
  | 'failed'

export interface ApprovedEnhancementModelDownloadEvidence {
  modelWeightManifestId: 'real_esrgan_x4plus_staging_v1'
  modelName: 'RealESRGAN_x4plus'
  status: EnhancementModelDownloadStatus
  sourceUrl: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
  releaseVersion: 'v0.1.0'
  fileName: 'RealESRGAN_x4plus.pth'
  fileSha256?: string
  aggregateSha256?: string
  fileCount?: number
  totalSizeBytes?: number
  downloadedAt?: string
  uploadedAt?: string
  stagingStoragePath: string
  runtimePath: string
  runtimeTempPath: string
  gcsManifestPath?: string
  gcsChecksumPath?: string
  sanitizedLocalTempPath?: string
  uploadedObjectCount?: number
  readmeLicenseFiles: string[]
  configFiles: string[]
  modelWeightFiles: string[]
  hasPthWeight: boolean
  blockers: string[]
  warnings: string[]
}

export interface EnhancementModelDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  env?: string
  confirmation?: string
  bucketName?: string
  sourceUrl?: string
  fileName?: string
  repoPath?: string
}

export interface EnhancementModelDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface EnhancementModelDownloadExecutionCommandPlan {
  commandId: string
  commandString: string
  phase: 'preflight' | 'download' | 'inspect' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_DOWNLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface EnhancementModelChecksumEntry {
  relativePath: string
  sha256: string
  sizeBytes: number
}

export interface EnhancementModelTreeManifest {
  modelName: 'RealESRGAN_x4plus'
  sourceUrl: ApprovedEnhancementModelDownloadEvidence['sourceUrl']
  releaseVersion: 'v0.1.0'
  fileCount: number
  totalSizeBytes: number
  fileSha256: string
  aggregateSha256: string
  readmeLicenseFiles: string[]
  configFiles: string[]
  modelWeightFiles: string[]
  hasPthWeight: boolean
  files: EnhancementModelChecksumEntry[]
}

export interface EnhancementModelDownloadReport {
  reportId: string
  createdAt: string
  approvedModelManifest: EnhancementModelWeightManifestRecord
  downloadEvidence: ApprovedEnhancementModelDownloadEvidence
  storagePlan: EnhancementModelStoragePlan
  commandPlans: EnhancementModelDownloadCommandPlan[]
  executionCommandPlans: EnhancementModelDownloadExecutionCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase34CReadiness: {
    readyForRuntimePlanning: boolean
    readyForRuntimeExecution: false
    reason: string
  }
  phase34DReadiness: {
    readyForControlledEnhancementSample: false
    reason: string
  }
  modelDownloadExecuted: boolean
  modelUploadedToGcs: boolean
  providerExecuted: false
  gpuDeployed: false
  frameOrVideoProcessed: false
  enhancementExecutionRan: false
  slowMotionExecutionRan: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}
