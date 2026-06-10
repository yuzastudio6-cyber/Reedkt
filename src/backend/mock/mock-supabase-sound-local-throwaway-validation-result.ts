export type SupabaseSoundLocalThrowawayValidationMode = 'local_throwaway_validation_result'

export type SupabaseSoundLocalThrowawayValidationStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalThrowawayValidationOwner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SupabaseSoundLocalThrowawayValidationOutcome = boolean | 'blocked'
export type SupabaseSoundLocalThrowawayTestOutcome = boolean | 'blocked' | 'text_only'

export interface SupabaseSoundLocalThrowawayOwnerEvidence {
  owner: SupabaseSoundLocalThrowawayValidationOwner
  conditionalNoExecutionAcceptance: true
  executionStillBlocked: true
  evidenceDoc: string
}

export interface SupabaseSoundLocalThrowawayValidationResult {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalThrowawayValidationMode
  currentUnlockStage: Extract<SupabaseSoundLocalThrowawayValidationStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalThrowawayValidationStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    goForSUPABASE_SOUND_4_PROPOSAL_PREVIOUSLY: true
    localValidationAttempted: false
    localValidationPassed: false
    draftMigrationPassed: Extract<SupabaseSoundLocalThrowawayValidationOutcome, 'blocked'>
    draftTestsPassed: Extract<SupabaseSoundLocalThrowawayTestOutcome, 'blocked'>
    generatedLocalFixturePassedClaimed: false
    blockReason: string[]
    recommendedImmediateNextPrompt: 'SUPABASE-SOUND-4-BLOCKED: local throwaway database setup plan, no SQL'
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
    localTargetVerified: false
    pgIsReadyResult: 'localhost:5432 - no response'
  }
  execution: {
    sqlExecuted: false
    sqlExecutedOnlyAgainstLocalThrowaway: false
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
    throwawayDatabaseCreated: false
    throwawayDatabaseDropped: false
    cleanupVerified: true
    cleanupNotes: string[]
  }
  ownerEvidence: SupabaseSoundLocalThrowawayOwnerEvidence[]
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

const ownerEvidence: SupabaseSoundLocalThrowawayOwnerEvidence[] = [
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

export const SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RESULT:
  SupabaseSoundLocalThrowawayValidationResult = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_throwaway_validation_result',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      goForSUPABASE_SOUND_4_PROPOSAL_PREVIOUSLY: true,
      localValidationAttempted: false,
      localValidationPassed: false,
      draftMigrationPassed: 'blocked',
      draftTestsPassed: 'blocked',
      generatedLocalFixturePassedClaimed: false,
      blockReason: [
        'no safe local throwaway database target was available',
        'pg_isready against localhost returned no response',
        'SQL execution stopped before database creation or validation',
      ],
      recommendedImmediateNextPrompt:
        'SUPABASE-SOUND-4-BLOCKED: local throwaway database setup plan, no SQL',
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
      localTargetVerified: false,
      pgIsReadyResult: 'localhost:5432 - no response',
    },
    execution: {
      sqlExecuted: false,
      sqlExecutedOnlyAgainstLocalThrowaway: false,
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
      throwawayDatabaseCreated: false,
      throwawayDatabaseDropped: false,
      cleanupVerified: true,
      cleanupNotes: [
        'no throwaway database was created',
        'cleanup is verified by absence of database creation in this blocked path',
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
