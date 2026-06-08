# Supabase Staging DB URL Secret Reference Policy

The deploy transport may use only these staging DB URL environment references:

- `REEDITPRO_STAGING_SUPABASE_DB_URL`
- `SUPABASE_STAGING_DB_URL`
- `STAGING_SUPABASE_DB_URL`

Reports may record only the reference name and present/missing status. They must not print, commit, log, or summarize the DB URL payload, password, host, token, service-role key, anon key, JWT secret, Secret Manager payload, signed URL, provider key, or private media URL.

`SUPABASE_ACCESS_TOKEN` or `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN` may be detected by presence only if the CLI requires it. Their values must remain unread in reports and unprinted in command output.

If no approved DB URL reference is present, the deploy must stop with `staging_supabase_db_url_secret_reference_missing` and `blocked_credentials_unavailable`.

When a DB URL reference is present, PR #223 must parse it in memory only and confirm that the URL targets the approved staging project ref `wmyyttnynmteqgcdishd`. Reports may record only redacted booleans such as `dbUrlTargetMatchedApprovedStaging`; they must not record the host, username, password, query string, or full URL. Direct `db.<project-ref>.supabase.co` URLs and Supabase pooler URLs with a `postgres.<project-ref>` username are the allowed target-match patterns.

If the DB URL cannot be parsed, lacks a target ref, or points at any ref other than the approved staging ref, the deploy must stop before dry-run with `staging_db_url_target_unparseable`, `staging_db_url_target_ref_missing`, or `staging_db_url_target_ref_mismatch`.

## Secret Manager Metadata Discovery

PR #223 may inspect Google Cloud Secret Manager metadata only. The allowed inspection commands are limited to `gcloud config get-value project`, `gcloud secrets list --project=reeditpro --format=json(...)`, and `gcloud secrets describe <secret> --project=reeditpro --format=json(...)`.

Secret payload access is forbidden. The transport must never read, print, summarize, or commit Secret Manager payloads, DB URLs, service-role keys, anon keys, JWT secrets, access tokens, signed URLs, private media URLs, provider keys, or credential material.

Current safe discovery metadata records:

- Project: `reeditpro` / `390722338345`
- Candidate deploy DB URL secret reference: `SUPABASE_DB_URL`
- Candidate confidence: `medium`, because the name is exact but no `env=staging` label is present
- Optional Supabase CLI access-token secret reference: none found
- `SUPABASE_URL`: may be labeled staging, but it is the Supabase API/project URL and must not be used as `--db-url`
- `SUPABASE_SERVICE_ROLE_KEY`: may be labeled staging, but service-role payloads are forbidden for deploy transport and must not be used as `--db-url`

Recommended reference-name mapping for future operator setup:

- `REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF=SUPABASE_DB_URL`
- `SUPABASE_ACCESS_TOKEN_SECRET_REF=null`

This mapping records names only. A future operator or runner must securely inject the DB URL payload into `REEDITPRO_STAGING_SUPABASE_DB_URL` without logging it before the deploy transport can proceed.
