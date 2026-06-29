import { QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT } from './mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN } from './mock-qwen2-5-vl-backend-runtime-persistence-plan'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW } from './mock-qwen2-5-vl-backend-runtime-persistence-schema-draft-review'
import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW } from './mock-qwen2-5-vl-backend-runtime-persistence-active-migration-remote-satisfaction-review'

export const QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_runtime_persistence_to_worker_dispatch_readiness_review',
  decision:
    'qwen2_5_vl_runtime_persistence_to_worker_dispatch_readiness_review_accepted_controlled_persisted_dispatch_smoke_plan_required',
  upstreamRemoteSatisfactionReviewDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_REMOTE_SATISFACTION_REVIEW.decision,
  upstreamControlledBackendDispatchDryRunDecision:
    QWEN2_5_VL_CONTROLLED_BACKEND_DISPATCH_DRY_RUN_RESULT.decision,
  upstreamBackendRuntimePersistencePlanDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_PLAN.decision,
  upstreamBackendRuntimePersistenceSchemaDraftReviewDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_SCHEMA_DRAFT_REVIEW.decision,
  reviewedInputs: {
    remoteSatisfactionReviewDoc:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-remote-satisfaction-review.md',
    activeMigration: 'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
    qwenSqlTests: 'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
    backendRuntimePersistencePlanDoc:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-plan.md',
    backendRuntimePersistenceSchemaDraftReviewDoc:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-schema-draft-review.md',
    failClosedDispatchCoordinatorDoc:
      'docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md',
    controlledBackendDispatchDryRunSpec:
      'src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts',
  },
  docsContext: {
    supabaseChangelogChecked: true,
    supabaseRlsGuidanceChecked: true,
    supabaseStorageAccessControlGuidanceChecked: true,
    dataApiExposureStillRequiresOwnerReviewForNewTables: true,
  },
  readinessEvidence: {
    noDeployMigrationSatisfactionAccepted: true,
    remoteQwenMigrationVersion: '20260628000100',
    activeMigrationLocalValidationPassed: true,
    qwenLocalSqlTestsPassed: true,
    reusesExistingRuntimeSurfaces: true,
    parallelQwenQueueSchemaRejected: true,
    controlledDispatchDryRunOutcomesCovered: [
      'blocked_invalid_worker_job_schema',
      'blocked_missing_approved_snapshot',
      'blocked_missing_credit_reservation',
      'blocked_missing_source_of_truth_refs',
      'blocked_idempotency_conflict',
      'blocked_real_lease_backend_required',
      'blocked_qwen_dispatch_adapter_fail_closed',
      'blocked_private_invoke_transport_preview_only',
    ],
  },
  dispatchReadinessAreas: [
    {
      id: 'approved_snapshot_refs',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Immutable approved snapshot refs are required before Qwen dispatch.',
      stillBlocked: 'real_approved_snapshot_mutation',
    },
    {
      id: 'jobs',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Existing jobs surfaces are reused with Qwen worker/job type guards.',
      stillBlocked: 'real_job_creation',
    },
    {
      id: 'job_events',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Sanitized event summaries are required.',
      stillBlocked: 'real_job_event_creation',
    },
    {
      id: 'worker_runtime_configs',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Qwen config refs remain backend-only L4 scale-to-zero metadata.',
      stillBlocked: 'runtime_config_mutation',
    },
    {
      id: 'worker_leases',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'One-active-lease and stale recovery boundaries are represented.',
      stillBlocked: 'real_lease_claim_heartbeat_release',
    },
    {
      id: 'worker_job_claims',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'One-active-worker-claim semantics are represented.',
      stillBlocked: 'real_worker_claim_creation',
    },
    {
      id: 'api_idempotency_keys',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Idempotency is scoped to workspace, approved snapshot, job type, and request hash.',
      stillBlocked: 'idempotency_row_mutation',
    },
    {
      id: 'backend_runtime_messages',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Runtime messages are sanitized summaries only.',
      stillBlocked: 'backend_runtime_message_creation',
    },
    {
      id: 'storage_object_records',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Private storage object records, checksum refs, and manifests are required.',
      stillBlocked: 'storage_row_or_object_creation',
    },
    {
      id: 'signed_url_events',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'Signed URLs remain audit-only and never source of truth.',
      stillBlocked: 'signed_url_creation',
    },
    {
      id: 'qa_audit_cost_credit',
      status: 'accepted_for_controlled_smoke_planning',
      evidence: 'QA, audit, and credit reservation gates are represented as metadata boundaries.',
      stillBlocked: 'persisted_qa_audit_or_credit_mutation',
    },
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
    runtimePersistenceToWorkerDispatchReadinessReviewRecorded: true,
    persistedWorkerDispatchReadinessReviewRequired: false,
    persistedWorkerDispatchReadinessAcceptedForControlledSmokePlanning: true,
    controlledPersistedWorkerDispatchSmokePlanRequired: true,
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
    supabaseCloudTouched: false,
    stagingTouched: false,
    productionTouched: false,
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
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58BK-CONTROLLED-PERSISTED-WORKER-DISPATCH-SMOKE-PLAN: plan controlled persisted Qwen worker dispatch smoke, no invocation/no assets/no beta',
} as const

export type Qwen25VlRuntimePersistenceToWorkerDispatchReadinessReview =
  typeof QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW
