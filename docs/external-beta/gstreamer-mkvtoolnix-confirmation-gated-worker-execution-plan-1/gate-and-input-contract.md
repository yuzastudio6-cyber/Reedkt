# Gate And Input Contract

The confirmed dry run is blocked unless all required inputs are present:

- `approved_plan_snapshot_reference`
- `approval_record_reference`
- `credit_reservation_or_no_spend_fixture_policy`
- `job_id`
- `worker_lease_id`
- `idempotency_key`
- `private_input_manifest_with_checksums`
- `allowed_command_template_id`
- `private_output_artifact_manifest`
- `qa_report`
- `cleanup_retention_failure_and_audit_policy`

Required confirmation gate:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_EXECUTION=true`

Approved failure categories:

- `blocked_missing_confirmation_gate`
- `blocked_missing_approved_plan_snapshot`
- `blocked_missing_approval_record`
- `blocked_missing_credit_or_no_spend_policy`
- `blocked_missing_worker_lease`
- `blocked_missing_idempotency_key`
- `blocked_unapproved_command_template`
- `blocked_raw_command_string`
- `blocked_missing_private_input_manifest`
- `blocked_manifest_checksum_mismatch`
- `blocked_unapproved_media_source`
- `blocked_public_or_signed_url_source`
- `blocked_output_manifest_missing`
- `blocked_qa_report_missing`
- `blocked_cleanup_policy_missing`
- `blocked_unexpected_worker_or_tool_execution`
- `blocked_delivery_or_unlock_attempt`

No execution is authorized by this packet. It only defines the confirmation-gated plan for a later dry run.
