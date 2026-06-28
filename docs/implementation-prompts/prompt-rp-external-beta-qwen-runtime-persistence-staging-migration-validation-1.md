# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-VALIDATION-1

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PROMOTION-1` records `completed_qwen_runtime_persistence_active_migration_source_promoted_and_local_chain_validated`.

## Goal

Run a guarded staging validation for the active QWEN persistence migration against the approved ReEditPro Supabase staging target.

## Required Gate

Do not run remote Supabase commands unless the next packet explicitly names the target, confirms the target is non-production staging, confirms secrets are available through approved secret storage, and sets an explicit confirmation flag.

## Boundary

No production Supabase, provider/model calls, QWEN runtime, worker dispatch, media processing, signed/public artifacts, package installs, deployment, broad external beta, production, or final export.
