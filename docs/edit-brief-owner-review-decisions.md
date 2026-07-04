# Edit Brief Owner Review Decisions

Status: architecture/docs only. Owner decisions pending for future `ProjectEditSession` Brief work. This report adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Pending Decisions

| Decision | Architecture default | Status |
| --- | --- | --- |
| Brief tab label | Edit Brief or Brief | pending owner approval |
| Route approval | `/projects/:projectId/edits/:editSessionId/brief` | pending owner approval |
| Marker drawer vs popup | Drawer recommended | pending owner approval |
| Marker AI default | `confirm_only` | pending owner approval |
| Marker type list | Starter set in marker model doc | pending owner approval |
| Marker status list | Starter set in marker model doc | pending owner approval |
| Priority list | `must_follow`, `should_follow`, `optional`, `avoid` | pending owner approval |
| Attachment kinds | Starter metadata-only set | pending owner approval |
| Metadata-only attachment behavior | Required first phase | pending owner approval |
| Export setting fields | Starter session-level set | pending owner approval |
| Main chat marker summaries | Summary events only | pending owner approval |
| Planner priority order | Safety, markers, chat, DNA, Auto, default style | pending owner approval |
| Supabase schema timing | Future only | pending owner approval |

No approval is fabricated by RP-EDITBRIEF-01.

## RP-EDITBRIEF-02 Owner Review Addendum

RP-EDITBRIEF-02 adds provisional `ProjectEditBrief*` types, fixtures, contracts, scenarios, and mappers for owner review. Approval remains pending for Marker UI behavior, Marker Chat default, attachment persistence, Export Settings production policy, planner precedence, and the RP-EDITBRIEF-03 repository shape. No repository, route, UI, migration, direct Supabase CLI, staging, commit, cleanup, delete, move, or rename is included.
## RP-EDITBRIEF-03 Owner Review Status

The mock repository layer is implemented, but owner approval remains pending. Review decisions still needed: repository shape, future route/client scope for RP-EDITBRIEF-04, Supabase table naming, marker deletion/archive behavior, export settings ownership, and whether the API layer should expose all repository operations or a narrower UI-safe subset.

No API handlers, no UI routes, no runtime behavior, no migration, no direct Supabase CLI, no staging, no commit, and no cleanup occurred.

## RP-EDITBRIEF-04A Owner Review Status

Route/client QA closure is complete, but owner approval remains pending before RP-EDITBRIEF-05. Review decisions still needed: whether to start the `/brief` UI shell, route/tab naming, marker drawer scope, Marker Chat scope, export settings visibility, and whether any UI work should remain mock/local only.

No Edit Brief UI shell, no `/brief` route, no runtime behavior, no migration, no direct Supabase CLI, no staging, no commit, and no cleanup occurred.

## RP-EDITBRIEF-06 Owner Review Status

Marker creation and marker drawer editing are implemented in mock/local mode, but owner approval remains pending before RP-EDITBRIEF-07. Review decisions still needed: Marker Chat default visibility, marker-scoped message retention, structured intent capture rules, whether marker summary events should appear in the main Edit Chat, and when confirmed markers may later feed planner inputs.

No Marker Chat, no attachment upload, no export editing, no QA/conflict detection, no planner application, no migration, no direct Supabase CLI, no staging, no commit, and no cleanup occurred.
## RP-EDITBRIEF-07 Owner Review

Marker Chat + Intent Capture is implemented as mock/local marker-scoped UI and deterministic metadata only. Owner decisions remain pending for attachment behavior, whether marker summaries should later appear in main Edit Chat, when confirmed marker intent may feed planner inputs, production persistence, and any real AI/provider/runtime use. No approval, migration, direct Supabase CLI, staging, commit, or cleanup is included.

## RP-EDITBRIEF-08 Owner Review

Marker Attachments are implemented as mock/local metadata-only UI and client adapter work. Owner decisions remain pending for real upload/storage behavior, media asset linking, URL reference policy, sound runtime boundaries, whether metadata attachments may later satisfy planner asset requirements, and production persistence. No approval, migration, direct Supabase CLI, staging, commit, cleanup, media processing, provider/model call, render, or credit action is included.

## RP-EDITBRIEF-10 Owner Review

Marker QA + Conflict Detection is implemented as mock/local deterministic metadata only. Owner decisions remain pending for whether QA-passed markers may feed edit plans, how unresolved warnings block planning, whether conflict severities need policy review, and when production persistence or planner application may begin. No approval, Qwen, DeepSeek, provider/model call, worker, sound runtime, render/export/progress, media processing, Supabase command/migration, staging, commit, cleanup, or planner application is included.
## RP-EDITBRIEF-11 Owner Review

Mock Plan Hints are implemented as local metadata only. Owner decisions remain pending for when confirmed marker hints may feed a real planner, whether marker status should ever move to `applied_to_plan`, how plan hints should be persisted in production, and what approval gate is required before real edit-plan creation. RP-EDITBRIEF-11 grants no approval for production planner execution, Supabase, workers, render/export, credits, Qwen, DeepSeek, or provider runtime.

## RP-EDITBRIEF-12 Owner Review

Internal testing coverage is complete for the mock/local Edit Brief path, but owner decisions remain pending for any production persistence, planner execution, edit-plan creation, media storage/upload lifecycle, provider/model runtime, worker/render/export/credit gates, Supabase migration, staging, or production enablement. RP-EDITBRIEF-12 does not approve production behavior.
