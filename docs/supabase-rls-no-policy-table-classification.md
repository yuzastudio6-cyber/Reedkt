# Supabase RLS No-Policy Table Classification

Prompt 26D classifies the RLS-enabled/no-policy tables reported by the connected Supabase advisor evidence. It creates a contract only. It does not create active RLS policies, active SQL migrations, grants, function changes, indexes, or Supabase environment updates.

Supabase reference principle: tables in exposed schemas need explicit RLS and role-scoped access decisions. `anon`, `authenticated`, and `service_role` behavior must be documented separately before any policy is written.

## Status

- Classification status: `rls_no_policy_classification_contract_created`.
- Connected audit status: `partially_reviewed_connected_metadata`.
- Advisor hardening status: `rls_no_policy_classified`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Active migration files changed: no.
- Production capability enabled: none; RLS no-policy classification contract only.

## Classification Matrix

| Table | Likely domain | Owning workstream | Purpose hypothesis | User-facing or backend-only? | Workspace-scoped? | Project-scoped? | Admin-only? | Future/deprecated? | Sensitive operational data? | Normal authenticated read? | Normal authenticated write? | Service-role-only candidate? | Staging blocker? | Production blocker? | Confidence | Recommended policy model | Unresolved questions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `activation_artifacts` | Activation/runtime readiness | WORKER_RUNTIME_JOBS with SUPABASE_RLS_STORAGE_DATABASE ownership for policy design | Stores activation artifacts or readiness outputs for runtime gates. | Backend-only by default. | Unknown. | Possible. | Operator/backend only until proven otherwise. | Future runtime table. | Yes. | No. | No. | Yes. | Yes. | Yes. | Medium. | `backend_service_role_only` | Confirm columns, workspace/project references, artifact sensitivity, and whether sanitized summaries are needed. |
| `activation_qa_gates` | Activation/runtime QA gates | WORKER_RUNTIME_JOBS and OBSERVABILITY_AUDIT_COST | Stores QA gate state for activation/runtime readiness. | Backend-only by default. | Unknown. | Possible. | Operator/backend only until proven otherwise. | Future runtime table. | Yes. | No. | No. | Yes. | Yes. | Yes. | Medium. | `backend_service_role_only` | Confirm whether any dashboard needs redacted gate summaries and which columns are safe. |
| `activation_runs` | Activation/runtime orchestration | WORKER_RUNTIME_JOBS | Stores activation run metadata and lifecycle state. | Backend-only by default. | Unknown. | Possible. | Operator/backend only until proven otherwise. | Future runtime table. | Yes. | No. | No. | Yes. | Yes. | Yes. | Medium. | `backend_service_role_only` | Confirm lifecycle ownership, user visibility, and whether run state contains deployment/operator details. |
| `feature_gates` | Feature gating | COMPLIANCE_SECURITY with product/runtime handoff | Stores feature gate metadata or rollout status. | No raw client access until safe summary model is reviewed. | Unknown. | Unknown. | Backend/admin by default. | Future feature-control table. | Possible. | No raw-table read. | No. | Yes. | Yes. | Yes. | Low. | `no_client_access` | Confirm whether rows expose internal rollout, entitlement, beta unlock, or operator state; consider backend summary route. |
| `readiness_snapshots` | Readiness evidence and status snapshots | OBSERVABILITY_AUDIT_COST and SUPABASE_RLS_STORAGE_DATABASE | Stores readiness evidence snapshots for foundation/runtime gates. | Backend-only by default. | Possible. | Possible. | Operator/backend only until proven otherwise. | Future readiness table. | Yes. | No raw-table read. | No. | Yes. | Yes. | Yes. | Medium. | `backend_service_role_only` | Confirm canonical scope columns, immutability rules, and whether redacted views are required. |
| `tool_capabilities` | Tool readiness/capability catalog | AI_TOOLS_CREATIVE_GRAPHICS with tool-readiness handoff | Stores tool capability metadata that could feed readiness/catalog views. | No raw client access until static non-secret catalog visibility is reviewed. | Not likely. | Not likely. | Backend/admin writes only. | Future tool catalog table. | Possible. | No raw-table read. | No. | Yes for writes. | Yes. | Yes. | Medium. | `no_client_access` | Confirm no provider secrets, runtime enablement, private worker state, or misleading production-ready signals are present. |

## Classification Decisions

- Raw activation tables default to `backend_service_role_only` because they likely contain operational readiness state and future worker/runtime details.
- `feature_gates` defaults to `no_client_access` because raw gate rows may expose internal rollout or entitlement decisions.
- `readiness_snapshots` defaults to `backend_service_role_only` because readiness evidence may include operational state and should be redacted through a future API if user-visible.
- `tool_capabilities` defaults to `no_client_access` for raw rows; a future static catalog can be exposed only after non-secret fields and runtime meaning are reviewed.
- All six tables remain staging blockers and production blockers until classification is reviewed, policy intent is converted into draft migration design, and local/staging tests are approved.

## Cross-Chat Ownership

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Handoff workstreams: WORKER_RUNTIME_JOBS, AI_TOOLS_CREATIVE_GRAPHICS, OBSERVABILITY_AUDIT_COST, COMPLIANCE_SECURITY, PROVIDER_GATEWAY_MODELS, TRACK_A_RENDER_EXPORT, SOUND_MUSIC_AUDIO, and MAP_GEOSPATIAL.
- Explicitly not owned by Prompt 26D: runtime implementation, creative tools, map/geospatial stack, sound/music stack, worker execution, provider execution, render/export validation, staging approval, production readiness, and beta unlock.

## Blockers

- Exact table columns and grants need accepted evidence or approved local schema review.
- Prompt 23A records conditional staging-only approval, but evidence and execution gates remain incomplete.
- Prompt 24D accepted redacted evidence is missing.
- No staging SQL is approved.
- No advisor remediation is applied.

## Next Supabase Action

Recommended next prompt: Prompt 26E - RLS No-Policy Draft Migration Plan.
