# Staging Supabase Validation Evidence Template

This template is for a future approved staging run. Prompt 22 does not collect staging evidence.

## Evidence Rules

- Record redacted evidence only.
- Do not record service-role keys, anon keys, JWT secrets, provider keys, Stripe keys, tokens, signed URLs, private media URLs, or full database connection strings.
- Record host classification and project reference only in redacted form.
- Record test results with sanitized summaries.
- Record production readiness as not approved.

## Run Metadata

| Field | Value |
| --- | --- |
| Human approval decision record | To be linked after human approval. |
| Reviewer | To be filled by reviewer. |
| Runner | To be filled by approved operator. |
| Staging project reference | Redacted staging-only reference. |
| Validation date | To be filled during future approved run. |
| Approved test set | To be filled from the human decision record. |

## Migration Evidence

| Evidence item | Value |
| --- | --- |
| Migration validation ran | To be filled during future approved run. |
| First failing migration, if any | Sanitized summary only. |
| SQLSTATE, if any | Sanitized code only. |
| Rollback required | To be filled during future approved run. |
| Rollback completed | To be filled during future approved run. |

## RLS Evidence

| Test file | Result | Sanitized notes |
| --- | --- | --- |
| To be filled from approved test set. | Pending. | No staging evidence collected by Prompt 22. |

## Cleanup Evidence

| Cleanup item | Result | Sanitized notes |
| --- | --- | --- |
| Synthetic fixtures removed or rolled back | Pending. | Future staging run only. |
| Storage side effects absent | Pending. | Future staging run only. |
| Runtime side effects absent | Pending. | Future staging run only. |

## Final Evidence State

- Staging evidence collected: no.
- Production readiness approved: no.
- Beta unlock approved: no.
- Prompt 22 packet state: `ready_for_human_review`.
