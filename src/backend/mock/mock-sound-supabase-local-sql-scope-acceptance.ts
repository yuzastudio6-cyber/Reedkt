export type SoundSupabaseLocalSqlScopeAcceptanceMode = 'sound_scope_acceptance_audit_only'

export type SoundSupabaseLocalSqlScopeAcceptanceUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SoundSupabaseLocalSqlScopeAcceptanceOwner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SoundSupabaseLocalSqlScopeDecision =
  | 'conditional_sound_scope_acceptance_for_local_sql_validation'
  | 'sound_rejects_local_sql_validation_scope_for_now'

export type SoundSupabaseLocalSqlScopeOwnerStatus =
  | 'accepted_conditionally'
  | 'not_accepted_for_execution'

export type SoundSupabaseLocalSqlScopeArea =
  | 'structured_findings'
  | 'edit_intents'
  | 'approved_snapshot'
  | 'timing_aware_cue_manifest'
  | 'private_audio_artifact_manifest'
  | 'fixture_spec'
  | 'checksum_private_path_expectation'
  | 'source_of_truth_path'
  | 'lyria_boundary'
  | 'sfx_foley_ambience_provider_boundary'
  | 'supabase_local_sql_validation_scope'
  | 'worker_runtime_payload_shape_validation_scope'
  | 'provider_gateway_no_provider_fixture_scope'
  | 'observability_metadata_only_evidence_scope'
  | 'billing_no_spend_placeholder_scope'
  | 'track_a_metadata_only_handoff_scope'
  | 'track_b_metadata_only_handoff_scope'
  | 'generated_local_fixture_passed_claim'

export interface SoundSupabaseLocalSqlScopeReadinessEntry {
  area: SoundSupabaseLocalSqlScopeArea
  currentRepoEvidence: string[]
  soundAcceptsLocalSqlValidationScope: boolean
  executionAllowedNow: false
  missingBeforeGeneratedLocalFixturePassed: string[]
  owner: SoundSupabaseLocalSqlScopeAcceptanceOwner
}

export interface SoundSupabaseLocalSqlScopeOwnerEntry {
  owner: SoundSupabaseLocalSqlScopeAcceptanceOwner
  status: SoundSupabaseLocalSqlScopeOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface SoundSupabaseLocalSqlScopeAcceptance {
  workstream: 'SOUND_MUSIC_AUDIO'
  relatedSourceWorkstreams: [
    'SUPABASE_RLS_STORAGE_DATABASE',
    'WORKER_RUNTIME_JOBS',
    'PROVIDER_GATEWAY_MODELS',
    'OBSERVABILITY_AUDIT_COST',
    'BILLING_STRIPE_CREDITS',
    'TRACK_A_RENDER_EXPORT',
    'TRACK_B_MEDIA_PROCESSING',
  ]
  mode: SoundSupabaseLocalSqlScopeAcceptanceMode
  currentUnlockStage: Extract<SoundSupabaseLocalSqlScopeAcceptanceUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SoundSupabaseLocalSqlScopeAcceptanceUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    soundDecision: Extract<
      SoundSupabaseLocalSqlScopeDecision,
      'conditional_sound_scope_acceptance_for_local_sql_validation'
    >
    soundAcceptsLocalSqlValidationScope: true
    soundAllowsFinalOwnerEvidenceRollup: true
    soundAllowsSUPABASE_SOUND_4ExecutionNow: false
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    sqlExecuted: false
    supabaseMutationPerformed: false
    migrationDeployed: false
    rowsCreated: false
    storageObjectsCreated: false
    signedUrlsCreated: false
    publicArtifactsCreated: false
    providerCallsMade: false
    workersDispatched: false
    generatedAudioCreated: false
    generatedAssetsCreated: false
    mediaProcessingRun: false
    ffmpegRun: false
    ffprobeRun: false
    modelInferenceRun: false
    renderRun: false
    muxRun: false
    exportRun: false
    creditRowsCreated: false
    creditSpendOccurred: false
    approvalRecordsCreated: false
    qaReportsCreated: false
    auditEventsCreated: false
    costRowsCreated: false
  }
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  scopeReadiness: SoundSupabaseLocalSqlScopeReadinessEntry[]
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
  lyriaBoundary: {
    musicSongSoundtrackPlanningOnly: true
    sfxAllowed: false
    foleyAllowed: false
    ambienceAllowed: false
    generationAllowed: false
    providerGatewayRequiredBeforeTransport: true
  }
  crossOwnerStatus: SoundSupabaseLocalSqlScopeOwnerEntry[]
  recommendedImmediateNextPrompt:
    'SUPABASE-SOUND-3E: final owner evidence rollup for SUPABASE-SOUND-4 go/no-go, no execution'
}

