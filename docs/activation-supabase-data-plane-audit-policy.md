# Phase 51A Supabase Data-Plane Audit Policy

Phase 51A is scoped to read-only evidence gathering.

## Allowed

- Inspect committed Supabase clients, runtime env parsing, API metadata, worker references, docs, and migration SQL.
- Parse migration table coverage, RLS enablement, policy declarations, service-role grants, storage policy mentions, and signed URL audit tables.
- In confirmed execution only, perform count-only Supabase REST checks when backend credentials are already available.
- Upload private JSON audit artifacts to the Phase 51A GCS prefixes when GCS permissions are already available.

## Blocked

- Supabase lifecycle commands.
- SQL execution that mutates data or schema.
- Remote migrations or schema changes.
- Row payload reads or writes.
- Secret values, DB URLs, tokens, provider keys, service-role values, and signed URLs in logs/docs/artifacts.
- Provider calls, media processing, Docker, deployment, production, external beta, paid production, and broad media.

## Readiness definitions

- `canRunLocalSql` is true only after local executable SQL readiness is proven. Phase 51A does not prove this.
- `canProceedToPrompt20B` is true only when non-SQL blockers are cleared and Prompt 20B can safely create/run the first local executable RLS smoke.
- `phase51BReadiness` is ready only when the evidence is sufficient to plan schema and migration hardening. Missing credentials or unclear remote schema keeps it blocked.
