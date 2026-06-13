# WORKER-9 Source Evidence Lockfile

lockfileState: `source_evidence_locked_for_worker_10_approval`

## Required Source Reads

- WORKER-0: worker runtime repo audit source context.
- WORKER-1: worker runtime contract hardening source context.
- WORKER-2: `worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings`.
- WORKER-3: `approved_with_warnings_for_worker_4`.
- WORKER-4: `worker_runtime_offline_dry_run_passed_with_warnings`.
- WORKER-5: `worker_runtime_offline_dry_run_qa_passed_with_warnings`.
- WORKER-6: `approved_with_warnings_for_worker_7`.
- WORKER-7: `worker_runtime_controlled_noop_passed_with_warnings`.
- WORKER-8: `worker_runtime_controlled_noop_qa_passed_with_warnings` and `ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan`.
- TOOL-ROUTE-0: repo audit source context.
- TOOL-ROUTE-1: dry-run fixture plan source context.
- TOOL-ROUTE-1A: Sound/Music refresh source context.
- TOOL-ROUTE-2: offline contract test source context.
- TOOL-ROUTE-2A: refresh conflict resolution source context.
- TOOL-ROUTE-3: offline dry-run approval source context.
- TOOL-ROUTE-4: offline dry-run execution source context.
- TOOL-ROUTE-5: offline dry-run QA and worker gate readiness source context.
- PR #360: owner studies accepted/merged source evidence.
- PR #371: SOUND_MUSIC_AUDIO owner study merged source evidence.
- PR #410: WORKER-8 source PR, draft/open/mergeable clean at `b572088e7e30e20021c361bc8de238b5de144f71`.
- PLAN-SNAPSHOT: approved snapshot contract source context.
- MODEL-DRYRUN-2A: provider dry-run passed source context for model-planning boundaries only.
- Worker fixtures: `docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json`.
- Diagnostics: `worker:runtime-controlled-noop:qa-review:diagnostics`, `worker:runtime-controlled-noop:diagnostics`, `worker:runtime-controlled-noop-approval:diagnostics`, `worker:runtime-offline-dry-run:qa-review:diagnostics`, `worker:runtime-offline-dry-run:diagnostics`, `worker:runtime-offline-dry-run-approval:diagnostics`, `worker:runtime-dry-run-fixtures:contract-tests`, `worker:runtime-dry-run-fixtures:diagnostics`, and inherited TOOL-ROUTE diagnostics through TOOL-ROUTE-5.
- Trackers: `docs/beta-readiness-scorecard.md`, `docs/production-beta-blocker-inventory.md`, and `docs/production-beta-readiness-scorecard.md`.

## WORKER-2 Requested Filename Base Gaps

The WORKER-2 source branch uses the committed filenames present in this stack, including `worker-2-dry-run-fixture-plan.md`, `worker-2-fixture-contract-test-report.md`, `worker-2-readiness-decision.md`, `worker-2-tool-route-handoff-mapping.md`, `worker-2-warning-blocker-register.md`, `worker-3-allowed-blocked-scope.md`, `fixtures/worker-route-dry-run-fixtures.json`, and `docs/prompt-worker-2-validation-results.md`.

Any prompt-requested WORKER-2 filenames not present on the inherited branch are recorded as base gaps, not fabricated replacements.

## Locked Fixture Rows

- `worker_route_ai_tools_creative_graphics`
- `worker_route_track_a_render_export`
- `worker_route_track_b_media_processing`
- `worker_route_sound_music_audio`
- `worker_route_web_search_capture`
- `worker_route_map_geospatial`
- `worker_route_multi_tool_plan`

The fixture rows remain placeholder-only and keep live worker execution, real job claim, worker lease mutation, queue execution, route/tool/provider runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, beta, and production blocked.
