import type { VlmModelApprovalPolicy } from './vlm-model-approval-types'

export const vlmModelApprovalPolicy: VlmModelApprovalPolicy = {
  phase: '39A',
  track: 'B',
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  approvedPlanningScope: 'track_b_vlm_model_runtime_approval_planning',
  phase39BPlanningAllowed: true,
  phase39CPlanningAllowed: true,
  phase39DPlanningAllowed: true,
  phase39EPlanningAllowed: true,
  modelDownloadAllowed: false,
  tokenizerDownloadAllowed: false,
  processorDownloadAllowed: false,
  runtimeExecutionAllowed: false,
  vllmExecutionAllowed: false,
  transformersExecutionAllowed: false,
  sglangExecutionAllowed: false,
  gpuJobAllowed: false,
  mediaProcessingAllowed: false,
  imageProcessingAllowed: false,
  videoProcessingAllowed: false,
  arbitraryFileProcessingAllowed: false,
  providerAllowed: false,
  publicOutputAllowed: false,
  gcpMutationAllowed: false,
  iamMutationAllowed: false,
  cloudRunDeployAllowed: false,
  dockerBuildPushAllowed: false,
  trackAExecutionAllowed: false,
  productionReadyAllowed: false,
  internalBetaAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
}

export const PHASE39A_VLM_EXPECTED_ARTIFACTS = [
  'phase_39a_vlm_model_approval_plan.json',
  'phase_39a_vlm_candidate_registry.json',
  'phase_39a_vlm_source_evidence.json',
  'phase_39a_vlm_license_evidence.json',
  'phase_39a_vlm_runtime_support_evidence.json',
  'phase_39a_vlm_storage_plan.json',
  'phase_39a_vlm_download_handoff_plan.json',
  'phase_39a_vlm_runtime_handoff_plan.json',
  'phase_39a_vlm_generated_fixture_plan.json',
  'phase_39a_vlm_controlled_real_frame_plan.json',
  'phase_39a_vlm_tool_planning_integration_plan.json',
  'phase_39a_vlm_privacy_security_policy_report.json',
  'phase_39a_vlm_gpu_cost_risk_report.json',
  'phase_39a_vlm_approval_blocker_report.json',
  'phase_39a_vlm_model_approval_report.json',
] as const

export const PHASE39A_VLM_BLOCKED_SCOPES = [
  'Qwen3-VL model weight download',
  'Qwen3-VL tokenizer download',
  'Qwen3-VL processor download',
  'vLLM runtime execution',
  'Transformers runtime execution',
  'SGLang runtime execution',
  'runtime model auto-download',
  'GPU jobs',
  'image processing',
  'video processing',
  'real media processing',
  'arbitrary file processing',
  'public artifact paths',
  'signed URLs as source of truth',
  'provider calls',
  'GCP or IAM mutation',
  'Cloud Run deploy',
  'Docker build or push',
  'Track A execution/runtime code',
  'beta readiness',
  'production readiness',
  'broad real user media',
]

export const PHASE39A_VLM_FUTURE_CONFIRMATIONS = {
  phase39B: [
    'REEDITPRO_CONFIRM_VLM_MODEL_DOWNLOAD=true',
    'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_UPLOAD=true',
  ],
  phase39C: [
    'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ=true',
    'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true',
    'REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD=true',
  ],
  phase39D: [
    'REEDITPRO_CONFIRM_CONTROLLED_REAL_FRAME_VLM_EXECUTE=true',
    'REEDITPRO_CONFIRM_CONTROLLED_REAL_FRAME_VLM_ARTIFACT_UPLOAD=true',
    'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ=true',
    'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true',
  ],
} as const

export function validateVlmModelApprovalPhaseSafety(input: {
  modelDownloadConfirmation?: string
  runtimeExecuteConfirmation?: string
  privateUploadConfirmation?: string
  controlledRealFrameExecuteConfirmation?: string
  gpuJobEnabled?: string
  mediaInput?: string
  publicOutputEnabled?: string
  signedUrl?: string
  gcpMutationEnabled?: string
  trackAExecutionEnabled?: string
  productionReady?: string
  externalBetaReady?: string
}): { allowed: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []

  if (input.modelDownloadConfirmation === 'true') blockers.push('Phase 39A blocks REEDITPRO_CONFIRM_VLM_MODEL_DOWNLOAD; model downloads are Phase 39B only.')
  if (input.runtimeExecuteConfirmation === 'true') blockers.push('Phase 39A blocks REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE; vLLM/Transformers execution is Phase 39C or later only.')
  if (input.privateUploadConfirmation === 'true') blockers.push('Phase 39A blocks private model/artifact upload; GCS upload is a future confirmed phase only.')
  if (input.controlledRealFrameExecuteConfirmation === 'true') blockers.push('Phase 39A blocks controlled real-frame VLM execution; Phase 39D must gate that separately.')
  if (input.gpuJobEnabled === 'true') blockers.push('Phase 39A blocks GPU jobs.')
  if (input.gcpMutationEnabled === 'true') blockers.push('Phase 39A blocks GCP/IAM mutation.')
  if (input.trackAExecutionEnabled === 'true') blockers.push('Phase 39A blocks Track A execution/runtime code.')
  if (input.productionReady === 'true') blockers.push('Phase 39A cannot mark production ready.')
  if (input.externalBetaReady === 'true') blockers.push('Phase 39A cannot mark external beta ready.')
  if (input.publicOutputEnabled === 'true') blockers.push('Phase 39A blocks public output.')
  if (input.mediaInput) blockers.push('Phase 39A accepts no image, video, media, or arbitrary file input.')
  if (input.signedUrl) blockers.push('Phase 39A blocks signed URLs and public URLs as source evidence inputs.')

  warnings.push('Phase 39A is metadata-only approval evidence; later phases must revalidate current official model/runtime evidence before download or runtime.')
  return { allowed: blockers.length === 0, blockers, warnings }
}
