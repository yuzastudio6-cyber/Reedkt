# MKVToolNix Evidence Acceptance

PR #673 evidence is accepted for MKVToolNix only as generated synthetic-private temp fixture proof.

Accepted merge command class: generated `generated-private-subtitles.srt` muxed to `generated-private-subtitle-only.mkv`.

Accepted identify command class: identify only the generated subtitle-only MKV.

Evidence result: merge exit status `0`; identify exit status `0`; identified container `Matroska`; identified track `SubRip/SRT`.

Generated temp fixture evidence:

- `generated-private-subtitles.srt`, 77 bytes, sha256 `2487edd658e8459b7818baf0422c8db6679f693020d78aeb90d5be0fb5aa446b`
- `generated-private-subtitle-only.mkv`, 5823 bytes, sha256 `ea659dec22a7492be8af90a521be03f76367723e99570e32e9f3b59d68ec1b82`

QA-phase MKVToolNix execution: `not_run`. This QA packet accepts existing PR #673 evidence only and does not regenerate SRT or MKV files.

Not accepted: user/private/real media, arbitrary media probing, FFmpeg/FFprobe, render/export, public artifacts, signed URLs, or committed generated media artifacts.
