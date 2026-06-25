# Alias Matrix

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-CREDENTIAL-CONTEXT-PREFLIGHT-1`

## Access Token Aliases

Approved access-token aliases: `SUPABASE_ACCESS_TOKEN`, `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN`, `REEDITPRO_SUPABASE_ACCESS_TOKEN`.

Current environment status: `missing_approved_access_token_alias`.

## Read-Only Database URL Aliases

Approved read-only DB URL aliases: `REEDITPRO_SUPABASE_READONLY_DB_URL`, `REEDITPRO_STAGING_SUPABASE_DB_URL`, `SUPABASE_STAGING_DB_URL`, `STAGING_SUPABASE_DB_URL`, `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`.

Current environment status: `missing_approved_readonly_db_url_alias`.

## Payload Boundary

The preflight records only:

- alias class;
- selected environment variable name, if present;
- boolean presence;
- approved alias list;
- sanitized artifact file names, byte counts, and SHA-256 checksums.

The preflight does not record credential payload values, URL hosts, token prefixes, database usernames, passwords, project URLs, or service-role keys.
