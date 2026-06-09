export type SupabaseSoundOwnerEvidenceMode = 'owner_evidence_collection_only'

export type SupabaseSoundOwnerEvidenceUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundOwnerEvidenceWorkstream =
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'SOUND_MUSIC_AUDIO'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type SupabaseSoundOwnerPlanAcceptanceStatus = 'accepted'

export type SupabaseSoundOwnerLocalSqlAcceptanceStatus =
  | 'not_accepted'
  | 'pending_or_not_applicable'

export interface SupabaseSoundLocalSqlOwnerEvidenceEntry {
  owner: SupabaseSoundOwnerEvidenceWorkstream
  acceptanceForPlanOnly: SupabaseSoundOwnerPlanAcceptanceStatus
  acceptanceForLocalFixturePlanning: SupabaseSoundOwnerPlanAcceptanceStatus
  acceptanceForLocalSqlValidation: SupabaseSoundOwnerLocalSqlAcceptanceStatus
  acceptanceForExecution: 'not_accepted'
  evidenceFound: string[]
  evidenceMissing: string[]
  blockers: string[]
  requiredBeforeSUPABASE_SOUND_4: string[]
  nextRecommendedPrompt: string
}

export interface SupabaseSoundLocalSqlOwnerEvidence {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundOwnerEvidenceMode
  currentUnlockStage: Extract<SupabaseSoundOwnerEvidenceUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<SupabaseSoundOwnerEvidenceUnlockStage, 'generated_local_fixture_passed'>
  claimsGeneratedLocalFixturePassed: false
  goForSUPABASE_SOUND_4: false
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
  acceptanceEvidenceSummary: {
    planOnlyContinuationAccepted: true
    localOnlyFixturePlanningWithMockReferenceIdsAccepted: true
    generatedLocalFixtureExecutionAccepted: false
    localSqlValidationAccepted: false
    currentAcceptanceState: 'evidence_collection_only'
  }
  owners: SupabaseSoundLocalSqlOwnerEvidenceEntry[]
  missingEvidence: string[]
  forbiddenActionsWhileIncomplete: string[]
  recommendedImmediateNextPrompt: 'SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution'
}

const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution' as const

