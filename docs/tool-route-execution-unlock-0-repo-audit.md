# TOOL-ROUTE-EXECUTION-UNLOCK-0 Repo Audit

Decision: `tool_route_repo_audit_passed_with_warnings_ready_for_dry_run_plan`

This packet audits tool-route execution unlock readiness after PR #360 merged the pending owner tool studies. It is metadata only. It does not execute tools, routes, workers, providers, media, browser capture, map rendering, Docker, Cloud Run, Supabase, SQL, storage, signed URLs, public artifacts, credits, beta, production, or raw prompts.

## Source Verification

- PR #360 is merged into `codex/rp-model-orchestration-plan-snapshot-dry-run-validation` at `0699ae921af3b8980b93221bec094d842d61ddba`.
- The four pending owner studies are present: `AI_TOOLS_CREATIVE_GRAPHICS`, `TRACK_A_RENDER_EXPORT`, `TRACK_B_MEDIA_PROCESSING`, and `SOUND_MUSIC_AUDIO`.
- Prior completed `WEB_SEARCH_CAPTURE` and `MAP_GEOSPATIAL` evidence is referenced only and not duplicated.
- Existing Track B route manifest metadata is present, but it does not allow route execution.
- Worker, provider, Supabase, observability/cost, billing, and artifact policy handoffs remain separate owner gates.

## Audit Result

The repo has enough source-of-truth evidence to move to a dry-run planning packet. It does not have enough evidence to claim tool execution, route execution, worker execution, Supabase persistence, provider runtime, public artifact delivery, signed URL delivery, internal beta, external beta, paid production, production, or `generated_local_fixture_passed`.

Warnings are expected:

- General cross-owner tool-route dry-run request and result contracts are not hardened yet.
- Capability scoring across all owner lanes needs a dry-run plan.
- Worker and Supabase owner handoffs remain blocked before any persisted or executable route state.
- Fresh-worktree dependency-backed checks that require local `node_modules` were blocked without install or package-lock mutation.
- Older model plan-snapshot smoke/report commands still expose historical blocked packet state, while the current summary commands and merged worker chain show reconciled pass evidence.

## Validation

Passed:

- `npm run tool-route-execution-unlock-0:diagnostics`
- `npm run tool-route-execution-unlock-0:report`
- `npm run tool-route-execution-unlock-0:summary`
- `npm run tool-study-pending-owners-0:diagnostics`
- Track B route-manifest smoke/summary
- Worker local fixture, fixture hardening, dry-run contract review, no-op dry-run, dry-run approval, and repo-audit metadata checks
- Product internal testing metadata checks
- Supabase Track B clean staging backfill smoke/report/summary as historical metadata only
- Production readiness summary and beta readiness summary with inherited production/external beta blockers still closed
- `git diff --check`, `git diff --cached --check`, and changed-file safety scans

Warnings:

- `smoke:activation-model-orchestration-plan-snapshot-contract` failed the historical pass-state assertion even though `activation:model-orchestration-plan-snapshot-contract:summary` reports pass.
- `smoke:activation-model-orchestration-plan-snapshot-dry-run` failed the historical pass-state assertion even though `activation:model-orchestration-plan-snapshot-dry-run:summary` reports pass.
- `activation:model-orchestration-plan-snapshot-contract:report` and `activation:model-orchestration-plan-snapshot-dry-run:report` emitted older blocked packet state.
- `npm run lint`, `npm run typecheck:server`, `tsc -b`, `npm run build`, and `npm run build:server` were blocked by missing local `node_modules` in this fresh worktree. No `npm install`, no `npm ci`, no dependency mutation, and no package-lock change occurred.

## Runtime Gates

All runtime gates remain closed:

- Tool execution: blocked
- Route execution: blocked
- Worker execution and job dispatch/claim/lease: blocked
- Provider/model calls and secret access: blocked
- Supabase writes, SQL, migrations, storage: blocked
- Media, browser capture, map rendering, Track A runtime, Track B media execution, Demucs runtime: blocked
- Public artifacts and signed URLs: blocked
- Credits, Stripe, beta, paid production, production: blocked

Correct future source-of-truth remains: Supabase row reference, private GCS path reference, manifest reference, checksum reference, and approved plan snapshot.

## Next Prompt

`TOOL-ROUTE-EXECUTION-UNLOCK-1: tool-route execution dry-run plan, no execution`
