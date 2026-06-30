# Negative Test Matrix

Smoke: `smoke:rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-skeleton-implementation-1`

Covered blockers:

- `blocked_missing_mock_enqueue`
- `blocked_enqueue_contract_invalid`
- `blocked_queue_item_not_mock_only`
- `blocked_queue_item_not_queued`
- `blocked_worker_kind_mismatch`
- `blocked_skeleton_mode_not_disabled`
- `blocked_missing_required_metadata`
- `blocked_raw_or_unapproved_input_attempt`
- `blocked_worker_dispatch_not_enabled`
- `blocked_worker_execution_not_enabled`
- `blocked_tool_execution_not_enabled`
- `blocked_media_processing_not_enabled`
- `blocked_public_or_signed_artifact_attempt`
- `blocked_delivery_or_unlock_attempt`

The smoke verifies the happy path remains metadata-only and that dispatch, worker execution, tool execution, raw/unapproved input, non-queued queue state, public artifacts, and delivery/export attempts fail closed.
