export type SupabaseSoundDraftMigrationBaselineGuardFixMode =
  'draft_migration_baseline_guard_fix_only'

export type SupabaseSoundDraftMigrationBaselineGuardFixStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundDraftBaselineRelationClassification =
  | 'required_baseline_relation'
  | 'optional_live_metadata_relation'

export interface SupabaseSoundDraftBaselineRelation {
  relation: string
  classification: SupabaseSoundDraftBaselineRelationClassification
  source: string
  guardBehavior: string
  createsRelation: false
  seedsRows: false
}

export interface SupabaseSoundDraftMigrationBaselineGuardFix {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundDraftMigrationBaselineGuardFixMode
  currentUnlockStage: Extract<SupabaseSoundDraftMigrationBaselineGuardFixStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundDraftMigrationBaselineGuardFixStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  retryFailure: {
    prompt: 'SUPABASE-SOUND-4-RETRY'
    failureType: 'missing_baseline_relation'
    missingRelation: 'public.approved_plan_snapshots'
    draftTestsExecuted: false
    cleanupVerified: true
    supabaseCloudTouched: false
  }
  fix: {
    errorCode: 'SUPABASE_SOUND_DRAFT_REQUIRES_BASELINE_SCHEMA'
    migrationDraftGuarded: true
    draftTestsGuarded: true
    usesToRegclass: true
    recreatesBaselineSchema: false
    createsActiveMigration: false
    featureGatesOptionalCommentOnly: true
    toolCapabilitiesOptionalCommentOnly: true
  }
  baselineDependencyClassification: SupabaseSoundDraftBaselineRelation[]
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
  execution: {
    sqlExecuted: false
    databaseCreated: false
    databaseDropped: false
    migrationDeployed: false
    activeMigrationCreated: false
    supabaseMutationPerformed: false
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
  recommendedImmediateNextPrompt:
    'SUPABASE-SOUND-4-RETRY-BASELINE: run draft validation against approved local baseline schema, no deploy'
}

const requiredBaselineRelations = [
  'public.approved_plan_snapshots',
  'public.storage_object_records',
  'public.signed_url_events',
  'public.generation_requests',
  'public.generated_assets',
  'public.jobs',
  'public.job_events',
  'public.sound_effect_plans',
  'public.ambient_sound_plans',
  'public.music_plans',
  'public.audio_environment_analysis',
  'public.qa_reports',
  'public.credit_estimates',
  'public.credit_approvals',
  'public.credit_reservations',
  'public.worker_runtime_configs',
] as const

const optionalLiveMetadataRelations = [
  'public.feature_gates',
  'public.tool_capabilities',
] as const

const baselineDependencyClassification: SupabaseSoundDraftBaselineRelation[] = [
  ...requiredBaselineRelations.map((relation) => ({
    relation,
    classification: 'required_baseline_relation' as const,
    source: 'existing ReEditPro baseline schema required before this draft can run',
    guardBehavior: 'missing relation raises SUPABASE_SOUND_DRAFT_REQUIRES_BASELINE_SCHEMA',
    createsRelation: false as const,
    seedsRows: false as const,
  })),
  ...optionalLiveMetadataRelations.map((relation) => ({
    relation,
    classification: 'optional_live_metadata_relation' as const,
    source: 'observed in prior live metadata but no active local create-table source found on this branch',
    guardBehavior: 'comment-only handling runs only when relation exists',
    createsRelation: false as const,
    seedsRows: false as const,
  })),
]

export const SUPABASE_SOUND_DRAFT_MIGRATION_BASELINE_GUARD_FIX:
  SupabaseSoundDraftMigrationBaselineGuardFix = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'draft_migration_baseline_guard_fix_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    retryFailure: {
      prompt: 'SUPABASE-SOUND-4-RETRY',
      failureType: 'missing_baseline_relation',
      missingRelation: 'public.approved_plan_snapshots',
      draftTestsExecuted: false,
      cleanupVerified: true,
      supabaseCloudTouched: false,
    },
    fix: {
      errorCode: 'SUPABASE_SOUND_DRAFT_REQUIRES_BASELINE_SCHEMA',
      migrationDraftGuarded: true,
      draftTestsGuarded: true,
      usesToRegclass: true,
      recreatesBaselineSchema: false,
      createsActiveMigration: false,
      featureGatesOptionalCommentOnly: true,
      toolCapabilitiesOptionalCommentOnly: true,
    },
    baselineDependencyClassification,
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
    execution: {
      sqlExecuted: false,
      databaseCreated: false,
      databaseDropped: false,
      migrationDeployed: false,
      activeMigrationCreated: false,
      supabaseMutationPerformed: false,
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
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-RETRY-BASELINE: run draft validation against approved local baseline schema, no deploy',
  }
