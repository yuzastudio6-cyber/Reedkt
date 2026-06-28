# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-APPLY-1` records `completed_qwen_runtime_persistence_staging_migration_apply_and_readback_validation`.

## Goal

Run a staging read-only RLS/storage/API-surface readback for the QWEN runtime persistence surfaces now that the active migration is applied.

## Boundary

Read-only inspection only. Do not run QWEN runtime, providers/models, workers, routes, media processing, signed/public artifact creation, package installs, deployment, broad external beta, production, or final export. Do not create or mutate storage objects or database rows.

## Required Checks

- QWEN constraints remain present.
- QWEN runtime payload surfaces do not expose raw prompt, signed URL, public URL, token, secret, or raw model output columns.
- Existing RLS posture remains enabled on exposed runtime tables.
- No public storage bucket or public artifact expansion is introduced.
- Frontend/service-role boundary remains intact.
