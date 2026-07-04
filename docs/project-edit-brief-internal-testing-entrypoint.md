# Project Edit Brief Internal Testing Entrypoint

## Decision

`project_edit_brief_internal_testing_entrypoint_passed_ready_for_repeated_internal_testing`

## Summary

RP-EDITBRIEF-23 adds the missing `/internal-testing` app route as a production-shaped mock/internal testing console. The route uses the existing `internalTestingScenarios` registry, links to the Project Home, Edit Chat, and Edit Brief session paths, summarizes scenario readiness, and records browser-local feedback that can be exported as JSON for follow-up PRs.

This is not a shortcut or throwaway testing surface. It keeps the same project/session and route seams that later release work can graduate through evidence, owner approval, persistence, and runtime gates.

## Connected Routes

- `/internal-testing`
- `/projects/mock-project-edit-chat-foundation`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/chat`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief`

## Boundaries

- No upload or file-byte read.
- No provider/model call.
- No worker dispatch.
- No media processing.
- No render/export.
- No credit reservation or spend.
- No live Supabase read/write, Storage, signed URL, SQL, or migration.
- No external beta, real-user-media beta, paid production, or product-ready claim.

## Validation

Required validation:

- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run smoke:project-edit-brief-internal-testing-completion-audit`
- `npm run smoke:project-edit-brief-internal-testing-review-pr-readiness`
- `npm run smoke:project-edit-brief-internal-testing-readback-qa`
- `npm run smoke:project-edit-brief-e2e`
- `npm run smoke:project-edit-brief-production-readiness-gates`
- `npm run smoke:beta-readiness`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Next

Use `/internal-testing` for repeated internal QA and source-truth feedback capture. The next real product milestones remain authenticated project/session access, planner integration into approved snapshots, credit estimate/reservation integration, and explicit runtime/persistence gates.
