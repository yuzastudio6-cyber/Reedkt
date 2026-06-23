# MKVToolNix Execution Report

Generated SRT: `generated-private-subtitles.srt`, bytes `77`, sha256 `2487edd658e8459b7818baf0422c8db6679f693020d78aeb90d5be0fb5aa446b`.

Generated subtitle-only MKV: `generated-private-subtitle-only.mkv`, bytes `5823`, sha256 `ea659dec22a7492be8af90a521be03f76367723e99570e32e9f3b59d68ec1b82`.

Mux command: `docker run --rm --network none -v <runRoot>:/proof <image> mkvmerge -o /proof/generated-private-subtitle-only.mkv /proof/generated-private-subtitles.srt`

Identify command: `docker run --rm --network none -v <runRoot>:/proof:ro <image> mkvmerge --identify /proof/generated-private-subtitle-only.mkv`

Identify output confirmed Matroska with SubRip/SRT subtitle track. Docker network was `none`. Decision: `passed`.
