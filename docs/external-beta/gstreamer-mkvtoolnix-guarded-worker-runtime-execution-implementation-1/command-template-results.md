# Command Template Results

Allowed command-template ids only:

| Template | Exit status | Result | Media boundary |
| --- | ---: | --- | --- |
| `gst_fakesrc_fakesink_no_media_healthcheck_v1` | 0 | passed | no input files and no output media |
| `gst_controlled_generated_fixture_pipeline_v1` | 0 | passed | generated internal test source only and no output media |
| `mkvmerge_generated_subtitle_only_package_v1` | 0 | passed | generated SRT fixture to generated subtitle-only MKV |
| `mkvmerge_identify_generated_subtitle_only_v1` | 0 | passed | generated subtitle-only MKV identify only |

Bounded stdout evidence:

- `mkvmerge_generated_subtitle_only_package_v1`: `mkvmerge v74.0.0 ('You Oughta Know') 64-bit`; generated `/work/runtime-output/synthetic-subtitle-only.mkv`; multiplexing took 0 seconds.
- `mkvmerge_identify_generated_subtitle_only_v1`: `File '/work/runtime-output/synthetic-subtitle-only.mkv': container: Matroska`; `Track ID 0: subtitles (SubRip/SRT)`.

The GStreamer templates ran with quiet output and exit status `0`.

Raw command strings accepted from callers: `false`

Command templates outside the allowlist: `blocked`

FFmpeg/FFprobe expansion: `blocked`

Arbitrary private/user media: `blocked`

Public URL or signed URL source-of-truth: `blocked`
