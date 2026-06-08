# Supabase Staging Deploy Transport Policy

This phase may deploy only `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql` to the approved staging Supabase target after every target, credential, CLI, dry-run, and confirmation gate passes.

Approved migration-safe transport order:

1. `supabase db push --db-url` using a redacted staging DB URL environment reference.
2. `npm exec --yes --package supabase@latest -- supabase db push --db-url` using temp npm cache/prefix outside the repo, only when `REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC=true`.
3. `npx supabase db push --db-url` only when `REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED=true`.
4. Plugin migration-safe apply only if it preserves migration history and is proven by safe metadata.

Before any deploy retry, the transport must run a non-mutating migration-history audit:

- `supabase migration list --db-url [REDACTED] --output-format json`
- compare remote migration IDs with committed local `supabase/migrations`
- run full-repo `supabase db push --db-url [REDACTED] --dry-run`
- allow apply only if the dry-run proves exactly `202606050001_activation_milestone_registry_schema_rls.sql`

`--include-all` is diagnostic-only and must never be applied in this phase. Migration repair is explicitly out of scope and requires a separate approval packet.

The deploy must run a `--dry-run` first, use only the committed migration workflow proven by the audit, and exclude seeds, Track B export rows, credentials, private payloads, direct SQL, and manual migration-history edits.

Blocked:

- dashboard SQL editor mutation
- direct/manual ad hoc SQL
- production Supabase
- Track B backfill writes
- provider, route, worker, tool, media, beta, production, public output, and Track A paths

If no migration-safe transport exists, the correct result is `blocked_no_migration_safe_deploy_path`.

If remote/local migration history is ambiguous, the correct result is `blocked_pending_migration_history_repair_approval`.

## Secret Manager Reference Discovery

The transport may add metadata-only Secret Manager discovery reports. These reports can record project metadata, secret names, labels, create times, and reference-name recommendations, but they must never access or expose secret payloads.

Allowed metadata discovery:

- `gcloud config get-value project`
- `gcloud secrets list --project=reeditpro --format=json(...)`
- `gcloud secrets describe <secret> --project=reeditpro --format=json(...)`

Forbidden:

- Secret Manager payload reads or version-access operations
- DB URL, password, token, service-role key, anon key, JWT secret, signed URL, provider key, or credential payload output
- using `SUPABASE_URL` as a deploy DB URL
- using `SUPABASE_SERVICE_ROLE_KEY` as a deploy DB URL

Current metadata-only discovery classifies `SUPABASE_DB_URL` as the candidate DB URL reference with `medium` confidence. It remains blocked for deploy because the Secret Manager metadata lacks an `env=staging` label and because Codex has not viewed the payload. A future operator must securely inject the payload into `REEDITPRO_STAGING_SUPABASE_DB_URL`, with no logging, and then rerun the migration-safe transport gates.

No Supabase SQL, migration deployment, Track B backfill, production mutation, route/tool/worker execution, media processing, provider call, or Track A work is authorized by Secret Manager reference discovery.
