export type SupabaseSoundLocalBaselineSchemaHarnessPlanMode =
  'local_baseline_schema_harness_plan_only'

export type SupabaseSoundLocalBaselineSchemaHarnessStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalBaselineDependencyClassification =
  | 'supabase_platform_provided'
  | 'reeditpro_app_baseline'
  | 'sound_fixture_draft'
  | 'optional_live_metadata_surface'

export type SupabaseSoundLocalBaselineHarnessOptionId =
  | 'option_a_local_supabase_platform_stack'
  | 'option_b_repo_local_baseline_harness'
  | 'option_c_minimal_platform_stub_harness'
  | 'option_d_plain_postgres_only'

export interface SupabaseSoundLocalBaselineDependency {
  relationOrFile: string
  classification: SupabaseSoundLocalBaselineDependencyClassification
  requiredBeforeDraft: boolean
  currentPlainPostgresStatus: 'missing' | 'not_attempted' | 'present_as_draft' | 'unknown'
  harnessRequirement: string
  createsRelation: false
  seedsRows: false
}

export interface SupabaseSoundLocalBaselineHarnessOption {
  optionId: SupabaseSoundLocalBaselineHarnessOptionId
  label: string
  allowedNow: false
  requiresFutureOwnerApproval: boolean
  recommended: boolean
  plainPostgresOnly: boolean
  manualPlatformStubs: boolean
  notes: string[]
}

export interface SupabaseSoundLocalBaselineSchemaHarnessPlan {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalBaselineSchemaHarnessPlanMode
  currentUnlockStage: Extract<SupabaseSoundLocalBaselineSchemaHarnessStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalBaselineSchemaHarnessStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  blocker: {
    previousPrompt: 'SUPABASE-SOUND-4-RETRY-BASELINE'
    blockerType: 'missing_supabase_platform_prerequisites'
    missingPlatformRelations: ['auth.users', 'storage.buckets', 'storage.objects']
    plainPostgresOnlyInsufficient: true
    baselineMigrationsAttempted: 0
    draftMigrationAttempted: false
    draftTestsAttempted: false
    cleanupVerified: true
  }
  harnessPlan: {
    planOnly: true
    sqlExecuted: false
    psqlExecuted: false
    createdbExecuted: false
    dropdbExecuted: false
    supabaseCliExecuted: false
    dockerUsed: false
    serviceStarted: false
    databaseCreated: false
    databaseDropped: false
    activeMigrationCreated: false
    supabaseCloudTouched: false
  }
  dependencyClassification: SupabaseSoundLocalBaselineDependency[]
  harnessOptions: SupabaseSoundLocalBaselineHarnessOption[]
  recommendedHarnessPath: {
    preferredPath: 'approved_local_supabase_platform_baseline_harness'
    optionAAfterExplicitApproval: true
    optionBIfApprovedRepoHarnessAppears: true
    manualPlatformStubsRecommended: false
    plainPostgresOnlyAllowed: false
  }
  futureSafetyPreflight: string[]
  forbiddenHarnessPaths: string[]
  evidenceRequiredBeforeRetry: string[]
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
    psqlExecuted: false
    createdbExecuted: false
    dropdbExecuted: false
    supabaseCliExecuted: false
    dockerUsed: false
    serviceStarted: false
    migrationDeployed: false
    activeMigrationCreated: false
    supabaseMutationPerformed: false
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
  recommendedImmediateNextPrompt:
    'SUPABASE-SOUND-4-BASELINE-APPROVAL: approve local Supabase baseline harness execution, no SQL'
}

const platformDependencies: SupabaseSoundLocalBaselineDependency[] = [
  'auth.users',
  'storage.buckets',
  'storage.objects',
].map((relationOrFile) => ({
  relationOrFile,
  classification: 'supabase_platform_provided' as const,
  requiredBeforeDraft: true,
  currentPlainPostgresStatus: 'missing' as const,
  harnessRequirement:
    'must be provided by an approved local Supabase-compatible platform harness before ReEditPro app migrations load',
  createsRelation: false as const,
  seedsRows: false as const,
}))

const appBaselineDependencies: SupabaseSoundLocalBaselineDependency[] = [
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
].map((relationOrFile) => ({
  relationOrFile,
  classification: 'reeditpro_app_baseline' as const,
  requiredBeforeDraft: true,
  currentPlainPostgresStatus: 'not_attempted' as const,
  harnessRequirement:
    'must be created by approved ReEditPro app baseline migrations before the SOUND 999 draft runs',
  createsRelation: false as const,
  seedsRows: false as const,
}))

const optionalMetadataDependencies: SupabaseSoundLocalBaselineDependency[] = [
  'public.feature_gates',
  'public.tool_capabilities',
].map((relationOrFile) => ({
  relationOrFile,
  classification: 'optional_live_metadata_surface' as const,
  requiredBeforeDraft: false,
  currentPlainPostgresStatus: 'unknown' as const,
  harnessRequirement:
    'must not be seeded by this draft and may be referenced only when an approved baseline provides it',
  createsRelation: false as const,
  seedsRows: false as const,
}))

const soundDraftDependencies: SupabaseSoundLocalBaselineDependency[] = [
  'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql',
  'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql',
].map((relationOrFile) => ({
  relationOrFile,
  classification: 'sound_fixture_draft' as const,
  requiredBeforeDraft: false,
  currentPlainPostgresStatus: 'present_as_draft' as const,
  harnessRequirement:
    'must remain draft-only and run only after platform and app baseline prerequisites are approved',
  createsRelation: false as const,
  seedsRows: false as const,
}))

