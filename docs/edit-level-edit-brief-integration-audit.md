# Edit Level Edit Brief Integration Audit

## Current Edit Brief Behavior

Edit Brief exists as an optional local/mock direction layer after Footage Prep and Clean Assembly. It is represented by:

- `docs/reeditpro-production-workflow/03-edit-brief-and-edit-cues.md`
- `src/types/edit-brief.ts`
- `src/components/editor/edit-brief/*`
- `src/hooks/useEditBrief.ts`
- `src/lib/planning/build-planning-context.ts`
- `src/lib/planning/mock-edit-plan-from-context.ts`

When absent, Planning Context currently creates an info-level issue: "No Edit Brief has been added." It does not block planning.

## Future Level Policy

| Future level | Edit Brief policy | Marker priority behavior | QA strictness | Plan hint expectation |
| --- | --- | --- | --- | --- |
| Normal | Optional. | Use markers/cues only when present and clear. | Basic QA, still professional. | Safe defaults and direct user instructions are enough. |
| Premium | Recommended. | Prioritize Edit Brief markers and marker windows when present. | Premium QA with stronger style and cue compliance checks. | Brief should improve pacing, captions, music, B-roll, and style consistency. |
| Ultra Premium | Strongly recommended. | Treat Edit Brief markers as high-priority planning inputs unless blocked by safety/tier/frame rules. | Strict QA with deeper cue compliance, visual/design, audio, and fallback checks. | Missing brief should create a planning warning and degraded capability notice. |

## Gaps

- No level-aware readiness policy exists for Edit Brief.
- No level-specific degraded capability copy exists.
- Requested `docs/project-edit-brief-*` docs were missing in this checkout.

## Recommendation

Reuse the existing Edit Brief state, readiness, and Planning Context bridge. Add `editBriefPolicy` to the future `EditLevelProfile`; do not make Edit Brief a hard blocker in this report-only milestone.
