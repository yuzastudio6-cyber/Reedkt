# RP-BETA-INTEGRATION-22 Qwen Beta Clone Reconciliation Plan

## A. Purpose

This packet records the read-only reconciliation plan for bringing Qwen beta work from the separate Qwen clone into the current RP-SKILLS/RP-BETA integration repo.

This is docs-only planning. It does not copy Qwen files, mutate the Qwen clone, change package files, stage, commit, merge, push, deploy, run remote Supabase, call providers, start workers, or change runtime/UI/app behavior.

## B. Current Repo Identity

Current repo:

- `/Users/macuser/Documents/Frontend/reeditpro-all-owner-stack-reconciliation`

Branch:

- `codex/reeditpro-tool-calling-worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-1`

Remote:

- `origin https://github.com/yuzastudio6-cyber/Reedkt.git`

Current RP-BETA-INTEGRATION-20 commit baseline:

- `ee74f3e8` - `docs(skills): add creative skill planning and beta readiness docs`
- `f2a45f3d` - `types(skills): add creative skill contracts and fixtures`
- `c00bc56d` - `db(skills): add creative skill catalog migrations and manifest`
- `38067b92` - `fix(db): repair local migration chain compatibility`
- `18aec883` - `fix(sound): import sound agent plan type`
- `69bf8baf` - `docs(beta): record owner staging and commit execution`

Current repo state before RP-BETA-INTEGRATION-22 edits:

- no staged files
- RP-BETA-INTEGRATION-21 docs remained dirty
- local Supabase side artifacts remained excluded: `supabase/.branches/` and `supabase/.temp/`

## C. Qwen Clone Identity

Qwen clone:

- `/Users/macuser/Developer/REeditpro`

Branch:

- `codex/reeditpro-tool-calling-fixture-bound-export-validation-1`

Remote:

- `origin https://github.com/yuzastudio6-cyber/Reedkt.git`

Top inspected commit:

- `03e65363d [tools] Add fixture-bound export validation`

Read-only status:

- staged files: `0`
- tracked modified files: `144`
- untracked files: `2234`
- Qwen/project-edit-brief/script-like untracked paths: `414`

Qwen clone classification:

- `qwen_dirty_mixed_with_unrelated`

## D. Current Repo Qwen Presence

Reported Qwen beta files are absent from the current RP-SKILLS repo:

- `src/types/qwen-runtime-adapter.ts`
- `src/types/qwen-marker-chat-runtime.ts`
- `src/backend/qwen-runtime/qwen-marker-chat-bridge-service.ts`
- `src/backend/api/project-edit-brief-mock-route-handlers.ts`
- `src/lib/project-edit-brief-marker-chat-ui-adapter.ts`
- `scripts/check-qwen-secret-leakage.mjs`

Current repo Qwen classification:

- `qwen_absent_from_current_repo`

## E. Qwen Clone File Inventory

The reported Qwen beta files exist in the Qwen clone and are untracked:

| File | Qwen clone state | Current repo state |
| --- | --- | --- |
| `src/types/qwen-runtime-adapter.ts` | untracked | absent |
| `src/types/qwen-marker-chat-runtime.ts` | untracked | absent |
| `src/backend/qwen-runtime/qwen-marker-chat-bridge-service.ts` | untracked | absent |
| `src/backend/api/project-edit-brief-mock-route-handlers.ts` | untracked | absent |
| `src/lib/project-edit-brief-marker-chat-ui-adapter.ts` | untracked | absent |
| `scripts/check-qwen-secret-leakage.mjs` | untracked | absent |

The reported files are not self-contained. Read-only import inspection shows dependencies on additional untracked Qwen/project-edit-brief files, including:

- `src/types/project-edit-brief.ts`
- `src/types/project-edit-brief-repository.ts`
- `src/types/project-edit-brief-marker-chat.ts`
- `src/backend/repositories/project-edit-brief-repository.ts`
- `src/backend/repositories/mock-project-edit-brief-repository.ts`
- `src/backend/qwen-runtime/qwen-provider-client.ts`
- `src/lib/project-edit-brief-api-client.ts`
- `src/lib/project-edit-brief-api-client-adapter.ts`
- `src/lib/project-edit-brief-marker-chat-rules.ts`

These dependency files are present in the Qwen clone and absent from the current repo.

## F. Commit And Dirty Status

Qwen beta cannot safely be treated as a clean cherry-pick candidate yet.

Findings:

- Reported Qwen files are untracked, not committed.
- The Qwen clone has broad tracked modifications outside the reported Qwen file set.
- The Qwen clone has thousands of untracked files, including hundreds of Qwen/project-edit-brief/script-like paths.
- Package files are modified in the Qwen clone.
- No staged files were present.

Status classification:

