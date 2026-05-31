# Phase 38D Real-Video FILM Slow-Motion Artifact Policy

Canonical artifacts are private GCS objects only.

Generated assets:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/<runId>/`
- Includes source validation, plan snapshot copy, segment frames, interpolation manifests, checksum verification, and runtime metadata.

Previews:

- `gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/<runId>/`
- Includes preview frames and optional silent/video-only MP4.

QA:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38d/<runId>/`
- Includes QA JSON and the Phase 38D report.

Worker temp:

- `gs://reeditpro-staging-reeditpro-worker-temp/activation-film-runtime/phase38d/<runId>/`
- Optional only.

Do not commit generated frames, interpolated frames, preview MP4s, private reports, model files, logs, credentials, or other large binary artifacts.
