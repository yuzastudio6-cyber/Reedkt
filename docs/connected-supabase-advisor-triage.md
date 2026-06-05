# Connected Supabase Advisor Triage

Prompt 26A records advisor findings from supplied connected read-only evidence. It does not remediate advisors, create SQL, apply migrations, change policies, deploy Edge Functions, or approve staging execution.

## Status

- Connected audit status: `partially_reviewed_connected_metadata`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Connected metadata source: read-only metadata supplied by the user; Prompt 26A did not run a Supabase command or mutate any Supabase environment.
- SQL executed: none.
- Migration deployed: no.

## Security Advisor Summary

Security advisors reported three categories:

| Category | Finding | Staging blocker | Production blocker | Future prompt |
| --- | --- | --- | --- | --- |
| RLS enabled but no policies | Six activation/readiness/tool tables. | yes | yes | Prompt 26B |
| Mutable function `search_path` | Helper/runtime functions require hardening review. | yes | yes | Prompt 26B |
| SECURITY DEFINER exposure | Helper functions callable by anon/authenticated roles. | yes | yes | Prompt 26B |

## Performance Advisor Summary

Performance advisors reported unindexed foreign keys across runtime/foundation tables. These are not immediate data-exposure findings, but they are staging and production readiness blockers because broad validation can produce slow queries and lock contention.

## Severity Categories

- Critical: RLS-enabled tables with no policies on any table that could expose project/workspace/user data.
- High: SECURITY DEFINER functions callable by broad roles without reviewed execute grants.
- High: Mutable `search_path` warnings on helper/runtime functions.
- Medium: Unindexed foreign keys on high-write or high-read runtime tables.

## No Automatic Remediation Rule

Prompt 26A is triage only. Future prompts must design, review, and validate any policy, function, grant, or index migration before execution. No advisor fix is implemented here.

## Recommended Sequence

1. Prompt 26B - Supabase Advisor Hardening Plan.
2. Prompt 26C - RLS No-Policy Remediation Design.
3. Prompt 26D - Function Security Hardening Design.
4. Prompt 26E - Foreign-Key Index Migration Design.
5. Prompt 23A - Human Approval Decision Completion before staging execution.
6. Prompt 24D - Supabase Evidence Review With Supplied Files before staging execution.
