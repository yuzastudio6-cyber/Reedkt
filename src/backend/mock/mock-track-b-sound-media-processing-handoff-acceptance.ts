export type TrackBSoundMediaProcessingHandoffAcceptanceMode =
  'track_b_media_processing_handoff_audit_only'

export type TrackBSoundMediaProcessingHandoffUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type TrackBSoundMediaProcessingOwner =
  | 'TRACK_B_MEDIA_PROCESSING'
  | 'TRACK_A_RENDER_EXPORT'
  | 'SOUND_MUSIC_AUDIO'
  | 'SUPABASE_RLS_STORAGE_DATABASE'
  | 'WORKER_RUNTIME_JOBS'
  | 'PROVIDER_GATEWAY_MODELS'
  | 'OBSERVABILITY_AUDIT_COST'
  | 'BILLING_STRIPE_CREDITS'

export type TrackBSoundMediaProcessingDecision =
  | 'conditional_track_b_acceptance_for_metadata_only_media_processing_handoff'
  | 'track_b_rejects_media_processing_handoff_for_now'

export type TrackBSoundMediaProcessingOwnerStatus =
  | 'accepted_conditionally'
  | 'missing'
  | 'not_accepted_for_execution'

export type TrackBSoundMediaProcessingHandoffArea =
  | 'source_media_immutability'
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
  | 'audio_cleanup'
  | 'audio_separation'
  | 'audio_analysis'
  | 'ffmpeg_ffprobe'
  | 'deepfilternet_rnnoise_demucs'
  | 'processed_media_artifact'
  | 'generated_asset_row'
  | 'private_storage_row'
  | 'public_artifact'
  | 'signed_url'
  | 'track_a_final_mux_export'

export interface TrackBSoundMediaProcessingReadinessEntry {
  area: TrackBSoundMediaProcessingHandoffArea
  currentRepoEvidence: string[]
  metadataOnlyAcceptedNow: boolean
  mediaProcessingExecutionAllowedNow: false
  missingEvidence: string[]
  owner: TrackBSoundMediaProcessingOwner
  requiredBeforeGeneratedLocalFixturePassed: true
}

export interface TrackBSoundMediaProcessingOwnerEntry {
  owner: TrackBSoundMediaProcessingOwner
  status: TrackBSoundMediaProcessingOwnerStatus
  evidence: string[]
  missingEvidence: string[]
}

export interface TrackBSoundMediaProcessingHandoffAcceptance {
  workstream: 'TRACK_B_MEDIA_PROCESSING'
  requestingWorkstream: 'SOUND_MUSIC_AUDIO'
  relatedSourceWorkstreams: [
    'SUPABASE_RLS_STORAGE_DATABASE',
    'WORKER_RUNTIME_JOBS',
    'PROVIDER_GATEWAY_MODELS',
    'OBSERVABILITY_AUDIT_COST',
    'BILLING_STRIPE_CREDITS',
    'TRACK_A_RENDER_EXPORT',
  ]
  mode: TrackBSoundMediaProcessingHandoffAcceptanceMode
  currentUnlockStage: Extract<TrackBSoundMediaProcessingHandoffUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<
    TrackBSoundMediaProcessingHandoffUnlockStage,
    'generated_local_fixture_passed'
  >
  claimsGeneratedLocalFixturePassed: false
  decision: {
    trackBDecision: Extract<
      TrackBSoundMediaProcessingDecision,
      'conditional_track_b_acceptance_for_metadata_only_media_processing_handoff'
    >
    trackBAllowsMetadataOnlyMediaProcessingHandoff: true
    trackBAllowsMediaProcessing: false
    trackBAllowsFFmpeg: false
    trackBAllowsModelInference: false
    trackBAllowsProcessedMediaArtifact: false
    trackBAllowsPublicArtifact: false
    globalGoForSUPABASE_SOUND_4: false
    reasonGlobalGoBlocked: string[]
  }
  execution: {
    mediaProcessingRun: false
    ffmpegRun: false
    ffprobeRun: false
    audioCleanupRun: false
    audioSeparationRun: false
    audioAnalysisRun: false
    modelInferenceRun: false
    processedMediaArtifactsCreated: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
    generatedAssetsCreated: false
    renderRun: false
    muxRun: false
    exportRun: false
    providerCallsMade: false
    workersDispatched: false
    supabaseMutationPerformed: false
    creditRowsCreated: false
  }
  acceptedConditions: string[]
  rejectedOrStillBlocked: string[]
  mediaProcessingReadiness: TrackBSoundMediaProcessingReadinessEntry[]
  futureMediaProcessingHandoffFormatExpectation: {
    trackBHandoffId: string
    approvedPlanSnapshotId: 'required'
    timingAwareCueManifestId: 'required'
    privateAudioArtifactManifestId: 'required'
    fixtureSpecId: 'required'
    qaEvidenceRef: 'required'
    trackAHandoffRef: 'required'
    sourceMediaRef: 'future_source_of_truth_only'
    storageObjectRecordRef: 'future_only'
    generatedAssetRef: 'future_only'
    expectedProcessingKind: 'metadata_only_expected'
    expectedInputScope: 'metadata_only_expected'
    expectedOutputScope: 'metadata_only_expected'
    expectedChecksumPolicy: 'metadata_only_expected'
    expectedSourceMediaImmutability: 'metadata_only_expected'
    expectedBlockedUses: string[]
    mediaProcessingReady: false
    ffmpegAllowed: false
    modelInferenceAllowed: false
    processedMediaArtifactCreated: false
    publicArtifactAllowed: false
    signedUrlDeliveryAllowed: false
    persistedNow: false
  }
  trackABoundary: {
    trackAFinalMuxAccepted: false
    trackAFinalExportAccepted: false
    trackBCanDuplicateTrackARenderExport: false
    trackAHandoffMetadataOnly: true
    boundaryNotes: string[]
  }
  requiredBeforeTRACK_B_SOUND_1: string[]
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
    processFromRawChatAllowed: false
    requiresStructuredAgentFindings: true
    requiresEditIntents: true
    requiresApprovedPlanSnapshot: true
  }
  crossOwnerStatus: TrackBSoundMediaProcessingOwnerEntry[]
  recommendedImmediateNextPrompt: 'SOUND-SUPABASE-ACCEPT-0: SOUND scope acceptance for local SQL validation, no execution'
}

