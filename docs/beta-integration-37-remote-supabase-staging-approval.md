# RP-BETA-INTEGRATION-37 Remote Supabase And Staging Deployment Owner Approval Packet

Date: 2026-07-02

## A. Executive Summary

This packet is approval-only. It prepares the owner decision surface for a future remote Supabase and staging deployment phase.

No remote actions were performed. No Supabase CLI was run for this milestone. No migrations were applied. No staging deploy was run. No provider calls, worker execution, live Qwen calls, remote database connection, package install, or app behavior change occurred.

Owner approval is required before any future remote Supabase command, migration application, staging deployment, provider enablement, worker execution, or production-facing action.

## B. Current Verified Base

Repository:

- `/Users/macuser/Documents/Frontend/reeditpro-all-owner-stack-reconciliation`

Target branch for future PR:

- `codex/reeditpro-web-ui-shell`

Verified merge baseline:

- PR #637 merge commit: `88c6b19334ff1a1e327c8e97823601afde867072`
- PR #2184 merge commit: `5bd57641fb18b7bff8dfb831ae75a63dda6a5ba6`
- Remote base at planning time: `origin/codex/reeditpro-web-ui-shell`

Inherited validation from PR #2184:

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- `npm run build`
- `npm run check:qwen-secret-leakage`
- `npm run smoke:beta-readiness`
- `npm run smoke:api`

Current worktree requirement for any future remote phase:

- no staged files
- no tracked dirty files
- only approved untracked local side artifacts, if present

## C. Scope Of Proposed Next Remote Phase

A later owner-approved remote phase would do only the steps explicitly approved in that future prompt:

- confirm the exact remote Supabase project and environment
- confirm the exact staging deployment target
- review migration drift and pending migration files
- apply approved migrations only after explicit owner approval
- deploy staging only after explicit owner approval
- run post-deploy smoke checks
- produce a rollback/status report with sanitized results

This packet does not authorize those actions.

## D. Explicit Non-Goals

- no production deploy
- no live billing activation
- no provider execution
- no worker execution
- no live Qwen execution
- no Qwen clone mutation
- no secret exposure
- no automatic database migration
- no automatic staging deploy
- no remote database connection
- no branch deletion
- no tag push
- no side-artifact cleanup

## E. Supabase Environment Inventory

Local Supabase directories and files observed:

- `supabase/config.toml`
- `supabase/README.md`
- `supabase/schema-review.md`
- `supabase/schema-health-checks.sql`
- `supabase/migration-audit.md`
- `supabase/migration-order.md`
- `supabase/auth-bootstrap-migration-plan.md`
- `supabase/e2e-mock-scenario.md`
- `supabase/e2e-mock-scenario.sql`
- `supabase/migrations/`

Migration inventory:

- migration file count: `24`
- latest migration: `202606250002_creative_skill_catalog_canonical_seed.sql`
- review file count under `supabase/review/`: `0`

Local side artifacts:

- `supabase/.branches/`
- `supabase/.temp/`

The side artifacts are untracked local Supabase state. They must not be staged, deleted, cleaned, or mutated by this approval packet or by a future remote deployment prompt unless separately approved.

No real remote project reference or raw credential is included in this packet.

## F. Migration Readiness Checklist

- [x] Migration directory exists.
- [x] Migration file count is recorded as `24`.
- [x] No new migration file is proposed by this packet.
- [x] Schema review doc exists at `supabase/schema-review.md`.
- [x] No review SQL files were found under `supabase/review/`.
- [x] No package lock change is proposed by this packet.
- [x] Local validation commands are listed before any future remote action.
- [ ] Owner confirms the exact remote Supabase project and environment.
- [ ] Owner confirms the exact migration file list to apply.
- [ ] Owner confirms migration drift review result.
- [ ] Owner confirms backup/rollback expectations.
- [ ] Owner approves any future SQL application.

## G. Staging Deployment Readiness Checklist

- [ ] Owner confirms target branch: `codex/reeditpro-web-ui-shell`.
- [ ] Owner confirms the staging environment and hosting target.
- [ ] Owner confirms required environment values are present in the approved secret store.
- [ ] Owner approves the future deploy command before it is run.
- [ ] Owner approves the post-deploy smoke suite.
- [ ] Owner confirms rollback trigger conditions.
- [ ] Owner confirms production deployment is excluded.

Future deploy command: not approved in this milestone.

## H. Required Secrets And Config Checklist

