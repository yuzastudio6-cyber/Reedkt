# Command Template Allowlist

Allowlist status: `contract_only_no_runtime_execution`

The handoff inherits the accepted generated-fixture command-template allowlist from packet 2. A future dry run may validate these template IDs as references. This packet does not execute them.

| Template ID | Tool | Accepted evidence |
| --- | --- | --- |
| `gst_fakesrc_fakesink_no_media_healthcheck_v1` | GStreamer | `passed` |
| `gst_controlled_generated_fixture_pipeline_v1` | GStreamer | `passed` |
| `mkvmerge_generated_subtitle_only_package_v1` | MKVToolNix | `passed` |
| `mkvmerge_identify_generated_subtitle_only_v1` | MKVToolNix | `passed` |

Forbidden in this handoff and the next dry-run planning packet:

- raw `gst-launch-1.0` pipeline strings;
- arbitrary `mkvmerge` argument arrays;
- arbitrary input/output paths;
- private/user media templates;
- FFmpeg/FFprobe templates;
- Docker templates;
- Remotion templates;
- provider/model templates;
- Supabase/SQL templates;
- signed/public artifact templates;
- final render/export templates.

Template changes require a later source-controlled packet with updated diagnostics, negative tests, and explicit owner acceptance.
