# RP-BETA-INTEGRATION-19 Sound Agent Planner Build Repair Checklist

## Required Checks

- [x] Original build blocker reproduced.
- [x] Sound-agent service inspected.
- [x] Related audio/music types inspected.
- [x] Existing `SoundAgentPlan` found in `src/types/audio-music.ts`.
- [x] Narrow repair chosen.
- [x] No duplicate local `SoundAgentPlan` interface added.
- [x] No `any` introduced.
- [x] No `@ts-ignore` introduced.
- [x] No `@ts-expect-error` introduced.
- [x] No package changes.
- [x] No migration changes.
- [x] No Supabase config changes.
- [x] No Creative Skill manifest changes.
- [x] No Creative Skill contracts or mocks changed.
- [x] No Qwen clone mutation.
- [x] `npm run build` passed.
- [x] `npm run lint` passed.
- [x] `npm run smoke:beta-readiness` passed.
- [x] `npm run smoke:api` passed.
- [x] `npm run smoke:sound-music-audio-contracts` passed.
- [x] `npm run smoke:sound-music-audio-planner` passed.
- [x] Protected hashes checked.
- [x] No files staged.
- [x] No commit created.
- [x] No merge performed.
- [x] No remote Supabase command run.
- [x] No provider call run.
- [x] No worker execution run.

## Fail Cases

Fail this repair if any of these occur:

- Package files change.
- Migrations change.
- Supabase config changes.
- Creative Skill manifest changes.
- Creative Skill contracts or mocks change.
- Build error is hidden with `any`.
- `@ts-ignore` or `@ts-expect-error` is added.
- Provider call is run.
- Worker execution is run.
- Qwen clone is mutated.
- Files are staged.
- Commit is created.
- Merge or push occurs.
- Remote Supabase command is run.

## Decision

Decision:

- `sound_agent_build_repair_passed_with_warnings`

The build blocker is cleared. Remaining warnings are outside this narrow TypeScript repair: Qwen reconciliation, tool-calling diagnostic policy mismatch, and owner-approved staging/commit/merge execution.
