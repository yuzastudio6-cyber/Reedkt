# Supabase RLS No-Policy Migration Readiness Checklist

Prompt 26D does not create a migration. This checklist defines what must be true before a future RLS no-policy migration plan can become executable.

## Current State

- Checklist status: `migration_readiness_checklist_created`.
- Classification reviewed: pending.
- Draft migration plan created: yes.
- Executable migration ready: no.
- Table purpose confirmed: pending.
- Required columns confirmed: pending.
- Helper functions reviewed: pending.
- Indexes reviewed: pending.
- Policy model approved: pending.
- Local SQL test designed: pending.
- Staging SQL test designed: pending.
- Rollback plan drafted: pending.
- Human approval before staging: missing.
- Secret Manager references only if any env values are needed: required.
- SQL executed: none.
- Supabase environment touched: none.
- Migration deployed: no.

## Required Review Gates

| Gate | Requirement | Current Prompt 26E state |
| --- | --- | --- |
| Classification reviewed | A human or future approved review confirms each table purpose and access model. | Draft plan created from Prompt 26D classification; human/schema evidence review still pending. |
| Draft migration plan | Future policy naming, dependency, tests, rollback, and staging evidence requirements are documented. | Created by Prompt 26E. |
| Table purpose confirmed | Accepted evidence or approved local schema review confirms each table's role. | Pending. |
| Required columns confirmed | Scope, owner, id, timestamp, and sensitivity columns are known. | Pending. |
| Helper functions reviewed | Workspace/project membership helpers are reviewed for SECURITY DEFINER and search-path risks. | Pending. |
| Indexes reviewed | Predicate and join columns have performance review before staging. | Pending. |
| Policy model approved | One access model is approved per table before SQL drafting. | Pending. |
| Local SQL test designed | Denial and any positive summary cases are represented by synthetic fixtures. | Pending. |
| Staging SQL test designed | Staging tests use approved synthetic fixtures and rollback/cleanup. | Pending. |
| Rollback plan | Every future policy can be removed or reverted without data loss. | Pending. |
| No production data | Future tests must avoid production rows, private media, signed URLs, and secrets. | Required. |
| Human approval before staging | Prompt 23A or equivalent approval completion exists. | Missing. |
| Secret references only | Any env-dependent value uses GCP Secret Manager reference placeholders only. | Required. |

## Future Migration Design Defaults

- Start from raw-table denial for all six tables.
- Add read policies only after scope columns and safe visibility are proven.
- Keep writes backend/service-role only.
- Keep `anon` denied unless a later reviewed static catalog design explicitly changes the model.
- Keep production blocked until staging evidence passes and runtime approvals exist.

## Recommended Next Prompt

Prompt 26E-1 - RLS No-Policy Local Draft Migration Implementation, or Prompt 26F - Function Search Path Hardening Migration Plan.
