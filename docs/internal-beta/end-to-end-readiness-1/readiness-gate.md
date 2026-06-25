# ReEditPro End-To-End Internal Beta Readiness Gate

Decision: `blocked_pending_backend_worker_render_storage_billing_and_tool_runtime_gates`

Execution: `completed_docs_only_internal_beta_readiness_source_of_truth_no_runtime_unlock`

Internal beta end-to-end status: `not_ready`

Internal beta gate posture: `narrow_safe_lane_required_before_unlock`

External beta status: `blocked`

Paid production status: `blocked`

Final delivery/export status: `blocked`

Product-ready end-to-end local OSS tools: `0`

## Minimal Safe Internal Beta Lane

The first internal beta should prove one narrow lane, not every tool:

1. Upload private test clips.
2. Compile editing intent into structured plan input.
3. Create source sequence map.
4. Generate an edit plan with credit estimate.
5. Persist an approved plan snapshot only after user approval.
6. Reserve internal test credits.
7. Enqueue backend worker jobs from the approved snapshot only.
8. Produce private preview/export artifacts through a guarded render worker.
9. Record artifact manifests, checksums, QA reports, worker events, cleanup policy, and audit logs.
10. Show private artifact readback only to authorized internal testers.

## Required Gates Before Internal Beta Unlock

| Gate | Status | Required Before Unlock |
| --- | --- | --- |
| Supabase schema and RLS | `blocked_pending_reviewed_migration_and_rls_tests` | projects, media assets, approved plan versions, credit reservations, jobs, worker events, artifact manifests, QA reports, audit logs |
| Private storage buckets | `blocked_pending_private_bucket_policy_and_access_tests` | private media/artifact bucket policy, retention, cleanup, least-privilege readback |
| Approved plan snapshots | `blocked_pending_backend_persistence` | immutable approved versions and approval reset rules |
| Credit approval gate | `blocked_pending_internal_credit_ledger` | estimate, reserve, release, refund, audit; Stripe remains disabled |
| Worker queue | `blocked_pending_backend_job_queue_and_leases` | idempotency keys, leases, status events, retries, cleanup |
| Remotion render worker | `blocked_pending_worker_skeleton_and_no_public_artifact_policy` | private preview/export only, no final delivery unlock |
| Tool runtime registry | `blocked_pending_runtime_layer` | separate `planning_only`, `approved_internal_beta`, and `production_ready` states |
| Provider adapters | `blocked_pending_backend_only_disabled_by_default_adapters` | no provider/model calls before approval and credit reservation |
| QA and negative tests | `blocked_pending_e2e_qa_suite` | no generation before approval, no credits without reservation, no frontend provider calls, no public artifacts |

## Beta Boundary

Internal beta does not require every tool to be installed. It requires one safe, testable end-to-end lane with strict approvals, private artifacts, backend-only mutations, worker isolation, and auditability.

External beta, paid production, broad media, public artifacts, signed URLs as source-of-truth, and final delivery/export remain blocked until separate readiness gates approve them.
