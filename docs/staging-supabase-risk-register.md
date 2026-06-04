# Staging Supabase Risk Register

Prompt 21 records staging approval risks before any staging execution. The register is evidence planning only.

| Risk | Severity | Why it matters | Mitigation | Current state |
| --- | --- | --- | --- | --- |
| staging project mis-target | Critical | A staging run aimed at production could expose or mutate real data. | Human approval must verify staging-only target and redacted project reference. | Blocked until Prompt 22 review. |
| secret exposure | Critical | Keys or connection strings in docs/CI logs would compromise runtime boundaries. | Record names and redacted evidence only; never commit secret values. | Blocked until approved evidence handling exists. |
| fixture cleanup failure | High | Synthetic rows left behind could pollute future validation or confuse readiness. | Require cleanup owner, cleanup method, and post-cleanup evidence. | Draft cleanup plan exists. |
| migration rollback ambiguity | High | A failed staging migration can leave unclear schema state. | Stop on first failure and require rollback review before retry. | Draft rollback plan exists. |
| false production readiness | Critical | Passing a narrow staging test could be mistaken for beta approval. | Every result must state production readiness not approved. | Prompt 21 docs enforce this language. |
| overly broad first test set | High | Running all domain drafts at once can hide cause and cleanup scope. | First approved staging run should start with a narrow auth/workspace/project candidate. | Matrix marks only one local-passed staging candidate. |
| runtime side effect leakage | Critical | Provider, worker, render, storage transfer, credit, Stripe, or telemetry side effects would exceed scope. | Fixture plan excludes runtime execution and side-effect domains. | Blocked by packet scope. |

