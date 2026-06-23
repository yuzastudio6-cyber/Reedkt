# MKVToolNix Command Plan

Status: `planned_no_execution`

Allowed future command class: `mux_and_identify_generated_temp_subtitle_fixture_only`

Preferred future command families:

- `mkvmerge -o generated-private-subtitle-only.mkv generated-private-subtitles.srt`
- `mkvmerge --identify generated-private-subtitle-only.mkv`

This phase defines command scope only. MKVToolNix execution: `not_run`

## Future Requirements

- Mux and identify only the explicitly generated temp subtitle fixture.
- No broad file discovery.
- No arbitrary media probing.
- No FFmpeg/FFprobe.
- No render/export.
- Output remains temporary only.
- Safe stdout only.
- Cleanup required before the future execution phase ends.

## Disallowed

Private/user media, real media, broad media processing, public artifacts, signed URLs, beta, production, and product runtime remain disallowed.
