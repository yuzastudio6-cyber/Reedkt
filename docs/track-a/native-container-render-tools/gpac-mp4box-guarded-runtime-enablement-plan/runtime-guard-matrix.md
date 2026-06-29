# Runtime Guard Matrix

The guarded runtime enablement plan approves only a future disabled scaffold packet.

Required future guards:
- `approved_snapshot_runtime_persistence_required`
- `service_role_backend_route_registration_required`
- `disabled_by_default_runtime_scaffold_required`
- `worker_dispatch_confirmation_required`
- `private_artifact_storage_runtime_policy_required`
- `tool_runtime_command_allowlist_required`
- `storage_transfer_negative_tests_required`
- `signed_public_artifact_negative_tests_required`
- `qa_cleanup_audit_runtime_observability_required`
- `rollback_and_residue_validation_required`
- `operator_confirmation_gate_required`

Rejected inputs:
- `raw_chat`
- `raw_command_string`
- `frontend_file_path`
- `public_url_source_of_truth`
- `signed_url_source_of_truth`
- `arbitrary_private_media`
- `provider_or_model_prompt_payload`
- `service_role_secret_payload`
- `broad_service_role_handler_payload`

Route execution, worker execution, GPAC/MP4Box execution, storage transfer, signed/public artifacts, media processing, external beta expansion, paid production unlock, and production unlock remain blocked.
