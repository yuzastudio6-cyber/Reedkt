export type TrackASoundFinalCompositionHandoffAcceptanceMode =
  'track_a_final_composition_handoff_audit_only'

export type TrackASoundFinalCompositionHandoffUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type TrackASoundFinalCompositionOwner =
  | 'TRACK_A_RENDER_EXPORT'
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'
  | 'TRACK_B_MEDIA_PROCESSING'

export type TrackASoundFinalCompositionDecision =
  | 'conditional_track_a_acceptance_for_metadata_only_final_composition_handoff'
  | 'track_a_rejects_final_composition_handoff_for_now'

export type TrackASoundFinalCompositionOwnerStatus =
  | 'accepted_conditionally'
  | 'missing'
  | 'not_accepted_for_execution'

export type TrackASoundFinalCompositionHandoffArea =
  | 'timing_aware_cue_manifest'
  | 'private_audio_artifact_manifest'
  | 'approved_snapshot_reference'
  | 'fixture_spec_reference'
  | 'checksum_private_path_expectation'
  | 'qa_evidence_expectation'
  | 'speech_ducking_metadata'
  | 'music_over_voice_metadata'
  | 'sfx_timing_metadata'
  | 'loudness_expectation_metadata'
  | 'sync_timing_expectation_metadata'
  | 'generated_audio_artifact'
  | 'generated_asset_row'
  | 'private_storage_row'
  | 'public_artifact'
  | 'signed_url'
  | 'track_b_processing'
  | 'final_mux_export'
  | 'delivery_public_visibility'

export interface TrackASoundFinalCompositionHandoffReadinessEntry {
  area: TrackASoundFinalCompositionHandoffArea
  currentRepoEvidence: string[]
  metadataOnlyAcceptedNow: boolean
  executionOrOutputAllowedNow: false
  missingEvidence: string[]
  owner: TrackASoundFinalCompositionOwner
  requiredBeforeGeneratedLocalFixturePassed: true
}

export interface TrackASoundFinalCompositionOwnerEntry {
  owner: TrackASoundFinalCompositionOwner
  status: TrackASoundFinalCompositionOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface TrackASoundFinalCompositionHandoffAcceptance {
  workstream: 'TRACK_A_RENDER_EXPORT'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  relatedSourceWorkstreams: [
    'SUPABASE_RLS_STORAGE_DATABASE',
    'WORKER_RUNTIME_JOBS',
    'PROVIDER_GATEWAY_MODELS',
    'OBSERVABILITY_AUDIT_COST',
    'BILLING_STRIPE_CREDITS',
  ]
  mode: TrackASoundFinalCompositionHandoffAcceptanceMode
  currentUnlockStage: Extract<TrackASoundFinalCompositionHandoffUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    TrackASoundFinalCompositionHandoffUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    trackADecision: Extract<
      TrackASoundFinalCompositionDecision,
      'conditional_track_a_acceptance_for_metadata_only_final_composition_handoff'
    >
    trackAAllowsMetadataOnlyFinalCompositionHandoff: true
    trackAAllowsRender: false
    trackAAllowsMux: false
    trackAAllowsExport: false
    trackAAllowsPublicArtifact: false
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    renderRun: false
    muxRun: false
    exportRun: false
    ffmpegRun: false
    mediaProcessingRun: false
    finalCompositionArtifactsCreated: false
    generatedAssetsCreated: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
    providerCallsMade: false
    workersDispatched: false
    supabaseMutationPerformed: false
    creditRowsCreated: false
  }
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  handoffReadiness: TrackASoundFinalCompositionHandoffReadinessEntry[]
  futureFinalCompositionHandoffFormatExpectation: {
    trackAHandoffId: string
    approvedPlanSnapshotId: 'required'
    timingAwareCueManifestId: 'required'
    privateAudioArtifactManifestId: 'required'
    fixtureSpecId: 'required'
    qaEvidenceRef: 'required'
    billingPlaceholderRef: 'required'
    sourceOfTruthStorageRecordRef: 'future_only'
    generatedAssetRef: 'future_only'
    expectedAudioPlacement: 'metadata_only_expected'
    expectedDuckingPlan: 'metadata_only_expected'
    expectedLoudnessRange: 'metadata_only_expected'
    expectedSyncTolerance: 'metadata_only_expected'
    expectedBlockedUses: string[]
    finalRenderReady: false
    finalExportReady: false
    publicArtifactAllowed: false
    signedUrlDeliveryAllowed: false
    persistedNow: false
  }
  trackBBoundary: {
    trackBProcessingAccepted: false
    trackACanDuplicateTrackBProcessing: false
    trackAFinalCompositionReadyWithoutTrackB: false
    separateOwnerAcceptanceRequired: true
    boundaryNotes: string[]
  }
  requiredBeforeTRACK_A_SOUND_1: string[]
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
    renderFromRawChatAllowed: false
    requiresStructuredAgentFindings: true
    requiresEditIntents: true
    requiresApprovedPlanSnapshot: true
  }
  crossOwnerStatus: TrackASoundFinalCompositionOwnerEntry[]
  recommendedImmediateNextPrompt: 'TRACK-B-SOUND-0: audio fixture media processing handoff audit'
}

