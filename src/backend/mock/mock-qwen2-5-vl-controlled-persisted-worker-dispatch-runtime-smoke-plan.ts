import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_plan_recorded_smoke_execution_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BQ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-EXECUTION: run controlled persisted Qwen worker dispatch runtime smoke, no Cloud Run invocation/no inference/no assets/no beta' as const

const implementation = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_plan_only',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeImplementationDecision:
    implementation.decision,
  selectedRuntime: implementation.selectedRuntime,
  plannedSmoke: {
    smokeId: 'mock-reference-only-qwen-controlled-persisted-runtime-smoke',
    scope: 'controlled_persisted_runtime_fail_closed_shape_validation_only',
    environment: 'local_typescript_or_owner_approved_non_production_only',
    sourceOfTruthPath: [
      'structured_agent_findings',
      'edit_intents',
      'approved_plan_snapshot_ref',
      'credit_reservation_ref',
      'private_manifest_ref',
      'checksum_ref',
      'persisted_worker_job',
    ],
    executionPath: [
      'runWorkerJobSchema',
      'local_queue_contract',
      'idempotency_check',
      'backend_lease_boundary',
      'qwen_dispatch_adapter',
      'private_invoke_envelope',
      'private_invoke_transport_preview',
      'qa_audit_cost_credit_boundary',
      'cleanup_boundary',
    ],
  },
  runtimeSmokeAssertions: [
    {
      id: 'default_runtime_path',
      plannedStatus: 'blocked_real_lease_backend_required',
      requiredEvidence:
        'Default runtime stops at the backend/service-role lease requirement before adapter or transport checks.',
    },
    {
      id: 'adapter_preview_path',
      plannedStatus: 'blocked_qwen_dispatch_adapter_fail_closed',
      requiredEvidence:
        'Preview continuation reaches the fail-closed Qwen dispatch adapter without submitting dispatch.',
    },
    {
      id: 'transport_preview_path',
      plannedStatus: 'blocked_private_invoke_transport_preview_only',
      requiredEvidence:
        'Preview continuation reaches private invoke transport preview without resolving URLs, fetching identity tokens, or calling dependencies.',
    },
    {
      id: 'idempotency_conflict_path',
      plannedStatus: 'blocked_idempotency_conflict',
      requiredEvidence:
        'Runtime blocks a duplicate idempotency key with a conflicting source id.',
    },
    {
      id: 'missing_approved_snapshot_path',
      plannedStatus: 'blocked_missing_approved_snapshot',
      requiredEvidence:
        'Runtime blocks missing approved plan snapshot refs before idempotency, lease, adapter, or transport checks.',
    },
    {
      id: 'missing_credit_reservation_path',
      plannedStatus: 'blocked_missing_credit_reservation',
      requiredEvidence:
        'Runtime blocks missing credit reservation refs before idempotency, lease, adapter, or transport checks.',
    },
    {
      id: 'missing_source_of_truth_refs_path',
      plannedStatus: 'blocked_missing_source_of_truth_refs',
      requiredEvidence:
        'Runtime blocks missing private source-of-truth refs and signed/public URL source-of-truth attempts.',
    },
    {
      id: 'invalid_worker_job_schema_path',
      plannedStatus: 'blocked_invalid_worker_job_schema',
      requiredEvidence:
        'Runtime blocks invalid worker job envelopes before local queue or runtime checks.',
    },
    {
      id: 'runtime_step_coverage',
      plannedStatus: 'metadata_only_coverage_required',
      requiredEvidence:
        'Smoke observes all runtime step ids from schema validation through cleanup boundary.',
    },
    {
      id: 'side_effect_gate_coverage',
      plannedStatus: 'all_side_effects_false',
      requiredEvidence:
        'Smoke proves Cloud Run invocation, inference, Supabase mutation, generated assets, signed URLs, credits, beta, and production remain false.',
    },
  ],
  requiredRuntimeStatuses: [
    'blocked_invalid_worker_job_schema',
    'blocked_missing_approved_snapshot',
    'blocked_missing_credit_reservation',
    'blocked_missing_source_of_truth_refs',
    'blocked_idempotency_conflict',
    'blocked_real_lease_backend_required',
    'blocked_qwen_dispatch_adapter_fail_closed',
    'blocked_private_invoke_transport_preview_only',
  ],
  blockedBypasses: [
    'raw_chat_worker_input',
    'raw_prompt_payload_fields',
    'raw_model_output_persistence',
    'signed_url_source_of_truth',
    'public_url_source_of_truth',
    'frontend_browser_invocation',
    'direct_cloud_run_service_url_exposure',
    'token_or_bearer_header_persistence',
    'provider_secret_persistence',
    'service_role_key_value_persistence',
    'database_url_persistence',
    'duplicate_active_worker_claims',
    'missing_credit_reservation',
    'missing_approved_snapshot',
    'missing_private_storage_checksum_manifest',
    'generated_asset_row_before_qa_storage_acceptance',
    'beta_or_production_readiness_claim',
  ],
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeImplementationRequired: false,
    controlledPersistedWorkerDispatchRuntimeImplemented: true,
    controlledPersistedWorkerDispatchRuntimeSmokePlanRequired: false,
    controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded: true,
    controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired: true,
    controlledPersistedWorkerDispatchRuntimeSmokeExecuted: false,
    readyForRealWorkerDispatch: false,
    privateInvokeReady: false,
    realJobCreated: false,
    realLeaseClaimed: false,
    idempotencyRowCreated: false,
    jobEventCreated: false,
    backendRuntimeMessageCreated: false,
    workerClaimCreated: false,
    storageObjectRecordCreated: false,
    signedUrlEventCreated: false,
    qaReportCreated: false,
    auditEventCreated: false,
    creditMutationCreated: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    authHeaderCreated: false,
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
    mediaProcessingRun: false,
    renderExportRun: false,
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeSmokePlan =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN
