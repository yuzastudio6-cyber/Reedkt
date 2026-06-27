# RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1 Prompt

Use after `RP-EXTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-ROLLBACK-REVIEW-1` records `completed_external_beta_qa_cleanup_observability_rollback_review_no_runtime_execution`.

## Goal

Make the final external beta release go/no-go decision from the current source chain. Do not unlock beta unless the packet explicitly confirms the reviewed source chain, names the operator approval boundary, and keeps paid production, public artifacts, broad media, and final delivery/export separately gated.

## Required Carry-Forward

- Single active Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Approved snapshot route write runtime validation: `completed_approved_snapshot_route_write_runtime_validation`.
- Private artifact storage/access validation: `completed_private_artifact_storage_access_guarded_remote_write_readback`.
- Remotion private preview/export validation: `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation`.
- Provider/model-call policy closure: `completed_external_beta_provider_model_call_policy_closure_no_runtime_calls`.
- QA review: `source_evidence_review_passed_ready_for_release_go_no_go`.
- Cleanup review: `ephemeral_fixture_cleanup_evidence_passed_ready_for_release_go_no_go`.
- Observability review: `audit_manifest_checksum_status_evidence_passed_ready_for_release_go_no_go`.
- Rollback review: `transaction_rollback_and_fixture_residue_evidence_passed_ready_for_release_go_no_go`.
- Security/privacy/support/cost/deployment review: `reviewed_pending_release_go_no_go_operator_acceptance`.

## Boundaries

Do not run provider/model calls, worker dispatch, route execution, Remotion, Docker, FFmpeg/FFprobe, media processing, Supabase mutation, SQL, signed URL creation, public artifact creation, deployment, internal beta unlock, external beta unlock, production unlock, paid billing, or final delivery/export unless a later explicit guarded runtime prompt authorizes one bounded operation.

## Expected Outcome

Either:

- record `approved_external_beta_release_go_no_go_source_chain_accepted` with explicit operator approval, still keeping production and paid billing blocked; or
- record an exact blocker and keep external product beta blocked.
