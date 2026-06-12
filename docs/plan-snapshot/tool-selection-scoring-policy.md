# Tool Selection Scoring Policy

Status: `ready_for_owner_review`.

This policy defines how a future approved plan snapshot should rank candidate tools. It does not choose, install, execute, or approve any tool.

## Scoring Inputs

Future scoring should consider:

- intent fit
- exactness requirement
- source-of-truth requirement
- package/runtime availability
- license/security status
- privacy and artifact scope
- deterministic QA feasibility
- worker readiness
- cost and token budget
- fallback behavior
- owner-workstream approval state

## Required Disqualifiers

A candidate must be blocked when it requires any unapproved use:

- raw prompt execution
- worker execution
- tool execution
- route execution
- provider runtime
- Supabase mutation
- SQL execution
- storage transfer
- signed URL as source of truth
- public artifact creation
- production or beta unlock

## Score Output

Every scored candidate should produce:

- `candidateToolRef`
- `capabilityMatch`
- `readinessState`
- `requiredEvidence`
- `blockedUses`
- `ownerWorkstream`
- `selectedForFuturePrompt`
- `selectionRationale`

PLAN-SNAPSHOT-0 sets no final selected tool. The future `selectedToolPlan` remains a placeholder until owner review.

No Secret Manager payloads, raw provider responses, raw prompts, private URLs, signed URLs, public artifacts, provider calls, worker execution, tool execution, route execution, Supabase mutation, SQL execution, storage transfer, beta unlock, or production unlock were enabled.
