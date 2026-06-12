export type SupabaseSoundLocalHarnessValidation4ResultMode =
  'local_supabase_harness_validation_4_result'

export type SupabaseSoundLocalHarnessValidation4Stage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalHarnessValidation4Owner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SupabaseSoundLocalHarnessValidation4Path =
  | 'local_supabase_cli_stack'
  | 'blocked'

export type SupabaseSoundLocalHarnessValidation4Status = true | false | 'blocked'

export type SupabaseSoundLocalHarnessValidation4Prerequisite =
  | true
  | false
  | 'not_attempted'

export interface SupabaseSoundLocalHarnessValidation4OwnerEvidence {
  owner: SupabaseSoundLocalHarnessValidation4Owner
  conditionalNoExecutionAcceptance: true
}

export interface SupabaseSoundLocalHarnessValidation4Result {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalHarnessValidation4ResultMode
  currentUnlockStage: Extract<SupabaseSoundLocalHarnessValidation4Stage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalHarnessValidation4Stage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    localHarnessValidationAttempted: boolean
    localHarnessValidationPassed: boolean
    platformPrerequisitesSatisfied: SupabaseSoundLocalHarnessValidation4Status
    appBaselineSatisfied: SupabaseSoundLocalHarnessValidation4Status
    draftMigrationPassed: SupabaseSoundLocalHarnessValidation4Status
    draftTestsPassed: SupabaseSoundLocalHarnessValidation4Status | 'text_only'
    generatedLocalFixturePassedClaimed: false
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-HARNESS-FIX-4: fix local Supabase harness setup based on validation output, no SQL'
  }
  harness: {
    selectedHarnessPath: SupabaseSoundLocalHarnessValidation4Path
    selectedPortRange: '55420-55429'
    supabaseCliUsed: boolean
    dockerUsed: boolean
    existingDockerStackDetected: boolean
    existingDockerStackName: string | null
    reeditproLocalStoppedResetRemoved: false
    portConflictDetected: boolean
    startupFailedBeforeSql: boolean
    sanitizedStartupFailure: string
    harnessStartedByThisPrompt: boolean
    harnessStoppedByThisPrompt: boolean
    cleanupVerified: boolean | 'not_applicable'
  }
  platformPrerequisites: {
    authUsersExists: SupabaseSoundLocalHarnessValidation4Prerequisite
    storageBucketsExists: SupabaseSoundLocalHarnessValidation4Prerequisite
    storageObjectsExists: SupabaseSoundLocalHarnessValidation4Prerequisite
    approvedPlanSnapshotsExists: SupabaseSoundLocalHarnessValidation4Prerequisite
  }
  safety: {
    localOnly: true
    noDeploy: true
    noProduction: true
    noStaging: true
    noLiveCustomerData: true
    localUrlsOnly: true
    selectedPortsVerifiedFreeBeforeStart: true
    supabaseCloudTouched: false
    supabaseMigrationsChanged: false
    draftSqlFilesChanged: false
    secretsExposed: false
  }
  execution: {
    sqlExecutedAgainstLocalHarness: boolean
    localDatabaseConnectionOpened: false
    supabaseDbResetRun: false
    migrationDeployed: false
    supabaseCloudMutationPerformed: false
    rowsCreatedInLiveDatabase: false
    storageObjectsCreatedOutsideLocalHarness: false
    signedUrlsCreated: false
    providerCallsMade: false
    workersDispatched: false
    generatedAudioCreated: false
    generatedAssetsCreated: false
    mediaProcessingRun: false
    ffmpegRun: false
    renderRun: false
    muxRun: false
    exportRun: false
    creditSpendOccurred: false
    publicArtifactsCreated: false
  }
  ownerEvidence: SupabaseSoundLocalHarnessValidation4OwnerEvidence[]
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

const ownerEvidence: SupabaseSoundLocalHarnessValidation4OwnerEvidence[] = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
].map((owner) => ({
  owner: owner as SupabaseSoundLocalHarnessValidation4Owner,
  conditionalNoExecutionAcceptance: true,
}))

export const SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_4_RESULT:
  SupabaseSoundLocalHarnessValidation4Result = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_supabase_harness_validation_4_result',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      localHarnessValidationAttempted: false,
      localHarnessValidationPassed: false,
      platformPrerequisitesSatisfied: 'blocked',
      appBaselineSatisfied: 'blocked',
      draftMigrationPassed: 'blocked',
      draftTestsPassed: 'blocked',
      generatedLocalFixturePassedClaimed: false,
      recommendedImmediateNextPrompt:
        'SUPABASE-SOUND-4-HARNESS-FIX-4: fix local Supabase harness setup based on validation output, no SQL',
    },
    harness: {
      selectedHarnessPath: 'local_supabase_cli_stack',
      selectedPortRange: '55420-55429',
      supabaseCliUsed: true,
      dockerUsed: true,
      existingDockerStackDetected: true,
      existingDockerStackName: 'reeditpro-local',
      reeditproLocalStoppedResetRemoved: false,
      portConflictDetected: false,
      startupFailedBeforeSql: true,
      sanitizedStartupFailure: 'column reference "description" is ambiguous (SQLSTATE 42702)',
      harnessStartedByThisPrompt: false,
      harnessStoppedByThisPrompt: false,
      cleanupVerified: true,
    },
    platformPrerequisites: {
      authUsersExists: 'not_attempted',
      storageBucketsExists: 'not_attempted',
      storageObjectsExists: 'not_attempted',
      approvedPlanSnapshotsExists: 'not_attempted',
    },
    safety: {
      localOnly: true,
      noDeploy: true,
      noProduction: true,
      noStaging: true,
      noLiveCustomerData: true,
      localUrlsOnly: true,
      selectedPortsVerifiedFreeBeforeStart: true,
      supabaseCloudTouched: false,
      supabaseMigrationsChanged: false,
      draftSqlFilesChanged: false,
      secretsExposed: false,
    },
    execution: {
      sqlExecutedAgainstLocalHarness: false,
      localDatabaseConnectionOpened: false,
      supabaseDbResetRun: false,
      migrationDeployed: false,
      supabaseCloudMutationPerformed: false,
      rowsCreatedInLiveDatabase: false,
      storageObjectsCreatedOutsideLocalHarness: false,
      signedUrlsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      generatedAudioCreated: false,
      generatedAssetsCreated: false,
      mediaProcessingRun: false,
      ffmpegRun: false,
      renderRun: false,
      muxRun: false,
      exportRun: false,
      creditSpendOccurred: false,
      publicArtifactsCreated: false,
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
