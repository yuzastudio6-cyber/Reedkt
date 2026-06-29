# Disabled Handler Registration Contract Boundary

The contract adds metadata and validation helpers only.

Allowed:

- TypeScript contract id `handlerRegistration.gpacMp4box.disabled`.
- Route id metadata `render.gpacMp4box.disabledHandlerRegistrationContract`.
- Builder, validator, sanitizer, and smoke coverage for disabled metadata.
- Backend/service-role ownership metadata.
- Guard references for approved snapshot, route idempotency, private artifact manifest, command allowlist, negative tests, storage/public artifact gates, cleanup/audit reference, and operator confirmation.

Blocked:

- Executable handler registration.
- Route implementation or route execution.
- Worker dispatch or worker execution.
- GPAC/MP4Box execution.
- Media processing.
- Storage transfer.
- Signed URL creation.
- Public artifact creation.
- Supabase mutation or SQL execution.
- External beta expansion, paid production unlock, production unlock, or final delivery/export.

The next packet must add negative tests for this disabled handler-registration contract before any guarded handler registration plan can be considered.
