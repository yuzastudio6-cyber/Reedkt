# RP-BETA-INTEGRATION-19 Sound Agent Planner Build Repair

## A. Purpose

RP-BETA-INTEGRATION-19 repairs the beta merge-readiness build blocker reported by RP-BETA-INTEGRATION-18.

Repair decision:

- `sound_agent_build_repair_passed_with_warnings`

The warning is that this clears the TypeScript build blocker only. Qwen clone reconciliation, commit staging approval, and the tool-calling diagnostic policy mismatch remain separate beta-readiness blockers.

## B. Original Build Blocker

`npm run build` failed in `src/backend/services/sound-agent-planner-service.ts`.

Sanitized reproduced errors:

- `Cannot find name 'SoundAgentPlan'`.
- Cascading implicit `any` callback parameters for cue and policy callbacks.
- Cascading `string[]` versus `SoundTimingAnchor[]` mismatch in the timing-aware cue manifest builder.

## C. Files Inspected

Inspected:

- `src/backend/services/sound-agent-planner-service.ts`
- `src/types/audio-music.ts`
- `src/types/index.ts`
- `server/smoke/sound-music-audio-contracts-smoke.ts`
- `server/smoke/sound-music-audio-planner-smoke.ts`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`
- `docs/creative-skills/end-to-end-beta-merge-readiness-and-commit-plan.md`
- `type-contracts.md`
- `package.json`

`SoundAgentPlan` already exists as an exported interface in `src/types/audio-music.ts`.

## D. Root Cause

The service used `SoundAgentPlan` in exported helper signatures and local plan assembly, but did not import the existing shared type.

Because those function parameters were unresolved, TypeScript could not infer the `plan.cuePlans` and `plan.providerPolicies` callback item types. That produced the implicit `any` errors and the apparent `SoundTimingAnchor[]` mismatch.

## E. Repair Strategy

The narrowest repair was to import the existing shared `SoundAgentPlan` from `../../types/audio-music`.

No local duplicate type, shared type change, cast, `any`, `ts-ignore`, service rewrite, provider integration, worker behavior, or runtime behavior was added.

## F. Files Changed

Code changed:

- `src/backend/services/sound-agent-planner-service.ts`

Docs created:

- `docs/creative-skills/sound-agent-planner-build-repair.md`
- `docs/creative-skills/sound-agent-planner-build-repair-checklist.md`

Docs updated:

- `docs/creative-skills/README.md`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`
- `docs/creative-skills/end-to-end-beta-merge-readiness-and-commit-plan.md`
- `type-contracts.md`

## G. Type-Safety Notes

No `any`, `@ts-ignore`, or `@ts-expect-error` was introduced.

The existing `SoundAgentPlan` type restored inference for:

- `SoundCuePlan` callback parameters.
- `SoundProviderPolicy` callback parameters.
- `TimingAwareSoundCueManifest.timingAnchors` as `SoundTimingAnchor[]`.

## H. Validation Results

Validation run:

- `npm run build`: passed.
- `npm run lint`: passed.
- `npm run smoke:beta-readiness`: passed.
- `npm run smoke:api`: passed.
- `npm run smoke:sound-music-audio-contracts`: passed.
- `npm run smoke:sound-music-audio-planner`: passed.

Final repository checks are recorded in the RP-BETA-INTEGRATION-19 checklist.

## I. Build Result

Build result:

- `passed`

`npm run build` completed `tsc -b` and `vite build`. Vite reported the existing large chunk warning, but the command exited successfully.

## J. Smoke And Check Result

Safe smokes passed:

- `smoke:beta-readiness`
- `smoke:api`
- `smoke:sound-music-audio-contracts`
- `smoke:sound-music-audio-planner`

The sound/music planner smoke still reports:

- provider calls disabled
- worker dispatch disabled
- generated asset creation disabled
- private storage scope
- public artifact blocked

## K. Remaining Blockers

Remaining blockers:

- Qwen beta remains in a separate dirty clone at `/Users/macuser/Developer/REeditpro`.
- The branch tool-calling diagnostic still needs an owner decision or allowlist plan because it rejects modified Supabase/migration files, including intentional migration-chain repairs.
- Owner-approved staging, commit grouping, merge, push, deployment, and remote Supabase actions have not been performed.

## L. Qwen Clone Status

Qwen was not touched.

RP-BETA-INTEGRATION-18 remains the current Qwen baseline:

- Qwen is a separate clone of the same remote.
- Qwen is dirty and unreconciled with this RP-SKILLS repo.
- No Qwen files were copied, staged, committed, or merged in RP-BETA-INTEGRATION-19.

## M. Protected-File Hash Result

Protected hash comparison was run for the protected file set after the code repair and after the docs/validation pass.

Protected files remained unchanged during RP-BETA-INTEGRATION-19:

- all `supabase/migrations/*.sql`
- `supabase/config.toml`
- Creative Skill canonical seed manifest
- Creative Skill TypeScript contracts
- Creative Skill mock fixture
- package files

The intentional non-protected code change was limited to `src/backend/services/sound-agent-planner-service.ts`.

## N. No-Stage, No-Commit, No-Merge Confirmation

No staging, commit, merge, push, deploy, remote Supabase command, provider call, worker execution, render/export, package install, Qwen mutation, or app-runtime behavior occurred.

## O. Recommended Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-20 - Owner Staging Approval and Commit Group Execution`

Alternative if the owner wants to address the validation-policy mismatch first:

`RP-BETA-INTEGRATION-20 - Tool-Calling Diagnostic Migration Repair Allowlist Decision`
