# GPAC/MP4Box Execution-Ready Route Worker Bridge

Packet: `TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1`

Route path: `/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute`

Route confirmation gate: `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true`

Runtime packet: `TRACKA-GPAC-MP4BOX-GENERATED-FIXTURE-RUNTIME-EXECUTION-1`

Runtime confirmation gate: `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION=true`

Allowed command templates:

- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`

The bridge accepts only an approved-snapshot-style generated fixture request. It rejects raw commands, raw chat, arbitrary file paths, private media paths, user media paths, public URLs, signed URLs, worker dispatch requests, persistent queue writes, Supabase mutation requests, SQL requests, public artifact requests, and final render/export requests.

The route implementation supplies the request idempotency key from the HTTP idempotency header and delegates to the generated-fixture runtime packet only after the route body and environment gate both pass.

Normal validation for this packet uses a fake runtime runner in smoke coverage and does not execute Docker or MP4Box.
