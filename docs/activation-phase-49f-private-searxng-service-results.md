# Phase 49F Private SearXNG Service Validation Results

Status: completed.

Branch: `codex/rp-activation-49f-private-searxng-service-validation`

Base: `codex/rp-activation-49e-controlled-private-web-search-capture-e2e`

## Scope

Phase 49F validated a real ReeditPro-controlled private SearXNG service as the default free/open-source search provider.

The service target is `reeditpro-staging-private-searxng` in `reeditpro/us-central1`, deployed as an authenticated CPU-only Cloud Run service. Public unauthenticated access remains disabled.

## Execution

Run ID: `phase49f-20260602T204445`

Service strategy: dedicated private authenticated Cloud Run service using the official SearXNG container pinned to the approved linux/amd64 digest in `docker/prod/private-searxng-service/Dockerfile`.

Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-private-searxng@sha256:7f56a77c442601d249389e4cb4101da2046fd62c04818c69eabf8caa7f6957ee`

Controlled query: `ReeditPro open source video editing planning`

Normalized source records: `5`

Invocation: authenticated private Cloud Run request. Audience-bound identity-token minting was unavailable for the active user account, so the run used an authenticated default identity token. No service URL, token, API key, or secret is committed.

## Artifacts

- Plan snapshot: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/plan/private-searxng-service-plan.json`
- Service validation: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/service/service-validation.json`
- Private query response: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/search/private-searxng-query-response.json`
- Normalized results: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/search/normalized-search-results.json`
- Source manifest: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/sources/source-manifest.json`
- Runtime metadata: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/metadata/private-searxng-runtime-metadata.json`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49f/phase49f-20260602T204445/qa/private-searxng-service-qa.json`
- Phase 49F report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49f/phase49f-20260602T204445/reports/phase49f-report.json`

## QA

All mandatory gates passed:

- `phase49e_evidence`
- `private_service_deployed_or_resolved`
- `service_access_control`
- `searxng_api_health`
- `controlled_query`
- `result_normalization`
- `artifact_privacy`
- `blocked_features`

Warnings:

- The active user account could not mint an audience-bound identity token, so the run used an authenticated default identity token.
- Private SearXNG returned more than five results; Phase 49F normalized the first five per policy.

## Phase49G Readiness

Ready only for controlled private live-search/capture E2E using the private SearXNG service and explicit allowlisted capture policy.

## Blocked

Public SearXNG instances, paid providers, browser capture, Readability extraction, screenshots, broad crawling, public artifacts, signed URLs as source of truth, production, external beta, paid production, broad media, providers, and Revideo remain blocked.
