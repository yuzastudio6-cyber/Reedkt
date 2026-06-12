# WEB_SEARCH_CAPTURE Internal Beta Gap Map

Main readiness: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Internal beta remains blocked.

## Internal Beta Blockers

| Gap | Status | Required Next Step |
| --- | --- | --- |
| Private SearXNG execution approval | blocked | approve private search endpoint, query policy, retention, and private artifact storage |
| Brave fallback approval | blocked | approve provider terms, cost cap, retry policy, sanitized response storage, and fallback reason schema |
| Controlled capture approval | blocked | approve URL authorization, consent, browser sandbox, redaction, and worker boundary |
| Readability extraction approval | blocked | approve extraction source limits, copyright/quote policy, and redacted summary policy |
| Screenshot processing approval | blocked | approve Sharp/libvips runtime, redaction QA, checksum policy, and Track A handoff |
| Source/capture/extraction schemas | blocked | formalize manifest schemas and validation fixtures |
| Worker Runtime execution boundary | blocked | require future transactional worker runtime approval before any job execution |
| Observability/cost/abuse controls | blocked | define caps, logs, abuse prevention, and retention |
| Supabase milestone sync | blocked | current branch lacks approved sync layer |

## External Beta Blockers

- no live search/capture execution approval
- no public artifact or signed URL delivery approval
- no provider fallback production terms review
- no privacy/security/legal review for broad user web targets
- no abuse controls for crawling or capture volume
- no production retention/deletion policy

## Production Blockers

- no production web search provider contract
- no production browser sandbox/worker runtime
- no production storage delivery contract
- no RLS/storage review for capture artifacts
- no billing/credit model for paid provider fallback or capture jobs
- no SLO, alerting, cost controls, or incident process

## Duplicate Risk

Low. Existing Phase 44D covers web capability profiling metadata, not search/capture routing. Existing Playwright readiness checks package availability only and do not open browsers. TOOL-STUDY-0 adds the missing owner contract.
