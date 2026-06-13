# Prompt WORKER-3 - Offline Worker Dry-Run Approval Packet

## Prompt Summary

Create WORKER-3 from `origin/codex/rp-worker-2-worker-runtime-dry-run-fixture-plan-contract-tests`, branch `codex/rp-worker-3-offline-dry-run-approval-packet`, and open draft PR `[worker] WORKER-3 offline dry-run approval packet`.

This is an approval packet only. It must not run workers, claim jobs, mutate worker leases, run queues, execute routes/tools/providers, import route handlers, import tool runtimes, import worker runtimes, process media/audio, mutate Supabase, upload to GCS, create signed URLs/public artifacts, or unlock beta/production.

## Implementation Notes

- Base evidence: WORKER-2 `worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings`.
- Worker readiness: `ready_with_warnings_for_worker_3_offline_dry_run_approval_packet`.
- Approval packet result: `approved_with_warnings_for_worker_4`.
- Future approval: `futureOfflineWorkerDryRunApproved: true` for WORKER-4 only.
- Contract fixture source: `docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json`.
- Diagnostic uses Node built-ins only.
- Draft PR: https://github.com/yuzastudio6-cyber/Reedkt/pull/395
- GitHub status at PR creation: `draft/open/mergeable_clean; check rollup empty`

## Supabase And Scope

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
Supabase milestone sync: `not_performed`

Production capability enabled: `none; worker runtime offline dry-run approval packet only`

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, job claim, worker lease mutation, queue execution, route execution, route handler import, tool runtime import, worker runtime import, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, Demucs execution, or broad service-role handler was enabled.
