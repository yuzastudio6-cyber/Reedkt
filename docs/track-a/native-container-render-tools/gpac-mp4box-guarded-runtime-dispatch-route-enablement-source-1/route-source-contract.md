# GPAC/MP4Box Route-Source Contract

Route source path:

`/v1/external-beta/gpac-mp4box/guarded-runtime-dispatch/generated-fixture/route-source/enqueue`

Required confirmation gate:

`REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH_ROUTE_SOURCE=true`

The route-source bridge accepts only approved generated-fixture refs:

- approved snapshot, approval record, credit reservation, job, and active worker lease;
- private input manifest and private artifact manifest refs;
- QA, cleanup, checksum, audit, and tool-runtime policy refs;
- allowlisted command template: `mp4box_add_generated_subtitle_only_v1`, `mp4box_info_generated_subtitle_only_v1`, or `mp4box_package_validation_metadata_v1`;
- deterministic route idempotency key from workspace, project, approved snapshot, job, and command template.

The route source creates only a local mock queue item and validates the existing disabled worker skeleton. It does not call a worker dispatcher and does not run MP4Box.

Rejected inputs remain:

- raw chat;
- raw command strings;
- frontend file paths;
- arbitrary private media paths;
- user media paths;
- public URLs or signed URLs as source-of-truth;
- service-role secret payloads;
- broad service-role handler payloads.

Next milestone:

`TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1R`
