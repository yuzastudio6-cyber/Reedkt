# Supabase Function Search Path Migration Plan

Prompt 26F creates a draft-only migration plan for mutable function `search_path` advisor findings supplied in Prompt 26A. It does not inspect live Supabase function definitions, does not create an active migration, and does not change any function.

Function search path migration plan status: `function_search_path_migration_plan_created`.
Supabase update required: docs/status only.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.
Active migration files changed: no.
Production capability enabled: none; function search_path hardening migration plan only.

## Sources

- Prompt 26A supplied connected read-only advisor findings for redacted project `wmyy****ishd`.
- Supabase Performance and Security Advisors identify mutable function `search_path` as a security finding to review.
- Supabase database function guidance recommends fixed `search_path` and schema-qualified object references in functions.
- Supabase RLS guidance remains relevant because helper functions can become policy dependencies; exposed-schema policy behavior must remain role-scoped for `anon`, `authenticated`, and backend/service-role paths.

## In Scope

The plan covers exactly these functions:

| Function | Connected advisor category | Planning status | Future migration posture |
| --- | --- | --- | --- |
| `can_claim_worker_job` | Mutable `search_path` | Candidate for future local migration design. | Preserve worker claim behavior, signature, security mode, and concurrency assumptions while fixing the search path. |
| `can_start_generation` | Mutable `search_path` | Candidate for future local migration design. | Preserve approval, credit, provider-gate, and generation-start semantics. |
| `prevent_approved_plan_snapshot_immutable_update` | Mutable `search_path` | Candidate for future local migration design. | Preserve trigger behavior and approved snapshot immutability. |
| `can_run_job` | Mutable `search_path` | Candidate for future local migration design. | Preserve job runtime gating and dependency semantics. |
| `can_create_approved_plan_snapshot` | Mutable `search_path` | Candidate for future local migration design. | Preserve snapshot creation authorization behavior. |
| `active_worker_claim_exists` | Mutable `search_path` | Candidate for future local migration design. | Preserve worker claim lookup semantics. |
| `e2e_jsonb_has_secret_like_content` | Mutable `search_path` | Candidate for future local migration design. | Preserve E2E safety helper behavior and test-only intent. |
| `e2e_assert_safe_json` | Mutable `search_path` | Candidate for future local migration design. | Preserve JSON safety assertion behavior and test-only intent. |
| `e2e_json_contains_secret_marker` | Mutable `search_path` | Candidate for future local migration design. | Preserve secret marker detection behavior and test-only intent. |

## Future Migration Rules

Future implementation must:

- Preserve function name, argument types, return type, parameter names, volatility, language, owner expectations, grants, and `SECURITY DEFINER` or `SECURITY INVOKER` mode unless a separate reviewed prompt approves a change.
- Prefer a fixed empty search path with fully schema-qualified references when the reviewed function body supports it.
- Allow a reviewed minimal fixed path only when body evidence proves it is required, and document every schema in that path.
- Schema-qualify all table, view, helper function, type, extension, and auth references used inside the function body.
- Avoid grant changes, policy changes, table/index changes, service-role handler changes, and runtime execution changes in the search-path migration candidate.
- Preserve Supabase RLS guidance: service-role material stays backend-only and browser-inaccessible; `anon` and `authenticated` behavior must be verified separately when helper functions influence policies.

## Required Future Gates

Prompt 26F does not satisfy these gates:

| Gate | Required before execution | Prompt 26F status |
| --- | --- | --- |
| Function body source evidence | Capture source-controlled or local/staging-read-only function definitions with secrets redacted. | Missing. |
| Signature preservation review | Confirm names, argument types, parameter names, return types, security mode, volatility, grants, and trigger dependencies. | Planned only. |
| Local migration candidate | Create an active local migration candidate in a future prompt. | Not created. |
| Local validation | Run local migration chain and behavior tests when the local environment is safe. | Not run. |
| Accepted Supabase evidence | Review redacted evidence files and Secret Manager reference metadata. | Missing. |
| Human approval | Complete the human approval path for staging execution. | Prompt 23 remains `pending_human_approval` on this base. |
| Staging validation | Run only after approval, accepted evidence, approved PR/commit/test set, fixture plan, and rollback/cleanup gates pass. | Not run. |

## Handoff

Cross-chat owner remains `SUPABASE_RLS_STORAGE_DATABASE`. Related workstreams receive this as a planning handoff only: `WORKER_RUNTIME_JOBS`, `PROVIDER_GATEWAY_MODELS`, `AI_TOOLS_CREATIVE_GRAPHICS`, `SOUND_MUSIC_AUDIO`, `MAP_GEOSPATIAL`, `TRACK_A_RENDER_EXPORT`, `OBSERVABILITY_AUDIT_COST`, and `COMPLIANCE_SECURITY`.

## Next Prompt

Recommended next prompt: `Prompt 26F-1 - Function Search Path Local Migration Candidate` if function hardening proceeds, or `Prompt 26G - SECURITY DEFINER Exposure Migration Plan` if security-definer review is prioritized.
