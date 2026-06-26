# RP-INTERNAL-BETA Approved Snapshot Persistence Local Runtime 1 Source Audit

Packet: `RP-INTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-LOCAL-RUNTIME-1`

Decision: `completed_local_approved_snapshot_persistence_runtime_no_supabase_write`

Execution: `completed_backend_local_snapshot_validation_no_route_or_remote_execution`

Base integration source: `c8bfbb2813c0ab7b108bb2ff09fac866974dc1aa`

## Source Chain

- `RP-DATA-04-GUARDED-LOCAL-SUPABASE-MIGRATION-VALIDATION` proves the local migration chain only.
- `RP-BACKEND-01-INTERNAL-BETA-SERVICE-ROLE-API-CONTRACTS` names the approved-plan commit route contract.
- `RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD` keeps service-role routes fail-closed.
- `RP-INTERNAL-BETA-LOCAL-READINESS-GATE-ROLLUP-1` identifies `approved_snapshot_persistence_runtime` as required before internal beta.
- `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CREDENTIAL-CONTEXT-HARDENING-1` keeps downstream staging SQL blocked until approved credential context and target validation exist.
- PR #577 remains open/draft/blocked and excluded as source-of-truth.

## Implementation Scope

The local runtime is `server/services/internal-beta-approved-snapshot-persistence-local-runtime.ts`.

It validates and constructs immutable approved snapshot records locally using the existing cloud contract `validateApprovedPlanSnapshotForWorker`. It does not register a route, write Supabase rows, mutate credits, enqueue jobs, dispatch workers, create artifacts, create signed URLs, render, export, call providers, or unlock internal beta.

The smoke test is `server/smoke/internal-beta-approved-snapshot-persistence-local-runtime-smoke.ts`.

## Required Safety Values

- Approved snapshot local runtime status: `local_snapshot_persistence_validated_no_supabase_write`
- Invalid input blocker: `blocked_invalid_approved_snapshot_persistence_input`
- Immutable snapshot record created locally: `true`
- Supabase persistence: `false`
- Route execution: `false`
- Service-role route execution: `false`
- Credit mutation: `false`
- Credit reservation creation: `false`
- Job enqueue: `false`
- Worker execution: `false`
- Worker dispatch: `false`
- Provider/model call: `false`
- Raw prompt execution: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Internal beta unlock: `false`
- Product-ready end-to-end local OSS tools: `0`

Next milestone: `RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-GUARD-1`, after confirmed Supabase target validation and service-role runtime approval exist.
