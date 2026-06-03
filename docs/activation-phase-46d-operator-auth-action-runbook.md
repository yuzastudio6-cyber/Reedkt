# Phase 46D Operator Auth Action Runbook

Use this runbook only when Phase 46D-AUTH-RERUN reports noninteractive auth or private metadata access blockers.

Allowed operator actions:

- refresh active `gcloud` auth outside Codex using an approved noninteractive-safe flow
- configure service-account impersonation for an already approved principal
- provide `REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT`
- provide `REEDITPRO_GCP_ACCESS_TOKEN_FILE`
- provide `CLOUDSDK_AUTH_ACCESS_TOKEN`
- provide a Workload Identity Federation credential file
- run from Cloud Shell or another runner with an attached service account

Do not:

- create service-account keys
- run browser login inside Codex
- grant Owner, Editor, Storage Admin, Storage Object Admin, `allUsers`, or `allAuthenticatedUsers`
- broaden bucket access beyond the exact Phase 46B, Phase 46C, and Phase 46D QA artifact prefixes
- process media, OCR, VLM, providers, Docker, Cloud Run, Cloud Build, GPU jobs, or Track A

After auth/access is fixed, rerun:

`npm run activation:media-data-reporting-qa:auth-rerun -- --execute --keep-temp`
