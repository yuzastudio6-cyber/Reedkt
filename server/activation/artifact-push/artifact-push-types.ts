import type { ContainerBuildImageId } from '../container-build'

export type ArtifactPushImageId = ContainerBuildImageId

export type ArtifactPushMode =
  | 'static_plan'
  | 'report_from_logs'
  | 'phase24_blocked'

export type ArtifactPushStatus =
  | 'not_run'
  | 'planned'
  | 'tagged'
  | 'pushed'
  | 'verified'
  | 'failed'
  | 'blocked'
  | 'deferred'
  | 'unknown'

export type ParsedArtifactPushStatus =
  | 'pushed'
  | 'failed'
  | 'blocked'
  | 'unknown'

export interface ArtifactImageManifestEntry {
  imageId: ArtifactPushImageId
  sourceImageNames: string[]
  targetImageName: string
  targetFullImageName: string
  imageTag: string
  requiredForPhase24: boolean
  requiredForGpuPhase: boolean
  deferred: boolean
  notes: string[]
}

export interface ArtifactPushCommandPlan {
  commandId: string
  imageId: ArtifactPushImageId
  sourceImageNames: string[]
  targetFullImageName: string
  commandString: string
  safeToRunManually: boolean
  requiresHumanConfirmation: true
  confirmationEnvVar: 'REEDITPRO_CONFIRM_ARTIFACT_PUSH'
  deferred: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface ArtifactPushVerificationCommandPlan {
  commandId: string
  imageId: ArtifactPushImageId
  targetFullImageName: string
  commandString: string
  safeToRunManually: boolean
  doesNotDo: string[]
}

export interface ParsedArtifactPushLog {
  parsedStatus: ParsedArtifactPushStatus
  imageId?: ArtifactPushImageId
  detectedDigest?: string
  detectedImageName?: string
  errors: string[]
  warnings: string[]
  forbiddenFindings: string[]
  nextActions: string[]
}

export interface ArtifactImageDigestEvidence {
  imageId: ArtifactPushImageId
  targetFullImageName: string
  digest?: string
  updateTime?: string
  verified: boolean
  source: 'push_log' | 'artifact_registry' | 'manual_report'
  warnings: string[]
}

export interface ArtifactPushResult {
  imageId: ArtifactPushImageId | 'unknown'
  status: ArtifactPushStatus
  targetFullImageName?: string
  sourceImageName?: string
  imageTag?: string
  logPath?: string
  parsedLog?: ParsedArtifactPushLog
  digest?: string
  verified: boolean
  warnings: string[]
  errors: string[]
  forbiddenFindings: string[]
}

export interface ArtifactPushBlocker {
  id: string
  imageId?: ArtifactPushImageId | 'unknown'
  summary: string
}

export interface ArtifactPushWarning {
  id: string
  imageId?: ArtifactPushImageId | 'unknown'
  summary: string
}

export interface ArtifactPushPhase24Readiness {
  readyForNonGpuStagingDeploy: boolean
  requiredImagesPushed: ArtifactPushImageId[]
  blockers: string[]
  warnings: string[]
}

export interface ArtifactPushPhase27Readiness {
  readyForGpuStaging: boolean
  gpuImageStatus: 'deferred'
  blockers: string[]
  warnings: string[]
}

export interface ArtifactPushReport {
  reportId: string
  createdAt: string
  mode: ArtifactPushMode
  project?: string
  artifactRegion?: string
  repository?: string
  imageTag?: string
  imageManifests: ArtifactImageManifestEntry[]
  commandPlans: ArtifactPushCommandPlan[]
  verificationCommandPlans: ArtifactPushVerificationCommandPlan[]
  pushResults: ArtifactPushResult[]
  digestEvidence: ArtifactImageDigestEvidence[]
  blockers: ArtifactPushBlocker[]
  warnings: ArtifactPushWarning[]
  phase24Readiness: ArtifactPushPhase24Readiness
  phase27Readiness: ArtifactPushPhase27Readiness
  dockerPushExecuted: boolean
  gcloudExecuted: boolean
  deploymentExecuted: false
  dockerBuildExecuted: false
  providerExecuted: false
  modelDownloadExecuted: false
  mediaProcessingExecuted: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

export interface BuildArtifactPushReportInput {
  mode?: ArtifactPushMode
  project?: string
  artifactRegion?: string
  repository?: string
  imageTag?: string
  parsedLogs?: Array<{ logPath: string; parsedLog: ParsedArtifactPushLog }>
  digestEvidence?: ArtifactImageDigestEvidence[]
  createdAt?: string
}
