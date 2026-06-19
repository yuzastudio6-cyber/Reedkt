# Implementation Prompt: AI Graphics Owner Assignment Registry

Implement the docs/diagnostics-only owner registry lane from `origin/codex/rp-open-source-tool-stack-refresh-after-ai-graphics-worker-qa-review`.

Register `Atlas — AI Graphics & Worker Metadata Owner` with owner id `atlas_ai_graphics_worker_owner`, owner lane `AI_TOOLS_CREATIVE_GRAPHICS`, status `pending_duplicate_review`, and coordination lanes `TOOL_ROUTE_EXECUTION`, `WORKER_RUNTIME_JOBS`, and `OPEN_SOURCE_TOOL_STACK_AUDIT`.

Create the ownership docs and JSON under `docs/open-source-tool-stack/ownership/`, update existing cross-chat/status trackers, add `scripts/validation/ai-graphics-owner-assignment-registry-diagnostics.mjs`, and add package script `ai-graphics:owner-assignment:diagnostics`.

Do not install dependencies, mutate `package-lock.json`, execute tools/workers/routes/providers, mutate Supabase/SQL/GCS, create signed URLs/public artifacts, run browser/WebGL/canvas/Remotion/resvg/media runtime, unlock beta/production, merge PRs, close PRs, or mark drafts ready.

Implementation PR: #543, https://github.com/yuzastudio6-cyber/Reedkt/pull/543

PR status at creation: open / draft / mergeable, empty check rollup.

Track B conflict sync update: preserve PR #543 and add decision `ai_graphics_owner_assignment_trackb_conflict_sync_passed_with_warnings`. Track B tools are owned by `TRACK_B_MEDIA_OSS_STEWARD`, not Atlas. PR #544 is Track A context only; Atlas does not claim Track A visual/render/export ownership.
