export type SupabaseSoundLocalThrowawayValidationRetryMode =
  'local_throwaway_validation_retry_result'

export type SupabaseSoundLocalThrowawayValidationRetryStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalThrowawayValidationRetryOwner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SupabaseSoundLocalThrowawayValidationRetryOutcome = boolean | 'blocked'
export type SupabaseSoundLocalThrowawayValidationRetryTestOutcome =
  | boolean
  | 'blocked'
  | 'text_only'

export interface SupabaseSoundLocalThrowawayValidationRetryOwnerEvidence {
  owner: SupabaseSoundLocalThrowawayValidationRetryOwner
  conditionalNoExecutionAcceptance: true
  executionStillBlocked: true
  evidenceDoc: string
}

export interface SupabaseSoundLocalThrowawayValidationRetryResult {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalThrowawayValidationRetryMode
  currentUnlockStage: Extract<SupabaseSoundLocalThrowawayValidationRetryStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalThrowawayValidationRetryStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    goForSUPABASE_SOUND_4_PROPOSAL_PREVIOUSLY: true
    localValidationAttempted: true
    localValidationPassed: false
    draftMigrationPassed: Extract<SupabaseSoundLocalThrowawayValidationRetryOutcome, false>
    draftTestsPassed: Extract<SupabaseSoundLocalThrowawayValidationRetryTestOutcome, 'blocked'>
    generatedLocalFixturePassedClaimed: false
    failureReason: string[]
    recommendedImmediateNextPrompt: 'SUPABASE-SOUND-4-FIX: fix draft migration/test SQL based on local validation output, no deploy'
  }
  safety: {
    localThrowawayOnly: true
    noDeploy: true
    noProduction: true
    noStaging: true
    noLiveCustomerData: true
    supabaseCloudTouched: false
    supabaseMigrationsChanged: false
    draftSqlFilesChanged: false
    secretsExposed: false
    localTargetVerified: true
    localHostProof: '::1/128|5432'
    throwawayDatabaseName: 'reeditpro_sound_fixture_validation_throwaway'
  }
  execution: {
    sqlExecuted: true
    sqlExecutedOnlyAgainstLocalThrowaway: true
    migrationDeployed: false
    supabaseCloudMutationPerformed: false
    rowsCreatedInLiveDatabase: false
    storageObjectsCreated: false
    signedUrlsCreated: false
    providerCallsMade: false
    workersDispatched: false
    generatedAudioCreated: false
    generatedAssetsCreated: false
    mediaProcessingRun: false
    renderRun: false
    muxRun: false
    exportRun: false
    creditSpendOccurred: false
    publicArtifactsCreated: false
  }
  validation: {
    draftMigrationFile: 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
    draftTestFile: 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
    draftMigrationErrorSummary: 'relation "public.approved_plan_snapshots" does not exist'
    draftMigrationFailureLine: 42
    draftTestsSkippedReason: 'draft migration failed before prerequisite schema existed'
  }
  cleanup: {
    throwawayDatabaseCreated: true
    throwawayDatabaseDropped: true
    cleanupVerified: true
    cleanupNotes: string[]
  }
  ownerEvidence: SupabaseSoundLocalThrowawayValidationRetryOwnerEvidence[]
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

const ownerEvidence: SupabaseSoundLocalThrowawayValidationRetryOwnerEvidence[] = [
  {
    owner: 'SOUND_MUSIC_AUDIO',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/sound-supabase-local-sql-scope-acceptance.md',
  },
  {
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md',
  },
  {
    owner: 'WORKER_RUNTIME_JOBS',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md',
  },
  {
    owner: 'PROVIDER_GATEWAY_MODELS',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/provider-gateway-sound-fixture-boundary-audit.md',
  },
  {
    owner: 'OBSERVABILITY_AUDIT_COST',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/observability-sound-fixture-evidence-audit.md',
  },
  {
    owner: 'BILLING_STRIPE_CREDITS',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/billing-sound-fixture-credit-placeholder-audit.md',
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/track-a-sound-final-composition-handoff-audit.md',
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    conditionalNoExecutionAcceptance: true,
    executionStillBlocked: true,
    evidenceDoc: 'docs/track-b-sound-media-processing-handoff-audit.md',
  },
]

export const SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RETRY_RESULT:
  SupabaseSoundLocalThrowawayValidationRetryResult = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_throwaway_validation_retry_result',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      goForSUPABASE_SOUND_4_PROPOSAL_PREVIOUSLY: true,
      localValidationAttempted: true,
      localValidationPassed: false,
      draftMigrationPassed: false,
      draftTestsPassed: 'blocked',
      generatedLocalFixturePassedClaimed: false,
      failureReason: [
        'draft migration failed against the local throwaway database',
        'baseline runtime table public.approved_plan_snapshots did not exist',
        'draft test SQL was not run because migration prerequisites failed',
      ],
      recommendedImmediateNextPrompt:
        'SUPABASE-SOUND-4-FIX: fix draft migration/test SQL based on local validation output, no deploy',
    },
    safety: {
      localThrowawayOnly: true,
      noDeploy: true,
      noProduction: true,
      noStaging: true,
      noLiveCustomerData: true,
      supabaseCloudTouched: false,
      supabaseMigrationsChanged: false,
      draftSqlFilesChanged: false,
      secretsExposed: false,
      localTargetVerified: true,
      localHostProof: '::1/128|5432',
      throwawayDatabaseName: 'reeditpro_sound_fixture_validation_throwaway',
    },
    execution: {
      sqlExecuted: true,
      sqlExecutedOnlyAgainstLocalThrowaway: true,
      migrationDeployed: false,
      supabaseCloudMutationPerformed: false,
      rowsCreatedInLiveDatabase: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      generatedAudioCreated: false,
      generatedAssetsCreated: false,
      mediaProcessingRun: false,
      renderRun: false,
      muxRun: false,
      exportRun: false,
      creditSpendOccurred: false,
      publicArtifactsCreated: false,
    },
    validation: {
      draftMigrationFile: 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql',
      draftTestFile: 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql',
      draftMigrationErrorSummary: 'relation "public.approved_plan_snapshots" does not exist',
      draftMigrationFailureLine: 42,
      draftTestsSkippedReason: 'draft migration failed before prerequisite schema existed',
    },
    cleanup: {
      throwawayDatabaseCreated: true,
      throwawayDatabaseDropped: true,
      cleanupVerified: true,
      cleanupNotes: [
        'dropdb completed for reeditpro_sound_fixture_validation_throwaway',
        'pg_database lookup returned no rows after cleanup',
      ],
    },
    ownerEvidence,
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
