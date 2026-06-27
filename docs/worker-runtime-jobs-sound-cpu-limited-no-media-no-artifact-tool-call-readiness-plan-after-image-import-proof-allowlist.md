# WORKER_RUNTIME_JOBS SOUND CPU Limited Tool-Call Readiness Plan After Image Import Proof Allowlist

```json worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-allowlist
{
  "label": "worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-allowlist",
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
    "artifact_write"
  ],
  "counts": {
    "allowedToolCount": 15,
    "readyForToolCallExecutionToday": 0,
    "futureSyntheticProofCandidateCount": 15
  }
}
```
