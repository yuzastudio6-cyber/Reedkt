# Approved Fixture Inference Runtime Envelope

Packet: `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL-1`

## Confirmation Gate

- Environment variable: `REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE`
- Required value: `true`
- Approval status in this packet: `approved_pending_confirmation_gate`
- Runtime executed in this packet: `false`

## Runtime Target

- Runtime: `google_cloud_run_gpu`
- GPU: `nvidia_l4`
- Region: `us-central1`
- Scale posture: `scale_to_zero_required`
- Minimum instances: `0`
- Initial maximum instances: `1`
- CPU fallback: `false`
- Scope: `one_request_approved_fixture_inference_only`

## Required References

| Reference | Approved value |
| --- | --- |
| Approved tester | `aiediting@reeditpro.com` |
| Staging Supabase target | `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging` |
| Google Cloud project | `reeditpro` |
| Region | `us-central1` |
| Approved snapshot fixture | `qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404` |
| Previous accepted fixture execution | `reeditpro-qwen2-5-vl-private-caller-4qv7m` |
| Previous accepted fixture result | `httpStatus=200`, `qwen_fixture_inference_smoke_completed` |
| Previous transport fail-closed evidence | `httpStatus=403`, `qwen_inference_disabled_after_contract_check` |
| Operator auth preflight run | `2026-06-30T02-01-10-237Z-03964b88` |
| Queue/job reference policy | `required_for_confirmed_runtime_attempt_and_must_be_sanitized_in_report` |
| Idempotency key policy | `single_attempt_idempotency_key_required` |
| Credit policy | `credit_no_spend_no_persistent_credit_mutation` |
| Private input manifest | `private_fixture_manifest_reference_only_no_public_artifact` |
| Output manifest/checksum | `file_names_byte_counts_sha256_only` |
| Timeout/cost ceiling | `single_request_timeout_and_cost_ceiling_required` |
| Fail-closed restore | `restore_qwen_inference_disabled_after_attempt_or_on_failure` |
| Rollback | `no_deployment_or_config_mutation_in_this_approval_phase_runtime_attempt_must_fail_closed` |
| Cleanup | `local_tmp_reports_only_no_generated_artifact_commit` |

## Approved Future Runtime Blockers

The future confirmed runtime packet must stop with exactly one blocker if it cannot complete:

- `blocked_pending_qwen_persisted_worker_dispatch_approved_fixture_inference_confirmation`
- `blocked_gcloud_account_or_project_mismatch_before_qwen_persisted_dispatch`
- `blocked_operator_adc_or_user_token_unavailable`
- `blocked_missing_approved_snapshot_fixture_reference`
- `blocked_missing_persisted_job_or_queue_lease_reference`
- `blocked_missing_single_attempt_idempotency_key`
- `blocked_missing_private_input_manifest`
- `blocked_missing_private_output_manifest_checksum_policy`
- `blocked_timeout_or_cost_ceiling_not_satisfied`
- `blocked_qwen_persisted_dispatch_transport_failed`
- `blocked_qwen_persisted_dispatch_inference_failed`
- `blocked_qwen_persisted_dispatch_response_schema_invalid`
- `blocked_fail_closed_restore_failed`

## Still Blocked

- Additional tester expansion: `blocked_no_additional_named_tester_list`.
- Broad external beta audience: `blocked`.
- Public artifacts: `blocked`.
- Signed URL source-of-truth: `blocked`.
- Credit spend or persistent credit mutation: `blocked`.
- Paid production: `blocked`.
- Production unlock: `blocked`.
- Final delivery/export: `blocked`.

Product-ready end-to-end local OSS tools: `0`

