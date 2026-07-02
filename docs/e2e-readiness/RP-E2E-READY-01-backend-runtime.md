# RP-E2E-READY-01 Backend Runtime Skeleton

Date: 2026-05-21

## Summary

The new top-level `server/` folder is the first real backend runtime skeleton for ReeditPro. It connects route shape, auth, idempotency, Supabase client boundaries, and safe service wrappers without enabling providers, Stripe, Google Cloud deployment, rendering, media processing, or real workers.

## Runtime Boundary

`server/` is server-only and must not be imported from Vite/browser code. The service-role Supabase client lives only in `server/supabase/admin-client.ts`. The anon client is used only for token verification.

If `SUPABASE_SERVICE_ROLE_KEY` is missing, the server starts only when `API_ALLOW_MOCK_WITHOUT_SUPABASE=true`. In that mode, services return deterministic mock metadata and warnings instead of mutating Supabase.

## Environment

Safe local placeholders are documented in `.env.example`:

- `API_PORT=8787`
- `E2E_RUNTIME_MODE=local`
- `API_ALLOW_MOCK_WITHOUT_SUPABASE=false`
- `SUPABASE_URL=`
- `SUPABASE_ANON_KEY=`
- `SUPABASE_SERVICE_ROLE_KEY=`

Secret values must remain blank in examples and belong only in secure server/worker runtime configuration later.

## Routes

Health:

- `GET /health`
- `GET /health/readiness`
- `GET /health/tool-readiness`

Project/chat/upload:

- `POST /v1/projects`
- `GET /v1/projects/:projectId`
- `POST /v1/projects/:projectId/chat-sessions`
- `POST /v1/chat-sessions/:chatSessionId/messages`
- `POST /v1/chat-sessions/:chatSessionId/attachments/clips`
- `POST /v1/projects/:projectId/upload-intents`
- `POST /v1/upload-intents/:uploadIntentId/finalize`
- `POST /v1/upload-intents/:uploadIntentId/signed-url-events`

Execution gates:

- `POST /v1/edit-plans/:editPlanId/approved-snapshots`
- `GET /v1/approved-snapshots/:snapshotId`
- `POST /v1/credit-estimates/:creditEstimateId/approve`
- `POST /v1/credit-estimates/:creditEstimateId/reserve`
- `GET /v1/workspaces/:workspaceId/credit-balance`
- `POST /v1/job-batches`
- `POST /v1/jobs`
- `GET /v1/jobs/:jobId`
- `GET /v1/jobs/:jobId/events`

Worker/render/provider:

- `POST /v1/jobs/:jobId/claim`
- `POST /v1/jobs/:jobId/heartbeat`
- `POST /v1/jobs/:jobId/release`
- `POST /v1/tool-runtime-checks`
- `POST /v1/render-jobs`
- `GET /v1/renders/:renderId`
- `POST /v1/renders/:renderId/preview-review`
- `POST /v1/provider-gateway/requests`
- `POST /v1/provider-gateway/webhooks/:provider`

## Auth And Idempotency

Protected routes require `Authorization: Bearer <token>` when Supabase auth is available. In explicit local mock mode, a mock user context is attached. Protected writes never trust frontend `userId` fields.

Write routes that can mutate runtime state require `Idempotency-Key`. The middleware hashes method, path, and body. With Supabase admin runtime it uses `api_idempotency_keys`; in explicit mock mode it uses an in-memory map and still blocks same-key/different-hash conflicts.

## Error Envelope

Errors return:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request body validation failed.",
    "status": 400,
    "request_id": "..."
  }
}
```

## What Is Connected Now

- Route registration and validation.
- Request ID, auth, idempotency, and error middleware.
- Server-only Supabase admin/anon client factories.
- Thin service wrappers for the RP-E2E runtime tables and existing planning/credit/job/render tables.
- Mock-safe fallback behavior when Supabase admin runtime is unavailable.

## What Remains Mock-Only

- Provider gateway transport.
- Stripe.
- Remotion/FFmpeg/render execution.
- GCS/signed URL generation.
- Real worker dispatch and Cloud Run jobs.
- Transactional credit reservation, job transitions, approved snapshot creation, worker claims, and provider attempt recording.

## Prompt 4 Next Steps

1. Apply migrations locally/staging and run SQL smoke tests.
2. Replace critical service TODOs with reviewed Supabase RPCs/transactions.
3. Add real authenticated workspace membership enforcement in the backend service layer.
4. Add signed upload/download URL creation without storing URL values.
5. Connect mock worker dispatch through durable job/claim mutation before any provider or render execution.
