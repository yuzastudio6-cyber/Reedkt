# GPAC/MP4Box Dispatch Evidence Manifest Policy

Packet: `TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1`

Any later accepted confirmed dispatch result must record only sanitized evidence:

- run id;
- local `/tmp/reeditpro-tracka-gpac-mp4box-guarded-runtime-dispatch-confirmed-execution-1/<runId>/` output directory;
- report filename, byte count, and SHA-256 checksum;
- manifest filename, byte count, and SHA-256 checksum;
- route id `render.gpacMp4box.serviceRolePackageMock`;
- route path `/api/render/gpac-mp4box/package/mock`;
- worker skeleton id `worker.gpacMp4box.packageValidation.mock`;
- worker kind `render_export`;
- approved snapshot id `approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1`;
- approval record id;
- credit reservation id;
- job id;
- worker lease id;
- idempotency key;
- private input manifest id;
- private artifact manifest id;
- private artifact checksum;
- QA report id;
- cleanup policy id;
- rollback policy id;
- residue readback status;
- exact command-template IDs used.

The accepted command-template IDs remain:

- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`
- `mp4box_package_validation_metadata_v1`

No raw command strings, arbitrary private media, user media, public URLs, signed URL source-of-truth, broad service-role payloads, Secret Manager payloads, Supabase mutation payloads, SQL payloads, provider/model payloads, public artifacts, or final exports may be recorded as accepted source evidence.
