# Command Template Registry

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1`

Command-template status: `contract_only_not_executable_in_this_phase`

Future worker code must use command template IDs. It must never accept raw shell command strings from chat, frontend state, routes, or users.

## Allowed Template IDs For Future Disabled Scaffold

| Template ID | Tool | Purpose | Current phase status |
| --- | --- | --- | --- |
| `gst_fakesrc_fakesink_no_media_healthcheck_v1` | GStreamer | No-media health check inherited from prior proof evidence | `contract_only` |
| `gst_controlled_generated_fixture_pipeline_v1` | GStreamer | Controlled generated fixture pipeline only, no user/private media | `contract_only` |
| `mkvmerge_generated_subtitle_only_package_v1` | MKVToolNix | Package generated subtitle-only fixture | `contract_only` |
| `mkvmerge_identify_generated_subtitle_only_v1` | MKVToolNix | Identify generated subtitle-only fixture | `contract_only` |

## Explicitly Forbidden Templates

- arbitrary `gst-launch-1.0` pipeline strings;
- arbitrary `mkvmerge` arguments;
- FFmpeg/FFprobe command templates;
- Docker command templates;
- Remotion render/export templates;
- provider/model templates;
- public URL ingest templates;
- signed URL source-of-truth templates;
- broad private media templates;
- final render/export templates.

## Template Change Policy

Adding or modifying template IDs requires a later PR that updates this registry, diagnostics, negative tests, and the worker scaffold boundary. Template changes must remain disabled until negative tests prove fail-closed behavior.
