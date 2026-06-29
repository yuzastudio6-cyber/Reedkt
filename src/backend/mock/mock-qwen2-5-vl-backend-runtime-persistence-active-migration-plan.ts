import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW } from './mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-result-review'

export const QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_backend_runtime_persistence_active_migration_plan',
  decision:
    'qwen2_5_vl_backend_runtime_persistence_active_migration_plan_recorded_active_migration_create_required',
  upstreamLocalHarnessValidationResultReviewDecision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW.decision,
  reviewedEvidence: {
    localHarnessValidationResultReviewDoc:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-result-review.md',
    retry15ResultDoc:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
    sourceDraftSql:
      'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
    sourceDraftTests:
      'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
    storageUploadPipelinePolicyCommentFix:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.md',
  },
  acceptedInputs: {
    retry15EvidenceAccepted: true,
    validatedDraftSqlAccepted: true,
    validatedLocalSqlTestsAccepted: true,
    privateStorageBoundaryAccepted: true,
    signedUrlSourceOfTruthRejected: true,
    rawPromptExecutionRejected: true,
  },
  promotionPlan: {
    futureMigrationCreationCommand:
      'supabase migration new qwen2_5_vl_backend_runtime_persistence',
    sourceDraftSql:
      'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
    sourceDraftTests:
      'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
    mustUseSupabaseCliMigrationNew: true,
    mayInventExecutableMigrationFilename: false,
    copyDraftOnlyWarningsIntoExecutableMigration: false,
    preserveValidatedGuards: true,
    preserveValidatedIndexes: true,
    preserveValidatedConstraints: true,
    preserveValidatedComments: true,
    createBaselineTables: false,
    seedRows: false,
    deployMigrationNow: false,
  },
  reusedRuntimeSurfaces: [
    'approved_plan_snapshots',
    'credit_reservations',
    'jobs',
    'job_events',
    'worker_runtime_configs',
    'worker_leases',
    'backend_runtime_messages',
    'job_claim_attempts',
    'idempotency_records',
    'storage_object_records',
    'signed_url_events',
    'tool_runtime_checks',
    'qa_audit_cost_surfaces',
  ],
  blockedRuntime: {
    activeMigrationCreated: false,
    migrationDeployed: false,
    sqlExecutedNow: false,
    supabaseCloudTouched: false,
    stagingTouched: false,
    productionTouched: false,
    liveDataTouched: false,
    cloudRunInvocationAttempted: false,
    inferenceRun: false,
    workersDispatched: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaReady: false,
    productionReady: false,
  },
  sourceOfTruthRules: {
    workersUseApprovedSnapshots: true,
    rawChatExecutionRejected: true,
    rawWorkerPromptFieldsAllowed: false,
    signedUrlsAsSourceOfTruthAllowed: false,
    frontendSecretsAllowed: false,
    providerSecretsAllowed: false,
    publicStorageAllowed: false,
  },
  runtimeFlags: {
    backendRuntimePersistenceActiveMigrationPlanRecorded: true,
    backendRuntimePersistenceActiveMigrationPlanRequired: false,
    backendRuntimePersistenceActiveMigrationCreateRequired: true,
    qwenActiveMigrationCreated: false,
    migrationDeployed: false,
    readyForRealWorkerDispatch: false,
    privateInvokeReady: false,
    cloudRunInvocationAttempted: false,
    inferenceRun: false,
    workersDispatched: false,
    supabaseCloudTouched: false,
    stagingTouched: false,
    productionTouched: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58BA-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-CREATE: create active Qwen persistence migration from validated draft, no deploy/no cloud/no assets/no beta',
} as const

export type Qwen25VlBackendRuntimePersistenceActiveMigrationPlan =
  typeof QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_ACTIVE_MIGRATION_PLAN
