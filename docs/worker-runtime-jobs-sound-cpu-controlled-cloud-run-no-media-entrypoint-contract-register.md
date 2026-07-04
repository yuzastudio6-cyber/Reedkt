# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Entrypoint Contract Register

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-contract-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-entrypoint-contract-register",
  "entrypointMode": "controlled_no_media_tool_execution",
  "tools": [
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
  "allowedOperations": [
    "synthetic_in_memory_import_and_operation_checks",
    "stdout_json_result",
    "same_interpreter_child_process_per_tool_with_timeout"
  ],
  "requiredDisabledEnvironment": {
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
    "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
    "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
    "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0",
    "REEDITPRO_EXTERNAL_BETA_READY": "false",
    "REEDITPRO_PRODUCTION_READY": "false"
  },
  "forbiddenOperations": [
    "media_file_open",
    "audioread_audio_open",
    "ffmpeg_or_ffprobe_execution",
    "worker_dispatch",
    "route_execution",
    "provider_or_model_call",
    "supabase_mutation",
    "sql_execution",
    "storage_or_artifact_write",
    "signed_url_creation",
    "public_artifact_creation",
    "beta_or_production_unlock"
  ],
  "readinessClaims": "unclaimed"
}
```
