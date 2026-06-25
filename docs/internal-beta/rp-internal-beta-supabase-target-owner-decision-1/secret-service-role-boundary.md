# Secret And Service-Role Boundary

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-DECISION-1`

Service-role runtime: `blocked_pending_guarded_rls_storage_validation`

Service-role secret payload access: `forbidden`

Frontend service-role credential exposure: `forbidden`

Service-role route execution: `false`

## Boundary

The approved target ref is non-secret metadata. Secret payloads, DB URLs, service-role keys, anon keys, access tokens, passwords, signed URLs, and credential payloads remain forbidden in logs, docs, source files, generated artifacts, frontend code, and PR bodies.

No service-role route ran in this phase. No approved snapshot persistence, credit mutation, job enqueue, worker dispatch, provider/model call, storage object access, private artifact access, or render/export path was enabled.
