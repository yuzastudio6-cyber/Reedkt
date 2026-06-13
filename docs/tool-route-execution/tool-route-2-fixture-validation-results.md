# TOOL-ROUTE-2 Fixture Validation Results

Fixture validation result: `tool_route_offline_contract_tests_passed_with_warnings`

Command: `npm run --silent tool-route:offline-contract-tests`

| Fixture file | Owner study refs present? | Plan snapshot placeholder present? | Capability refs present? | Selected tool refs or mix present? | Route refs present? | Artifact scopes present? | QA requirements present? | Observability requirements present? | Required booleans false? | Blocked uses present? | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ai-tools-creative-graphics.scoped-tool-call.fixture.json` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | passed |
| `track-a-render-export.scoped-tool-call.fixture.json` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | passed |
| `track-b-media-processing.scoped-tool-call.fixture.json` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | passed |
| `sound-music-audio.scoped-tool-call.fixture.json` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | passed |
| `web-search-capture.scoped-tool-call.fixture.json` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | passed |
| `map-geospatial.scoped-tool-call.fixture.json` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | passed |
| `multi-tool-plan.scoped-tool-call.fixture.json` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | passed |

## Warnings

- PR #366 remains draft/open, so this packet stays stacked and draft.
- PR #368 remains draft/open, so TOOL-ROUTE-2 is evidence for the stack, not merged source-of-truth.
- Fixture `routeRefs` are placeholders and source paths, not route invocations.
- Fixture `selectedToolRefs` are approved-study candidates and placeholders, not tool execution.

## Result

All seven fixtures pass offline/static validation. The overall decision remains `tool_route_offline_contract_tests_passed_with_warnings` because upstream PRs #366 and #368 are draft/open and no live execution gate is approved.

## TOOL-ROUTE-2A Post-Refresh Note

TOOL-ROUTE-2A merges the TOOL-ROUTE-1A Sound/Music fixture refresh into this offline contract-test packet. The Sound/Music fixture and multi-tool fixture now reference PR #371 merged evidence at `f6283e63742d6999910d3887482dc3112da1e570`, include `SOUND_MUSIC_AUDIO.timing_aware_sound_cue_manifest`, and retain the blocked audio/media runtime uses added by TOOL-ROUTE-1A.

Post-refresh combined state: `tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh`

routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
workerExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`
