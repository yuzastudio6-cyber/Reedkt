# Phase 49P Web Search Internal Beta Candidate Policy

Phase 49P decides whether the web search/capture stack is ready for controlled internal beta candidate testing only.

Allowed:
- Evidence-only audit of Phase 49A-49O.
- Metadata-only Cloud Run audit for the private SearXNG service.
- Metadata-only Secret Manager audit for the Brave key.
- Private GCS object metadata verification.
- Private JSON artifact upload under `activation-web-search/phase49p/`.

Blocked:
- Live search and Brave API calls.
- Public SearXNG instances and broad crawling.
- Arbitrary URL capture, browser capture, screenshot processing, and Readability extraction.
- Raw Brave response or snippet storage.
- Public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media.

Readiness is `webSearchInternalBetaCandidateReady=true` only when all mandatory QA gates pass. Phase 50A readiness is limited to map/geospatial stack approval and architecture.
