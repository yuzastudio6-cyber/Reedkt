export type SupabaseSoundLocalSqlSupabaseOwnerDecisionMode = 'supabase_owner_decision_only'

export type SupabaseSoundLocalSqlSupabaseOwnerDecisionUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalSqlSupabaseOwnerDecisionWorkstream =
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'SOUND_MUSIC_AUDIO'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SupabaseSoundLocalSqlSupabaseOwnerDecisionStatus =
  | 'conditional_supabase_owner_acceptance_for_future_local_sql_validation'
  | 'supabase_owner_rejects_local_sql_validation_for_now'

export type SupabaseSoundLocalSqlCrossOwnerStatus =
  | 'accepted_conditionally'
  | 'missing'
  | 'not_accepted_for_execution'

export interface SupabaseSoundLocalSqlCrossOwnerDecisionEntry {
  owner: SupabaseSoundLocalSqlSupabaseOwnerDecisionWorkstream
  status: SupabaseSoundLocalSqlCrossOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface SupabaseSoundLocalSqlSupabaseOwnerDecision {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalSqlSupabaseOwnerDecisionMode
  currentUnlockStage: Extract<SupabaseSoundLocalSqlSupabaseOwnerDecisionUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundLocalSqlSupabaseOwnerDecisionUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    supabaseOwnerDecision: Extract<
      SupabaseSoundLocalSqlSupabaseOwnerDecisionStatus,
      'conditional_supabase_owner_acceptance_for_future_local_sql_validation'
    >
    supabaseOwnerAllowsFutureLocalValidation: true
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    sqlExecuted: false
    migrationDeployed: false
    rowsCreated: false
    storageObjectsCreated: false
    signedUrlsCreated: false
    providerCallsMade: false
    workersDispatched: false
    generatedAssetsCreated: false
    creditRowsCreated: false
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
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  requiredBeforeSUPABASE_SOUND_4: string[]
  crossOwnerStatus: SupabaseSoundLocalSqlCrossOwnerDecisionEntry[]
  recommendedImmediateNextPrompt: 'WORKER-RUNTIME-SOUND-0: audio fixture payload acceptance audit'
}

const recommendedImmediateNextPrompt =
  'WORKER-RUNTIME-SOUND-0: audio fixture payload acceptance audit' as const

export const SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION: SupabaseSoundLocalSqlSupabaseOwnerDecision = {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  mode: 'supabase_owner_decision_only',
  currentUnlockStage: 'dry_run_passed',
  targetFutureUnlockStage: 'generated_local_fixture_passed',
  claimsGeneratedLocalFixturePassed: false,
  decision: {
    supabaseOwnerDecision: 'conditional_supabase_owner_acceptance_for_future_local_sql_validation',
    supabaseOwnerAllowsFutureLocalValidation: true,
    globalGoForSUPABASE_SOUND_4: false,
    reasonGlobalGoBlocked: [
      'SOUND_MUSIC_AUDIO explicit scope acceptance remains missing',
      'WORKER_RUNTIME_JOBS no-dispatch and raw prompt rejection acceptance remains missing',
      'PROVIDER_GATEWAY_MODELS no-provider and credential exclusion acceptance remains missing',
      'OBSERVABILITY_AUDIT_COST evidence capture acceptance remains missing',
      'BILLING_STRIPE_CREDITS no-spend acceptance remains missing',
      'TRACK_A_RENDER_EXPORT no-export acceptance remains missing',
      'TRACK_B_MEDIA_PROCESSING no-processing acceptance remains missing',
    ],
  },
  execution: {
    sqlExecuted: false,
    migrationDeployed: false,
    rowsCreated: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    providerCallsMade: false,
    workersDispatched: false,
    generatedAssetsCreated: false,
    creditRowsCreated: false,
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
  acceptedConditions: [
    'future validation target must be local or throwaway non-production only',
    'future validation must not target production',
    'future validation must not use live customer data',
    'future validation must not target staging without later explicit staging approval',
    'future validation may inspect draft SQL and draft RLS/storage tests only after owner-reviewed command approval',
    'future validation output capture must be local and text-only',
    'future validation must preserve signed URL source-of-truth rejection',
    'future validation must preserve public artifact blocking',
    'future validation must preserve no provider calls and no worker dispatch',
    'future validation must preserve no credit spend or reservation',
    'future validation must preserve no Track A export and no Track B processing',
    'future validation must include rollback and cleanup expectations before any run',
  ],
  rejectedOrStillBlocked: [
    'production SQL validation',
    'staging SQL validation without later explicit approval',
    'live customer data',
    'live Supabase mutation',
    'active migration deployment',
    'storage bucket creation',
    'storage object creation',
    'signed URL creation',
    'public artifacts',
    'approved snapshot row creation',
    'generation request row creation',
    'generated asset row creation',
    'job or job event row creation',
    'credit estimate approval reservation spend refund or release rows',
    'feature gate changes',
    'tool capability seeding',
    'worker runtime config creation',
    'provider calls',
    'worker dispatch',
    'Track A final mux export',
    'Track B media audio processing',
    'generated_local_fixture_passed claim',
  ],
  requiredBeforeSUPABASE_SOUND_4: [
    'local or throwaway non-production environment target named',
    'no-production confirmation captured',
    'no-live-customer-data confirmation captured',
    'exact local validation command list approved',
    'rollback and cleanup plan confirmed',
    'local text-only output capture plan confirmed',
    'draft SQL and draft test review complete',
    'active migration path absence reconfirmed',
    'SOUND_MUSIC_AUDIO scope acceptance captured',
    'WORKER_RUNTIME_JOBS no-dispatch and raw prompt rejection acceptance captured',
    'PROVIDER_GATEWAY_MODELS no-provider and credential exclusion acceptance captured',
    'OBSERVABILITY_AUDIT_COST evidence capture acceptance captured',
    'BILLING_STRIPE_CREDITS no-spend acceptance captured',
    'TRACK_A_RENDER_EXPORT no-export acceptance captured',
    'TRACK_B_MEDIA_PROCESSING no-processing acceptance captured',
  ],
  crossOwnerStatus: [
    {
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      status: 'accepted_conditionally',
      evidence: [
        'SUPABASE-SOUND-1 mutation plan exists',
        'SUPABASE-SOUND-2 draft migration and draft tests exist',
        'SUPABASE-SOUND-3 local validation plan exists',
        'SUPABASE-SOUND-3A owner acceptance packet exists',
        'SUPABASE-SOUND-3B owner evidence packet exists',
        'SUPABASE-SOUND-3C approval request packet exists',
        'SUPABASE-SOUND-3D records local throwaway only conditional acceptance',
      ],
      missingEvidence: [
        'future local target name',
        'future command approval',
        'future rollback cleanup confirmation',
      ],
    },
    {
      owner: 'SOUND_MUSIC_AUDIO',
      status: 'missing',
      evidence: [
        'SOUND fixture plan exists',
        'SOUND fixture spec exists',
        'SOUND fixture handoff packet exists',
        'SOUND owner checklist exists',
      ],
      missingEvidence: [
        'explicit SOUND acceptance that local SQL validation remains metadata-only',
        'explicit no generated_local_fixture_passed claim acknowledgement',
      ],
    },
    {
      owner: 'WORKER_RUNTIME_JOBS',
      status: 'missing',
      evidence: [
        'planning docs state worker dispatch is blocked',
        'planning docs require approved snapshots before execution',
      ],
      missingEvidence: [
        'explicit no-dispatch acceptance',
        'raw prompt rejection acceptance',
        'idempotency and payload boundary acceptance',
      ],
    },
    {
      owner: 'PROVIDER_GATEWAY_MODELS',
      status: 'missing',
      evidence: [
        'planning docs state provider calls are blocked',
        'planning docs state provider credentials are excluded',
      ],
      missingEvidence: [
        'explicit no-provider-call acceptance',
        'credential exclusion acceptance',
        'Lyria music/song/soundtrack boundary confirmation',
      ],
    },
    {
      owner: 'OBSERVABILITY_AUDIT_COST',
      status: 'missing',
      evidence: [
        'planning docs include local text output expectations',
        'planning docs include advisor evidence expectations',
      ],
      missingEvidence: [
        'explicit evidence capture acceptance',
        'audit cost placeholder acceptance',
      ],
    },
    {
      owner: 'BILLING_STRIPE_CREDITS',
      status: 'missing',
      evidence: [
        'planning docs state no credit spend reservation refund release or payment operation',
      ],
      missingEvidence: [
        'explicit no-spend local validation acceptance',
        'credit placeholder row boundary acceptance',
      ],
    },
    {
      owner: 'TRACK_A_RENDER_EXPORT',
      status: 'missing',
      evidence: [
        'planning docs state Track A final export remains blocked',
      ],
      missingEvidence: [
        'explicit no-export acceptance',
        'timing private manifest handoff boundary acceptance',
      ],
    },
    {
      owner: 'TRACK_B_MEDIA_PROCESSING',
      status: 'missing',
      evidence: [
        'planning docs state Track B media audio processing remains blocked',
      ],
      missingEvidence: [
        'explicit no-processing acceptance',
        'FFmpeg model execution rejection acknowledgement',
      ],
    },
  ],
  recommendedImmediateNextPrompt,
}
