# RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1 Prompt

Use after `RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1` records `completed_external_beta_provider_model_call_policy_closure_no_runtime_calls`.

## Goal

Review the external beta lane for QA, cleanup, observability, rollback, incident support, privacy, cost, and deployment readiness without unlocking external beta.

## Required Carry-Forward

- Single active Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Approved snapshot route write runtime validation: `completed_approved_snapshot_route_write_runtime_validation`.
- Private artifact storage/access validation: `completed_private_artifact_storage_access_guarded_remote_write_readback`.
- Remotion private preview/export validation: `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation`.
- Provider/model-call policy closure: `completed_external_beta_provider_model_call_policy_closure_no_runtime_calls`.

## Boundaries

Do not run provider/model calls, worker dispatch, route execution, Remotion, Docker, FFmpeg/FFprobe, media processing, Supabase mutation, SQL, signed URL creation, public artifact creation, deployment, internal beta unlock, external beta unlock, production unlock, or final delivery/export unless a later explicit guarded runtime prompt authorizes a single bounded operation.
