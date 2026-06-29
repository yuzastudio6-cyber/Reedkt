# Disabled Live Registration Contract

The disabled live-registration contract is a TypeScript metadata contract only.

It records the future route id `render.gpacMp4box.disabledLiveRegistrationContract`, but the route registration mode is `disabled_metadata_contract_only`.

The contract requires backend/service-role ownership, approved snapshot guard, route idempotency guard, private artifact manifest guard, command allowlist guard, negative-test guard, storage-transfer gate, signed/public artifact gate, and operator confirmation guard.

Rejected input classes remain blocked: `raw_chat`, `raw_command_string`, `frontend_file_path`, `public_url_source_of_truth`, `signed_url_source_of_truth`, `arbitrary_private_media`, `provider_or_model_prompt_payload`, `service_role_secret_payload`, and `broad_service_role_handler_payload`.

No executable HTTP handler, route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, production unlock, or final delivery/export is enabled.
