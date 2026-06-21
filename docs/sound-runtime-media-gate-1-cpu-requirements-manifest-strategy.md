# SOUND-RUNTIME-MEDIA-GATE-1 CPU Requirements Manifest Strategy

Gate 1 reuses the existing SOUND requirements manifest as source evidence. It does not create a runtime-specific requirements copy or run the install proof.

```json sound-runtime-media-gate-1-cpu-requirements-manifest-strategy
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1",
  "decision": "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof",
  "requirementsSource": {
    "reuseExistingFile": true,
    "path": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "createRuntimeSpecificCopyNow": false,
    "futureCopyAllowedAfter": "SOUND-RUNTIME-MEDIA-GATE-1A controlled CPU install proof"
  },
  "pinnedRequirements": [
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
  "directPinnedPackageCount": 13,
  "aliasCoveredTools": [
    {
      "toolId": "pydub_effects",
      "manifestPackage": "pydub==0.25.1"
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "manifestPackage": "pyloudnorm==0.2.0"
    }
  ],
  "approvedButNotInstallCandidateInGate1": [
    {
      "toolId": "signalsmith_stretch",
      "reason": "approved-plan-covered but remains planning-only until owner proof scope is explicit"
    }
  ],
  "excludedPackages": {
    "modelWeights": [
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
    "systemBinaryOrRuntimeHandoff": [
      "ffmpeg",
      "ffprobe",
      "sox",
      "libsndfile",
      "soundfile",
      "soxr",
      "aubio",
      "madmom",
      "vamp_sonic_annotator",
      "fluidsynth_pyfluidsynth",
      "bs1770gain",
      "soundtouch",
      "opus_tools",
      "flac_metaflac",
      "vorbis_tools"
    ],
    "blockedEvaluation": [
      "essentia",
      "rnnoise",
      "pyrubberband",
      "rubberband_cli",
      "rubber_band"
    ],
    "providers": [
      "lyria",
      "mirelo_sfx_v1_5",
      "mmaudio_v2"
    ]
  },
  "packageLockStatus": "unchanged_expected",
  "pythonVersionCompatibilityAssumption": "A later proof gate selects and records the Python runtime; Gate 1 only requires that the existing pinned manifest remain the requirements source.",
  "expectedFutureInstallCommand": "python -m pip install -r server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "expectedFutureCiCommand": "python -m pip install -r server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt && python scripts/validation/sound-oss-tools-4-binary-import-proof-runner.py",
  "modelWeightsDownloadedNow": false,
  "runtimeReadinessClaim": "blocked_unclaimed"
}
```
