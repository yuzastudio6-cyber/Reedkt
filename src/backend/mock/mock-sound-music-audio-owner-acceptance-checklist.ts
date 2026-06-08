import type { SoundRelatedWorkstreamId } from '../../types/audio-music'
import type { SoundMusicAudioGeneratedLocalFixtureUnlockStage } from './mock-sound-music-audio-generated-local-fixture-spec'

export type SoundMusicAudioOwnerAcceptanceChecklistMode = 'owner_acceptance_checklist_only'

export type SoundMusicAudioOwnerAcceptanceStatus = 'not_accepted_for_execution'

export type SoundMusicAudioOwnerAcceptanceOwner =
  | 'SOUND_MUSIC_AUDIO'
  | SoundRelatedWorkstreamId

export interface SoundMusicAudioOwnerAcceptanceChecklistOwnerEntry {
  owner: SoundMusicAudioOwnerAcceptanceOwner
  acceptanceStatus: SoundMusicAudioOwnerAcceptanceStatus
  soundPrepared: string[]
  ownerMustAccept: string[]
  evidenceRequired: string[]
  forbiddenBypasses: string[]
  nextRecommendedPrompt: string
}

export interface SoundMusicAudioOwnerAcceptanceChecklist {
  workstream: 'SOUND_MUSIC_AUDIO'
  mode: SoundMusicAudioOwnerAcceptanceChecklistMode
  currentUnlockStage: Extract<SoundMusicAudioGeneratedLocalFixtureUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<SoundMusicAudioGeneratedLocalFixtureUnlockStage, 'generated_local_fixture_passed'>
  claimsGeneratedLocalFixturePassed: false
  handoffOnly: true
  execution: {
    artifactCreated: false
    fixtureAudioCreated: false
    generatedAssetCreated: false
    providerCallAllowed: false
    workerDispatchAllowed: false
    supabaseMutationAllowed: false
    sqlAllowed: false
    gcpMutationAllowed: false
    dockerAllowed: false
    cloudRunAllowed: false
    ffmpegAllowed: false
    modelDownloadAllowed: false
    modelInferenceAllowed: false
    signedUrlCreationAllowed: false
    publicArtifactAllowed: false
    creditOrApprovalRecordAllowed: false
    trackAFinalExportReady: false
    trackBExecutionAccepted: false
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
  executionPath: {
    requiresUserChatRequest: true
    requiresStructuredAgentFindings: true
    requiresEditIntents: true
    requiresApprovedPlanSnapshot: true
    workerExecutionOnlyAfterAcceptance: true
    rawPromptDirectWorkerExecutionAllowed: false
  }
  owners: SoundMusicAudioOwnerAcceptanceChecklistOwnerEntry[]
  blockedUses: string[]
  recommendedImmediateNextPrompt: 'SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution'
}

const owners: SoundMusicAudioOwnerAcceptanceChecklistOwnerEntry[] = [
  {
    owner: 'SOUND_MUSIC_AUDIO',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'dry-run contract smoke',
      'dry-run evidence card',
      'generated/local fixture plan',
      'deterministic fixture spec',
      'fixture handoff packet',
      'owner acceptance checklist',
    ],
    ownerMustAccept: [
      'keep cue and manifest planning metadata fail-closed',
      'keep Lyria music/song/soundtrack planning-only',
      'keep generated/local fixture execution unclaimed',
    ],
    evidenceRequired: [
      'SOUND smokes passing',
      'fixture spec smoke passing',
      'owner checklist smoke passing',
    ],
    forbiddenBypasses: [
      'no fixture audio creation',
      'no provider call',
      'no worker dispatch',
      'no Supabase mutation',
      'no credit or approval record',
      'no Track A or Track B execution claim',
    ],
    nextRecommendedPrompt: 'SOUND owns this checklist only',
  },
  {
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'source-of-truth requirements',
      'mock approved snapshot reference IDs',
      'private path expectations',
      'checksum expectations',
    ],
    ownerMustAccept: [
      'approved snapshot row strategy',
      'fixture-only approved snapshot scope',
      'storage object record shape',
      'private path and checksum fields',
      'RLS and storage policies',
      'signed URL audit-only treatment',
      'workspace isolation',
    ],
    evidenceRequired: [
      'migration plan acceptance',
      'RLS and storage policy acceptance',
      'ledger consistency acceptance',
      'workspace isolation evidence',
    ],
    forbiddenBypasses: [
      'no live row mutation from SOUND',
      'no storage bucket creation from SOUND',
      'no storage object creation from SOUND',
      'no SQL execution from SOUND',
      'no signed URL source-of-truth',
    ],
    nextRecommendedPrompt: 'SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution',
  },
  {
    owner: 'WORKER_RUNTIME_JOBS',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'blocked worker handoff expectations',
      'idempotency metadata expectation',
      'raw prompt rejection notes',
    ],
    ownerMustAccept: [
      'worker payload shape',
      'idempotency behavior',
      'claim and lease behavior',
      'event logging and retry behavior',
      'raw prompt rejection',
      'signed URL input rejection',
      'credential rejection',
      'no production dispatch',
    ],
    evidenceRequired: [
      'worker runtime contract acceptance',
      'claim and lease acceptance',
      'worker event evidence plan',
      'retry and failure evidence plan',
    ],
    forbiddenBypasses: [
      'no prompt-to-worker shortcut',
      'no worker dispatch from SOUND',
      'no production job dispatch',
      'no Cloud Run dispatch',
      'no runtime config creation',
    ],
    nextRecommendedPrompt: 'WORKER-RUNTIME-SOUND-0: audio worker dry-run/local-fixture acceptance audit',
  },
  {
    owner: 'PROVIDER_GATEWAY_MODELS',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'provider boundary map',
      'Lyria music-only rule',
      'SFX and ambience provider separation',
      'provider call gates set false',
    ],
    ownerMustAccept: [
      'provider transport policy',
      'provider credential policy',
      'fallback behavior',
      'license and commercial evidence',
      'cost and error semantics',
      'Lyria music/song/soundtrack boundary',
      'SFX and ambience provider boundary',
    ],
    evidenceRequired: [
      'provider gateway acceptance',
      'license review evidence',
      'commercial export evidence',
      'fallback and error policy evidence',
    ],
    forbiddenBypasses: [
      'no provider call from SOUND',
      'no provider credential handling from SOUND',
      'no Lyria SFX use',
      'no Lyria ambience use',
      'no provider fallback transport',
    ],
    nextRecommendedPrompt: 'PROVIDER-GATEWAY-SOUND-0: provider/license local-fixture acceptance audit',
  },
  {
    owner: 'OBSERVABILITY_AUDIT_COST',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'QA metadata requirements',
      'audio readiness notes',
      'audit and cost placeholder requirements',
    ],
    ownerMustAccept: [
      'audio QA evidence format',
      'audit event format',
      'abuse controls',
      'cost guardrails',
      'readiness reporting',
      'speech and ducking QA',
      'no-random-SFX policy evidence',
    ],
    evidenceRequired: [
      'QA evidence acceptance',
      'audit evidence acceptance',
      'cost evidence acceptance',
      'abuse control acceptance',
    ],
    forbiddenBypasses: [
      'no silent readiness',
      'no untracked acceptance',
      'no beta unlock',
      'no production unlock',
      'no unaudited cost path',
    ],
    nextRecommendedPrompt: 'OBSERVABILITY-SOUND-0: QA/audit/cost local-fixture acceptance audit',
  },
  {
    owner: 'BILLING_STRIPE_CREDITS',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'no-spend billing boundary',
      'credit placeholder notes',
      'credit gates set false',
    ],
    ownerMustAccept: [
      'future credit estimate semantics',
      'approval semantics',
      'reservation semantics',
      'spend semantics',
      'refund and release semantics',
      'ledger behavior',
    ],
    evidenceRequired: [
      'billing owner acceptance',
      'credit ledger acceptance',
      'no-spend fixture evidence',
    ],
    forbiddenBypasses: [
      'no credit rows from SOUND',
      'no credit approval',
      'no credit reservation',
      'no spend',
      'no refund or release',
      'no Stripe operation',
    ],
    nextRecommendedPrompt: 'BILLING-SOUND-0: sound credit local-fixture acceptance audit',
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'timing-aware cue manifest expectation',
      'private audio manifest expectation',
      'audio readiness handoff notes',
    ],
    ownerMustAccept: [
      'final composition handoff',
      'final mux/export validation',
      'audio sync QA',
      'private artifact reference handling',
      'final delivery blockers',
    ],
    evidenceRequired: [
      'Track A handoff acceptance',
      'final composition acceptance evidence',
      'sync QA evidence plan',
    ],
    forbiddenBypasses: [
      'no final mux from SOUND',
      'no render/export from SOUND',
      'no delivery from SOUND',
      'no public artifact from SOUND',
      'no Track A readiness claim',
    ],
    nextRecommendedPrompt: 'TRACK-A-SOUND-0: sound fixture final composition handoff audit',
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    acceptanceStatus: 'not_accepted_for_execution',
    soundPrepared: [
      'private audio artifact manifest expectation',
      'processing boundary notes',
      'source immutability notes',
    ],
    ownerMustAccept: [
      'real media/audio processing requirements',
      'local fixture processing boundary',
      'cleanup and separation policy',
      'analysis policy',
      'FFmpeg policy',
      'model policy',
    ],
    evidenceRequired: [
      'Track B handoff acceptance',
      'media/audio processing boundary evidence',
      'source immutability evidence plan',
    ],
    forbiddenBypasses: [
      'no Track B execution from SOUND',
      'no FFmpeg execution from SOUND',
      'no model inference from SOUND',
      'no media processing from SOUND',
      'no source overwrite',
    ],
    nextRecommendedPrompt: 'TRACK-B-SOUND-0: sound fixture media processing acceptance audit',
  },
]

