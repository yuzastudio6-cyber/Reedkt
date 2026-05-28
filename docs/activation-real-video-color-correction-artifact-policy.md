# Phase 32 Color Correction Artifact Policy

Phase 32 artifacts must remain private.

- Color analysis and grade recipe: `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-real-video/phase32/<runId>/`.
- Frame/stat metadata: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase32/<runId>/`.
- Color-corrected export: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/<runId>/`.
- QA and Phase 32 report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase32/<runId>/`.

No media or generated artifact should be committed to git. Signed URLs are not a source of truth.
