# Phase 49A Web Search/Capture Approval Policy

Phase 49A approves only the architecture and evidence for a future free/open-source web search and capture stack.

## Allowed In Phase 49A

- Static source/tool evidence records.
- License review records.
- Risk register.
- Future phase planning.
- Text-only command plans.
- Read-only report and smoke scripts.

## Blocked In Phase 49A

- Live web search.
- Crawling or scraping websites.
- Public web Playwright launches.
- Screenshot capture.
- Sharp screenshot processing runtime.
- Readability extraction runtime.
- SearXNG runtime.
- Paid provider calls.
- API keys, provider secrets, or secret values.
- Docker build/push.
- GCP mutation or Cloud Run execution.
- Public URLs or public artifacts.
- Signed URLs as source of truth.
- Production, external beta, paid production, and broad real media.
- Providers and Revideo.

## Worker Boundary

Search and capture must be server/worker-side in future phases. The frontend may display source records, summaries, and private artifact references, but it must not hold search/provider secrets or run heavy browser automation.

Future workers must execute approved plan snapshots, not raw chat.

## Source And Rights Policy

Future search/capture must not bypass login gates, CAPTCHAs, paywalls, robots rules, rate limits, or site terms. Every result summary must cite source records, and every screenshot/capture artifact must remain private.
