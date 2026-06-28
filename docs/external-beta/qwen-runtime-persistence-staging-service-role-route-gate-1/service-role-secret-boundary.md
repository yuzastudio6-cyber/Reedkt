# Service-Role Secret Boundary

Packet: `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1`

Service-role secret payload access in this phase: `none`

Frontend service-role exposure: `forbidden`

Secret Manager payload access: `none`

## Future Boundary

A future confirmed route-gate packet may reference a service-role secret source by name only. It must not print, store, commit, echo, summarize, or persist the service-role payload. It must not pass service-role credentials to frontend code.

Allowed future secret reference class: `secret_name_only`

Forbidden future evidence classes:

- raw service-role key;
- Supabase database URL;
- Supabase API URL plus service-role key;
- bearer tokens;
- access tokens;
- identity tokens;
- signed URLs;
- provider API keys.

The current packet records planning only and does not access secret payloads.
