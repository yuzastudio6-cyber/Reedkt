export type SupabaseSoundLocalSqlApprovalRequestsMode = 'owner_approval_requests_only'

export type SupabaseSoundLocalSqlApprovalUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SupabaseSoundLocalSqlApprovalOwner =
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'SOUND_MUSIC_AUDIO'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export interface SupabaseSoundLocalSqlApprovalRequestEntry {
  owner: SupabaseSoundLocalSqlApprovalOwner
  currentStatus: string
  approvalRequest: string[]
  evidenceNeeded: string[]
  forbiddenBypasses: string[]
  requestedResponseFormat: string[]
  nextOwnerPrompt: string
}

export interface SupabaseSoundLocalSqlApprovalRequests {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  mode: SupabaseSoundLocalSqlApprovalRequestsMode
  currentUnlockStage: Extract<SupabaseSoundLocalSqlApprovalUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<SupabaseSoundLocalSqlApprovalUnlockStage, 'generated_local_fixture_passed'>
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
  approvalRequests: SupabaseSoundLocalSqlApprovalRequestEntry[]
  aggregateMissingEvidence: string[]
  recommendedImmediateNextPrompt: 'SUPABASE-SOUND-3D: Supabase owner approval decision for local SQL validation, no execution'
}

const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-3D: Supabase owner approval decision for local SQL validation, no execution' as const

