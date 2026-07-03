# Command Matrix

Allowed commands were executed only through the existing guarded generated-fixture runner.

| Template | Tool | Result | Input | Output |
| --- | --- | --- | --- | --- |
| `gst_fakesrc_fakesink_no_media_healthcheck_v1` | GStreamer | `passed` | `false` | `false` |
| `gst_controlled_generated_fixture_pipeline_v1` | GStreamer | `passed` | `false` | `false` |
| `mkvmerge_generated_subtitle_only_package_v1` | MKVToolNix | `passed` | `generated_srt_fixture_only` | `generated_subtitle_only_mkv_fixture` |
| `mkvmerge_identify_generated_subtitle_only_v1` | MKVToolNix | `passed` | `generated_srt_fixture_only` | `false` |

Blocked in this packet:
- Raw caller command strings.
- Arbitrary user/private media.
- FFmpeg/FFprobe.
- GPAC/MP4Box.
- Docker push/deploy.
- Supabase mutation or SQL.
- Signed/public artifacts.
- Final render/export.
