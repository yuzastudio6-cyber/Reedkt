# Phase 45A Libass Burn-In Validation Policy

Phase 45A is Track A visual/video only. It validates FFmpeg/libass caption
burn-in on one bounded private preview sample.

Approved input video:

`gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

Approved caption source:

`gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass`

The ASS sidecar SHA-256 must match
`a103dd9a1252c48de27d1b4daf4e87180786bbdb781426fcc2888718cf8bc6de`.

Allowed tools are FFmpeg, ffprobe, and libass subtitle filters only. Runtime
downloads, raw-chat caption generation, arbitrary media, providers, Revideo,
Track B tools, final delivery, production, external beta, and broad real media
remain blocked.
