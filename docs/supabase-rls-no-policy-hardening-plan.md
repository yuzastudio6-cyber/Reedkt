# Supabase RLS No-Policy Hardening Plan

Prompt 26A reported RLS enabled with no policies on six tables. Prompt 26B records the future hardening approach only and does not create or alter policies.

## Candidate Tables

| Table | Likely domain | Future policy direction | Open review question | Status |
| --- | --- | --- | --- | --- |
| `activation_artifacts` | activation/runtime readiness | Backend-only or workspace/project-scoped read policy. | Does any frontend route need sanitized summaries? | Candidate only. |
| `activation_qa_gates` | activation/runtime QA gates | Backend-only or scoped read for authorized operators. | Are gate records operational-only? | Candidate only. |
| `activation_runs` | activation/runtime orchestration | Backend-only, with narrow operator/admin visibility if needed. | Does run metadata include deployment or operator state? | Candidate only. |
| `feature_gates` | feature gating | Safe catalog read or backend summary route. | Which gates can be public-safe? | Candidate only. |
| `readiness_snapshots` | readiness evidence | Redacted view or backend-only evidence access. | Can snapshot metadata expose environment state? | Candidate only. |
| `tool_capabilities` | tool readiness catalog | Safe read-only catalog policy or backend route. | Could rows imply runtime enablement incorrectly? | Candidate only. |

## Future Design Requirements

- Confirm table ownership, columns, and intended read/write paths.
- Decide whether each table is backend-only, admin/operator-only, workspace/project-scoped, or public-safe catalog.
- Prefer explicit deny/no-access posture when no user path is intended.
- Avoid broad `authenticated` or `anon` access without scoped predicates.
- Preserve service-role-only writes.
- Validate owner/member/non-member cases with synthetic fixtures before staging.

## Prompt 26B Decision

No RLS policy is applied in Prompt 26B. The next remediation design should be Prompt 26C and must produce exact draft SQL plus validation expectations before any execution prompt.
