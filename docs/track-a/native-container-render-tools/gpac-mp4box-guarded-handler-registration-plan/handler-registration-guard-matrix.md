# Handler Registration Guard Matrix

The guarded handler registration plan approves only a future disabled handler-registration scaffold packet.

Required future guards:
- `backend_service_role_owner_required`
- `disabled_by_default_handler_registration_required`
- `feature_flag_default_false_required`
- `approved_snapshot_guard_required`
- `route_idempotency_guard_required`
- `private_artifact_manifest_guard_required`
- `command_allowlist_guard_required`
- `negative_tests_must_remain_passing`
- `cleanup_audit_reference_required`
- `no_storage_transfer_until_private_artifact_runtime_gate`
- `no_signed_or_public_artifact_until_delivery_policy_gate`
- `operator_confirmation_required_before_any_execution`

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

Executable handler registration, route execution, worker dispatch, worker execution, GPAC/MP4Box execution, storage transfer, signed/public artifacts, media processing, external beta expansion, paid production unlock, production unlock, and final delivery/export remain blocked.
