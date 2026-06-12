export type SupabaseSoundLocalHarnessPortsFixMode = 'local_harness_ports_fix_only'

export type SupabaseSoundLocalHarnessPortsFixStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalHarnessPortsFixConflictStatus =
  | false
  | 'not_checked'
  | 'blocked'

export interface SupabaseSoundLocalHarnessPortsFix {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalHarnessPortsFixMode
  currentUnlockStage: Extract<SupabaseSoundLocalHarnessPortsFixStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalHarnessPortsFixStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  previousBlocker: {
    prompt: 'SUPABASE-SOUND-4-RETRY-HARNESS-3'
    portConflictDetected: true
    existingDockerStackName: 'reeditpro-local'
    conflictedPorts: number[]
  }
  portFix: {
    configUpdatedNow: boolean
    selectedPortRange: string
    projectIdUnchanged: true
    localOnlyUrlsRetained: true
    defaultConflictingPortsRemoved: boolean
    portConflictAfterFix: SupabaseSoundLocalHarnessPortsFixConflictStatus
  }
  selectedPorts: {
    apiPort: number
    dbPort: number
    shadowPort: number
    studioPort: number
    inbucketPort: number
    analyticsPort: number
    poolerPort: number
  }
  configSafety: {
    secretsIncluded: false
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
  }
  execution: {
    sqlExecuted: false
    supabaseCliExecuted: false
    dockerContainersStartedStopped: false
    databaseCreated: false
    serviceStarted: false
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
    'SUPABASE-SOUND-4-HARNESS-PORTS-VERIFY: verify local harness port fix and prerequisites, no SQL'
}

export const SUPABASE_SOUND_LOCAL_HARNESS_PORTS_FIX:
  SupabaseSoundLocalHarnessPortsFix = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_harness_ports_fix_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    previousBlocker: {
      prompt: 'SUPABASE-SOUND-4-RETRY-HARNESS-3',
      portConflictDetected: true,
      existingDockerStackName: 'reeditpro-local',
      conflictedPorts: [54321, 54324, 54325, 54326, 54330, 54331],
    },
    portFix: {
      configUpdatedNow: true,
      selectedPortRange: '55420-55429',
      projectIdUnchanged: true,
      localOnlyUrlsRetained: true,
      defaultConflictingPortsRemoved: true,
      portConflictAfterFix: false,
    },
    selectedPorts: {
      apiPort: 55421,
      dbPort: 55422,
      shadowPort: 55420,
      studioPort: 55423,
      inbucketPort: 55424,
      analyticsPort: 55427,
      poolerPort: 55429,
    },
    configSafety: {
      secretsIncluded: false,
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
    },
    execution: {
      sqlExecuted: false,
      supabaseCliExecuted: false,
      dockerContainersStartedStopped: false,
      databaseCreated: false,
      serviceStarted: false,
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
      'SUPABASE-SOUND-4-HARNESS-PORTS-VERIFY: verify local harness port fix and prerequisites, no SQL',
  }