const scopeReadiness: SoundSupabaseLocalSqlScopeReadinessEntry[] = [
  {
    area: 'structured_findings',
    currentRepoEvidence: ['SOUND dry-run contract requires structured finding IDs'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future accepted fixture record validation output'],
    owner: 'SOUND_MUSIC_AUDIO',
  },
  {
    area: 'edit_intents',
    currentRepoEvidence: ['SOUND dry-run contract requires edit intent IDs'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future accepted fixture record validation output'],
    owner: 'SOUND_MUSIC_AUDIO',
  },
  {
    area: 'approved_snapshot',
    currentRepoEvidence: ['Supabase and worker packets require approved snapshots'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future local row validation and final owner evidence rollup'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
  },
  {
    area: 'timing_aware_cue_manifest',
    currentRepoEvidence: ['SOUND planner and evidence cards expose timing-aware cue manifests'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future fixture validation mapping'],
    owner: 'SOUND_MUSIC_AUDIO',
  },
  {
    area: 'private_audio_artifact_manifest',
    currentRepoEvidence: ['SOUND planner and evidence cards expose private artifact manifests'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future private path and checksum row validation'],
    owner: 'SOUND_MUSIC_AUDIO',
  },
  {
    area: 'fixture_spec',
    currentRepoEvidence: ['SOUND-3B fixture spec is deterministic and mock reference only'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future local SQL validation mapping'],
    owner: 'SOUND_MUSIC_AUDIO',
  },
  {
    area: 'checksum_private_path_expectation',
    currentRepoEvidence: ['SOUND and Supabase packets require checksum and private path expectations'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future local validation output only'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
  },
  {
    area: 'source_of_truth_path',
    currentRepoEvidence: ['Source-of-truth rule is documented across owner packets'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['final owner evidence rollup'],
    owner: 'SOUND_MUSIC_AUDIO',
  },
  {
    area: 'lyria_boundary',
    currentRepoEvidence: ['Provider Gateway accepts Lyria as music song soundtrack planning only'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['no-provider local validation preservation'],
    owner: 'PROVIDER_GATEWAY_MODELS',
  },
  {
    area: 'sfx_foley_ambience_provider_boundary',
    currentRepoEvidence: ['Provider Gateway keeps SFX and ambience providers blocked or metadata only'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['no-provider local validation preservation'],
    owner: 'PROVIDER_GATEWAY_MODELS',
  },
  {
    area: 'supabase_local_sql_validation_scope',
    currentRepoEvidence: ['Supabase owner conditionally accepts future local throwaway validation'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['final go no-go and explicit local target'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
  },
  {
    area: 'worker_runtime_payload_shape_validation_scope',
    currentRepoEvidence: ['Worker Runtime accepts payload-shape validation only'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future no-dispatch validation command approval'],
    owner: 'WORKER_RUNTIME_JOBS',
  },
  {
    area: 'provider_gateway_no_provider_fixture_scope',
    currentRepoEvidence: ['Provider Gateway accepts no-provider metadata/spec validation only'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future provider route contract remains blocked'],
    owner: 'PROVIDER_GATEWAY_MODELS',
  },
  {
    area: 'observability_metadata_only_evidence_scope',
    currentRepoEvidence: ['Observability accepts metadata-only expectations'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future evidence format validation'],
    owner: 'OBSERVABILITY_AUDIT_COST',
  },
  {
    area: 'billing_no_spend_placeholder_scope',
    currentRepoEvidence: ['Billing accepts metadata-only no-spend placeholders'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future no-spend evidence validation'],
    owner: 'BILLING_STRIPE_CREDITS',
  },
  {
    area: 'track_a_metadata_only_handoff_scope',
    currentRepoEvidence: ['Track A accepts final-composition handoff expectations only'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future no-render handoff validation'],
    owner: 'TRACK_A_RENDER_EXPORT',
  },
  {
    area: 'track_b_metadata_only_handoff_scope',
    currentRepoEvidence: ['Track B accepts media-processing handoff expectations only'],
    soundAcceptsLocalSqlValidationScope: true,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future no-processing handoff validation'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
  },
  {
    area: 'generated_local_fixture_passed_claim',
    currentRepoEvidence: ['All packets keep the target unclaimed'],
    soundAcceptsLocalSqlValidationScope: false,
    executionAllowedNow: false,
    missingBeforeGeneratedLocalFixturePassed: ['future accepted local fixture evidence after validation'],
    owner: 'SOUND_MUSIC_AUDIO',
  },
]

const crossOwnerStatus: SoundSupabaseLocalSqlScopeOwnerEntry[] = [
  {
    owner: 'SOUND_MUSIC_AUDIO',
    status: 'accepted_conditionally',
    evidence: ['SOUND-SUPABASE-ACCEPT-0 accepts future local SQL validation scope only'],
    missingEvidence: ['final owner evidence rollup', 'later explicit no-execution validation prompt'],
  },
  {
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    status: 'accepted_conditionally',
    evidence: ['SUPABASE-SOUND-3D conditionally accepts future local throwaway SQL validation only'],
    missingEvidence: ['local target name', 'command approval', 'rollback cleanup confirmation'],
  },
  {
    owner: 'WORKER_RUNTIME_JOBS',
    status: 'accepted_conditionally',
    evidence: ['WORKER-RUNTIME-SOUND-0 accepts future payload-shape validation only'],
    missingEvidence: ['future no-dispatch payload validation command approval'],
  },
  {
    owner: 'PROVIDER_GATEWAY_MODELS',
    status: 'accepted_conditionally',
    evidence: ['PROVIDER-GATEWAY-SOUND-0 accepts no-provider local fixture validation only'],
    missingEvidence: ['future provider route contract and license evidence before any provider execution'],
  },
  {
    owner: 'OBSERVABILITY_AUDIT_COST',
    status: 'accepted_conditionally',
    evidence: ['OBSERVABILITY-SOUND-0 accepts metadata-only QA audit cost evidence expectations'],
    missingEvidence: ['future evidence format validation'],
  },
  {
    owner: 'BILLING_STRIPE_CREDITS',
    status: 'accepted_conditionally',
    evidence: ['BILLING-SOUND-0 accepts metadata-only no-spend credit placeholder expectations'],
    missingEvidence: ['future no-spend evidence validation'],
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    status: 'accepted_conditionally',
    evidence: ['TRACK-A-SOUND-0 accepts metadata-only final composition handoff expectations'],
    missingEvidence: ['future no-render no-export validation evidence'],
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    status: 'accepted_conditionally',
    evidence: ['TRACK-B-SOUND-0 accepts metadata-only media processing handoff expectations'],
    missingEvidence: ['future no-processing validation evidence'],
  },
]

export const SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE: SoundSupabaseLocalSqlScopeAcceptance = {
  workstream: 'SOUND_MUSIC_AUDIO',
  relatedSourceWorkstreams: [
    'SUPABASE_RLS_STORAGE_DATABASE',
    'WORKER_RUNTIME_JOBS',
    'PROVIDER_GATEWAY_MODELS',
    'OBSERVABILITY_AUDIT_COST',
    'BILLING_STRIPE_CREDITS',
    'TRACK_A_RENDER_EXPORT',
    'TRACK_B_MEDIA_PROCESSING',
  ],
  mode: 'sound_scope_acceptance_audit_only',
  currentUnlockStage: 'dry_run_passed',
  targetFutureUnlockStage: 'generated_local_fixture_passed',
  claimsGeneratedLocalFixturePassed: false,
  decision: {
    soundDecision: 'conditional_sound_scope_acceptance_for_local_sql_validation',
    soundAcceptsLocalSqlValidationScope: true,
    soundAllowsFinalOwnerEvidenceRollup: true,
    soundAllowsSUPABASE_SOUND_4ExecutionNow: false,
    globalGoForSUPABASE_SOUND_4: false,
    reasonGlobalGoBlocked: [
      'SUPABASE-SOUND-4 requires a final owner evidence rollup',
      'local target and command approval remain future work',
      'generated_local_fixture_passed remains unclaimed',
    ],
  },
  execution: {
    sqlExecuted: false,
    supabaseMutationPerformed: false,
    migrationDeployed: false,
    rowsCreated: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    providerCallsMade: false,
    workersDispatched: false,
    generatedAudioCreated: false,
    generatedAssetsCreated: false,
    mediaProcessingRun: false,
    ffmpegRun: false,
    ffprobeRun: false,
    modelInferenceRun: false,
    renderRun: false,
    muxRun: false,
    exportRun: false,
    creditRowsCreated: false,
    creditSpendOccurred: false,
    approvalRecordsCreated: false,
    qaReportsCreated: false,
    auditEventsCreated: false,
    costRowsCreated: false,
  },
  acceptedConditions: [
    'future local SQL validation scope is draft fixture record validation only',
    'structured findings must be represented',
    'edit intents must be represented',
    'approved plan snapshot reference is required',
    'timing-aware cue manifest reference is required',
    'private audio artifact manifest reference is required',
    'fixture spec reference is accepted as mock reference only input',
    'checksum and private path expectations are required',
    'source-of-truth path is accepted',
    'raw prompt execution is rejected',
    'signed URLs are rejected as source of truth',
    'Lyria is music song soundtrack planning metadata only',
    'SFX foley ambience fixture scope remains no-provider metadata only',
    'all related owner acceptances remain metadata-only and no-execution',
  ],
  rejectedOrStillBlocked: [
    'generated_local_fixture_passed claim',
    'SUPABASE-SOUND-4 execution now',
    'SQL execution',
    'Supabase mutation',
    'migration deployment',
    'row creation',
    'storage object creation',
    'signed URL creation',
    'public artifact delivery',
    'provider calls',
    'worker dispatch',
    'generated audio creation',
    'generated asset creation',
    'media processing',
    'FFmpeg execution',
    'ffprobe execution',
    'model inference',
    'render mux export',
    'credit rows or spend',
    'persisted QA reports audit events or cost rows',
  ],
  scopeReadiness,
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
  lyriaBoundary: {
    musicSongSoundtrackPlanningOnly: true,
    sfxAllowed: false,
    foleyAllowed: false,
    ambienceAllowed: false,
    generationAllowed: false,
    providerGatewayRequiredBeforeTransport: true,
  },
  crossOwnerStatus,
  recommendedImmediateNextPrompt:
    'SUPABASE-SOUND-3E: final owner evidence rollup for SUPABASE-SOUND-4 go/no-go, no execution',
}
