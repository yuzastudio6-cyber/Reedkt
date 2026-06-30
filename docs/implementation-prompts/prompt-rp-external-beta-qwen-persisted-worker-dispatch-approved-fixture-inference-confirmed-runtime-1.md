# RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1

Use only after `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL-1`.

Goal: execute one controlled QWEN persisted-worker-dispatch approved-fixture inference attempt and record sanitized evidence.

Required confirmation gate:

`REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true`

Required target:

- Google Cloud project: `reeditpro`
- Region: `us-central1`
- Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- Approved tester: `aiediting@reeditpro.com`
- Runtime shape: `google_cloud_run_gpu`, `nvidia_l4`, min instances `0`, initial max instances `1`, CPU fallback `false`

Required fixture envelope:

- Approved snapshot fixture reference: `qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404`
- Queue/job reference policy: `required_for_confirmed_runtime_attempt_and_must_be_sanitized_in_report`
- Idempotency policy: `single_attempt_idempotency_key_required`
- Credit policy: `credit_no_spend_no_persistent_credit_mutation`
- Private input manifest policy: `private_fixture_manifest_reference_only_no_public_artifact`
- Private output manifest/checksum policy: `local_or_private_manifest_with_file_names_byte_counts_sha256_only`
- Timeout/cost ceiling: `single_request_timeout_and_cost_ceiling_required`
- Fail-closed restore: `restore_qwen_inference_disabled_after_attempt_or_on_failure`
- Rollback: `no_deployment_or_config_mutation_runtime_attempt_must_fail_closed`
- Cleanup: `local_tmp_reports_only_no_generated_artifact_commit`

Approved blockers:

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

Boundary: one request only. Do not authorize broad provider/model calls, arbitrary media, public artifacts, signed URLs as source-of-truth, credit spend, paid production, final delivery/export, broad external beta, production unlock, draft-stack merge, or blind cherry-pick.

