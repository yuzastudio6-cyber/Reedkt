export type SpeechRuntimeStatus = 'planned' | 'ready' | 'blocked' | 'failed'

export interface SpeechRuntimeConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  imageTag: 'staging-speech-cpu-001'
  jobName: 'reeditpro-staging-speech-runtime-job'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  modelManifestId: 'faster_whisper_tiny_staging_v1'
  modelName: 'Systran/faster-whisper-tiny'
  modelRevision: string
  modelAggregateSha256: string
  modelGcsPath: string
  modelRuntimePath: string
  targetImage: string
  reportObjectPrefix: string
}

export interface SpeechRuntimeCommandPlan {
  commandId: string
  commandString: string
  phase: 'preflight' | 'build' | 'iam' | 'deploy' | 'execute' | 'verify'
  requiresConfirmation: boolean
  confirmationEnvVar?: 'REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME'
  doesNotDo: string[]
  warnings: string[]
}

export interface SpeechRuntimeExecutionReport {
  ok: boolean
  runId: string
  projectId: string
  jobName: string
  model: {
    manifestId: string
    name: string
    gcsPath: string
    runtimePath: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  fixture: {
    generated: boolean
    path: string
    durationSeconds: number
  }
  transcription: {
    status: 'completed' | 'failed'
    segmentCount: number
    fullText: string
    language?: string
    warnings: string[]
  }
  safety: {
    providerExecuted: false
    modelDownloadedExternally: false
    realUserMediaUsed: false
    gpuUsed: false
    secretValuesUsed: false
  }
  uploadedReport?: {
    bucket: string
    object: string
  }
  warnings: string[]
}

export interface SpeechRuntimeReport {
  reportId: string
  createdAt: string
  config: SpeechRuntimeConfig
  commandPlans: SpeechRuntimeCommandPlan[]
  executionReport?: SpeechRuntimeExecutionReport
  status: SpeechRuntimeStatus
  blockers: string[]
  warnings: string[]
  phase28Readiness: {
    readyForControlledSpeechCaption: boolean
    reason: string
  }
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  providerExecuted: false
  gpuDeployed: false
  gpuExecuted: false
  modelDownloadedExternally: false
  realUserMediaProcessed: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
