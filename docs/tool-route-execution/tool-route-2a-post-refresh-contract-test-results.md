# TOOL-ROUTE-2A Post-Refresh Contract Test Results

Post-refresh decision state: `tool_route_2a_conflict_resolved_contract_tests_passed_with_warnings`

Combined route state: `tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh`

## Fixture Refresh Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Sound/Music fixture references PR #371 merge SHA | `passed` | `PR_371_merge_sha_f6283e63742d6999910d3887482dc3112da1e570` |
| Multi-tool fixture references PR #371 merge SHA | `passed` | `PR_371_merge_sha_f6283e63742d6999910d3887482dc3112da1e570` |
| Sound/Music fixture rejects stale PR #360 Sound owner-study ref | `passed` | `PR_360_SOUND_MUSIC_AUDIO_owner_study` absent from Sound and multi-tool fixture JSON |
| Sound/Music timing-aware capability present | `passed` | `SOUND_MUSIC_AUDIO.timing_aware_sound_cue_manifest` |
| Blocked audio/runtime uses present | `passed` | audio/media processing, audio generation, SFX/music generation, FFmpeg/FFprobe, DeepFilterNet, Demucs, and provider audio generation remain blocked |

## Offline Contract Test Result

Offline contract tests remain static and fixture-only. The post-refresh result is `tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh` after running:

- `npm run --silent tool-route:offline-contract-tests`
- `npm run --silent tool-route:offline-contract-test:diagnostics`
- `npm run --silent tool-route:1a-sound-refresh:diagnostics`
- `npm run --silent tool-route:2a-refresh-conflict:diagnostics`

All four commands passed locally. TOOL-ROUTE-1 dry-run fixture diagnostics and TOOL-ROUTE-0 repo-audit diagnostics also passed.

## Warnings

- PR #370 remains draft/open and is not modified directly.
- PR #372 remains draft/open and is consumed as stacked source evidence.
- TOOL-ROUTE-2A creates conflict-resolution evidence only; it does not approve TOOL-ROUTE-3 execution.

## Approval Booleans

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

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, route handler import, tool runtime import, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, Demucs execution, or broad service-role handler was enabled.
