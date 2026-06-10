export type SupabaseSoundLocalBaselineValidationMode = 'local_baseline_validation_result'

export type SupabaseSoundLocalBaselineValidationStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalBaselineValidationOwner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export interface SupabaseSoundLocalBaselineValidationOwnerEvidence {
  owner: SupabaseSoundLocalBaselineValidationOwner
  conditionalNoExecutionAcceptance: boolean
  executionAllowedNow: false
}

export interface SupabaseSoundLocalBaselineValidationResult {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalBaselineValidationMode
  currentUnlockStage: Extract<SupabaseSoundLocalBaselineValidationStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalBaselineValidationStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    localBaselineValidationAttempted: boolean
    localBaselineValidationPassed: boolean
    baselineSchemaLoaded: boolean | 'blocked'
    draftMigrationPassed: boolean | 'blocked'
    draftTestsPassed: boolean | 'blocked' | 'text_only'
    generatedLocalFixturePassedClaimed: false
    recommendedImmediateNextPrompt: string
  }
  baseline: {
    baselineOrderSource: string
    baselineMigrationFilesDiscovered: number
    baselineMigrationFilesAttempted: number
    baselineMigrationFilesSucceeded: number
    approvedPlanSnapshotsExistsAfterBaseline: boolean | 'not_attempted'
    blockedReason: string
    missingPlatformPrerequisites: string[]
  }
  safety: {
    localThrowawayOnly: true
    localMaintenanceProofQueriesExecuted: true
    noDeploy: true
    noProduction: true
    noStaging: true
    noLiveCustomerData: true
    supabaseCloudTouched: false
    supabaseMigrationsChanged: false
    draftSqlFilesChanged: false
    secretsExposed: false
  }
  execution: {
    sqlExecuted: boolean
    sqlExecutedOnlyAgainstLocalThrowaway: boolean
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
  cleanup: {
    throwawayDatabaseCreated: boolean
    throwawayDatabaseDropped: boolean
    cleanupVerified: boolean
  }
  ownerEvidence: SupabaseSoundLocalBaselineValidationOwnerEvidence[]
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

const ownerEvidence: SupabaseSoundLocalBaselineValidationOwnerEvidence[] = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
].map((owner) => ({
  owner: owner as SupabaseSoundLocalBaselineValidationOwner,
  conditionalNoExecutionAcceptance: true,
  executionAllowedNow: false,
}))

export const SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT:
  SupabaseSoundLocalBaselineValidationResult = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_baseline_validation_result',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      localBaselineValidationAttempted: false,
      localBaselineValidationPassed: false,
      baselineSchemaLoaded: 'blocked',
      draftMigrationPassed: 'blocked',
      draftTestsPassed: 'blocked',
      generatedLocalFixturePassedClaimed: false,
      recommendedImmediateNextPrompt:
        'SUPABASE-SOUND-4-BASELINE-PLAN: define approved local baseline schema harness, no SQL',
    },
    baseline: {
      baselineOrderSource:
        'supabase/migration-order.md timestamp order plus real supabase/migrations/*.sql files excluding macOS metadata',
      baselineMigrationFilesDiscovered: 21,
      baselineMigrationFilesAttempted: 0,
      baselineMigrationFilesSucceeded: 0,
      approvedPlanSnapshotsExistsAfterBaseline: 'not_attempted',
      blockedReason:
        'local throwaway PostgreSQL target lacks Supabase platform prerequisites required by approved baseline migrations',
      missingPlatformPrerequisites: ['auth.users', 'storage.buckets', 'storage.objects'],
    },
    safety: {
      localThrowawayOnly: true,
      localMaintenanceProofQueriesExecuted: true,
      noDeploy: true,
      noProduction: true,
      noStaging: true,
      noLiveCustomerData: true,
      supabaseCloudTouched: false,
      supabaseMigrationsChanged: false,
      draftSqlFilesChanged: false,
      secretsExposed: false,
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
    cleanup: {
      throwawayDatabaseCreated: true,
      throwawayDatabaseDropped: true,
      cleanupVerified: true,
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
