# RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1

Use this prompt only after `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-BOUNDARY-1` records `blocked_pending_google_cloud_environment_names`.

Provide or reject the concrete internal beta environment names required before any runtime scaffold can be implemented.

Required owner inputs:

- Google Cloud project ID;
- region;
- non-production/internal beta environment boundary;
- Cloud Run API service names;
- Cloud Run worker job names;
- service account names;
- Secret Manager secret names only, with no payload values;
- GCS/private artifact bucket names;
- Supabase target project;
- deployment prohibition or guarded deployment approval boundary.

Default conservative result if names are still absent:

- Decision: `blocked_pending_google_cloud_environment_names`
- Execution: `completed_docs_only_google_cloud_environment_owner_input_review_no_runtime_execution`
- Internal beta end-to-end status: `not_ready_pending_environment_boundary`
