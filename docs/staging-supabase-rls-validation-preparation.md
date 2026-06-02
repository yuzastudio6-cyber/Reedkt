# Staging Supabase/RLS Validation Preparation

Prompt 19 prepares the Supabase/RLS validation path after the Prompt 18 E2E staging smoke plan. It does not run Supabase, SQL, migrations, storage transfer, staging validation, remote validation, or production validation.

## Purpose

ReeditPro has a strong static foundation from Prompts 0-18, but RLS is still the main beta blocker because access policies have not been proven with local or staging SQL execution. Prompt 19 organizes the future validation path so Prompt 20 can run local Supabase/RLS validation only after the environment, fixtures, manifest, and evidence rules are explicit.

## Current Status After Prompt 18

- Prompt 18 Foundation Validation passed on GitHub.
- Static diagnostics exist through `e2e:staging:diagnostics`.
- `local Supabase/RLS not run`.
- `staging Supabase/RLS not run`.
- `remote/prod validation prohibited`.
- SQL/RLS files `006` through `020` remain draft-only.
- Legacy SQL smoke files `001` through `005` exist as manual local/staging checklists, not production evidence.
- Supabase CLI architecture issues have previously blocked local validation on this host.

## Why RLS Remains The Main Beta Blocker

RLS is the first line of defense for cross-workspace and cross-project isolation. Without executed local or staging evidence, the repo cannot prove that members can access only their records, non-members are denied, backend-only writes stay blocked, private storage remains private, and future service-role boundaries do not expose unsafe rows.

## Local Validation Target

Prompt 20 should target a disposable local Supabase environment with:

- Correct Supabase CLI architecture or a containerized local Supabase path.
- No linked remote project.
- Fresh local database reset.
- Full migration chain applied from the Prompt 18/19 branch head.
- Synthetic fixtures only.
- Selected executable RLS tests converted from the manifest.
- Cleanup evidence after test completion.

## Staging Validation Target

Staging validation is future-only and requires human approval. The staging target must be separate from production, contain no production data, use synthetic fixtures, record evidence, and preserve rollback and cleanup plans.

## Required Environments

- Local validation: disposable local Supabase plus Docker when required by the CLI path.
- Staging validation: approved staging Supabase project, staging-only credentials held outside git, synthetic fixture records, and reviewer signoff.
- Production validation: not allowed in Prompt 19 or Prompt 20.

## Required Reset, Seed, Cleanup, And Evidence

- Reset: local reset must destroy only disposable local state.
- Seed: future validation must use `synthetic fixtures` and no production data.
- Cleanup: fixtures must be removable by workspace/project/test-run scope.
- Evidence: every run must capture branch, commit, migration chain, CLI version, fixture IDs, test output, failed cases, cleanup confirmation, and reviewer signoff.

## Static Validation Available Today

Prompt 19 can validate only file presence, manifest coverage, warning headers, package script wiring, foundation runner wiring, workflow trigger coverage, blocker tracking, and absence of executable Supabase/SQL/deploy commands in scripts.

## Not Validated Until Later

- Local RLS allow/deny behavior.
- Staging RLS allow/deny behavior.
- Supabase storage policy behavior.
- Migration application output.
- Supabase advisor output.
- Service-role-only mutation boundaries.
- Any production beta readiness claim.

## Production Beta Blockers

Before production beta, ReeditPro still needs executed local and staging RLS evidence, private storage policy evidence, transactional backend write paths, deployment/rollback evidence, observability persistence, billing controls, human compliance approval, and real runtime milestones. Prompt 19 does not materially increase executable beta readiness; it only makes Prompt 20 safer to run.

## Next Milestone

If Prompt 19 validation passes, the next milestone is Prompt 20 - Local Supabase/RLS Validation Execution. If diagnostics, CI, or tracker updates fail, use Prompt 19A - Supabase/RLS Preparation Hardening.
