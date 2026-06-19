# Supabase Worker Runtime Transactional RPC 4 Blocked Scope Register

## Blocked Runtime Scope

- Supabase mutation.
- SQL execution.
- migration deployment.
- readback SQL.
- Secret Manager payload access.
- worker execution.
- job claim/lease execution.
- route/tool/provider/model execution.
- Track A runtime/media processing.
- private artifact or GCS access.
- signed URL creation.
- public artifact creation.
- dependency mutation.
- raw prompt execution.
- final render/export.
- broad service-role handler.

## Blocked Product Scope

- internal beta unlock.
- external beta unlock.
- production unlock.
- paid production.
- final delivery/export.
- broad/arbitrary user media.
- public artifacts.
- signed URL source-of-truth.

## Decision Values

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 decision: blocked_pending_confirmed_staging_target_or_execution_confirmation

execution: blocked_pending_guarded_staging_sql_confirmation

Supabase update status: blocked_sql_not_executed

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
