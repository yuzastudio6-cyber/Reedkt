# Beta Readiness Scorecard

Session 0 owned metadata scorecard.

Restricted internal testing session 0: `restricted_internal_testing_session_0_passed`.
External beta allowed: `false`.
Paid production allowed: `false`.
Production allowed: `false`.

This scorecard does not unlock external beta, paid production, public artifacts, runtime execution, or Supabase writes.

Model orchestration Qwen/DeepSeek status: repo audit passed for future dry-run approval only. Provider calls, runtime execution, public artifacts, signed URLs, raw prompt execution, Supabase writes, external beta, paid production, and production remain blocked.

Model orchestration plan snapshot contract status: plan_snapshot_contract_passed_ready_for_dry_run_validation. Contract generation is metadata-only; provider calls, runtime execution, Supabase writes, external beta, paid production, and production remain blocked.

Model orchestration plan snapshot dry-run validation status: plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit. Validation is synthetic metadata-only; provider calls, runtime execution, Supabase writes, public artifacts, signed URLs, external beta, paid production, and production remain blocked.

Worker runtime repo audit status: repo_audit_passed_ready_for_worker_dry_run_approval. Audit is metadata-only; worker/tool/route/provider execution, Supabase writes, Docker, Cloud Run, public artifacts, signed URLs, external beta, paid production, and production remain blocked.

Worker runtime dry-run approval status: approved_for_future_worker_noop_dry_run_execution. Approval is metadata-only; worker/tool/route/provider execution, Docker, Cloud Run, Cloud Build, Supabase writes, media processing, public artifacts, signed URLs, external beta, paid production, and production remain blocked.

TOOL-ROUTE-EXECUTION-UNLOCK-0 status: ready_with_warnings_for_tool_route_1. The repo audit is docs-only and uses merged PR #360 owner-study evidence; route execution, tool execution, worker execution, provider/model runtime, Supabase mutation, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

TOOL-ROUTE-1 status: ready_with_warnings_for_tool_route_2. The dry-run fixture plan and contract tests are static/offline docs and JSON fixtures only; route execution, tool execution, worker execution, provider/model runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

TOOL-ROUTE-2 status: tool_route_offline_contract_tests_passed_with_warnings. Offline contract tests validate the seven TOOL-ROUTE-1 fixtures without route handler imports, tool runtime imports, route execution, tool execution, worker execution, provider/model runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, or production.

TOOL-ROUTE-1A status: sound_music_audio_refs_refreshed_after_pr_371. The Sound/Music fixture refs now point to merged PR #371 evidence at f6283e63742d6999910d3887482dc3112da1e570; route execution, tool execution, worker execution, provider/model runtime, audio/media processing, audio/SFX/music generation, FFmpeg/FFprobe, DeepFilterNet, Demucs, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

TOOL-ROUTE-2A status: tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh. The conflict resolution preserves TOOL-ROUTE-1A Sound/Music fixture refresh evidence and TOOL-ROUTE-2 offline contract-test evidence; route execution, tool execution, worker execution, provider/model runtime, audio/media processing, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

TOOL-ROUTE-3 status: approved_with_warnings_for_tool_route_4. The approval packet allows a future offline dry-run prompt only; live route execution, tool execution, worker execution, provider/model runtime, media/audio processing, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

TOOL-ROUTE-4 status: tool_route_offline_dry_run_passed_with_warnings. The offline dry-run validates all seven committed scoped tool-call fixtures and writes ignored local evidence only under `.local-artifacts/tool-route/tool-route-4/tool-route-4-local-static/`; live route execution, tool execution, worker execution, provider/model runtime, media/audio processing, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

TOOL-ROUTE-5 status: tool_route_offline_dry_run_qa_passed_with_warnings. The QA review accepts TOOL-ROUTE-4 committed evidence with warnings and records `ready_with_warnings_for_worker_route_fixture_integration_plan`; live route execution, tool execution, worker execution, provider/model runtime, media/audio processing, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

WORKER-2 status: worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings. The worker dry-run fixture plan maps TOOL-ROUTE-5 accepted fixture evidence into committed worker route fixture contracts and records `ready_with_warnings_for_worker_3_offline_dry_run_approval_packet`; worker execution, worker job claims, worker lease mutation, route execution, tool execution, provider/model runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

WORKER-3 status: approved_with_warnings_for_worker_4. The approval packet allows only a future offline WORKER-4 dry-run prompt over committed fixture contracts; live worker execution, job claims, worker lease mutation, queue execution, route/tool/provider execution, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

WORKER-4 status: worker_runtime_offline_dry_run_passed_with_warnings. The offline worker dry-run validates all seven committed worker route fixture rows and writes ignored local evidence only under `.local-artifacts/worker-runtime/worker-4/worker-4-local-static/`; live worker execution, job claims, worker lease mutation, queue execution, route/tool/provider execution, media/audio runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

WORKER-5 status: worker_runtime_offline_dry_run_qa_passed_with_warnings. The QA review accepts all seven WORKER-4 committed evidence rows with warnings and records `ready_with_warnings_for_controlled_noop_worker_gate_plan`; live worker execution, job claims, worker lease mutation, queue execution, route/tool/provider execution, media/audio runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

WORKER-6 status: approved_with_warnings_for_worker_7. The approval packet sets `futureControlledNoopWorkerExecutionApproved: true` for a future WORKER-7 controlled no-op gate only; live worker execution, job claims, worker lease mutation, queue execution, route/tool/provider execution, media/audio runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

WORKER-7 status: worker_runtime_controlled_noop_passed_with_warnings. The controlled no-op gate validates all seven committed worker route fixture rows, run id `worker-7-local-noop`, and writes ignored local evidence only under `.local-artifacts/worker-runtime/worker-7/worker-7-local-noop/`; live worker execution, real job claims, worker lease mutation, queue execution, route/tool/provider execution, media/audio runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.

WORKER-8 status: worker_runtime_controlled_noop_qa_passed_with_warnings. The QA review accepts all seven WORKER-7 committed evidence rows with warnings and records `ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan`; it does not rerun the controlled no-op gate. Live worker execution, real job claims, worker lease mutation, queue execution, route/tool/provider execution, media/audio runtime, Supabase mutation, storage transfer, signed URLs, public artifacts, internal beta, external beta, paid production, and production remain blocked.
