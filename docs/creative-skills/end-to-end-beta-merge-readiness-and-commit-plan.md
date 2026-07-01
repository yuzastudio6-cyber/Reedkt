# RP-BETA-INTEGRATION-18 End-to-End Beta Merge Readiness And Commit Plan

## A. Purpose

RP-BETA-INTEGRATION-18 evaluates whether the current RP-SKILLS/RP-BETA worktree is ready for owner-approved staging, commits, and later local merge planning after RP-BETA-INTEGRATION-17 verified the Creative Skill catalog locally.

Decision:

- `blocked_build_failure`

Secondary blockers:

- `blocked_qwen_clone_reconciliation_needed`
- `blocked_validation_policy_mismatch`

No staging, commit, merge, push, deploy, remote Supabase, Qwen clone mutation, migration edit, manifest edit, TypeScript edit, mock edit, package edit, runtime change, provider call, worker run, UI change, or app behavior change occurred in this prompt.

## B. Repo And Branch Identity

Repository root:

- `/Users/macuser/Documents/Frontend/reeditpro-all-owner-stack-reconciliation`

Current branch:

- `codex/reeditpro-tool-calling-worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-1`

Remote:

- `origin` -> `https://github.com/yuzastudio6-cyber/Reedkt.git`

Current HEAD:

- `01779ff8 [tools] Add Worker Runtime Sound CPU contract owner review reconciliation`

Pre-RP-BETA-INTEGRATION-18 worktree inventory:

- staged files: `0`
- tracked modified files: `12`
- untracked entries in this repo: `124`

## C. Qwen Clone Relationship

Qwen clone path:

- `/Users/macuser/Developer/REeditpro`

Qwen branch:

- `codex/reeditpro-tool-calling-fixture-bound-export-validation-1`

Qwen remote:

- `https://github.com/yuzastudio6-cyber/Reedkt.git`

Qwen status:

- tracked modified files: `144`
- `git status --short` untracked entries: `1234`
- `git ls-files --others --exclude-standard` untracked file paths: `2234`

Finding:

- Qwen is a separate dirty clone of the same remote, on a different branch.
- Qwen files were not copied into the RP-SKILLS repo.
- This RP-SKILLS branch cannot be called end-to-end beta-ready with Qwen included until an owner-approved cross-clone reconciliation prompt decides what to import, commit, or exclude.

## D. Creative Skill Local Database Verification Baseline

RP-BETA-INTEGRATION-17 remains the database verification baseline.

Decision:

- `creative_skill_catalog_full_local_verification_passed_with_warnings`

Verified locally:

- `supabase db reset --local --no-seed` passed for `reeditpro-local`.
- Creative Skill catalog counts matched `21/140/9/20/450/0`.
- Manifest parity passed for families, skills, aliases, relationships, contract mappings, and no-action counterparts.
- Family and skill metadata parity passed.
- Constraints, indexes, comments, RLS, policies, grants, role simulation, duplicate-review isolation, and rollback-only fail-closed probes passed.
- No remote Supabase, `supabase link`, `supabase db push`, or production deployment occurred.

RP-BETA-INTEGRATION-18 did not rerun local Supabase because no catalog migration, manifest, or RP-BETA-17 verification source changed before this prompt.

## E. Worktree Classification Summary

Tracked modified files before RP-BETA-INTEGRATION-18:

| File | Category | Future commit? | Risk | Owner review |
| --- | --- | --- | --- | --- |
| `src/types/index.ts` | RP-SKILLS TypeScript exports | yes | medium | yes |
| `supabase/migrations/202605130007_generation_providers_generated_assets.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180007_reeditpro_rls_policies.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql` | local migration-chain repair | yes, dedicated repair commit | high | yes |
| `type-contracts.md` | RP-SKILLS/RP-BETA docs note | yes | low | yes |

Untracked file groups before RP-BETA-INTEGRATION-18:

| Group | Count | Category | Future commit? | Risk | Owner review |
| --- | ---: | --- | --- | --- | --- |
| `docs/creative-skills/**` | `113` | RP-SKILLS architecture, contracts, reports, checklists, manifest docs | yes, split by commit group | medium | yes |
| `src/types/creative-skill*.ts` | `5` | RP-SKILLS TypeScript contracts | yes | medium | yes |
| `src/lib/mock-creative-skill-records.ts` | `1` | RP-SKILLS mock fixture | yes | medium | yes |
| `supabase/config.toml` | `1` | local-only Supabase config | yes, after owner review | high | yes |
| `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql` | `1` | Creative Skill catalog migration | yes | high | yes |
| `supabase/migrations/202606250002_creative_skill_catalog_canonical_seed.sql` | `1` | Creative Skill seed migration | yes | high | yes |
| `supabase/.branches/` and `supabase/.temp/` | `2` files | local Supabase side artifacts | no | high | yes before cleanup |

