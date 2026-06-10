import type { SoundCueFamily, SoundProviderId } from '../../types/audio-music'

export type ProviderGatewaySoundFixtureBoundaryAcceptanceMode =
  'provider_gateway_fixture_boundary_audit_only'

export type ProviderGatewaySoundFixtureBoundaryUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type ProviderGatewaySoundFixtureBoundaryOwner =
  | 'PROVIDER_GATEWAY_MODELS'
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_A_RENDER_EXPORT'
  | 'TRACK_B_MEDIA_PROCESSING'

export type ProviderGatewaySoundFixtureBoundaryDecision =
  | 'conditional_provider_gateway_acceptance_for_no_provider_local_fixture'
  | 'provider_gateway_rejects_fixture_boundary_for_now'

export type ProviderGatewaySoundFixtureBoundaryOwnerStatus =
  | 'accepted_conditionally'
  | 'missing'
  | 'not_accepted_for_execution'

export type ProviderGatewaySoundReadinessStatus =
  | 'music_planning_metadata_only'
  | 'mock_reference_metadata_only'
  | 'candidate_review_required'
  | 'license_gated_candidate'
  | 'pending_verification'
  | 'blocked'
  | 'processing_metadata_only'
  | 'review_gated_processing_metadata'
  | 'tool_execution_blocked'

export interface ProviderGatewaySoundProviderReadinessEntry {
  name: string
  providerId?: SoundProviderId
  kind:
    | 'music_provider'
    | 'sfx_provider'
    | 'ambient_provider'
    | 'generation_model'
    | 'processing_tool'
    | 'inspection_tool'
  status: ProviderGatewaySoundReadinessStatus
  allowedCueFamilies: SoundCueFamily[]
  localFixtureUse: 'metadata_only' | 'not_allowed'
  providerCallsAllowed: false
  modelDownloadAllowed: false
  modelInferenceAllowed: false
  generatedOutputsAllowed: false
  requiresProviderGatewayOwnerAcceptance: true
  notes: string[]
}

export interface ProviderGatewaySoundFixtureBoundaryOwnerEntry {
  owner: ProviderGatewaySoundFixtureBoundaryOwner
  status: ProviderGatewaySoundFixtureBoundaryOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface ProviderGatewaySoundFixtureBoundaryAcceptance {
  workstream: 'PROVIDER_GATEWAY_MODELS'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  relatedSourceWorkstreams: ['SUPABASE_RLS_STORAGE_DATABASE', 'WORKER_RUNTIME_JOBS']
  mode: ProviderGatewaySoundFixtureBoundaryAcceptanceMode
  currentUnlockStage: Extract<ProviderGatewaySoundFixtureBoundaryUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    ProviderGatewaySoundFixtureBoundaryUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    providerGatewayDecision: Extract<
      ProviderGatewaySoundFixtureBoundaryDecision,
      'conditional_provider_gateway_acceptance_for_no_provider_local_fixture'
    >
    providerGatewayAllowsNoProviderLocalFixture: true
    providerGatewayAllowsProviderCalls: false
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    providerCallsMade: false
    providerRequestsCreated: false
    providerWebhooksCreated: false
    providerFallbackExecuted: false
    providerSecretsAccessed: false
    secretManagerRead: false
    modelsDownloaded: false
    modelInferenceRun: false
    generatedOutputsCreated: false
    workersDispatched: false
    supabaseMutationPerformed: false
    signedUrlsCreated: false
    publicArtifactsCreated: false
    creditOrApprovalRecordsCreated: false
  }
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  providerReadiness: ProviderGatewaySoundProviderReadinessEntry[]
  lyriaBoundary: {
    musicSongSoundtrackPlanningOnly: true
    allowedCueFamilies: Extract<SoundCueFamily, 'music_cue' | 'soundtrack_layer' | 'audio_mood_design'>[]
    sfxAllowed: false
    foleyAllowed: false
    whooshHitRiserAllowed: false
    ambienceAllowed: false
    roomToneAllowed: false
    generationAllowed: false
    realGoogleTransportOwner: 'PROVIDER_GATEWAY_MODELS'
  }
  sfxAmbientBoundary: {
    metadataOnly: true
    providerExecutionAllowed: false
    allowedStatuses: ProviderGatewaySoundReadinessStatus[]
    generatedAudioAllowed: false
    modelDownloadAllowed: false
    fallbackExecutionAllowed: false
  }
  secretPolicy: {
    providerSecretsInRepoAllowed: false
    providerSecretsInFrontendAllowed: false
    providerSecretsInDatabaseRowsAllowed: false
    providerSecretsInLogsAllowed: false
    providerSecretsInPromptsAllowed: false
    providerSecretsInPayloadsAllowed: false
    secretManagerReferenceNamesOnlyInFuture: true
    secretManagerReadAllowedForLocalFixture: false
    secretValuesInManifestsAllowed: false
  }
  requiredBeforePROVIDER_GATEWAY_SOUND_1: string[]
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
    rawPromptDirectProviderExecutionAllowed: false
    rawPromptDirectWorkerExecutionAllowed: false
    requiresStructuredAgentFindings: true
    requiresEditIntents: true
    requiresApprovedPlanSnapshot: true
  }
  crossOwnerStatus: ProviderGatewaySoundFixtureBoundaryOwnerEntry[]
  recommendedImmediateNextPrompt: 'OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit'
}