const handoffReadiness: TrackASoundFinalCompositionHandoffReadinessEntry[] = [
  {
    area: 'timing_aware_cue_manifest',
    currentRepoEvidence: ['SOUND dry-run and fixture evidence expose timing-aware cue manifest expectations'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['accepted Track A consumption contract for final composition planning'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'private_audio_artifact_manifest',
    currentRepoEvidence: ['SOUND dry-run and fixture evidence expose private audio artifact manifest expectations'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['accepted private artifact record and storage source-of-truth path'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'approved_snapshot_reference',
    currentRepoEvidence: ['SOUND and Supabase packets require approved plan snapshots before worker execution'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future accepted approved snapshot row evidence'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'fixture_spec_reference',
    currentRepoEvidence: ['SOUND-3B fixture spec is deterministic and mock/reference-only'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future accepted fixture spec version and checksum linkage'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'checksum_private_path_expectation',
    currentRepoEvidence: ['SOUND and Supabase packets require checksum and private path expectations'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future accepted checksum/private path row evidence'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'qa_evidence_expectation',
    currentRepoEvidence: ['Observability accepts metadata-only QA evidence expectations'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future accepted QA evidence format and blocking threshold'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'speech_ducking_metadata',
    currentRepoEvidence: ['SOUND dry-run evidence tracks speech overlap and ducking warnings'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future Track A acceptance criteria for ducking metadata consumption'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'music_over_voice_metadata',
    currentRepoEvidence: ['SOUND and audio QA policies flag music-over-voice review and ducking'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future final composition QA criteria'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'sfx_timing_metadata',
    currentRepoEvidence: ['SOUND timing cue manifest tracks SFX timing and transition anchors'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future sync tolerance acceptance'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'loudness_expectation_metadata',
    currentRepoEvidence: ['Audio QA policy and Observability evidence require loudness metadata'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future loudness threshold acceptance'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'sync_timing_expectation_metadata',
    currentRepoEvidence: ['SoundSync and final render QA policies require audio sync evidence'],
    metadataOnlyAcceptedNow: true,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future final render/export sync validation evidence'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'generated_audio_artifact',
    currentRepoEvidence: ['SOUND fixture specs keep generated audio artifacts blocked'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future generated/local fixture artifact decision and source-of-truth row'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'generated_asset_row',
    currentRepoEvidence: ['Supabase packets keep generated asset rows blocked'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future accepted generated asset row policy'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'private_storage_row',
    currentRepoEvidence: ['Supabase owner decision allows only future local validation, not live storage writes'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future private storage row and RLS/storage acceptance'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'public_artifact',
    currentRepoEvidence: ['Public artifacts remain blocked by SOUND and export delivery policies'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future approved delivery/share policy and owner acceptance'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'signed_url',
    currentRepoEvidence: ['Signed URLs are not source of truth and are not created by this path'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future approved delivery/share policy only, if any'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'track_b_processing',
    currentRepoEvidence: ['Track B execution remains not accepted'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['TRACK-B-SOUND-0 acceptance and no-duplication boundary'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'final_mux_export',
    currentRepoEvidence: ['Track A final render/export policies require private final export and QA before delivery'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future render/export execution acceptance and final QA evidence'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'delivery_public_visibility',
    currentRepoEvidence: ['Export delivery policy keeps final exports private and external delivery blocked'],
    metadataOnlyAcceptedNow: false,
    executionOrOutputAllowedNow: false,
    missingEvidence: ['future delivery/share policy, retention, access logging, and approval'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
]

export const TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE:
  TrackASoundFinalCompositionHandoffAcceptance = {
    workstream: 'TRACK_A_RENDER_EXPORT',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    relatedSourceWorkstreams: [
      'SUPABASE_RLS_STORAGE_DATABASE',
      'WORKER_RUNTIME_JOBS',
      'PROVIDER_GATEWAY_MODELS',
      'OBSERVABILITY_AUDIT_COST',
      'BILLING_STRIPE_CREDITS',
    ],
    mode: 'track_a_final_composition_handoff_audit_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      trackADecision: 'conditional_track_a_acceptance_for_metadata_only_final_composition_handoff',
      trackAAllowsMetadataOnlyFinalCompositionHandoff: true,
      trackAAllowsRender: false,
      trackAAllowsMux: false,
      trackAAllowsExport: false,
      trackAAllowsPublicArtifact: false,
      globalGoForSUPABASE_SOUND_4: false,
      reasonGlobalGoBlocked: [
        'Track B processing handoff is still missing.',
        'Possible SOUND scope acceptance remains missing for the next phase.',
        'No generated/local fixture execution owner has authorized final render/export.',
      ],
    },
    execution: {
      renderRun: false,
      muxRun: false,
      exportRun: false,
      ffmpegRun: false,
      mediaProcessingRun: false,
      finalCompositionArtifactsCreated: false,
      generatedAssetsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      supabaseMutationPerformed: false,
      creditRowsCreated: false,
    },
    acceptedConditions: [
      'metadata-only final composition handoff expectations',
      'timing-aware cue manifest expectation',
      'private audio artifact manifest expectation',
      'approved plan snapshot reference expectation',
      'fixture spec reference expectation',
      'QA, ducking, loudness, and sync metadata expectations',
      'no render, mux, export, FFmpeg, or media processing',
      'no final composition artifact, public artifact, signed URL, generated asset, provider, worker, Supabase, or credit execution',
    ],
    rejectedOrStillBlocked: [
      'render execution',
      'mux execution',
      'export execution',
      'FFmpeg execution',
      'media processing',
      'final composition artifact creation',
      'generated asset row consumption as real output',
      'public artifact delivery',
      'signed URL delivery',
      'Track B processing claim',
      'generated_local_fixture_passed claim',
    ],
    handoffReadiness,
    futureFinalCompositionHandoffFormatExpectation: {
      trackAHandoffId: 'mock-reference-only-track-a-sound-handoff',
      approvedPlanSnapshotId: 'required',
      timingAwareCueManifestId: 'required',
      privateAudioArtifactManifestId: 'required',
      fixtureSpecId: 'required',
      qaEvidenceRef: 'required',
      billingPlaceholderRef: 'required',
      sourceOfTruthStorageRecordRef: 'future_only',
      generatedAssetRef: 'future_only',
      expectedAudioPlacement: 'metadata_only_expected',
      expectedDuckingPlan: 'metadata_only_expected',
      expectedLoudnessRange: 'metadata_only_expected',
      expectedSyncTolerance: 'metadata_only_expected',
      expectedBlockedUses: [
        'final render not ready',
        'final export not ready',
        'public artifact blocked',
        'signed URL delivery blocked',
        'Track B processing not accepted',
      ],
      finalRenderReady: false,
      finalExportReady: false,
      publicArtifactAllowed: false,
      signedUrlDeliveryAllowed: false,
      persistedNow: false,
    },
    trackBBoundary: {
      trackBProcessingAccepted: false,
      trackACanDuplicateTrackBProcessing: false,
      trackAFinalCompositionReadyWithoutTrackB: false,
      separateOwnerAcceptanceRequired: true,
      boundaryNotes: [
        'Track B media/audio processing remains a separate owner acceptance path.',
        'Track A must not duplicate Track B processing, media analysis, or fixture generation.',
        'Track A final composition readiness cannot be claimed when required Track B processing is missing.',
      ],
    },
    requiredBeforeTRACK_A_SOUND_1: [
      'metadata-only final composition handoff spec approved',
      'no-render/no-mux/no-export smoke',
      'no-FFmpeg/no-media-processing smoke',
      'no-public-artifact/no-signed-URL smoke',
      'no-generated-asset/no-final-artifact smoke',
      'timing-aware cue manifest consumption criteria accepted',
      'private audio artifact manifest consumption criteria accepted',
      'approved snapshot reference accepted',
      'QA/ducking/loudness/sync thresholds accepted',
      'Supabase private path and storage row policy accepted',
      'Track B processing boundary accepted',
      'no-beta/no-production claim smoke',
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
      renderFromRawChatAllowed: false,
      requiresStructuredAgentFindings: true,
      requiresEditIntents: true,
      requiresApprovedPlanSnapshot: true,
    },
    crossOwnerStatus: [
      {
        owner: 'TRACK_A_RENDER_EXPORT',
        status: 'accepted_conditionally',
        evidence: ['conditional metadata-only final composition handoff acceptance'],
        missingEvidence: ['future final composition handoff schema, render/export acceptance, and final QA threshold evidence'],
      },
      {
        owner: 'BILLING_STRIPE_CREDITS',
        status: 'accepted_conditionally',
        evidence: ['BILLING-SOUND-0 metadata-only no-spend credit placeholder acceptance'],
        missingEvidence: ['future estimate, approval, reservation, spend, refund, release, and Stripe policy'],
      },
      {
        owner: 'OBSERVABILITY_AUDIT_COST',
        status: 'accepted_conditionally',
        evidence: ['OBSERVABILITY-SOUND-0 metadata-only QA/audit/cost evidence acceptance'],
        missingEvidence: ['future persisted evidence schema owner decision and later advisor output capture approval'],
      },
      {
        owner: 'PROVIDER_GATEWAY_MODELS',
        status: 'accepted_conditionally',
        evidence: ['PROVIDER-GATEWAY-SOUND-0 no-provider metadata/spec acceptance'],
        missingEvidence: ['provider route contract and cost/error/audit acceptance for future execution'],
      },
      {
        owner: 'WORKER_RUNTIME_JOBS',
        status: 'accepted_conditionally',
        evidence: ['WORKER-RUNTIME-SOUND-0 payload-shape validation acceptance only'],
        missingEvidence: ['no-dispatch payload-shape validation smoke and future worker-facing contract acceptance'],
      },
      {
        owner: 'SUPABASE_RLS_STORAGE_DATABASE',
        status: 'accepted_conditionally',
        evidence: ['SUPABASE-SOUND-3D future local SQL validation acceptance only'],
        missingEvidence: ['no live rows, no storage writes, no generated asset/source-of-truth execution acceptance'],
      },
      {
        owner: 'SOUND_MUSIC_AUDIO',
        status: 'missing',
        evidence: ['SOUND dry-run, fixture spec, handoff packet, owner checklist, fixture plan, and audio cue metadata exist'],
        missingEvidence: ['explicit no-provider/no-worker/no-row fixture scope acceptance for the next phase'],
      },
      {
        owner: 'TRACK_B_MEDIA_PROCESSING',
        status: 'missing',
        evidence: ['Track B processing remains not accepted and media analysis remains blocked'],
        missingEvidence: ['no-processing acceptance, fixture evidence consumption expectations, and no-duplication boundary'],
      },
    ],
    recommendedImmediateNextPrompt: 'TRACK-B-SOUND-0: audio fixture media processing handoff audit',
  }
