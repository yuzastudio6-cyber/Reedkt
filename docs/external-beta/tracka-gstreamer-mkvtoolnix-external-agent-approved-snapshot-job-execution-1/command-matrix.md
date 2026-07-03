# Command Matrix

Executed only inside the approved generated-fixture lane:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`: `passed`
- `gst_controlled_generated_fixture_pipeline_v1`: `passed`
- `mkvmerge_generated_subtitle_only_package_v1`: `passed`
- `mkvmerge_identify_generated_subtitle_only_v1`: `passed`

Not executed:
- GPAC/MP4Box: `blocked_pending_package_source_install_proof`
- FFmpeg/FFprobe: `not_run`
- Private media: `not_run`
- User media: `not_run`
- Final render/export: `not_run`
