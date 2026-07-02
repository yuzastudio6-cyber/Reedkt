# Backend Runtime Readiness Audit

Date: 2026-05-20

## Existing Foundations Found

- API contracts, route registry, response helpers, frontend API client, and mock API router exist under `src/backend/api`.
- Runtime transport contracts and mock transport placeholders exist under `src/backend/runtime`.
- Worker lease, heartbeat, stale recovery, idempotency, and worker runtime registry helpers exist.
- Credit and job gates exist for approved plan, approved estimate, reservation, job readiness, timing readiness, and provider safety.
- Lyria and SFX worker skeletons exist in mock mode. Render worker skeleton files are still missing, so render remains a generic placeholder.
- Provider, Stripe, admin, render, and real worker routes are represented as backend-required or disabled metadata.

## Missing Production Pieces

- No deployed backend API service.
- No service-role Supabase runtime.
- No Secret Manager wiring.
- No Cloud Run service, Cloud Run Job, Pub/Sub, or worker deployment.
- No real provider, Stripe, render, FFmpeg, Remotion, or payment execution.
- No production monitoring, rate limiting, request auth middleware, or audited service-role handlers.

## Runtime Choice

Cloud Run API service is the first recommended backend runtime because ReeditPro already plans Google Cloud workers, needs backend-only Supabase service-role access, must keep provider and Stripe secrets out of Vite, and eventually needs Cloud Run Jobs/Pub/Sub dispatch.

## RP-FIX-12 Result

This task scaffolds a mock-only Node HTTP runtime suitable for future Cloud Run deployment. It exposes `/health`, `/ready`, `/api/runtime/status`, `/api/routes`, and `/api/mock` without deploying anything or calling external services.
