# RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1

Use this only after `SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1` records `completed_service_role_runtime_boundary_validation`.

## Goal

Implement the next guarded backend-only approved snapshot service-role persistence step for the isolated clean staging target. The implementation must remain tied to immutable approved snapshots, idempotency keys, audit records, and least-privilege service-role boundaries.

## Required Gate

Any remote persistence runner must require an explicit confirmation variable and approved Secret Manager references. It must never print, hash, summarize, commit, or expose a service-role key, database URL, password, token, signed URL, or secret payload.

## Boundaries

Do not dispatch workers, claim leases, process media, call providers/models, create signed/public artifacts, run production routes, or unlock internal beta, external beta, production, or final delivery unless a later explicit runtime packet approves the exact operation.

## Required Source Dependencies

- `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1`
- `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1`
- `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1`
- `SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1`

PR #577 remains excluded unless it is separately validated and merged.
