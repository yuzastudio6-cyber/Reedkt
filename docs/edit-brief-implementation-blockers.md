# Edit Brief Implementation Blockers

Status: audit only. This report lists blockers before any `ProjectEditSession` Edit Brief architecture or runtime work and adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Blockers Before Implementation

| Blocker | Status | Why it blocks |
| --- | --- | --- |
| Owner approval of Brief route/tab | pending owner approval | Adding `/brief` changes the Project Edit Session navigation model. |
| Marker type list approval | pending owner approval | Existing Edit Cue roles overlap with likely Marker types. |
| Marker status list approval | pending owner approval | Statuses affect planner consumption and QA. |
| Marker Chat AI mode approval | pending owner approval | Modes may imply provider/model work if not constrained. |
| Export settings fields approval | pending owner approval | Export settings are session-level, not Brief-only. |
| Metadata-only attachment decision | pending owner approval | Real uploads/storage remain blocked. |
| Marker summary in main Edit Chat | pending owner approval | Need a clear rule for scoped marker messages vs main chat events. |
| Marker overrides Edit Preference/DNA | pending owner approval | Must preserve do-not-copy and safety priority. |
| Missing assets handling | pending owner approval | Existing cue conflict behavior may be reusable. |
| Future Supabase schema timing | pending owner approval | No migration or generated type work should start yet. |

## Production Blockers

- Remote Supabase gates remain blocked.
- Real storage/source-video lifecycle remains blocked.
- Qwen and DeepSeek remain blocked.
- Worker/render/credit systems remain blocked.
- Security/privacy/legal review remains pending.

## Next Step

Recommended next prompt: RP-EDITBRIEF-01 after owner review, focused on architecture/naming or types/contracts only.

## RP-EDITBRIEF-01 Update

Architecture is now documented, but implementation remains blocked by owner approval of the Brief tab/route, Marker vs Edit Cue compatibility, marker types/statuses/priorities, Marker Chat default, attachment kinds, Export Settings fields, main-chat summaries, planner priority, and Supabase schema timing. Do not implement types, repositories, routes, UI, planner wiring, providers, workers, rendering, credits, migrations, staging, commits, or cleanup before RP-EDITBRIEF-02 is explicitly requested.

## RP-EDITBRIEF-02 Update

Types/contracts/mock fixtures are now available for review. Runtime implementation remains blocked: no repository, API handler, route, UI behavior, MockDatabase collection, planner wiring, provider/model call, worker, rendering, upload, credit action, migration, direct Supabase CLI, staging, commit, cleanup, delete, move, or rename is enabled. Owner approval is still required before RP-EDITBRIEF-03.
## RP-EDITBRIEF-03 Blocker Update

Mock repository work is no longer blocked. Production and user-facing work remains blocked on owner review, RP-EDITBRIEF-04 route/client approval, `/brief` UI approval, Supabase schema/RLS/service-role planning, remote DB gates, planner integration policy, media/storage lifecycle, workers/rendering, and credit/runtime gates.

Current repository status: mock repository only, MockDatabase collections added, Supabase skeleton disabled, no API handlers, no UI routes, no runtime behavior, no migration, no direct Supabase CLI, no staging/commit/cleanup.

## RP-EDITBRIEF-04A Blocker Update

RP-EDITBRIEF-04 route/client QA closure is no longer blocked. RP-EDITBRIEF-05 remains blocked until owner review approves UI shell work. Production and user-facing runtime work remains blocked on `/brief` UI approval, Supabase schema/RLS/service-role planning, remote DB gates, planner integration policy, media/storage lifecycle, providers/models, workers/rendering, and credit/runtime gates.

Current closure status: mock/local route/client verification complete, no Edit Brief UI shell, no `/brief` route, no runtime behavior, no migration, no direct Supabase CLI, no staging/commit/cleanup.

## RP-EDITBRIEF-05 Historical Blocker Update

At RP-EDITBRIEF-05, the mock/local Brief UI shell was read-only and marker creation/editing, Marker Chat, attachments, Export Settings editing, QA/conflict checks, and plan-hint bridging were still future milestones. That blocker state has been superseded for mock/local internal use by RP-EDITBRIEF-06 through RP-EDITBRIEF-12. Production ready remains false.

## Current Mock/Local User-Use Status

RP-EDITBRIEF-06 through RP-EDITBRIEF-12 have now superseded the earlier read-only blocker state for internal mock/local use. The `/brief` route supports marker creation/editing, Marker Chat with deterministic local fallback, metadata-only attachments, editable session-level Export Settings, deterministic Marker QA, and mock Brief Plan Hints. These are user-facing mock/local workflows only: no real planner execution, no edit-plan record creation, no media upload, no file-byte read, no external URL fetch, no provider/model call, no worker/render/export/progress job, no credit activity, no Supabase command, and no migration.

Remaining blockers are production-focused: owner approval, production persistence, remote Supabase/auth/RLS/service-role gates, real storage/media lifecycle, live Qwen/DeepSeek/provider runtime beyond gated beta readiness, real planner integration, workers/render/export, credits/billing, monitoring, security/privacy/legal review, staging approval, and production rollout.
