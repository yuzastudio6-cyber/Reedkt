# Phase 49N Search Provider Readiness Artifact Policy

Phase 49N uploads private JSON only under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49n/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49n/<runId>/`

Expected generated-assets outputs:

- `readiness/search-provider-readiness-manifest.json`
- `evidence/evidence-chain.json`
- `provider/provider-registry-audit.json`
- `secret/brave-secret-metadata-audit.json`
- `cost/brave-cost-policy-audit.json`
- `storage/brave-storage-policy-audit.json`
- `policy/search-provider-failure-policy.json`

Expected QA outputs:

- `qa/search-provider-readiness-qa.json`
- `reports/phase49n-report.json`

Forbidden artifacts:

- Brave API key values
- raw Brave responses
- Brave snippets
- request headers
- screenshots
- extracted content
- public URLs as source of truth
- signed URLs as source of truth
