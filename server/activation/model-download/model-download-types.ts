import type {
  ModelDownloadCommandPlan,
  ModelStoragePlan,
  ModelWeightManifestRecord,
} from '../model-approval/model-approval-types'

export type ModelDownloadStatus =
  | 'not_started'
  | 'planned'
  | 'downloaded'
  | 'uploaded'
  | 'verified'
  | 'blocked'
  | 'failed'

export interface ApprovedModelDownloadEvidence {
  modelWeightManifestId: 'faster_whisper_tiny_staging_v1'
  repoId: 'Systran/faster-whisper-tiny'
  modelName: 'Systran/faster-whisper-tiny'
  status: ModelDownloadStatus
  resolvedRevision?: string
  aggregateSha256?: string
  fileCount?: number
  totalSizeBytes?: number
  downloadedAt?: string
  uploadedAt?: string
  stagingStoragePath: string
  runtimePath: string
  gcsManifestPath?: string
  gcsChecksumPath?: string
  sanitizedLocalTempPath?: string
  uploadedObjectCount?: number
  blockers: string[]
  warnings: string[]
}

export interface ModelDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  env?: string
  confirmation?: string
  bucketName?: string
  repoId?: string
  repoPath?: string
}

export interface ModelDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface ModelDownloadExecutionCommandPlan {
  commandId: string
  commandString: string
  phase: 'preflight' | 'download' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface ModelDownloadReport {
  reportId: string
  createdAt: string
  approvedModelManifest: ModelWeightManifestRecord
  downloadEvidence: ApprovedModelDownloadEvidence
  storagePlan: ModelStoragePlan
  commandPlans: ModelDownloadCommandPlan[]
  executionCommandPlans: ModelDownloadExecutionCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase27Readiness: {
    readyForGpuDeploy: false
    reason: string
  }
  phase28Readiness: {
    readyForPlanning: boolean
    readyForExecution: boolean
    reason: string
  }
  modelDownloadExecuted: boolean
  modelUploadedToGcs: boolean
  providerExecuted: false
  gpuDeployed: false
  realUserMediaProcessed: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
