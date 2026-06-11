export type SupabaseSoundLocalHarnessConfigCreateMode = 'local_harness_config_create_only'

export type SupabaseSoundLocalHarnessConfigCreateStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export interface SupabaseSoundLocalHarnessConfigCreate {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalHarnessConfigCreateMode
  currentUnlockStage: Extract<SupabaseSoundLocalHarnessConfigCreateStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalHarnessConfigCreateStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  currentPrerequisites: {
    arm64NodeVerified: true
    arm64SupabaseCliVerified: true
    dockerCliVerified: true
    configTomlExistsAfter: true
    readyForHarnessRetry: false
  }
  configResult: {
    configExistedBefore: false
    configCreatedNow: true
    configOverwritten: false
    configPath: 'supabase/config.toml'
    localOnly: true
    noSecrets: true
    noRemoteProjectRef: true
    noSupabaseCloudUrl: true
    noProductionStagingIds: true
    allowedLocalUrlsOnly: true
    recommendedProjectId: 'reeditpro_sound_local_harness'
  }
  configSafety: {
    serviceRoleKeyIncluded: false
    anonKeyIncluded: false
    accessTokenIncluded: false
    jwtSecretIncluded: false
    databasePasswordIncluded: false
    providerKeysIncluded: false
    stripeKeysIncluded: false
    remoteProjectRefIncluded: false
    supabaseCloudUrlIncluded: false
    productionStagingIdsIncluded: false
    signedUrlSourceOfTruthSettingsIncluded: false
    publicArtifactSettingsIncluded: false
    workerProviderExecutionSettingsIncluded: false
  }
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
    'SUPABASE-SOUND-4-HARNESS-CONFIG-VERIFY: verify safe local config and harness prerequisites, no SQL'
}

export const SUPABASE_SOUND_LOCAL_HARNESS_CONFIG_CREATE:
  SupabaseSoundLocalHarnessConfigCreate = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_harness_config_create_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    currentPrerequisites: {
      arm64NodeVerified: true,
      arm64SupabaseCliVerified: true,
      dockerCliVerified: true,
      configTomlExistsAfter: true,
      readyForHarnessRetry: false,
    },
    configResult: {
      configExistedBefore: false,
      configCreatedNow: true,
      configOverwritten: false,
      configPath: 'supabase/config.toml',
      localOnly: true,
      noSecrets: true,
      noRemoteProjectRef: true,
      noSupabaseCloudUrl: true,
      noProductionStagingIds: true,
      allowedLocalUrlsOnly: true,
      recommendedProjectId: 'reeditpro_sound_local_harness',
    },
    configSafety: {
      serviceRoleKeyIncluded: false,
      anonKeyIncluded: false,
      accessTokenIncluded: false,
      jwtSecretIncluded: false,
      databasePasswordIncluded: false,
      providerKeysIncluded: false,
      stripeKeysIncluded: false,
      remoteProjectRefIncluded: false,
      supabaseCloudUrlIncluded: false,
      productionStagingIdsIncluded: false,
      signedUrlSourceOfTruthSettingsIncluded: false,
      publicArtifactSettingsIncluded: false,
      workerProviderExecutionSettingsIncluded: false,
    },
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
      'SUPABASE-SOUND-4-HARNESS-CONFIG-VERIFY: verify safe local config and harness prerequisites, no SQL',
  }
