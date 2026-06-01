# Tool-Call Route Contract

All Prompt 12 routes require authentication. Project-scoped routes require `workspaceId` and `projectId`; the service fails closed if backend project access cannot be verified.

| Route | Method | Contract |
| --- | --- | --- |
| `/v1/tools/catalog/readiness` | GET | Reports canonical catalog/runtime readiness blockers. |
| `/v1/tools/catalog` | GET | Returns static planning-only catalog placeholders. |
| `/v1/tools/catalog/:toolId` | GET | Returns one static planning-only catalog placeholder. |
| `/v1/tools/chains` | GET | Returns static planning-only chain templates. |
| `/v1/tools/chains/:toolChainId` | GET | Returns one static planning-only chain template. |
| `/v1/tools/decision/readiness` | POST | Checks backend-required decision dependencies. |
| `/v1/tools/decision/preview` | POST | Validates schema/context and returns planning-only decision summary. |
| `/v1/tools/call-intents/readiness` | POST | Checks future intent creation readiness. |
| `/v1/tools/call-intents` | POST | Idempotent mutation boundary; returns `backend_required` and writes nothing. |
| `/v1/tools/call-intents/:toolCallIntentId` | GET | Future read boundary; returns `backend_required` until canonical table/RLS exists. |
| `/v1/projects/:projectId/tool-call-intents` | GET | Future project list boundary; returns `backend_required`. |
| `/v1/tools/call-intents/blockers` | POST | Reports intent and execution blockers. |
| `/v1/tools/call-intents/validate-context` | POST | Schema-only context validation. |
| `/v1/tools/call-intents/qa-requirements` | POST | Summarizes future QA requirements. |
| `/v1/tools/execution/readiness` | POST | Always fail-closed for execution readiness. |
| `/v1/tools/execution/blocked` | POST | Returns explicit blocked execution reasons. |
| `/v1/tools/runtime/readiness` | POST | Future runtime readiness boundary; no probes are run. |
| `/v1/tools/license/readiness` | POST | Future license/security boundary; no production approval. |

Responses are wrapped as `{ toolCall: result }`. Readiness and validation routes return HTTP 200. The intent creation boundary returns HTTP 202 with a `backend_required` payload and no write.
