# RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-BOUNDARY-1

Use this prompt only after `RP-INTERNAL-BETA-GOOGLE-CLOUD-MANAGED-RUNTIME-IMPLEMENTATION-PLAN-1` is merged and validated.

Define the owner-approved internal beta Google Cloud environment boundary. This is still planning/approval unless the prompt explicitly authorizes environment verification commands.

Required outputs:

- Google Cloud project ID or explicit placeholder rejection;
- region and non-production environment class;
- Cloud Run service and job naming plan;
- service account naming plan;
- Secret Manager secret-name plan with no payload access;
- GCS/private artifact bucket naming plan;
- Supabase target project decision or explicit blocker;
- deployment prohibition or guarded deployment approval boundary;
- internal beta status and blocker list;
- package-lock and generated artifact status;
- safety statement.

Default conservative result if names are not supplied:

- Decision: `blocked_pending_google_cloud_environment_names`
- Execution: `completed_docs_only_google_cloud_environment_boundary_review_no_runtime_execution`
- Internal beta end-to-end status: `not_ready_pending_environment_boundary`
