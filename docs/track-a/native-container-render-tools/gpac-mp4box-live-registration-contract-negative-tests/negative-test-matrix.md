# Negative Test Matrix

The negative tests verify the disabled live-registration contract rejects unsafe activation and missing guard states.

| Category | Expected blocker |
| --- | --- |
| Rejected inputs | `blocked_rejected_input_present` |
| Runtime attempts | `blocked_runtime_execution_attempt` |
| Storage/public/delivery attempts | `blocked_storage_or_public_artifact_attempt` |
| Guarded review drift | `blocked_guarded_review_invalid` |
| Backend/service-role context drift | `blocked_missing_backend_service_role_context` |
| Live handler registration | `blocked_live_handler_registered` |
| Feature flag default true | `blocked_feature_flag_enabled` |
| Missing approved snapshot guard | `blocked_missing_approved_snapshot_guard` |
| Missing route idempotency guard | `blocked_missing_route_idempotency_guard` |
| Missing private artifact manifest guard | `blocked_missing_private_artifact_manifest_guard` |
| Missing command allowlist guard | `blocked_missing_command_allowlist_guard` |
| Missing negative-tests guard | `blocked_missing_negative_tests_guard` |
| Storage/signed/public artifact gate drift | `blocked_missing_storage_or_public_artifact_gate` |
| Operator confirmation drift | `blocked_missing_operator_confirmation_guard` |

No executable route, worker, GPAC/MP4Box command, storage transfer, signed/public artifact, Supabase/SQL, beta unlock, production unlock, or final delivery/export path is enabled.
