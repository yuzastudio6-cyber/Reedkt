export type SupabaseSoundLocalThrowawayDbSetupPlanMode = 'local_throwaway_db_setup_plan_only'

export type SupabaseSoundLocalThrowawayDbSetupPlanStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export interface SupabaseSoundLocalThrowawayDbSetupPlan {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalThrowawayDbSetupPlanMode
  currentUnlockStage: Extract<SupabaseSoundLocalThrowawayDbSetupPlanStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalThrowawayDbSetupPlanStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  previousBlockedResult: {
    reason: 'local_postgres_unavailable'
    pgIsReadyLocalhostStatus: 'localhost:5432 - no response'
    localValidationAttempted: false
    sqlExecuted: false
    databaseCreated: false
    databaseDropped: false
    supabaseCloudTouched: false
  }
  currentLocalTooling: {
    psqlAvailable: true
    pgIsReadyAvailable: true
    createdbAvailable: true
    dropdbAvailable: true
    psqlPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/psql'
    pgIsReadyPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/pg_isready'
    createdbPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/createdb'
    dropdbPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/dropdb'
    psqlVersion: 'psql (PostgreSQL) 18.4 (Postgres.app)'
    pgIsReadyLocalhostStatus: 'localhost:5432 - accepting connections'
    localPostgresResponds: true
  }
  setupPlan: {
    setupExecutedNow: false
    databaseCreatedNow: false
    databaseDroppedNow: false
    serviceStartedNow: false
    packagesInstalledNow: false
    dockerUsedNow: false
    supabaseCloudTouched: false
  }
  requirements: {
    localThrowawayOnly: true
    noDeploy: true
    noProduction: true
    noStagingUnlessSeparatelyApproved: true
    noLiveCustomerData: true
    hostMustBeLocal: true
    databaseNameMustBeThrowaway: true
    supabaseMigrationsMustRemainUntouched: true
    draftSqlFilesMustRemainUnchanged: true
  }
  futureRetry: {
    recommendedDatabaseName: 'reeditpro_sound_fixture_validation_throwaway'
    allowedOnlyInFuturePrompt: true
    currentReadinessSupportsRetryPrompt: true
    recommendedImmediateNextPrompt: 'SUPABASE-SOUND-4-RETRY: run draft migration validation in approved local throwaway database, no deploy'
  }
  execution: {
    sqlExecuted: false
    databaseCreated: false
    databaseDropped: false
    serviceStarted: false
    serviceStopped: false
    packagesInstalled: false
    dockerUsed: false
    migrationDeployed: false
    supabaseCloudMutationPerformed: false
    rowsCreated: false
    storageObjectsCreated: false
    signedUrlsCreated: false
    providerCallsMade: false
    workersDispatched: false
    generatedAudioCreated: false
    generatedAssetsCreated: false
    mediaProcessingRun: false
    ffmpegRun: false
    ffprobeRun: false
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

export const SUPABASE_SOUND_LOCAL_THROWAWAY_DB_SETUP_PLAN:
  SupabaseSoundLocalThrowawayDbSetupPlan = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_throwaway_db_setup_plan_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    previousBlockedResult: {
      reason: 'local_postgres_unavailable',
      pgIsReadyLocalhostStatus: 'localhost:5432 - no response',
      localValidationAttempted: false,
      sqlExecuted: false,
      databaseCreated: false,
      databaseDropped: false,
      supabaseCloudTouched: false,
    },
    currentLocalTooling: {
      psqlAvailable: true,
      pgIsReadyAvailable: true,
      createdbAvailable: true,
      dropdbAvailable: true,
      psqlPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/psql',
      pgIsReadyPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/pg_isready',
      createdbPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/createdb',
      dropdbPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/dropdb',
      psqlVersion: 'psql (PostgreSQL) 18.4 (Postgres.app)',
      pgIsReadyLocalhostStatus: 'localhost:5432 - accepting connections',
      localPostgresResponds: true,
    },
    setupPlan: {
      setupExecutedNow: false,
      databaseCreatedNow: false,
      databaseDroppedNow: false,
      serviceStartedNow: false,
      packagesInstalledNow: false,
      dockerUsedNow: false,
      supabaseCloudTouched: false,
    },
    requirements: {
      localThrowawayOnly: true,
      noDeploy: true,
      noProduction: true,
      noStagingUnlessSeparatelyApproved: true,
      noLiveCustomerData: true,
      hostMustBeLocal: true,
      databaseNameMustBeThrowaway: true,
      supabaseMigrationsMustRemainUntouched: true,
      draftSqlFilesMustRemainUnchanged: true,
    },
    futureRetry: {
      recommendedDatabaseName: 'reeditpro_sound_fixture_validation_throwaway',
      allowedOnlyInFuturePrompt: true,
      currentReadinessSupportsRetryPrompt: true,
      recommendedImmediateNextPrompt:
        'SUPABASE-SOUND-4-RETRY: run draft migration validation in approved local throwaway database, no deploy',
    },
    execution: {
      sqlExecuted: false,
      databaseCreated: false,
      databaseDropped: false,
      serviceStarted: false,
      serviceStopped: false,
      packagesInstalled: false,
      dockerUsed: false,
      migrationDeployed: false,
      supabaseCloudMutationPerformed: false,
      rowsCreated: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      generatedAudioCreated: false,
      generatedAssetsCreated: false,
      mediaProcessingRun: false,
      ffmpegRun: false,
      ffprobeRun: false,
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
