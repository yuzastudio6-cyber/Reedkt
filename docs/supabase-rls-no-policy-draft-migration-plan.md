# Supabase RLS No-Policy Draft Migration Plan

Prompt 26E converts the Prompt 26D RLS no-policy classification contract into a draft migration plan. This is a planning artifact only. It is not an active migration, not executable SQL, not a Supabase update, and not staging approval.

Supabase reference principle: tables in exposed schemas, including `public` by default, require explicit RLS and policy thinking. `anon`, `authenticated`, and `service_role` behavior must be considered separately before any future policy is written.

## Status

- Draft migration plan status: `rls_no_policy_draft_migration_plan_created`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Active migration files changed: no.
- Production capability enabled: none; RLS no-policy draft migration plan only.

## Source Classification

| Table | Prompt 26D access model | Draft migration direction |
| --- | --- | --- |
| `activation_artifacts` | `backend_service_role_only` | Future policy set keeps raw table unavailable to `anon` and normal `authenticated` users; backend/service-role behavior remains documented only until implementation review. |
| `activation_qa_gates` | `backend_service_role_only` | Future policy set keeps raw gate records backend-only; any customer-visible summary must be a separate redacted API/view contract. |
| `activation_runs` | `backend_service_role_only` | Future policy set keeps raw run lifecycle and operator data backend-only; project/workspace status visibility requires separate review. |
| `feature_gates` | `no_client_access` | Future policy set keeps raw feature-gate rows hidden from clients; safe summary visibility must avoid entitlement, beta, rollout, or production-unlock leakage. |
| `readiness_snapshots` | `backend_service_role_only` | Future policy set keeps raw readiness evidence backend-only; redacted snapshot visibility requires evidence review and immutability checks. |
| `tool_capabilities` | `no_client_access` | Future policy set keeps raw tool capability rows hidden; a static catalog route may expose only non-secret, non-runtime-enable fields after review. |

## Future Migration Goals

- Convert the six RLS-enabled/no-policy advisor findings into reviewed, additive policy SQL in a later prompt.
- Keep `anon` denied for all six raw tables unless a future human-reviewed static catalog model explicitly changes that for a non-sensitive surface.
- Keep normal `authenticated` users denied from raw tables under the current Prompt 26D classification.
- Keep writes backend/service-role-only through reviewed server boundaries, not frontend clients.
- Require helper/function, column, grant, and index review before executable migration SQL exists.

## Future Migration Non-Goals

- Do not expose activation, readiness, feature-gate, or tool-capability raw tables directly to frontend clients.
- Do not use this draft to create active policies, grants, function changes, indexes, or migration files.
- Do not use raw Secret Manager values, project refs, signed URLs, private media, provider keys, Stripe keys, or production data in policy tests.
- Do not treat service-role behavior as frontend-safe or browser-visible.

## Prerequisites Before Implementation

| Gate | Requirement | Current state |
| --- | --- | --- |
| Table schema evidence | Required columns, nullable behavior, grants, and ownership columns are confirmed from accepted evidence or approved local schema inspection. | Pending. |
| Helper review | Workspace/project helper functions are reviewed for SECURITY DEFINER exposure and fixed `search_path`. | Pending. |
| Index review | Predicate and join columns have an index/performance review. | Pending. |
| Policy review | Each future policy name and access model is approved. | Pending. |
| Local test design | Synthetic local denial tests are implemented in a future prompt. | Pending. |
| Staging gates | Human approval, accepted evidence, target identity, Secret Manager references, dry-run packet, and cleanup/rollback owners are complete. | Pending. |

## Recommended Future Prompt

Prompt 26E-1 - RLS No-Policy Local Draft Migration Implementation, if RLS policy migration design proceeds after review. If RLS policy migration waits, use Prompt 26F - Function Search Path Hardening Migration Plan.
