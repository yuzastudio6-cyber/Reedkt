# RP-BETA-INTEGRATION-23 Qwen Clone Cleanup And Commit Preparation Plan

## A. Purpose

This packet defines how to clean, classify, and prepare local Qwen beta commits in the separate Qwen clone before any import into the current RP-SKILLS/RP-BETA repo.

This is docs-only planning. It does not mutate `/Users/macuser/Developer/REeditpro`, copy Qwen files, stage, commit, merge, push, deploy, install packages, inspect secrets, call providers, start workers, use remote Supabase, or change runtime/UI/app behavior.

## B. Current Repo State

Current repo:

- `/Users/macuser/Documents/Frontend/reeditpro-all-owner-stack-reconciliation`

Branch:

- `codex/reeditpro-tool-calling-worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-1`

Remote:

- `origin https://github.com/yuzastudio6-cyber/Reedkt.git`

RP-BETA-INTEGRATION-20 commit baseline:

- `ee74f3e8` - `docs(skills): add creative skill planning and beta readiness docs`
- `f2a45f3d` - `types(skills): add creative skill contracts and fixtures`
- `c00bc56d` - `db(skills): add creative skill catalog migrations and manifest`
- `38067b92` - `fix(db): repair local migration chain compatibility`
- `18aec883` - `fix(sound): import sound agent plan type`
- `69bf8baf` - `docs(beta): record owner staging and commit execution`

Current dirty state entering RP-BETA-INTEGRATION-23:

- RP-BETA-INTEGRATION-21 and RP-BETA-INTEGRATION-22 docs remain dirty/uncommitted in the current repo.
- `supabase/.branches/` and `supabase/.temp/` remain untracked local side artifacts.
- No staged files were present.

## C. Qwen Clone State

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

Decision state:

- The Qwen clone is not safe to mutate until a later owner-approved prompt explicitly authorizes exact staging and local commit actions.

## D. Qwen Candidate File Inventory

Read-only inventory counts for key candidate groups:

| Candidate group | Untracked count | Classification |
| --- | ---: | --- |
| `src/backend/qwen-runtime/` | 22 | Qwen beta required/dependency |
| `src/types/qwen*` | 4 | Qwen beta required |
| `src/types/project-edit-brief*` | 8 | Project Edit Brief required |
| `src/backend/contracts/project-edit-brief*` | 8 | Project Edit Brief dependency |
| `src/backend/api/project-edit-brief*` | 3 | route integration |
| `src/backend/repositories/project-edit-brief*` | 4 | repository dependency |
| `src/backend/orchestrators/mock-project-edit-brief*` | 8 | mock/test dependency |
| `src/lib/project-edit-brief*` | 18 | browser-safe UI/client dependency |
| `server/smoke/qwen*` | 15 | validation/test |
| `server/smoke/project-edit-brief*` | 15 | validation/test |
| `server/routes/qwen*` | 2 | route integration |
| `server/routes/project-edit-brief*` | 1 | route integration |
| `scripts/check-qwen*` | 2 | validation/test |
| `scripts/qwen*` | 6 | validation/owner tooling |
| `docs/qwen*` | 43 | docs/status |
| `docs/project-edit-brief*` | 74 | docs/status |

Headline Qwen files remain untracked in the Qwen clone and absent from the current repo:

- `src/types/qwen-runtime-adapter.ts`
- `src/types/qwen-marker-chat-runtime.ts`
- `src/backend/qwen-runtime/qwen-marker-chat-bridge-service.ts`
- `src/backend/api/project-edit-brief-mock-route-handlers.ts`
- `src/lib/project-edit-brief-marker-chat-ui-adapter.ts`
- `scripts/check-qwen-secret-leakage.mjs`

The headline files require additional untracked dependencies, including:

- `src/types/project-edit-brief.ts`
- `src/types/project-edit-brief-repository.ts`
- `src/types/project-edit-brief-marker-chat.ts`
- `src/backend/repositories/project-edit-brief-repository.ts`
- `src/backend/repositories/mock-project-edit-brief-repository.ts`
- `src/backend/qwen-runtime/qwen-provider-client.ts`
- `src/lib/project-edit-brief-api-client.ts`
- `src/lib/project-edit-brief-api-client-adapter.ts`
- `src/lib/project-edit-brief-marker-chat-rules.ts`

## E. Required Qwen Beta Import Bundle

The future import bundle should be prepared in Qwen clone commits before any current-repo import.

| Group | Source set | Target expectation | Validation |
| --- | --- | --- | --- |
| A. Qwen runtime contracts | `src/types/qwen*` and type exports | Qwen types plus `src/types/index.ts` exports | typecheck/build |
| B. Backend Qwen runtime | `src/backend/qwen-runtime/` | backend-only runtime, fallback, validation, Secret Manager reference handling | Qwen runtime boundary/check smokes |
| C. Project Edit Brief route integration | project-edit-brief backend contracts, repos, API handlers, routes | marker message append and mock route support | project-edit-brief route/client smokes |
| D. Browser-safe UI adapter | `src/lib/project-edit-brief*` marker-chat/client adapters | frontend-safe deterministic fallback and no backend runtime imports | frontend-boundary check |
| E. Scripts and smokes | Qwen checks, Project Edit Brief smokes, Supabase safety, secret leakage | safe validation commands in current repo after import | lint/build/smokes/checks |
| F. Package/dependencies | `package.json`, lockfile | owner-approved dependency and script reconciliation | install-free static review, then npm validation |
| G. Docs/readiness | selected Qwen and Project Edit Brief docs | only docs needed to explain beta boundaries and operation | docs secret scan |

