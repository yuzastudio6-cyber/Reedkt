export type SupabaseSoundLocalBaselineHarnessApprovalMode =
  'local_baseline_harness_approval_only'

export type SupabaseSoundLocalBaselineHarnessApprovalStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalBaselineHarnessApprovalDecision =
  | 'conditional_approval_for_future_local_supabase_baseline_harness_execution'
  | 'baseline_harness_rejected_until_repo_local_harness_exists'
  | 'baseline_harness_approval_blocked_pending_policy'

export interface SupabaseSoundLocalBaselineHarnessApproval {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalBaselineHarnessApprovalMode
  currentUnlockStage: Extract<SupabaseSoundLocalBaselineHarnessApprovalStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalBaselineHarnessApprovalStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    approvalDecision: Extract<
      SupabaseSoundLocalBaselineHarnessApprovalDecision,
      'conditional_approval_for_future_local_supabase_baseline_harness_execution'
    >
    futureLocalHarnessExecutionApproved: boolean
    futureDockerOrSupabaseCliAllowedOnlyInNextPrompt: boolean
    generatedLocalFixturePassedClaimed: false
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-RETRY-HARNESS: run draft validation with approved local Supabase baseline harness, no deploy'
  }
  blockerAddressed: {
    previousBlockerType: 'missing_supabase_platform_prerequisites'
    missingPlatformRelations: ['auth.users', 'storage.buckets', 'storage.objects']
    plainPostgresOnlyInsufficient: true
  }
  approvedFutureHarnessPath: {
    requiresSupabasePlatformSchemas: true
    requiresAuthUsers: true
    requiresStorageBuckets: true
    requiresStorageObjects: true
    optionAApprovedForFuturePrompt: true
    optionBAllowedOnlyIfApprovedRepoHarnessAppears: true
    plainPostgresOnlyAllowed: false
    manualPlatformStubsApproved: false
    supabaseCloudAllowed: false
    productionAllowed: false
    stagingAllowed: false
    liveCustomerDataAllowed: false
  }
  conditionsForFutureExecution: string[]
  approvedFutureCommandCategories: string[]
  forbiddenPaths: string[]
  futureEvidenceRequired: string[]
  execution: {
    sqlExecuted: false
    supabaseCliExecuted: false
    dockerUsed: false
    databaseCreated: false
    databaseDropped: false
    serviceStarted: false
    packageInstalled: false
    migrationDeployed: false
    supabaseCloudTouched: false
    rowsCreated: false
    storageObjectsCreated: false
    signedUrlsCreated: false
    providerCallsMade: false
    workersDispatched: false
    generatedAudioCreated: false
    generatedAssetsCreated: false
    mediaProcessingRun: false
    ffmpegOrFfprobeRun: false
    modelInferenceRun: false
    renderRun: false
    muxRun: false
    exportRun: false
    creditSpendOccurred: false
    publicArtifactsCreated: false
  }
  sourceOfTruthPath: {
    requiresSupabaseRow: true
    requiresPrivateGcsPath: true
    requiresManifest: true
    requiresChecksum: true
    requiresApprovedPlanSnapshot: true
    signedUrlsAreSourceOfTruth: false
    publicUrlsAllowed: false
  }
  rawPromptRule: {
    rawPromptDirectExecutionAllowed: false
    requiresStructuredAgentFindings: true
    requiresEditIntents: true
    requiresApprovedPlanSnapshot: true
  }
}

const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-RETRY-HARNESS: run draft validation with approved local Supabase baseline harness, no deploy' as const

