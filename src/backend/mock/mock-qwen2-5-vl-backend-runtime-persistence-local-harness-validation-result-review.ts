import { QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT } from './mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result'

export const QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_result_review',
  decision:
    'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_result_review_accepted_active_migration_plan_required',
  upstreamRetry15Decision:
    QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.decision,
  reviewedEvidence: {
    retry15ResultDoc:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-local-harness-validation-retry-15-result.md',
    retry15ResultSpec:
      'src/backend/mock/mock-qwen2-5-vl-backend-runtime-persistence-local-harness-validation-retry-15-result.ts',
    migrationDraft:
      'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
    localSqlTests:
      'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
    storageUploadPipelinePolicyCommentFix:
      'docs/qwen2-5-vl-7b-backend-runtime-persistence-baseline-storage-upload-pipeline-policy-comment-fix.md',
    localHarnessConfig: 'supabase/config.toml',
  },
  acceptedEvidence: {
    retry15ResultAccepted: true,
    activeBaselineCompletionAccepted:
      QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.attempt.localBaselineMigrationsPassed,
    storageUploadPipelinePolicyCommentFixAccepted:
      QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.validationOutcome.storageUploadPipelinePolicyCommentFixVerified,
    qwenDraftSqlApplyEvidenceAccepted:
      QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.attempt.qwenDraftSqlApplied,
    qwenLocalSqlTestsEvidenceAccepted:
      QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.attempt.qwenLocalSqlTestsPassed,
    privateStorageBoundaryEvidenceAccepted: true,
    signedUrlSourceOfTruthRejected: true,
    rawPromptExecutionRejected: true,
    cleanupEvidenceAccepted:
      QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.cleanup.cleanupVerified,
    localDefaultSecretsExcluded:
      !QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RETRY_15_RESULT.attempt.localDefaultSecretsRecordedInRepo,
  },
  remainingBlockers: {
    activeMigrationPlanRequired: true,
    qwenActiveMigrationCreated: false,
    migrationDeployed: false,
    realWorkerDispatchAccepted: false,
    privateInvokeReady: false,
    betaReady: false,
    productionReady: false,
    reasons: [
      'validated_sql_remains_draft_only',
      'active_migration_plan_not_recorded',
      'no_migration_deploy_approval',
      'real_worker_dispatch_still_blocked',
      'beta_and_production_still_blocked',
    ],
  },
  runtimeFlags: {
    localHarnessValidationResultReviewRecorded: true,
    retry15EvidenceAccepted: true,
    activeBaselineCompletionAccepted: true,
    storageUploadPipelinePolicyCommentFixAccepted: true,
    qwenDraftSqlApplyEvidenceAccepted: true,
    qwenLocalSqlTestsEvidenceAccepted: true,
    privateStorageBoundaryEvidenceAccepted: true,
    signedUrlSourceOfTruthRejected: true,
    rawPromptExecutionRejected: true,
    cleanupEvidenceAccepted: true,
    backendRuntimePersistenceLocalHarnessValidationResultReviewRequired: false,
    backendRuntimePersistenceActiveMigrationPlanRequired: true,
    qwenActiveMigrationCreated: false,
    migrationDeployed: false,
    readyForRealWorkerDispatch: false,
    privateInvokeReady: false,
    cloudRunInvocationAttempted: false,
    inferenceRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseCloudTouched: false,
    stagingTouched: false,
    productionTouched: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    mediaProcessingRun: false,
    renderExportRun: false,
    creditMutationCreated: false,
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58AZ-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PLAN: promote validated Qwen persistence draft to active migration plan, no deploy/no cloud/no assets/no beta',
} as const

export type Qwen25VlBackendRuntimePersistenceLocalHarnessValidationResultReview =
  typeof QWEN2_5_VL_BACKEND_RUNTIME_PERSISTENCE_LOCAL_HARNESS_VALIDATION_RESULT_REVIEW
