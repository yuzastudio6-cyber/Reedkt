# Registration Guard Matrix

The guarded live registration review allows only a future disabled contract. It does not approve a live handler.

| Guard | Status |
| --- | --- |
| Backend/service-role owner | `backend_service_role_owner_required` |
| Live handler default | `live_handler_disabled_by_default_required` |
| Feature flag default | `feature_flag_default_false_required` |
| Approved snapshot guard | `approved_snapshot_guard_required` |
| Route idempotency guard | `route_idempotency_guard_required` |
| Private artifact manifest guard | `private_artifact_manifest_guard_required` |
| Command allowlist guard | `command_allowlist_guard_required` |
| Negative tests | `negative_tests_must_remain_passing` |
| Storage transfer | `no_storage_transfer_until_private_artifact_runtime_gate` |
| Signed/public artifacts | `no_signed_or_public_artifact_until_delivery_policy_gate` |
| Operator confirmation | `operator_confirmation_required_before_any_execution` |

Blocked in this phase: route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, production unlock, and final delivery/export.