export const SUPABASE_SOUND_LOCAL_BASELINE_SCHEMA_HARNESS_PLAN:
  SupabaseSoundLocalBaselineSchemaHarnessPlan = {
    workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    mode: 'local_baseline_schema_harness_plan_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    blocker: {
      previousPrompt: 'SUPABASE-SOUND-4-RETRY-BASELINE',
      blockerType: 'missing_supabase_platform_prerequisites',
      missingPlatformRelations: ['auth.users', 'storage.buckets', 'storage.objects'],
      plainPostgresOnlyInsufficient: true,
      baselineMigrationsAttempted: 0,
      draftMigrationAttempted: false,
      draftTestsAttempted: false,
      cleanupVerified: true,
    },
    harnessPlan: {
      planOnly: true,
      sqlExecuted: false,
      psqlExecuted: false,
      createdbExecuted: false,
      dropdbExecuted: false,
      supabaseCliExecuted: false,
      dockerUsed: false,
      serviceStarted: false,
      databaseCreated: false,
      databaseDropped: false,
      activeMigrationCreated: false,
      supabaseCloudTouched: false,
    },
    dependencyClassification: [
      ...platformDependencies,
      ...appBaselineDependencies,
      ...optionalMetadataDependencies,
      ...soundDraftDependencies,
    ],
    harnessOptions: [
      {
        optionId: 'option_a_local_supabase_platform_stack',
        label: 'Approved local Supabase platform stack',
        allowedNow: false,
        requiresFutureOwnerApproval: true,
        recommended: true,
        plainPostgresOnly: false,
        manualPlatformStubs: false,
        notes: [
          'preferred after explicit owner approval for local Supabase-compatible stack execution',
          'must remain local, throwaway, no-cloud, no-staging, no-production, and no-live-data',
        ],
      },
      {
        optionId: 'option_b_repo_local_baseline_harness',
        label: 'Approved repo-local baseline harness',
        allowedNow: false,
        requiresFutureOwnerApproval: true,
        recommended: true,
        plainPostgresOnly: false,
        manualPlatformStubs: false,
        notes: [
          'allowed only if an approved repo-local no-cloud baseline harness appears later',
          'must supply platform prerequisites and app baseline without secrets or live data',
        ],
      },
      {
        optionId: 'option_c_minimal_platform_stub_harness',
        label: 'Minimal platform prerequisite stub harness',
        allowedNow: false,
        requiresFutureOwnerApproval: true,
        recommended: false,
        plainPostgresOnly: false,
        manualPlatformStubs: true,
        notes: [
          'not the default because stubs do not prove Supabase platform storage or RLS behavior',
          'may only validate draft syntax and guards if explicitly accepted later',
        ],
      },
      {
        optionId: 'option_d_plain_postgres_only',
        label: 'Plain local PostgreSQL only',
        allowedNow: false,
        requiresFutureOwnerApproval: false,
        recommended: false,
        plainPostgresOnly: true,
        manualPlatformStubs: false,
        notes: [
          'blocked by missing auth.users, storage.buckets, and storage.objects',
          'must not be used for another baseline retry by itself',
        ],
      },
    ],
    recommendedHarnessPath: {
      preferredPath: 'approved_local_supabase_platform_baseline_harness',
      optionAAfterExplicitApproval: true,
      optionBIfApprovedRepoHarnessAppears: true,
      manualPlatformStubsRecommended: false,
      plainPostgresOnlyAllowed: false,
    },
    futureSafetyPreflight: [
      'prove the target is local and throwaway',
      'exclude cloud, staging, production, and live customer data',
      'verify auth.users, storage.buckets, and storage.objects before app baseline migrations',
      'reconcile supabase/migration-order.md with real supabase/migrations/*.sql files',
      'verify public.approved_plan_snapshots after app baseline load',
      'verify the 999 SOUND draft SQL and draft tests are unchanged from approved inputs',
      'define cleanup and rollback before validation starts',
    ],
    forbiddenHarnessPaths: [
      'plain PostgreSQL retry without Supabase platform prerequisites',
      'manual platform stubs without explicit owner approval',
      'cloud, staging, production, or live-data targets',
      'active supabase/migrations changes from this plan',
      'feature gate, tool capability, or worker runtime config seed rows',
      'storage bucket or object creation',
      'signed URL creation or signed URL source-of-truth usage',
      'provider, worker, media, render, export, billing, Docker, or service startup execution',
    ],
    evidenceRequiredBeforeRetry: [
      'Supabase owner approval for the selected baseline harness',
      'local-only target proof plan',
      'platform prerequisite proof for auth.users, storage.buckets, and storage.objects',
      'ReEditPro app baseline migration order proof',
      'public.approved_plan_snapshots and fixture dependency proof before the 999 draft',
      'cleanup and rollback proof requirements',
      'confirmation that all non-Supabase runtime owner gates remain fail-closed',
    ],
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
      psqlExecuted: false,
      createdbExecuted: false,
      dropdbExecuted: false,
      supabaseCliExecuted: false,
      dockerUsed: false,
      serviceStarted: false,
      migrationDeployed: false,
      activeMigrationCreated: false,
      supabaseMutationPerformed: false,
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
    recommendedImmediateNextPrompt:
      'SUPABASE-SOUND-4-BASELINE-APPROVAL: approve local Supabase baseline harness execution, no SQL',
  }
