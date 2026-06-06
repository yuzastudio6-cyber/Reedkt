# Supabase Staging Deploy Transport Policy

This phase may deploy only `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql` to the approved staging Supabase target after every target, credential, CLI, dry-run, and confirmation gate passes.

Approved migration-safe transport order:

1. `supabase db push --db-url` using a redacted staging DB URL environment reference.
2. `npx supabase db push --db-url` only when `REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED=true`.
3. Plugin migration-safe apply only if it preserves migration history and is proven by safe metadata.

The deploy must run a `--dry-run` first, use a temporary Supabase context containing only the registry migration, and exclude seeds, Track B export rows, unrelated migrations, credentials, and private payloads.

Blocked:

- dashboard SQL editor mutation
- direct/manual ad hoc SQL
- production Supabase
- Track B backfill writes
- provider, route, worker, tool, media, beta, production, public output, and Track A paths

If no migration-safe transport exists, the correct result is `blocked_no_migration_safe_deploy_path`.

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
