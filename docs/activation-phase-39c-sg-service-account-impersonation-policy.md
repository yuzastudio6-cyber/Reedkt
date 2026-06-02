# Phase 39C-SG Service Account Impersonation Policy

Service-account impersonation is allowed only when the caller already has permission to mint short-lived credentials for the target service account.

The preferred operator service account for this phase is:

`reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com`

The implementation supports either existing gcloud config impersonation or `REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT`. The selected principal is recorded as an email only. Tokens are never printed.

If impersonation fails because the caller lacks `iam.serviceAccounts.getAccessToken`, the phase reports a blocker. It does not grant broad IAM, create service-account keys, or switch to browser login inside Codex.

Allowed operator fixes are scoped:

- grant the caller service-account token creation rights for the selected operator service account,
- run the job from a runner with an attached service account that already has the required Cloud Build, Artifact Registry, Cloud Run, and private GCS permissions,
- provide a short-lived access-token file/env through the secure environment,
- configure Workload Identity Federation.

Project Owner, Editor, Storage Admin, Storage Object Admin, public principals, service-account key creation, and unconditioned broad storage grants are blocked.
