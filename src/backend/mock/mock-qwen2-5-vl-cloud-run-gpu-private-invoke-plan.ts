import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER } from './mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_private_invoke_transport_plan',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_transport_planned_no_invocation',
  upstreamAdapterDecision: QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER.decision,
  targetService: {
    project: 'reeditpro',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    runtimeIdentity: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    gpu: 'nvidia-l4',
    cpu: 8,
    memory: '32Gi',
    minInstances: 0,
    maxInstances: 1,
    concurrency: 1,
    timeoutSeconds: 900,
    publicUnauthenticatedAccess: false,
    ingress: 'internal-and-cloud-load-balancing',
    serviceUrlStoredInRepo: false,
    serviceUrlResolvedByBackendOnly: true
  },
  futureAuthRequirements: [
    'backend_controlled_runtime',
    'minimal_cloud_run_invoker_permission',
    'runtime_google_signed_identity_token',
    'audience_matches_receiving_service_or_custom_audience',
    'serverless_auth_header',
    'no_checked_in_keys',
    'no_frontend_tokens',
    'no_unauthenticated_access'
  ],
  futureRequestShape: {
    method: 'POST',
    path: 'root_service_handler',
    contentType: 'application/json',
    maxBodyBytes: 65536,
    schemaVersion:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion,
    auth: 'backend_acquired_identity_token',
    retriesEnabledNow: false
  },
  invocationPrerequisites: [
    'qwen_dispatch_adapter_connected_to_backend_runtime_route',
    'transactional_queue_mutation_and_lease_claim',
    'credit_reservation_verified_before_invocation',
    'approved_plan_snapshot_hash_verified_before_invocation',
    'private_source_of_truth_refs_resolved',
    'minimal_invoker_permission_granted_to_approved_caller',
    'service_url_or_custom_audience_resolved_from_backend_config_only',
    'observability_records_dispatch_attempt_response_failure_and_retry_decision',
    'failure_handling_can_release_or_refund_without_double_spend',
    'runtime_remains_fail_closed_when_inference_gate_is_false'
  ],
  blockedBypasses: [
    'direct_frontend_invocation',
    'unauthenticated_invocation',
    'public_ingress_relaxation',
    'stored_service_account_keys',
    'checked_in_tokens_or_credentials',
    'signed_url_source_of_truth_payloads',
    'public_url_media_inputs',
    'raw_prompt_payloads',
    'generic_mock_dispatch_completion_substitution',
    'retry_without_idempotency',
    'credit_spend_without_verified_response_handling'
  ],
  runtimeFlags: {
    privateInvokePlanDefined: true,
    targetServiceRecorded: true,
    idTokenAudienceRequirementRecorded: true,
    ingressRequirementRecorded: true,
    iamInvokerRequirementRecorded: true,
    serviceUrlStoredInRepo: false,
    gcloudCommandRun: false,
    iamBindingCreated: false,
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
    'QWEN2_5_VL_STACK_TOOL_36-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG: define backend-only private invocation config contract, no invocation'
} as const

export type Qwen25VlCloudRunGpuPrivateInvokePlan =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_PLAN
