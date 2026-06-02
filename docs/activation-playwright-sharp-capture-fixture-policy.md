# Phase 49C Playwright + Sharp Capture Fixture Policy

Phase 49C is a local fixture execution phase. It does not approve public web capture.

## Allowed

- Runtime-generate a static HTML fixture with no external assets.
- Launch Playwright Chromium against `file://` local fixture content only.
- Capture a full-page PNG screenshot.
- Process only that screenshot with Sharp.
- Upload private generated-assets and QA artifacts.

## Required Execution Env

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_PLAYWRIGHT_SHARP_CAPTURE_FIXTURE=true`

## Blocked Gates

- `liveSearchAllowed=false`
- `publicWebCaptureAllowed=false`
- `paidProviderAllowed=false`
- `readabilityExtractionAllowed=false`
- `publicArtifactAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `paidProductionAllowed=false`
- `broadRealMediaAllowed=false`

Playwright may render only the generated local fixture. Sharp may read only the generated screenshot.
