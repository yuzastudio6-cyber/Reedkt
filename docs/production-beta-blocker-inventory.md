# Production Beta Blocker Inventory

This activation-base blocker inventory was added for Prompt GD-0.

## GD-0 Blockers

- Creative graphics capability manifest is missing.
- GD-1 manifest drafts now exist, but dry-run fixtures have not started.
- Tool-specific input/output/QA contracts are missing for all 12 owned tools.
- GD-1 tool-specific contracts are documentation-only and not runtime validation.
- Cross-track handoff contracts are not accepted.
- Runtime unlock status remains `blocked at repo_audit stage`.
- Track A render/export remains out of scope and blocked for GD.
- Track B media processing remains out of scope and blocked for GD.
- Provider/model calls remain out of scope and blocked.
- Worker execution remains out of scope and blocked.
- Supabase mutation, SQL, storage transfer, signed URLs, and database updates remain out of scope and blocked.
- Production/beta unlock remains blocked.

## Status

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-1 Remaining Blockers

- Dry-run fixture pack is missing.
- Generated local fixtures are missing.
- Staging fixtures are missing.
- Track A handoff dry-run is missing.
- Worker/tool-call runtime remains blocked.
- Tool execution remains blocked.
- Public artifacts and signed URL source-of-truth remain blocked.
