# Route Gate Contract

Packet: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1`

Decision: `blocked_pending_explicit_qwen_runtime_persistence_staging_service_role_route_gate_confirmation`

Execution: `completed_docs_only_qwen_service_role_route_gate_plan_no_remote_execution`

## Future Route

- Route id: `providers.qwen25Vl.structuredVisualMetadataPlan`
- Method: `POST`
- Path: `/api/providers/qwen2-5-vl/structured-visual-metadata`
- Runtime mode: `backend_required`
- Required security: `workspace_editor`
- Requires Supabase: `true`
- Requires service-role backend boundary: `true`
- Requires provider secret boundary before future real provider calls: `true`

## Required Future Readback References

A future confirmed route gate must name generated, bounded fixture references for:

- `approved_snapshot_readback_ref`
- `credit_reservation_readback_ref`
- `queue_lease_readback_ref`
- `private_input_manifest_readback_ref`
- `private_artifact_manifest_readback_ref`
- `private_artifact_checksum_readback_ref`
- `source_sequence_map_readback_ref`
- `compiled_intent_readback_ref`
- `edit_plan_version_readback_ref`
- `model_routing_policy_readback_ref`
- `qa_policy_readback_ref`
- `authenticated_user_ref`
- `workspace_membership_ref`
- `route_idempotency_key`

## Current Phase

- Route execution: `not_run`
- Service-role route execution: `not_run`
- QWEN runtime execution: `false`
- Worker dispatch: `false`
- Provider/model call: `false`
- Remote Supabase mutation: `false`
- SQL execution: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`

The future route gate is allowed only after a separate confirmed packet names the exact route, fixture, service-role secret source, cleanup/readback policy, and confirmation value.
