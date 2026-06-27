import {
  createQwen25VlPrivateInvokeConfigCandidate,
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT,
  validateQwen25VlPrivateInvokeConfigCandidate,
} from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-plan'

const validCandidate = createQwen25VlPrivateInvokeConfigCandidate()
const validCandidateValidation = validateQwen25VlPrivateInvokeConfigCandidate(validCandidate)
const invocationEnabledValidation = validateQwen25VlPrivateInvokeConfigCandidate(
  createQwen25VlPrivateInvokeConfigCandidate({ invocationEnabledNow: true })
)
const storedUrlValidation = validateQwen25VlPrivateInvokeConfigCandidate(
  createQwen25VlPrivateInvokeConfigCandidate({ serviceUrlValueStoredInRepo: true })
)

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_private_invoke_config_contract',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_contract_defined_no_invocation',
  upstreamPrivateInvokePlanDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN.decision,
  configContract: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT,
  validCandidate,
  validationResults: {
    validCandidate: validCandidateValidation,
    invocationEnabledCandidate: invocationEnabledValidation,
    storedUrlCandidate: storedUrlValidation
  },
  configBoundaries: {
    backendOnly: true,
    frontendReadable: false,
    serviceUrlStoredInRepo: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    invocationEnabledNow: false
  },
  blockedConfigBypasses: [
    'stored_concrete_service_url',
    'stored_identity_token',
    'stored_key_material',
    'frontend_runtime_config_exposure',
    'invocation_enabled_before_backend_runtime',
    'retry_enabled_before_idempotency_policy',
    'timeout_above_service_bound',
    'body_limit_above_runtime_contract'
  ],
  runtimeFlags: {
    privateInvokeConfigContractDefined: true,
    configValidationImplemented: true,
    validConfigCandidateAcceptedForFutureRuntime: true,
    unsafeConfigCandidatesRejected: true,
    configValuesReadNow: false,
    serviceUrlStoredInRepo: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    dispatchSubmitted: false,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    promptProcessed: false,
    forwardPassRun: false,
    inferenceRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_37-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG-SMOKE: run private invocation config contract smoke, no invocation'
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeConfig =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG
