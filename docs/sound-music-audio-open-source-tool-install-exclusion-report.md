# Sound/Music/Audio Open-Source Tool Install Exclusion Report

All non-approved candidates remain excluded from SOUND-owned install planning.

Decision: `sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install`

```json sound-oss-tools-2-install-exclusion-report
{
  "phase": "SOUND-OSS-TOOLS-2",
  "decision": "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install",
  "excludedToolCount": 49,
  "requiredBlockedTools": {
    "demucs": "blocked_pending_model_weight_review",
    "rnnoise": "blocked_pending_owner_handoff",
    "essentia": "blocked_pending_legal_review",
    "pyrubberband": "blocked_pending_legal_review",
    "rubberband_cli": "blocked_pending_legal_review"
  },
  "referenceHandoffOnly": [
    "ffmpeg",
    "ffprobe",
    "mediainfo",
    "exiftool",
    "opus_tools",
    "flac_metaflac",
    "vorbis_tools",
    "wavpack",
    "whisper_cpp",
    "faster_whisper",
    "pyannote_audio",
    "lyria",
    "mirelo_sfx_v1_5",
    "mmaudio_v2"
  ],
  "exclusions": [
    {
      "toolId": "ffmpeg",
      "displayName": "ffmpeg",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_A_RENDER_EXPORT",
      "owner": "TRACK_A_RENDER_EXPORT",
      "runtimeOwner": "TRACK_A_RENDER_EXPORT",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "ffprobe",
      "displayName": "ffprobe",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "runtimeOwner": "TRACK_B_MEDIA_PROCESSING",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "sox",
      "displayName": "sox",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "mediainfo",
      "displayName": "mediainfo",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "runtimeOwner": "TRACK_B_MEDIA_PROCESSING",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "exiftool",
      "displayName": "exiftool",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "runtimeOwner": "TRACK_B_MEDIA_PROCESSING",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "libsndfile",
      "displayName": "libsndfile",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "opus_tools",
      "displayName": "opus tools",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_A_RENDER_EXPORT",
      "owner": "TRACK_A_RENDER_EXPORT",
      "runtimeOwner": "TRACK_A_RENDER_EXPORT",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "flac_metaflac",
      "displayName": "flac metaflac",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_A_RENDER_EXPORT",
      "owner": "TRACK_A_RENDER_EXPORT",
      "runtimeOwner": "TRACK_A_RENDER_EXPORT",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "vorbis_tools",
      "displayName": "vorbis tools",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_A_RENDER_EXPORT",
      "owner": "TRACK_A_RENDER_EXPORT",
      "runtimeOwner": "TRACK_A_RENDER_EXPORT",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "wavpack",
      "displayName": "wavpack",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_A_RENDER_EXPORT",
      "owner": "TRACK_A_RENDER_EXPORT",
      "runtimeOwner": "TRACK_A_RENDER_EXPORT",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "soundfile",
      "displayName": "soundfile",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "soxr",
      "displayName": "soxr",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "essentia",
      "displayName": "essentia",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "aubio",
      "displayName": "aubio",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "madmom",
      "displayName": "madmom",
      "approvalDecision": "blocked_pending_license_review",
      "exclusionReason": "blocked_pending_license_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "vamp_sonic_annotator",
      "displayName": "vamp sonic annotator",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "fluidsynth_pyfluidsynth",
      "displayName": "fluidsynth pyfluidsynth",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "basic_pitch",
      "displayName": "basic pitch",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "deepfilternet",
      "displayName": "deepfilternet",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "rnnoise",
      "displayName": "rnnoise",
      "approvalDecision": "blocked_pending_owner_handoff",
      "exclusionReason": "blocked_pending_owner_handoff",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "demucs",
      "displayName": "demucs",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS + OBSERVABILITY_AUDIT_COST",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "spleeter",
      "displayName": "spleeter",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "open_unmix",
      "displayName": "open unmix",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "asteroid",
      "displayName": "asteroid",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "speechbrain_enhancement",
      "displayName": "speechbrain enhancement",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "pyrubberband",
      "displayName": "pyrubberband",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "soundtouch",
      "displayName": "soundtouch",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "rubberband_cli",
      "displayName": "rubberband cli",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "ladspa_lv2_host",
      "displayName": "ladspa lv2 host",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "bs1770gain",
      "displayName": "bs1770gain",
      "approvalDecision": "blocked_pending_legal_review",
      "exclusionReason": "blocked_pending_legal_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "COMPLIANCE_SECURITY",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "whisper_cpp",
      "displayName": "whisper cpp",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "runtimeOwner": "TRACK_B_MEDIA_PROCESSING",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "faster_whisper",
      "displayName": "faster whisper",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "runtimeOwner": "TRACK_B_MEDIA_PROCESSING",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "pyannote_audio",
      "displayName": "pyannote audio",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "runtimeOwner": "TRACK_B_MEDIA_PROCESSING",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "crepe",
      "displayName": "crepe",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "torchcrepe",
      "displayName": "torchcrepe",
      "approvalDecision": "blocked_pending_model_weight_review",
      "exclusionReason": "blocked_pending_model_weight_review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO + WORKER_RUNTIME_JOBS",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "SOUND_MUSIC_AUDIO",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "lyria",
      "displayName": "lyria",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "PROVIDER_GATEWAY_MODELS",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "runtimeOwner": "PROVIDER_GATEWAY_MODELS",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "mirelo_sfx_v1_5",
      "displayName": "mirelo sfx v1 5",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "PROVIDER_GATEWAY_MODELS",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "runtimeOwner": "PROVIDER_GATEWAY_MODELS",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "mmaudio_v2",
      "displayName": "mmaudio v2",
      "approvalDecision": "approved_for_reference_only",
      "exclusionReason": "reference_or_handoff_only_non_SOUND_runtime_owner",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "PROVIDER_GATEWAY_MODELS",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "runtimeOwner": "PROVIDER_GATEWAY_MODELS",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "internal_sfx_library",
      "displayName": "internal sfx library",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "soundsync_cue_planning",
      "displayName": "soundsync cue planning",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "music_ducking_mix_qa",
      "displayName": "music ducking mix qa",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "sfx_director_tool",
      "displayName": "sfx director tool",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "music_cue_planner",
      "displayName": "music cue planner",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "ambient_sound_planner",
      "displayName": "ambient sound planner",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "audio_qa_tool",
      "displayName": "audio qa tool",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "private_audio_artifact_manifest_builder",
      "displayName": "private audio artifact manifest builder",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "timing_aware_cue_manifest_builder",
      "displayName": "timing aware cue manifest builder",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "action_foley_sfx_tool",
      "displayName": "action foley sfx tool",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    },
    {
      "toolId": "ambient_everyday_soundscape_tool",
      "displayName": "ambient everyday soundscape tool",
      "approvalDecision": "deferred",
      "exclusionReason": "provider_or_internal_metadata_not_open_source_install",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1 license/provenance approval",
      "canAppearInSOUNDInstallPlan": false,
      "nextApprovalNeeded": "SOUND_MUSIC_AUDIO",
      "owner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ]
    }
  ],
  "runtimeFlags": {
    "dependencyMutationAllowed": false,
    "toolExecutionAllowed": false,
    "audioProcessingAllowed": false,
    "mediaProcessingAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "installCompletionClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  }
}
```
