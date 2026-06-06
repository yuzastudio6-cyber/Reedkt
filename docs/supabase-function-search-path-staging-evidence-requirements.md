# Supabase Function Search Path Staging Evidence Requirements

Prompt 26F does not approve staging execution. This document defines the evidence required before a future staging function search-path validation can be considered.

Staging evidence status: `evidence_required`.
Prompt 23 state on this base: `pending_human_approval`.
SQL executed: none.
Migration deployed: no.

## Required Evidence Categories

| Category | Required evidence | Current status |
| --- | --- | --- |
| Advisor before state | Redacted advisor finding summary showing the mutable `search_path` warning for the scoped functions. | Missing. |
| Function definitions before change | Redacted definitions with signatures, parameter names, security mode, volatility, and grants. | Missing. |
| Local candidate result | Future local migration candidate validation evidence. | Missing. |
| Behavior tests | Future local and staging-safe behavior checks for the nine functions. | Missing. |
| Advisor after state | Redacted staging advisor recheck showing the warning cleared or explicitly unchanged. | Missing. |
| Rollback packet | Approved rollback/restoration plan with owner. | Missing. |
| Human approval | Human approval decision and approved PR/commit/test set. | Missing on this base. |
| Secret handling | GCP Secret Manager references verified without exposing values. | Missing. |

## Redaction Rules

Evidence must not include service-role keys, JWT secrets, provider keys, Stripe keys, raw database URLs, signed URLs, raw project refs, private media URLs, Secret Manager values, database passwords, row data that identifies real users, or production data.

## Staging Gate

Staging validation remains blocked until every required category is accepted and the human approval path explicitly permits the exact future prompt, PR, commit, test set, fixture plan, and rollback/cleanup owner.
