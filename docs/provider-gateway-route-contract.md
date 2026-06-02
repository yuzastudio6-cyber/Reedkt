# Provider Gateway Route Contract

All Prompt 15 provider routes require authentication. POST/request-style boundaries require idempotency. All execution-sensitive routes are `backend_required` or blocked.

| Route ID | Method/path | Purpose | Status |
| --- | --- | --- | --- |
| `providers.readiness.check` | `POST /v1/providers/readiness` | Check provider gateway blockers. | `backend_required` |
| `providers.catalog.list` | `GET /v1/providers/catalog` | Static provider catalog summary. | `implemented` read-only |
| `providers.catalog.get` | `GET /v1/providers/catalog/:providerKey` | Static provider summary. | `implemented` read-only |
| `providers.models.list` | `GET /v1/providers/models` | Static model policy summary. | `implemented` read-only |
| `providers.model.get` | `GET /v1/providers/models/:providerModelKey` | Static model policy summary. | `implemented` read-only |
| `providers.secretReference.check` | `POST /v1/providers/secret-reference/check` | Check secret-reference readiness without reading secrets. | `backend_required` |
| `providers.route.preview` | `POST /v1/providers/route/preview` | Preview provider route/model policy. | `backend_required` |
| `providers.requestEnvelope.validate` | `POST /v1/providers/request-envelope/validate` | Validate future provider envelope. | `backend_required` |
| `providers.requestAttempt.readiness` | `POST /v1/providers/request-attempt/readiness` | Check attempt readiness. | `backend_required` |
| `providers.requestAttempt.createBoundary` | `POST /v1/providers/request-attempt/create-boundary` | Future attempt creation boundary. | `backend_required` |
| `providers.requestAttempt.get` | `GET /v1/providers/request-attempts/:providerAttemptId` | Future sanitized attempt read boundary. | `backend_required` |
| `providers.requestAttempt.listForProject` | `GET /v1/projects/:projectId/provider-request-attempts` | Future project-scoped attempt list boundary. | `backend_required` |
| `providers.webhook.readiness` | `POST /v1/providers/webhook/readiness` | Check webhook verification/readiness boundary. | `backend_required` |
| `providers.webhook.receiveBoundary` | `POST /v1/providers/webhooks/:provider/receive-boundary` | Future webhook receive boundary. | `backend_required` |
| `providers.webhook.summary.get` | `GET /v1/providers/webhooks/:providerWebhookEventId/summary` | Future sanitized webhook summary read boundary. | `backend_required` |
| `providers.output.readiness` | `POST /v1/providers/output/readiness` | Check generated output storage/QA/provenance boundary. | `backend_required` |
| `providers.execution.blocked` | `POST /v1/providers/execution/blocked` | Report execution blockers. | `blocked` |
| `providers.blockers` | `POST /v1/providers/blockers` | List provider blockers. | `backend_required` |

## Forbidden Side Effects

No route may call providers, install SDKs, read provider secrets, access Secret Manager, process real webhooks, create provider attempts, create generated assets, create jobs, execute workers/tools, render/export, process media, mutate credits, transfer storage, deploy, or run migrations.