export const SUPABASE_SOUND_LOCAL_SQL_OWNER_EVIDENCE: SupabaseSoundLocalSqlOwnerEvidence = {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  mode: 'owner_evidence_collection_only',
  currentUnlockStage: 'dry_run_passed',
  targetFutureUnlockStage: 'generated_local_fixture_passed',
  claimsGeneratedLocalFixturePassed: false,
  goForSUPABASE_SOUND_4: false,
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
  acceptanceEvidenceSummary: {
    planOnlyContinuationAccepted: true,
    localOnlyFixturePlanningWithMockReferenceIdsAccepted: true,
    generatedLocalFixtureExecutionAccepted: false,
    localSqlValidationAccepted: false,
    currentAcceptanceState: 'evidence_collection_only',
  },
  owners: [
    {
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'not_accepted',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'SUPABASE-SOUND-1 mutation plan',
        'SUPABASE-SOUND-2 draft migration and draft tests',
        'SUPABASE-SOUND-3 local validation plan',
        'SUPABASE-SOUND-3A owner acceptance packet',
      ],
      evidenceMissing: [
        'explicit command approval for local SQL validation',
        'explicit local/non-production target proof',
        'explicit no-live-data proof',
        'explicit rollback/cleanup approval',
      ],
      blockers: [
        'SQL validation cannot run without owner approval',
        'active migrations must not be created',
        'live Supabase must not be mutated',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'local/non-production target evidence',
        'no-production confirmation',
        'no-live-data confirmation',
        'command list approval',
        'rollback/cleanup approval',
        'draft migration/test review approval',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'SOUND_MUSIC_AUDIO',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'pending_or_not_applicable',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'SOUND dry-run contract smoke',
        'dry-run evidence card',
        'generated/local fixture plan',
        'deterministic fixture spec',
        'fixture handoff packet',
        'owner checklist',
      ],
      evidenceMissing: [
        'confirmation that local SQL validation remains metadata validation only',
        'confirmation that no fixture audio or generated assets are created',
      ],
      blockers: [
        'SOUND must not claim generated_local_fixture_passed',
        'SOUND must not create artifacts',
        'SOUND must not mutate Supabase',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'SOUND confirms fixture requirements remain mock/reference-only',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'WORKER_RUNTIME_JOBS',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'not_accepted',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'no-dispatch boundary in planning docs',
        'worker execution path requires approved snapshots',
      ],
      evidenceMissing: [
        'explicit Worker Runtime acceptance',
        'no-dispatch acknowledgement',
        'no claim or lease execution confirmation',
      ],
      blockers: [
        'no worker dispatch',
        'no claim/lease execution',
        'no signed URL worker input',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'Worker Runtime no-dispatch acknowledgement',
        'idempotency expectation review',
        'raw prompt rejection confirmation',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'PROVIDER_GATEWAY_MODELS',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'not_accepted',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'provider calls are blocked',
        'provider secrets are excluded',
        'Lyria remains music/song/soundtrack planning-only',
      ],
      evidenceMissing: [
        'explicit Provider Gateway acceptance',
        'no-provider-call acknowledgement',
        'credential exclusion confirmation',
      ],
      blockers: [
        'no provider call',
        'no provider transport',
        'no provider fallback',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'Provider Gateway no-call acknowledgement',
        'credential exclusion confirmation',
        'Lyria boundary confirmation',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'OBSERVABILITY_AUDIT_COST',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'not_accepted',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'evidence capture expectations documented',
        'advisor capture expectations documented',
      ],
      evidenceMissing: [
        'explicit Observability acceptance',
        'validation output capture approval',
        'advisor capture approval',
      ],
      blockers: [
        'no silent acceptance',
        'no production readiness claim',
        'no unaudited cost path',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'validation output capture acceptance',
        'security/performance advisor capture acceptance',
        'no-readiness-claim acknowledgement',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'BILLING_STRIPE_CREDITS',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'not_accepted',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'credit spend path blocked',
        'credit reservation path blocked',
        'credit approval path blocked',
      ],
      evidenceMissing: [
        'explicit Billing acceptance',
        'no-spend acknowledgement',
        'no-reservation acknowledgement',
      ],
      blockers: [
        'no credit rows',
        'no credit approval',
        'no credit reservation',
        'no spend',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'no-spend acknowledgement',
        'no-reservation acknowledgement',
        'no-approval acknowledgement',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'TRACK_A_RENDER_EXPORT',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'not_accepted',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'Track A final export remains false/not-ready',
      ],
      evidenceMissing: [
        'explicit Track A acceptance',
        'no-final-export acknowledgement',
      ],
      blockers: [
        'no final export',
        'no mux',
        'no delivery',
        'no readiness claim',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'no-final-export acknowledgement',
        'future handoff boundary review',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'TRACK_B_MEDIA_PROCESSING',
      acceptanceForPlanOnly: 'accepted',
      acceptanceForLocalFixturePlanning: 'accepted',
      acceptanceForLocalSqlValidation: 'not_accepted',
      acceptanceForExecution: 'not_accepted',
      evidenceFound: [
        'Track B execution remains not accepted',
        'FFmpeg/model/media processing remain blocked',
      ],
      evidenceMissing: [
        'explicit Track B acceptance',
        'no-processing acknowledgement',
      ],
      blockers: [
        'no media processing',
        'no audio processing',
        'no FFmpeg execution',
        'no model execution',
      ],
      requiredBeforeSUPABASE_SOUND_4: [
        'no-processing acknowledgement',
        'future processing boundary review',
      ],
      nextRecommendedPrompt: recommendedImmediateNextPrompt,
    },
  ],
  missingEvidence: [
    'no explicit SUPABASE_RLS_STORAGE_DATABASE command approval for local SQL validation',
    'no explicit local/non-production target proof',
    'no explicit no-live-data proof',
    'no explicit rollback/cleanup approval',
    'no explicit Worker Runtime acceptance',
    'no explicit Provider Gateway acceptance',
    'no explicit Observability acceptance',
    'no explicit Billing acceptance',
    'no explicit Track A acceptance',
    'no explicit Track B acceptance',
  ],
  forbiddenActionsWhileIncomplete: [
    'no SQL execution',
    'no migration commands',
    'no Supabase mutation',
    'no storage writes',
    'no signed URLs',
    'no provider calls',
    'no worker dispatch',
    'no generated assets',
    'no credit rows',
    'no public artifacts',
    'no staging, beta, external beta, paid production, or production claims',
  ],
  recommendedImmediateNextPrompt,
}
