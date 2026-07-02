# Project Edit Brief Route Repository Integration

Backend mock route handlers use `MockProjectEditBriefRepository` as the only persistence seam. Handlers normalize route payloads, call repository methods, and wrap results in safe mock envelopes.

Handlers must not mutate `MockDatabase` directly. When no mock database is injected by a smoke or orchestrator, the route layer uses a session-local mock database cache keyed by workspace, project, and user so multi-step route flows can preserve state.

The repository remains mock-only:

- Supabase adapter disabled.
- No production schema or migration.
- No service-role boundary enabled.
- No media/upload/render/planner execution.

Route responses preserve the existing envelope flags and add `data.safety` for the extra storage, file, URL, and media-processing guarantees.
