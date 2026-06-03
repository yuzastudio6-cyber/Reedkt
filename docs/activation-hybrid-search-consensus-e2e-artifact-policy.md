# Phase 49M Hybrid Search Consensus Artifact Policy

Phase 49M uploads private artifacts only under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49m/<runId>/`

Allowed artifacts:

- approved plan snapshot
- normalized SearXNG source records
- minimal normalized Brave source records
- merged source records
- dedupe and consensus reports
- allowlisted screenshots and Sharp derivatives
- sanitized Readability extraction artifacts
- combined manifest
- QA JSON and Phase 49M report JSON

Blocked artifacts:

- raw Brave API response
- Brave snippets
- request headers
- API key material
- public URLs as source of truth
- signed URLs
- public artifacts
- unbounded crawled content
