# Implementation Gap Scorecard

| Area | Score | Status |
| --- | ---: | --- |
| Frontend-safe Supabase config | 7/10 | Implemented with missing-env fallback. |
| Auth session handling | 7/10 | Implemented through Supabase anon client helpers. |
| Profile bootstrap | 6/10 | Implemented when RLS allows; backend fallback still needed. |
| Workspace bootstrap | 6/10 | Implemented when RLS allows; backend fallback still needed. |
| Current workspace context | 6/10 | Profile metadata update plus browser fallback. |
| Full auth UI | 2/10 | Hook/component exist, no pages or route integration. |
| Backend service-role runtime | 0/10 | Not implemented by design. |
| Backend API route boundary | 5/10 | Route contracts, registry, mock router, and frontend client exist; no deployed runtime. |
| Storage/upload foundation | 6/10 | Validation, bucket mapping, path planning, mock records, source order flow, and local policy readiness exist. |
| Real storage upload runtime | 2/10 | Frontend helper exists, but deployed buckets/RLS, signed upload/download, and production tests remain open. |
| Credit approval gate | 6/10 | Mock-safe gate checks enforce approved plan, approved estimate, reservation status, scope, and available credits. |
| Credit ledger runtime | 4/10 | Mock reservation/spend/release/refund skeleton exists; real transactional backend ledger mutation remains open. |
| Job queue runtime | 5/10 | Mock queue items, gates, dependencies, events, retry, and dispatch placeholders exist. Real backend/cloud queue is not deployed. |
| Worker dispatch runtime | 3/10 | Lyria/SFX mock skeleton dispatch is represented; render/custom dispatch remains placeholder and real workers are backend-required. |
| Project SFX workflow integration | 6/10 | SFX Director, provider routes, prompts, credit gates, mock generation requests, mock jobs, mock worker, provider adapter, timing/mix/QA, and chat status are wired for project editing in mock mode. |
| Runtime transport and worker leases | 4/10 | Mock envelopes, transport placeholders, lease lifecycle, stale recovery, idempotency helpers, and route handlers exist. Real backend/cloud enforcement is not deployed. |
| Production backend runtime scaffold | 4/10 | Cloud Run API service is selected and a mock-only Node server scaffold exists. No deployment, secrets, service-role handlers, providers, workers, Stripe, or rendering. |
| Production Supabase validation | 0/10 | Not run by design. |

## Notes

RP-FIX-06 through RP-FIX-12 should be treated as partial implementation fixes, not production readiness.

RP-FIX-14 partially fixes project SFX workflow integration. Real provider execution, provider secrets, Cloud Run workers, storage, and credit spending remain open.
