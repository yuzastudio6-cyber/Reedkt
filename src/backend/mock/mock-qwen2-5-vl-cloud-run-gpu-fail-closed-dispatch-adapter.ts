import {
  QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT,
  runQwen25VlCloudRunGpuFailClosedDispatchAdapter,
} from '../workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_DISPATCH_READINESS } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-dispatch-readiness'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'

const adapterResult = runQwen25VlCloudRunGpuFailClosedDispatchAdapter()

export const QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_fail_closed_dispatch_adapter',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_fail_closed_dispatch_adapter_refused_no_cloud_run_invocation',
  upstreamReadinessDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_DISPATCH_READINESS.decision,
  upstreamQueueContractDecision:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.decision,
  adapterContract: QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT,
  adapterResult,
  acceptedInputs: [
    'validated_runWorkerJobSchema_queue_envelope',
    'approved_snapshot_runtime_payload',
    'credit_reservation_reference',
    'queue_lease_reference',
    'idempotency_key',
    'private_source_of_truth_refs'
  ],
  refusedInputs: [
    'invalid_queue_contract',
    'raw_prompt_payload',
    'signed_url_source_of_truth',
    'public_url_source_of_truth',
    'enabled_runtime_gate',
    'model_policy_mismatch',
    'missing_approved_snapshot',
    'missing_credit_reservation',
    'missing_queue_lease'
  ],
  requiredBeforeEnablingCloudRunInvocation: [
    'backend_dispatch_route_for_qwen_worker',
    'service_role_transactional_job_claim_and_lease',
    'backend_idempotency_conflict_enforcement',
    'private_cloud_run_service_to_service_invocation_auth',
    'approved_snapshot_hash_verification',
    'credit_reservation_verification',
    'failure_release_or_refund_policy',
    'observability_for_dispatch_attempts_and_results'
  ],
  runtimeFlags: {
    adapterImplemented: true,
    adapterInvokedLocally: true,
    validQueueFixtureRefusedFailClosed: true,
    invalidQueueFixtureRefusedBeforeRuntime: true,
    dispatchSubmitted: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
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
    'QWEN2_5_VL_STACK_TOOL_35-CLOUD-RUN-GPU-PRIVATE-INVOKE-PLAN: plan private Cloud Run invocation transport for Qwen dispatch adapter, no invocation'
} as const

export type Qwen25VlCloudRunGpuFailClosedDispatchAdapter =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER
