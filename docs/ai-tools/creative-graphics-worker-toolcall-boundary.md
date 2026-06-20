# Creative Graphics Worker Tool-Call Boundary

Status: `manifest_draft`

## Required Runtime Path

Future creative graphics runtime must follow this path:

`user/chat request -> structured agent findings -> edit intents -> approved plan snapshot -> scoped tool-call manifest -> worker execution after unlock gates`

## Blocked In GD-1

- Raw prompt worker execution.
- Direct user prompt to worker/tool execution.
- Tool runtime execution.
- Worker execution.
- Provider fallback without approval.
- Model calls.
- Render/export.
- Public artifacts.
- Signed URL source-of-truth.
- Supabase mutation or SQL.
- Runtime unlock beyond manifest draft.

Dry-run does not equal execution approval. Manifest validation does not grant worker authority.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
