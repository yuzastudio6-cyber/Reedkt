# Supabase Read-Only Audit Redaction Rules

Prompt 24A accepts only redacted, read-only Supabase project evidence. It does not request secrets and must never expose values that could grant access to a Supabase project, provider account, payment system, storage object, or private user data.

## Must Be Removed

- service-role keys;
- anon keys;
- JWT secrets;
- database passwords;
- full database connection strings;
- provider keys;
- Stripe keys;
- signed URLs;
- tokenized URLs;
- private media URLs;
- raw user records;
- raw row data;
- private project refs if they can identify a live environment;
- emails, phone numbers, names, addresses, or other raw PII.

## Allowed After Redaction

- non-sensitive environment labels such as `staging-redacted` and `production-redacted`;
- table names;
- policy names;
- migration filenames;
- bucket names when they do not reveal private data;
- edge function names when they do not reveal secrets;
- localhost-only local evidence already recorded in repo docs;
- summarized dashboard states without keys, tokens, or real user data.

## Redaction Labels

Use stable labels instead of values:

- `[redacted-project-ref]`
- `[redacted-database-password]`
- `[redacted-service-role-key]`
- `[redacted-anon-key]`
- `[redacted-jwt-secret]`
- `[redacted-provider-key]`
- `[redacted-stripe-key]`
- `[redacted-signed-url]`
- `[redacted-private-media-url]`
- `[redacted-user-data]`

## Blocking Rule

If any supplied evidence includes secret-like material, signed URLs, raw connection strings, private media URLs, or real row data, mark the intake `blocked` and remove the unsafe file from the tracked evidence path before review continues.

## No-Scope Confirmation

Redaction review does not approve staging SQL, remote SQL, production SQL, Supabase mutation, migration deployment, dashboard changes, provider calls, worker execution, rendering, storage transfer, credit mutation, Stripe, telemetry, human approval, staging execution, production readiness, or beta unlock.
