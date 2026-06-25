# MP4Box Command Report

Accepted commands:

- `MP4Box -add generated-synthetic-subtitles.srt:hdlr=sbtl -new generated-synthetic-subtitle-only.mp4`
- `MP4Box -info generated-synthetic-subtitle-only.mp4`

Sanitized evidence:

- `MP4Box -add` imported timed text as a subtitle track.
- `MP4Box -info` reported one track.
- Duration: `00:00:01.000`.
- Media type: `sbtl:tx3g`.
- Codec: `tx3g`.
- Tool metadata: `GPAC-26.02-rev0-g118e60a90-HEAD`.

No FFmpeg/FFprobe, user/private/real media, arbitrary probing, render/export, public artifacts, signed URLs, Supabase/GCS, beta, or production scope ran.
