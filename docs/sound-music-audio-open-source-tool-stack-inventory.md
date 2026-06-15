# Sound/Music/Audio Open-Source Tool Stack Inventory

Decision: `sound_oss_tools_0_stack_inventory_gap_audit_completed_ready_for_license_provenance_approval`

This inventory consumes `docs/cross-chat-tool-ownership-registry.md` and `docs/sound-music-audio-cross-chat-duplicate-risk-register.md` as the registry-first source of truth. It does not install tools, mutate dependencies, process media, call providers, touch Supabase, run SQL, create signed URLs, create public artifacts, unlock beta/production, claim `dry_run_passed`, claim `generated_local_fixture_passed`, or claim runtime readiness.

If a SOUND-primary tool is blocked, SOUND owns governance, provenance review, and routing only. Runtime install, model download, media processing, worker dispatch, and production use remain blocked until later explicit gates.

## Human Summary

| Group | Tools | SOUND role | Status |
|---|---:|---|---|
| SOUND-owned open-source candidates | 8 | own | inventory/provenance only |
| SOUND governance-only blocked candidates | 4 | governance-only | blocked |
| SOUND-only planning tools | 8 | own | internal metadata planning only |
| Provider/internal candidates | 4 | handoff-only / internal | not open-source install-ready |
| Track A/B/Worker/Supabase/Provider shared tools | 18 | reference-only / handoff-only | non-SOUND runtime owner |

## Machine-Readable Inventory

