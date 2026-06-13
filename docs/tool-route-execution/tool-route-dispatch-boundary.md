# Tool Route Dispatch Boundary

Dispatch boundary status: `execution_blocked_pending_tool_route_1`

Tool routes must not execute unless all of the following future gates pass:

- Approved plan snapshot is present and verified.
- Scoped tool-call manifest is present.
- Worker claim/lease path is used.
- Tool owner study evidence is accepted.
- Tool readiness evidence matches the selected tool.
- Artifact scope is private and bounded.
- Idempotency and correlation identifiers are present.
- QA, observability, failure, and cleanup evidence hooks are present.

Blocked dispatch behavior:

- Routes must not choose tools directly by hardcoded keyword.
- Routes must not execute raw chat or raw prompt payloads.
- Routes must not call providers as fallback.
- Routes must not bypass worker claim/lease.
- Routes must not mutate Supabase unless a separate Supabase owner gate approves it.
- Routes must not create public artifacts or signed URLs.
- Routes must not run media processing, browser capture, map rendering, final render/export, or audio processing in this audit.

Route execution approved: `false`
Tool execution approved: `false`
Provider runtime approved: `false`
