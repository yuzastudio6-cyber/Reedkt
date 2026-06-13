# Tool Route Service-Role Boundary

Boundary status: `service-role-boundary-audited-execution-blocked`

Existing route helpers can pass runtime service context and privileged clients into server services. Future route unlock work must prove each route handler is narrow, scoped, and auditable before any service-role path is used.

Allowed in this audit:

- Document service-role risk.
- Identify route handlers and services that may receive privileged context.
- Require workspace, project, user, idempotency, and correlation scope for future route payloads.

Blocked:

- Broad service-role route handlers.
- Frontend service-role access.
- Supabase mutation.
- SQL execution.
- Storage transfer.
- Public artifact or signed URL creation.
- Route execution without worker claim/lease.

RLS assumption: future Supabase writes remain blocked until a separate Supabase owner gate proves target schema, RLS, policy, service-role boundary, and milestone sync behavior.

Logging must use redacted summaries and must not include secrets, raw prompts, raw provider responses, private URLs, signed URLs, or arbitrary local paths.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
