# RP-BETA-INTEGRATION-25 Qwen Package Script Split And Cleanup Commit Repair

## Purpose

RP-BETA-INTEGRATION-25 repaired the RP-BETA-INTEGRATION-24 package/script staging blocker in the separate Qwen clone at `/Users/macuser/Developer/REeditpro`.

The work created local Qwen cleanup commits only. No Qwen files were copied into the RP-SKILLS repo, and no push, merge, rebase, tag, deploy, provider call, worker execution, package install, remote Supabase command, or app runtime action occurred.

## Decision

Decision: `qwen_package_script_split_repaired_and_local_commits_created`

Recommended next prompt: `RP-BETA-INTEGRATION-26 - Qwen Beta Commit Import into RP-SKILLS Repo`

## Repo State

Current RP-SKILLS repo:

- Path: `/Users/macuser/Documents/Frontend/reeditpro-all-owner-stack-reconciliation`
- Branch: `codex/reeditpro-tool-calling-worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-1`
- Mutation in this pass: documentation only.
- Qwen files copied into RP-SKILLS: no.
- Staged RP-SKILLS files after this pass: no.

Separate Qwen clone:

- Path: `/Users/macuser/Developer/REeditpro`
- Branch: `codex/reeditpro-tool-calling-fixture-bound-export-validation-1`
- Pre-existing staged files: `0`
- Post-commit staged files: `0`
- Remaining dirty state after commits: `143` tracked modified entries and `1174` untracked entries.

## Package Split

`package.json` was staged with an index-only patch. The staged package script surface was limited to the approved allowlist:

- `check:qwen-secret-leakage`
- `smoke:qwen-runtime-boundary`
- `check:qwen-runtime-boundary`
- `smoke:qwen-marker-chat-bridge`
- `smoke:project-edit-brief-marker-chat`
- `check:frontend-boundary`
- `smoke:supabase-command-safety`
- `check:supabase-command-safety`

The staged dependency delta was limited to:

- `@google-cloud/secret-manager`
- `@playwright/test`

Broad production/readiness, monitoring, rollback, unrelated E2E, broad user-facing editing, media/storage, deployment, remote Supabase, and live-provider scripts remained unstaged in the Qwen clone working tree.

## Qwen Commits

Created local commits in `/Users/macuser/Developer/REeditpro`:

- `92d3111e5` - `types(qwen): add marker chat runtime contracts`
- `f9d52f8ff` - `feat(qwen): add backend marker chat runtime bridge`
- `f87a40d65` - `feat(project-edit-brief): add marker chat runtime adapter`
- `f53b52621` - `test(qwen): add beta runtime validation checks`
- `df5f25c86` - `chore(qwen): add beta runtime dependencies and scripts`
- `11ffea3b6` - `docs(qwen): document beta runtime readiness`

## Scope Notes

The Qwen route files and Qwen25VL materials remain partly outside the minimal package-script repair because their current working-tree dependencies include broader production-route and live-provider readiness work. The committed slice focuses on the reviewed marker-chat runtime contracts, backend bridge, Project Edit Brief marker-chat adapter, static validation scripts, package split, and curated docs.

The Qwen clone remains dirty and is not yet imported into RP-SKILLS. RP-BETA-INTEGRATION-26 should import from these local commits only after an explicit reviewed import manifest.

## Validation

Qwen pre-stage validation:

- `npm run lint`: passed.
- `npm run build`: passed with chunk-size warnings.
- `npm run check:qwen-secret-leakage`: passed.
- `npm run smoke:qwen-runtime-boundary`: passed.
- `npm run check:qwen-runtime-boundary`: passed.
- `npm run smoke:qwen-marker-chat-bridge`: passed.
- `npm run smoke:project-edit-brief-marker-chat`: passed.
- `npm run check:frontend-boundary`: passed.
- `npm run smoke:supabase-command-safety`: passed.
- `npm run check:supabase-command-safety`: passed.

Qwen post-commit validation:

- `npm run lint`: passed.
- `npm run build`: passed with chunk-size warnings.
- `npm run check:qwen-secret-leakage`: passed.
- `npm run smoke:qwen-runtime-boundary`: passed.
- `npm run check:qwen-runtime-boundary`: passed.
- `npm run smoke:qwen-marker-chat-bridge`: passed.
- `npm run smoke:project-edit-brief-marker-chat`: passed.
- `npm run check:frontend-boundary`: passed.
- `npm run smoke:supabase-command-safety`: passed.
- `npm run check:supabase-command-safety`: passed.

The safety checks reported no provider calls, no gcloud commands, no Supabase commands, no remote mutations, no remote SQL, no remote typegen, no render or worker jobs, and no credit reservation or spend.

## Boundaries

No Qwen push, merge, rebase, tag, deploy, remote Supabase command, provider call, worker execution, package install, reset, stash, clean, delete, broad staging, or file copy into RP-SKILLS occurred.

No RP-SKILLS package, migration, manifest, type contract, mock fixture, runtime, UI, provider, worker, or app behavior changed in this pass.

## RP-BETA-INTEGRATION-26 Import Follow-Up

RP-BETA-INTEGRATION-26 imported the six reviewed Qwen commits into RP-SKILLS, but validation found the committed slice is not dependency-complete in the target repo.

Outcome:

- `qwen_beta_commits_imported_but_validation_blocked_dependency_incomplete`

The next repair must address the missing dependency graph without copying untracked Qwen files outside owner-approved scope.
