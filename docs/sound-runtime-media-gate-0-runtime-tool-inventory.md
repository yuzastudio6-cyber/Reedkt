# SOUND-RUNTIME-MEDIA-GATE-0 Runtime Tool Inventory

This packet records SOUND runtime/media ownership only as documentation and diagnostics evidence. It consumes the completed scoped SOUND metadata lane and the current E2E queue evidence without installing tools, downloading models, processing media, or enabling runtime readiness.

```json sound-runtime-media-gate-0-runtime-tool-inventory
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-0",
  "decision": "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan",
  "sourceBranchHead": "2a68e506f79741cab3b16c76d34717a26ee19aa4",
  "sourceEvidence": {
    "pr630": {
      "status": "merged",
      "mergeCommit": "2a68e506f79741cab3b16c76d34717a26ee19aa4",
      "role": "source branch queue-8 evidence"
    },
    "pr71": {
      "status": "merged_external_stack_evidence",
      "mergeCommit": "d9b5ccfa9f7a2b4ffb4ad99e67eee8b145935d72",
      "role": "external merged queue-8 candidate evidence"
    },
    "soundScopedLane": {
      "status": "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings",
      "humanStatus": "SOUND OSS scoped synthetic fixture validation passed with warnings",
      "scope": "metadata and synthetic fixture evidence only"
    }
  },
  "candidateMatrix": {
    "sourceFile": "docs/sound-music-audio-open-source-tool-candidate-matrix.md",
    "candidateCount": 65,
    "toolIds": [
      "ffmpeg",
      "ffprobe",
      "sox",
      "mediainfo",
      "exiftool",
      "libsndfile",
      "opus_tools",
      "flac_metaflac",
      "vorbis_tools",
      "wavpack",
      "librosa",
      "soundfile",
      "audioread",
      "pydub",
      "scipy_signal",
      "resampy",
      "soxr",
      "pyloudnorm",
      "essentia",
      "audioflux",
      "aubio",
      "madmom",
      "vamp_sonic_annotator",
      "music21",
      "pretty_midi",
      "mido",
      "fluidsynth_pyfluidsynth",
      "basic_pitch",
      "deepfilternet",
      "rnnoise",
      "noisereduce",
      "demucs",
      "spleeter",
      "open_unmix",
      "asteroid",
      "speechbrain_enhancement",
      "pyrubberband",
      "signalsmith_stretch",
      "soundtouch",
      "rubberband_cli",
      "pedalboard",
      "ladspa_lv2_host",
      "pydub_effects",
      "ebu_r128_pyloudnorm",
      "bs1770gain",
      "whisper_cpp",
      "faster_whisper",
      "pyannote_audio",
      "crepe",
      "torchcrepe",
      "mir_eval",
      "lyria",
      "mirelo_sfx_v1_5",
      "mmaudio_v2",
      "internal_sfx_library",
      "soundsync_cue_planning",
      "music_ducking_mix_qa",
      "sfx_director_tool",
      "music_cue_planner",
      "ambient_sound_planner",
      "audio_qa_tool",
      "private_audio_artifact_manifest_builder",
      "timing_aware_cue_manifest_builder",
      "action_foley_sfx_tool",
      "ambient_everyday_soundscape_tool"
    ]
  },
  "requiredToolCoverage": [
    {
      "requiredTool": "ffmpeg",
      "representedBy": ["ffmpeg"],
      "gate": "TRACK_A_RENDER_EXPORT handoff blocked"
    },
    {
      "requiredTool": "ffprobe",
      "representedBy": ["ffprobe"],
      "gate": "TRACK_B_MEDIA_PROCESSING handoff blocked"
    },
    {
      "requiredTool": "audioread",
      "representedBy": ["audioread"],
      "gate": "file-open blocked until media policy owner review"
    },
    {
      "requiredTool": "pydub",
      "representedBy": ["pydub", "pydub_effects"],
      "gate": "media operations blocked by FFmpeg or avconv policy"
    },
    {
      "requiredTool": "audioflux",
      "representedBy": ["audioflux"],
      "gate": "CPU install planning only"
    },
    {
      "requiredTool": "signalsmith_stretch",
      "representedBy": ["signalsmith_stretch"],
      "gate": "CPU install planning only; runtime execution blocked"
    },
    {
      "requiredTool": "essentia",
      "representedBy": ["essentia"],
      "gate": "evaluation-only blocked"
    },
    {
      "requiredTool": "rubber_band",
      "representedBy": ["pyrubberband", "rubberband_cli"],
      "gate": "evaluation-only blocked; not selected for launch"
    },
    {
      "requiredTool": "demucs",
      "representedBy": ["demucs"],
      "gate": "model-weight owner review blocked"
    },
    {
      "requiredTool": "rnnoise",
      "representedBy": ["rnnoise"],
      "gate": "inactive or blocked evaluation"
    },
    {
      "requiredTool": "lyria",
      "representedBy": ["lyria"],
      "gate": "provider handoff only"
    },
    {
      "requiredTool": "mirelo_sfx_v1_5",
      "representedBy": ["mirelo_sfx_v1_5"],
      "gate": "provider handoff only"
    },
    {
      "requiredTool": "mmaudio_v2",
      "representedBy": ["mmaudio_v2"],
      "gate": "provider handoff only"
    }
  ],
  "internalPlanningTools": [
    "internal_sfx_library",
    "soundsync_cue_planning",
    "music_ducking_mix_qa",
    "sfx_director_tool",
    "music_cue_planner",
    "ambient_sound_planner",
    "audio_qa_tool",
    "private_audio_artifact_manifest_builder",
    "timing_aware_cue_manifest_builder",
    "action_foley_sfx_tool",
    "ambient_everyday_soundscape_tool"
  ],
  "runtimeClaims": {
    "runtime_ready": "blocked_unclaimed",
    "media_processing_ready": "blocked_unclaimed",
    "generated_local_fixture_passed": "blocked_unclaimed",
    "dry_run_passed": "blocked_unclaimed",
    "beta_ready": "blocked_unclaimed",
    "production_ready": "blocked_unclaimed"
  },
  "nextPrompts": [
    "SOUND-RUNTIME-MEDIA-GATE-1: CPU worker install plan, no media execution",
    "SOUND-RUNTIME-MEDIA-GATE-2: model weight owner review, no download",
    "SOUND-RUNTIME-MEDIA-GATE-3: media policy owner handoff, no execution"
  ]
}
```
