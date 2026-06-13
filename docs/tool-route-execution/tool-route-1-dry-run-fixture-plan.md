# TOOL-ROUTE-1 Dry-Run Fixture Plan

Readiness state: `ready_with_warnings_for_tool_route_2`

Production capability enabled: `none; tool-route dry-run fixture plan and contract tests only`

TOOL-ROUTE-1 defines offline dry-run fixtures and static contract tests for future scoped tool-route handoffs. It does not invoke route handlers, tools, workers, providers, model runtimes, browser capture, map rendering, media processing, Supabase, SQL, storage transfer, signed URLs, public artifacts, final render/export, beta, or production.

## Source Evidence Read

- PR #366: `[tool-route] TOOL-ROUTE-EXECUTION-UNLOCK-0 repo audit`, state `OPEN`, draft `true`, mergeability `MERGEABLE / CLEAN`, head `codex/rp-tool-route-execution-unlock-0-repo-audit`.
- PR #360 evidence from TOOL-ROUTE-0: owner-study packet merged into `codex/rp-model-orchestration-plan-snapshot-dry-run-validation`.
- PR #363 evidence from TOOL-ROUTE-0: validation packet recorded `ready_with_warnings_to_mark_pr_360_ready_for_review`.
- TOOL-ROUTE-0 audit result: `ready_with_warnings_for_tool_route_1`.
- Required artifact source of truth: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.

## Fixture Families

| Fixture family | Owner refs | Scope | Expected manifest |
| --- | --- | --- | --- |
| `AI_TOOLS_CREATIVE_GRAPHICS` | PR #360 owner study | Static creative graphics route handoff planning only. | `ai-tools-creative-graphics.scoped-tool-call.fixture.json` |
| `TRACK_A_RENDER_EXPORT` | PR #360 owner study | Manifest-only private preview handoff planning; final render/export blocked. | `track-a-render-export.scoped-tool-call.fixture.json` |
| `TRACK_B_MEDIA_PROCESSING` | PR #360 owner study plus Track B route evidence | Metadata-only route planning; media processing blocked. | `track-b-media-processing.scoped-tool-call.fixture.json` |
| `SOUND_MUSIC_AUDIO` | PR #360 owner study | Manifest-only audio/timing handoff planning; audio processing blocked. | `sound-music-audio.scoped-tool-call.fixture.json` |
| `WEB_SEARCH_CAPTURE` | Completed owner study referenced by PR #360 | Manifest-only evidence capture planning; browser capture blocked. | `web-search-capture.scoped-tool-call.fixture.json` |
| `MAP_GEOSPATIAL` | Completed owner study referenced by PR #360 | Manifest-only map/geospatial planning; map rendering blocked. | `map-geospatial.scoped-tool-call.fixture.json` |
| `MULTI_TOOL_PLAN` | All owner-study refs | Cross-workstream placeholder manifest validation only. | `multi-tool-plan.scoped-tool-call.fixture.json` |

## Required Fixture Rules

- `planSnapshotId` must be a placeholder and must never be raw chat text.
- `sourceOwnerStudyRefs`, `capabilityRefs`, `selectedToolRefs`, `routeRefs`, `inputArtifactRefs`, `outputArtifactScopes`, `privateArtifactManifestRefs`, `checksumRequirements`, `QARequirements`, and `observabilityRequirements` must be present.
- `signed URLs are not source of truth`; fixture source-of-truth references remain private artifact manifest placeholders, private GCS path placeholders, Supabase row placeholders, checksum/provenance placeholders, and approved plan snapshot placeholders.
- Each fixture must carry blocked uses for raw prompt execution, route execution, tool execution, worker execution, provider/model runtime, Supabase mutation, storage transfer, signed URLs as source of truth, public artifacts, beta, and production.

## Approval State

Route execution approved: `false`
Tool execution approved: `false`
Worker execution approved: `false`
Provider/model runtime approved: `false`
Supabase mutation approved: `false`
Public artifacts approved: `false`
Signed URLs approved: `false`
Raw prompt execution approved: `false`
Internal beta approved: `false`
External beta approved: `false`
Production approved: `false`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
Milestone sync: `not_performed`

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media processing, or broad service-role handler was enabled.
