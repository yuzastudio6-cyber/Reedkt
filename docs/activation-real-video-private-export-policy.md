# Phase 30 Private Export Policy

Phase 30 may process exactly one approved artifact set:

- `gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov`
- `activation-real-video/phase29/phase29-20260528T02254/`

The render worker must apply only the Phase 29 keep/remove timeline. It must not introduce new cuts, overwrite source media, create public URLs, run providers, use GPU, download models, run Revideo, or perform audio cleanup, color, masks, enhancement, or slow motion.

Caption handling defaults to `sidecar_only`. Private final delivery may pass for this controlled review export when the MP4 and sidecar caption package are private and export QA has no blocking failures.
