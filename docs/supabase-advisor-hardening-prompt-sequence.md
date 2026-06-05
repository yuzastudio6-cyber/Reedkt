# Supabase Advisor Hardening Prompt Sequence

Prompt 26B is the advisor hardening planning step. Prompt 26C is the umbrella draft remediation packet. Both intentionally stop before remediation execution.

## Sequence

| Prompt | Purpose | Execution allowed? | Output |
| --- | --- | --- | --- |
| Prompt 26B | Advisor hardening plan. | No. | Priority matrix and workstream plans. |
| Prompt 26C | Supabase advisor umbrella draft remediation packet. | No. | Draft-only packets and Markdown SQL sketches for RLS, SECURITY DEFINER, search path, and FK index workstreams. |
| Prompt 26D | RLS no-policy table classification and policy contract. | No SQL execution unless explicitly approved later. | Table-by-table policy/no-access contract. |
| Prompt 26E | Function hardening contract. | No SQL execution unless explicitly approved later. | SECURITY DEFINER, grant, and search-path contract. |
| Prompt 26F | FK index migration design packet. | No SQL execution unless explicitly approved later. | Additive index migration design. |
| Prompt 26G | Local advisor remediation validation candidate. | Local-only if approved and gated. | Local migration validation evidence. |
| Prompt 23A | Human approval completion. | Approval record only. | Required before staging execution. |
| Prompt 24D | Evidence review with supplied files. | Review only. | Accepted/rejected redacted evidence. |

## Gate Rules

- Prompt 26B and Prompt 26C do not unblock staging.
- Prompt 26C does not mark advisor findings remediated.
- Prompt 26C draft SQL sketches are Markdown review artifacts only.
- Prompt 26C does not approve SQL, migrations, or production readiness.
- Staging execution requires human approval completion, accepted evidence, confirmed target, rollback plan, and reviewed command packet.

## Current Recommendation

Proceed to Prompt 26D - RLS No-Policy Table Classification and Policy Contract after Prompt 26C validation and CI pass.