const musicCueFamilies: Extract<SoundCueFamily, 'music_cue' | 'soundtrack_layer' | 'audio_mood_design'>[] = [
  'music_cue',
  'soundtrack_layer',
  'audio_mood_design',
]

const sfxCueFamilies: SoundCueFamily[] = [
  'action_foley_sfx',
  'transition_sound',
  'whoosh_hit_riser',
]

const ambienceCueFamilies: SoundCueFamily[] = [
  'ambient_everyday_soundscape',
  'ambience_match',
  'audio_bed',
]

const noCueFamilies: SoundCueFamily[] = []

const providerReadiness: ProviderGatewaySoundProviderReadinessEntry[] = [
  {
    name: 'Google Lyria',
    providerId: 'lyria_mock',
    kind: 'music_provider',
    status: 'music_planning_metadata_only',
    allowedCueFamilies: musicCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['music song soundtrack planning only', 'real Google transport remains future Provider Gateway work'],
  },
  {
    name: 'Lyria Pro',
    providerId: 'lyria_mock',
    kind: 'music_provider',
    status: 'music_planning_metadata_only',
    allowedCueFamilies: musicCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['music song soundtrack planning only', 'generation disabled'],
  },
  {
    name: 'Lyria 3 Pro',
    providerId: 'lyria_mock',
    kind: 'music_provider',
    status: 'music_planning_metadata_only',
    allowedCueFamilies: musicCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['music song soundtrack planning only', 'generation disabled'],
  },
  {
    name: 'Lyria 3 Clip',
    providerId: 'lyria_mock',
    kind: 'music_provider',
    status: 'music_planning_metadata_only',
    allowedCueFamilies: musicCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['music song soundtrack planning only', 'generation disabled'],
  },
  {
    name: 'Mirelo SFX',
    providerId: 'mirelo_sfx_mock',
    kind: 'sfx_provider',
    status: 'mock_reference_metadata_only',
    allowedCueFamilies: sfxCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['mock reference metadata only', 'real SFX provider transport blocked'],
  },
  {
    name: 'MMAudio',
    providerId: 'mmaudio_mock',
    kind: 'sfx_provider',
    status: 'mock_reference_metadata_only',
    allowedCueFamilies: sfxCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['mock reference metadata only', 'public-weight path remains blocked separately'],
  },
  {
    name: 'Dasheng-AudioGen',
    providerId: 'dasheng_audiogen_candidate',
    kind: 'ambient_provider',
    status: 'candidate_review_required',
    allowedCueFamilies: [...sfxCueFamilies, ...ambienceCueFamilies],
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['license dependency model-card runtime and quality review required'],
  },
  {
    name: 'Stable Audio Open',
    providerId: 'stable_audio_open_license_gated',
    kind: 'ambient_provider',
    status: 'license_gated_candidate',
    allowedCueFamilies: ambienceCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['license gate required before any execution or commercial export'],
  },
  {
    name: 'Stable Audio 3 Small SFX',
    providerId: 'stable_audio_open_license_gated',
    kind: 'sfx_provider',
    status: 'license_gated_candidate',
    allowedCueFamilies: [...sfxCueFamilies, ...ambienceCueFamilies],
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['license gate required before any execution or commercial export'],
  },
  {
    name: 'OpenMOSS MOSS-SoundEffect',
    providerId: 'openmoss_moss_soundeffect_v2_pending_verification',
    kind: 'sfx_provider',
    status: 'pending_verification',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'not_allowed',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['blocked until model card weights license runtime and quality are verified'],
  },
  {
    name: 'Meta AudioGen / AudioCraft',
    providerId: 'meta_audiogen_disabled',
    kind: 'generation_model',
    status: 'blocked',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'not_allowed',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['disabled for commercial production use'],
  },
  {
    name: 'Woosh',
    providerId: 'woosh_disabled',
    kind: 'sfx_provider',
    status: 'blocked',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'not_allowed',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['disabled until license policy changes and is reviewed'],
  },
  {
    name: 'TangoFlux',
    providerId: 'tangoflux_disabled',
    kind: 'generation_model',
    status: 'blocked',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'not_allowed',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['disabled until license policy changes and is reviewed'],
  },
  {
    name: 'ElevenLabs',
    kind: 'generation_model',
    status: 'blocked',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'not_allowed',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['no SOUND fixture acceptance or provider route in this audit'],
  },
  {
    name: 'AudioFlux',
    providerId: 'audioflux_analysis_only',
    kind: 'processing_tool',
    status: 'processing_metadata_only',
    allowedCueFamilies: ['audio_mood_design', 'ambience_match'],
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['analysis processing metadata only not a generation provider'],
  },
  {
    name: 'Signalsmith Stretch',
    providerId: 'signalsmith_stretch_processing_only',
    kind: 'processing_tool',
    status: 'processing_metadata_only',
    allowedCueFamilies: ['audio_mood_design'],
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['stretch pitch processing metadata only not a generation provider'],
  },
  {
    name: 'DeepFilterNet',
    providerId: 'deepfilternet_review_required',
    kind: 'processing_tool',
    status: 'review_gated_processing_metadata',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['cleanup candidate requiring model license readiness review'],
  },
  {
    name: 'RNNoise',
    providerId: 'rnnoise_review_required',
    kind: 'processing_tool',
    status: 'review_gated_processing_metadata',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['cleanup candidate requiring license readiness review'],
  },
  {
    name: 'Demucs',
    providerId: 'demucs_review_required',
    kind: 'processing_tool',
    status: 'review_gated_processing_metadata',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'metadata_only',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['separation candidate requiring model license readiness review'],
  },
  {
    name: 'FFmpeg',
    kind: 'processing_tool',
    status: 'tool_execution_blocked',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'not_allowed',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['processing tool not provider transport and not executed in this audit'],
  },
  {
    name: 'ffprobe',
    kind: 'inspection_tool',
    status: 'tool_execution_blocked',
    allowedCueFamilies: noCueFamilies,
    localFixtureUse: 'not_allowed',
    providerCallsAllowed: false,
    modelDownloadAllowed: false,
    modelInferenceAllowed: false,
    generatedOutputsAllowed: false,
    requiresProviderGatewayOwnerAcceptance: true,
    notes: ['inspection tool not provider transport and not executed in this audit'],
  },
]

