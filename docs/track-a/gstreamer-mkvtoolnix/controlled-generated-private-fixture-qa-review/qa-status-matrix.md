# QA Status Matrix

| Tool | Accepted Evidence | QA Accepted | QA-Phase Execution | Product Ready |
| --- | --- | --- | --- | --- |
| GStreamer | PR #673 network-disabled `videotestsrc num-buffers=3 ! fakesink`, no file output | yes | not run | no |
| MKVToolNix | PR #673 generated temp `generated-private-subtitles.srt` to `generated-private-subtitle-only.mkv`, then identify | yes | not run | no |

Product-ready end-to-end local OSS tools: `0`

Next gate: `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1`
