# Supabase RLS Fixture Contract

Future local/staging RLS validation must use resettable synthetic fixtures only. Prompt 19 does not seed fixtures or execute SQL.

## Fixture Rules

- Synthetic only.
- No private media.
- No production data.
- No signed URLs.
- No provider secrets.
- No service-role keys.
- No Stripe data.
- No raw PII.
- Workspace/project isolation required.
- Non-member denial tests required.
- Cleanup must be test-run scoped.

## Required Fixture Families

| Fixture family | Required shape | Cleanup expectation |
| --- | --- | --- |
| users | At least owner/member/non-member synthetic auth users with fixed test labels. | Remove through disposable reset or auth cleanup path. |
| profiles | One profile per synthetic user, no PII beyond test labels. | Delete with user fixture or reset. |
| workspaces | At least two isolated synthetic workspaces. | Delete workspace cascade or reset. |
| workspace_members | Owner/member rows for workspace A and unrelated rows for workspace B. | Delete with workspace. |
| projects | At least one project per workspace with deterministic IDs or captured IDs. | Delete with workspace. |
| upload/storage | upload_intents and storage_object_records with bucket/path only. | Delete project-scoped rows and local objects if any. |
| media | media_assets, uploaded_clips, and source_sequence_items as metadata-only records. | Delete project-scoped rows. |
| approved snapshots | approved_plan_snapshots and approval_records as immutable local fixtures. | Prefer disposable reset for immutable rows. |
| credits | credit_estimates and credit_reservations; credit ledger rows only in append-only local tests. | Reset if append-only policy blocks cleanup. |
| jobs | job_batches, jobs, job_dependencies, job_events, and idempotency records as blockers/readiness references. | Delete synthetic job graph or reset. |
| workers | worker claim/lease/heartbeat fixtures only where backend-only mutation tests are approved. | Reset for claim/lease mutation cases. |
| render/QA | render_jobs, renders, render_events, final_exports, qa_reports, and qa_check_results as summaries only. | Delete project-scoped rows. |
| tools | tool-call intents and tool readiness records with runtime disabled. | Delete tool fixture rows. |
| provider attempts | provider catalog/model summaries and sanitized attempt/webhook summaries only. | Delete provider fixture rows. |
| compliance | compliance subject/review summaries only if canonical tables exist. | Delete compliance fixture rows. |
| audit/observability | audit_events, backend_runtime_messages, and cost/rate/abuse summaries only where schema exists. | Reset for append-only audit cases. |
| e2e smoke scenario fixtures | A small linked fixture set spanning the Prompt 18 scenario matrix. | Cleanup by test-run label and workspace/project scope. |

## Scope Isolation

Every fixture row must include enough workspace/project/test-run context to prove member allow and non-member deny behavior. If a table lacks workspace/project scope, the test must explain the indirect scope path or stay draft-only.

## Cleanup Evidence

Future validation evidence must record fixture IDs, cleanup command/output, failed cleanup rows, and whether a local reset was used. Cleanup failure blocks beta readiness.
