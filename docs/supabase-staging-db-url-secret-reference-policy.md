# Supabase Staging DB URL Secret Reference Policy

The deploy transport may use only these staging DB URL environment references:

- `REEDITPRO_STAGING_SUPABASE_DB_URL`
- `SUPABASE_STAGING_DB_URL`
- `STAGING_SUPABASE_DB_URL`

Reports may record only the reference name and present/missing status. They must not print, commit, log, or summarize the DB URL payload, password, host, token, service-role key, anon key, JWT secret, Secret Manager payload, signed URL, provider key, or private media URL.

`SUPABASE_ACCESS_TOKEN` or `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN` may be detected by presence only if the CLI requires it. Their values must remain unread in reports and unprinted in command output.

If no approved DB URL reference is present, the deploy must stop with `staging_supabase_db_url_secret_reference_missing` and `blocked_credentials_unavailable`.
