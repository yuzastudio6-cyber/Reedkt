# Service-Role Boundary

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1`

Decision: `blocked_pending_named_supabase_target_rls_storage_validation`

Service-role runtime: `blocked_pending_named_supabase_target_rls_storage_validation`

Service-role payload access: `false`

Frontend service-role exposure: `false`

## Boundary

The source plan keeps service-role writes backend-only for:

- approved plan snapshots;
- credit reservations and ledger entries;
- generation requests;
- job queue records;
- worker events;
- artifact manifests;
- QA reports;
- final exports;
- audit records.

Frontend code must not write service-role state directly. Workers execute approved snapshots and must not reconstruct work from raw chat.

## Current Status

No service-role secret payload was read. No service-role route ran. No backend route handler, worker, job queue, credit ledger, artifact manifest, storage access, provider/model call, or render/export path was enabled.
