# Phase 51A Supabase Data-Plane Audit Results

## Status

Phase 51A adds a read-only Supabase/PostgreSQL data-plane audit. Static report mode is available, and confirmed execution was attempted for `phase51a-20260604T185604`.

Execution status: partial/blocked.

- Static repo audit completed.
- Remote Supabase activity audit was blocked because backend `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were not both available to the execution environment.
- Private GCS artifact upload was blocked because `gcloud` could not refresh auth tokens in non-interactive execution.
- No migrations, SQL mutations, Supabase lifecycle commands, row writes, secret reads, signed URLs, provider calls, media processing, Docker, deployment, production unlock, external beta unlock, paid production unlock, or broad-media unlock occurred.

## Repo Supabase Structure

- Frontend anon client: `src/backend/supabase/supabase-client.ts`.
- Frontend public env config: `src/backend/supabase/supabase-config.ts`.
- Frontend service-role boundary: `src/backend/supabase/supabase-admin-placeholder.ts`.
- Server admin client: `server/supabase/admin-client.ts`.
- Server anon client: `server/supabase/public-client.ts`.
- Runtime env parsing: `server/config/env.ts`.
- Migration SQL: `supabase/migrations/`.

## Static Decision

The repository has substantial local/review-ready Supabase schema and RLS evidence, but Phase 51A does not prove that migrations are applied remotely or that the current app writes rows during normal use. Low or absent Supabase activity is expected when the deployed/runtime environment is mock-only, lacks backend service-role env, or uses frontend-only anon auth without backend persistence routes.

## Remote Activity

Remote activity audit is count-only and optional. It requires backend `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the confirmed execution environment. Those values were unavailable during `phase51a-20260604T185604`, so no remote Supabase rows, row payloads, DB URLs, service-role values, tokens, or signed URLs were read or stored.

The audit also records that current runtime env is likely mock-only without service-role Supabase configuration.

## Migration/RLS Findings

- Migration files parsed: 21.
- Parsed public tables: 161.
- RLS-enabled tables parsed: 135.
- Static P0 blockers:
  - 11 parsed StoryTiming tables do not have explicit RLS enablement in committed migrations.
  - Runtime configuration is likely mock-only without backend Supabase admin env.
  - Remote Supabase activity is unverified.

## Blocked Scope

No migrations, SQL mutations, Supabase lifecycle commands, remote schema changes, row writes, secret printing, signed URL creation, provider calls, media processing, Docker, deployment, production, external beta, paid production, or broad media are enabled.

## Phase51B Readiness

Phase51B readiness: blocked.

Required human action before a full remote activity rerun:

- Provide backend-only read-only audit credentials through the approved execution environment: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Refresh/select gcloud auth for the `reeditpro` project so private Phase 51A JSON artifacts can upload to the staging GCS prefixes.
- Review the 11 StoryTiming RLS gaps before any schema/migration hardening phase.
