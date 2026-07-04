# Project Edit Brief Production Readiness Gates

## Decision

`project_edit_brief_production_readiness_gates_passed_conditional_gate_policy_ready_for_owner_review`

## Scope

RP-EDITBRIEF-14 converts the Edit Brief launch posture from stale blanket blocking to conditional readiness gates. This milestone does not enable external beta, real-user-media beta, paid production, live Supabase reads/writes, migrations, SQL execution, Supabase CLI, Storage writes, provider/model calls, uploads, media processing, worker dispatch, render/export, or credit reservation/spend.

The important change is that launch states can now become true when explicit evidence is supplied to the readiness evaluator. They remain false by default because the required owner approvals and production evidence are not present in this branch.

## Gate Model

Launch stages:

- `internal_dry_run`
- `bounded_tool_execution`
- `external_beta`
- `real_user_media_beta`
- `paid_production`

Permanent safety invariants remain hard:

- No raw prompts as source truth.
- No secrets or service-role credentials in browser/frontend code.
- No signed URLs as source truth.
- Heavy execution stays backend/worker-only.
- Approved plan snapshot policy and credit estimate/reservation policy are required before expensive work.
- License/model-weight review is required before external beta.
- No silent billing, ledger mutation, Stripe, or wallet mutation without billing persistence approval.

## Current Edit Brief Status

Default status remains blocked beyond internal dry-run because evidence is still missing:

- Owner approval for canonical Edit Brief workflow.
- Production durable-root schema approval for `edit_briefs`, `edit_cues`, cue child tables, application logs, and export settings.
- RLS, explicit Data API grant, Storage policy, service-role, migration, typegen, local and remote Supabase validation.
- Authenticated project/session access policy.
- Durable media/upload/source asset lifecycle.
- Planner integration from Brief hints into approved plan snapshots.
- Credit estimate/reservation integration.
- Worker/provider/render gates and monitoring.

## Evidence-Driven Readiness

The readiness evaluator can allow:

- External beta when dry-run evidence, safety/cost docs, approved snapshot/credit policy, deployment, security, storage/privacy, model/license, checklist, and production-readiness gates pass.
- Real-user-media beta only after external beta plus private media approval and artifact privacy evidence.
- Paid production only after real-user-media beta plus production deployment, billing/ledger persistence, cost controls, incident/runbook, observability, and no hard launch blockers.

## Boundary Confirmations

- No production route was enabled.
- Project Edit Brief mock routes remain `productionReady: false`.
- No Supabase migration or SQL was added.
- No generated database types changed.
- No provider/model call, media processing, worker dispatch, render/export, or credit action was enabled.
- No package-lock, Dockerfile, `.dockerignore`, runtime source, Supabase SQL, media artifact, signed URL, or secret was added.

## Next Milestone

`RP-EDITBRIEF-15 - Owner Review and Production Gate Evidence Collection`
