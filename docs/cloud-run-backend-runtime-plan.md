# Cloud Run Backend Runtime Plan

## Purpose

The first production backend target for ReeditPro is a Google Cloud Run API service. It will eventually sit behind the frontend API client and own service-role Supabase writes, signed storage, credit mutations, Stripe webhooks, worker dispatch, and provider gateways.

## Why Cloud Run

- Heavy worker architecture already points toward Google Cloud.
- Supabase service-role access must be backend-only.
- Provider keys and Stripe keys must be backend-only.
- Cloud Run can later coordinate Cloud Run Jobs, Pub/Sub, and Secret Manager.
- Vite/browser code should never own provider, credit spend, render, or service-role logic.

## Current Scaffold

RP-FIX-12 adds a mock-only Node HTTP server with:

- `GET /health`
- `GET /ready`
- `GET /api/runtime/status`
- `GET /api/routes`
- `POST /api/mock`

No Cloud Run deployment, GCP resource, provider call, Stripe call, Supabase mutation, FFmpeg, Remotion, or render execution occurs.

## Future Environment

```text
SERVER_RUNTIME_MODE=mock
PORT=8080
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
LYRIA_API_KEY=
MIRELO_API_KEY=
MMAUDIO_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_REGION=
```

Do not commit real values. Production values should come from Secret Manager or secure deployment configuration.

## Future Deployment Work

Before production, add authenticated route middleware, service account IAM review, Secret Manager bindings, Supabase type verification, request logging without secrets, rate limits, monitoring, and real handler implementations behind the existing backend-required route contracts.
