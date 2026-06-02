# Phase 39C-SG Operator Auth Action Runbook

Use this runbook only if `activation:vlm-sglang-runtime:auth-preflight -- --execute` reports that noninteractive auth is blocked.

Allowed fixes:

1. Refresh the user-account gcloud session outside Codex, then rerun the preflight.
   - Example operator action: `gcloud auth login --no-launch-browser`
   - Do not run browser login inside Codex.

2. Configure service-account impersonation for the existing operator principal.
   - Preferred target: `reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com`
   - The caller must already have permission to mint short-lived tokens for that service account.
   - Do not create a service-account key.

3. Run from Cloud Shell, CI, or another Google-managed runner with an attached service account that already has scoped access.

4. Provide a short-lived access-token file or `CLOUDSDK_AUTH_ACCESS_TOKEN` through the secure environment.
   - Do not commit the token.
   - Do not print the token.

5. Provide a Workload Identity Federation credential file through the secure environment.
   - Do not print or commit the credential file.

If Cloud Build, Artifact Registry, Cloud Run, or private bucket permissions fail after auth succeeds, grant only the missing scoped permissions to the selected principal. Do not grant Owner, Editor, Storage Admin, Storage Object Admin, public principals, or broad bucket-wide roles.

After the operator fix, rerun:

`npm run activation:vlm-sglang-runtime:auth-preflight -- --execute`

Only if that passes should the guarded auth-rerun command proceed.
