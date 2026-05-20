# RP-GCP-02 Secret And Env Plan

## Purpose

This plan defines future Secret Manager reference names and local placeholder rules. It does not create secrets, add credentials, run Google Cloud commands, connect Supabase, call providers, or configure production.

## Secret Manager Reference Names

Future production secrets should use reference names like:

- `reeditpro-prod-supabase-url`
- `reeditpro-prod-supabase-service-role-key`
- `reeditpro-prod-openai-api-key`
- `reeditpro-prod-wan-api-key`
- `reeditpro-prod-hailuo-api-key`
- `reeditpro-prod-veo-vertex-config`
- `reeditpro-prod-lyria-api-key`
- `reeditpro-prod-mirelo-api-key`
- `reeditpro-prod-mmaudio-api-key`
- `reeditpro-prod-provider-webhook-signing-secret`
- `reeditpro-prod-stripe-webhook-secret`

Additional future worker/tool secrets should follow:

`reeditpro-prod-{service-or-provider}-{purpose}`

## Secret Rules

- Raw secrets never go in database rows.
- Raw secrets never go in source control.
- Raw secrets never go in frontend code.
- Raw secrets never go in `VITE_*` variables.
- Raw secrets never go in provider, job, render, export, or QA payloads.
- Database/provider records may store Secret Manager reference names only.
- Workers load secrets from Secret Manager or secure local runtime configuration only.
- Logs must use secret reference names or sanitized IDs, never raw values.

## Frontend Env Boundary

Frontend may use only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are frontend-safe public Supabase values. They are not service-role credentials.

`SUPABASE_SERVICE_ROLE_KEY` and provider secrets are server-only. They must never be imported into Vite/browser code.

## Local Placeholder Boundary

`.env.example` contains placeholders only. It may document future local variable names, but real production values belong in Secret Manager and secure deployment configuration.

`GOOGLE_SECRET_MIRELO_API_KEY_NAME` and `GOOGLE_SECRET_MMAUDIO_API_KEY_NAME` are local placeholder variables for future Secret Manager reference names such as `reeditpro-prod-mirelo-api-key` and `reeditpro-prod-mmaudio-api-key`. They must not contain raw provider key values.

RP-GCP-00 does not add Stripe integration. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` remain future placeholders only.
