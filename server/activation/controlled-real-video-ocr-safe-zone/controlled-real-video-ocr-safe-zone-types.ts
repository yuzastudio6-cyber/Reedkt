export type ControlledRealVideoOcrSafeZoneStatus = 'planned' | 'passed' | 'blocked'
export type ControlledRealVideoOcrSafeZoneMode = 'metadata_only_planning_gate'
export type ControlledRealVideoOcrSafeZoneCommandPhase =
  | 'preflight'
  | 'chain-validation'
  | 'sample-selection'
  | 'schema'
  | 'future-execute'
  | 'future-upload'
  | 'validate'
export type ControlledRealVideoOcrSafeZoneQaStatus = 'passed' | 'warning' | 'blocked'

export interface ControlledRealVideoOcrSafeZoneConfig {
  phase: '37D'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  mode: ControlledRealVideoOcrSafeZoneMode
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaArtifactPrefix: 'activation/phase37d/controlled-real-video-ocr-safe-zone'
  localTempRoot: '/tmp/reeditpro-ocr-runtime/phase37d'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  selectedChainId: 'controlled-real-video-chain-phase28-through-phase32-v1'
  selectedSampleId: 'phase37d-phase32-color-export-safe-zone-window-v1'
  selectedSourceGcsUri: string
  selectedSourceSha256: string
  selectedWindowStartSeconds: 6.9
  selectedWindowEndSeconds: 8.9
  selectedFrameOffsetsSeconds: readonly [6.9, 7.3, 7.7, 8.1, 8.5, 8.9]
  maxWindows: 3
  maxSampledFrames: 12
  selectedMaxSampledFrames: 6
  expectedSourceDurationSeconds: 15.467
}

export interface ControlledRealVideoOcrSafeZoneEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  mode?: string
  sourceGcsUri?: string
  controlledRealVideoOcrExecuteConfirmation?: string
  frameExtractionConfirmation?: string
  artifactUploadConfirmation?: string
  realMediaInputEnabled?: string
  arbitraryMediaEnabled?: string
  modelDownloadEnabled?: string
  providerExecutionEnabled?: string
  trackAExecutionEnabled?: string
  publicOutputEnabled?: string
  signedUrlSourceOfTruthEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
}

export interface ControlledRealVideoOcrSafeZoneValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoChainEvidence {
  chainId: ControlledRealVideoOcrSafeZoneConfig['selectedChainId']
  status: 'approved_for_phase37d_metadata_gate' | 'blocked'
  phaseRunIds: {
    phase28: 'phase28-20260528T01552'
    phase29: 'phase29-20260528T02254'
    phase30: 'phase30-20260528T12421'
    phase31: 'phase31-20260528T13060'
    phase32: 'phase32-20260528T13330'
  }
  phase32Export: {
    gcsUri: string
    sizeBytes: 94522751
    sha256: string
    durationSeconds: 15.467
    width: 2160
    height: 3840
    privateOnly: true
    publicUrlCreated: false
    signedUrlSourceOfTruthCreated: false
  }
  phase37BAssets: {
    modelGcsPath: string
    aggregateSha256: string
  }
  phase37CRuntime: {
    runId: string
    artifactPrefix: string
    readyForControlledRealVideoOcrSafeZone: boolean
    dictionaryPathLimitationCarriedForward: true
  }
  metadataReferences: string[]
  trackAReferencesAreMetadataOnly: true
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoCaptionZone {
  zoneId: string
  label: string
  x: number
  y: number
  width: number
  height: number
  coordinateSpace: 'normalized'
  purpose: 'caption_safe_zone' | 'expected_ocr_review_zone' | 'avoid_region'
  required: boolean
}

export interface ControlledRealVideoSampleCandidate {
  sampleId: ControlledRealVideoOcrSafeZoneConfig['selectedSampleId']
  chainId: ControlledRealVideoOcrSafeZoneConfig['selectedChainId']
  sourceGcsUri: string
  sourceSha256: string
  sourceDurationSeconds: 15.467
  plannedWindow: {
    startSeconds: 6.9
    endSeconds: 8.9
    durationSeconds: 2
  }
  plannedFrameOffsetsSeconds: readonly [6.9, 7.3, 7.7, 8.1, 8.5, 8.9]
  maxSampledFrames: 6
  selected: true
  privateGcsSourceOnly: true
  mediaBytesRead: false
  frameExtractionPerformed: false
  realVideoOcrPerformed: false
  artifactUploadPerformed: false
  captionRenderIntegrationPerformed: false
  expectedCaptionZones: ControlledRealVideoCaptionZone[]
  blockers: string[]
  warnings: string[]
}

export interface ControlledRealVideoFutureArtifactSchema {
  artifactName: string
  requiredForFutureExecution: boolean
  description: string
  schema: Record<string, unknown>
  privacy: 'private_qa_artifact_only'
}

export interface ControlledRealVideoOcrSafeZoneCommandPlan {
  commandId: string
  phase: ControlledRealVideoOcrSafeZoneCommandPhase
  commandString: string
  requiresConfirmation: boolean
  confirmationEnvVar?:
    | 'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE'
    | 'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION'
    | 'REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD'
  textOnlyByDefault: true
  doesNotDo: string[]
  warnings: string[]
}

export interface ControlledRealVideoOcrSafeZoneIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
  required: false
}

export interface ControlledRealVideoOcrSafeZoneReport {
  reportId: 'activation-phase-37d-controlled-real-video-ocr-safe-zone-gate'
  createdAt: string
  config: ControlledRealVideoOcrSafeZoneConfig
  status: ControlledRealVideoOcrSafeZoneStatus
  controlledChain: ControlledRealVideoChainEvidence
  selectedSample: ControlledRealVideoSampleCandidate
  futureArtifactSchemas: ControlledRealVideoFutureArtifactSchema[]
  commandPlans: ControlledRealVideoOcrSafeZoneCommandPlan[]
  iamPlan: ControlledRealVideoOcrSafeZoneIamPlan[]
  blockers: string[]
  warnings: string[]
  qa: {
    status: ControlledRealVideoOcrSafeZoneQaStatus
    gates: Array<{
      gateId:
        | 'phase37b_private_ocr_assets'
        | 'phase37c_generated_runtime'
        | 'approved_private_controlled_chain'
        | 'selected_sample_bounds'
        | 'metadata_only_safety'
        | 'future_artifact_policy'
        | 'blocked_scopes'
      status: ControlledRealVideoOcrSafeZoneQaStatus
      summary: string
    }>
  }
  phase37DMetadataPlanningPassed: boolean
  phase37EReadiness: {
    readyForCaptionRenderQaIntegration: false
    reason: string
  }
  futureExecutionReadiness: {
    readyForControlledRealVideoOcrExecutionPlanning: boolean
    reason: string
  }
  safety: {
    metadataOnlyPlanningGate: true
    mediaBytesRead: false
    frameExtractionPerformed: false
    realVideoOcrPerformed: false
    artifactUploadPerformed: false
    iamMutated: false
    dockerBuilt: false
    cloudRunDeployed: false
    providerExecuted: false
    modelDownloaded: false
    publicAccessEnabled: false
    signedUrlSourceOfTruthUsed: false
    productionReadyAllowed: false
    internalBetaAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
    trackATouched: false
  }
}
