# SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4

Guarded staging SQL execution for Worker Runtime transactional RPC/schema.

## Goal

Execute staging SQL only after a future static migration packet is complete, a staging target is confirmed, rollback readiness is recorded, and explicit confirmation gates are set. This prompt is currently blocked and must not execute SQL from the current packet.

## Current Blockers

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 readiness: `blocked_pending_static_migration_packet`

Target safety status: `blocked_pending_confirmed_staging_target`

SQL executed: `none`

Migration deployed: `no`

Supabase environment touched: `none`

## Required Before Execution

- SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3 static migration implementation packet complete.
- Confirmed staging-only target and account context.
- Reviewed migration checksum and diff.
- Rollback readiness complete.
- Backend-only Google Secret Manager credential resolution verified without payload printing.
- Confirmation gates explicitly set by a future authorized prompt.
- Production, external beta, paid production, public artifacts, signed URLs, final delivery/export, broad media, and internal beta remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