```json sound-oss-tools-0-stack-inventory
{
  "phase": "SOUND-OSS-TOOLS-0",
  "decision": "sound_oss_tools_0_stack_inventory_gap_audit_completed_ready_for_license_provenance_approval",
  "sourceOfTruth": {
    "mergedPr": 418,
    "mergeCommit": "7d186a73f85a04783c906853ea445c611a6ebe23",
    "ownershipRegistry": "docs/cross-chat-tool-ownership-registry.md",
    "duplicateRiskRegister": "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
    "soundToolStudy": "docs/tool-studies/sound-music-audio-tool-study.md"
  },
  "runtimeFlags": {
    "dependencyMutationAllowed": false,
    "toolExecutionAllowed": false,
    "audioProcessingAllowed": false,
    "mediaProcessingAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "signedUrlAllowed": false,
    "publicArtifactAllowed": false,
    "betaUnlockAllowed": false,
    "productionUnlockAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "installCompletionClaimed": false
  },
  "toolGroups": [
    {
      "groupId": "sound_owned_open_source_candidates",
      "soundRole": "own",
      "tools": ["audioflux", "signalsmith_stretch", "deepfilternet", "soundtouch", "librosa", "noisereduce", "pyloudnorm", "soxr"],
      "allowedSOUNDActions": ["inventory", "license_provenance_review", "capability_routing", "gap_audit"],
      "blockedSOUNDActions": ["install", "execute", "process_audio", "claim_runtime_readiness"]
    },
    {
      "groupId": "sound_governance_only_blocked_candidates",
      "soundRole": "governance-only",
      "tools": ["demucs", "rnnoise", "rubber_band", "essentia"],
      "allowedSOUNDActions": ["record_blocker", "license_provenance_review", "model_weight_review", "routing_governance"],
      "blockedSOUNDActions": ["install", "execute", "download_weights", "make_default_runtime"]
    },
    {
      "groupId": "sound_only_planning_tools",
      "soundRole": "own",
      "tools": ["sfx_director_tool", "music_cue_planner", "ambient_sound_planner", "soundsync_planner", "audio_qa_tool", "private_audio_artifact_manifest_builder", "timing_aware_cue_manifest_builder", "action_foley_sfx_tool", "ambient_everyday_soundscape_tool"],
      "allowedSOUNDActions": ["metadata_schema_inventory", "handoff_contract_planning", "qa_policy_planning"],
      "blockedSOUNDActions": ["generate_audio", "create_storage_objects", "dispatch_jobs", "reserve_or_spend_credits"]
    },
    {
      "groupId": "provider_internal_handoff_candidates",
      "soundRole": "handoff-only",
      "tools": ["lyria", "mirelo_sfx_v1_5", "mmaudio_v2", "internal_sfx_library"],
      "allowedSOUNDActions": ["creative_semantics", "prompt_policy_requirements", "provider_handoff_metadata"],
      "blockedSOUNDActions": ["provider_call", "secret_handling", "transport_ownership", "runtime_fallback_approval"]
    },
    {
      "groupId": "reference_and_handoff_non_sound_runtime",
      "soundRole": "reference-only",
      "tools": ["ffmpeg", "ffprobe", "remotion", "opentimelineio", "sharp", "faster_whisper", "whisper_cpp", "pyav", "duckdb", "polars", "web_capture_tools", "map_geospatial_tools", "supabase_storage", "billing_credit_ledger", "worker_runtime_jobs", "tool_route_execution", "observability_audit_cost", "track_a_render_export"],
      "allowedSOUNDActions": ["reference_requirements", "handoff_metadata", "duplicate_risk_record"],
      "blockedSOUNDActions": ["own_runtime", "execute", "mutate_persistence", "approve_public_delivery"]
    }
  ],
  "tools": [
    {"toolId":"audioflux","displayName":"AudioFlux","category":"audio_analysis","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING","WORKER_RUNTIME_JOBS"],"soundRole":"own","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","launch-tool-stack-update.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"doc_inventory_only","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"maybe","installOwner":"SOUND_MUSIC_AUDIO after approval","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"low","blockers":["license_provenance_review","install_approval","worker_runtime_approval"],"allowedSOUNDActions":["inventory","review_license","plan_sound_sync_metadata"],"blockedSOUNDActions":["run_analysis","claim_beat_detection"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"signalsmith_stretch","displayName":"Signalsmith Stretch","category":"time_pitch_tempo","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING","WORKER_RUNTIME_JOBS"],"soundRole":"own","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","launch-tool-stack-update.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"doc_inventory_only","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"maybe","installOwner":"SOUND_MUSIC_AUDIO after approval","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"low","blockers":["license_provenance_review","install_approval"],"allowedSOUNDActions":["inventory","review_license","plan_music_fit_metadata"],"blockedSOUNDActions":["run_stretch_pitch","process_audio"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"deepfilternet","displayName":"DeepFilterNet","category":"audio_cleanup","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING","WORKER_RUNTIME_JOBS"],"soundRole":"own","openSourceStatus":"model_weight_gated","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","docs/production-gpu-audio-ai-policy.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"approved_candidate_not_runtime_ready","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"maybe","installOwner":"SOUND_MUSIC_AUDIO after model/license approval","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"medium","blockers":["model_weight_review","license_review","worker_runtime_approval"],"allowedSOUNDActions":["inventory","review_provenance","plan_cleanup_metadata"],"blockedSOUNDActions":["download_weights","run_model","claim_cleanup_readiness"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"soundtouch","displayName":"SoundTouch","category":"time_pitch_tempo","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING"],"soundRole":"own","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md"],"prEvidence":["PR #418"],"currentReadinessStage":"candidate_only","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"maybe","installOwner":"SOUND_MUSIC_AUDIO after approval","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"low","blockers":["license_review","install_approval"],"allowedSOUNDActions":["inventory","compare_with_signalsmith"],"blockedSOUNDActions":["run_processing","supersede_launch_candidate"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"librosa","displayName":"librosa","category":"audio_analysis","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING"],"soundRole":"own","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","soundsync-audio-pipeline-planning.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"future_prototype_only","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"not_applicable","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"maybe","installOwner":"SOUND_MUSIC_AUDIO after approval","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"low","blockers":["not_launch_default","license_review"],"allowedSOUNDActions":["inventory","research_gap_review"],"blockedSOUNDActions":["execute_analysis","make_launch_default"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"demucs","displayName":"Demucs","category":"music_separation","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING","WORKER_RUNTIME_JOBS","OBSERVABILITY_AUDIT_COST"],"soundRole":"governance-only","openSourceStatus":"model_weight_gated","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","docs/production-gpu-audio-ai-policy.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"blocked","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"blocked","installNeeded":"blocked","installOwner":"blocked_pending_owner_approval","validationOwner":"SOUND_MUSIC_AUDIO plus OBSERVABILITY_AUDIT_COST","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"high","blockers":["provenance_review","model_weight_review","gpu_cost_review","worker_runtime_approval"],"allowedSOUNDActions":["record_blocker","governance_review"],"blockedSOUNDActions":["install","download_weights","run_separation"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"rnnoise","displayName":"RNNoise","category":"audio_cleanup","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING","WORKER_RUNTIME_JOBS"],"soundRole":"governance-only","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","docs/production-audio-sound-runbook.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"inactive_blocked","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"blocked","installNeeded":"blocked","installOwner":"blocked_pending_source_of_truth_change","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"medium","blockers":["inactive_source_of_truth","owner_reactivation_required"],"allowedSOUNDActions":["record_inactive_status"],"blockedSOUNDActions":["reactivate","install","execute"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"rubber_band","displayName":"Rubber Band","category":"time_pitch_tempo","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING"],"soundRole":"governance-only","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","launch-tool-stack-update.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"blocked_evaluation_only","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"blocked","installNeeded":"blocked","installOwner":"blocked_pending_owner_approval","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"medium","blockers":["not_launch_candidate","license_review_needed"],"allowedSOUNDActions":["record_evaluation_status"],"blockedSOUNDActions":["install","execute","make_launch_default"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"essentia","displayName":"Essentia","category":"audio_analysis","primaryOwner":"SOUND_MUSIC_AUDIO","secondaryOwners":["TRACK_B_MEDIA_PROCESSING"],"soundRole":"governance-only","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","launch-tool-stack-update.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"blocked_evaluation_only","packageDependencyPresent":false,"systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"blocked","installNeeded":"blocked","installOwner":"blocked_pending_owner_approval","validationOwner":"SOUND_MUSIC_AUDIO","runtimeOwner":"WORKER_RUNTIME_JOBS","duplicateRisk":"medium","blockers":["not_launch_candidate","license_review_needed"],"allowedSOUNDActions":["record_evaluation_status"],"blockedSOUNDActions":["install","execute","make_launch_default"],"nextPrompt":"SOUND-OSS-TOOLS-1"},
    {"toolId":"ffmpeg","displayName":"FFmpeg","category":"core_media","primaryOwner":"TRACK_A_RENDER_EXPORT","secondaryOwners":["SOUND_MUSIC_AUDIO","TRACK_B_MEDIA_PROCESSING"],"soundRole":"handoff-only","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","docs/tool-studies/track-a-render-export-tool-study.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"non_sound_runtime_owner","packageDependencyPresent":"unknown","systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"no","installOwner":"TRACK_A_RENDER_EXPORT","validationOwner":"TRACK_A_RENDER_EXPORT","runtimeOwner":"TRACK_A_RENDER_EXPORT","duplicateRisk":"medium","blockers":["not_sound_owned","ffmpeg_lgpl_review"],"allowedSOUNDActions":["handoff_audio_requirements"],"blockedSOUNDActions":["run_ffmpeg","own_export_runtime"],"nextPrompt":"Track A owner prompt"},
    {"toolId":"ffprobe","displayName":"ffprobe","category":"core_media","primaryOwner":"TRACK_B_MEDIA_PROCESSING","secondaryOwners":["SOUND_MUSIC_AUDIO","TRACK_A_RENDER_EXPORT"],"soundRole":"handoff-only","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","docs/tool-studies/track-b-media-processing-tool-study.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"non_sound_runtime_owner","packageDependencyPresent":"unknown","systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"no","installOwner":"TRACK_B_MEDIA_PROCESSING","validationOwner":"TRACK_B_MEDIA_PROCESSING","runtimeOwner":"TRACK_B_MEDIA_PROCESSING","duplicateRisk":"medium","blockers":["not_sound_owned"],"allowedSOUNDActions":["reference_audio_metadata_needs"],"blockedSOUNDActions":["run_probe","claim_media_runtime"],"nextPrompt":"Track B owner prompt"},
    {"toolId":"remotion","displayName":"Remotion","category":"render_composition","primaryOwner":"TRACK_A_RENDER_EXPORT","secondaryOwners":["AI_TOOLS_CREATIVE_GRAPHICS","SOUND_MUSIC_AUDIO"],"soundRole":"handoff-only","openSourceStatus":"open_source","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","docs/tool-studies/track-a-render-export-tool-study.md"],"prEvidence":["PR #418","PR #360"],"currentReadinessStage":"non_sound_runtime_owner","packageDependencyPresent":"unknown","systemDependencyPresent":"unknown","executablePresent":"unknown","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"no","installOwner":"TRACK_A_RENDER_EXPORT","validationOwner":"TRACK_A_RENDER_EXPORT","runtimeOwner":"TRACK_A_RENDER_EXPORT","duplicateRisk":"medium","blockers":["not_sound_owned"],"allowedSOUNDActions":["handoff_timing_cue_metadata"],"blockedSOUNDActions":["render","compose_final_canvas"],"nextPrompt":"Track A owner prompt"},
    {"toolId":"lyria","displayName":"Lyria","category":"provider_model","primaryOwner":"PROVIDER_GATEWAY_MODELS","secondaryOwners":["SOUND_MUSIC_AUDIO","WORKER_RUNTIME_JOBS"],"soundRole":"handoff-only","openSourceStatus":"provider","repoEvidencePaths":["docs/cross-chat-tool-ownership-registry.md","docs/google-cloud-audio-worker-plan.md"],"prEvidence":["PR #418"],"currentReadinessStage":"provider_blocked","packageDependencyPresent":"not_applicable","systemDependencyPresent":"not_applicable","executablePresent":"not_applicable","runtimeProofPresent":false,"licenseProvenanceStatus":"needs_review","installNeeded":"no","installOwner":"PROVIDER_GATEWAY_MODELS","validationOwner":"PROVIDER_GATEWAY_MODELS","runtimeOwner":"PROVIDER_GATEWAY_MODELS","duplicateRisk":"high","blockers":["provider_gateway_approval","secret_boundary","credit_policy"],"allowedSOUNDActions":["creative_music_semantics"],"blockedSOUNDActions":["provider_call","secret_handling"],"nextPrompt":"Provider Gateway owner prompt"}
  ]
}
```
