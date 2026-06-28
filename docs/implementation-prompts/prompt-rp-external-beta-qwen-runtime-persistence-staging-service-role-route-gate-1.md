# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-SERVICE-ROLE-ROUTE-GATE-1

Use this prompt only after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1` is merged.

Goal: plan the next guarded service-role route gate for QWEN runtime persistence on the `Reeditpro` staging Supabase target without executing QWEN, workers, providers, media processing, signed URL creation, public artifact creation, production, or final export.

Required source chain:

- #1499 QWEN staging migration apply source-of-truth.
- `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1` read-only RLS/storage readback source-of-truth.
- #577 remains excluded unless it is separately repaired and validated.

Default boundary:

- Remote mutation remains blocked unless the prompt explicitly names the exact staging target, exact route, exact fixture, exact service-role secret source, exact cleanup/readback policy, and an explicit confirmation gate.
- Provider/model calls remain disabled.
- Worker dispatch remains disabled.
- Signed/public artifacts remain disabled.
- Broad external beta, production, and final export remain blocked.
