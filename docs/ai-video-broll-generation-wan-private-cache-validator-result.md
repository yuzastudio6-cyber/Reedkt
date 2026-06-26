# AI Video B-roll Wan Private Cache Validator Result

## Status

Decision: `ai_video_broll_wan_private_cache_validator_blocked_disallowed_prefix_no_model_import`

The no-inference Wan mount validator was run against the recorded controlled private cache path. The cache directory exists, but the validator rejected it because `/Volumes/backup/reeditpro-model-cache/...` is not yet an approved validator prefix. This is a fail-closed result and does not indicate missing model evidence.

## Command Run

```bash
python3 server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py --candidate-mount /Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a
```

## Result

- validatorVersion: `ai-video-broll-wan-mount-validator-1`
- modelId: `Wan-AI/Wan2.1-T2V-1.3B`
- modelRevision: `37ec512624d61f7aa208f7ea8140a131f93afc9a`
- private cache directory exists: true
- pathAllowed: false
- pathPrefixKind: `disallowed_prefix`
- layout: `disallowed_path`
- runnableWithCurrentProofRunner: false
- safeForFutureNoInferenceReview: false
- reason: `candidate mount path is outside approved local prefixes`

## No-Scope Statement

No model weights were copied. No model mount was created. No dependency was installed. No source repository was cloned. No model package was imported. No model was loaded. No inference was run. No generated frame, generated video, or generated asset was created. No VM, Docker container, GCP mutation, provider call, worker dispatch, Supabase mutation, SQL execution, storage upload, signed URL, public artifact, credit mutation, beta unlock, or production unlock occurred. No `dry_run_passed` or `generated_local_fixture_passed` claim is made.

## Required Fix

Before the validator can inspect the already-recorded private cache directly, a later prompt must do one of these:

- approve `/Volumes/backup/reeditpro-model-cache/ai-video-broll` as a local evidence-cache validation prefix for no-inference inspection only; or
- define a no-copy/no-symlink staging path under an already approved prefix; or
- defer direct cache validation until a future VM/mount step materializes the approved `/opt` or `/tmp` path.

## Next Prompt

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-6: approve private cache validation prefix, no model import`
