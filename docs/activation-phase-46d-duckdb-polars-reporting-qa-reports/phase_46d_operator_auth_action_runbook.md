# Phase 46D Auth-Rerun Operator Action Runbook

Status: `passed`

Auth path used: `active_account`

Active principal: `aiediting@reeditpro.com`

Token output: `not_printed`

Service-account key: `not_used_not_created`

Allowed fixes:

- Use an existing active noninteractive gcloud account.
- Configure service-account impersonation for `reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com` if already permitted.
- Provide a short-lived access-token file or `CLOUDSDK_AUTH_ACCESS_TOKEN` through secure environment wiring.
- Provide a Workload Identity Federation credential file through secure environment wiring.
- Run from Cloud Shell or a runner with an attached service account.

Blocked fixes:

- Do not create service-account keys.
- Do not grant broad Storage Admin/Object Admin roles.
- Do not run browser login inside Codex.
- Do not read media, frames, thumbnails, OCR, VLM, or Track A artifacts.

Current blockers:

- none

Recommended operator actions:

- none
