# Negative Test Matrix

The smoke test `smoke:tracka-gpac-mp4box-guarded-executable-handler-implementation-scaffold-negative-tests` covers:

- plan drift -> `blocked_guarded_executable_handler_implementation_plan_invalid`
- missing backend/service-role context -> `blocked_missing_backend_service_role_context`
- route registration / executable route / worker dispatch enablement / runtime approval -> `blocked_handler_scaffold_not_disabled`
- feature flag enablement -> `blocked_feature_flag_enabled`
- missing approved snapshot, route idempotency, private artifact manifest, command allowlist, negative test, cleanup/audit, storage/public artifact, and operator-confirmation guards
- raw chat, raw command, frontend file path, public URL, signed URL, arbitrary private media, provider/model prompt, service-role secret, and broad service-role handler rejected inputs
- route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, Supabase mutation, and SQL execution attempts
- storage transfer, signed URL creation, public artifact creation, external beta expansion, paid production unlock, production unlock, and final delivery/export attempts

Product-ready local OSS tools: `0`.

Next prompt: `TRACKA-GPAC-MP4BOX-GUARDED-EXECUTABLE-HANDLER-RUNTIME-ENABLEMENT-REVIEW-1`.
