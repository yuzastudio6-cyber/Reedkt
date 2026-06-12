# Prompt MERGE-HYGIENE-2 Validation Results

Status: `local_validation_passed`

## Scope

- Prompt: `MERGE-HYGIENE-2 Downstream Branch Rebase/Retarget Plan`
- Branch: `codex/rp-merge-hygiene-2-downstream-branch-rebase-retarget-plan`
- Base: `origin/codex/rp-merge-hygiene-1a-owner-approved-parent-first-merge-execution`
- Capability enabled: `none; downstream branch rebase/retarget plan only`
- Queue status: `queue_created_not_executed`

## Source-Of-Truth Read Status

- MERGE-HYGIENE-1A docs read: `yes`
- Live GitHub PR state read: `yes`
- Open PRs inspected by live list: `140`
- Foundation validation runner present: `no`

## Downstream Findings

- PRs inspected directly: #331, #334, #340, #343, #347, #349, #350, #352, #353, #354, #355, #356, #348, #345, #344, #339, #338, #337, #336, #335, #333, #332, #330, #328, #327, #325, #324, #322, #320.
- PRs needing rebase: #333.
- PRs needing retarget: none in this snapshot.
- PRs needing both: none in this snapshot.
- PRs safe to mark ready later after owner review: #354, #356.
- PRs that should remain draft: #352, #355, #348, #345, #344, #339, #338, #336, #335, #333, #332.
- Duplicate/superseded candidates: #349, #350, #337, #327, #325, #324, #322, #320, #330.

## Deliverables

- `docs/github-merge-hygiene/merge-hygiene-2-live-downstream-pr-state.md`
- `docs/github-merge-hygiene/merge-hygiene-2-rebase-retarget-plan.md`
- `docs/github-merge-hygiene/merge-hygiene-2-pr-readiness-after-parent-merge.md`
- `docs/github-merge-hygiene/merge-hygiene-2-duplicate-superseded-review.md`
- `docs/github-merge-hygiene/merge-hygiene-2-downstream-update-queue.md`
- `docs/github-merge-hygiene/merge-hygiene-2-owner-action-checklist.md`
- `docs/prompt-merge-hygiene-2-validation-results.md`
- `docs/implementation-prompts/prompt-merge-hygiene-2-downstream-branch-rebase-retarget-plan.md`
- `scripts/validation/github-merge-hygiene-2-diagnostics.mjs`
- package script `merge-hygiene:2:diagnostics`

## Validation Log

| Command | Status | Notes |
| --- | --- | --- |
| `git diff --check` | `passed` | No whitespace errors. |
| `npm ci` | `passed` | Installed 159 packages; 0 vulnerabilities. npm reported pending optional install-script review for `fsevents@2.3.3`; no dependency mutation performed. |
| `npm run --silent merge-hygiene:2:diagnostics` | `passed` | New diagnostic passed with `downstream_rebase_retarget_plan_created`. |
| `npm run --silent merge-hygiene:1a:diagnostics` | `passed` | Base MERGE-HYGIENE-1A diagnostic passed. |
| `npm run --silent merge-hygiene:1:diagnostics` | `passed` | Base MERGE-HYGIENE-1 diagnostic passed. |
| `npm run --silent merge-hygiene:diagnostics` | `passed` | Base MERGE-HYGIENE-0 diagnostic passed. |
| `npm run lint` | `passed` | ESLint passed after deleting generated AppleDouble sidecars. |
| `npx tsc -b` | `passed` | TypeScript build passed. |
| `npm run build` | `passed` | Vite build passed with a plugin timing warning only. |
| `npm run build:server` | `not_available_on_base` | No package script on MERGE-HYGIENE-1A base. |
| `npm run prod:readiness:summary` | `not_available_on_base` | No package script on MERGE-HYGIENE-1A base. |
| `npm run prod:beta:summary` | `not_available_on_base` | No package script on MERGE-HYGIENE-1A base. |
| changed-file secret scan | `passed` | No keys, private material, or real URLs found in changed files. |
| final `git diff --check` | `passed` | No whitespace errors after validation record update. |

## PR And CI

- PR URL: `pending`
- PR mode: `draft`
- GitHub checks: `pending`

## Base Gaps

The following requested broad trackers or runners are absent on the MERGE-HYGIENE-1A base and were not created:

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/implementation-prompts/README.md`
- `docs/beta-readiness-scorecard.md`
- `docs/production-beta-blocker-inventory.md`
- `scripts/validation/run-foundation-validation.mjs`

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## No-Scope Statement

No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
