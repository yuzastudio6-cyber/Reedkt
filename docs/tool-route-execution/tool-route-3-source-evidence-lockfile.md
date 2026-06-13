# TOOL-ROUTE-3 Source Evidence Lockfile

Lockfile status: `source_evidence_locked_for_tool_route_4_offline_dry_run`

Decision state: `approved_with_warnings_for_tool_route_4`

## Pull Request Evidence

| Evidence ref | State used | Branch / merge evidence | Required by TOOL-ROUTE-4? |
| --- | --- | --- | --- |
| `PR_360_OWNER_STUDY_PACKET_MERGED` | `MERGED` | `0699ae921af3b8980b93221bec094d842d61ddba` | yes |
| `PR_371_SOUND_MUSIC_AUDIO_OWNER_STUDY_MERGED` | `MERGED` | `f6283e63742d6999910d3887482dc3112da1e570` | yes |
| `PR_366_TOOL_ROUTE_0_REPO_AUDIT_OPEN_DRAFT_CONFLICTING` | `OPEN`, draft `true`, `CONFLICTING / DIRTY` | `codex/rp-tool-route-execution-unlock-0-repo-audit` | yes, as warning evidence |
| `PR_368_TOOL_ROUTE_1_FIXTURE_PLAN_OPEN_DRAFT_CLEAN` | `OPEN`, draft `true`, `MERGEABLE / CLEAN` | `codex/rp-tool-route-1-dry-run-fixture-plan-contract-tests` | yes |
| `PR_372_TOOL_ROUTE_1A_SOUND_REFRESH_OPEN_DRAFT_CLEAN` | `OPEN`, draft `true`, `MERGEABLE / CLEAN` | `codex/rp-tool-route-1a-refresh-after-sound-study-merge` | yes |
| `PR_370_TOOL_ROUTE_2_OFFLINE_TESTS_OPEN_DRAFT_CLEAN` | `OPEN`, draft `true`, `MERGEABLE / CLEAN` | `codex/rp-tool-route-2-offline-contract-test-execution` | yes |
| `PR_378_TOOL_ROUTE_2A_CONFLICT_RESOLUTION_OPEN_DRAFT_CLEAN` | `OPEN`, draft `true`, `MERGEABLE / CLEAN` | `codex/rp-tool-route-2a-refresh-conflict-resolution-after-tool-route-1a` | yes |

## Fixture Files

- `docs/tool-route-execution/fixtures/ai-tools-creative-graphics.scoped-tool-call.fixture.json`
- `docs/tool-route-execution/fixtures/track-a-render-export.scoped-tool-call.fixture.json`
- `docs/tool-route-execution/fixtures/track-b-media-processing.scoped-tool-call.fixture.json`
- `docs/tool-route-execution/fixtures/sound-music-audio.scoped-tool-call.fixture.json`
- `docs/tool-route-execution/fixtures/web-search-capture.scoped-tool-call.fixture.json`
- `docs/tool-route-execution/fixtures/map-geospatial.scoped-tool-call.fixture.json`
- `docs/tool-route-execution/fixtures/multi-tool-plan.scoped-tool-call.fixture.json`

## Diagnostic And Validation Evidence

- `scripts/validation/tool-study-pending-owners-0-diagnostics.mjs`
- `scripts/validation/tool-route-execution-unlock-audit-diagnostics.mjs`
- `scripts/validation/tool-route-dry-run-fixtures-diagnostics.mjs`
- `scripts/validation/tool-route-1a-sound-study-refresh-diagnostics.mjs`
- `scripts/validation/tool-route-offline-contract-tests.mjs`
- `scripts/validation/tool-route-offline-contract-test-diagnostics.mjs`
- `scripts/validation/tool-route-2a-refresh-conflict-resolution-diagnostics.mjs`
- `scripts/validation/tool-route-offline-dry-run-approval-diagnostics.mjs`

## Validation Docs

- `docs/prompt-tool-route-1-validation-results.md`
- `docs/prompt-tool-route-1a-validation-results.md`
- `docs/prompt-tool-route-2-validation-results.md`
- `docs/prompt-tool-route-2a-validation-results.md`
- `docs/prompt-tool-route-3-validation-results.md`

## Source-Of-Truth Policy

Signed URLs are not source of truth. Future offline dry-run evidence may reference only committed fixture files, placeholder approved plan snapshot refs, local/offline output placeholders, QA evidence, observability evidence, cleanup evidence, and checksum/provenance placeholders.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
