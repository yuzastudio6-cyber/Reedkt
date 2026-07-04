export type ExternalAgentToolReadinessStatus =
  | 'blocked_external_state'
  | 'auth_verified_runtime_blocked'
  | 'ready_for_explicit_tool_gate'
  | 'metadata_only'
  | 'supporting_evidence_only'
  | 'callable_cloud_side_cache_staging_runner_required_before_gpu_import_proof'
  | 'callable_cloud_side_cache_staging_runner_ready_before_gpu_import_proof'
  | 'ready_for_bounded_model_import_proof_after_private_cache_staging'
  | 'bounded_model_import_load_proof_reviewed_inference_boundary_plan_required'
  | 'bounded_inference_boundary_planned_runner_required'
  | 'bounded_inference_proof_runner_implemented_execution_prompt_required'
  | 'bounded_inference_proof_execution_attempted_failed_cleanup_verified_fix_required'
  | 'bounded_inference_proof_fix_implemented_retry_required'

export type ExternalAgentToolReadinessEntry = {
  toolId: string
  lane: string
  status: ExternalAgentToolReadinessStatus
  currentStage: string
  selectedModelOrTool: string
  selectedGpu: 'nvidia_l4' | 'not_applicable'
  scaleToZeroRequired: boolean
  readyForExternalAgentExecutionNow: boolean
  readyForBoundedRetryAfterBlockerClears: boolean
  primaryBlocker: string
  evidence: string[]
  nextAction: string
  manualBlockerActions?: ExternalAgentManualBlockerAction[]
  noIdleLifecycleGate?: ExternalAgentToolNoIdleLifecycleGate
}

export type ExternalAgentManualBlockerAction = {
  id: string
  label: string
  runInsideCodex: false
  mutatesRuntime: false
  runsModel: false
  createsAssets: false
  mutatesCloud: boolean
  mutatesLocalGcloudAuth: boolean
  mutatesLocalGcloudConfig: boolean
  changesQuotaRequest: boolean
  purpose: string
  afterCompletionCommand: string
}

export type ExternalAgentToolNoIdleLifecycleGate = {
  proofVmName: string
  selectedGpu: 'nvidia_l4'
  machineType: 'g2-standard-4' | 'g2-standard-8'
  targetRegion:
    | 'us-central1'
    | 'us-west1'
    | 'us-east4'
    | 'us-east1'
    | 'us-west4'
    | 'northamerica-northeast1'
    | 'northamerica-northeast2'
  targetZone:
    | 'us-central1-a'
    | 'us-central1-b'
    | 'us-central1-c'
    | 'us-west1-a'
    | 'us-west1-b'
    | 'us-west1-c'
    | 'us-east4-a'
    | 'us-east4-c'
    | 'us-east1-b'
    | 'us-east1-c'
    | 'us-east1-d'
    | 'us-west4-a'
    | 'us-west4-c'
    | 'northamerica-northeast1-b'
    | 'northamerica-northeast1-c'
    | 'northamerica-northeast2-a'
  minimumGlobalGpusAllRegionsQuota: 1
  minimumRegionalL4Quota: 1
  noPublicIpRequired: true
  externalIpAllowed: false
  bootDiskAutoDeleteRequired: true
  postCreateInstanceRunningWaitRequired: boolean
  postCreatePrivateOnlyRecheckRequired: boolean
  postCreateBootDiskAutoDeleteRecheckRequired: boolean
  postCreateIapLookupReadinessBackoffRequired: boolean
  postCreateIapLookupMaxAttempts: number
  postCreateIapLookupDelaySeconds: number
  durableReadinessSummaryRequired: boolean
  preExistingResourceCheckRequired: true
  deleteOnlyResourcesCreatedByPrompt: true
  cleanupVerificationRequired: true
  idleGpuAllowed: false
  vmCreateAllowedNow: false
  modelInferenceAllowedNow: false
  runtimePromptRequiredBeforeVmCreate: true
  cacheReadinessCommand: 'npm run ai-video-broll-wan-fast-cache-readiness:check'
  quotaVerificationCommand: 'npm run ai-video-broll-wan-gpu-global-quota:verify'
  nextActionAfterQuotaClears: string
}

export type ExternalAgentToolSafeNextCommand = {
  id: string
  command: string
  liveReadOnly: boolean
  mutatesRuntime: false
  runsModel: false
  createsAssets: false
  purpose: string
}

export const QWEN2_5_VL_58DW_PRIVATE_INFERENCE_BOUNDED_RETRY_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-PRIVATE-INFERENCE-BOUNDED-RETRY-PROMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation' as const
export const QWEN2_5_VL_58DW_FIX_STRUCTURED_OUTPUT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-FIX: tighten Qwen fixture structured-output generation after schema-invalid bounded retry, no generated assets/no mutation' as const
export const QWEN2_5_VL_58DW_RETRY_2_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-RETRY-2: run one bounded approved-fixture private inference retry after strict structured-output fix, no generated assets/no mutation' as const
export const QWEN2_5_VL_58DX_RESULT_REVIEW_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DX-PRIVATE-INFERENCE-RESULT-REVIEW: review bounded Qwen private inference retry metadata, no generated assets/no beta' as const
export const EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT =
  'EXTERNAL-AGENT-TOOL-EXECUTION-READY-QWEN: Qwen controlled approved-fixture private inference is ready for the explicit external-agent gate; keep beta/production blocked' as const
