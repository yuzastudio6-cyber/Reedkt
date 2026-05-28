import type {
  MaskModelDownloadCommandPlan,
  MaskModelStoragePlan,
  MaskModelWeightManifestRecord,
} from '../mask-model-approval/mask-model-approval-types'

export type MaskModelDownloadStatus =
  | 'not_started'
  | 'planned'
  | 'downloaded'
  | 'uploaded'
  | 'verified'
  | 'blocked'
  | 'failed'

export interface ApprovedMaskModelDownloadEvidence {
  modelWeightManifestId: 'birefnet_main_staging_v1'
  repoId: 'ZhengPeng7/BiRefNet'
  modelName: 'ZhengPeng7/BiRefNet'
  status: MaskModelDownloadStatus
  resolvedRevision?: string
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
  customCodeFiles: string[]
  modelWeightFiles: string[]
  tokenizerFiles: string[]
  hasCustomCode: boolean
  hasSafetensorsOrBinWeights: boolean
  blockers: string[]
  warnings: string[]
}

export interface MaskModelDownloadPreflightInput {
  projectId?: string
  activeProject?: string
  authenticatedAccount?: string
  env?: string
  confirmation?: string
  bucketName?: string
  repoId?: string
  repoPath?: string
}

export interface MaskModelDownloadPreflightResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface MaskModelDownloadExecutionCommandPlan {
  commandId: string
  commandString: string
  phase: 'preflight' | 'download' | 'inspect' | 'checksum' | 'upload' | 'verify' | 'cleanup'
  textOnlyByDefault: true
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_MASK_MODEL_DOWNLOAD'
  doesNotDo: string[]
  warnings: string[]
}

export interface MaskModelChecksumEntry {
  relativePath: string
  sha256: string
  sizeBytes: number
}

export interface MaskModelTreeManifest {
  repoId: 'ZhengPeng7/BiRefNet'
  resolvedRevision: string
  fileCount: number
  totalSizeBytes: number
  aggregateSha256: string
  readmeLicenseFiles: string[]
  configFiles: string[]
  customCodeFiles: string[]
  modelWeightFiles: string[]
  tokenizerFiles: string[]
  hasCustomCode: boolean
  hasSafetensorsOrBinWeights: boolean
  files: MaskModelChecksumEntry[]
}

export interface MaskModelDownloadReport {
  reportId: string
  createdAt: string
  approvedModelManifest: MaskModelWeightManifestRecord
  downloadEvidence: ApprovedMaskModelDownloadEvidence
  storagePlan: MaskModelStoragePlan
  commandPlans: MaskModelDownloadCommandPlan[]
  executionCommandPlans: MaskModelDownloadExecutionCommandPlan[]
  blockers: string[]
  warnings: string[]
  phase33CReadiness: {
    readyForRuntimePlanning: boolean
    readyForRuntimeExecution: false
    reason: string
  }
  phase33DReadiness: {
    readyForControlledMaskTest: false
    reason: string
  }
  modelDownloadExecuted: boolean
  modelUploadedToGcs: boolean
  providerExecuted: false
  gpuDeployed: false
  frameOrVideoProcessed: false
  maskExecutionRan: false
  textBehindSubjectExecutionRan: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}
