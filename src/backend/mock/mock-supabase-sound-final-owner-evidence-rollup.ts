export type SupabaseSoundFinalOwnerEvidenceRollupMode = 'final_owner_evidence_rollup_only'

export type SupabaseSoundFinalOwnerEvidenceRollupStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundFinalOwnerEvidenceRollupOwner =
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export interface SupabaseSoundFinalOwnerEvidenceEntry {
  owner: SupabaseSoundFinalOwnerEvidenceRollupOwner
  evidenceDoc: string
  specFile: string
  smokeFile: string
  decision: string
  conditionalNoExecutionAcceptance: true
  executionAllowedNow: false
  remainingBlockers: string[]
  sufficientForSUPABASE_SOUND_4Proposal: true
}

export interface SupabaseSoundFinalOwnerEvidenceRollup {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundFinalOwnerEvidenceRollupMode
  currentUnlockStage: Extract<SupabaseSoundFinalOwnerEvidenceRollupStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    SupabaseSoundFinalOwnerEvidenceRollupStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    goForSUPABASE_SOUND_4_PROPOSAL: true
    goForSUPABASE_SOUND_4_EXECUTION_NOW: false
    generatedLocalFixturePassedClaimed: false
    reason: string[]
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
    renderRun: false
    muxRun: false
    exportRun: false
    creditSpendOccurred: false
    publicArtifactsCreated: false
  }
  ownerEvidence: SupabaseSoundFinalOwnerEvidenceEntry[]
  futureSUPABASE_SOUND_4Scope: {
    localThrowawayOnly: true
    noDeploy: true
    noProduction: true
    noStagingUnlessSeparatelyApproved: true
    noLiveCustomerData: true
    draftSqlValidationOnly: true
    draftRlsStorageTestValidationOnly: true
    noProviderCalls: true
    noWorkerDispatch: true
    noSignedUrls: true
    noPublicArtifacts: true
    noGeneratedAudioOrAssets: true
    noCreditSpendOrReservation: true
    noRenderExport: true
    claimsGeneratedLocalFixturePassed: false
    recordValidationOutputOnly: true
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
    'SUPABASE-SOUND-4: run draft migration validation in approved local throwaway database, no deploy'
}

