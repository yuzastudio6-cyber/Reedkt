export const SUPABASE_LOCAL_HARNESS_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT_NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58AZ-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PLAN: promote validated Qwen persistence draft to active migration plan, no deploy/no cloud/no assets/no beta' as const

export const SUPABASE_LOCAL_HARNESS_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT = {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'QWEN2_5_VL_7B_INSTRUCT',
  toolId: 'supabase_local_fixture_harness',
  registryToolId: 'supabase_local_fixture_harness',
  mode: 'supabase_local_harness_external_agent_wrapper_blocked_result',
  decision: 'supabase_local_harness_external_agent_wrapper_blocked_evidence_review_result_recorded',
  wrapperCommand: {
    command: 'npm run external-agent-tool-execute-supabase-harness -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW',
    confirmationEnvRequiredValue: 'true',
    verifiesConfigEvidenceSmokeBeforeAnyRuntime: true,
    verifiesRetry15EvidenceSmokeBeforeAnyRuntime: true,
    blocksBeforeSupabaseCliDockerSqlMigrationOrStorage: true,
  },
  reviewedResult: {
    wrapperMode: 'external_agent_supabase_harness_execution_evidence_review_result',
    wrapperStatus: 'blocked',
    configVerifySmokePassed: true,
    configVerifyDecision:
      'qwen2_5_vl_backend_runtime_persistence_local_harness_config_verified_harness_validation_required',
    configVerificationPassed: true,
    localToolchainVerificationPassed: true,
    readyForLocalHarnessValidationEvidence: true,
    retry15ResultSmokePassed: true,
    retry15Decision:
      'qwen2_5_vl_backend_runtime_persistence_local_harness_validation_retry_15_passed_qwen_draft_sql_and_tests',
    referencedRetry15LocalHarnessValidationPassed: true,
    referencedQwenDraftSqlAppliedInPriorEvidence: true,
    referencedQwenLocalSqlTestsPassedInPriorEvidence: true,
    referencedCleanupVerifiedInPriorEvidence: true,
  },
  blockers: [
    'supabase_local_harness_supporting_evidence_only',
    'not_a_model_or_media_execution_lane_on_this_branch',
    'active_migration_plan_required_before_real_dispatch',
  ],
  runtimeResult: {
    runtimeRunNow: false,
    supabaseCliExecuted: false,
    dockerStarted: false,
    sqlExecuted: false,
    databaseCreated: false,
    migrationDeployed: false,
    rowsCreated: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    paidProductionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: SUPABASE_LOCAL_HARNESS_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT_NEXT_PROMPT,
} as const

export type SupabaseLocalHarnessExternalAgentWrapperBlockedResult =
  typeof SUPABASE_LOCAL_HARNESS_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT
