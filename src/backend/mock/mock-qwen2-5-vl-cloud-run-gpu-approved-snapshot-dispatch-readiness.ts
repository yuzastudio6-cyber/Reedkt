import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

export type Qwen25VlDispatchReadinessStatus = 'blocked_backend_runtime_missing'

export type Qwen25VlDispatchReadinessBlocker =
  | 'backend_dispatch_route_missing'
  | 'service_role_lease_claim_missing'
  | 'idempotency_backend_enforcement_missing'
  | 'private_cloud_run_invocation_not_wired'
  | 'supabase_queue_mutation_not_enabled'
  | 'credit_mutation_not_enabled'
  | 'qwen_specific_dispatch_adapter_missing'
  | 'qwen_inference_disabled'

export interface Qwen25VlDispatchReadinessResult {
  status: Qwen25VlDispatchReadinessStatus
  localQueueContractValid: boolean
  acceptedForDispatchReadinessPlanning: boolean
  readyForRealDispatch: false
  dispatchAllowedNow: false
  cloudRunInvocationAllowedNow: false
  inferenceAllowedNow: false
  blockers: Qwen25VlDispatchReadinessBlocker[]
}

export function evaluateQwen25VlDispatchReadiness(): Qwen25VlDispatchReadinessResult {
  return {
    status: 'blocked_backend_runtime_missing',
    localQueueContractValid: true,
    acceptedForDispatchReadinessPlanning: true,
    readyForRealDispatch: false,
    dispatchAllowedNow: false,
    cloudRunInvocationAllowedNow: false,
    inferenceAllowedNow: false,
    blockers: [
      'backend_dispatch_route_missing',
      'service_role_lease_claim_missing',
      'idempotency_backend_enforcement_missing',
      'private_cloud_run_invocation_not_wired',
      'supabase_queue_mutation_not_enabled',
      'credit_mutation_not_enabled',
      'qwen_specific_dispatch_adapter_missing',
      'qwen_inference_disabled'
    ]
  }
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_DISPATCH_READINESS = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_approved_snapshot_dispatch_readiness',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_dispatch_readiness_audited_no_dispatch',
  dispatchReadinessStatus: 'blocked_backend_runtime_missing',
  upstreamContracts: {
    localQueueContractDecision:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.decision,
    runtimeContractDecision:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.decision,
    runtimeSchemaVersion:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion,
    localQueueFixtureAcceptedForFutureDispatch:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.runtimeFlags
        .validQueueFixtureAcceptedForFutureDispatch
  },
  qwenWorkerIdentity: {
    workerType: 'qwen2_5_vl_cloud_run_gpu_worker',
    jobType: 'media_analysis',
    workerKind: 'qa',
    runtimeKind: 'qa_worker',
    runtimeTarget: 'cloud_run_gpu_service',
    gpu: 'nvidia-l4',
    servingProfile: 'bounded_preview_scale_to_zero'
  },
  workerRuntimeSurfaces: [
    {
      id: 'runWorkerJobSchema',
      file: 'server/validation/worker-schemas.ts',
      requiredForDispatch: true,
      currentStatus: 'available_for_queue_envelope_validation'
    },
    {
      id: 'JobRuntimeQueueItem',
      file: 'src/types/job-runtime.ts',
      requiredForDispatch: true,
      currentStatus: 'available_for_queue_item_shape'
    },
    {
      id: 'checkJobRuntimeGates',
      file: 'src/backend/services/job-gate-service.ts',
      requiredForDispatch: true,
      currentStatus: 'available_for_mock_gate_checks'
    },
    {
      id: 'claimWorkerLeaseMock',
      file: 'src/backend/runtime/worker-lease-service.ts',
      requiredForDispatch: true,
      currentStatus: 'mock_only_real_service_role_claim_missing'
    },
    {
      id: 'idempotencyService',
      file: 'src/backend/runtime/idempotency-service.ts',
      requiredForDispatch: true,
      currentStatus: 'mock_only_backend_enforcement_missing'
    },
    {
      id: 'dispatchMockWorkerJob',
      file: 'src/backend/services/worker-dispatch-service.ts',
      requiredForDispatch: false,
      currentStatus: 'generic_mock_placeholder_not_qwen_execution_path'
    }
  ],
  dispatchGateFixture: {
    workspaceId: 'workspace_mock_qwen_queue_001',
    projectId: 'project_mock_qwen_queue_001',
    workerKind: 'qa',
    workerRuntimeKind: 'qa_worker',
    requiresBackendRuntime: true,
    mockSafe: false,
    expectedBlockReason: 'backend_runtime_missing'
  },
  requiredBeforeRealDispatch: [
    'backend_dispatcher_route_for_qwen_worker',
    'service_role_transactional_job_claim_and_lease',
    'worker_heartbeat_renewal_completion_failure_and_stale_recovery',
    'backend_idempotency_conflict_enforcement',
    'approved_plan_snapshot_hash_verification',
    'credit_reservation_verification_and_failure_release_policy',
    'private_source_of_truth_reference_resolution',
    'private_cloud_run_service_to_service_invocation_auth',
    'qwen_specific_dispatch_adapter',
    'observability_for_dispatch_lease_response_failure_and_retry',
    'backend_only_secret_and_service_account_policy'
  ],
  currentBlockers: [
    {
      id: 'backend_dispatch_route_missing',
      owner: 'WORKER_RUNTIME_JOBS',
      executionAllowedNow: false
    },
    {
      id: 'service_role_lease_claim_missing',
      owner: 'WORKER_RUNTIME_JOBS',
      executionAllowedNow: false
    },
    {
      id: 'idempotency_backend_enforcement_missing',
      owner: 'WORKER_RUNTIME_JOBS',
      executionAllowedNow: false
    },
    {
      id: 'private_cloud_run_invocation_not_wired',
      owner: 'WORKER_RUNTIME_JOBS',
      executionAllowedNow: false
    },
    {
      id: 'supabase_queue_mutation_not_enabled',
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      executionAllowedNow: false
    },
    {
      id: 'credit_mutation_not_enabled',
      owner: 'BILLING_STRIPE_CREDITS',
      executionAllowedNow: false
    },
    {
      id: 'qwen_specific_dispatch_adapter_missing',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      executionAllowedNow: false
    },
    {
      id: 'qwen_inference_disabled',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      executionAllowedNow: false
    }
  ],
  blockedBypasses: [
    'dispatch_without_approved_snapshot',
    'dispatch_without_credit_reservation',
    'dispatch_without_queue_lease',
    'raw_chat_or_raw_prompt_dispatch',
    'signed_url_source_of_truth_dispatch',
    'enabled_runtime_gate_dispatch',
    'model_policy_mismatch_dispatch',
    'generic_worker_completion_substitution'
  ],
  runtimeFlags: {
    dispatchReadinessAudited: true,
    localQueueContractValid: true,
    acceptedForDispatchReadinessPlanning: true,
    readyForRealDispatch: false,
    backendRuntimeRequired: true,
    backendRuntimeAvailable: false,
    workerDispatchAdapterImplemented: false,
    realLeaseClaimAllowedNow: false,
    idempotencyBackendEnforced: false,
    cloudRunInvocationAllowedNow: false,
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
    'QWEN2_5_VL_STACK_TOOL_34-CLOUD-RUN-GPU-FAIL-CLOSED-DISPATCH-ADAPTER: add a Qwen-specific fail-closed dispatch adapter, no Cloud Run invocation'
} as const

export type Qwen25VlCloudRunGpuApprovedSnapshotDispatchReadiness =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_DISPATCH_READINESS
