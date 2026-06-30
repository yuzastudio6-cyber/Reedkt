# Negative Test Matrix

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1`

Smoke: `smoke:rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-implementation-1`

## Expected Pass Case

- `baseline_guarded_worker_route_contract_validates`
- `response_is_sanitized_and_all_runtime_flags_false`
- `all_allowed_command_templates_validate_as_route_metadata`

## Expected Fail-Closed Cases

| Case | Expected blocker |
| --- | --- |
| Missing or unsafe backend service-role context | `blocked_missing_backend_service_role_context` |
| Missing approved plan snapshot | `blocked_missing_approved_plan_snapshot` |
| Missing approval record | `blocked_missing_approval_record` |
| Missing credit/no-spend policy | `blocked_missing_credit_or_no_spend_policy` |
| Missing disabled worker lease | `blocked_missing_worker_lease` |
| Missing route idempotency key | `blocked_missing_idempotency_key` |
| Route idempotency mismatch | `blocked_idempotency_mismatch` |
| Unapproved command template or raw-command path | `blocked_unapproved_command_template` |
| Worker scaffold validation failure | `blocked_worker_contract_validation_failed` |
| Route, worker, GStreamer, MKVToolNix, or media runtime attempt | `blocked_runtime_execution_not_enabled` |
| Signed URL or public artifact attempt | `blocked_public_or_signed_artifact_attempt` |
| Final render/export or unlock attempt | `blocked_delivery_or_unlock_attempt` |

The smoke is contract-only and does not call a route handler, run a worker, invoke GStreamer, invoke MKVToolNix, run FFmpeg/FFprobe, run Docker, mutate Supabase, run SQL, or process media.
