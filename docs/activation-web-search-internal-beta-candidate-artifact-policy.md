# Phase 49P Web Search Internal Beta Candidate Artifact Policy

Phase 49P writes private JSON only.

Generated-assets prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49p/<runId>/`

Expected generated-assets objects:
- `readiness/web-search-internal-beta-candidate-manifest.json`
- `evidence/evidence-chain.json`
- `ui-api/ui-api-gating-audit.json`
- `provider/provider-scope-audit.json`
- `regression/regression-summary.json`
- `policy/final-fail-closed-policy.json`

QA prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49p/<runId>/`

Expected QA objects:
- `qa/web-search-internal-beta-candidate-qa.json`
- `reports/phase49p-report.json`

Forbidden artifacts:
- Secret values, request headers, raw Brave responses, Brave snippets, screenshots, extracted content, browser artifacts, public URLs as source of truth, signed URLs, logs, credentials, and large binaries.
