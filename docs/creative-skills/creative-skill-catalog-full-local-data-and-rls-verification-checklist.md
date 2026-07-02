# RP-BETA-INTEGRATION-17 Creative Skill Catalog Full Local Data And RLS Verification Checklist

## Preflight

- Local config checked.
- `project_id = "reeditpro-local"` confirmed.
- DB port `55432` confirmed.
- Remote risk absent.
- Ports `55430` through `55439` checked.
- Docker daemon reachable.
- Supabase CLI available.
- Protected hashes captured before local commands.

## Migration

- Local `supabase start` ran only for `reeditpro-local`.
- `supabase db reset --local --no-seed` ran locally.
- Migration chain passed.
- Creative Skill catalog migrations were reached.
- Raw local command output stayed out of repo docs.
- Local stack stopped only with `supabase stop --project-id reeditpro-local`.

## Catalog Data

- Six catalog tables existed.
- No extra `creative_skill%` tables existed.
- Counts verified as `21/140/9/20/450/0`.
- Family key parity verified.
- Skill key parity verified.
- Alias parity verified.
- Relationship tuple parity verified.
- Contract mapping tuple parity verified.
- Family metadata parity verified.
- Skill metadata parity verified.
- No-action counterparts verified.
- Duplicate reviews empty.

## Constraints

- Primary keys inspected.
- Unique constraints inspected.
- Foreign keys inspected.
- Check constraints inspected.
- JSONB shape checks inspected.
- Fail-closed probes ran in isolated transactions.
- Probe rows were not persisted.

## Indexes And Comments

- Catalog indexes verified.
- Catalog table comments verified.
- Important catalog column comments verified.
- Missing comments would be documented as warnings.

## RLS And Privileges

- RLS enabled on all six tables.
- Authenticated read policies correct for five metadata tables.
- Duplicate reviews not client-readable.
- Anon policies absent.
- Authenticated and anon write policies absent.
- Grants verified.
- Authenticated read-only behavior verified.
- Anon denial verified.
- Duplicate-review client denial verified.

## Boundaries

- No protected files changed.
- No migration changed.
- No config changed.
- No manifest changed.
- No TypeScript contract changed.
- No mock fixture changed.
- No package file changed.
- No runtime, UI, provider, worker, job, credit, approval, render, export, or app behavior changed.
- No Qwen clone file changed.
- No files staged.
- No commit, merge, push, deploy, `supabase link`, or `supabase db push` occurred.

## Fail The Prompt If

- Remote Supabase is used.
- `supabase link` is run.
- `supabase db push` is run.
- Migration chain failure is ignored.
- Row count mismatch is ignored.
- Key parity mismatch is ignored.
- Metadata parity mismatch is ignored without documentation.
- Duplicate reviews client access exists and is ignored.
- Authenticated write access exists and is ignored.
- SQL output leaks keys, passwords, tokens, or full connection strings.
- Protected files change.
- Files are staged, committed, merged, pushed, or deployed.
