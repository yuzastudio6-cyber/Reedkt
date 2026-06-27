# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Command Plan

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-command-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof",
  "commandMode": "proposed_not_executed_in_this_prompt",
  "futureProofCommands": [
    {
      "step": "local_image_build",
      "command": "docker build --progress=plain --file server/workers/sound-cpu/Dockerfile --tag reeditpro-sound-cpu:controlled-image-runtime-import-proof-local .",
      "executedInThisPrompt": false,
      "allowedOnlyInNextPrompt": true
    },
    {
      "step": "metadata_and_import_probe_inside_local_image",
      "command": "docker run --rm --network=none --env REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0 --env REEDITPRO_WORKER_EXECUTION_ENABLED=0 --env REEDITPRO_MEDIA_PROCESSING_ENABLED=0 reeditpro-sound-cpu:controlled-image-runtime-import-proof-local python - <<'PY'",
      "executedInThisPrompt": false,
      "allowedOnlyInNextPrompt": true
    },
    {
      "step": "sanitized_image_inspect",
      "command": "docker image inspect reeditpro-sound-cpu:controlled-image-runtime-import-proof-local",
      "executedInThisPrompt": false,
      "allowedOnlyInNextPrompt": true
    },
    {
      "step": "local_image_cleanup",
      "command": "docker image rm reeditpro-sound-cpu:controlled-image-runtime-import-proof-local",
      "executedInThisPrompt": false,
      "allowedOnlyInNextPrompt": true
    }
  ],
  "futurePythonProbeShape": {
    "metadataPackages": [
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
      "mir_eval"
    ],
    "importModules": [
      "librosa",
      "audioread",
      "pydub",
      "scipy",
      "scipy.signal",
      "resampy",
      "pyloudnorm",
      "audioflux",
      "music21",
      "pretty_midi",
      "mido",
      "noisereduce",
      "pedalboard",
      "mir_eval"
    ],
    "aliasCoverage": {
      "pydub_effects": "pydub",
      "ebu_r128_pyloudnorm": "pyloudnorm"
    },
    "runtimeFlagsExpectedFalse": [
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED",
      "REEDITPRO_WORKER_EXECUTION_ENABLED",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED"
    ]
  },
  "futureProbeMustNotCall": [
    "audioread.audio_open",
    "pydub.AudioSegment.from_file",
    "ffmpeg",
    "ffprobe",
    "worker dispatch",
    "route execution",
    "tool execution",
    "provider/model call",
    "Supabase",
    "SQL",
    "artifact write",
    "Docker push",
    "GCP/Cloud Run"
  ]
}
```