- `qwen_dirty_mixed_with_unrelated`

## G. Dependency And Script Implications

Qwen clone package deltas require owner review before import:

- `@google-cloud/secret-manager` is present in Qwen dependencies and absent from current repo dependencies.
- `@playwright/test` is present in Qwen dev dependencies and absent from current repo dev dependencies.

Qwen clone scripts add a broad validation and runtime surface that is absent from current repo, including:

- Qwen runtime checks and smokes.
- Qwen secret-leakage checks.
- frontend-boundary checks.
- Supabase command-safety checks.
- project-edit-brief smokes.
- production/readiness route checks.
- Playwright E2E scripts.

Package changes are therefore not a mechanical import. They need a focused owner-reviewed package/script reconciliation before any Qwen runtime copy.

## H. Boundary And Safety Requirements

Future Qwen reconciliation must preserve these boundaries:

- Qwen runtime remains backend-only.
- Browser/UI code must not import backend Qwen runtime modules.
- Secret Manager references may be documented, but secret values must never be copied into repo files, docs, logs, or frontend code.
- Missing beta config must fail closed to deterministic fallback.
- Validation must not call live providers unless a later owner prompt explicitly authorizes live provider testing.
- Qwen Marker Chat scope remains marker intent and hints only; it must not start edit planning execution.
- No Creative Skill planner consumption, Supabase migration changes, render/export, worker dispatch, credit execution, or approval execution should be introduced during import.

The Qwen clone contains boundary-oriented scripts such as `check-qwen-secret-leakage.mjs` and frontend-boundary checks, but those scripts are untracked and need cleanup/commit before they can be trusted as source truth.

## I. Conflict Risk Table

| Area | Current repo state | Qwen clone state | Risk | Resolution |
| --- | --- | --- | --- | --- |
| Reported Qwen files | absent | untracked | medium | Import only after Qwen dependency manifest is complete. |
| Project Edit Brief types/repos | absent | untracked dependencies | high | Do not import six Qwen files alone. |
| `package.json` / lockfile | committed RP-SKILLS state | tracked modified | high | Owner-reviewed package reconciliation required. |
| Qwen smoke/check scripts | absent | many untracked scripts | high | Classify required scripts before package changes. |
| `src/types/index.ts` | RP-SKILLS committed exports | Qwen may require exports | medium | Future import must reconcile exports explicitly. |
| frontend-boundary checks | absent | untracked script surface | medium | Import only with matching validation path. |
| Supabase safety checks | absent | untracked script surface | medium | Keep remote Supabase forbidden; reconcile script scope separately. |
| Qwen docs | absent from current repo | many untracked docs | medium | Import only selected docs needed for beta handoff. |

## J. Current Repo Validation

Fresh current-repo validation passed:

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- `npm run build`
- `npm run smoke:beta-readiness`
- `npm run smoke:api`
- `npm run smoke:sound-music-audio-contracts`
- `npm run smoke:sound-music-audio-planner`

Build completed with the existing Vite large chunk warning only.

## K. Qwen Clone Validation

Qwen clone validation was not rerun in RP-BETA-INTEGRATION-22.

Reason:

- The Qwen clone is dirty and mixed with unrelated tracked/untracked work.
- The prompt requires read-only inspection and forbids mutation.
- Running broad Qwen validation from a mixed dirty clone would validate an unstable working tree rather than a stable import source.

Previously reported Qwen validation remains useful context, but it is not a current proof that the dirty clone can be imported safely.

## L. Reconciliation Decision

Decision:

- `qwen_reconciliation_blocked_mixed_dirty_clone`

Reason:

- Qwen is required for end-to-end beta unless explicitly scoped out.
- Qwen files are absent from the current RP-SKILLS repo.
- The Qwen clone contains the reported Qwen files, but they are untracked.
- The reported files depend on additional untracked project-edit-brief and Qwen runtime files.
- Package/script changes are dirty and broad.
- A file-level import now would risk importing an incomplete or incoherent runtime graph.

## M. Import Strategy Options

| Option | Description | Decision |
| --- | --- | --- |
| A | File-level import from dirty Qwen clone using explicit paths. | Not recommended yet; dependency graph is broader than the six reported files. |
| B | Cherry-pick Qwen commits. | Not available yet; reported Qwen files are untracked. |
| C | Clean/classify/commit Qwen clone first, then import from a stable commit or reviewed manifest. | Recommended. |
| D | Scope Qwen out of beta integration. | Requires explicit owner acceptance of reduced beta scope. |

## N. Recommended Option

Recommended option:

- Option C: clean/classify/commit the Qwen clone first.

The next pass should produce a precise Qwen clone cleanup and commit preparation plan. That plan should separate Qwen beta runtime, project-edit-brief support, package/script changes, docs, production/GCP files, and unrelated work before any cross-repo import.