export const QWEN2_5_VL_58DQ_AUTH_USER_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight' as const
export const AI_VIDEO_BROLL_GEN_9K_NO_IDLE_L4_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-9K-NO-IDLE-L4-PROOF-PROMPT: prepare bounded no-idle L4 proof execution with mandatory cleanup, no VM/no inference in the planning prompt' as const
export const AI_VIDEO_BROLL_GEN_9L_NO_IDLE_L4_PROOF_EXECUTE_PROMPT =
  'AI-VIDEO-BROLL-GEN-9L-NO-IDLE-L4-PROOF-EXECUTE: run bounded no-idle L4 VM lifecycle proof with mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9L_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9L-STOCKOUT-FIX: choose approved alternate no-idle L4 proof zone or retry plan, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9M_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-9M-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-A: run bounded no-idle L4 VM lifecycle proof in us-central1-a with mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9N_NO_IDLE_L4_PROOF_EXECUTE_US_CENTRAL1_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-9N-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-C: run bounded no-idle L4 VM lifecycle proof in us-central1-c with mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9O_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-9O-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9O_RETRY_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-9O-RETRY-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: retry bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-central1-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9P_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9P-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose approved alternate no-idle L4 transfer proof zone or capacity strategy, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9Q_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Q-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-a and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9R_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9R-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-a stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9S_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_B_PROMPT =
  'AI-VIDEO-BROLL-GEN-9S-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-b and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9T_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9T-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-b stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9U_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST1_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-9U-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9V_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9V-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west1-c stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9W_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-9W-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-a and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9X_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9X-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-a stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_9Y_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST4_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Y-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_9Z_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-9Z-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-c stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10A_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST1_B_PROMPT =
  'AI-VIDEO-BROLL-GEN-10A-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-b and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10B_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10B-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-b stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10C_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST1_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-10C-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10D_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10D-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-c stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10E_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_EAST1_D_PROMPT =
  'AI-VIDEO-BROLL-GEN-10E-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-D: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-d and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10F_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10F-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-d stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10G_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-10G-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-a and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10H_IAP_WHEELHOUSE_TRANSFER_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west4-a stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10I_NO_IDLE_L4_IAP_WHEELHOUSE_TRANSFER_PROOF_US_WEST4_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-10I-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-c and mandatory cleanup, no model inference' as const
export const AI_VIDEO_BROLL_GEN_10J_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_US_WEST4_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-10J-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-US-WEST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in us-west4-c with mandatory cleanup, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10K_PAYLOAD_INSTALL_STOCKOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10K-PAYLOAD-INSTALL-STOCKOUT-FIX: choose next approved no-idle L4 payload/install-readiness proof capacity strategy after us-west4-c stockout, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10L_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_B_PROMPT =
  'AI-VIDEO-BROLL-GEN-10L-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast1-b with mandatory cleanup, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10M_PAYLOAD_INSTALL_CONFIG_AVAILABILITY_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10M-PAYLOAD-INSTALL-CONFIG-AVAILABILITY-FIX: choose next approved no-idle L4 payload/install-readiness proof strategy after northamerica-northeast1-b configuration availability failure, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10N_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST1_C_PROMPT =
  'AI-VIDEO-BROLL-GEN-10N-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast1-c with mandatory cleanup, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10O_PAYLOAD_INSTALL_RESOURCE_AVAILABILITY_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10O-PAYLOAD-INSTALL-RESOURCE-AVAILABILITY-FIX: choose next approved no-idle payload/install-readiness strategy after northamerica-northeast1-c resource availability failure, no VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10P_NO_IDLE_L4_IAP_WHEELHOUSE_PAYLOAD_INSTALL_PROOF_NORTHAMERICA_NORTHEAST2_A_PROMPT =
  'AI-VIDEO-BROLL-GEN-10P-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST2-A: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast2-a with mandatory cleanup, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10Q_IAP_OSLOGIN_ACCESS_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10Q-IAP-OSLOGIN-ACCESS-FIX: diagnose and plan no-public-IP IAP/OS Login access after northeast2-a VM create success and publickey failure, no GPU VM/no inference' as const
