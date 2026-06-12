# WEB_SEARCH_CAPTURE Routing Policy

## Routing Decision Order

1. Choose `no_search_manifest_only` when the user request, uploaded content, or approved plan already includes enough verified context.
2. Choose private search planning when current public source discovery is required and a future approved private SearXNG route exists.
3. Choose Brave fallback only when private search fails or confidence is too low and a future fallback approval explicitly allows the provider, cost cap, retry policy, and sanitized storage policy.
4. Choose controlled capture only for approved URLs/pages, owned internal pages, user-authorized dashboards, or explicit user-provided web targets with consent and redaction plan.
5. Choose Readability extraction only from approved source/capture inputs and only to create sanitized extraction manifests and summaries.
6. Choose screenshot processing only after a capture manifest exists and only for private redacted asset preparation.
7. Choose QA-only review when any evidence exists but execution remains unapproved.

## Source-Of-Truth Policy

Allowed source-of-truth evidence:

- sanitized `source_manifest`
- sanitized `capture_manifest`
- sanitized `extraction_manifest`
- `search_capture_qa_report`
- future private artifact refs with checksums and retention metadata

Not source-of-truth:

- raw SearXNG responses
- raw Brave responses or snippets
- raw provider/model payloads
- raw prompts
- browser session state
- cookies or credentials
- signed URLs
- public artifacts
- unredacted screenshots

## Fail-Closed Policy

Routing must fail closed when the request requires broad crawling, arbitrary URL capture, public SearXNG, unapproved paid provider expansion, raw Brave response/snippet storage, login/paywall/CAPTCHA bypass, public artifacts, signed URLs as source-of-truth, raw prompt execution, production unlock, external beta unlock, or any runtime/tool execution not separately approved.

## Privacy And Compliance

Every future search/capture route must preserve source consent, redaction, retention, quote/copyright limits, private artifact policy, and audit logging. Documentary/case-study evidence must use safe wording unless source confidence is high and reviewed.

## Planning Output

The AI brain may produce structured route intent only:

- desired route family: `web_search_capture`
- chosen mode: no-search, search, fallback, capture, extraction, screenshot processing, or QA-only
- required approvals
- source/capture/extraction manifest requirements
- blocked-use reasons
- owner handoffs

The AI brain must not execute searches, captures, tools, browser sessions, workers, providers, routes, or raw prompts.
