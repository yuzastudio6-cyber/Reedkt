# Supabase Validation Evidence Checklist

Future local or staging Supabase/RLS validation must produce reviewable evidence. Prompt 19 does not produce SQL execution evidence.

## Required Evidence

| Evidence item | Required for local | Required for staging | Notes |
| --- | --- | --- | --- |
| GitHub PR | Yes | Yes | Link PR and branch. |
| Branch/head commit | Yes | Yes | Record exact SHA. |
| Migration chain commit | Yes | Yes | Record migration list and branch. |
| Schema static audit | Yes | Yes | Include command and result. |
| Foundation validation | Yes | Yes | Include local and GitHub status. |
| Supabase CLI version | Yes | Yes | Include architecture/runtime path. |
| Local/staging project identity | Yes | Yes | Confirm local disposable or staging project ID. |
| No production target confirmation | Yes | Yes | Explicitly state production was not used. |
| Migration apply output | Yes | Yes | Include failures and warnings. |
| RLS test output | Yes | Yes | Include pass/fail by file and case. |
| Storage policy test output | If in scope | Yes | Private bucket and path-scope evidence. |
| Advisor output | Optional | Yes | Required before staging readiness. |
| Failed tests | Yes | Yes | Include blocker owner and next action. |
| Fixture IDs | Yes | Yes | Test-run scoped IDs only. |
| Cleanup confirmation | Yes | Yes | Include failed cleanup if any. |
| No production data confirmation | Yes | Yes | Record fixture source. |
| No secrets confirmation | Yes | Yes | Record secret scan/static check. |
| Reviewer signoff | Optional | Yes | Human approval required for staging. |

## Evidence Storage Rules

- Do not commit secrets, raw credentials, service-role keys, provider keys, Stripe keys, signed URLs, private media, or raw provider payloads.
- Do not paste private Supabase project secrets into docs.
- Do not treat AI-generated summaries as legal, security, or production approval.
- If output contains sensitive values, redact before committing and record that redaction occurred.

## Go/No-Go Decision

Prompt 20 can proceed only when Prompt 19 diagnostics and GitHub Foundation Validation pass. Production beta remains blocked until local and staging evidence exists, cleanup is confirmed, human review is recorded, and execution/persistence runtime milestones are separately validated.
