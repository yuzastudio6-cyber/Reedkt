# Approved Snapshot Job Envelope

This packet validates the metadata envelope that a later guarded route dry-run may carry.

Command templates:
- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

Tool readiness:
- `gstreamer_render_pipeline_support`: `ready_for_approved_snapshot_job_route_dry_run`
- `mkvtoolnix_container_validation`: `ready_for_approved_snapshot_job_route_dry_run`
- `gpac_mp4box_packaging_validation`: `blocked_pending_package_source_install_proof`

Queue/write behavior:
- Persistent job queue write: `false`
- Route execution: `false`
- Real worker dispatch: `false`
- Worker execution: `false`
- Worker lease claim: `false`
- Tool execution: `false`

Next milestone: `TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-ROUTE-DRY-RUN-1`
