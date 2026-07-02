# TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1

Run only after `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true` is explicitly present.

Use the pinned contract from `docs/track-a/native-container-render-tools/gpac-mp4box-guarded-runtime-dispatch-scaffold-confirmed-1/`.

Required exact route:

- `POST /api/render/gpac-mp4box/package/mock`
- route id `render.gpacMp4box.serviceRolePackageMock`
- backend/service-role owned only

Required exact worker target:

- `worker.gpacMp4box.packageValidation.mock`
- worker kind `render_export`

Required generated fixture contract:

- `approvedSnapshot.gpacMp4box.generatedSubtitleOnly.v1`
- `manifest.gpacMp4box.privateInput.generatedSubtitleOnly.v1`
- `manifest.gpacMp4box.privateArtifact.generatedSubtitleOnly.v1`
- `cleanup.gpacMp4box.workerTemp.generatedSubtitleOnly.v1`

Allowed command templates:

- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`
- `mp4box_package_validation_metadata_v1`

The confirmed execution packet must prove approved snapshot, approval record, credit reservation, job id, worker lease, idempotency, private manifests, QA report, cleanup policy, rollback policy, and residue readback before accepting any dispatch result.

Do not broaden scope to raw chat, arbitrary user media, public URLs, signed URL source-of-truth, broad service-role handlers, FFmpeg/FFprobe, GStreamer/MKVToolNix, Remotion, provider/model calls, final render/export, external beta expansion, paid production, or production unlock.
