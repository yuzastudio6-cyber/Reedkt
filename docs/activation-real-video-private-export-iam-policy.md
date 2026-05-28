# Phase 30B Render IAM Policy

Phase 30B grants the render worker only the GCS access needed to retry the single controlled private export.

Render service account:

`reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com`

Allowed IAM:

- `roles/storage.objectViewer` with conditions scoped to the approved Phase 28/29 input prefixes.
- `roles/storage.objectCreator` with conditions scoped to Phase 30 output prefixes.

Forbidden IAM:

- owner/editor
- `roles/storage.admin`
- `roles/storage.objectAdmin`
- `roles/storage.objectUser`
- `allUsers` or `allAuthenticatedUsers`
- old `reeditpro-staging-api-sa` service account
- unrelated media, model, provider, or production prefixes

If conditional IAM is rejected, stop before broad grants and report the blocker.
