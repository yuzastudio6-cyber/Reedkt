# SOUND-RUNTIME-MEDIA-GATE-1A Exclusion Register

Gate 1A proves only the pinned CPU package installation and import boundary. Model-weight, binary, provider, worker, route, Supabase, artifact, billing, beta, and production scopes remain blocked.

```json sound-runtime-media-gate-1a-exclusion-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1A",
  "decision": "sound_runtime_media_gate_1a_controlled_cpu_install_proof_passed_with_warnings_ready_for_worker_contract_review",
  "excludedCounts": {
    "modelWeightGpuTools": 12,
    "systemBinaryHandoffTools": 15,
    "blockedEvaluationTools": 5,
    "providerTools": 3
  },
  "modelWeightGpuTools": [
    "deepfilternet",
    "demucs",
    "spleeter",
    "open_unmix",
    "asteroid",
    "speechbrain_enhancement",
    "basic_pitch",
    "whisper_cpp",
    "faster_whisper",
    "pyannote_audio",
    "crepe",
    "torchcrepe"
  ],
  "systemBinaryHandoffTools": [
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
  "blockedEvaluationTools": [
    "rnnoise",
    "pyrubberband",
    "rubberband_cli",
    "rubber_band",
    "essentia"
  ],
  "providerTools": [
    "lyria",
    "mirelo_sfx_v1_5",
    "mmaudio_v2"
  ],
  "excludedScopePolicy": {
    "modelWeightDownload": "blocked",
    "gpuWorkerImage": "blocked",
    "ffmpegFfprobeExecution": "blocked",
    "pydubMediaOperation": "blocked",
    "audioreadFileOpen": "blocked",
    "providerCall": "blocked",
    "workerExecution": "blocked",
    "routeExecution": "blocked",
    "toolExecution": "blocked",
    "gcpCloudRun": "blocked",
    "supabaseSql": "blocked",
    "signedPublicArtifacts": "blocked",
    "billingCreditsStripe": "blocked",
    "betaProduction": "blocked"
  },
  "futureOwnerGates": [
    "SOUND-RUNTIME-MEDIA-GATE-1B: worker contract owner review, no execution",
    "SOUND-RUNTIME-MEDIA-GATE-1C: CPU worker image plan, no Docker/GCP execution",
    "SOUND-RUNTIME-MEDIA-GATE-2: model weight owner review, no download",
    "SOUND-RUNTIME-MEDIA-GATE-3: media policy owner handoff, no execution"
  ]
}
```
