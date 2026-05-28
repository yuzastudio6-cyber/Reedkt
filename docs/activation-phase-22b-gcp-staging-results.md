# Phase 22B GCP Staging Foundation Results

## Summary

Phase 22B completed the guarded staging foundation setup for
`GCP_PROJECT_ID=reeditpro` after the temporary service-account creation quota
blocker cleared.

The missing tool-readiness service account was created and verified, the
Secret Manager placeholder names were created with no versions or values, and
least-privilege IAM was configured for the patched staging service accounts.

No Cloud Run deployment, Docker image push/build, GPU job, provider call, model
download, media processing, secret value creation, production-ready change,
external beta unblock, or real user media testing was performed.

## Safety Gates

| Gate | State |
| --- | --- |
| `productionReadyAllowed` | `false` |
| `externalBetaAllowed` | `false` |
| `realUserMediaTestingAllowed` | `false` |
| Deployment executed | `false` |
| Docker push executed | `false` |
| Docker build executed | `false` |
| Secret values created | `false` |
| Provider calls executed | `false` |
| Model downloads executed | `false` |
| Media processing executed | `false` |
| GCP staging resources created / verified | complete |

## Service Account ID Fix

The patched staging plan uses Google Cloud-valid service account IDs:

| Role | Service account ID |
| --- | --- |
| API | `reeditpro-stg-api-sa` |
| CPU worker | `reeditpro-stg-cpu-worker-sa` |
| GPU worker | `reeditpro-stg-gpu-worker-sa` |
| Render worker | `reeditpro-stg-render-sa` |
| QA worker | `reeditpro-stg-qa-sa` |
| Tool readiness worker | `reeditpro-stg-tool-ready-sa` |

Validation rejects service account IDs unless they are 6-30 characters, start
with a lowercase letter, use only lowercase letters, numbers, and dashes, and
include `staging` or `stg`.

## Existing Old Service Account

`reeditpro-staging-api-sa@reeditpro.iam.gserviceaccount.com` was created before
the naming fix. It was not deleted, is not referenced by the patched staging
plan, and cleanup is deferred to a later explicit cleanup phase.

## GCP Auth And Project Preflight

| Check | Result |
| --- | --- |
| Requested staging project | `reeditpro` |
| Active `gcloud` project | `reeditpro` |
| Project describe | `reeditpro` / `ACTIVE` |
| Active account | `aiediting@reeditpro.com` |
| `REEDITPRO_ENV` | `staging` |
| `REEDITPRO_CONFIRM_STAGING_GCP_SETUP` | `true` |
| Legacy script confirmation mapping | `REEDITPRO_CONFIRM_PROD_SETUP=true` in the guarded staging shell only |
| Preflight decision | passed |

## Resources Created Or Verified

| Resource area | Status | Notes |
| --- | --- | --- |
| APIs | enabled / verified | All 10 required APIs are enabled. |
| Artifact Registry | created / verified | `reeditpro-staging-workers` exists in `us-central1` with Docker format. |
| Buckets | created / verified | All 10 requested staging buckets exist. |
| Bucket privacy | verified | All buckets have uniform bucket-level access `true`, public access prevention `enforced`, labels `app=reeditpro,env=staging`, and no `allUsers` / `allAuthenticatedUsers` bucket IAM members. |
| Service accounts | created / verified | All six patched staging service accounts exist. |
| Secret placeholders | created / verified | All 10 requested Secret Manager names exist with zero versions. |
| IAM | configured / verified | Patched accounts have the planned logging, monitoring, run invoker, bucket, and limited secret-access bindings. |
| Cloud Run services/jobs | not attempted | Deployment remains out of scope. |

## Service Accounts

| Service account | Status |
| --- | --- |
| `reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com` | exists |
| `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` | exists |
| `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` | exists |
| `reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com` | exists |
| `reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com` | exists |
| `reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com` | exists |

## Secret Placeholders

The following Secret Manager names exist with zero versions and no values:

