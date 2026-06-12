# WEB_SEARCH_CAPTURE Blocked-Use Register

All blocked uses remain blocked after TOOL-STUDY-0.

| Blocked Use | Status | Reason |
| --- | --- | --- |
| broad crawling | blocked | no crawl scope, abuse, source, retention, or cost policy |
| arbitrary URL capture | blocked | requires authorization, consent, redaction, and sandbox review |
| public SearXNG | blocked | private search policy requires controlled private deployment before execution |
| unapproved paid provider expansion | blocked | requires cost, terms, fallback, and storage approval |
| raw Brave response/snippet storage | blocked | sanitized manifests only unless a future policy approves raw retention |
| login/paywall/CAPTCHA bypass | blocked | disallowed by compliance and source authorization policy |
| public artifacts | blocked | search/capture artifacts are private by default |
| signed URLs as source-of-truth | blocked | manifests/checksums are source-of-truth, not temporary delivery URLs |
| raw prompt execution | blocked | workers/providers execute approved snapshots only, not raw prompts |
| raw provider/search response storage | blocked | sanitized summaries/manifests only |
| browser capture execution | blocked | future worker/browser sandbox approval required |
| Playwright browser launch | blocked | package/readiness checks may exist, but no browser opens in this phase |
| Mozilla Readability execution | blocked | extraction policy only; no extraction runtime in this phase |
| screenshot processing execution | blocked | processing policy only; no Sharp/libvips execution in this phase |
| Supabase mutation | blocked | docs/status only; no schema/RLS/migration/storage writes |
| Google Cloud API or storage transfer | blocked | no GCP, Secret Manager, GCS, Cloud Run, or Docker execution |
| production unlock | blocked | production remains blocked |
| internal beta unlock | blocked | internal beta remains blocked for WEB_SEARCH_CAPTURE |
| external beta unlock | blocked | external beta remains blocked |

## Enforcement

Diagnostics must fail when changed docs claim that any blocked use is enabled, executed, production-ready, beta-ready, public, or source-of-truth through signed URLs/raw responses.
