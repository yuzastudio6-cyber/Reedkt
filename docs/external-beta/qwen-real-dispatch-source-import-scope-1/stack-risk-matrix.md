# QWEN Real Dispatch Stack Risk Matrix

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-SOURCE-IMPORT-SCOPE-1`

Decision: `completed_qwen_real_dispatch_source_import_scope_review_surgical_mock_import_required`

Execution: `completed_docs_only_qwen_source_import_scope_review_no_runtime_execution`

| Surface | Current finding | Decision |
| --- | --- | --- |
| #1695 stacked PR diff | `10` files against stacked base | Evidence only |
| #1695 vs current integration | `5150` files changed, `278957` insertions, `267632` deletions | `blocked_full_stack_import_rejected_surgical_mock_source_import_required` |
| #1695 docs/mock approval files | Useful shape for approval/preflight language | Candidate for future mock-only import |
| #1690 execution plan evidence | Useful shape for 10-step real-dispatch envelope | Candidate for future mock-only import |
| #1702 preflight branch | Newer draft stacked on #1695 | Evidence only, not source-of-truth |
| Worker runtime source from #1695 | Pulls runtime lease/idempotency/private-invoke/dispatch adapter dependencies | Rejected for this import scope |
| Docker and Cloud Build surfaces in full diff | Present in current-integration branch diff | Rejected |
| Supabase, SQL, route, worker, package, and activation doc churn in full diff | Present in current-integration branch diff | Rejected |
| Current external-beta single tester lane | `active_single_tester_external_beta_for_aiediting_reeditpro_com` | Preserved |
| Single tester real usage QA | `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa` | Preserved |
| Broad external beta | `blocked_no_additional_named_tester_list` | Preserved |
| Product-ready end-to-end local OSS tools | `0` | Preserved |

## Accepted Source Boundary

The only accepted output of this packet is the source-import scope decision. No code import, runtime import, worker import, Docker import, Supabase import, SQL import, package import, package-lock mutation, generated artifact, runtime execution, Cloud Run invocation, QWEN inference, or beta/production unlock occurred.
