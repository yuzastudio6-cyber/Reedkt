# Real Video Mask Artifact Policy

Phase 33D artifacts must remain private under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase33d/<runId>/`

Expected artifacts are one representative frame PNG, one mask PNG, one RGBA
cutout PNG, mask metadata JSON, QA JSON, and the Phase 33D report JSON.

No image, mask, cutout, video, or transcript artifact may be committed to git.
No public signed URL or public bucket policy is allowed.
