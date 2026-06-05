# Connected Supabase Function Search Path Triage

The connected read-only audit reported mutable `search_path` warnings for helper/runtime functions. Prompt 26A records the finding only and does not alter functions or execute SQL.

## Why Search Path Matters

Functions that rely on the caller/session search path can resolve object names unexpectedly. A future hardening migration should set a fixed safe search path and qualify schema references where needed.

## Function Inventory

| Function | Likely domain | Risk | Future hardening pattern | Prompt 26A action |
| --- | --- | --- | --- | --- |
| `can_claim_worker_job` | worker/job runtime | Worker claim checks must not resolve spoofed objects. | Review body, qualify table references, set a fixed search path. | record only |
| `can_start_generation` | generation gate | Generation gates must not bypass approval/credit checks. | Review body, qualify references, set fixed search path. | record only |
| `prevent_approved_plan_snapshot_immutable_update` | approved snapshot trigger | Immutability trigger must be deterministic. | Review trigger helper and set fixed search path. | record only |
| `can_run_job` | job runtime | Runtime checks must remain canonical and safe. | Review body, qualify references, set fixed search path. | record only |
| `can_create_approved_plan_snapshot` | snapshot approval | Snapshot creation checks must preserve approval gates. | Review body, qualify references, set fixed search path. | record only |
| `active_worker_claim_exists` | worker claim runtime | Claim checks must not be spoofable. | Review body, qualify references, set fixed search path. | record only |
| `e2e_jsonb_has_secret_like_content` | E2E/test helper | Test helpers should not become production-exposed bypasses. | Review schema/grants and fixed search path. | record only |
| `e2e_assert_safe_json` | E2E/test helper | Test helpers should remain non-production or tightly scoped. | Review schema/grants and fixed search path. | record only |
| `e2e_json_contains_secret_marker` | E2E/test helper | Test helpers should not expose secret scanning internals broadly. | Review schema/grants and fixed search path. | record only |

## Safe Future Pattern

Future hardening should prefer reviewed migrations that:

- qualify schema references;
- set a fixed search path;
- preserve existing signatures unless a reviewed compatibility plan exists;
- validate local and staging behavior before production;
- avoid broad grant changes without function-by-function review.

## Current Decision

Prompt 26A does not create SQL or migrations. Prompt 26B should plan the hardening sequence.