| Secret name | Versions |
| --- | --- |
| `SUPABASE_URL` | `0` |
| `SUPABASE_SERVICE_ROLE_KEY` | `0` |
| `OPENAI_API_KEY` | `0` |
| `PROVIDER_GATEWAY_SHARED_SECRET` | `0` |
| `WORKER_WEBHOOK_SECRET` | `0` |
| `STRIPE_SECRET_KEY` | `0` |
| `SFX_PROVIDER_API_KEY` | `0` |
| `MUSIC_PROVIDER_API_KEY` | `0` |
| `MODEL_WEIGHT_ACCESS_TOKEN` | `0` |
| `HUGGINGFACE_TOKEN` | `0` |

## IAM

Project IAM verification passed for the patched service accounts:

- All six patched service accounts have `roles/logging.logWriter`.
- All six patched service accounts have `roles/monitoring.metricWriter`.
- `reeditpro-stg-api-sa` has `roles/run.invoker`.
- No patched service account has `roles/owner` or `roles/editor`.
- No `allUsers` or `allAuthenticatedUsers` principals were found in project IAM.

Secret IAM verification passed:

- `reeditpro-stg-api-sa` has Secret Manager accessor on the runtime secrets
  required before deploy: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `PROVIDER_GATEWAY_SHARED_SECRET`, `WORKER_WEBHOOK_SECRET`, and
  `STRIPE_SECRET_KEY`.
- No patched service account has accessor on provider/model placeholders:
  `OPENAI_API_KEY`, `SFX_PROVIDER_API_KEY`, `MUSIC_PROVIDER_API_KEY`,
  `MODEL_WEIGHT_ACCESS_TOKEN`, or `HUGGINGFACE_TOKEN`.

Bucket IAM verification passed:

- No staging bucket contains `allUsers` or `allAuthenticatedUsers`.
- The tool-readiness service account is not granted source-media access by the
  patched plan.

Existing project IAM includes human owner grants that predate this run. They
were not added by Phase 22B.

## Quota Retry Result

The previous `RESOURCE_EXHAUSTED` service-account creation quota cleared. The
missing `reeditpro-stg-tool-ready-sa` account now exists and is included in the
verified IAM plan.

The first retry wrapper hit a local shell variable naming issue after the cloud
create request succeeded. A bash retry verified the service account and the
foundation setup continued.

## Blockers

None for Phase 23B image push preparation.

## Warnings

- Google Cloud SDK emitted Python 3.9 support warnings.
- `gcloud storage` and Artifact Registry commands emitted a local Cloud SDK
  `importlib.metadata` warning; bucket verification was completed with `gsutil`.
- `gsutil` emitted a local LibreSSL / urllib3 compatibility warning, but bucket
  reads completed successfully.
- The static activation report remains a planning report and reports
  `resourcesCreated=false`; this execution report records actual cloud state.
- The old long API service account remains for a later explicit cleanup phase.

## Logs

Raw logs are stored under
`activation-logs/gcp-staging/phase22b/`.

Key log files:

- `19-after-quota-preflight.log`
- `20-existing-resource-verification.log`
- `22-create-missing-tool-readiness-service-account-bash.log`
- Timestamped `05-create-secret-placeholders` and `06-configure-iam` logs
- `26-final-foundation-verification-gsutil.log`

## Phase 23B Readiness

`ready`

Phase 23B image push preparation can proceed for the non-GPU images. Artifact
Registry, private staging buckets, patched service accounts, secret placeholder
names, and IAM are verified. Actual image push is still a separate guarded
phase.

## Phase 24B Readiness

`blocked`

Phase 24B remains blocked until Phase 23B image push completes, pushed image
digests are verified, deploy-time secret values are provided by humans, and the
non-GPU staging deploy prerequisites are checked.

## Validation

| Command | Result |
| --- | --- |
| `smoke:activation-gcp-staging-config` | passed |
| `activation:gcp-staging:report -- --project reeditpro --image-tag staging-local-001` | passed |
| `lint` | passed |
| `build` | passed with existing large chunk warning |
| `build:server` | passed |
| `git diff --check` | passed |

`package-lock.json` was not changed.

## Next Step

Proceed to the guarded Phase 23B image push preparation. Do not deploy Cloud
Run, call providers, download models, add secret values, process media, or
unblock production, external beta, or real user media testing during Phase 23B.