const recommendedImmediateNextPrompt =
  'OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit' as const

export const PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE:
  ProviderGatewaySoundFixtureBoundaryAcceptance = {
    workstream: 'PROVIDER_GATEWAY_MODELS',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    relatedSourceWorkstreams: ['SUPABASE_RLS_STORAGE_DATABASE', 'WORKER_RUNTIME_JOBS'],
    mode: 'provider_gateway_fixture_boundary_audit_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      providerGatewayDecision: 'conditional_provider_gateway_acceptance_for_no_provider_local_fixture',
      providerGatewayAllowsNoProviderLocalFixture: true,
      providerGatewayAllowsProviderCalls: false,
      globalGoForSUPABASE_SOUND_4: false,
      reasonGlobalGoBlocked: [
        'SOUND_MUSIC_AUDIO explicit no-provider local fixture scope acceptance remains missing',
        'OBSERVABILITY_AUDIT_COST evidence capture acceptance remains missing',
        'BILLING_STRIPE_CREDITS no-spend acceptance remains missing',
        'TRACK_A_RENDER_EXPORT no-export acceptance remains missing',
        'TRACK_B_MEDIA_PROCESSING no-processing acceptance remains missing',
      ],
    },
    execution: {
      providerCallsMade: false,
      providerRequestsCreated: false,
      providerWebhooksCreated: false,
      providerFallbackExecuted: false,
      providerSecretsAccessed: false,
      secretManagerRead: false,
      modelsDownloaded: false,
      modelInferenceRun: false,
      generatedOutputsCreated: false,
      workersDispatched: false,
      supabaseMutationPerformed: false,
      signedUrlsCreated: false,
      publicArtifactsCreated: false,
      creditOrApprovalRecordsCreated: false,
    },
    acceptedConditions: [
      'future no-provider local fixture metadata/spec validation only',
      'mock/reference provider policy ids only',
      'provider policies may be metadata-only',
      'provider route contract remains future-only',
      'Lyria music song soundtrack planning metadata only',
      'SFX and ambience provider candidates remain blocked candidate or license-gated metadata',
      'provider cost retry error and fallback semantics remain future-only metadata',
      'no provider secrets',
      'no Secret Manager reads',
      'no generated outputs',
    ],
    rejectedOrStillBlocked: [
      'real Lyria transport',
      'real Mirelo SFX transport',
      'real MMAudio transport',
      'Dasheng execution or model download',
      'Stable Audio execution or model download',
      'OpenMOSS execution or model download',
      'Meta AudioGen AudioCraft execution',
      'Woosh execution',
      'TangoFlux execution',
      'ElevenLabs execution',
      'provider fallback execution',
      'provider request creation',
      'provider webhook creation',
      'provider secrets in repo frontend database logs prompts or payloads',
      'Secret Manager reads',
      'generated audio outputs',
      'generated_local_fixture_passed claim',
    ],
    providerReadiness,
    lyriaBoundary: {
      musicSongSoundtrackPlanningOnly: true,
      allowedCueFamilies: musicCueFamilies,
      sfxAllowed: false,
      foleyAllowed: false,
      whooshHitRiserAllowed: false,
      ambienceAllowed: false,
      roomToneAllowed: false,
      generationAllowed: false,
      realGoogleTransportOwner: 'PROVIDER_GATEWAY_MODELS',
    },
    sfxAmbientBoundary: {
      metadataOnly: true,
      providerExecutionAllowed: false,
      allowedStatuses: [
        'mock_reference_metadata_only',
        'candidate_review_required',
        'license_gated_candidate',
        'pending_verification',
        'blocked',
      ],
      generatedAudioAllowed: false,
      modelDownloadAllowed: false,
      fallbackExecutionAllowed: false,
    },
    secretPolicy: {
      providerSecretsInRepoAllowed: false,
      providerSecretsInFrontendAllowed: false,
      providerSecretsInDatabaseRowsAllowed: false,
      providerSecretsInLogsAllowed: false,
      providerSecretsInPromptsAllowed: false,
      providerSecretsInPayloadsAllowed: false,
      secretManagerReferenceNamesOnlyInFuture: true,
      secretManagerReadAllowedForLocalFixture: false,
      secretValuesInManifestsAllowed: false,
    },
    requiredBeforePROVIDER_GATEWAY_SOUND_1: [
      'provider and license readiness table approved',
      'Lyria music song soundtrack-only boundary approved',
      'SFX and ambience provider boundary approved',
      'Secret Manager reference-name policy approved',
      'provider route contract draft approved',
      'fallback disabled or controlled-fallback policy approved',
      'cost error audit handoff accepted',
      'no-provider local fixture validation accepted',
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
      rawPromptDirectProviderExecutionAllowed: false,
      rawPromptDirectWorkerExecutionAllowed: false,
      requiresStructuredAgentFindings: true,
      requiresEditIntents: true,
      requiresApprovedPlanSnapshot: true,
    },
    crossOwnerStatus: [
      {
        owner: 'PROVIDER_GATEWAY_MODELS',
        status: 'accepted_conditionally',
        evidence: [
          'conditional no-provider local fixture metadata/spec acceptance',
          'provider calls blocked',
          'provider secrets blocked',
        ],
        missingEvidence: [
          'provider route contract draft',
          'license compliance table approval',
          'fallback policy approval',
          'cost error audit acceptance',
        ],
      },
      {
        owner: 'WORKER_RUNTIME_JOBS',
        status: 'accepted_conditionally',
        evidence: ['WORKER-RUNTIME-SOUND-0 conditionally accepts future payload-shape validation only'],
        missingEvidence: ['no-dispatch payload-shape validation smoke'],
      },
      {
        owner: 'SUPABASE_RLS_STORAGE_DATABASE',
        status: 'accepted_conditionally',
        evidence: [
          'SUPABASE-SOUND-3D conditionally accepts future local throwaway non-production SQL validation only',
        ],
        missingEvidence: ['no live rows storage writes active migration or SUPABASE-SOUND-4 authorization'],
      },
      {
        owner: 'SOUND_MUSIC_AUDIO',
        status: 'missing',
        evidence: ['SOUND dry-run fixture spec handoff packet and owner checklist exist'],
        missingEvidence: ['explicit no-provider local fixture scope acceptance for next phase'],
      },
      {
        owner: 'OBSERVABILITY_AUDIT_COST',
        status: 'missing',
        evidence: ['dry-run evidence identifies QA audit cost handoff needs'],
        missingEvidence: ['accepted evidence capture shape audit event expectations abuse cost checks fixture QA policy'],
      },
      {
        owner: 'BILLING_STRIPE_CREDITS',
        status: 'missing',
        evidence: ['all current fixture plans keep credit rows and spend blocked'],
        missingEvidence: ['no-spend no-reservation acceptance and future placeholder cost evidence policy'],
      },
      {
        owner: 'TRACK_A_RENDER_EXPORT',
        status: 'missing',
        evidence: ['Track A final export remains false in SOUND Worker Runtime and Supabase specs'],
        missingEvidence: ['no-export acceptance for generated/local fixture planning'],
      },
      {
        owner: 'TRACK_B_MEDIA_PROCESSING',
        status: 'missing',
        evidence: ['Track B processing remains not accepted in SOUND Worker Runtime and Supabase specs'],
        missingEvidence: ['no-processing acceptance and fixture boundary for future audio media handoff'],
      },
    ],
    recommendedImmediateNextPrompt,
  }