## O. Future Implementation Plan

Future import should happen only after the Qwen clone has a stable source:

1. Create a Qwen cleanup/commit preparation packet.
2. Classify Qwen clone dirty files into import groups and excluded groups.
3. Commit or otherwise freeze the Qwen beta source set in the Qwen clone, with owner approval.
4. Create an explicit import manifest from the stable Qwen source.
5. Import only reviewed Qwen files into the current repo.
6. Reconcile package and lockfile changes with owner approval.
7. Validate in the current repo: lint, build, Qwen boundary checks, Qwen secret leakage, marker chat bridge smoke, project-edit-brief marker chat smoke, frontend-boundary checks, beta smokes, and safe existing RP-BETA smokes.
8. Commit imported Qwen work only after validation passes and owner approves staging.

Forbidden during future import unless separately approved:

- live provider calls
- remote Supabase
- `supabase link`
- `supabase db push`
- production deploy
- worker execution
- broad copy from Qwen clone
- secret inspection or copying

## P. Owner Decisions Needed

Owner decisions needed:

- Confirm Qwen remains required for end-to-end beta.
- Approve Qwen clone cleanup/classification before import.
- Decide whether Qwen package additions are acceptable: `@google-cloud/secret-manager` and `@playwright/test`.
- Decide whether broad project-edit-brief runtime support belongs in the same import or a separate import group.
- Decide how much Qwen documentation should move into the current repo.
- Approve any later staging, commit, merge, push, deploy, remote Supabase, or live provider action separately.

## Q. Remaining Blockers

Remaining blockers:

- Qwen source is mixed and dirty in a separate clone.
- Reported Qwen files are untracked and not self-contained.
- Package/script changes are broad and dirty.
- Current RP-SKILLS repo has no Qwen runtime files.
- Tool-calling diagnostic policy mismatch remains a separate follow-up.

## R. Recommended Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-23 - Qwen Clone Cleanup and Commit Preparation Plan`

If the owner wants to override the conservative path and import from the dirty clone anyway, a separate owner approval prompt must first define an exact file-by-file import manifest and package reconciliation plan.

## S. RP-BETA-INTEGRATION-23 Cleanup Plan Update

RP-BETA-INTEGRATION-23 completed the Qwen clone cleanup and commit-preparation plan.

Decision:

- `qwen_cleanup_plan_ready_for_owner_approval`

Updated finding:

- The Qwen clone is still mixed and dirty with `0` staged files, `144` tracked modified files, `2234` untracked files, and `414` Qwen/project-edit-brief/script-like untracked paths.
- The future bundle should be prepared as local Qwen clone commits before any RP-SKILLS import.
- Required bundle groups include Qwen type contracts, backend Qwen runtime, Project Edit Brief integration, browser-safe marker-chat adapters, validation scripts/smokes, package changes, and curated docs.

Recommended strategy:

- Future owner-approved Codex cleanup commits inside `/Users/macuser/Developer/REeditpro`.
- Do not directly import from the dirty clone.

Recommended next prompt:

`RP-BETA-INTEGRATION-24 - Qwen Clone Owner-Approved Cleanup and Local Commit Execution`

## T. RP-BETA-INTEGRATION-24 Execution Update

RP-BETA-INTEGRATION-24 accepted owner approval for local Qwen clone cleanup commits but stopped before staging.

Decision:

- `blocked_before_qwen_staging`

Specific blocker:

- `blocked_qwen_package_conflict`

Reason:

- Qwen validation passed, but the package/script diff is mixed beyond the reviewed Qwen beta-only bundle.
- No Qwen commits were created.

Recommended next prompt:

`RP-BETA-INTEGRATION-25 - Qwen Package Script Split and Cleanup Commit Repair`

## RP-BETA-INTEGRATION-25 Result

RP-BETA-INTEGRATION-25 created local Qwen cleanup commits after splitting the package script surface. The direct dirty-clone import remains blocked, but the reviewed commit slice can now be used by a future import prompt.

Reviewed Qwen commit slice:

- `92d3111e5`
- `f9d52f8ff`
- `f87a40d65`
- `f53b52621`
- `df5f25c86`
- `11ffea3b6`

Next step: `RP-BETA-INTEGRATION-26 - Qwen Beta Commit Import into RP-SKILLS Repo`.

## RP-BETA-INTEGRATION-26 Result

The reviewed Qwen commit slice was imported into RP-SKILLS, but the original reconciliation warning remains partially true: the slice depends on additional files that are still untracked in the Qwen clone.

Decision:

- `qwen_beta_commits_imported_but_validation_blocked_dependency_incomplete`

Next step:

`RP-BETA-INTEGRATION-27 - Qwen Import Dependency Completion and Build Repair`
