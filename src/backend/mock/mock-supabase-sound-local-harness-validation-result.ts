export type SupabaseSoundLocalHarnessValidationResultMode =
  'local_supabase_harness_validation_result'

export type SupabaseSoundLocalHarnessValidationStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalHarnessValidationOwner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SupabaseSoundLocalHarnessPath =
  | 'local_supabase_cli_stack'
  | 'repo_local_baseline_harness'
  | 'blocked'

export type SupabaseSoundLocalHarnessValidationStatus = boolean | 'blocked'

export interface SupabaseSoundLocalHarnessOwnerEvidence {
  owner: SupabaseSoundLocalHarnessValidationOwner
  conditionalNoExecutionAcceptance: true
  executionAllowedNow: false
}

export interface SupabaseSoundLocalHarnessValidationResult {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalHarnessValidationResultMode
  currentUnlockStage: Extract<SupabaseSoundLocalHarnessValidationStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalHarnessValidationStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    localHarnessValidationAttempted: boolean
    localHarnessValidationPassed: boolean
    platformPrerequisitesSatisfied: SupabaseSoundLocalHarnessValidationStatus
    appBaselineSatisfied: SupabaseSoundLocalHarnessValidationStatus
    draftMigrationPassed: SupabaseSoundLocalHarnessValidationStatus
    draftTestsPassed: SupabaseSoundLocalHarnessValidationStatus | 'text_only'
    generatedLocalFixturePassedClaimed: false
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-HARNESS-FIX: fix local Supabase harness setup for SOUND draft validation, no SQL'
  }
  harness: {
    selectedHarnessPath: SupabaseSoundLocalHarnessPath
    supabaseCliUsed: boolean
    dockerUsed: boolean
    harnessStartedByThisPrompt: boolean
    harnessStoppedByThisPrompt: boolean
    cleanupVerified: boolean
  }
  commandAvailability: {
    supabaseCommandFound: boolean
    supabaseVersionCheckPassed: boolean
    supabaseVersionFailureSummary: string
    dockerCommandFound: boolean
    psqlCommandFound: boolean
    pgIsreadyCommandFound: boolean
    supabaseConfigTomlPresent: boolean
    approvedRepoLocalHarnessFound: boolean
  }
  platformPrerequisites: {
    authUsersExists: true | false | 'not_attempted'
    storageBucketsExists: true | false | 'not_attempted'
    storageObjectsExists: true | false | 'not_attempted'
    approvedPlanSnapshotsExists: true | false | 'not_attempted'
  }
  safety: {
    localOnly: true
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
    sqlExecutedAgainstLocalHarness: boolean
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
    ffmpegOrFfprobeRun: false
    modelInferenceRun: false
    renderRun: false
    muxRun: false
    exportRun: false
    creditSpendOccurred: false
    qaRowsCreated: false
    auditEventsCreated: false
    costRowsCreated: false
    publicArtifactsCreated: false
  }
  ownerEvidence: SupabaseSoundLocalHarnessOwnerEvidence[]
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

const ownerEvidence: SupabaseSoundLocalHarnessOwnerEvidence[] = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
].map((owner) => ({
  owner: owner as SupabaseSoundLocalHarnessValidationOwner,
  conditionalNoExecutionAcceptance: true,
  executionAllowedNow: false,
}))

export const SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_RESULT:
  SupabaseSoundLocalHarnessValidationResult = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_supabase_harness_validation_result',
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
        'SUPABASE-SOUND-4-HARNESS-FIX: fix local Supabase harness setup for SOUND draft validation, no SQL',
    },
    harness: {
      selectedHarnessPath: 'blocked',
      supabaseCliUsed: false,
      dockerUsed: false,
      harnessStartedByThisPrompt: false,
      harnessStoppedByThisPrompt: false,
      cleanupVerified: false,
    },
    commandAvailability: {
      supabaseCommandFound: true,
      supabaseVersionCheckPassed: false,
      supabaseVersionFailureSummary: 'incompatible executable on this host',
      dockerCommandFound: true,
      psqlCommandFound: true,
      pgIsreadyCommandFound: true,
      supabaseConfigTomlPresent: false,
      approvedRepoLocalHarnessFound: false,
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
      supabaseCloudTouched: false,
      supabaseMigrationsChanged: false,
      draftSqlFilesChanged: false,
      secretsExposed: false,
    },
    execution: {
      sqlExecutedAgainstLocalHarness: false,
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
      ffmpegOrFfprobeRun: false,
      modelInferenceRun: false,
      renderRun: false,
      muxRun: false,
      exportRun: false,
      creditSpendOccurred: false,
      qaRowsCreated: false,
      auditEventsCreated: false,
      costRowsCreated: false,
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
