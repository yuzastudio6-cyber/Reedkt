# Phase 40D Pro Color/Image Feature E2E Artifact Policy

Phase 40D writes only private staging artifacts.

Generated assets:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40d/<runId>/`
- approved plan snapshot, source validation, sample manifest, bounded input frames, OIIO/OCIO/Kornia outputs, and runtime metadata

Previews:

- `gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/<runId>/`
- private contact sheet or review package and private review manifest

QA:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40d/<runId>/`
- QA JSON and `reports/phase40d-report.json`

Worker temp, if used:

- `gs://reeditpro-staging-reeditpro-worker-temp/activation-pro-color-image/phase40d/<runId>/`

Do not commit generated frames, transformed frames, contact sheets, private JSON
reports, logs, credentials, or large binaries. Do not create public or signed
URLs as evidence.