Unknown/unclassified files:

- none found in the RP-SKILLS repo inventory.

## F. Local Side Artifact Summary

Local Supabase side artifacts:

- `supabase/.branches/_current_branch`
- `supabase/.temp/cli-latest`

Classification:

- untracked local side artifacts.
- should remain untracked.
- should not be staged into RP-SKILLS commits.
- cleanup requires owner approval because these are local Supabase metadata files.

No obvious secret value was copied from these files into this report.

## G. Validation Results

Validation commands run in the RP-SKILLS repo:

| Command | Result | Notes |
| --- | --- | --- |
| `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check` | passed | no whitespace/diff hygiene errors |
| `npm run lint` | passed | ESLint completed successfully |
| `npm run smoke:beta-readiness` | passed | beta-readiness smoke passed |
| `npm run smoke:api` | passed | API smoke returned `ok: true` |
| `npm run smoke:sound-music-audio-contracts` | passed | provider calls disabled |
| `npm run smoke:sound-music-audio-planner` | passed | provider/worker/generated-asset actions disabled |
| `npm run tool-calling:worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation` | failed | policy mismatch: diagnostic rejects modified Supabase/migration files |

Scripts reviewed but absent:

- `check:supabase-command-safety`
- `smoke:supabase-command-safety`
- `check:frontend-boundary`
- Qwen-specific marker-chat scripts in this RP-SKILLS repo

## H. Build Result

`npm run build` failed.

Build blocker:

- `src/backend/services/sound-agent-planner-service.ts`

Sanitized error summary:

- missing `SoundAgentPlan` type references.
- implicit `any` parameters such as `cue` and `policy`.
- `string[]` assigned to `SoundTimingAnchor[]`.

Classification:

- primary beta merge blocker: `blocked_build_failure`.
- this matches the prior known build context and was not repaired in RP-BETA-INTEGRATION-18.

## I. Smoke And Check Result

Safe smoke checks passed:

- `smoke:beta-readiness`
- `smoke:api`
- `smoke:sound-music-audio-contracts`
- `smoke:sound-music-audio-planner`

Branch-specific tool-calling diagnostic failed because it enforces a policy that Supabase, SQL, or migration files must not be changed. The current RP-BETA branch intentionally contains reviewed local migration-chain repairs, so this diagnostic must be reconciled before owner-approved merge.

## J. Protected-File Hash Result

Protected hashes were captured before validation for:

- `supabase/config.toml`
- Creative Skill catalog migrations
- canonical manifest
- Creative Skill TypeScript contracts
- `src/types/index.ts`
- mock fixture
- package files

Protected hashes stayed unchanged during RP-BETA-INTEGRATION-18 validation and after the docs-only report updates.

## K. Beta-Readiness Decision

Decision:

- `blocked_build_failure`

Reason:

- Build fails on `src/backend/services/sound-agent-planner-service.ts`.

Secondary blockers:

- Qwen beta work remains in a separate dirty clone.
- Branch-specific tool-calling diagnostic rejects the intentional migration-chain repairs.

Do not stage, commit, merge, or push until the owner chooses the next blocker to resolve.

## L. Remaining Blockers

1. Build blocker:
   - `npm run build` fails on `src/backend/services/sound-agent-planner-service.ts`.
2. Qwen reconciliation blocker:
   - Qwen beta is not incorporated into this RP-SKILLS repo and remains dirty in a separate clone.
3. Validation policy blocker:
   - tool-calling diagnostic rejects modified Supabase/migration files.
4. Owner staging approval:
   - no staging or commit should happen until owner approves a commit execution prompt.
5. Remote deployment readiness:
   - no remote Supabase, staging, production, push, or deploy approval exists.

## M. Commit Grouping Plan

Future commits should be made only after owner approval.

1. `docs(skills): add creative skill planning architecture`
   - Include: Creative Skill architecture/planning contract Markdown files under `docs/creative-skills/`.
   - Exclude: beta verification reports, local Supabase side artifacts.
   - Risk: medium; large docs surface.
   - Owner review: required.

