# Phase 49B SearXNG Search Fixture Policy

Phase 49B is generated-fixture execution only. It proves schema, normalization, source attribution, manifest policy, and private artifact handling without contacting any search provider or public website.

## Allowed

- Build a deterministic generated SearXNG-style response.
- Normalize fixture results into source records.
- Reject unsafe URLs in normalization.
- Upload private JSON artifacts to staging GCS.
- Report readiness only for the Phase 49C generated capture fixture.

## Required Gates

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_SEARXNG_SEARCH_FIXTURE=true`

## Blocked

- `liveSearchAllowed=false`
- `browserCaptureAllowed=false`
- `paidProviderAllowed=false`
- `publicArtifactAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `paidProductionAllowed=false`
- `broadRealMediaAllowed=false`

Phase 49B does not create API keys, public URLs, signed URLs, screenshots, crawled content, or extracted article text.