export const SUPABASE_SOUND_LOCAL_SQL_APPROVAL_REQUESTS: SupabaseSoundLocalSqlApprovalRequests = {
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  mode: 'owner_approval_requests_only',
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
  approvalRequests: [
    {
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      currentStatus: 'missing approval for local SQL validation execution',
      approvalRequest: [
        'approve or reject future local SQL validation in a throwaway/non-production database',
        'confirm no production target',
        'confirm no live customer data',
        'approve draft migration validation scope',
        'approve draft RLS/storage test validation scope',
        'approve rollback/cleanup expectations',
        'approve no signed URL source-of-truth',
        'approve no public artifact path',
      ],
      evidenceNeeded: [
        'target environment proof',
        'no-production confirmation',
        'no-live-data confirmation',
        'rollback/cleanup approval',
        'command approval',
      ],
      forbiddenBypasses: [
        'no SQL validation without owner approval',
        'no production target',
        'no live data',
      ],
      requestedResponseFormat: [
        'approval decision: approved or rejected',
        'target environment statement',
        'no-production/no-live-data statement',
        'command approval statement',
        'rollback/cleanup decision',
        'conditions or blockers',
      ],
      nextOwnerPrompt: recommendedImmediateNextPrompt,
    },
    {
      owner: 'SOUND_MUSIC_AUDIO',
      currentStatus: 'planning accepted, execution not accepted',
      approvalRequest: [
        'confirm fixture spec requirements are complete for local SQL validation',
        'confirm approved snapshot/timing/private manifest requirements',
        'confirm no provider/worker/artifact execution',
      ],
      evidenceNeeded: [
        'SOUND acceptance of fixture spec scope',
        'no generated_local_fixture_passed claim',
      ],
      forbiddenBypasses: [
        'no artifact creation from SOUND',
        'no execution claim',
      ],
      requestedResponseFormat: [
        'scope acceptance decision',
        'fixture requirement gaps, if any',
        'no-execution acknowledgement',
        'conditions or blockers',
      ],
      nextOwnerPrompt:
        'SOUND-SUPABASE-ACCEPT-0: approve local SQL validation scope for SOUND fixture records, no execution',
    },
    {
      owner: 'WORKER_RUNTIME_JOBS',
      currentStatus: 'missing acceptance',
      approvalRequest: [
        'confirm local SQL validation does not dispatch workers',
        'confirm no worker payload execution',
        'confirm raw prompt worker execution remains blocked',
        'confirm idempotency/approved snapshot expectations',
      ],
      evidenceNeeded: [
        'Worker Runtime acceptance of no-dispatch validation',
      ],
      forbiddenBypasses: [
        'no worker dispatch',
        'no ProductionWorkerJobPayload execution',
      ],
      requestedResponseFormat: [
        'no-dispatch acceptance decision',
        'worker payload boundary statement',
        'raw prompt rejection statement',
        'idempotency expectation notes',
        'conditions or blockers',
      ],
      nextOwnerPrompt: 'WORKER-RUNTIME-SOUND-0: audio fixture payload acceptance audit',
    },
    {
      owner: 'PROVIDER_GATEWAY_MODELS',
      currentStatus: 'missing acceptance',
      approvalRequest: [
        'confirm local SQL validation does not call providers',
        'confirm no provider secrets',
        'confirm no provider rows enable execution',
        'confirm Lyria music/song/soundtrack-only boundary',
        'confirm SFX/ambient provider execution remains blocked',
      ],
      evidenceNeeded: [
        'Provider Gateway acceptance of no-provider validation',
      ],
      forbiddenBypasses: [
        'no provider call',
        'no provider secret values',
      ],
      requestedResponseFormat: [
        'no-provider acceptance decision',
        'credential exclusion statement',
        'provider row execution block statement',
        'Lyria boundary statement',
        'conditions or blockers',
      ],
      nextOwnerPrompt: 'PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit',
    },
    {
      owner: 'OBSERVABILITY_AUDIT_COST',
      currentStatus: 'missing acceptance',
      approvalRequest: [
        'confirm validation evidence capture expectations',
        'confirm advisor output capture expectations',
        'confirm audit/cost placeholder expectations',
        'confirm no beta/production evidence claim',
      ],
      evidenceNeeded: [
        'Observability acceptance of evidence capture format',
      ],
      forbiddenBypasses: [
        'no silent acceptance',
        'no readiness claim without audit evidence',
      ],
      requestedResponseFormat: [
        'evidence capture acceptance decision',
        'advisor output requirements',
        'audit/cost placeholder requirements',
        'readiness claim rejection statement',
        'conditions or blockers',
      ],
      nextOwnerPrompt: 'OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit',
    },
    {
      owner: 'BILLING_STRIPE_CREDITS',
      currentStatus: 'missing acceptance',
      approvalRequest: [
        'confirm no credit spend',
        'confirm no credit reservation',
        'confirm no billing rows beyond future mock/local fixture tests',
        'confirm no payment operation',
      ],
      evidenceNeeded: [
        'Billing acceptance of no-spend validation',
      ],
      forbiddenBypasses: [
        'no spend',
        'no reservation',
      ],
      requestedResponseFormat: [
        'no-spend acceptance decision',
        'no-reservation statement',
        'billing row boundary statement',
        'payment operation rejection statement',
        'conditions or blockers',
      ],
      nextOwnerPrompt: 'BILLING-SOUND-0: fixture credit placeholder acceptance audit',
    },
    {
      owner: 'TRACK_A_RENDER_EXPORT',
      currentStatus: 'missing acceptance',
      approvalRequest: [
        'confirm no final mux/export claim',
        'confirm future timing/private manifest consumption remains handoff-only',
        'confirm no render/export execution',
      ],
      evidenceNeeded: [
        'Track A acceptance of no-export local SQL validation',
      ],
      forbiddenBypasses: [
        'no final export readiness claim',
      ],
      requestedResponseFormat: [
        'no-export acceptance decision',
        'final composition boundary statement',
        'timing/private manifest handoff notes',
        'conditions or blockers',
      ],
      nextOwnerPrompt: 'TRACK-A-SOUND-0: audio fixture final composition handoff audit',
    },
    {
      owner: 'TRACK_B_MEDIA_PROCESSING',
      currentStatus: 'missing acceptance',
      approvalRequest: [
        'confirm no media/audio processing execution',
        'confirm no FFmpeg/model execution',
        'confirm future processing boundary remains handoff-only',
      ],
      evidenceNeeded: [
        'Track B acceptance of no-processing local SQL validation',
      ],
      forbiddenBypasses: [
        'no Track B processing execution',
      ],
      requestedResponseFormat: [
        'no-processing acceptance decision',
        'FFmpeg/model execution rejection statement',
        'future processing handoff boundary',
        'conditions or blockers',
      ],
      nextOwnerPrompt: 'TRACK-B-SOUND-0: audio fixture media processing handoff audit',
    },
  ],
  aggregateMissingEvidence: [
    'Supabase local target approval',
    'Supabase no-production/no-live-data proof',
    'Supabase rollback/cleanup approval',
    'Worker Runtime no-dispatch acceptance',
    'Provider Gateway no-provider acceptance',
    'Observability evidence-capture acceptance',
    'Billing no-spend acceptance',
    'Track A no-export acceptance',
    'Track B no-processing acceptance',
    'SOUND scope acceptance for local SQL validation',
  ],
  recommendedImmediateNextPrompt,
}
