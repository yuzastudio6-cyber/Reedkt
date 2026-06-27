# Smoke Evidence

Packet: `RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1`

Decision: `completed_controlled_external_beta_authenticated_staging_smoke_validation`

External beta readiness: `controlled_external_beta_smoke_validated_authenticated_staging_api`

## Cloud Run Source-Status Readback

- Service: `reeditpro-staging-api`
- Region: `us-central1`
- URL: `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`
- Latest created revision: `reeditpro-staging-api-00005-7gs`
- Latest ready revision: `reeditpro-staging-api-00005-7gs`
- Traffic: `100_percent_latest_revision`
- Condition `Ready`: `True`
- Condition `ConfigurationsReady`: `True`
- Condition `RoutesReady`: `True`
- Required flag `REEDITPRO_EXTERNAL_BETA_READY`: `true`
- Required flag `REEDITPRO_EXTERNAL_BETA_TARGET_REF`: `wmyyttnynmteqgcdishd`
- Required flag `REEDITPRO_EXTERNAL_BETA_SCOPE`: `controlled_private_preview`
- Required flag `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE`: `disable_REEDITPRO_EXTERNAL_BETA_READY`

## HTTP Smoke

Unauthenticated access to `/health`, `/health/readiness`, `/ready`, and `/api/runtime/status` returned `403`, so the staging API is not public/open. This is accepted for controlled private preview and prevents treating the flag as a public artifact or public beta unlock.

Authenticated safe endpoints passed using the active Google account identity token, with no token committed or printed:

- `GET /health`: `200`, JSON, `ok: true`, `service: reeditpro-backend`, `mode: mock`, `mockOnly: true`
- `GET /ready`: `200`, JSON, `ok: true`, `mode: mock`, `mockOnly: true`, `supabaseServiceRoleConfigured: false`, `providerSecretsConfigured: false`, `stripeConfigured: true`, `googleCloudConfigured: false`
- `GET /api/runtime/status`: `200`, JSON, `ok: true`, `runtime.mode: mock`, `runtime.mockOnly: true`, `frontendSecretLeakCheck.ok: true`, `frontendSecretLeakCheck.hasPotentialLeak: false`

`/health/readiness` returned `404` after authenticated invocation because this deployed runtime exposes readiness at `/ready`. The active readiness endpoint `/ready` passed.

Warnings observed:

- `Stripe secret presence was detected, but Stripe routes remain disabled in this scaffold.`
- `Server runtime defaults to mock mode; no live provider, render, Stripe, Cloud Run, or Supabase service-role operation will run.`

No provider call, model call, worker execution, route mutation, media processing, Supabase mutation, SQL execution, signed URL creation, public artifact creation, paid billing, production unlock, or final delivery/export occurred.
