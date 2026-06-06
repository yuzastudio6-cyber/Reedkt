# Supabase Function Search Path Draft Remediation Packet

Prompt 26C records a future remediation packet for mutable function `search_path` warnings. Prompt 26F extends it with a migration-planning contract. No function definition is changed in Prompt 26F.

## Status

- Draft status: `draft_only`.
- Function search path migration plan status: `function_search_path_migration_plan_created`.
- Function search path hardening applied: no.
- SQL executed: none.
- Active migration created: no.
- Supabase environment touched: none.
- Migration deployed: no.

No function definition is changed in Prompt 26C.

## Functions For Future Review

| Function | Draft concern | Future remediation direction |
| --- | --- | --- |
| `can_claim_worker_job` | Worker helper should resolve only intended schemas. | Add fixed search path and schema-qualified references after body review. |
| `can_start_generation` | Generation helper can interact with plan/credit/provider gates. | Review dependencies before fixed search path migration. |
| `prevent_approved_plan_snapshot_immutable_update` | Trigger helper protects immutable snapshots. | Preserve trigger behavior while locking search path. |
| `can_run_job` | Job helper may depend on worker/job tables. | Review table references and set deterministic path. |
| `can_create_approved_plan_snapshot` | Approval helper may depend on credit/project membership. | Review body before function replacement. |
| `active_worker_claim_exists` | Worker lease helper may depend on runtime tables. | Review concurrency semantics before change. |
| `e2e_jsonb_has_secret_like_content` | E2E safety helper should remain deterministic. | Add fixed path only after confirming helper remains test-only. |
| `e2e_assert_safe_json` | E2E safety helper should not resolve unexpected functions. | Add fixed path and schema qualification in future draft. |
| `e2e_json_contains_secret_marker` | E2E safety helper should remain isolated. | Add fixed path only after test helper status is confirmed. |

## Draft Direction

Future remediation should:

- Preserve function signatures unless a compatibility plan says otherwise.
- Preserve parameter names, return type, volatility, owner expectations, grants, and existing security mode unless separately reviewed.
- Use explicit schema qualification for table and helper references.
- Prefer fixed empty search path with schema-qualified references after reviewing each body.
- Pair changes with local migration-chain validation before any staging review.
- Keep service-role behavior backend-only and never browser-visible.

## Blockers

- Function bodies must be reviewed before drafting executable replacements.
- Some functions may be trigger helpers or policy dependencies; careless replacement can break RLS.
- Prompt 23 remains `pending_human_approval`.
- Prompt 24D accepted evidence is missing.
- GCP Secret Manager reference evidence is incomplete.

## Draft Sketch

Review-only search-path sketch: `docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md`.

## Prompt 26F Planning Files

- `docs/supabase-function-search-path-migration-plan.md`
- `docs/supabase-function-search-path-signature-preservation-contract.md`
- `docs/supabase-function-search-path-schema-qualification-checklist.md`
- `docs/supabase-function-search-path-future-test-matrix.md`
- `docs/supabase-function-search-path-rollback-cleanup-plan.md`
- `docs/supabase-function-search-path-staging-evidence-requirements.md`
