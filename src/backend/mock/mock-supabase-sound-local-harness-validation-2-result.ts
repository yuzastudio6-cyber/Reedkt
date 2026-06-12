export type SupabaseSoundLocalHarnessValidation2ResultMode =
  'local_supabase_harness_validation_2_result'

export type SupabaseSoundLocalHarnessValidation2Stage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalHarnessValidation2Owner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SupabaseSoundLocalHarnessValidation2Path =
  | 'local_supabase_cli_stack'
  | 'blocked'

export type SupabaseSoundLocalHarnessValidation2Status = true | false | 'blocked'

export type SupabaseSoundLocalHarnessValidation2Prerequisite =
  | true
  | false
  | 'not_attempted'

export interface SupabaseSoundLocalHarnessValidation2OwnerEvidence {
  owner: SupabaseSoundLocalHarnessValidation2Owner
  conditionalNoExecutionAcceptance: true
  executionRemainsBlockedOutsideLocalHarnessValidation: true
}

export interface SupabaseSoundLocalHarnessValidation2Result {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalHarnessValidation2ResultMode
  currentUnlockStage: Extract<SupabaseSoundLocalHarnessValidation2Stage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalHarnessValidation2Stage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    localHarnessValidationAttempted: boolean
    localHarnessValidationPassed: boolean
    platformPrerequisitesSatisfied: SupabaseSoundLocalHarnessValidation2Status
    appBaselineSatisfied: SupabaseSoundLocalHarnessValidation2Status
    draftMigrationPassed: SupabaseSoundLocalHarnessValidation2Status
    draftTestsPassed: SupabaseSoundLocalHarnessValidation2Status | 'text_only'
    generatedLocalFixturePassedClaimed: false
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-HARNESS-FIX-2: fix local Supabase harness setup based on validation output, no SQL'
  }
  harness: {
    selectedHarnessPath: SupabaseSoundLocalHarnessValidation2Path
    intendedHarnessPath: 'local_supabase_cli_stack'
    supabaseCliUsed: boolean
    dockerUsed: boolean
    harnessStartedByThisPrompt: boolean
    harnessStoppedByThisPrompt: boolean
    cleanupVerified: boolean | 'not_applicable'
  }
  toolchain: {
    hostArchitecture: 'arm64'
    nodePath: '/opt/homebrew/bin/node'
    nodeArchitecture: 'arm64'
    nodeVersion: 'v26.3.0'
    supabasePath: '/opt/homebrew/bin/supabase'
    supabaseArchitecture: 'arm64'
    supabaseVersion: '2.105.0'
    dockerPath: '/usr/local/bin/docker'
    dockerCliVersionCommandPassed: true
    dockerRuntimeAvailable: false
    dockerRuntimeFailureSummary:
      'Docker daemon was not reachable from the local Docker socket during preflight'
  }
  platformPrerequisites: {
    authUsersExists: SupabaseSoundLocalHarnessValidation2Prerequisite
    storageBucketsExists: SupabaseSoundLocalHarnessValidation2Prerequisite
    storageObjectsExists: SupabaseSoundLocalHarnessValidation2Prerequisite
    approvedPlanSnapshotsExists: SupabaseSoundLocalHarnessValidation2Prerequisite
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
    renderRun: false
    muxRun: false
    exportRun: false
    creditSpendOccurred: false
    publicArtifactsCreated: false
  }
  ownerEvidence: SupabaseSoundLocalHarnessValidation2OwnerEvidence[]
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

const ownerEvidence: SupabaseSoundLocalHarnessValidation2OwnerEvidence[] = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
].map((owner) => ({
  owner: owner as SupabaseSoundLocalHarnessValidation2Owner,
  conditionalNoExecutionAcceptance: true,
  executionRemainsBlockedOutsideLocalHarnessValidation: true,
}))

export const SUPABASE_SOUND_LOCAL_HARNESS_VALIDATION_2_RESULT:
  SupabaseSoundLocalHarnessValidation2Result = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_supabase_harness_validation_2_result',
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
        'SUPABASE-SOUND-4-HARNESS-FIX-2: fix local Supabase harness setup based on validation output, no SQL',
    },
    harness: {
      selectedHarnessPath: 'blocked',
      intendedHarnessPath: 'local_supabase_cli_stack',
      supabaseCliUsed: true,
      dockerUsed: false,
      harnessStartedByThisPrompt: false,
      harnessStoppedByThisPrompt: false,
      cleanupVerified: 'not_applicable',
    },
    toolchain: {
      hostArchitecture: 'arm64',
      nodePath: '/opt/homebrew/bin/node',
      nodeArchitecture: 'arm64',
      nodeVersion: 'v26.3.0',
      supabasePath: '/opt/homebrew/bin/supabase',
      supabaseArchitecture: 'arm64',
      supabaseVersion: '2.105.0',
      dockerPath: '/usr/local/bin/docker',
      dockerCliVersionCommandPassed: true,
      dockerRuntimeAvailable: false,
      dockerRuntimeFailureSummary:
        'Docker daemon was not reachable from the local Docker socket during preflight',
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
