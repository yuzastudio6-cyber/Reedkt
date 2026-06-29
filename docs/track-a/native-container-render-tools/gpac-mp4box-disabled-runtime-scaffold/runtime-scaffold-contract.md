# Disabled Runtime Scaffold Contract

Contract file: `src/backend/contracts/gpac-mp4box-disabled-runtime-scaffold-contracts.ts`.

Smoke file: `server/smoke/tracka-gpac-mp4box-disabled-runtime-scaffold-smoke.ts`.

The contract exports:

- `buildGpacMp4boxDisabledRuntimeScaffoldInput`
- `validateGpacMp4boxDisabledRuntimeScaffoldInput`
- `summarizeGpacMp4boxDisabledRuntimeScaffoldBoundary`

The scaffold id is `runtimeScaffold.gpacMp4box.disabled`.

The scaffold mode is `disabled_scaffold_only`.

The success status is `disabled_scaffold_registered_no_runtime`.

The contract blocks when:

- the enablement plan reference is invalid;
- the runtime flag is not disabled;
- the approved snapshot, service-role route, worker dispatch, private artifact, command allowlist, QA, cleanup, audit, rollback, or residue references are missing;
- any rejected input is present;
- route, worker, GPAC/MP4Box, media, Supabase, or SQL execution is attempted;
- storage transfer, signed URL creation, public artifact creation, external beta expansion, paid production unlock, or production unlock is attempted.

This is not a live route registration, worker implementation, tool execution path, storage transfer path, or production runtime path.