## F. Unrelated And Noisy File Categories

The dirty Qwen clone must be classified before staging anything.

| Category | Examples | Recommended action |
| --- | --- | --- |
| Qwen beta required | Qwen runtime types and backend runtime services | include in owner-approved Qwen cleanup commits |
| Qwen beta dependency | Project Edit Brief types, repos, adapters, route support | include only if required by build/import graph |
| Qwen beta validation/test | Qwen smokes, boundary checks, secret leakage checks | include with the runtime bundle if non-mutating |
| Project Edit Brief required | marker chat contracts, mock route handlers, UI adapters | include as a separate commit group or explicit dependency group |
| package/dependency required | `@google-cloud/secret-manager`, `@playwright/test`, Qwen scripts, lockfile | owner review before staging |
| docs/status required | selected Qwen beta and Project Edit Brief boundary docs | include only curated docs |
| unrelated dirty tracked | broad UI/editor/music/SFX/page changes and production docs | exclude from Qwen cleanup commits |
| unrelated untracked | broad docs/smokes/scripts not needed for Qwen marker chat | owner-review or leave untouched |
| generated/local artifacts | local outputs, caches, side artifacts if discovered | exclude |
| unknown owner-review needed | any file whose dependency role is unclear | do not stage until classified |

Direct import is unsafe because the Qwen clone combines Qwen runtime, Project Edit Brief, package/script, production/GCP, UI/editor, and broad docs changes in one dirty worktree.

## G. Package And Script Implications

Qwen clone package deltas compared with the current repo include:

- new dependency: `@google-cloud/secret-manager`
- new dev dependency: `@playwright/test`
- many new scripts for Qwen runtime checks, Qwen secret leakage, frontend-boundary checks, Supabase command safety, Project Edit Brief smokes, owner config discovery, beta doctors, live-readiness gates, Playwright E2E, production checks, and readiness checks

Package implications:

- The lockfile must be reconciled with `package.json`; do not edit only one.
- `@google-cloud/secret-manager` must remain backend-only.
- `@playwright/test` is new to the current repo and should be owner-approved because it changes test tooling footprint.
- Production/live scripts must be reviewed so they do not become accidental default validation commands.
- Supabase safety scripts may be useful, but they must preserve the no-remote-Supabase boundary.

## H. Type And Export Implications

Current repo `src/types/index.ts` has no Qwen or Project Edit Brief exports.

Qwen clone `src/types/index.ts` adds exports for:

- `qwen-runtime-boundary`
- `qwen-runtime-adapter`
- `qwen-marker-chat-runtime`
- `qwen25vl-runtime`
- `project-edit-brief`
- `project-edit-brief-visual-context`
- `project-edit-brief-marker-chat`
- `project-edit-brief-attachments`
- `project-edit-brief-export-settings`
- `project-edit-brief-qa`
- `project-edit-brief-plan`
- `project-edit-brief-repository`

Future import must reconcile these exports explicitly and check for collisions with RP-SKILLS Creative Skill, StoryTiming, audio/music, backend runtime, and existing shared type exports.

## I. Backend, Frontend, And Secret Boundaries

Future Qwen cleanup commits must preserve these boundaries:

- Qwen live runtime is backend-only.
- Browser code must not import `src/backend/qwen-runtime`.
- Secret Manager values must not be printed, copied, committed, or exposed to frontend code.
- Secret references may be stored as names only.
- Missing Qwen beta config must block live provider calls and fall back deterministically.
- Provider calls must stay disabled in tests unless a later owner prompt explicitly authorizes live testing.
- Marker Chat may create marker intent and hints only; it must not execute Creative Skill planning, edit plans, workers, credits, render/export, or Supabase mutations.

The Qwen clone appears to contain boundary-oriented scripts and docs, but they are untracked and should be committed or excluded deliberately before being treated as source truth.

## J. Conflict Risks With Current Repo

| Surface | Risk | Required resolution |
| --- | --- | --- |
| `src/types/index.ts` | Qwen exports absent in current repo | merge exports explicitly after type collision scan |
| package files | Qwen adds dependencies and many scripts | owner-reviewed package/lockfile commit |
| Project Edit Brief files | absent in current repo and needed by Qwen files | include dependency group before/with Qwen runtime |
| Qwen runtime services | absent in current repo | import only after dependency graph is frozen |
| frontend-boundary scripts | absent in current repo | import with validation plan |
| Supabase safety scripts | absent in current repo | ensure no remote commands run by default |
| docs | large Qwen/Project Edit Brief docs set | curate docs instead of broad copy |
| broad tracked UI/editor changes | unrelated to Qwen cleanup | exclude unless owner separately approves |

