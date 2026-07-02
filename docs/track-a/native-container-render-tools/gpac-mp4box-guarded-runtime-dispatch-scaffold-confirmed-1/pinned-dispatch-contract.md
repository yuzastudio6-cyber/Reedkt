# Pinned GPAC/MP4Box Dispatch Contract

This is the exact non-executed contract a later external agent must use when the confirmation gate is explicitly supplied.

## Confirmation Gate

Required gate: `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true`.

Observed gate in this session: `absent`.

## Route

- Route id: `render.gpacMp4box.serviceRolePackageMock`
- Method: `POST`
- Path: `/api/render/gpac-mp4box/package/mock`
- Owner: `backend_service_role_only`
- Status in source: `disabled`
- Future handler name: `createGpacMp4boxPackageValidationJob`
- Broad service-role handler payloads: `blocked`
- Frontend service-role credential exposure: `forbidden`

## Worker Target

- Worker skeleton id: `worker.gpacMp4box.packageValidation.mock`
- Worker owner: `backend_worker_only`
- Worker kind: `render_export`
- Skeleton mode: `disabled_mock_worker_skeleton_only`
- Queue consumption mode: `metadata_validation_only`

## Approved Snapshot Fixture Contract

- Approved snapshot fixture id: `approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1`
- Source class: `generated_fixture`
- Input fixture accepted by prior QA: `generated-synthetic-subtitles.srt`
- Input bytes: `73`
- Input SHA-256: `8070a36d0b5f724e75512fa1ab2f722b75aaba91ec46a37936d38cb6fa9f42ea`
- Output fixture accepted by prior QA: `generated-synthetic-subtitle-only.mp4`
- Output bytes: `857`
- Output SHA-256: `afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8`
- Media type: `sbtl:tx3g`
- Codec: `tx3g`

The snapshot fixture is not persisted or exercised by this packet. A later confirmed packet must prove the persisted approved snapshot, approval record, credit reservation, job id, worker lease, and idempotency key before dispatch.

## Required Reference IDs

- Approval record id: `approvalRecord.gpacMp4box.generatedSubtitleOnly.v1`
- Credit reservation id: `creditReservation.gpacMp4box.generatedSubtitleOnly.v1`
- Job id: `job.gpacMp4box.packageValidation.generatedSubtitleOnly.v1`
- Worker lease id: `workerLease.gpacMp4box.packageValidation.generatedSubtitleOnly.v1`
- Private input manifest id: `manifest.gpacMp4box.privateInput.generatedSubtitleOnly.v1`
- Private artifact manifest id: `manifest.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1`
- Private artifact checksum id: `checksum.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1`
- QA policy id: `qa.gpacMp4box.packageValidation.generatedSubtitleOnly.v1`
- Cleanup policy id: `cleanup.gpacMp4box.workerTemp.generatedSubtitleOnly.v1`
- Audit record id: `audit.gpacMp4box.dispatch.generatedSubtitleOnly.v1`
- Tool runtime policy id: `toolRuntimePolicy.gpacMp4box.officialApt.syntheticOnly.v1`

## Command Allowlist

Only these command template ids are accepted:

- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`
- `mp4box_package_validation_metadata_v1`

The next confirmed packet may only use the prior QA command family against the generated subtitle-only fixture contract:

- `MP4Box -add generated-synthetic-subtitles.srt:hdlr=sbtl -new generated-synthetic-subtitle-only.mp4`
- `MP4Box -info generated-synthetic-subtitle-only.mp4`

Arbitrary command strings, arbitrary arguments, arbitrary private media, public URLs, signed URLs as source-of-truth, FFmpeg/FFprobe expansion, GStreamer/MKVToolNix expansion, Remotion execution, provider/model payloads, and raw chat execution remain blocked.

## Rollback And Residue Checks

The confirmed packet must record rollback and residue readback before any external-agent result is accepted:

- cleanup policy status `approved`;
- temp artifact scope `worker_temp_only`;
- cleanup status must reach `cleanup_verified`;
- residue readback must prove no generated SRT, MP4, MKV, media artifact, Docker output, public artifact, signed URL, or private storage object remains outside the declared temp scope;
- failure must block preview, final export, external beta expansion, paid production, and production unlock.

## Current Phase Result

Route execution: `not_run_confirmation_absent`.

Worker dispatch: `not_run_confirmation_absent`.

Worker execution: `not_run_confirmation_absent`.

GPAC/MP4Box execution: `not_run_confirmation_absent`.

Storage transfer: `not_run_confirmation_absent`.

Signed/public artifact creation: `not_run_confirmation_absent`.
