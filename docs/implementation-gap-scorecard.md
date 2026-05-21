# Implementation Gap Scorecard

| Area | Score | Status |
| --- | ---: | --- |
| Local E2E demo loop | 7/10 | Browser-local project creation, source metadata/upload plans, source order review, approval gates, mock credit/job/lease/dispatch events, sidebar toggle, and preview-ready placeholder work locally. |
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
| Real SFX provider execution readiness | 5/10 | Structured readiness checks now report runtime, provider mode, Secret Manager reference, approval/credit/job, storage, provenance, and safe next-step blockers. Live Mirelo/MMAudio transport remains future backend work. |
| Runtime transport and worker leases | 4/10 | Mock envelopes, transport placeholders, lease lifecycle, stale recovery, idempotency helpers, and route handlers exist. Real backend/cloud enforcement is not deployed. |
| Production backend runtime scaffold | 4/10 | Cloud Run API service is selected and a mock-only Node server scaffold exists. No deployment, secrets, service-role handlers, providers, workers, Stripe, or rendering. |
| Production Supabase validation | 0/10 | Not run by design. |

## Notes

RP-FIX-06 through RP-FIX-12 and the local E2E MVP should be treated as partial implementation fixes, not production readiness.

RP-FIX-14 partially fixes project SFX workflow integration. RP-FIX-15 adds readiness reporting for future real SFX execution. Real provider transport, Secret Manager value resolution, Cloud Run workers, storage uploads, and credit spending remain open.
