export type AudioStackDemucsStatus = 'planned' | 'closed_with_demucs_blocked' | 'blocked'
export type AudioStackDemucsQaStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface AudioStackDemucsConfig {
  phase: '36G'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  referencePhase31Audio: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4'
  phase36ERunId: 'phase36e-20260530T152327'
  phase36FRunId: 'phase36f-20260530T161352'
  deepFilterNetScope: 'speech_cleanup'
  demucsScope: 'vocal_music_stem_separation'
  rnnoiseScope: 'removed_from_active_product_flow'
  demucsModelCandidate: 'htdemucs'
  demucsRepoUrl: 'https://github.com/facebookresearch/demucs'
  demucsModelLicenseIssueUrl: 'https://github.com/facebookresearch/demucs/issues/327'
  demucsTargetGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/demucs/htdemucs/'
  reportObjectPrefix: 'activation-audio-ai/phase36g'
}

export interface AudioStackDemucsValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  approvedInputVideo?: string
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  rnnoiseEnabled?: string
  demucsRuntimeEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
}

export interface AudioStackDemucsValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface AudioToolRoutingDecision {
  toolId: 'deepfilternet' | 'demucs' | 'rnnoise'
  productStatus: 'active_internal' | 'candidate_blocked' | 'removed_from_active_flow'
  ownsActions: string[]
  explicitlyNotFor: string[]
  decision: string
}

export interface DemucsSourceEvidence {
  sourceId: string
  sourceUrl: string
  evidenceSummary: string
  status: 'verified' | 'blocked'
  blockers: string[]
}

export interface DemucsLicenseReview {
  codeLicense: 'MIT'
  pretrainedModelLicenseStatus: 'ambiguous_open_issue'
  commercialUseDecision: 'blocked_pending_model_license_clarity'
  humanLegalApprovalRequired: true
  summary: string
}

export interface AudioStackDemucsCommandPlan {
  commandId: string
  phase: 'preflight' | 'evidence' | 'download' | 'runtime' | 'report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  enabledInPhase36G: boolean
  blockedReason?: string
  doesNotDo: string[]
}

export interface AudioStackDemucsIamPlan {
  bindingId: string
  bucket: string
  role: 'existing-read-check' | 'deferred-object-viewer' | 'deferred-object-creator'
  member: 'active-gcloud-account' | 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  conditionExpression: string
  description: string
  mutationPlanned: false
}

export interface AudioStackDemucsQaGate {
  gateId:
    | 'tool_routing'
    | 'rnnoise_removal'
    | 'demucs_source_evidence'
    | 'demucs_license_provenance'
    | 'download_runtime_block'
    | 'controlled_source_scope'
    | 'privacy_security'
    | 'blocked_features'
    | 'phase37a_scope'
  status: AudioStackDemucsQaStatus
  summary: string
}

export interface ApprovedAudioStackDemucsEvidence {
  phase: '36G'
  status: 'closed_with_demucs_blocked'
  runId: 'phase36g-static-demucs-model-license-block'
  demucsBlocked: true
  demucsBlocker: string
  rnnoiseRemovedFromActiveFlow: true
  deepFilterNetInternalSpeechCleanupPreserved: true
  demucsSeparationCandidateDocumented: true
  demucsDownloadCompleted: false
  demucsRuntimeCompleted: false
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface AudioStackDemucsReport {
  reportId: 'activation-phase-36g-audio-stack-demucs'
  createdAt: string
  config: AudioStackDemucsConfig
  toolRouting: AudioToolRoutingDecision[]
  sourceEvidence: DemucsSourceEvidence[]
  licenseReview: DemucsLicenseReview
  iamPlan: AudioStackDemucsIamPlan[]
  commandPlans: AudioStackDemucsCommandPlan[]
  qaGates: AudioStackDemucsQaGate[]
  approvedEvidence: ApprovedAudioStackDemucsEvidence
  status: AudioStackDemucsStatus
  blockers: string[]
  warnings: string[]
  deepFilterNetSpeechCleanupAllowed: true
  rnnoiseActiveProductFlowAllowed: false
  demucsDownloadAllowed: false
  demucsRuntimeAllowed: false
  demucsInternalBetaAllowed: false
  arbitraryRealUserMediaAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: boolean
    reason: string
  }
}
