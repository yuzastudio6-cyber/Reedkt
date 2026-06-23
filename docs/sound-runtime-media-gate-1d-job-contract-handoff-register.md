# SOUND-RUNTIME-MEDIA-GATE-1D Job Contract Handoff Register

This register transfers planning-only job contracts to the worker owner and keeps runtime/media/provider/model jobs blocked.

```json sound-runtime-media-gate-1d-job-contract-handoff-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1D",
  "decision": "sound_runtime_media_gate_1d_worker_runtime_owner_handoff_completed_with_warnings_ready_for_worker_owner_review",
  "acceptedPlanningOnlyJobs": [
    {
      "jobType": "sound.package_import_smoke",
      "allowedInSoundPlanning": true,
      "allowedInWorkerRuntimeToday": false,
      "inputCategory": "package manifest metadata",
      "outputCategory": "import availability summary",
      "mediaAccessRequired": false,
      "artifactWriteRequired": false,
      "supabaseWriteRequired": false,
      "ownerDependency": "WORKER_RUNTIME_JOBS",
      "blocker": "runtime owner acceptance and worker implementation required",
      "futureAcceptanceGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW"
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "allowedInSoundPlanning": true,
      "allowedInWorkerRuntimeToday": false,
      "inputCategory": "synthetic in-memory numeric arrays",
      "outputCategory": "synthetic analysis metrics",
      "mediaAccessRequired": false,
      "artifactWriteRequired": false,
      "supabaseWriteRequired": false,
      "ownerDependency": "WORKER_RUNTIME_JOBS",
      "blocker": "runtime owner acceptance and synthetic input policy required",
      "futureAcceptanceGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW"
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "allowedInSoundPlanning": true,
      "allowedInWorkerRuntimeToday": false,
      "inputCategory": "synthetic symbolic MIDI-like data",
      "outputCategory": "symbolic metadata summary",
      "mediaAccessRequired": false,
      "artifactWriteRequired": false,
      "supabaseWriteRequired": false,
      "ownerDependency": "WORKER_RUNTIME_JOBS",
      "blocker": "runtime owner acceptance and symbolic input policy required",
      "futureAcceptanceGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW"
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "allowedInSoundPlanning": true,
      "allowedInWorkerRuntimeToday": false,
      "inputCategory": "synthetic in-memory loudness samples",
      "outputCategory": "loudness metadata summary",
      "mediaAccessRequired": false,
      "artifactWriteRequired": false,
      "supabaseWriteRequired": false,
      "ownerDependency": "WORKER_RUNTIME_JOBS",
      "blocker": "runtime owner acceptance and loudness input policy required",
      "futureAcceptanceGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW"
    }
  ],
  "sourceEvidenceOnlyJobs": [
    {
      "jobType": "sound.synthetic_fixture_validate",
      "acceptedForGate1dHandoff": false,
      "allowedInWorkerRuntimeToday": false,
      "reason": "Gate 1B kept this as source evidence only; a later owner gate must re-accept it before use."
    }
  ],
  "blockedJobTypes": [
    {
      "jobType": "sound.open_media_file",
      "blocker": "media policy owner review required",
      "allowedInWorkerRuntimeToday": false
    },
    {
      "jobType": "sound.process_real_audio",
      "blocker": "real media processing remains blocked",
      "allowedInWorkerRuntimeToday": false
    },
    {
      "jobType": "sound.pydub_media_operation",
      "blocker": "pydub media operations and FFmpeg/avconv use remain blocked",
      "allowedInWorkerRuntimeToday": false
    },
    {
      "jobType": "sound.ffmpeg_audio_extract",
      "blocker": "FFmpeg/ffprobe binary and media policy gates required",
      "allowedInWorkerRuntimeToday": false
    },
    {
      "jobType": "sound.write_audio_artifact",
      "blocker": "artifact, storage, and Supabase owner gates required",
      "allowedInWorkerRuntimeToday": false
    },
    {
      "jobType": "sound.generate_music",
      "blocker": "provider/model, credit, and artifact gates required",
      "allowedInWorkerRuntimeToday": false
    },
    {
      "jobType": "sound.generate_sfx",
      "blocker": "provider/model, credit, and artifact gates required",
      "allowedInWorkerRuntimeToday": false
    },
    {
      "jobType": "sound.download_model_weights",
      "blocker": "model provenance, checksum, storage, and owner review required",
      "allowedInWorkerRuntimeToday": false
    }
  ],
  "runtimeReadinessClaim": "blocked_unclaimed",
  "generated_local_fixture_passed": "blocked_unclaimed",
  "dry_run_passed": "blocked_unclaimed"
}
```