const mediaProcessingReadiness: TrackBSoundMediaProcessingReadinessEntry[] = [
  {
    area: 'source_media_immutability',
    currentRepoEvidence: ['Production audio artifact and fixture docs require immutable source media'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future Track B source media policy for this fixture path'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'timing_aware_cue_manifest',
    currentRepoEvidence: ['SOUND dry-run and fixture evidence expose timing-aware cue manifest expectations'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['accepted Track B consumption criteria'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'private_audio_artifact_manifest',
    currentRepoEvidence: ['SOUND dry-run and fixture evidence expose private audio artifact manifest expectations'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['accepted private artifact record and storage source-of-truth path'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'approved_snapshot_reference',
    currentRepoEvidence: ['SOUND and Supabase packets require approved plan snapshots before worker execution'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future accepted approved snapshot row evidence'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'fixture_spec_reference',
    currentRepoEvidence: ['SOUND-3B fixture spec is deterministic and mock/reference-only'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future accepted fixture spec version and checksum linkage'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'checksum_private_path_expectation',
    currentRepoEvidence: ['SOUND and Supabase packets require checksum and private path expectations'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future accepted checksum/private path row evidence'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'qa_evidence_expectation',
    currentRepoEvidence: ['Observability accepts metadata-only QA evidence expectations'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future accepted QA evidence format and processing threshold'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'speech_ducking_metadata',
    currentRepoEvidence: ['SOUND dry-run evidence tracks speech overlap and ducking warnings'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future Track B acceptance criteria for speech/ducking metadata consumption'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'music_over_voice_metadata',
    currentRepoEvidence: ['SOUND and audio QA policies flag music-over-voice review and ducking'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future media processing QA criteria'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'sfx_timing_metadata',
    currentRepoEvidence: ['SOUND timing cue manifest tracks SFX timing and transition anchors'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future timing/sync tolerance acceptance'],
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'loudness_expectation_metadata',
    currentRepoEvidence: ['Audio QA policy and Observability evidence require loudness metadata'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future loudness threshold acceptance'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'sync_timing_expectation_metadata',
    currentRepoEvidence: ['SoundSync and final render QA policies require audio sync evidence'],
    metadataOnlyAcceptedNow: true,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future media processing sync validation evidence'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'audio_cleanup',
    currentRepoEvidence: ['Real audio execution policy keeps cleanup model/tool execution gated'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future cleanup execution policy and local fixture acceptance'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'audio_separation',
    currentRepoEvidence: ['Real audio execution policy keeps separated stems as future private artifacts'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future separation execution policy and model readiness evidence'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'audio_analysis',
    currentRepoEvidence: ['Audio QA metadata exists but no analysis execution is accepted here'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future analysis execution policy and QA evidence format'],
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'ffmpeg_ffprobe',
    currentRepoEvidence: ['Real audio execution policy allows only future controlled local-dev FFmpeg plans'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future no-production local-only FFmpeg/ffprobe acceptance'],
    owner: 'WORKER_RUNTIME_JOBS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'deepfilternet_rnnoise_demucs',
    currentRepoEvidence: ['Provider and audio docs mark cleanup/separation models review-gated'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future model/license/readiness acceptance and model-weight manifest'],
    owner: 'PROVIDER_GATEWAY_MODELS',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'processed_media_artifact',
    currentRepoEvidence: ['This path creates no cleaned audio, separated stem, or processed media artifact'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future private processed-media artifact policy and checksum evidence'],
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'generated_asset_row',
    currentRepoEvidence: ['Supabase packets keep generated asset rows blocked'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future accepted generated asset row policy'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'private_storage_row',
    currentRepoEvidence: ['Supabase owner decision allows only future local validation, not live storage writes'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future private storage row and RLS/storage acceptance'],
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'public_artifact',
    currentRepoEvidence: ['Public artifacts remain blocked by SOUND, Track A, and delivery policies'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future approved delivery/share policy and owner acceptance'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'signed_url',
    currentRepoEvidence: ['Signed URLs are not source of truth and are not created by this path'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future approved delivery/share policy only, if any'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
  {
    area: 'track_a_final_mux_export',
    currentRepoEvidence: ['Track A final composition handoff is metadata-only and final export remains blocked'],
    metadataOnlyAcceptedNow: false,
    mediaProcessingExecutionAllowedNow: false,
    missingEvidence: ['future Track A render/export acceptance and final QA evidence'],
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeGeneratedLocalFixturePassed: true,
  },
]

export const TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE:
  TrackBSoundMediaProcessingHandoffAcceptance = {
    workstream: 'TRACK_B_MEDIA_PROCESSING',
    requestingWorkstream: 'SOUND_MUSIC_AUDIO',
    relatedSourceWorkstreams: [
      'SUPABASE_RLS_STORAGE_DATABASE',
      'WORKER_RUNTIME_JOBS',
      'PROVIDER_GATEWAY_MODELS',
      'OBSERVABILITY_AUDIT_COST',
      'BILLING_STRIPE_CREDITS',
      'TRACK_A_RENDER_EXPORT',
    ],
    mode: 'track_b_media_processing_handoff_audit_only',
    currentUnlockStage: 'dry_run_passed',
    targetFutureUnlockStage: 'generated_local_fixture_passed',
    claimsGeneratedLocalFixturePassed: false,
    decision: {
      trackBDecision: 'conditional_track_b_acceptance_for_metadata_only_media_processing_handoff',
      trackBAllowsMetadataOnlyMediaProcessingHandoff: true,
      trackBAllowsMediaProcessing: false,
      trackBAllowsFFmpeg: false,
      trackBAllowsModelInference: false,
      trackBAllowsProcessedMediaArtifact: false,
      trackBAllowsPublicArtifact: false,
      globalGoForSUPABASE_SOUND_4: false,
      reasonGlobalGoBlocked: [
        'SOUND scope acceptance remains missing for the next phase.',
        'No generated/local fixture execution owner has authorized media processing.',
        'No processed media artifact or source-of-truth row is accepted for execution.',
      ],
    },
    execution: {
      mediaProcessingRun: false,
      ffmpegRun: false,
      ffprobeRun: false,
      audioCleanupRun: false,
      audioSeparationRun: false,
      audioAnalysisRun: false,
      modelInferenceRun: false,
      processedMediaArtifactsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      generatedAssetsCreated: false,
      renderRun: false,
      muxRun: false,
      exportRun: false,
      providerCallsMade: false,
      workersDispatched: false,
      supabaseMutationPerformed: false,
      creditRowsCreated: false,
    },
    acceptedConditions: [
      'metadata-only media/audio processing boundary expectations',
      'source media immutability expectation',
      'timing-aware cue manifest expectation',
      'private audio artifact manifest expectation',
      'approved plan snapshot reference expectation',
      'fixture spec reference expectation',
      'QA, ducking, loudness, and sync metadata expectations',
      'no FFmpeg, ffprobe, cleanup, separation, analysis, model inference, or media processing',
      'no processed media artifact, public artifact, signed URL, generated asset, provider, worker, Supabase, or credit execution',
    ],
    rejectedOrStillBlocked: [
      'FFmpeg execution',
      'ffprobe execution',
      'audio cleanup execution',
      'audio separation execution',
      'audio analysis execution',
      'DeepFilterNet/RNNoise/Demucs model inference',
      'processed media creation',
      'generated asset creation',
      'storage writes',
      'public artifact delivery',
      'signed URL delivery',
      'final export/mux claim',
      'generated_local_fixture_passed claim',
    ],
    mediaProcessingReadiness,
    futureMediaProcessingHandoffFormatExpectation: {
      trackBHandoffId: 'mock-reference-only-track-b-sound-handoff',
      approvedPlanSnapshotId: 'required',
      timingAwareCueManifestId: 'required',
      privateAudioArtifactManifestId: 'required',
      fixtureSpecId: 'required',
      qaEvidenceRef: 'required',
      trackAHandoffRef: 'required',
      sourceMediaRef: 'future_source_of_truth_only',
      storageObjectRecordRef: 'future_only',
      generatedAssetRef: 'future_only',
      expectedProcessingKind: 'metadata_only_expected',
      expectedInputScope: 'metadata_only_expected',
      expectedOutputScope: 'metadata_only_expected',
      expectedChecksumPolicy: 'metadata_only_expected',
      expectedSourceMediaImmutability: 'metadata_only_expected',
      expectedBlockedUses: [
        'media processing not ready',
        'FFmpeg and ffprobe blocked',
        'model inference blocked',
        'processed media artifact blocked',
        'public artifact blocked',
        'signed URL delivery blocked',
      ],
      mediaProcessingReady: false,
      ffmpegAllowed: false,
      modelInferenceAllowed: false,
      processedMediaArtifactCreated: false,
      publicArtifactAllowed: false,
      signedUrlDeliveryAllowed: false,
      persistedNow: false,
    },
    trackABoundary: {
      trackAFinalMuxAccepted: false,
      trackAFinalExportAccepted: false,
      trackBCanDuplicateTrackARenderExport: false,
      trackAHandoffMetadataOnly: true,
      boundaryNotes: [
        'Track A final mux/export remains a separate owner acceptance path.',
        'Track B must not duplicate Track A render/export, final composition, final delivery, or final QA ownership.',
        'Track A handoff remains metadata-only for this local fixture path.',
      ],
    },
    requiredBeforeTRACK_B_SOUND_1: [
      'metadata-only Track B handoff format approved',
      'no-media-processing smoke',
      'no-FFmpeg smoke',
      'no-ffprobe smoke',
      'no-model-inference smoke',
      'no-processed-media-artifact smoke',
      'no-public-artifact smoke',
      'no-signed-URL smoke',
      'source media immutability requirements approved',
      'timing/private manifest consumption requirements approved',
      'QA/loudness/sync evidence expectations accepted',
      'Track A boundary accepted',
      'Supabase source-of-truth rows accepted',
      'processed media/private storage records accepted',
      'media processing execution policy accepted later',
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
      processFromRawChatAllowed: false,
      requiresStructuredAgentFindings: true,
      requiresEditIntents: true,
      requiresApprovedPlanSnapshot: true,
    },
    crossOwnerStatus: [
      {
        owner: 'TRACK_B_MEDIA_PROCESSING',
        status: 'accepted_conditionally',
        evidence: ['conditional metadata-only media/audio processing handoff acceptance'],
        missingEvidence: [
          'future Track B handoff schema, source media immutability policy, controlled local fixture processing policy, model/tool readiness evidence, processed-media artifact policy, and processing QA threshold evidence',
        ],
      },
      {
        owner: 'TRACK_A_RENDER_EXPORT',
        status: 'accepted_conditionally',
        evidence: ['TRACK-A-SOUND-0 metadata-only final composition handoff acceptance'],
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
    ],
    recommendedImmediateNextPrompt:
      'SOUND-SUPABASE-ACCEPT-0: SOUND scope acceptance for local SQL validation, no execution',
  }
