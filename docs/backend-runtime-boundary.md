# Backend Runtime Boundary

## Current Decision

ReeditPro can now create a frontend-safe Supabase browser client when public Vite env values are present.

The Vite app must never own privileged backend behavior. Service-role access, provider secrets, credit mutations, generation requests, upload signing, worker dispatch, and render orchestration stay behind a future secure backend runtime.

## Browser Boundary

Browser code may read only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Browser code must not read:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
provider API keys
Stripe secrets
webhook secrets
```

The frontend client must use Supabase anon access and RLS. If the public env values are missing, the app remains in mock/local mode.

## Backend-Only Boundary

The service role belongs only in a secure backend, server, or worker runtime. Future options include:

- Cloud Run API service
- Supabase Edge Functions
- serverless API routes
- dedicated worker runtime

The current `supabase-admin-placeholder.ts` intentionally does not create an admin client and does not read service-role env.

## Backend-Owned Work

These actions remain backend-only:

- creating signed upload URLs
- writing privileged workspace/project records
- approving plans and credit reservations
- spending, refunding, or reconciling credits
- creating provider generation jobs
- reading provider secrets
- invoking Lyria, Mirelo, MMAudio, Google Cloud, Stripe, or render workers
- dispatching final render jobs

## Still Mock-Only

- auth/profile bootstrap
- storage upload runtime
- backend API routes
- credit purchase and spend enforcement
- worker queue and provider execution
- render pipeline

This document defines the safety boundary only. It does not deploy Supabase, generate database types, or add a real service-role runtime.