2. `types(skills): add creative skill contracts and fixtures`
   - Include: `src/types/creative-skill*.ts`, `src/types/index.ts`, `src/lib/mock-creative-skill-records.ts`.
   - Exclude: runtime service files.
   - Risk: medium; exported type surface.
   - Owner review: required.

3. `db(skills): add creative skill catalog manifest and migrations`
   - Include: canonical manifest plus `202606250001` and `202606250002` Creative Skill catalog migrations.
   - Exclude: local Supabase side artifacts.
   - Risk: high; database migration content.
   - Owner review: required.

4. `fix(db): repair local migration chain blockers`
   - Include: repaired pre-catalog migration files from `202605130007` through `202605200001`.
   - Exclude: Creative Skill catalog migrations.
   - Risk: high; compatibility migration repairs.
   - Owner review: required.

5. `chore(db): add local-only Supabase config`
   - Include: `supabase/config.toml`.
   - Exclude: `.branches`, `.temp`, secrets, remote refs.
   - Risk: high; local environment config.
   - Owner review: required.

6. `docs(beta): add integration readiness and verification handoff`
   - Include: RP-SKILLS/RP-BETA verification reports, checklists, README, implementation handoff, beta report, and `type-contracts.md` notes.
   - Exclude: local side artifacts.
   - Risk: low to medium.
   - Owner review: required.

7. Qwen beta commit group
   - Include: none in this RP-SKILLS repo yet.
   - Status: blocked until owner-approved cross-clone reconciliation.

## N. Merge Strategy

Recommended merge strategy after blockers are cleared:

- Repair or explicitly accept the build blocker first.
- Reconcile the tool-calling migration policy mismatch or document an owner-approved exception for the migration-chain repair commit.
- Decide Qwen scope before claiming end-to-end beta readiness.
- Stage only reviewed file groups, never `supabase/.branches/` or `supabase/.temp/`.
- Commit in the grouped order above.
- Create a local integration branch only after commits pass validation.
- Do not push or deploy without explicit owner approval.

Likely target branch remains the remote integration/base branch already used by earlier beta planning, but RP-BETA-INTEGRATION-18 did not fetch or merge, so the final target should be re-confirmed in the commit execution prompt.

## O. Files Excluded From Future Commits

Always exclude unless a later owner prompt explicitly says otherwise:

- `supabase/.branches/`
- `supabase/.temp/`
- Qwen clone files under `/Users/macuser/Developer/REeditpro`
- build outputs or local cache artifacts if any appear later
- secrets, credentials, tokens, local DB URLs, remote Supabase refs

## P. Owner Decisions Needed

Owner decisions required before staging/committing:

- Choose whether to repair the build blocker or accept it as a documented temporary blocker.
- Choose whether Qwen beta is in scope for this RP-SKILLS merge.
- Choose whether migration-chain repairs are allowed to be committed despite the branch diagnostic policy mismatch.
- Approve exact commit grouping and staging execution.
- Approve any future remote push, PR, deploy, or remote Supabase action separately.

## Q. Recommended Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-19 - Sound Agent Planner Build Repair`

Alternative only if owner explicitly accepts build/Qwen/tooling risks:

`RP-BETA-INTEGRATION-19 - Owner Staging Approval and Commit Group Execution`

## R. RP-BETA-INTEGRATION-19 Build Repair Update

RP-BETA-INTEGRATION-19 cleared the TypeScript build blocker from this report.

Decision:

- `sound_agent_build_repair_passed_with_warnings`

Repair summary:

- `src/backend/services/sound-agent-planner-service.ts` now imports the existing `SoundAgentPlan` type from `../../types/audio-music`.
- No shared type contracts, migrations, manifest, mocks, package files, Qwen clone files, provider code, worker code, UI, or runtime behavior changed.

Validation after repair:

- `npm run build`: passed.
- `npm run lint`: passed.
- `smoke:beta-readiness`: passed.
- `smoke:api`: passed.
- `smoke:sound-music-audio-contracts`: passed.
- `smoke:sound-music-audio-planner`: passed.

Updated readiness:

- The `blocked_build_failure` blocker is cleared.
- Remaining blockers are Qwen clone reconciliation, tool-calling diagnostic policy mismatch for intentional migration repairs, and owner-approved staging/commit/merge execution.

Recommended next prompt:

`RP-BETA-INTEGRATION-20 - Owner Staging Approval and Commit Group Execution`
