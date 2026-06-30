# Command Template Matrix

Allowed future command-template ids:

| Template | Future dry-run scope | Media boundary |
| --- | --- | --- |
| `gst_fakesrc_fakesink_no_media_healthcheck_v1` | GStreamer no-media healthcheck template | no input files and no output media |
| `gst_controlled_generated_fixture_pipeline_v1` | controlled generated fixture template | generated/private fixture only |
| `mkvmerge_generated_subtitle_only_package_v1` | MKVToolNix generated subtitle-only package template | generated subtitle fixture only |
| `mkvmerge_identify_generated_subtitle_only_v1` | MKVToolNix generated subtitle-only identify template | generated local/private fixture only |

Raw command strings allowed: `false`

Template expansion outside this list is blocked.

FFmpeg/FFprobe expansion: `blocked`

Docker deployment: `blocked`

Remotion rendering: `blocked`

Final render/export: `blocked`
