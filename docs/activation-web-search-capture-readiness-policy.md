# Phase 49H Web Search/Capture Readiness Policy

Phase 49H closes web search/capture readiness for internal testing only after Phase 49G.

Allowed:

- Verify Phase 49A-49G approved evidence.
- Verify required private GCS artifacts exist by metadata.
- Inspect `reeditpro-staging-private-searxng` Cloud Run service metadata and IAM.
- Upload private JSON readiness artifacts.

Blocked:

- New live search query.
- Public SearXNG instances.
- Paid search/capture providers.
- Browser capture, screenshot processing, and Readability extraction.
- Arbitrary URL capture or broad crawling.
- Docker build/push and Cloud Run deploy/update.
- Public URLs, public buckets, signed URLs as source of truth.
- Production, external beta, paid production, and broad real media.

The private SearXNG service must remain authenticated/private. Any `allUsers` or `allAuthenticatedUsers` invoker binding blocks readiness.