const ownerEvidence: SupabaseSoundFinalOwnerEvidenceEntry[] = [
  {
    owner: 'SOUND_MUSIC_AUDIO',
    evidenceDoc: 'docs/sound-supabase-local-sql-scope-acceptance.md',
    specFile: 'src/backend/mock/mock-sound-supabase-local-sql-scope-acceptance.ts',
    smokeFile: 'server/smoke/sound-supabase-local-sql-scope-acceptance-smoke.ts',
    decision: 'conditional_sound_scope_acceptance_for_local_sql_validation',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: [
      'future SUPABASE-SOUND-4 prompt must stay local throwaway no-deploy',
      'generated_local_fixture_passed remains unclaimed',
    ],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
  {
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    evidenceDoc: 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md',
    specFile: 'src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision.ts',
    smokeFile: 'server/smoke/supabase-sound-local-sql-supabase-owner-decision-smoke.ts',
    decision: 'conditional_supabase_owner_acceptance_for_future_local_sql_validation',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: [
      'local throwaway target must be named in the future prompt',
      'exact command list must be approved in the future prompt',
      'rollback and cleanup expectations must be included',
    ],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
  {
    owner: 'WORKER_RUNTIME_JOBS',
    evidenceDoc: 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md',
    specFile: 'src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance.ts',
    smokeFile: 'server/smoke/worker-runtime-sound-audio-fixture-payload-acceptance-smoke.ts',
    decision: 'conditional_worker_runtime_acceptance_for_future_payload_shape_validation',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: ['worker dispatch remains blocked', 'payload-shape validation remains future no-dispatch work'],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
  {
    owner: 'PROVIDER_GATEWAY_MODELS',
    evidenceDoc: 'docs/provider-gateway-sound-fixture-boundary-audit.md',
    specFile: 'src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance.ts',
    smokeFile: 'server/smoke/provider-gateway-sound-fixture-boundary-acceptance-smoke.ts',
    decision: 'conditional_provider_gateway_acceptance_for_no_provider_local_fixture',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: ['provider calls remain blocked', 'provider routes, license, fallback, and secrets remain future work'],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
  {
    owner: 'OBSERVABILITY_AUDIT_COST',
    evidenceDoc: 'docs/observability-sound-fixture-evidence-audit.md',
    specFile: 'src/backend/mock/mock-observability-sound-fixture-evidence-acceptance.ts',
    smokeFile: 'server/smoke/observability-sound-fixture-evidence-acceptance-smoke.ts',
    decision: 'conditional_observability_acceptance_for_metadata_only_fixture_evidence',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: ['persisted QA audit and cost rows remain blocked', 'advisor commands remain blocked'],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
  {
    owner: 'BILLING_STRIPE_CREDITS',
    evidenceDoc: 'docs/billing-sound-fixture-credit-placeholder-audit.md',
    specFile: 'src/backend/mock/mock-billing-sound-fixture-credit-placeholder-acceptance.ts',
    smokeFile: 'server/smoke/billing-sound-fixture-credit-placeholder-acceptance-smoke.ts',
    decision: 'conditional_billing_acceptance_for_no_spend_fixture_credit_placeholder',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: ['credit rows remain blocked', 'Stripe and payment operations remain blocked'],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    evidenceDoc: 'docs/track-a-sound-final-composition-handoff-audit.md',
    specFile: 'src/backend/mock/mock-track-a-sound-final-composition-handoff-acceptance.ts',
    smokeFile: 'server/smoke/track-a-sound-final-composition-handoff-acceptance-smoke.ts',
    decision: 'conditional_track_a_acceptance_for_metadata_only_final_composition_handoff',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: ['render mux export and public delivery remain blocked'],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    evidenceDoc: 'docs/track-b-sound-media-processing-handoff-audit.md',
    specFile: 'src/backend/mock/mock-track-b-sound-media-processing-handoff-acceptance.ts',
    smokeFile: 'server/smoke/track-b-sound-media-processing-handoff-acceptance-smoke.ts',
    decision: 'conditional_track_b_acceptance_for_metadata_only_media_processing_handoff',
    conditionalNoExecutionAcceptance: true,
    executionAllowedNow: false,
    remainingBlockers: [
      'media processing remains blocked',
      'FFmpeg ffprobe cleanup separation analysis and model inference remain blocked',
    ],
    sufficientForSUPABASE_SOUND_4Proposal: true,
  },
]

export const SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP: SupabaseSoundFinalOwnerEvidenceRollup = {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  mode: 'final_owner_evidence_rollup_only',
  currentUnlockStage: 'dry_run_passed',
  targetFutureUnlockStage: 'generated_local_fixture_passed',
  claimsGeneratedLocalFixturePassed: false,
  decision: {
    goForSUPABASE_SOUND_4_PROPOSAL: true,
    goForSUPABASE_SOUND_4_EXECUTION_NOW: false,
    generatedLocalFixturePassedClaimed: false,
    reason: [
      'all eight required owners have conditional no-execution acceptance evidence',
      'source-of-truth path is represented',
      'raw prompt execution remains blocked',
      'future SUPABASE-SOUND-4 scope remains local throwaway no-deploy validation only',
    ],
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
    renderRun: false,
    muxRun: false,
    exportRun: false,
    creditSpendOccurred: false,
    publicArtifactsCreated: false,
  },
  ownerEvidence,
  futureSUPABASE_SOUND_4Scope: {
    localThrowawayOnly: true,
    noDeploy: true,
    noProduction: true,
    noStagingUnlessSeparatelyApproved: true,
    noLiveCustomerData: true,
    draftSqlValidationOnly: true,
    draftRlsStorageTestValidationOnly: true,
    noProviderCalls: true,
    noWorkerDispatch: true,
    noSignedUrls: true,
    noPublicArtifacts: true,
    noGeneratedAudioOrAssets: true,
    noCreditSpendOrReservation: true,
    noRenderExport: true,
    claimsGeneratedLocalFixturePassed: false,
    recordValidationOutputOnly: true,
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
    'SUPABASE-SOUND-4: run draft migration validation in approved local throwaway database, no deploy',
}
