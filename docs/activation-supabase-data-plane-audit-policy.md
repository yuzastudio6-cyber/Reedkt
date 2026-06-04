# Phase 51A Supabase Data-Plane Audit Policy

Phase 51A is scoped to read-only evidence gathering.

## Allowed

- Inspect committed Supabase clients, runtime env parsing, API metadata, worker references, docs, and migration SQL.
- Parse migration table coverage, RLS enablement, policy declarations, service-role grants, storage policy mentions, and signed URL audit tables.
- Inspect Google Secret Manager metadata for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` without reading values during metadata checks.
- In confirmed execution only, resolve backend-only Supabase audit credentials from process env or Google Secret Manager and perform count-only Supabase REST checks.
- Triage StoryTiming RLS findings from committed migration evidence, including dynamic SQL RLS enablement blocks.
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
- `phase51BReadiness` is ready for the Supabase activation milestone registry only after remote count-only audit, StoryTiming triage, and private artifact upload evidence are clear. Controlled internal beta can remain blocked by P0 data-plane findings.
