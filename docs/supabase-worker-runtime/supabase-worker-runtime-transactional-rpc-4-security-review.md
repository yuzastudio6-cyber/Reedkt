# Supabase Worker Runtime Transactional RPC 4 Security Review

## Security Posture

The RPC-3 static migration remains unexecuted, but its intended posture is preserved for any future staging-only run:

- private `worker_runtime` function schema.
- security definer functions outside exposed `public` schema.
- explicit `search_path`.
- RLS enabled on `public.worker_jobs`, `public.worker_job_events`, and `public.worker_job_artifacts`.
- public, anon, and authenticated table access revoked or blocked.
- RPC execution granted only to `service_role`.
- no frontend claim path.
- no broad service-role handler.
- sanitized event payloads only.
- private artifact refs and checksums only.
- no signed URL source-of-truth.
- no public artifacts.

## Current Packet Result

Secret Manager payload printed: false

Supabase environment touched: none

SQL executed: none

Migration deployed: no

production touched: false

## Supabase Changelog Note

The current Supabase changelog includes the Data API exposure change for new tables. RPC-4 therefore keeps table exposure assumptions explicit: worker runtime tables remain service-role-only, with no anon/authenticated frontend claim path.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
