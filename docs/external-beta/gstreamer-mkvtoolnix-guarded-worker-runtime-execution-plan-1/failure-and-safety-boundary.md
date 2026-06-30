# Failure And Safety Boundary

Approved future blockers:

- `blocked_missing_runtime_dry_run_confirmation_gate`
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
- `blocked_worker_skeleton_not_disabled_before_confirmation`
- `blocked_worker_runtime_preflight_failed`
- `blocked_unexpected_route_or_worker_dispatch`
- `blocked_unexpected_tool_execution_scope`
- `blocked_unexpected_media_processing_scope`
- `blocked_delivery_or_unlock_attempt`

Safety in this phase:

- Runtime execution in this phase: `false`
- Worker dispatch in this phase: `false`
- Worker execution in this phase: `false`
- GStreamer execution in this phase: `false`
- MKVToolNix execution in this phase: `false`
- FFmpeg/FFprobe execution in this phase: `false`
- Docker execution in this phase: `false`
- Remotion execution in this phase: `false`
- Media processing in this phase: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Final render/export: `false`

The next runtime dry run may only proceed when the confirmation gate is explicitly present and all required refs are named. Any missing gate/ref or boundary expansion must fail closed with exactly one blocker.
