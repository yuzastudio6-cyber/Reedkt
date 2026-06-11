export type SupabaseSoundLocalHarnessConfigPlanMode = 'local_harness_config_plan_only'

export type SupabaseSoundLocalHarnessConfigPlanStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export interface SupabaseSoundLocalHarnessConfigPlan {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalHarnessConfigPlanMode
  currentUnlockStage: Extract<SupabaseSoundLocalHarnessConfigPlanStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalHarnessConfigPlanStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  currentPrerequisites: {
    arm64NodeVerified: true
    arm64SupabaseCliVerified: true
    dockerCliVerified: true
    configTomlExists: false
    readyForHarnessRetry: false
  }
  configPlan: {
    configCreatedNow: false
    configCreationAllowedNextPrompt: true
    recommendedProjectId: 'reeditpro_sound_local_harness'
    localOnly: true
    noSecrets: true
    noRemoteProjectRef: true
    noSupabaseCloudUrl: true
    noProductionStagingIds: true
  }
  forbiddenConfigValues: string[]
  futureConfigSafetyCriteria: string[]
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
  recommendedImmediateNextPrompt:
    'SUPABASE-SOUND-4-HARNESS-CONFIG-CREATE: create safe local supabase/config.toml, no execution'
}

export const SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_PLAN:
  SupabaseSoundLocalHarnessConfigPlan = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_harness_config_plan_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    currentPrerequisites: {
      arm64NodeVerified: true,
      arm64SupabaseCliVerified: true,
      dockerCliVerified: true,
      configTomlExists: false,
      readyForHarnessRetry: false,
    },
    configPlan: {
      configCreatedNow: false,
      configCreationAllowedNextPrompt: true,
      recommendedProjectId: 'reeditpro_sound_local_harness',
      localOnly: true,
      noSecrets: true,
      noRemoteProjectRef: true,
      noSupabaseCloudUrl: true,
      noProductionStagingIds: true,
    },
    forbiddenConfigValues: [
      'service_role key values',
      'anon key values',
      'access token values',
      'JWT secret values',
      'database password values',
      'provider keys',
      'Stripe keys',
      'remote project refs',
      'Supabase cloud URLs',
      'production or staging project identifiers',
      'signed URL source-of-truth settings',
      'public artifact delivery settings',
      'worker execution settings',
      'provider execution settings',
    ],
    futureConfigSafetyCriteria: [
      'source-of-truth still permits a local-only config',
      'repo still lacks supabase/config.toml',
      'compatible arm64 Supabase CLI remains verified',
      'compatible arm64 Node remains verified',
      'Docker CLI remains verified',
      'no cloud link is configured',
      'no production or staging target is configured',
      'no live customer data is referenced',
      'no secrets or environment values are printed',
      'text-only smoke validates config content before any harness run',
      'config creation prompt does not run Supabase CLI commands',
      'config creation prompt does not run Docker',
      'config creation prompt does not execute SQL',
      'generated_local_fixture_passed remains unclaimed',
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
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-HARNESS-CONFIG-CREATE: create safe local supabase/config.toml, no execution',
  }
