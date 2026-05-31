# Schema Validation Results

Prompt 2 validation was static and local-file-only unless explicitly noted. No production or staging Supabase project was contacted.

## Static File Inspection Results

- Active migrations inspected: 21 files under `supabase/migrations/`.
- Draft migrations inspected: 8 files under `database/migration-drafts/`.
- SQL smoke tests inspected: 5 files under `database/test-sql/`.
- Active migration totals from the static audit:
  - `create table`: 161
  - `create type`: 148
  - `create function`: 36
  - `create policy`: 378
  - `create index`: 1022
  - `create view`: 7
  - `create trigger`: 113
  - RLS enable statements: 151
  - storage bucket insert groups: 2
- Potential active duplicate table names detected: `chat_messages`, `credit_estimates`, `credit_ledger_entries`, `credit_reservations`, `edit_plan_segments`, `generated_asset_versions`, `generated_assets`, `generation_events`, `generation_requests`, `media_assets`, `projects`, `qa_reports`, `revision_requests`, `workspace_members`, `workspaces`.
- Static scanner found references to dangerous terms such as `secret` and `token` in active SQL comments/metadata fields. It did not print or detect committed secret values.
- Static scanner found signed URL references in migrations and tests. These require review to ensure signed URLs are never persisted as source-of-truth values.

## Commands Run

```bash
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run --silent schema:static-audit > docs/generated/supabase-schema-static-audit.json
```

Additional validation commands:

```bash
git diff --check
git diff --check origin/codex/rp-foundation-01-production-architecture-freeze...HEAD
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run build
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run lint
```

The `PATH` prefix was required because `/usr/local/bin/node` is an incompatible x86_64 binary on this host, while the bundled Codex node binary is arm64.

## Local Supabase Availability

Local Supabase CLI path was checked with `command -v supabase` during Prompt 2 work and the CLI was present at `/usr/local/bin/supabase`. Executing `supabase --version` failed on this host with `bad CPU type in executable`, so local Supabase validation was unavailable in this environment.

Prompt 2 intentionally did not run:

- `supabase start`
- `supabase db reset`
- SQL smoke tests against a database
- remote Supabase commands

## SQL Tests

SQL test files exist under `database/test-sql/`, but Prompt 2 did not execute them because this milestone did not apply migrations locally or connect to any database.

## Remote/Staging Validation

Remote and staging validation were intentionally skipped. This branch did not link a Supabase project, run remote migrations, run Supabase advisor, create buckets, create policies remotely, or inspect remote data.

## Build/Lint

Prompt 2 adds a Node validation script and an npm script, so build and lint were attempted.

- `npm run build`: failed because `tsc` was not found.
- `npm run lint`: failed because `eslint` was not found.
- `node_modules` is missing in this checkout.
- No package installation was performed because Prompt 2 explicitly forbids package installation.

## Known Limitations

- Static scanning does not parse SQL semantically.
- Static scanning cannot prove migration chain apply order.
- Static scanning cannot prove RLS behavior.
- Static scanning cannot prove storage policy behavior.
- Static scanning cannot prove helper functions compile in Postgres.
- Static scanning cannot prove trigger behavior, FK behavior, or concurrency safety.
- Duplicate table detection is name-based and must be confirmed by SQL application or deeper parsing.

## Next Validation Required

1. Resolve schema conflicts through Prompt 2A.
2. Run disposable local Supabase migration reset.
3. Execute all SQL smoke tests.
4. Verify RLS with owner/member/editor/non-member/service-role cases.
5. Verify storage bucket/path policy behavior.
6. Only after local success, request human approval for staging validation.
