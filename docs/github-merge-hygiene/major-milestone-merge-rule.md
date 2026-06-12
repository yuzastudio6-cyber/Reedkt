# Major Milestone Merge Rule

Every major milestone PR must end in one explicit tracked state:

- `merged`
- `ready_for_merge_execution`
- `blocked_with_reason`
- `deferred_with_owner`
- `superseded_by_pr`
- `rejected_or_closed`

No major milestone may remain indefinitely open after downstream phases begin.

## Required Milestone Checklist

Each milestone PR or results doc must record:

- branch pushed
- PR opened
- draft state and reason, if draft
- validation commands and outcomes
- artifact paths or `not_applicable`
- Supabase classification
- package-lock status
- mergeability status
- downstream retargeting plan
- merged state or reason not merged
- superseding PR, if any
- cross-chat impact, if any

## Merge Execution Rule

Merge execution is a separate human-approved action. A merge executor must recheck state immediately before each merge, confirm non-draft status, confirm mergeability, confirm checks/reviews, merge exactly one PR at a time, wait for GitHub to update the downstream base, then retarget or recheck the next PR.

## Safety Rule

Merge hygiene must never unlock runtime behavior. It must not run providers, tools, workers, routes, media, browser capture, map rendering, SQL, migrations, Supabase writes, Google Cloud APIs, Secret Manager APIs, production, external beta, public artifacts, signed URLs, or raw prompts.
