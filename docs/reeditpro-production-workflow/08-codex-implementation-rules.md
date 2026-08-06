# Codex Implementation Rules

Codex should implement ReeditPro like a production team, not like a UI-only prototype.

## Rules

1. Implement end-to-end production-shaped systems, not isolated UI demos.
2. Do not require human decisions unless credentials, passwords, billing, deployment access, provider keys, Supabase access, storage credentials, or external account authorization are needed.
3. Do not bypass approval gates for expensive generation.
4. Do not mutate approved plans without creating a revision or new plan version.
5. Do not destroy raw footage.
6. Do not let Edit Cues go directly to render.
7. Do not store secrets in frontend code, migrations, seed files, or docs.
8. Prefer typed contracts before UI.
9. Prefer database-backed records over hidden local state for production flows.
10. Every async job must have status, progress events, retry behavior, and failure recovery.
11. Every user-visible AI action should create an activity/progress event.
12. Every preview must pass QA before it is marked ready.
13. Every post-preview edit should become an Edit Operation.
14. Every credit-costing action must be estimated and approved first.
15. Every generated preview should be traceable back to source assets, clean assembly segments, edit cues, professional integration decisions, render inputs, and QA results.
16. UI should make the user feel informed, not stuck.
17. Mock runtimes must use production-shaped records and APIs so they can be replaced later.
18. Real provider integration should happen after records, gates, state machines, and mock E2E flows exist.

## Ask The User Only For

- Supabase project access
- environment variables
- provider API keys
- storage credentials
- billing/credit provider access
- deployment credentials
- passwords or account login
- external service authorization

## Recommended Implementation Order After Milestone 1

1. Shared TypeScript contracts
2. Mock Footage Prep runtime
3. Footage Prep UI
4. Clean Assembly data layer
5. Cleanup review controls
6. Source Library roles
7. Edit Brief UI
8. Edit Cue UI
9. Cue remapping and conflicts
10. Planner consumes Clean Assembly + Brief + Cues
11. Professional Integration planner
12. QA expansion
13. Database migrations RP-DB-11 through RP-DB-15
14. API contracts
15. Worker orchestration
16. Activity log
17. Credit/approval gates
18. End-to-end mock scenario
19. Production readiness tests
20. Real provider/render integration
