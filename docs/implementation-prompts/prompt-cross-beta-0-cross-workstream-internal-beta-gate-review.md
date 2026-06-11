# Prompt CROSS-BETA-0 Cross-Workstream Internal Beta Gate Review

Prompt: `CROSS-BETA-0`

Branch: `codex/rp-cross-beta-0-cross-workstream-internal-beta-gate-review`

Base: `origin/codex/rp-tracka-gd-handoff-7-controlled-private-sample-qa-internal-beta-readiness`

PR: pending

Production capability enabled: `none; cross-workstream internal beta gate review packet only`

## Intent

Create a cross-workstream internal beta gate review packet from the Handoff-7 base. The packet records a blocked decision, not an approval, because Track A creative graphics is ready with warnings for one accepted lane while several required workstreams remain blocked or missing owner-gate evidence.

## Required Outputs

- `docs/internal-beta/cross-workstream-internal-beta-gate-review.md`
- `docs/internal-beta/cross-workstream-readiness-matrix.md`
- `docs/internal-beta/accepted-lane-evidence-register.md`
- `docs/internal-beta/internal-beta-blocker-register.md`
- `docs/internal-beta/internal-beta-no-go-scope-register.md`
- `docs/internal-beta/internal-beta-next-prompt-queue.md`
- `docs/internal-beta/internal-beta-gate-decision-record.md`
- `docs/prompt-cross-beta-0-validation-results.md`
- `scripts/validation/cross-beta-internal-gate-diagnostics.mjs`

## Decision

Decision state: `blocked_pending_workstream_gates`

Full internal beta approved now: false
External beta approved: false
Production approved: false
Public artifacts approved: false
Signed URLs approved: false
Raw prompt execution approved: false
Supabase mutation approved: false
Worker execution approved: false
Provider/model calls approved: false
Final render/export approved: false

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## Validation

Local validation:

- `git diff --check`: passed.
- `git diff --check origin/codex/rp-tracka-gd-handoff-7-controlled-private-sample-qa-internal-beta-readiness...HEAD`: passed.
- `npm ci`: passed; npm reported five moderate audit findings and no dependency mutation was made.
- `npm run lint`: passed.
- `npm run typecheck:server`: passed.
- `npm run foundation:validate`: passed.
- `npm run --silent cross-beta:internal-gate:diagnostics`: passed.
- Existing Track A/GD diagnostics through Handoff-7/Handoff-6: passed through `npm run foundation:validate`.
- `npm run build`: local `environment_blocked` by Darwin Rolldown native binding/code-signature failure.
- `npm run build:server`: local `environment_blocked` by Darwin Rolldown native binding/code-signature failure.
- `npm run foundation:validate:with-build`: passed with `build` and `build:server` classified as `environment_blocked`.

GitHub Foundation Validation: pending.

## No-Scope Statement

No runtime, tools, workers, providers/models, render/export, media processing, browser capture, Docker/Cloud Run, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, uploads, signed URL creation, public artifact creation, dependency mutation, internal beta unlock, external beta unlock, production unlock, human approval grant, staging execution approval, raw prompt execution, or broad service-role handler was enabled.

Recommended next prompt: `GD-9 - Group B Package Runtime Review and Fixture Gate`