## K. Cleanup Strategy Options

| Option | Description | Recommendation |
| --- | --- | --- |
| A | Owner manually cleans Qwen clone first, then requests review/import. | Safe fallback if owner wants manual control. |
| B | Codex prepares local Qwen clone commits in a later owner-approved prompt using exact path lists. | Recommended. |
| C | File-level import from dirty Qwen clone now. | Not recommended; dependency graph is too broad and mixed. |
| D | Scope Qwen out of beta merge. | Requires explicit owner acceptance of reduced beta scope. |

## L. Recommended Strategy

Recommended strategy:

- Option B: owner-approved Codex cleanup and local Qwen commits in `/Users/macuser/Developer/REeditpro`.

Future cleanup should use explicit path manifests and commit groups:

1. Qwen runtime contracts and backend runtime.
2. Project Edit Brief contracts, repositories, route integration, and UI adapters.
3. Validation scripts and smokes.
4. Package and lockfile changes.
5. Curated Qwen/Project Edit Brief docs.

Each group should exclude unrelated UI/editor, production/GCP, broad docs, generated/local artifacts, and unknown files unless owner separately approves them.

## M. Future Prompt Plan

Recommended next prompt:

`RP-BETA-INTEGRATION-24 - Qwen Clone Owner-Approved Cleanup and Local Commit Execution`

Allowed future scope:

- operate inside `/Users/macuser/Developer/REeditpro`
- classify dirty Qwen clone files
- stage exact Qwen beta files only
- create local Qwen beta commits
- run Qwen validation
- no push
- no deploy
- no remote Supabase
- no live provider calls
- no copying into RP-SKILLS yet

Forbidden future scope:

- broad `git add .`
- reset/stash/clean
- deleting unknown files
- staging unrelated files
- copying into the current RP-SKILLS repo
- remote push/deploy
- provider live calls
- remote Supabase

## N. Owner Decisions Needed

Owner decisions needed:

- Confirm Qwen remains required for this beta.
- Approve Codex to mutate the Qwen clone in a future prompt.
- Approve local Qwen cleanup commits in the Qwen clone.
- Approve dependency additions: `@google-cloud/secret-manager` and `@playwright/test`.
- Approve whether Project Edit Brief comes in the same Qwen import or as a separate dependency commit group.
- Approve which Qwen/Project Edit Brief docs should move forward.
- Approve any future import into RP-SKILLS, staging, commit, merge, push, deploy, remote Supabase, or live provider action separately.

## O. Validation Results

Current repo validation for the RP-BETA-INTEGRATION-23 pass:

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`: passed
- `npm run lint`: passed
- `npm run build`: passed with the existing Vite large-chunk warning
- `npm run smoke:beta-readiness`: passed
- `npm run smoke:api`: passed
- `npm run smoke:sound-music-audio-contracts`: passed
- `npm run smoke:sound-music-audio-planner`: passed

Qwen clone validation was not run because this pass is read-only and the clone is mixed/dirty.

## P. Remaining Blockers

Remaining blockers:

- Qwen clone is not cleaned or committed.
- Qwen runtime is absent from the current RP-SKILLS repo.
- Project Edit Brief dependency graph is untracked and broad.
- Package/script changes require owner review.
- Qwen import cannot proceed until a stable Qwen source set exists.
- The current repo is not end-to-end beta-ready until Qwen is reconciled or explicitly scoped out.

## Q. Confirmation

RP-BETA-INTEGRATION-23 must not mutate either repo beyond the allowed docs in the current repo.

Confirmed boundaries for this plan:

- no Qwen clone mutation
- no Qwen file copy
- no package change
- no migration change
- no manifest change
- no TypeScript contract change
- no mock fixture change
- no runtime/UI/app behavior change
- no provider call
- no worker execution
- no remote Supabase
- no staging
- no commit
- no merge
- no push
- no deploy

## R. RP-BETA-INTEGRATION-24 Execution Update

RP-BETA-INTEGRATION-24 attempted owner-approved local Qwen cleanup commits.

Execution decision:

- `blocked_before_qwen_staging`

Specific blocker:

- `blocked_qwen_package_conflict`

Result:

- Qwen validation passed before staging.
- Candidate path manifests were created in `/tmp`.
- No Qwen files were staged or committed.
- Package files were not staged because the script diff is broader than the Qwen beta-only commit scope.

Recommended next prompt:

`RP-BETA-INTEGRATION-25 - Qwen Package Script Split and Cleanup Commit Repair`

## RP-BETA-INTEGRATION-25 Result

The package/script split repair was completed in the Qwen clone. Six local commits now provide a stable reviewed source for the Qwen marker-chat beta slice:

- `92d3111e5`
- `f9d52f8ff`
- `f87a40d65`
- `f53b52621`
- `df5f25c86`
- `11ffea3b6`

The remaining Qwen dirty state is still not an import source. RP-BETA-INTEGRATION-26 should import only from the reviewed commit slice after an explicit file manifest.