export const SUPABASE_SOUND_LOCAL_BASELINE_HARNESS_APPROVAL:
  SupabaseSoundLocalBaselineHarnessApproval = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_baseline_harness_approval_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      approvalDecision:
        'conditional_approval_for_future_local_supabase_baseline_harness_execution',
      futureLocalHarnessExecutionApproved: true,
      futureDockerOrSupabaseCliAllowedOnlyInNextPrompt: true,
      generatedLocalFixturePassedClaimed: false,
      recommendedImmediateNextPrompt,
    },
    blockerAddressed: {
      previousBlockerType: 'missing_supabase_platform_prerequisites',
      missingPlatformRelations: ['auth.users', 'storage.buckets', 'storage.objects'],
      plainPostgresOnlyInsufficient: true,
    },
    approvedFutureHarnessPath: {
      requiresSupabasePlatformSchemas: true,
      requiresAuthUsers: true,
      requiresStorageBuckets: true,
      requiresStorageObjects: true,
      optionAApprovedForFuturePrompt: true,
      optionBAllowedOnlyIfApprovedRepoHarnessAppears: true,
      plainPostgresOnlyAllowed: false,
      manualPlatformStubsApproved: false,
      supabaseCloudAllowed: false,
      productionAllowed: false,
      stagingAllowed: false,
      liveCustomerDataAllowed: false,
    },
    conditionsForFutureExecution: [
      'future prompt repeats local-only proof before any harness action',
      'future prompt proves no cloud target is used',
      'future prompt proves no production target is used',
      'future prompt proves no staging target is used',
      'future prompt proves no live customer data is used',
      'future prompt must not print secrets or full environment values',
      'auth.users must be available before app baseline migration load',
      'storage.buckets must be available before storage policy validation',
      'storage.objects must be available before storage policy validation',
      'public.approved_plan_snapshots must be available after app baseline load',
      'draft SQL and draft test files must remain unchanged',
      'cleanup and rollback must be defined before the run',
      'final owner evidence rollup must remain valid',
      'generated_local_fixture_passed must remain unclaimed',
    ],
    approvedFutureCommandCategories: [
      'local Supabase-compatible platform harness startup in a later prompt only',
      'local baseline schema load or reset inside the local harness only',
      'local validation against the harness database only',
      'fixed SOUND draft migration validation inside the local harness only',
      'fixed SOUND draft test validation inside the local harness only',
      'cleanup or teardown of local harness resources only',
    ],
    forbiddenPaths: [
      'Supabase cloud',
      'production',
      'staging unless separately approved later',
      'live customer data',
      'remote database URLs',
      'active migration deployment',
      'writing supabase/migrations',
      'provider calls',
      'worker dispatch',
      'signed URLs',
      'public artifacts',
      'generated audio or generated assets',
      'credit spend or reservation',
      'render mux or export',
      'generated_local_fixture_passed claim',
      'manual platform stubs from this approval',
      'plain local PostgreSQL as the only harness',
    ],
    futureEvidenceRequired: [
      'harness target name',
      'local-only proof',
      'no-cloud proof',
      'no-production proof',
      'no-staging proof',
      'no-live-data proof',
      'auth.users available',
      'storage.buckets available',
      'storage.objects available',
      'public.approved_plan_snapshots available after app baseline',
      'draft SQL and draft tests unchanged',
      'cleanup and rollback plan',
      'sanitized output plan',
      'final owner evidence rollup still valid',
      'no active supabase/migrations/999 draft file',
    ],
    execution: {
      sqlExecuted: false,
      supabaseCliExecuted: false,
      dockerUsed: false,
      databaseCreated: false,
      databaseDropped: false,
      serviceStarted: false,
      packageInstalled: false,
      migrationDeployed: false,
      supabaseCloudTouched: false,
      rowsCreated: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      generatedAudioCreated: false,
      generatedAssetsCreated: false,
      mediaProcessingRun: false,
      ffmpegOrFfprobeRun: false,
      modelInferenceRun: false,
      renderRun: false,
      muxRun: false,
      exportRun: false,
      creditSpendOccurred: false,
      publicArtifactsCreated: false,
    },
    sourceOfTruthPath: {
      requiresSupabaseRow: true,
      requiresPrivateGcsPath: true,
      requiresManifest: true,
      requiresChecksum: true,
      requiresApprovedPlanSnapshot: true,
      signedUrlsAreSourceOfTruth: false,
      publicUrlsAllowed: false,
    },
    rawPromptRule: {
      rawPromptDirectExecutionAllowed: false,
      requiresStructuredAgentFindings: true,
      requiresEditIntents: true,
      requiresApprovedPlanSnapshot: true,
    },
  }
