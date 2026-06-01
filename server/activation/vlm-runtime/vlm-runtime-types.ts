import type { ApprovedVlmModelDownloadEvidence, VlmModelAssetRecord } from '../vlm-model-download'

export type VlmRuntimeStatus = 'planned' | 'verified' | 'blocked' | 'failed'
export type VlmRuntimeKind = 'vllm' | 'transformers_fallback'
export type VlmRuntimeQaStatus = 'passed' | 'warning' | 'blocked' | 'skipped'
export type VlmToolFamilyBetaStatus =
  | 'not ready'
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'

export type VlmGeneratedFixtureId =
  | 'generated-object-layout'
  | 'generated-ui-safe-zone'
  | 'generated-ocr-vlm-comparison'
  | 'generated-ambiguous-scene'
  | 'generated-spatial-reasoning'

export interface VlmRuntimeConfig {
  phase: '39C'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  modelFamily: 'Qwen3-VL'
  modelRevision: string
  modelGcsPath: string
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaArtifactPrefix: 'activation/phase39c/generated-vlm-runtime'
  localTempRoot: '/tmp/reeditpro-vlm-runtime/phase39c'
  stagingImagePath: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c'
  stagingCloudRunJobName: 'reeditpro-stg-vlm-runtime-phase39c'
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  requiredRuntime: 'vllm'
  requiredVllmVersion: '0.11.0'
  fallbackRuntime: 'transformers_fallback'
  approvedGpuType: 'L4'
  requiredBroadRegionAccuracyThreshold: 0.7
  requiredLabelRecallThreshold: 0.7
  requiredSchemaValidity: 1
  selectedFileCount: number
  selectedTotalSizeBytes: number
  aggregateSha256: string
}

export interface VlmRuntimeEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  privateGcsReadConfirmation?: string
  runtimeExecuteConfirmation?: string
  artifactUploadConfirmation?: string
  dockerBuildConfirmation?: string
  dockerPushConfirmation?: string
  cloudRunJobConfirmation?: string
  l4GpuConfirmation?: string
  l4TuningRerunConfirmation?: string
  runtimeMode?: string
  tuningProfileMatrix?: string
  modelGcsPath?: string
  modelIdRuntimePath?: string
  aggregateSha256?: string
  generatedFixturesOnly?: string
  rawPromptEnabled?: string
  providerExecutionEnabled?: string
  mediaProcessingEnabled?: string
  realMediaInputEnabled?: string
  arbitraryMediaInputEnabled?: string
  productionReady?: string
  internalBetaReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
  publicOutputEnabled?: string
  trackAExecutionEnabled?: string
}

export interface VlmRuntimeValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'model-copy' | 'checksum' | 'fixture' | 'execute' | 'upload' | 'docker' | 'cloud-run' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  confirmationEnvVar?:
    | 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE'
    | 'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ'
    | 'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE'
    | 'REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD'
    | 'REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD'
    | 'REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH'
    | 'REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB'
    | 'REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE'
    | 'REEDITPRO_CONFIRM_VLM_L4_TUNING_RERUN'
  textOnlyByDefault: true
  doesNotDo: string[]
  warnings: string[]
}

export type VlmRuntimeIamBindingStatus = 'already_present' | 'added' | 'missing' | 'skipped' | 'blocked'

export interface VlmRuntimeIamPlan {
  bindingId: string
  resource: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator' | 'roles/artifactregistry.reader' | 'roles/run.developer'
  member: string
  conditionTitle: string
  conditionDescription?: string
  conditionExpression: string
  description: string
  commandString: string
  required: boolean
  optionalReason?: string
  status?: VlmRuntimeIamBindingStatus
  blockers?: string[]
  warnings?: string[]
}

export interface VlmRuntimeIamPolicyBinding {
  role: string
  members: string[]
  condition?: {
    title?: string
    description?: string
    expression?: string
  }
}

export interface VlmRuntimeIamPolicySnapshot {
  phase: '39C'
  reportId: 'phase_39c_vlm_runtime_iam_before' | 'phase_39c_vlm_runtime_iam_after'
  createdAt: string
  bucket: string
  etag?: string
  bindingCount: number
  bindings: VlmRuntimeIamPolicyBinding[]
  relevantBindings: VlmRuntimeIamPolicyBinding[]
  publicPrincipalsDetected: boolean
  broadBindingsForPhase39cMember: VlmRuntimeIamPolicyBinding[]
  warnings: string[]
}

