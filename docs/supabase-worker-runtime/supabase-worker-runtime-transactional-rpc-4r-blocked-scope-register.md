# Supabase Worker Runtime Transactional RPC 4R Blocked Scope Register

## Blocked Decision

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R decision: blocked_pending_confirmed_staging_target_or_execution_confirmation

execution: blocked_pending_guarded_staging_sql_confirmation

Target safety status: blocked_pending_confirmed_staging_target

Supabase update status: blocked_sql_not_executed

Supabase environment touched: none

SQL executed: none

Migration deployed: no

readbackStatus: not_run

## Blocked Scope

The following remain blocked:

- Supabase mutation
- SQL execution
- migration deployment
- readback query
- Secret Manager payload access
- Secret Manager payload printing
- production SQL
- external beta SQL
- paid production SQL
- broad Supabase mutation
- worker execution
- job claim execution
- lease acquisition
- route execution
- tool execution
- provider/model call
- Track A runtime/media execution
- private artifact access
- GCS access
- signed URL creation
- public artifact creation
- billing/credit mutation
- package-lock or dependency mutation
- raw prompt execution
- internal beta unlock
- external beta unlock
- production unlock
- final render/export
- broad service-role handler

## Unlock Status

Internal beta unlocked: false

trackAInternalBetaUnlocked: false

Production, external beta, broad media, final delivery/export, public artifacts, and signed URL source-of-truth remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