export const SOUND_MUSIC_AUDIO_OWNER_ACCEPTANCE_CHECKLIST = {
  workstream: 'SOUND_MUSIC_AUDIO',
  mode: 'owner_acceptance_checklist_only',
  currentUnlockStage: 'dry_run_passed',
  targetFutureUnlockStage: 'generated_local_fixture_passed',
  claimsGeneratedLocalFixturePassed: false,
  handoffOnly: true,
  execution: {
    artifactCreated: false,
    fixtureAudioCreated: false,
    generatedAssetCreated: false,
    providerCallAllowed: false,
    workerDispatchAllowed: false,
    supabaseMutationAllowed: false,
    sqlAllowed: false,
    gcpMutationAllowed: false,
    dockerAllowed: false,
    cloudRunAllowed: false,
    ffmpegAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    signedUrlCreationAllowed: false,
    publicArtifactAllowed: false,
    creditOrApprovalRecordAllowed: false,
    trackAFinalExportReady: false,
    trackBExecutionAccepted: false,
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
  executionPath: {
    requiresUserChatRequest: true,
    requiresStructuredAgentFindings: true,
    requiresEditIntents: true,
    requiresApprovedPlanSnapshot: true,
    workerExecutionOnlyAfterAcceptance: true,
    rawPromptDirectWorkerExecutionAllowed: false,
  },
  owners,
  blockedUses: [
    'generated_local_fixture_passed_not_claimed',
    'approved_snapshot_rows_not_created',
    'supabase_mutation_blocked',
    'sql_blocked',
    'storage_object_not_allowed',
    'signed_url_blocked',
    'public_artifact_blocked',
    'provider_gateway_handoff_required',
    'worker_runtime_handoff_required',
    'generated_asset_not_allowed',
    'credit_approval_required',
    'track_a_final_export_blocked',
    'track_b_execution_not_accepted',
  ],
  recommendedImmediateNextPrompt: 'SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution',
} as const satisfies SoundMusicAudioOwnerAcceptanceChecklist
