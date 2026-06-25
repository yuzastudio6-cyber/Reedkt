# RP-INTERNAL-BETA Google Cloud Managed Runtime Target Approval Readiness Gate

Readiness: `approved_target_class_pending_google_cloud_runtime_implementation_plan`

Approved runtime target: `google_cloud_managed_runtime_target`

Runtime target approval scope: `target_class_only_no_runtime_execution`

Internal beta end-to-end status: `not_ready_pending_runtime_implementation_and_validation`

Product-ready end-to-end local OSS tools: `0`

## Required Before Runtime Execution

- named Google Cloud project/environment and non-production class;
- service accounts and least-privilege IAM plan;
- Secret Manager secret-name plan without payload exposure;
- Cloud Run service/API and worker/job topology;
- private artifact bucket/storage policy;
- Supabase project target, RLS/storage validation, and service-role boundary;
- approved snapshot persistence runtime packet;
- credit reservation/release/refund runtime packet;
- job queue/worker lease/event runtime packet;
- private artifact manifest/readback runtime packet;
- signed URL policy or signed URL rejection;
- Remotion private preview/export runtime packet;
- provider/model call policy if provider calls are in scope;
- observability, cleanup, retention, rollback, and incident-blocker plan.

Next recommended milestone: `RP-INTERNAL-BETA-GOOGLE-CLOUD-MANAGED-RUNTIME-IMPLEMENTATION-PLAN-1`.
