# Phase 49D Readability Extraction Fixture Policy

Phase 49D is limited to `generated_local_html_readability_extraction`.

Allowed:

- Generate one deterministic local/static article fixture in a temp directory.
- Parse the generated local fixture with Mozilla Readability and jsdom.
- Sanitize, normalize, and upload private extraction artifacts.

Blocked:

- Live search.
- Public web extraction.
- Public browser capture.
- Browser launch and screenshots.
- Paid providers.
- Public artifacts and signed URLs as source of truth.
- Production, external beta, paid production, and broad real media.

Phase 49E readiness means controlled private web search/capture E2E preparation only after explicit private endpoint policy.
