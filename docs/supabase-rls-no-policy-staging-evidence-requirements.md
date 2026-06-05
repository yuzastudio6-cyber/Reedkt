# Supabase RLS No-Policy Staging Evidence Requirements

Prompt 26E defines evidence that a future approved staging validation must capture. It does not run staging, SQL, migrations, Supabase commands, or Secret Manager calls.

## Status

- Staging evidence requirements status: `rls_no_policy_staging_evidence_requirements_defined`.
- Staging validation executed: no.
- SQL executed: none.
- Migration deployed: no.
- Supabase environment touched: none.

## Required Future Evidence

| Evidence category | Required capture | Redaction rule |
| --- | --- | --- |
| Advisor before output | RLS no-policy findings before future migration. | Redact project ref except approved redacted form; no raw logs with sensitive payloads. |
| Migration output | Future migration dry-run/apply output in approved environment. | No connection strings, keys, tokens, or Secret Manager values. |
| Policy inventory | Policies for all six tables before and after future migration. | Table and policy names may be shown; credentials and raw project refs must not. |
| RLS test output | Denial tests for `anon`, authenticated non-member, cross-scope cases, and write restrictions. | Use synthetic fixture identifiers only. |
| Cleanup proof | Evidence that synthetic rows were removed or transaction rollback completed. | No production or real customer row data. |
| No public exposure proof | Evidence that raw tables did not become public/client-readable unexpectedly. | No service-role keys or JWTs. |
| No production data proof | Confirmation that staging fixtures are synthetic and isolated. | No private media URLs or signed URLs. |
| Reviewer signoff | Human review notes for staging result and blockers. | No personal private data beyond role labels. |

## Future Gate Requirements

- Prompt 23A-style human approval completion must exist and be current.
- Prompt 24D or later must accept redacted Supabase evidence.
- GCP Secret Manager references must remain references only; payloads must not be printed or committed.
- Rollback and cleanup ownership must be recorded before staging execution.
- Production readiness remains blocked regardless of staging evidence until a separate production approval path exists.
