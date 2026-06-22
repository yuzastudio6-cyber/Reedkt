# TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1 Command Matrix

All commands ran inside the local render-worker image with Docker network disabled. No pipeline, media input, private artifact, FFmpeg, FFprobe, Remotion, worker, route, provider, Supabase, or SQL command was run.

| id | command | expected scope | result | bounded output evidence |
| --- | --- | --- | --- | --- |
| `path_gst_launch` | `command -v gst-launch-1.0` | command path only | `passed` | `/usr/bin/gst-launch-1.0` |
| `path_gst_inspect` | `command -v gst-inspect-1.0` | command path only | `passed` | `/usr/bin/gst-inspect-1.0` |
| `path_mkvmerge` | `command -v mkvmerge` | command path only | `passed` | `/usr/bin/mkvmerge` |
| `version_gst_launch` | `gst-launch-1.0 --version` | version/help only | `passed` | `gst-launch-1.0 version 1.22.0` |
| `version_gst_inspect` | `gst-inspect-1.0 --version` | version/help only | `passed` | `gst-inspect-1.0 version 1.22.0` |
| `version_mkvmerge` | `mkvmerge --version` | version/help only | `passed` | `mkvmerge v74.0.0 ('You Oughta Know') 64-bit` |
| `plugin_coreelements` | `gst-inspect-1.0 coreelements` | plugin metadata inspection only | `passed` | `Plugin Details:` |
| `plugin_fakesrc` | `gst-inspect-1.0 fakesrc` | plugin metadata inspection only | `passed` | `Factory Details:` |
| `plugin_fakesink` | `gst-inspect-1.0 fakesink` | plugin metadata inspection only | `passed` | `Factory Details:` |

Rejected scopes:

- GStreamer pipeline execution: `not_run`
- MKVToolNix media command: `not_run`
- FFmpeg/FFprobe execution: `not_run`
- Media processing: `not_run`
- Docker push/deployment: `not_run`
