# TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1 Command Matrix

Command matrix status: `completed_controlled_synthetic_fixture_checks`

| id | command | fixture/input | output | result |
| --- | --- | --- | --- | --- |
| `gstreamer_synthetic_fakesrc_fakesink` | `gst-launch-1.0 -q fakesrc num-buffers=3 ! fakesink` | in-memory `fakesrc`; no input file | `fakesink`; no output file | `passed` |
| `mkvtoolnix_synthetic_srt_mux` | `mkvmerge -o synthetic-subtitle-only.mkv synthetic.srt` | generated `/tmp` SRT only | generated `/tmp` MKV only | `passed` |
| `mkvtoolnix_synthetic_mkv_identify` | `mkvmerge --identify synthetic-subtitle-only.mkv` | generated `/tmp` MKV only | sanitized identify stdout | `passed` |

## Command Notes

GStreamer used only `fakesrc` and `fakesink`; no decoder, encoder, file source, file sink, private media, public artifact, or render/export path was involved.

MKVToolNix used only the generated `synthetic.srt` fixture and produced `synthetic-subtitle-only.mkv` under `/tmp`. The MKV exists only as a local proof artifact and is not committed.

FFmpeg/FFprobe remain Track B-owned shared dependencies only.

Atlas Track A does not claim FFmpeg/FFprobe ownership or install proof.

Private/user media used: `false`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
