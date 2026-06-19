# Supabase Worker Runtime Transactional RPC 3 RLS Security Review

## Table Exposure

The static migration creates tables in `public` to match existing repo migration conventions, but it enables RLS and revokes all public, anon, and authenticated access. No frontend claim path is introduced.

## Function Exposure

Security definer functions are created in the private `worker_runtime` schema, not the exposed `public` schema. Each function uses an explicit `search_path` and grants execution only to `service_role`.

## Credential Policy

Future Supabase URL, service-role key, JWT, project reference, and database URL resolution remains backend-only through Google Secret Manager or equivalent server-side resolution. No payload values are added to repo docs, logs, PR body, env files, or artifacts.

## Artifact Policy

The schema records private artifact refs, checksums, QA report refs, and FFprobe metadata refs. It does not create signed URLs, public artifact URLs, GCS access, or public artifact source-of-truth.

## No Broad Service-Role Handler

RPC-3 creates narrow operation-family functions only. It does not add a generic service-role handler, route, worker, provider, model call, frontend mutation path, or raw prompt execution path.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