export const AI_VIDEO_BROLL_GEN_10R_NO_GPU_IAP_SSH_CANARY_PROMPT =
  'AI-VIDEO-BROLL-GEN-10R-NO-GPU-IAP-SSH-CANARY: run bounded no-public-IP non-GPU IAP SSH canary with the same image, target tag, proof service account, and mandatory cleanup; no GPU/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER_PROMPT =
  'AI-VIDEO-BROLL-GEN-10R-FIX-IAP-SSH-CANARY-BOUNDED-RUNNER: fix bounded no-GPU IAP SSH canary runner timeout and durable cleanup-summary capture, no GPU/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT =
  'AI-VIDEO-BROLL-GEN-10S-NO-GPU-IAP-SSH-CANARY-BOUNDED-RUNNER-EXECUTE: run the fixed bounded no-GPU IAP SSH canary with hard timeouts, durable summaries, and mandatory cleanup; no GPU/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10T_IAP_SSH_FLAG_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10T-IAP-SSH-FLAG-FIX: remove mutually exclusive IAP SSH flags from the bounded no-GPU canary runner, no VM/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10U_NO_GPU_IAP_SSH_CANARY_RERUN_PROMPT =
  'AI-VIDEO-BROLL-GEN-10U-NO-GPU-IAP-SSH-CANARY-RERUN: rerun the bounded no-GPU IAP SSH canary after removing mutually exclusive flags; no GPU/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10V_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_PROMPT =
  'AI-VIDEO-BROLL-GEN-10V-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY: retry bounded no-idle L4 payload/install readiness after no-GPU IAP SSH canary passed; mandatory cleanup, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10W_IAP_LOOKUP_READINESS_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10W-IAP-LOOKUP-READINESS-FIX: add bounded post-create IAP instance lookup readiness before the next L4 payload/install retry, no VM/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10X_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_WITH_IAP_LOOKUP_READINESS_PROMPT =
  'AI-VIDEO-BROLL-GEN-10X-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-IAP-LOOKUP-READINESS: retry bounded no-idle L4 payload/install readiness with post-create IAP lookup readiness and mandatory cleanup, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10Y_RUNNER_RAW_JSON_CLEANUP_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10Y-RUNNER-RAW-JSON-CLEANUP-FIX: fix L4 payload/install runner to parse raw describe JSON before sanitizing logs and delete prompt VM after any create attempt, no VM/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10Z_NO_IDLE_L4_PAYLOAD_INSTALL_RETRY_AFTER_RUNNER_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10Z-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-AFTER-RUNNER-FIX: retry bounded no-idle L4 payload/install readiness after raw JSON cleanup runner fix, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_10ZA_PAYLOAD_DELIVERY_TIMEOUT_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-10ZA-PAYLOAD-DELIVERY-TIMEOUT-FIX: fix B-roll L4 dependency payload delivery after IAP wheelhouse transfer timeout, no VM/no model/no inference' as const
export const AI_VIDEO_BROLL_GEN_10ZB_FIXED_DELIVERY_RETRY_PROMPT =
  'AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: retry bounded L4 payload/install readiness with fixed payload delivery, no model import/no inference' as const
export const AI_VIDEO_BROLL_GEN_11A_MODEL_IMPORT_PLAN_PROMPT =
  'AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference' as const
export const AI_VIDEO_BROLL_GEN_11B_MODEL_IMPORT_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-11B-MODEL-IMPORT-PROOF: run bounded no-idle L4 Wan model import proof, no inference' as const
export const AI_VIDEO_BROLL_GEN_11C_MODEL_IMPORT_RESULT_REVIEW_PROMPT =
  'AI-VIDEO-BROLL-GEN-11C-MODEL-IMPORT-RESULT-REVIEW: review bounded Wan model import proof result, no inference' as const
export const AI_VIDEO_BROLL_GEN_11F_INFERENCE_BOUNDARY_PLAN_PROMPT =
  'AI-VIDEO-BROLL-GEN-11F-INFERENCE-BOUNDARY-PLAN: plan bounded Wan inference proof after import/load review, no generated video' as const
export const AI_VIDEO_BROLL_GEN_11G_INFERENCE_PROOF_RUNNER_PROMPT =
  'AI-VIDEO-BROLL-GEN-11G-INFERENCE-PROOF-RUNNER: implement bounded Wan inference proof runner, no execution/no generated video' as const
export const AI_VIDEO_BROLL_GEN_11H_INFERENCE_PROOF_EXECUTE_PROMPT =
  'AI-VIDEO-BROLL-GEN-11H-INFERENCE-PROOF-EXECUTE: run bounded Wan inference proof with mandatory cleanup, no generated video/no persisted assets' as const
export const AI_VIDEO_BROLL_GEN_11I_INFERENCE_PROOF_RESULT_REVIEW_PROMPT =
  'AI-VIDEO-BROLL-GEN-11I-INFERENCE-PROOF-RESULT-REVIEW: review bounded Wan inference proof result, no generated video' as const
export const AI_VIDEO_BROLL_GEN_11H_FIX_INFERENCE_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-11H-FIX-INFERENCE-PROOF: fix blocked bounded Wan inference proof, no generated video' as const
export const AI_VIDEO_BROLL_GEN_11H_RETRY_INFERENCE_PROOF_PROMPT =
  'AI-VIDEO-BROLL-GEN-11H-RETRY-INFERENCE-PROOF: rerun bounded Wan latent inference proof with 11H fix, no generated video' as const
