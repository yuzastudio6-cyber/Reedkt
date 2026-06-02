# Phase 49C Playwright + Sharp Capture Fixture Runbook

Phase 49C validates local generated browser capture and screenshot post-processing only.

## Scope

- Generate a local static HTML fixture in a temp directory.
- Open only that local fixture with Playwright Chromium.
- Capture a private PNG screenshot.
- Process that screenshot with Sharp into a bounded preview and thumbnail.
- Upload private artifacts to the Phase 49C generated-assets and QA prefixes.

## Commands

Static report:

```sh
npm run activation:playwright-sharp-capture-fixture:report
```

IAM plan:

```sh
npm run activation:playwright-sharp-capture-fixture:iam-plan
```

Execution:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE=true \
npm run activation:playwright-sharp-capture-fixture -- --execute
```

If Chromium is missing, install only the required Playwright Chromium browser outside git with the normal Playwright browser install command, then rerun the bounded execution.

## Blocked

Live search, SearXNG endpoint calls, public browser capture, public websites, paid providers, Readability extraction, public artifacts, signed URLs as source of truth, Docker, Cloud Run, production, external beta, paid production, broad media, providers, and Revideo remain blocked.
