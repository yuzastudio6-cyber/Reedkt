# Supabase Function Search Path Signature Preservation Contract

Prompt 26F preserves function signatures as a planning rule. No live function definitions are fetched and no function is altered.

Contract status: `signature_preservation_planned`.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Preservation Rule

Future search-path hardening must preserve:

- Function name.
- Argument types and argument order.
- Parameter names.
- Return type.
- Language.
- Volatility and leakproof attributes when present.
- `SECURITY DEFINER` or `SECURITY INVOKER` semantics.
- Owner/grant behavior unless separately reviewed.
- Trigger or policy dependency behavior.

Prompt 20N already showed that PostgreSQL treats some function replacement details, such as parameter names, as compatibility-sensitive. Future function hardening must avoid broad replacement patterns that accidentally break existing policy, trigger, or application dependencies.

## Function Contract Matrix

| Function | Signature evidence status | Security mode handling | Parameter-name handling | Future action |
| --- | --- | --- | --- | --- |
| `can_claim_worker_job` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Review source before local candidate. |
| `can_start_generation` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Review source before local candidate. |
| `prevent_approved_plan_snapshot_immutable_update` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Confirm trigger dependencies before local candidate. |
| `can_run_job` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Review source before local candidate. |
| `can_create_approved_plan_snapshot` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Review source before local candidate. |
| `active_worker_claim_exists` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Review source before local candidate. |
| `e2e_jsonb_has_secret_like_content` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Confirm test-helper exposure before local candidate. |
| `e2e_assert_safe_json` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Confirm test-helper exposure before local candidate. |
| `e2e_json_contains_secret_marker` | `signature_evidence_required` | Preserve existing mode. | Preserve existing names. | Confirm test-helper exposure before local candidate. |

## Forbidden In Prompt 26F

Prompt 26F does not drop functions, recreate functions, change grants, change owners, alter policies, add indexes, create active migrations, run SQL, or touch any Supabase environment.
