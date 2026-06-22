# SOUND-RUNTIME-MEDIA-GATE-1C Image Excluded Tools Register

Gate 1C excludes all model-weight, system/binary, provider, media-policy, and evaluation tools from the CPU worker image plan.

```json sound-runtime-media-gate-1c-image-excluded-tools-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1C",
  "decision": "sound_runtime_media_gate_1c_cpu_worker_image_plan_completed_with_warnings_ready_for_worker_runtime_handoff",
  "excludedCounts": {
    "modelWeightGpuTools": 12,
    "systemBinaryHandoffTools": 15,
    "providerTools": 3,
    "blockedEvaluationTools": 5,
    "mediaPolicyBlockedTools": 4
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
  "providerTools": [
    "lyria",
    "mirelo_sfx_v1_5",
    "mmaudio_v2"
  ],
  "blockedEvaluationTools": [
    "rnnoise",
    "pyrubberband",
    "rubberband_cli",
    "rubber_band",
    "essentia"
  ],
  "mediaPolicyBlockedTools": [
    "audioread.audio_open",
    "pydub media operations",
    "FFmpeg/ffprobe media probing",
    "real user media processing"
  ],
  "exclusionReasons": {
    "modelWeightGpuTools": "model provenance, checksum, storage, cost, GPU, and owner approval required",
    "systemBinaryHandoffTools": "binary install, LGPL/compliance, codec, and media owner gates required",
    "providerTools": "provider gateway, secrets, cost, and model owner gates required",
    "blockedEvaluationTools": "not selected for launch or blocked until legal/product review",
    "mediaPolicyBlockedTools": "media read/write and artifact policy owner gates required"
  },
  "nextOwnerGates": {
    "modelWeightGpuTools": "SOUND-RUNTIME-MEDIA-GATE-2: model weight owner review, no download",
    "systemBinaryHandoffTools": "SOUND-RUNTIME-MEDIA-GATE-3: media policy owner handoff, no execution",
    "providerTools": "PROVIDER_GATEWAY_MODELS owner review",
    "blockedEvaluationTools": "future legal/product owner review",
    "mediaPolicyBlockedTools": "SOUND-RUNTIME-MEDIA-GATE-3: media policy owner handoff, no execution"
  },
  "scopePolicy": {
    "modelWeightDownload": "blocked",
    "gpuRuntime": "blocked",
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
  }
}
```
