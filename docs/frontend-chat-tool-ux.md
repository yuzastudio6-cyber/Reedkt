# Frontend Chat Tool UX

Milestone 7 changes the default chat language from raw tool listings to edit activity summaries.

## User-Facing Rule

Guided chat must explain what will happen in the edit, what is ready, what is blocked, what it costs, what is running, what results exist, and what QA will check. It must not list exact execution tool names by default.

The user should see activity language such as:

- Source clip preparation
- On-screen text safety
- Audio timing and cleanup
- Color and image consistency
- Preview assembly
- Private artifact handoff
- Quality checks before delivery

Exact execution identifiers remain available only in developer review for audit/debugging.

## Cards

The chat activity UX exposes seven cards:

- Planned edit work
- What can run after approval
- Cost gate before work starts
- Progress
- Expected/private results
- Blockers and next action
- Quality checks before delivery

Each card stays tied to the existing approval, credit, privacy, artifact, idempotency, and backend-only gates. This UI change does not enable live provider calls, worker dispatch, real media processing, Supabase writes, billing mutation, external beta, or production execution.

## Validation

`npm run smoke:frontend-chat-tool-ux` verifies:

- all seven cards are generated;
- guided-card visible text hides raw execution names;
- developer mode preserves technical identifiers;
- cost approval remains required;
- blocker next action is present;
- result cards block unsafe public/signed URL artifact references.
