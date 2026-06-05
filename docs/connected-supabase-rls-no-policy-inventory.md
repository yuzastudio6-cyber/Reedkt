# Connected Supabase RLS No-Policy Inventory

The connected read-only audit reported RLS enabled but no policies on the tables below. Prompt 26A records the inventory only and does not create, alter, or execute policies.

| Table | Likely domain | User-facing? | Backend-only candidate? | Risk | Remediation options | Staging blocker | Owner prompt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `activation_artifacts` | activation/runtime readiness | likely backend-facing | yes | Records could expose activation artifacts or readiness state if policies are incomplete. | Add scoped workspace/project policy, service-role-only path, private schema review, or documented intentional no-access policy. | yes | Prompt 26B/26C |
| `activation_qa_gates` | activation/runtime QA gates | likely backend-facing | yes | Gate state could reveal internal readiness or allow unsafe reads if exposed. | Add scoped read policy for authorized roles or make service-role-only with no frontend path. | yes | Prompt 26B/26C |
| `activation_runs` | activation/runtime orchestration | likely backend-facing | yes | Run metadata may reveal runtime state, operator details, or deployment readiness. | Add narrow admin/backend policy, private schema move, or documented blocked access. | yes | Prompt 26B/26C |
| `feature_gates` | feature gating | potentially frontend-visible summary only | yes | Missing policies can either overexpose gates or make intended reads fail unpredictably. | Define public-safe read policy, workspace-scoped policy, or backend-only gate summary service. | yes | Prompt 26B/26C |
| `readiness_snapshots` | readiness evidence | potentially dashboard-facing | yes | Snapshot evidence may include environment or operational details. | Add scoped policy, redactable view, service-role-only records, or private schema review. | yes | Prompt 26B/26C |
| `tool_capabilities` | tool readiness/capability catalog | potentially frontend-visible summary only | yes | Tool capability rows may imply runtime enablement if exposed incorrectly. | Add safe read-only catalog policy, backend summary route, or documented no-policy intent. | yes | Prompt 26B/26C |

## Current Decision

- Connected audit status: `partially_reviewed_connected_metadata`.
- RLS policies created in Prompt 26A: none.
- SQL executed in Prompt 26A: none.
- Staging validation approved: no.
- Production readiness approved: no.
