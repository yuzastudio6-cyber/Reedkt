# QA, Revision, And Fallback Route Contract

All routes require authenticated backend API access, workspace/project authorization, safe metadata, and private project-scoped responses. Mutation-style boundaries require `Idempotency-Key` and return `backend_required` until a future transactional runtime exists.

| Route ID | Method/path | Purpose | Tables touched | Idempotency | Status | Forbidden side effects |
| --- | --- | --- | --- | --- | --- | --- |
| `qa.readiness.check` | `POST /v1/qa/readiness` | Check QA readiness and dependencies. | `projects`, `workspace_members`, `approved_plan_snapshots`, `renders`, `qa_reports`, `qa_check_results` | No | implemented | No QA worker, media inspection, jobs, providers, render, tools, credits. |
| `qa.report.create` | `POST /v1/qa/reports` | Validate future QA report creation. | `qa_reports`, `qa_check_results`, `api_idempotency_keys` | Yes | backend_required | No QA report write or QA execution. |
| `qa.report.get` | `GET /v1/qa/reports/:qaReportId` | Read sanitized QA report metadata. | `qa_reports` | No | backend_required | No artifact download or signed URL. |
| `qa.report.listForProject` | `GET /v1/projects/:projectId/qa-reports` | List project QA reports. | `qa_reports` | No | backend_required | No artifact download or worker polling. |
| `qa.blockers.list` | `POST /v1/qa/blockers` | List blocking QA checks. | `qa_check_results` | No | implemented | No resolution or repair execution. |
| `qa.blockers.resolveBoundary` | `POST /v1/qa/blockers/resolve-boundary` | Validate future blocker resolution. | `qa_check_results`, `api_idempotency_keys` | Yes | backend_required | No QA row update. |
| `preview.review.create` | `POST /v1/preview/reviews` | Validate preview review creation. | `preview_reviews`, `api_idempotency_keys` | Yes | backend_required | No persistence or preview URL generation. |
| `preview.review.get` | `GET /v1/preview/reviews/:previewReviewId` | Read preview review metadata. | `preview_reviews` | No | backend_required | No signed URL or public preview access. |
| `preview.review.listForRender` | `GET /v1/renders/:renderId/preview-reviews` | List preview reviews for a render. | `preview_reviews`, `renders` | No | backend_required | No render polling or storage access. |
| `review.comment.create` | `POST /v1/review/comments` | Validate review comment creation. | `review_comments`, `api_idempotency_keys` | Yes | backend_required | No persistence in Prompt 11. |
| `review.comment.list` | `GET /v1/preview/reviews/:previewReviewId/comments` | List review comments. | `review_comments` | No | backend_required | No private payload leakage. |
| `revision.request.create` | `POST /v1/revision/requests` | Validate revision request. | `revision_requests`, `api_idempotency_keys` | Yes | backend_required | No replanning, regeneration, render, jobs, credits. |
| `revision.request.get` | `GET /v1/revision/requests/:revisionRequestId` | Read revision request metadata. | `revision_requests` | No | backend_required | No execution or approval mutation. |
| `revision.request.listForProject` | `GET /v1/projects/:projectId/revision-requests` | List revision requests. | `revision_requests` | No | backend_required | No execution. |
| `revision.estimate.readiness` | `POST /v1/revision/estimate/readiness` | Check whether revision needs a new credit estimate. | `revision_requests`, `credit_estimates` | No | implemented | No estimate creation or credit mutation. |
| `revision.approval.required` | `POST /v1/revision/approval/required` | Check whether revision needs new approval. | `revision_requests`, `approval_records`, `approved_plan_snapshots` | No | implemented | No approval or snapshot mutation. |
| `fallback.readiness.check` | `POST /v1/fallback/readiness` | Check fallback readiness. | `qa_reports`, `qa_check_results` | No | implemented | No retry, provider, render, job, tool, or repair execution. |
| `fallback.decision.plan` | `POST /v1/fallback/decisions/plan` | Validate future fallback decision plan. | `qa_check_results`, `revision_requests`, `api_idempotency_keys` | Yes | backend_required | No fallback execution. |
| `fallback.decision.get` | `GET /v1/fallback/decisions/:fallbackDecisionId` | Read sanitized fallback decision metadata. | `qa_check_results` | No | backend_required | No execution. |
| `repair.plan.readiness` | `POST /v1/repair/plan/readiness` | Check repair plan readiness. | `qa_reports`, `qa_check_results`, `revision_requests` | No | implemented | No repair job, regeneration, render, or tool call. |
| `export.blockers.check` | `POST /v1/export/blockers` | Summarize QA/revision blockers for final export. | `final_exports`, `qa_reports`, `qa_check_results`, `revision_requests` | No | implemented | No export execution or signed URL. |

Service-role runtime is required for project-scoped read summaries. Without it, routes return blockers rather than pretending production persistence is ready.
