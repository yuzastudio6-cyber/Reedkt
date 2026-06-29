# QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH

## Summary

Run only after `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-DRY-RUN-ATTEMPT-1` is merged and the local gcloud session for `aiediting@reeditpro.com` can refresh non-interactively on project `reeditpro`.

## Required Prechecks

- `gcloud config get-value account` must return `aiediting@reeditpro.com`.
- `gcloud config get-value project` must return `reeditpro`.
- `gcloud run services describe reeditpro-staging-api --project=reeditpro --region=us-central1 --format=json(status.url)` must pass before any later dry-run transport attempt.
- If the service describe command fails with reauthentication, missing IAM, missing service, or region mismatch, record the exact blocker and stop.

## Boundaries

Do not import draft stacked QWEN PRs wholesale. Do not run QWEN2.5-VL inference, load model weights, create generated assets, mutate Supabase, execute SQL, spend credits, create signed/public artifacts, unlock broad beta, or unlock production from this prompt alone.