Owner must confirm the following categories exist in the approved secret store or deployment environment. Do not place values in the repo or in chat.

- Supabase URL
- Supabase anonymous key
- Supabase service role key
- Supabase project reference
- database connection URL, if required by the approved remote phase
- provider secrets
- Qwen and DeepSeek secrets, if live beta is included later
- Stripe test and live secret references, if payment checks are included later
- Stripe webhook signing secret references, if payment callbacks are included later
- Google Secret Manager access
- staging deploy tokens

Use placeholders only in documentation. Never include raw values, bearer tokens, service credentials, database URLs with credentials, or provider keys.

## I. Validation Matrix

Required before any future remote phase:

| Validation | Required result |
| --- | --- |
| `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check` | pass |
| `npm run lint` | pass |
| `npm run build` | pass |
| `npm run check:qwen-secret-leakage` | pass |
| `npm run smoke:beta-readiness` | pass |
| `npm run smoke:api` | pass |
| `npm run smoke:beta-integration-37` | pass |

Optional validations are not currently present in `package.json`:

- external beta credit smoke
- credit audit smoke
- Stripe live readiness smoke
- credit persistence plan smoke
- credit Supabase migration draft smoke

Additional checks recommended for the future remote phase:

- Supabase command-safety check
- staging smoke
- remote migration drift review
- RLS and storage policy verification on the approved staging target

## J. Remote Action Approval Checklist

Owner must explicitly approve each item before execution:

- [ ] Approve remote Supabase project and environment.
- [ ] Approve remote Supabase command set.
- [ ] Approve migration file list.
- [ ] Approve migration application window.
- [ ] Approve staging deployment target.
- [ ] Approve staging deployment command.
- [ ] Approve post-deploy validation suite.
- [ ] Approve rollback plan.
- [ ] Confirm secrets and config are present in the approved secret store.
- [ ] Confirm no live billing or payment activation is included.
- [ ] Confirm no production deploy is included.

## K. Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner decision needed |
| --- | --- | --- | --- | --- |
| Wrong Supabase project | Medium | High | Require explicit project/environment confirmation before any command. | Approve exact target. |
| Migration drift | Medium | High | Run drift review and approve file list before migration application. | Approve migration plan. |
| RLS regression | Medium | High | Verify RLS, grants, and storage policies on staging after migration. | Approve validation suite. |
| Missing secrets/config | Medium | High | Confirm categories in approved secret store without printing values. | Approve config readiness. |
| Side artifact staging | Low | Medium | Keep `supabase/.branches/` and `supabase/.temp/` untracked and excluded. | Confirm no cleanup/staging. |
| Deploy to wrong environment | Medium | High | Require exact staging target and command approval. | Approve staging target. |
| Provider call accidentally triggered | Low | High | Keep provider/live Qwen disabled unless explicitly approved. | Approve or exclude live providers. |
| Qwen secret leakage | Low | High | Run secret leakage check and avoid raw values. | Approve secret handling. |
| Build/smoke mismatch | Medium | Medium | Require local build and smoke checks before remote action. | Approve validation result. |
| Rollback not verified | Medium | High | Document rollback triggers and smoke after rollback. | Approve rollback plan. |

## L. Rollback Plan

A future remote phase must define rollback before execution:

- stop deployment if validation fails before release
- revert staging deploy to the previous known-good artifact
- use the migration-specific rollback strategy approved for the exact migration list
- disable feature flags or beta exposure toggles if applicable
- restore previous environment values if config caused the issue
- rerun smoke checks after rollback
- get owner sign-off on rollback status

Database rollback depends on the approved migration list and target environment. This packet does not approve a database rollback command.

## M. Go/No-Go Decision Block

GO only if:

- worktree is clean except approved packet changes
- owner approvals are checked
- remote Supabase target is confirmed
- staging target is confirmed
- migration list and drift review are confirmed
- secrets/config categories are confirmed
- validation passes
- rollback plan is confirmed

NO-GO if:

- owner approval is missing
- project/environment target is unknown
- migration drift is unknown
- secrets/config are missing
- smoke checks fail
- side artifacts are staged
- package lock changes unexpectedly
- raw secrets are detected
- production deployment is requested without separate approval

## N. Final Recommendation

The repo is ready for owner review of the remote Supabase and staging deployment plan.

It is not approved or ready to deploy from this packet alone. A future prompt must explicitly approve the remote Supabase project, migration command set, staging target, validation suite, and rollback plan before any remote action occurs.
