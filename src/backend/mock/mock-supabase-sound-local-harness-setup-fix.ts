export type SupabaseSoundLocalHarnessSetupFixMode = 'local_harness_setup_fix_only'

export type SupabaseSoundLocalHarnessSetupFixStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalHarnessSetupFixDecision =
  | 'harness_setup_partially_fixed_with_local_config'
  | 'harness_setup_blocked_pending_compatible_supabase_cli'
  | 'harness_setup_blocked_pending_repo_harness_design'
  | 'harness_setup_ready_for_retry'

export type SupabaseSoundLocalHarnessBinaryArchitectureStatus =
  | 'compatible'
  | 'incompatible'
  | 'unknown'
  | 'not_found'

export interface SupabaseSoundLocalHarnessSetupFix {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalHarnessSetupFixMode
  currentUnlockStage: Extract<SupabaseSoundLocalHarnessSetupFixStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalHarnessSetupFixStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  previousBlocker: {
    prompt: 'SUPABASE-SOUND-4-RETRY-HARNESS'
    configTomlMissing: boolean
    approvedRepoHarnessFound: boolean
    supabaseBinaryBadCpuType: boolean
    harnessValidationAttempted: false
  }
  fixDecision: {
    setupFixDecision: SupabaseSoundLocalHarnessSetupFixDecision
    configTomlCreated: boolean
    localConfigReady: boolean
    compatibleSupabaseCliAvailable: boolean
    repoLocalHarnessAvailable: boolean
    readyForHarnessRetry: boolean
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-HARNESS-SETUP-USER: install compatible local Supabase CLI, no repo changes'
  }
  localSetupInspection: {
    hostArchitecture: string
    supabaseBinaryFound: boolean
    supabaseBinaryPath: string
    supabaseBinaryFileSummary: string
    supabaseBinaryArchitectureStatus: SupabaseSoundLocalHarnessBinaryArchitectureStatus
    dockerBinaryFound: boolean
    dockerBinaryPath: string
    psqlFound: boolean
    psqlPath: string
    pgIsReadyFound: boolean
    pgIsReadyPath: string
    supabaseConfigTomlExists: boolean
    setupCanBeFixedByRepoFilesAlone: boolean
    manualUserActionRequired: boolean
  }
  safety: {
    planOnly: true
    sqlExecuted: false
    supabaseCliExecuted: false
    dockerUsed: false
    databaseCreated: false
    databaseDropped: false
    serviceStarted: false
    packageInstalled: false
    supabaseCloudTouched: false
    activeMigrationCreated: false
    draftSqlFilesChanged: false
    secretsExposed: false
  }
  configSafety: {
    secretsIncluded: false
    serviceRoleKeyIncluded: false
    anonKeyIncluded: false
    accessTokenIncluded: false
    remoteProjectRefIncluded: false
    supabaseCloudUrlIncluded: false
  }
  execution: {
    sqlExecuted: false
    migrationDeployed: false
    supabaseMutationPerformed: false
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

export const SUPABASE_SOUND_LOCAL_HARNESS_SETUP_FIX:
  SupabaseSoundLocalHarnessSetupFix = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_harness_setup_fix_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    previousBlocker: {
      prompt: 'SUPABASE-SOUND-4-RETRY-HARNESS',
      configTomlMissing: true,
      approvedRepoHarnessFound: false,
      supabaseBinaryBadCpuType: true,
      harnessValidationAttempted: false,
    },
    fixDecision: {
      setupFixDecision: 'harness_setup_blocked_pending_compatible_supabase_cli',
      configTomlCreated: false,
      localConfigReady: false,
      compatibleSupabaseCliAvailable: false,
      repoLocalHarnessAvailable: false,
      readyForHarnessRetry: false,
      recommendedImmediateNextPrompt:
        'SUPABASE-SOUND-4-HARNESS-SETUP-USER: install compatible local Supabase CLI, no repo changes',
    },
    localSetupInspection: {
      hostArchitecture: 'arm64',
      supabaseBinaryFound: true,
      supabaseBinaryPath: '/usr/local/bin/supabase',
      supabaseBinaryFileSummary: 'Mach-O 64-bit executable x86_64',
      supabaseBinaryArchitectureStatus: 'incompatible',
      dockerBinaryFound: true,
      dockerBinaryPath: '/usr/local/bin/docker',
      psqlFound: true,
      psqlPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/psql',
      pgIsReadyFound: true,
      pgIsReadyPath: '/Applications/Postgres.app/Contents/Versions/latest/bin/pg_isready',
      supabaseConfigTomlExists: false,
      setupCanBeFixedByRepoFilesAlone: false,
      manualUserActionRequired: true,
    },
    safety: {
      planOnly: true,
      sqlExecuted: false,
      supabaseCliExecuted: false,
      dockerUsed: false,
      databaseCreated: false,
      databaseDropped: false,
      serviceStarted: false,
      packageInstalled: false,
      supabaseCloudTouched: false,
      activeMigrationCreated: false,
      draftSqlFilesChanged: false,
      secretsExposed: false,
    },
    configSafety: {
      secretsIncluded: false,
      serviceRoleKeyIncluded: false,
      anonKeyIncluded: false,
      accessTokenIncluded: false,
      remoteProjectRefIncluded: false,
      supabaseCloudUrlIncluded: false,
    },
    execution: {
      sqlExecuted: false,
      migrationDeployed: false,
      supabaseMutationPerformed: false,
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
