# Project Edit Session Supabase Boundary

Project Edit Session persistence keeps Supabase disabled while the canonical migration chain is unresolved. The active repository path is mock/local only and the disabled Supabase factory adds no API handlers.

## Disabled repository seam

`createSupabaseDisabledProjectEditSessionRepository()` defines the future repository boundary. Every operation returns a blocked result and reports:

- no Supabase reads or writes;
- no storage reads or writes;
- no provider or model calls;
- no workers or render jobs;
- no credit reservation or spend.

## Future schema dependency

Durable persistence requires an owner-approved schema for Project Edit Sessions, messages, sources, memory, snapshots, versions, previews, revisions, and events. No migration is created or executed by this boundary.

## Security boundary

Future Supabase work must include authenticated routes, RLS, two-tenant isolation tests, service-role ownership, explicit grants, clean-reset evidence, and remote deployment gates. The current seam does not run Supabase CLI commands, inspect secrets, or claim live persistence.

This is a mock repository boundary only. It is not production or staging readiness evidence.
