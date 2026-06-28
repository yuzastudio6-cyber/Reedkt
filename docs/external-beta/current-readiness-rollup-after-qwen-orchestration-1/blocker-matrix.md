# Blocker Matrix

Packet: `RP-EXTERNAL-BETA-CURRENT-READINESS-ROLLUP-AFTER-QWEN-ORCHESTRATION-1`

| Area | Current status | Next safe action |
| --- | --- | --- |
| Qwen approved-snapshot job orchestration | `qa_passed_confirmed_runtime_fixture_evidence` | Use as source evidence for a controlled product-flow packet |
| Supabase target | `Reeditpro_wmyyttnynmteqgcdishd_staging_source_chain_accepted` | Carry forward only |
| Approved snapshot persistence | `completed_approved_snapshot_persistence_guarded_remote_write_readback` | Carry forward only |
| Credit reservation ledger | `completed_credit_reservation_ledger_guarded_remote_write_readback` | Carry forward only |
| Job queue leases/events | `completed_job_queue_lease_event_guarded_remote_write_readback` | Carry forward only |
| Private artifact storage/access | `completed_private_artifact_storage_access_guarded_remote_write_readback` | Carry forward only |
| Remotion private preview/export | `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation` | Carry forward only |
| Provider/model policy | `qwen_runtime_fixture_qa_passed_broad_provider_calls_still_disabled_by_default` | Future product-flow packet must preserve approval/credit/idempotency/cost gates |
| Controlled tester lane | `controlled_single_tester_external_beta_ready_bounded_expansion_blocked_no_additional_named_tester_list` | Continue single tester or provide explicit additional tester list |
| Public artifacts | `blocked` | Separate explicit artifact policy and approval required |
| Broad media/private user media | `blocked` | Separate bounded media packet required |
| Paid production/billing | `blocked` | Separate Stripe/legal/support/rollback gate required |
| Final delivery/export | `blocked` | Separate production delivery gate required |
| Production unlock | `blocked` | Separate production go/no-go required |
| #577 Remotion proof | `open_draft_blocked_excluded` | Do not use as source-of-truth |

Product-ready end-to-end local OSS tools: `0`
