# Production GCP IAM Plan

## Principle

Use separate service accounts per runtime group and grant only the bucket, Secret Manager, logging, monitoring, and invocation permissions needed for that group. Do not grant owner/editor roles.

## Service Account Boundaries

| Service account | Intended access |
| --- | --- |
| `reeditpro-api-sa` | Runtime secrets needed by the API, limited object reads for source/previews/final exports, and future worker trigger permissions. |
| `reeditpro-cpu-worker-sa` | Read source/proxy media; write proxy media, analysis artifacts, transcripts, and worker temp. No provider secrets by default. |
| `reeditpro-gpu-worker-sa` | Read approved source/proxy/temp inputs; write transcripts, masks, generated assets, analysis artifacts, and temp. Model/provider secrets require later approval. |
| `reeditpro-render-worker-sa` | Read source/proxy/generated/mask/transcript/analysis assets; write previews, final exports, QA artifacts, and temp. No provider secrets by default. |
| `reeditpro-qa-worker-sa` | Read analysis artifacts, previews, final exports, masks, transcripts, and generated assets; write QA artifacts. No provider secrets by default. |
| `reeditpro-tool-readiness-sa` | Minimal logging/monitoring and QA artifact writes for readiness reports. No source media access by default. |

## Project-Level Roles

Allowed project-level roles in Milestone 3 templates:

- `roles/logging.logWriter`
- `roles/monitoring.metricWriter`
- `roles/run.invoker` for API-triggered worker invocation where later needed

Disallowed:

- `roles/owner`
- `roles/editor`
- broad storage admin at project level

## Secret Access

Milestone 3 grants API placeholder access for runtime secrets only. Worker secret access for providers or model weights is deferred until later milestones approve exact use cases.

## Activation Phase 22 Staging IAM

Activation Phase 22 adds a staging least-privilege IAM plan in `docs/activation-gcp-staging-iam-policy.md` and `server/activation/gcp-staging/*`. The staging plan preserves the same prohibitions: no owner/editor, no `allUsers`, no `allAuthenticatedUsers`, no broad project-wide storage admin, and no provider/model secrets before later approval.
