# WORKER_RUNTIME_JOBS SOUND CPU Limited No-Media No-Artifact Tool-Call Static Allowlist

```json worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-static-allowlist
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_completed_with_warnings_ready_for_controlled_tool_call_readiness_proof",
  "allowlistMode": "future_controlled_synthetic_readiness_proof_only",
  "allowedToolsForFutureProofPlanning": [
    "librosa",
    "audioread",
    "pydub",
    "scipy",
    "resampy",
    "pyloudnorm",
    "audioflux",
    "music21",
    "pretty_midi",
    "mido",
    "noisereduce",
    "pedalboard",
    "mir_eval",
    "pydub_effects",
    "ebu_r128_pyloudnorm"
  ],
  "allowedFutureCallCategories": [
    "package_metadata_read",
    "import_smoke",
    "numeric_array_no_io_smoke",
    "symbolic_midi_in_memory_smoke",
    "loudness_synthetic_array_smoke",
    "effect_graph_construction_no_media_smoke"
  ],
  "explicitlyForbiddenFutureCalls": [
    "media_file_open",
    "audioread.audio_open",
    "pydub.AudioSegment.from_file",
    "ffmpeg",
    "ffprobe",
    "worker_dispatch",
    "route_execution",
    "provider_or_model_call",
    "supabase_or_sql",
    "artifact_write",
    "signed_or_public_url"
  ],
  "counts": {
    "allowedToolCount": 15,
    "readyForToolCallExecutionToday": 0
  }
}
```
