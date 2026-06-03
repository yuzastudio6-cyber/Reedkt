# Phase 49I Web Search/Capture UI API Gating Policy

Phase 49I preserves the Phase 49H fail-closed stance while exposing internal API and UX contracts.

## Allowed

- Authenticated internal API route contracts.
- Static frontend-safe mock metadata and mock handlers.
- Chat-native developer card showing readiness, limits, and blocked scopes.
- Private JSON report upload during confirmed execution.

## Required Gate Values

- `provider=searxng`
- `providerMode=private_fixture_provider`
- `mockOnly=true`
- `rawPromptExecution=false`
- `maxResults<=3`
- `maxCapturePages=0`
- `paidProvidersAllowed=false`
- `publicSearxngAllowed=false`
- `arbitraryUrlCaptureAllowed=false`
- `publicArtifactAllowed=false`
- `signedUrlSourceOfTruthAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadMediaAllowed=false`

## Forbidden

No live SearXNG query, public SearXNG instance, paid search provider, Playwright launch, screenshot capture, Sharp screenshot processing, Readability extraction, provider secret, frontend secret, public artifact, signed URL source-of-truth, Docker build/push, Cloud Run deploy, production unlock, external beta unlock, paid production unlock, or broad media unlock is allowed in Phase 49I.
