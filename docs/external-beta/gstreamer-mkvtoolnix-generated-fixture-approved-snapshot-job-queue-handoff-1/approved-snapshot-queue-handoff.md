# Approved Snapshot Queue Handoff

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-TO-APPROVED-SNAPSHOT-JOB-QUEUE-HANDOFF-1`

The handoff route requires:

- `approvedSnapshotStatus: approved`
- `approvalRecordStatus: approved`
- `creditPolicyMode: no_spend_generated_fixture_policy`
- `fixtureScope: generated_srt_and_generated_subtitle_only_mkv_fixture`
- `queueHandoffMode: local_mock_queue_handoff_only`
- `routeOwner: backend_service_role_only`
- `routeBridgeMode: queued_handoff_to_existing_guarded_runtime_route`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true`

Allowed command templates remain exactly:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

The local mock queue item payload includes `runtimeRoutePath` and `runtimeRouteBody` for the existing generated-fixture runtime bridge. The queue handoff itself does not execute that route and does not run GStreamer, MKVToolNix, Docker, FFmpeg/FFprobe, Remotion, Supabase, SQL, workers, providers, private media, user media, signed URL creation, public artifact creation, final render/export, external beta unlock, paid production unlock, or production unlock.

Readiness: `ready_for_queued_generated_fixture_runtime_route_invocation`
