# Supabase Function Search Path Hardening Plan

Prompt 26A reported mutable `search_path` warnings. Prompt 26B records a future hardening plan only.

## Candidate Functions

| Function | Domain | Future hardening pattern | Status |
| --- | --- | --- | --- |
| `can_claim_worker_job` | worker/job runtime | Review body, qualify references, set fixed search path. | Candidate only. |
| `can_start_generation` | generation gate | Review approval/credit dependencies and set fixed search path. | Candidate only. |
| `prevent_approved_plan_snapshot_immutable_update` | approved snapshot trigger | Preserve immutability semantics and set fixed search path. | Candidate only. |
| `can_run_job` | job runtime | Qualify job/dependency references and set fixed search path. | Candidate only. |
| `can_create_approved_plan_snapshot` | snapshot approval | Qualify approval/snapshot references and set fixed search path. | Candidate only. |
| `active_worker_claim_exists` | worker claim runtime | Qualify claim/lease references and set fixed search path. | Candidate only. |
| `e2e_jsonb_has_secret_like_content` | E2E/test helper | Review whether production schema exposure is intended. | Candidate only. |
| `e2e_assert_safe_json` | E2E/test helper | Review grants and fixed search path. | Candidate only. |
| `e2e_json_contains_secret_marker` | E2E/test helper | Review grants and fixed search path. | Candidate only. |

## Future Migration Rules

- Preserve existing signatures unless a compatibility plan exists.
- Add fixed search path in reviewed `create or replace function` statements.
- Qualify schema references inside function bodies.
- Confirm no function owner or grant behavior changes accidentally.
- Validate local migration chain before staging.

## Prompt 26B Decision

No function definition is changed in Prompt 26B.
