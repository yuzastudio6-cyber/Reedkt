export type FirstRealVideoStatus = 'planned' | 'ready' | 'blocked' | 'failed'

export interface FirstRealVideoConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  sourceBucket: 'reeditpro-staging-reeditpro-source-media'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  jobName: 'reeditpro-staging-speech-runtime-job'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  imageTag: 'staging-phase28-speech-001'
  sourceVideoPath: '/Users/macuser/Downloads/IMG_6005.MOV'
  modelManifestId: 'faster_whisper_tiny_staging_v1'
  modelName: 'Systran/faster-whisper-tiny'
  modelRevision: string
  modelAggregateSha256: string
  modelGcsPath: string
  modelRuntimePath: string
}

export interface FirstRealVideoSourceValidation {
  sourceType: 'local_path' | 'gcs_uri'
  source: string
  sanitizedFilename: string
  sizeBytes?: number
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface FirstRealVideoUploadResult {
  runId: string
  sourceGcsUri: string
  sourceObject: string
  sourceBucket: string
  sanitizedFilename: string
  uploadedAt: string
}

export interface FirstRealVideoArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface FirstRealVideoRuntimeReport {
  ok: boolean
  runId: string
  projectId: string
  jobName: string
  source: {
    sourceGcsUri: string
    sanitizedFilename: string
    durationSeconds?: number
    width?: number
    height?: number
    hasAudio: boolean
  }
  model: {
    manifestId: string
    name: string
    revision: string
    gcsPath: string
    runtimePath: string
    aggregateSha256: string
  }
  speechRuntime: {
    status: 'completed' | 'failed'
    language?: string
    transcriptSegmentCount: number
    wordTimestampCount: number
    fullTranscriptPreview: string
  }
  captions: {
    captionSegmentCount: number
    srtUri?: string
    webvttUri?: string
    assUri?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: Array<{ gateId: string; status: 'passed' | 'warning' | 'blocked'; summary: string }>
    blockers: string[]
    warnings: string[]
  }
  artifacts: FirstRealVideoArtifact[]
  safety: {
    controlledPhase28SourceOnly: boolean
    arbitraryRealMediaUsed: false
    providerExecuted: false
    gpuUsed: false
    modelDownloadedExternally: false
    secretValuesUsed: false
    publicAccessEnabled: false
    finalExportCreated: false
    smartCutExecuted: false
    audioCleanupExecuted: false
    colorExecuted: false
    masksOrEnhancementExecuted: false
  }
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  warnings: string[]
}

export interface FirstRealVideoReport {
  reportId: string
  createdAt: string
  config: FirstRealVideoConfig
  upload?: FirstRealVideoUploadResult
  runtimeReport?: FirstRealVideoRuntimeReport
  sourceValidation?: FirstRealVideoSourceValidation
  status: FirstRealVideoStatus
  blockers: string[]
  warnings: string[]
  phase29Readiness: {
    readyForSmartCutCaptionPlanning: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
