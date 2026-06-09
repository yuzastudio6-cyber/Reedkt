# Supabase Staging Reset Secret Policy

The only approved DB URL secret reference for this phase is `SUPABASE_DB_URL`, injected into `REEDITPRO_STAGING_SUPABASE_DB_URL` in the current process environment only.

Reports may record only safe metadata:

- secret reference name;
- payload access status;
- DB URL env presence;
- approved staging target match status;
- `payloadPrinted:false`;
- `dbUrlPrinted:false`;
- `credentialPayloadsPrinted:false`.

Reports and commits must never contain DB URLs, hostnames, usernames, passwords, service-role keys, anon keys, access tokens, JWT secrets, signed URLs, private media URLs, provider keys, or backup payloads.
