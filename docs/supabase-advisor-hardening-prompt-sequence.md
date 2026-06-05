# Supabase Advisor Hardening Prompt Sequence

Prompt 26B is the advisor hardening planning step. It intentionally stops before remediation.

## Sequence

| Prompt | Purpose | Execution allowed? | Output |
| --- | --- | --- | --- |
| Prompt 26B | Advisor hardening plan. | No. | Priority matrix and workstream plans. |
| Prompt 26C | RLS no-policy draft remediation packet. | No SQL execution unless explicitly approved later. | Table-by-table draft policy/no-access design. |
| Prompt 26D | Function security hardening draft packet. | No SQL execution unless explicitly approved later. | SECURITY DEFINER, grants, and search-path draft plan. |
| Prompt 26E | FK index draft remediation packet. | No SQL execution unless explicitly approved later. | Additive index draft migration plan. |
| Prompt 26F | Local advisor remediation validation candidate. | Local-only if approved and gated. | Local migration validation evidence. |
| Prompt 23A | Human approval completion. | Approval record only. | Required before staging execution. |
| Prompt 24D | Evidence review with supplied files. | Review only. | Accepted/rejected redacted evidence. |

## Gate Rules

- Prompt 26B does not unblock staging.
- Prompt 26B does not mark advisor findings remediated.
- Prompt 26B does not approve SQL, migrations, or production readiness.
- Staging execution requires human approval completion, accepted evidence, confirmed target, rollback plan, and reviewed command packet.

## Current Recommendation

Proceed to Prompt 26C - Supabase Advisor Draft Remediation Packet after Prompt 26B validation and CI pass.