export interface VlmRuntimeScopedIamPlanReport {
  phase: '39C'
  reportId: 'phase_39c_vlm_runtime_scoped_iam_plan'
  createdAt: string
  iamMutationAllowed: boolean
  defaultMode: 'non_mutating'
  requiredConfirmation: 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE'
  plans: VlmRuntimeIamPlan[]
  broaderRolesRejected: string[]
  publicPrincipalsRejected: string[]
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeIamDeltaReport {
  phase: '39C'
  reportId: 'phase_39c_vlm_runtime_iam_delta_report'
  createdAt: string
  iamMutationAllowed: boolean
  member: string
  appliedBindings: VlmRuntimeIamPlan[]
  alreadyPresentBindings: VlmRuntimeIamPlan[]
  skippedBindings: VlmRuntimeIamPlan[]
  missingRequiredBindings: VlmRuntimeIamPlan[]
  before: {
    generatedAssets: VlmRuntimeIamPolicySnapshot
    qaArtifacts: VlmRuntimeIamPolicySnapshot
  }
  after: {
    generatedAssets: VlmRuntimeIamPolicySnapshot
    qaArtifacts: VlmRuntimeIamPolicySnapshot
  }
  broadAccessGranted: false
  publicAccessGranted: false
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeIamApplyResult {
  plan: VlmRuntimeScopedIamPlanReport
  before: {
    generatedAssets: VlmRuntimeIamPolicySnapshot
    qaArtifacts: VlmRuntimeIamPolicySnapshot
  }
  after: {
    generatedAssets: VlmRuntimeIamPolicySnapshot
    qaArtifacts: VlmRuntimeIamPolicySnapshot
  }
  delta: VlmRuntimeIamDeltaReport
}

export interface VlmExpectedRegion {
  regionId: string
  label: string
  x: number
  y: number
  width: number
  height: number
  required: boolean
}

export interface VlmGeneratedFixtureSpec {
  fixtureId: VlmGeneratedFixtureId
  width: number
  height: number
  generatedOnly: true
  riskCategory: 'required_pass' | 'manual_review_expected'
  seed: string
  expectedLabels: string[]
  expectedRegions: VlmExpectedRegion[]
  safeZoneQuestion: string
  passCriteria: string[]
  warningCriteria: string[]
}

export interface VlmPromptTemplateSpec {
  promptTemplateId: string
  fixtureId: VlmGeneratedFixtureId
  schemaId: 'phase39c_vlm_fixture_output_v1'
  systemInstruction: string
  userInstruction: string
  rawPromptAllowed: false
  providerCallAllowed: false
  toolCallAllowed: false
  outputFormat: 'json_only'
}

export interface VlmModelAssetVerificationEntry {
  relativePath: string
  gcsUri: string
  localPath?: string
  expectedSha256: string
  actualSha256?: string
  expectedSizeBytes: number
  actualSizeBytes?: number
  generation?: string
  crc32c?: string
  md5Hash?: string
  verified: boolean
}

export interface VlmModelAssetVerificationReport {
  phase: '39C'
  runId: string
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  revision: string
  modelGcsPath: string
  aggregateSha256: string
  entries: VlmModelAssetVerificationEntry[]
  status: 'verified' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface VlmFixtureRuntimeResult {
  fixtureId: VlmGeneratedFixtureId
  status: VlmRuntimeQaStatus
  runtime: VlmRuntimeKind
  parsedJson: boolean
  schemaValid: boolean
  requiredLabelRecall: number
  broadRegionAccuracy: number
  safeZoneDecision: 'lower_third_available' | 'upper_third_recommended' | 'manual_review' | 'blocked' | 'unknown'
  uncertainty: 'low' | 'medium' | 'high'
  objectCount: number
  textLikeRegionCount: number
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeOomClassification {
  isCudaOom: boolean
  stage:
    | 'not_oom'
    | 'vllm_engine_initialization'
    | 'scheduler_or_kv_cache_profile'
    | 'cuda_graph_capture'
    | 'generated_fixture_inference'
    | 'unclassified_cuda_oom'
  enforceEager?: boolean
  cudaGraphLikely: boolean
  fixtureInferenceReached: boolean
  memory?: {
    requestedGiB: number
    gpuTotalGiB: number
    gpuFreeGiB: number
    processId: string
    processMemoryGiB: number
    torchAllocatedGiB: number
    torchReservedUnallocatedMiB: number
  }
  safeSummary: string
}

export interface VlmRuntimeL4TuningProfile {
  profileId: string
  description: string
  launchArgs: {
    maxModelLen: number | null
    maxNumSeqs: number
    maxNumBatchedTokens: number
    maxTokens: number
    enforceEager: boolean
    gpuMemoryUtilization: number
    mmProcessorCacheGb?: number
    cpuOffloadGb?: number
    limitMmPerPrompt: { image: 1 }
  }
  fixtureImageConstraints: {
    generatedOnly: true
    maxSizePx: number
    imageCountPerPrompt: 1
  }
  expectedMemoryEffect: string
  safetyStatus: 'allowed' | 'skipped_unsupported'
  diagnosticOnly: boolean
  fixtureIds?: VlmGeneratedFixtureId[]
  unsupportedReason?: string
}

export interface VlmRuntimeL4TuningProfileResult {
  profileId: string
  status: 'passed' | 'blocked' | 'skipped' | 'diagnostic_passed'
  diagnosticOnly: boolean
  profile: VlmRuntimeL4TuningProfile
  fixtureResults: VlmFixtureRuntimeResult[]
  runtimeVersion?: string
  blockers: string[]
  warnings: string[]
  oomClassification?: VlmRuntimeOomClassification
}

export interface VlmRuntimeL4TuningMatrixReport {
  phase: '39C'
  runId: string
  createdAt: string
  matrixId: 'l4-oom-remediation-v1'
  status: 'planned' | 'passed' | 'blocked'
  selectedProfileId?: string
  profilesDefined: VlmRuntimeL4TuningProfile[]
  profilesAttempted: VlmRuntimeL4TuningProfileResult[]
  allProfilesFailed: boolean
  fullPhase39CPassRequiresAllGeneratedFixtures: true
  minimalSmokeCompletesPhase39C: false
  blockedScopesStillBlocked: string[]
}

export interface VlmRuntimeArtifact {
  id: string
  kind: 'report' | 'fixture_image' | 'metadata'
  localPath?: string
  bucket?: string
  object?: string
  gcsUri?: string
  sizeBytes?: number
  sha256?: string
  generation?: string
  metageneration?: string
  crc32c?: string
  md5Hash?: string
}

export interface VlmRuntimePreflightReport {
  phase: '39C'
  runId: string
  activeAccount: string
  activeProject: string
  localGpuAvailable: boolean
  dockerAvailable: boolean
  stagingCloudRunRequested: boolean
  stagingCloudRunAllowed: boolean
  privateGcsReadable: boolean
  qaBucketReadable: boolean
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeExecutionReport {
  ok: boolean
  phase: '39C'
  runId: string
  createdAt: string
  sourcePhase39A: {
    pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/62'
    commit: '698410e'
    status: 'approval_planning_passed'
  }
  sourcePhase39B: Pick<ApprovedVlmModelDownloadEvidence, 'modelId' | 'revision' | 'status' | 'targetGcsPath' | 'aggregateSha256' | 'fileCount' | 'selectedTotalSizeBytes'>
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  revision: string
  privateModelPrefix: string
  runtime: {
    requestedRuntime: 'vllm'
    fallbackRuntime: 'transformers_fallback'
    runtimeStatus: VlmRuntimeQaStatus
    runtimeVersion?: string
    selectedProfileId?: string
    transformersFallbackStatus: VlmRuntimeQaStatus
    localModelPathUsed: boolean
    modelIdRuntimePathBlocked: boolean
    runtimeAutoDownloadBlocked: boolean
    providerCallsBlocked: boolean
    rawPromptsBlocked: boolean
    realMediaBlocked: boolean
    arbitraryMediaBlocked: boolean
  }
  assetVerification: VlmModelAssetVerificationReport
  generatedFixtureManifest: {
    phase: '39C'
    runId: string
    specs: VlmGeneratedFixtureSpec[]
  }
  promptTemplateManifest: {
    phase: '39C'
    runId: string
    templates: VlmPromptTemplateSpec[]
  }
  fixtureResults: VlmFixtureRuntimeResult[]
  qa: {
    status: VlmRuntimeQaStatus
    schemaValidity: number
    averageRequiredLabelRecall: number
    averageBroadRegionAccuracy: number
    gates: Array<{ gateId: string; status: VlmRuntimeQaStatus; summary: string }>
    blockers: string[]
    warnings: string[]
  }
  costMemory: {
    gpuType: 'L4'
    gpuRuntimeApprovedNow: boolean
    localGpuAvailable: boolean
    stagingCloudRunRequested: boolean
    estimatedModelBytes: number
    memoryRisk: 'high'
    costRisk: 'medium' | 'high'
    notes: string[]
    selectedProfileId?: string
    tuningMatrixStatus?: 'planned' | 'passed' | 'blocked'
  }
  l4TuningMatrix?: VlmRuntimeL4TuningMatrixReport
  artifacts: VlmRuntimeArtifact[]
  privateArtifactPrefix?: string
  vlmToolFamilyBetaStatus: VlmToolFamilyBetaStatus
  phase39DReadiness: {
    readyForControlledRealFrameVlm: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeExecutionResult {
  evidence: ApprovedVlmRuntimeEvidence
  executionReport: VlmRuntimeExecutionReport
  localReportPath: string
  localArtifactDir: string
  uploadedArtifacts: VlmRuntimeArtifact[]
}

export interface ApprovedVlmRuntimeEvidence {
  phase: '39C'
  status: 'verified' | 'blocked'
  runId: string
  modelId: 'Qwen/Qwen3-VL-8B-Instruct'
  revision: string
  modelGcsPath: string
  aggregateSha256: string
  runtime: 'vllm'
  fallbackRuntime: 'transformers_fallback'
  fixtureIds: VlmGeneratedFixtureId[]
  artifactPrefix?: string
  qaReportUri?: string
  vlmToolFamilyBetaStatus: VlmToolFamilyBetaStatus
  phase39DReadiness: {
    readyForControlledRealFrameVlm: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface VlmRuntimeStaticReportInput {
  createdAt?: string
  runId?: string
  phase39B?: ApprovedVlmModelDownloadEvidence
  selectedAssets?: VlmModelAssetRecord[]
}
