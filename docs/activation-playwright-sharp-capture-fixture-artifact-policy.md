# Phase 49C Playwright + Sharp Capture Fixture Artifact Policy

Phase 49C artifacts are private and must not be committed.

## Generated Assets

Prefix:

```text
gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49c/<runId>/
```

Artifacts:

- `plan/approved-capture-plan-snapshot.json`
- `fixture/generated-local-page.html`
- `capture/playwright-page-metadata.json`
- `capture/screenshot-original.png`
- `processed/screenshot-preview.png`
- `processed/screenshot-thumbnail.png`
- `processed/sharp-image-metadata.json`
- `manifest/capture-artifact-manifest.json`

## QA

Prefix:

```text
gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49c/<runId>/
```

Artifacts:

- `qa/playwright-sharp-capture-qa.json`
- `reports/phase49c-report.json`

## Commit Policy

Do not commit generated HTML fixtures, screenshots, processed images, private JSON reports, browser binaries, logs, credentials, secrets, or large binaries.
