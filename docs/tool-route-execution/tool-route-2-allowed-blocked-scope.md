# TOOL-ROUTE-2 Allowed And Blocked Scope

Recommended next prompt: `TOOL-ROUTE-2 - Offline Tool Route Contract Test Execution`

Allowed future TOOL-ROUTE-2 work:

- Execute offline/static contract tests against TOOL-ROUTE-1 fixtures.
- Validate scoped tool-call manifest shape, blocked-use policy, false approval booleans, source-of-truth placeholders, and private artifact placeholder coverage.
- Validate route payload examples without invoking live route handlers.
- Produce committed sanitized test evidence and diagnostics.

Blocked in TOOL-ROUTE-2 unless a later prompt explicitly changes scope:

- Real route execution.
- Real tool execution.
- Real worker execution.
- Provider/model calls.
- Browser capture.
- Map rendering.
- Media processing.
- Audio processing.
- Remotion render/export.
- Final render/export.
- Supabase mutation.
- SQL.
- GCS upload or storage transfer.
- Signed URL creation.
- Public artifact creation.
- Dependency mutation.
- Internal beta, external beta, paid production, or production unlock.

Required before any later execution prompt:

- Owner acceptance of the fixture contract.
- Offline contract test pass.
- Worker claim/lease owner gate.
- Route service-role hardening gate.
- Private artifact upload/storage gate.
- QA/observability/cleanup evidence gate.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
