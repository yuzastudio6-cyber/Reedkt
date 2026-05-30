# Phase 38C FILM Runtime Artifact Policy

Runtime artifacts are private-only and scoped under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38c/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38c/<runId>/`
- optional worker temp prefix:
  `gs://reeditpro-staging-reeditpro-worker-temp/activation-film-runtime/phase38c/<runId>/`

Expected generated-assets artifacts:

- `fixture/frame-a.png`
- `fixture/frame-b.png`
- `fixture/fixture-manifest.json`
- `interpolated/interpolated-frame-000.png`
- `interpolated/interpolation-sequence-manifest.json`
- `metadata/model-checksum-verification.json`
- `metadata/film-runtime-metadata.json`

Expected QA artifacts:

- `qa/film-runtime-qa.json`
- `reports/phase38c-report.json`

Do not commit FILM model files, generated frames, interpolated frames, private
JSON reports, logs, credentials, Docker output, or large binaries.
