# Supabase RLS No-Policy Policy Dependency Matrix

Prompt 26E records dependencies that must be confirmed before future RLS policy SQL exists. It does not inspect or mutate Supabase.

## Status

- Dependency matrix status: `rls_no_policy_dependencies_planned`.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.

| Table | Required columns | Required helper functions | Required joins | Required indexes | Ownership/scope context | Unknown dependencies | Blocker if missing | Migration readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `activation_artifacts` | `id`; artifact type/status; created timestamp; any `workspace_id`, `project_id`, `activation_run_id`, or sensitivity fields. | None for raw deny/client-hidden model; future summaries may need project/workspace helpers. | None for current raw deny model. | Primary key plus future run/project lookup indexes after schema review. | Backend/runtime activation ownership; project/workspace scope unconfirmed. | Whether rows contain private payloads, generated artifacts, or operator metadata. | Do not create user read policy until sensitivity and scope are confirmed. | Not ready for executable migration. |
| `activation_qa_gates` | `id`; gate key/status/result; timestamps; any `activation_run_id`, `project_id`, or `workspace_id`. | None for raw deny/client-hidden model; future summaries may need project membership helper. | None for current raw deny model. | Primary key plus run/project lookup indexes after schema review. | Backend QA gate ownership; project visibility unconfirmed. | Whether QA gates expose runtime failures, model/provider names, or operator state. | Do not expose raw rows before redacted summary contract. | Not ready for executable migration. |
| `activation_runs` | `id`; lifecycle status; timestamps; any `workspace_id`, `project_id`, actor, or deployment/operator fields. | None for raw deny/client-hidden model. | None for current raw deny model. | Primary key plus lifecycle and project/workspace lookup indexes after schema review. | Backend runtime ownership; customer visibility unconfirmed. | Whether run state includes deployment, worker, provider, or internal task data. | Do not create project member read policy until row content is classified. | Not ready for executable migration. |
| `feature_gates` | `id`; gate key; environment; rollout state; entitlement/scope fields; timestamps. | None for raw no-client-access model; future summaries may need entitlement/admin checks. | None for current raw deny model. | Gate key/environment indexes after schema review. | Product/compliance ownership; raw feature state may be sensitive. | Whether rows imply beta unlock, production state, or entitlement decisions. | Keep raw table hidden until a safe summary route is reviewed. | Not ready for executable migration. |
| `readiness_snapshots` | `id`; snapshot type/status; timestamps; evidence fields; immutable fields; any `workspace_id` or `project_id`. | None for raw deny/client-hidden model; future summaries may need workspace/project helpers. | None for current raw deny model. | Scope and created-at indexes after schema review. | Observability/readiness ownership; evidence redaction unconfirmed. | Whether evidence includes logs, secret-like metadata, private URLs, or runtime details. | Do not expose raw evidence before redaction and immutability review. | Not ready for executable migration. |
| `tool_capabilities` | `id`; tool key; capability fields; runtime flags; provider references; timestamps. | None for raw no-client-access model; future catalog route may not require RLS raw table access. | None for current raw deny model. | Tool key/capability lookup indexes after schema review. | Tool readiness ownership; runtime meaning and secret absence unconfirmed. | Whether rows include provider hints, secret references, or production enablement flags. | Keep raw rows hidden until non-secret static catalog contract exists. | Not ready for executable migration. |

## Dependency Review Defaults

- Future executable policies must use explicit `TO` role targeting.
- Helper functions must be reviewed before policies depend on them.
- Policy predicates that use scope columns need index review before staging.
- Missing scope or sensitivity evidence blocks positive read policies.
## Prompt 26E-1 local candidate update

Prompt 26E-1 status: `local_candidate_prepared`.

The local candidate uses only denial policies for `anon` and `authenticated`, so it does not depend on helper functions, ownership columns, positive read scoping, or fixture rows. The catalog-only test still depends on the six target tables existing in the local schema and RLS being enabled by the candidate migration.
