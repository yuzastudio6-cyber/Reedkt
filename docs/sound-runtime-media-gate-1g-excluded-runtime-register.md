# SOUND-RUNTIME-MEDIA-GATE-1G Excluded Runtime Register

This register keeps every non-source-creation capability closed after the Dockerfile source file is added.

```json sound-runtime-media-gate-1g-excluded-runtime-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1G",
  "decision": "sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "excludedScopes": [
    {"scope": "Docker build", "status": "blocked", "executionAllowedNow": false},
    {"scope": "Docker push", "status": "blocked", "executionAllowedNow": false},
    {"scope": "GCP/Cloud Run", "status": "blocked", "executionAllowedNow": false},
    {"scope": "Secret Manager", "status": "blocked", "executionAllowedNow": false},
    {"scope": "service accounts", "status": "blocked", "executionAllowedNow": false},
    {"scope": "worker execution", "status": "blocked", "executionAllowedNow": false},
    {"scope": "route/tool execution", "status": "blocked", "executionAllowedNow": false},
    {"scope": "media processing", "status": "blocked", "executionAllowedNow": false},
    {"scope": "FFmpeg/ffprobe", "status": "blocked", "executionAllowedNow": false},
    {"scope": "model weights", "status": "blocked", "executionAllowedNow": false},
    {"scope": "Supabase/SQL", "status": "blocked", "executionAllowedNow": false},
    {"scope": "artifacts/signed/public URLs", "status": "blocked", "executionAllowedNow": false},
    {"scope": "billing/credits", "status": "blocked", "executionAllowedNow": false},
    {"scope": "beta/production", "status": "blocked", "executionAllowedNow": false},
    {"scope": "generated_local_fixture_passed", "status": "blocked_unclaimed", "executionAllowedNow": false},
    {"scope": "dry_run_passed", "status": "blocked_unclaimed", "executionAllowedNow": false},
    {"scope": "runtime readiness", "status": "blocked_unclaimed", "executionAllowedNow": false}
  ]
}
```
