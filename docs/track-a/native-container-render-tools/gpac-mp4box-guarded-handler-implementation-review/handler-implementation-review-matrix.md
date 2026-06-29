# Handler Implementation Review Matrix

Future allowed scope: `disabled_handler_implementation_contract_only`.

Required guards:

- `backend_service_role_ownership_required`
- `disabled_by_default_required`
- `feature_flag_default_false_required`
- `approved_snapshot_guard_required`
- `route_idempotency_guard_required`
- `private_artifact_manifest_guard_required`
- `command_allowlist_guard_required`
- `negative_tests_must_remain_passing`
- `cleanup_audit_reference_required`
- `operator_confirmation_required_before_execution`

Executable handler registration, route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, external beta expansion, paid production unlock, production unlock, and final delivery/export remain blocked.

Next prompt: `TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-IMPLEMENTATION-CONTRACT-1`.
