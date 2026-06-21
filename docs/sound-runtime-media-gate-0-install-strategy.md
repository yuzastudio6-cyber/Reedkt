# SOUND-RUNTIME-MEDIA-GATE-0 Install Strategy

This strategy converts prior SOUND OSS evidence into an owner-gated install plan. It does not install packages, run binaries, create worker images, or mark media/runtime readiness.

```json sound-runtime-media-gate-0-install-strategy
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-0",
  "decision": "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan",
  "sourceEvidence": {
    "approvedInstallPlanFile": "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
    "requirementsFile": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "approvedInstallPlanToolCount": 16,
    "pinnedPythonRequirementCount": 13
  },
  "pinnedProvenCpuPythonRequirements": [
    "librosa==0.11.0",
    "audioread==3.1.0",
    "pydub==0.25.1",
    "scipy==1.17.1",
    "resampy==0.4.3",
    "pyloudnorm==0.2.0",
    "audioflux==0.1.9",
    "music21==10.3.0",
    "pretty_midi==0.2.11",
    "mido==1.3.3",
    "noisereduce==3.0.3",
    "pedalboard==0.9.23",
    "mir_eval==0.8.2"
  ],
  "approvedInstallPlanTools": [
    "librosa",
    "audioread",
    "pydub",
    "scipy_signal",
    "resampy",
    "pyloudnorm",
    "audioflux",
    "music21",
    "pretty_midi",
    "mido",
    "noisereduce",
    "signalsmith_stretch",
    "pedalboard",
    "pydub_effects",
    "ebu_r128_pyloudnorm",
    "mir_eval"
  ],
  "installGroups": {
    "provenCpuPythonInstallPlan": [
      "librosa",
      "audioread",
      "pydub",
      "scipy_signal",
      "resampy",
      "pyloudnorm",
      "audioflux",
      "music21",
      "pretty_midi",
      "mido",
      "noisereduce",
      "signalsmith_stretch",
      "pedalboard",
      "pydub_effects",
      "ebu_r128_pyloudnorm",
      "mir_eval"
    ],
    "licenseInstallApprovalNeeded": [
      "sox",
      "libsndfile",
      "soundfile",
      "soxr",
      "aubio",
      "madmom",
      "vamp_sonic_annotator",
      "fluidsynth_pyfluidsynth",
      "soundtouch",
      "ladspa_lv2_host",
      "bs1770gain"
    ],
    "systemBinaryOwnerHandoff": [
      "ffmpeg",
      "ffprobe",
      "sox",
      "mediainfo",
      "exiftool",
      "opus_tools",
      "flac_metaflac",
      "vorbis_tools",
      "wavpack",
      "vamp_sonic_annotator",
      "fluidsynth_pyfluidsynth",
      "rubberband_cli",
      "ladspa_lv2_host",
      "bs1770gain",
      "whisper_cpp"
    ],
    "modelWeightOrProvenanceBlocked": [
      "basic_pitch",
      "deepfilternet",
      "demucs",
      "spleeter",
      "open_unmix",
      "asteroid",
      "speechbrain_enhancement",
      "whisper_cpp",
      "faster_whisper",
      "pyannote_audio",
      "crepe",
      "torchcrepe"
    ],
    "providerHandoffOnly": [
      "lyria",
      "mirelo_sfx_v1_5",
      "mmaudio_v2"
    ],
    "blockedEvaluationOnly": [
      "essentia",
      "rnnoise",
      "pyrubberband",
      "rubberband_cli",
      "rubber_band"
    ],
    "internalPlanningOnly": [
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
  "installPolicy": {
    "packageInstallNow": "no",
    "systemPackageInstallNow": "no",
    "modelDownloadNow": "no",
    "mediaExecutionNow": "no",
    "cpuWorkerInstallPlanAllowedNext": "yes_documentation_only",
    "runtimeReadinessClaim": "blocked_unclaimed"
  }
}
```
