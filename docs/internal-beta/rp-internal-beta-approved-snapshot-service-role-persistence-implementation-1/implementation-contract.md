# Approved Snapshot Service-Role Persistence Implementation Contract

Decision: `completed_service_role_persistence_envelope_validated_no_remote_write`

Execution: `completed_backend_service_role_persistence_envelope_no_remote_execution`

Implementation file: `server/services/internal-beta-approved-snapshot-service-role-persistence-implementation.ts`

Smoke: `server/smoke/internal-beta-approved-snapshot-service-role-persistence-implementation-smoke.ts`

The implementation builds a deterministic backend-only persistence envelope after all existing guard gates are satisfied locally:

- approved Supabase credential-context presence contract;
- confirmed Supabase target RLS/storage validation flag;
- service-role persistence runtime approval flag;
- remote persistence confirmation flag;
- valid immutable approved snapshot local runtime;
- idempotency key presence;
- forbidden raw chat/raw prompt/signed URL/service-role payload rejection.

Envelope tables:

- `approved_plan_snapshots`
- `approval_records`
- `api_idempotency_keys`
- `audit_events`

The envelope records:

- deterministic approved snapshot UUID derived from the approved snapshot hash;
- immutable approved snapshot row fields aligned with existing Supabase migrations;
- plan, credit, source sequence, and timing hashes;
- approval record patch linking the approved snapshot;
- API idempotency key insert with request hash;
- append-only audit event insert metadata;
- `persistedToSupabase: false`;
- `remoteSupabaseMutation: false`;
- `serviceRoleRouteExecution: false`;
- `workerExecution: false`;
- `internalBetaUnlock: false`.

This packet intentionally does not introduce a live route handler, Supabase client call, SQL statement, migration, RPC execution, worker dispatch, provider/model call, storage read/write, signed URL creation, public artifact creation, credit mutation, job enqueue, or beta unlock.
