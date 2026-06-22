# TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1 Runtime Result

Decision: `completed_gstreamer_mkvtoolnix_controlled_synthetic_fixture_proof`

Execution: `completed_controlled_synthetic_fixture_checks`

Run ID: `2026-06-22T14-31-44-660Z-390958ab`

Output directory: `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1/2026-06-22T14-31-44-660Z-390958ab`

Image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`

Image source: `reused_local_609_proof_image`

Docker network mode: `none`

Fresh render-worker Docker build: `not_run_reused_609_image`

GStreamer synthetic proof: `passed`

MKVToolNix synthetic proof: `passed`

Private/user media used: `false`

Generated artifacts committed: `none`

## GStreamer Result

Command:

`gst-launch-1.0 -q fakesrc num-buffers=3 ! fakesink`

Fixture type: `in_memory_fakesrc_fakesink`

Exit status: `0`

Stdout: `empty_expected_for_quiet_mode`

## MKVToolNix Result

Synthetic input:

- `synthetic.srt`
- bytes `69`
- sha256 `c2ebd06b54f89e74f2fc71eff1c044bac9919d872b2bf989506789742cf0746b`

Commands:

- `mkvmerge -o synthetic-subtitle-only.mkv synthetic.srt`
- `mkvmerge --identify synthetic-subtitle-only.mkv`

Synthetic output:

- `synthetic-subtitle-only.mkv`
- bytes `5816`
- sha256 `8a6bf722a2c5e71665fac49a0c8b4baf33c6c9bfacacd1815e1819e864109fcb`

Sanitized identify snippet:

`File '/proof/synthetic-subtitle-only.mkv': container: Matroska`

`Track ID 0: subtitles (SubRip/SRT)`

## Runtime Boundaries

FFmpeg execution: `not_run`

FFprobe execution: `not_run`

Remotion execution: `not_run`

Docker push: `not_run`

Docker deployment: `not_run`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
