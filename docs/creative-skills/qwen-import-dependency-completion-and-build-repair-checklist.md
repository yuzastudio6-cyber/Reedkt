# RP-BETA-INTEGRATION-27 Checklist

## Approval

- [x] Treat the RP-BETA-INTEGRATION-27 implementation request as local repair approval.
- [x] Do not treat it as approval to push, merge, deploy, run remote Supabase, call providers, or mutate the Qwen clone.

## Import Scope

- [x] Import only the listed Qwen/Project Edit Brief dependency files.
- [x] Inspect imported files as Qwen/Project Edit Brief scoped.
- [x] Avoid broad directory copies.
- [x] Keep the Qwen clone read-only.
- [x] Stop if dependency scope expands into unrelated Qwen work.

## Compatibility Repairs

- [x] Patch only Qwen/Project Edit Brief files or target compatibility surfaces needed for validation.
- [x] Add missing mock database collections only for Project Edit Brief marker-chat records.
- [x] Add only surfaced Qwen/Project Edit Brief error-code literals.
- [x] Avoid `any`, `@ts-ignore`, duplicate broad contracts, provider calls, worker behavior, or planner rewrites.
- [x] Keep package files unchanged.

## Protected Boundaries

- [x] No Supabase config changes.
- [x] No migration changes.
- [x] No Creative Skill manifest changes.
- [x] No Creative Skill contract or mock fixture changes.
- [x] No package install or package mutation.
- [x] No provider/runtime/worker/render/export execution.
- [x] No remote Supabase command.

## Validation

- [x] `git diff --check`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run check:qwen-secret-leakage`
- [x] `npm run smoke:qwen-runtime-boundary`
- [x] `npm run check:qwen-runtime-boundary`
- [x] `npm run smoke:qwen-marker-chat-bridge`
- [x] `npm run smoke:project-edit-brief-marker-chat`
- [x] `npm run check:frontend-boundary`
- [x] `npm run smoke:supabase-command-safety`
- [x] `npm run check:supabase-command-safety`
- [x] `npm run smoke:beta-readiness`
- [x] `npm run smoke:api`
- [x] `npm run smoke:sound-music-audio-contracts`
- [x] `npm run smoke:sound-music-audio-planner`

## Fail Cases

- [x] Fail if broad Qwen dirty files are copied.
- [x] Fail if Qwen clone is staged, committed, reset, cleaned, or otherwise mutated.
- [x] Fail if package changes are required outside the approved Qwen package surface.
- [x] Fail if provider calls, gcloud commands, Supabase remote commands, workers, renders, or credit/approval effects occur.
- [x] Fail if protected hashes drift.
- [x] Fail if final validation leaves staged files.

## Decision

- [x] Decision recorded as `qwen_dependency_completion_passed_with_warnings`.
- [x] Next prompt recorded as `RP-BETA-INTEGRATION-28 - Final Beta Merge Readiness Review`.
