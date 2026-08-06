# Phase 49F Private SearXNG Service Validation Results

Status: planned.

Branch: `codex/rp-activation-49f-private-searxng-service-validation`

Base: `codex/rp-activation-49e-controlled-private-web-search-capture-e2e`

## Scope

Phase 49F validates a real ReeditPro-controlled private SearXNG service as the default free/open-source search provider.

The service target is `reeditpro-staging-private-searxng` in `reeditpro/us-central1`, deployed as an authenticated CPU-only Cloud Run service.

## Execution

Run ID: not executed yet.

Service strategy: dedicated private authenticated Cloud Run service using the official SearXNG container pinned to the approved linux/amd64 digest in `docker/prod/private-searxng-service/Dockerfile`.

Controlled query: `ReeditPro open source video editing planning`.

## QA

Pending execution gates:

- `phase49e_evidence`
- `private_service_deployed_or_resolved`
- `service_access_control`
- `searxng_api_health`
- `controlled_query`
- `result_normalization`
- `artifact_privacy`
- `blocked_features`

## Phase49G Readiness

Blocked until Phase 49F executes and all mandatory private SearXNG service validation gates pass.

## Blocked

Public SearXNG instances, paid providers, browser capture, Readability extraction, screenshots, broad crawling, public artifacts, signed URLs as source of truth, production, external beta, paid production, broad media, providers, and Revideo remain blocked.
