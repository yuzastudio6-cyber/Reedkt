# RP-INTERNAL-BETA-GOOGLE-CLOUD-MANAGED-RUNTIME-IMPLEMENTATION-PLAN-1

Use this prompt only after `RP-INTERNAL-BETA-GOOGLE-CLOUD-MANAGED-RUNTIME-TARGET-APPROVAL-1` is merged and validated.

Plan, do not execute, the Google Cloud managed internal beta runtime implementation.

Required planning outputs:

- Google Cloud project/environment class and non-production boundary;
- Cloud Run service/API topology;
- Cloud Run job/worker topology;
- service accounts and least-privilege IAM plan;
- Secret Manager secret-name plan with no payload exposure;
- private artifact bucket and retention policy;
- Supabase target and service-role boundary plan;
- approved snapshot persistence runtime plan;
- credit reservation/release/refund runtime plan;
- job queue, worker lease, heartbeat, retry, and event runtime plan;
- private artifact manifest/readback runtime plan;
- signed URL policy or explicit signed URL rejection;
- Remotion private preview/export runtime plan;
- provider/model call policy if provider calls are in scope;
- observability, cleanup, rollback, and incident blocker plan.

Default conservative result if no concrete implementation approval is supplied:

- Decision: `blocked_pending_google_cloud_managed_runtime_implementation_plan`
- Execution: `completed_docs_only_google_cloud_managed_runtime_implementation_plan_no_runtime_execution`
- Internal beta end-to-end status: `not_ready_pending_runtime_implementation_and_validation`
