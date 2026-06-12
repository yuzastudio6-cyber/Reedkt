# WEB_SEARCH_CAPTURE Tool Combination Map

All combinations are planning contracts only. None execute in TOOL-STUDY-0.

| Combination | Primary Purpose | Allowed Inputs | Outputs | When To Use | Fail-Closed Conditions | Handoff |
| --- | --- | --- | --- | --- | --- | --- |
| `no_search_manifest_only` | avoid unnecessary search/capture | compiled intent, existing approved source context | routing decision record | user supplied enough verified source context or request does not need web evidence | uncertainty about claims, missing citation need, user asks for current evidence | Provider Gateway gets no-search reason only |
| `private_search_source_manifest` | private source discovery | approved search query intent and domain policy | sanitized `source_manifest`, QA summary | current public source discovery is needed and private SearXNG is approved in a future phase | broad crawl request, private data, no allowlist, upstream outage | Compliance reviews sources; Provider Gateway receives sanitized manifest only |
| `private_search_brave_fallback_manifest` | fallback source discovery | SearXNG failure/low confidence plus explicit fallback policy | source manifest with fallback reason | private SearXNG is insufficient and fallback cost/terms gates pass | cost cap missing, raw Brave response storage required, unapproved provider expansion | Billing/Observability record fallback reason; Provider Gateway receives sanitized manifest |
| `approved_capture_manifest` | authorized page/app screenshot capture | approved target, viewport, selector, consent/source policy | `capture_manifest`, private screenshot ref, QA report | owned/user-authorized pages or dashboards need visual evidence | arbitrary URL, login/paywall/CAPTCHA bypass, sensitive data without redaction plan | Worker Runtime future execution; Track A render intake after approval |
| `capture_readability_extraction` | text summary from approved capture/source | approved capture/source ref and extraction rules | `extraction_manifest`, extraction QA | article-like content needs source-aware summary | raw article archive required, copyright quote limit missing, private page | Compliance and Frontend review evidence card text |
| `capture_screenshot_processing` | prep screenshot for later composition | private capture ref, crop/redaction settings | processed capture manifest, redaction QA | a web capture is approved and must be visually composed later | public output, unredacted sensitive data, signed URL as source truth | Track A receives private asset refs and manifest after future approval |
| `qa_only_manifest_review` | review evidence without live tools | source/capture/extraction manifests | `search_capture_qa_report` | any future route wants to hand web evidence to planner/worker | missing source confidence, missing redaction, unsafe blocked use | Observability/Compliance/Frontend get review-only status |

## Combination Rules

- Search can precede capture only when a future approved phase allows search result source selection.
- Capture can precede extraction only for approved sources or user-authorized pages.
- Brave fallback can never run automatically; it requires explicit fallback reason, cost guardrail, and provider terms review.
- Screenshot processing cannot create render-ready public output; it only prepares private future worker artifacts.
- QA report generation must fail closed if any manifest references signed URLs as source-of-truth, raw search responses, raw prompts, secrets, or public artifacts.
