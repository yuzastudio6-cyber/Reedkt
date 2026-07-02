# Production Mask Artifact Policy

Mask execution artifacts are private storage refs, never signed URLs.

Supported M15C artifacts:

- `mask_image`
- `mask_sequence`
- `rgba_cutout`
- `qa_report`
- optional `preview_video` only if a future safe local-dev preview actually runs
- `render_manifest` for depth/text-behind-subject metadata

Source/proxy media remain immutable. Mask artifacts may be source-of-truth for future composition only after QA and approved snapshot gates pass.