export const AI_VIDEO_BROLL_GEN_11D_CACHE_STAGING_STRATEGY_FIX_PROMPT =
  'AI-VIDEO-BROLL-GEN-11D-CACHE-STAGING-STRATEGY-FIX: choose approved Wan private cache staging strategy after local upload stall and private URL-list 403, no GPU/no inference' as const
export const AI_VIDEO_BROLL_GEN_11E_CLOUD_SIDE_CACHE_STAGING_RUNNER_PROMPT =
  'AI-VIDEO-BROLL-GEN-11E-CLOUD-SIDE-CACHE-STAGING-RUNNER: implement no-GPU Wan private cache staging runner, no inference/no generated video' as const
export const AI_VIDEO_BROLL_GEN_11E_EXECUTE_CLOUD_SIDE_CACHE_STAGING_PROMPT =
  'AI-VIDEO-BROLL-GEN-11E-EXECUTE-CLOUD-SIDE-CACHE-STAGING: run no-GPU Wan private cache staging runner with explicit confirmation, no inference/no generated video' as const

export const EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP = {
  decision:
    'external_agent_tool_execution_readiness_qwen_ready_broll_11h_fix_implemented_retry_required',
  mode: 'external_agent_tool_execution_readiness_rollup_only',
  paidProductionInScope: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  runtimeSideEffects: {
    modelInferenceRun: false,
    generatedVideoCreated: false,
    generatedAudioCreated: false,
    generatedAssetsCreated: false,
    cloudRunServiceMutated: false,
    cloudRunJobExecuted: false,
    computeVmCreated: false,
    dockerRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
  },
  sourceRules: {
    approvedSnapshotRequired: true,
    rawChatExecutionAllowed: false,
    aiVideoOwnsFinalCanvas: false,
    remotionOwnsFinalComposition: true,
    paidProductionReady: false,
  },
  safeNextCommands: [
    {
      id: 'static_action_plan',
      command: 'npm run external-agent-tool-action-plan',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Static ordered action plan for external agents, including per-tool safe actions, blockers, and forbidden runtime actions.',
    },
    {
      id: 'static_readiness_check',
      command: 'npm run external-agent-tool-readiness:check',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose: 'Fast static readiness and evidence presence check for all tracked external-agent tool lanes.',
    },
    {
      id: 'surface_consistency_smoke',
      command: 'npm run smoke:external-agent-tool-surface-consistency',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only smoke that compares external-agent readiness surfaces for shared manual blockers, fail-closed gates, and drift.',
    },
    {
      id: 'wrapper_callability_proof',
      command: 'npm run external-agent-tool-callability-proof',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Calls all external-agent wrappers in their currently allowed modes: Qwen/Wan preflight-only plus Sound/Supabase safe evidence-only, with runtime side effects blocked.',
    },
    {
      id: 'fail_closed_execution_gate',
      command: 'npm run external-agent-tool-execution-gate',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed static go/no-go gate for external agents before any runtime execution attempt.',
    },
    {
      id: 'live_next_command_decision',
      command: 'npm run external-agent-tool-next-command',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only live decision that combines the fail-closed gate and blocker probes into the next safe command.',
    },
    {
      id: 'live_blocker_preflight',
      command: 'npm run external-agent-tool-blockers:preflight',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only live preflight to see whether Qwen gcloud auth/service/job visibility and B-roll GPU quota blockers have cleared.',
    },
    {
      id: 'broll_gpu_global_quota_verify',
      command: 'npm run ai-video-broll-wan-gpu-global-quota:verify',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'B-roll-specific read-only verifier for GPUS_ALL_REGIONS and regional L4 quota after the manual quota request path.',
    },
    {
      id: 'gcloud_session_diagnostic',
      command: 'npm run external-agent-gcloud-session:diagnostic',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only local gcloud session diagnostic for auth/config mismatches when refreshed auth is not visible to this shell.',
    },
    {
      id: 'gcloud_account_access_diagnostic',
      command: 'npm run external-agent-gcloud-account-access:diagnostic',
      liveReadOnly: true,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Read-only local gcloud account-access diagnostic across redacted local accounts for Qwen Cloud Run and B-roll Compute quota reads.',
    },
    {
      id: 'broll_fast_cache_readiness',
      command: 'npm run ai-video-broll-wan-fast-cache-readiness:check',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Stat-only Wan private cache layout check that avoids 29GB hashing, model imports, GPU work, and inference.',
    },
    {
      id: 'broll_wan_external_agent_wrapper_static_guard',
      command: 'npm run external-agent-tool-execute-broll-wan',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed B-roll Wan wrapper static guard; execution mode requires confirmation before delegating to the bounded 11B no-inference model import/load runner.',
    },
    {
      id: 'broll_wan_private_cache_prepare_static_guard',
      command: 'npm run external-agent-tool-prepare-broll-wan-cache',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed B-roll Wan private-cache preparation wrapper; execution mode requires a separate cache-fill confirmation before staging the model cache to private GCS and still creates no VM or inference.',
    },
    {
      id: 'sound_music_audio_external_agent_wrapper_static_guard',
      command: 'npm run external-agent-tool-execute-sound',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed Sound/Music/Audio wrapper static guard; execution mode only runs static evidence diagnostics and blocks before provider, worker, storage, or media work.',
    },
    {
      id: 'supabase_local_harness_external_agent_wrapper_static_guard',
      command: 'npm run external-agent-tool-execute-supabase-harness',
      liveReadOnly: false,
      mutatesRuntime: false,
      runsModel: false,
      createsAssets: false,
      purpose:
        'Fail-closed Supabase local harness wrapper static guard; execution mode only runs no-execution config and local-harness evidence smokes before blocking live mutation.',
    },
  ] satisfies ExternalAgentToolSafeNextCommand[],
  tools: [
    {
      toolId: 'qwen2_5_vl_7b_instruct',
      lane: 'video_understanding_vlm',
      status: 'ready_for_explicit_tool_gate',
      currentStage:
        'controlled_persisted_worker_dispatch_runtime_external_agent_wrapper_rerun_result_recorded',
      selectedModelOrTool: 'Qwen/Qwen2.5-VL-7B-Instruct',
      selectedGpu: 'nvidia_l4',
      scaleToZeroRequired: true,
      readyForExternalAgentExecutionNow: true,
      readyForBoundedRetryAfterBlockerClears: true,
      primaryBlocker: 'none_explicit_gate_ready_live_preflight_required',
      evidence: [
        'docs/qwen2-5-vl-7b-58ea-external-agent-wrapper-execution-result.md',
        'docs/qwen2-5-vl-7b-58dz-external-agent-wrapper-rerun-result.md',
        'docs/external-agent-tool-live-next-command-result.md',
        'docs/qwen2-5-vl-7b-58dy-external-agent-wrapper-execution-result.md',
        'docs/qwen2-5-vl-7b-58dx-private-inference-result-review.md',
        'docs/qwen2-5-vl-7b-58dw-retry-2-result.md',
        'docs/qwen2-5-vl-7b-58dw-structured-output-fix.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md',
        'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md',
        'src/backend/mock/mock-qwen2-5-vl-58ea-external-agent-wrapper-execution-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dz-external-agent-wrapper-rerun-result.ts',
        'src/backend/mock/mock-external-agent-tool-live-next-command-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dy-external-agent-wrapper-execution-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dx-private-inference-result-review.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dw-retry-2-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-58dw-structured-output-fix.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate.ts',
        'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts',
        'docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md',
        'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts',
        'src/backend/mock/mock-external-agent-gcloud-session-diagnostic.ts',
        'src/backend/mock/mock-external-agent-gcloud-account-access-diagnostic.ts',
        'server/cli/external-agent-tool-blocker-preflight.ts',
        'server/cli/external-agent-gcloud-session-diagnostic.ts',
        'server/cli/external-agent-gcloud-account-access-diagnostic.ts',
        'server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
        'server/smoke/external-agent-gcloud-session-diagnostic-smoke.ts',
        'server/smoke/external-agent-gcloud-account-access-diagnostic-smoke.ts',
        'package_json_script:external-agent-gcloud-account-access:diagnostic',
        'server/smoke/qwen2-5-vl-58ea-external-agent-wrapper-execution-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dz-external-agent-wrapper-rerun-result-smoke.ts',
        'server/smoke/external-agent-tool-live-next-command-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dy-external-agent-wrapper-execution-result-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-bounded-retry-prompt-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dx-private-inference-result-review-smoke.ts',
        'server/smoke/qwen2-5-vl-58dw-retry-2-result-smoke.ts',
        'server/smoke/qwen2-5-vl-58dw-structured-output-fix-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-gate-alignment-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-result-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-attempt-approval-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-gate-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts',
        'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result-smoke.ts',
        'pull_request_1914_open_draft_clean',
      ],
      nextAction: EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
      manualBlockerActions: [],
    },
    {
      toolId: 'ai_video_broll_generation_wan',
      lane: 'open_source_generated_broll',
      status: 'bounded_inference_proof_fix_implemented_retry_required',
      currentStage:
        'bounded_wan_inference_proof_fix_ready_for_explicit_retry',
      selectedModelOrTool: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
      selectedGpu: 'nvidia_l4',
      scaleToZeroRequired: true,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: true,
      primaryBlocker: 'bounded_wan_inference_proof_retry_required_after_11h_fix',
      evidence: [
        'docs/ai-video-broll-gen-11h-fix-inference-proof.md',
        'src/backend/mock/mock-ai-video-broll-gen-11h-fix-inference-proof.ts',
        'server/smoke/ai-video-broll-gen-11h-fix-inference-proof-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11h-fix-inference-proof',
        'src/backend/mock/mock-external-agent-gcloud-account-access-diagnostic.ts',
        'server/cli/external-agent-gcloud-account-access-diagnostic.ts',
        'server/smoke/external-agent-gcloud-account-access-diagnostic-smoke.ts',
        'package_json_script:external-agent-gcloud-account-access:diagnostic',
        'live_summary:11h_fix_inference_proof_static_fix_ready_no_execution',
        'docs/ai-video-broll-gen-11h-inference-proof-execution-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-11h-inference-proof-execution-result.ts',
        'server/smoke/ai-video-broll-gen-11h-inference-proof-execution-result-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11h-inference-proof-execution-result',
        'live_summary:11h_inference_proof_failed_pipeline_load_timeout_cleanup_verified',
        'docs/ai-video-broll-gen-11h-inference-proof-execute.md',
        'src/backend/mock/mock-ai-video-broll-gen-11h-inference-proof-execute.ts',
        'server/cli/ai-video-broll-gen-11h-bounded-inference-proof-runner.ts',
        'server/smoke/ai-video-broll-gen-11h-inference-proof-execute-smoke.ts',
        'package_json_script:ai-video-broll-gen-11h:bounded-inference-proof-runner',
        'package_json_script:smoke:ai-video-broll-gen-11h-inference-proof-execute',
        'live_summary:11h_inference_proof_runner_static_guard_ready_execution_confirmation_required',
        'docs/ai-video-broll-gen-11g-bounded-inference-proof-runner.md',
        'src/backend/mock/mock-ai-video-broll-gen-11g-bounded-inference-proof-runner.ts',
        'server/cli/ai-video-broll-gen-11g-bounded-inference-proof-runner.ts',
        'server/smoke/ai-video-broll-gen-11g-bounded-inference-proof-runner-smoke.ts',
        'package_json_script:ai-video-broll-gen-11g:bounded-inference-proof-runner',
        'package_json_script:smoke:ai-video-broll-gen-11g-bounded-inference-proof-runner',
        'live_summary:11g_inference_proof_runner_static_guard_ready_no_execution',
        'docs/ai-video-broll-gen-11f-inference-boundary-plan.md',
        'src/backend/mock/mock-ai-video-broll-gen-11f-inference-boundary-plan.ts',
        'server/smoke/ai-video-broll-gen-11f-inference-boundary-plan-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11f-inference-boundary-plan',
        'live_summary:11f_inference_boundary_planned_runner_required_no_execution',
        'docs/ai-video-broll-gen-11c-model-import-result-review.md',
        'src/backend/mock/mock-ai-video-broll-gen-11c-model-import-result-review.ts',
        'server/smoke/ai-video-broll-gen-11c-model-import-result-review-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11c-model-import-result-review',
        'live_summary:11b_bounded_wan_model_import_load_proof_passed_cleanup_verified_no_inference',
        'docs/ai-video-broll-gen-11b-model-import-proof-execution-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-11b-model-import-proof-execution-result.ts',
        'server/smoke/ai-video-broll-gen-11b-model-import-proof-execution-result-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11b-model-import-proof-execution-result',
        'docs/ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result.ts',
        'server/smoke/ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11e-cloud-side-cache-staging-execution-result',
        'live_summary:11e_private_gcs_wan_model_cache_staged_ready_marker_created_cloud_run_job_deleted_support_files_cleaned_no_gpu_no_inference',
        'docs/ai-video-broll-gen-11e-cloud-side-cache-staging-runner.md',
        'src/backend/mock/mock-ai-video-broll-gen-11e-cloud-side-cache-staging-runner.ts',
        'server/cli/ai-video-broll-gen-11e-cloud-side-cache-staging-runner.ts',
        'server/smoke/ai-video-broll-gen-11e-cloud-side-cache-staging-runner-smoke.ts',
        'package_json_script:ai-video-broll-gen-11e:cloud-side-cache-staging-runner',
        'package_json_script:smoke:ai-video-broll-gen-11e-cloud-side-cache-staging-runner',
        'docs/ai-video-broll-gen-11d-cache-staging-strategy-fix.md',
        'src/backend/mock/mock-ai-video-broll-gen-11d-cache-staging-strategy-fix.ts',
        'server/smoke/ai-video-broll-gen-11d-cache-staging-strategy-fix-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11d-cache-staging-strategy-fix',
        'docs/ai-video-broll-gen-11c-storage-transfer-naming-test-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-11c-storage-transfer-naming-test-result.ts',
        'server/smoke/ai-video-broll-gen-11c-storage-transfer-naming-test-result-smoke.ts',
        'package_json_script:smoke:ai-video-broll-gen-11c-storage-transfer-naming-test-result',
        'docs/ai-video-broll-gen-11a-model-import-plan.md',
        'src/backend/mock/mock-ai-video-broll-gen-11a-model-import-plan.ts',
        'server/smoke/ai-video-broll-gen-11a-model-import-plan-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-11b-model-import-proof.md',
        'package_json_script:smoke:ai-video-broll-gen-11a-model-import-plan',
        'server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts',
        'src/backend/mock/mock-ai-video-broll-gen-11b-model-import-runner.ts',
        'server/smoke/ai-video-broll-gen-11b-model-import-runner-smoke.ts',
        'package_json_script:ai-video-broll-gen-11b:l4-model-import-runner',
        'package_json_script:smoke:ai-video-broll-gen-11b-model-import-runner',
        'server/cli/ai-video-broll-gen-10zb-l4-payload-install-runner.ts',
        'server/cli/external-agent-tool-execute-broll-wan.ts',
        'server/smoke/external-agent-tool-execute-broll-wan-smoke.ts',
        'docs/ai-video-broll-wan-external-agent-wrapper-execution-result.md',
        'src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-execution-result.ts',
        'server/smoke/ai-video-broll-wan-external-agent-wrapper-execution-result-smoke.ts',
        'package_json_script:smoke:ai-video-broll-wan-external-agent-wrapper-execution-result',
        'package_json_script:ai-video-broll-gen-10zb:l4-payload-install-runner',
        'live_summary:external_agent_broll_wrapper_delegated_10zb_dependency_install_passed_cleanup_verified_no_public_ip_vm',
        'docs/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10za-payload-delivery-timeout-fix-result.ts',
        'server/smoke/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10zb-no-idle-l4-payload-install-retry-with-fixed-delivery.md',
        'docs/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.ts',
        'server/smoke/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result-smoke.ts',
        'server/cli/ai-video-broll-gen-10z-l4-payload-install-runner.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10za-payload-delivery-timeout-fix.md',
        'docs/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result.ts',
        'server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts',
        'server/smoke/ai-video-broll-gen-10y-runner-raw-json-cleanup-fix-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix.md',
        'docs/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.ts',
        'server/smoke/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness.md',
        'docs/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result.ts',
        'server/smoke/ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10y-runner-raw-json-cleanup-fix.md',
        'docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.ts',
        'server/smoke/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10w-iap-lookup-readiness-fix.md',
        'docs/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result.ts',
        'server/smoke/ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry.md',
        'docs/ai-video-broll-gen-10t-iap-ssh-flag-fix-result.md',
        'src/backend/mock/mock-ai-video-broll-gen-10t-iap-ssh-flag-fix-result.ts',
        'server/smoke/ai-video-broll-gen-10t-iap-ssh-flag-fix-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10u-no-gpu-iap-ssh-canary-rerun.md',
        'docs/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10t-iap-ssh-flag-fix.md',
        'src/backend/mock/mock-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result.ts',
        'server/smoke/ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-result-smoke.ts',
        'docs/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-result.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10s-no-gpu-iap-ssh-canary-bounded-runner-execute.md',
        'src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.ts',
        'server/cli/ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner.ts',
        'server/smoke/ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner-smoke.ts',
        'docs/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.md',
        'docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md',
        'docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md',
        'docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md',
        'docs/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.md',
        'docs/ai-video-broll-gen-10m-payload-install-config-availability-fix-result.md',
        'docs/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.md',
        'docs/ai-video-broll-gen-10k-payload-install-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md',
        'docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md',
        'docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md',
        'docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.md',
        'docs/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md',
        'docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md',
        'docs/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.md',
        'docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md',
        'docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md',
        'docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md',
        'docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md',
        'docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
        'docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md',
        'docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md',
        'docs/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.md',
        'docs/ai-video-broll-gen-9l-stockout-fix-result.md',
        'docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10k-payload-install-stockout-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10m-payload-install-config-availability-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10o-payload-install-resource-availability-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10q-iap-oslogin-access-fix.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9n-no-idle-l4-proof-execute-us-central1-c.md',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9m-no-idle-l4-proof-execute-us-central1-a.md',
        'docs/ai-video-broll-wan-gpu-global-quota-verify-result.md',
        'docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md',
        'docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md',
        'docs/ai-video-broll-generation-gpu-global-quota-fix-result.md',
        'docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md',
        'docs/ai-video-broll-generation-gcp-private-cache-validate-result.md',
        'docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md',
        'src/backend/mock/mock-ai-video-broll-wan-external-agent-wrapper-blocked-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10q-iap-oslogin-access-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result.ts',
        'src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts',
        'src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify.ts',
        'src/backend/mock/mock-ai-video-broll-wan-gpu-global-quota-verify-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9k-no-idle-l4-proof-prompt.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10m-payload-install-config-availability-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10k-payload-install-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9l-stockout-fix-result.ts',
        'src/backend/mock/mock-ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.ts',
        'src/backend/mock/mock-external-agent-tool-blocker-preflight.ts',
        'server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts',
        'server/cli/ai-video-broll-wan-gpu-global-quota-verify.ts',
        'server/cli/external-agent-tool-blocker-preflight.ts',
        'server/smoke/ai-video-broll-wan-external-agent-wrapper-blocked-result-smoke.ts',
        'server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts',
        'server/smoke/ai-video-broll-wan-gpu-global-quota-verify-smoke.ts',
        'server/smoke/ai-video-broll-gen-9k-no-idle-l4-proof-prompt-smoke.ts',
        'server/smoke/ai-video-broll-gen-10m-payload-install-config-availability-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10k-payload-install-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9l-stockout-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10q-iap-oslogin-access-fix-result-smoke.ts',
        'server/smoke/ai-video-broll-gen-10r-no-gpu-iap-ssh-canary-result-smoke.ts',
        'docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md',
        'server/smoke/external-agent-tool-blocker-preflight-smoke.ts',
        'server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py',
      ],
      nextAction: AI_VIDEO_BROLL_GEN_11H_RETRY_INFERENCE_PROOF_PROMPT,
      manualBlockerActions: [],
      noIdleLifecycleGate: {
        proofVmName: 'reeditpro-ai-broll-wan-l4-proof',
        selectedGpu: 'nvidia_l4',
        machineType: 'g2-standard-8',
        targetRegion: 'northamerica-northeast2',
        targetZone: 'northamerica-northeast2-a',
        minimumGlobalGpusAllRegionsQuota: 1,
        minimumRegionalL4Quota: 1,
        noPublicIpRequired: true,
        externalIpAllowed: false,
        bootDiskAutoDeleteRequired: true,
        postCreateInstanceRunningWaitRequired: true,
        postCreatePrivateOnlyRecheckRequired: true,
        postCreateBootDiskAutoDeleteRecheckRequired: true,
        postCreateIapLookupReadinessBackoffRequired: true,
        postCreateIapLookupMaxAttempts: 8,
        postCreateIapLookupDelaySeconds: 10,
        durableReadinessSummaryRequired: true,
        preExistingResourceCheckRequired: true,
        deleteOnlyResourcesCreatedByPrompt: true,
        cleanupVerificationRequired: true,
        idleGpuAllowed: false,
        vmCreateAllowedNow: false,
        modelInferenceAllowedNow: false,
        runtimePromptRequiredBeforeVmCreate: true,
        cacheReadinessCommand: 'npm run ai-video-broll-wan-fast-cache-readiness:check',
        quotaVerificationCommand: 'npm run ai-video-broll-wan-gpu-global-quota:verify',
        nextActionAfterQuotaClears:
          AI_VIDEO_BROLL_GEN_11H_RETRY_INFERENCE_PROOF_PROMPT,
      },
    },
    {
      toolId: 'sound_music_audio',
      lane: 'sound_music_audio_planning',
      status: 'metadata_only',
      currentStage: 'mock_dry_run_local_fixture_handoff_evidence_external_agent_wrapper_blocked_result_recorded',
      selectedModelOrTool: 'planning_metadata_only',
      selectedGpu: 'not_applicable',
      scaleToZeroRequired: false,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker: 'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
      evidence: [
        'docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md',
        'docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md',
        'docs/sound-oss-tools-15-post-archive-handoff-review.md',
        'docs/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result.md',
        'docs/sound-music-audio-external-agent-wrapper-blocked-result.md',
        'src/backend/mock/mock-sound-music-audio-external-agent-wrapper-blocked-result.ts',
        'server/smoke/sound-music-audio-external-agent-wrapper-blocked-result-smoke.ts',
        'server/cli/external-agent-tool-execute-sound.ts',
        'server/smoke/external-agent-tool-execute-sound-smoke.ts',
      ],
      nextAction: 'continue only after runtime owner evidence accepts real execution paths',
    },
    {
      toolId: 'supabase_local_fixture_harness',
      lane: 'source_of_truth_and_private_artifact_support',
      status: 'supporting_evidence_only',
      currentStage: 'supporting_local_fixture_harness_evidence_external_agent_wrapper_blocked_result_recorded',
      selectedModelOrTool: 'not_applicable',
      selectedGpu: 'not_applicable',
      scaleToZeroRequired: false,
      readyForExternalAgentExecutionNow: false,
      readyForBoundedRetryAfterBlockerClears: false,
      primaryBlocker: 'not_a_model_or_media_execution_lane_on_this_branch',
      evidence: [
        'approved_snapshot_private_path_manifest_checksum_policy_referenced_by_tool_rollups',
        'supabase/config.toml',
        'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-config-verify-report.md',
        'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
        'docs/supabase-local-harness-external-agent-wrapper-blocked-result.md',
        'src/backend/mock/mock-supabase-local-harness-external-agent-wrapper-blocked-result.ts',
        'server/smoke/supabase-local-harness-external-agent-wrapper-blocked-result-smoke.ts',
        'server/cli/external-agent-tool-execute-supabase-harness.ts',
        'server/smoke/external-agent-tool-execute-supabase-harness-smoke.ts',
      ],
      nextAction: 'use as source-of-truth evidence only; do not mutate live Supabase from this rollup',
    },
  ] satisfies ExternalAgentToolReadinessEntry[],
  recommendedNextPrompt:
    AI_VIDEO_BROLL_GEN_11H_RETRY_INFERENCE_PROOF_PROMPT,
} as const

export type ExternalAgentToolExecutionReadinessRollup =
  typeof EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP
