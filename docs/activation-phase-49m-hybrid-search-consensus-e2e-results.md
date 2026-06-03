# Phase 49M Hybrid Search Consensus E2E Results

Status: completed.

Phase 49M validates SearXNG + Brave hybrid consensus for controlled internal
testing only. SearXNG remains the default free/open-source provider. Brave is
an optional paid confidence booster, enabled only through backend secret,
budget, and storage-rights gates.

## Completed Run

- Run ID: `phase49m-20260603T17105`
- Query: `site:docs.searxng.org searxng search api`
- SearXNG normalized sources: 5
- Brave minimal normalized sources: 5
- Merged consensus sources: 7
- Provider agreement score: 43
- Playwright allowlisted captures: 2
- Sharp derivative sets: 2
- Sanitized Readability extractions: 2
- Raw Brave response storage: false
- Brave snippet storage: false
- Blockers: none
- Warnings: private SearXNG returned more than five results and Phase 49M
  retained the first five; audience-bound identity-token invocation was not
  available for the active user account, so the runner used the default
  authenticated identity token.

## Private Artifacts

- Plan:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/phase49m-20260603T17105/plan/hybrid-search-consensus-plan.json`
- SearXNG sources:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/phase49m-20260603T17105/searxng/searxng-normalized-sources.json`
- Brave sources:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/phase49m-20260603T17105/brave/brave-normalized-sources.json`
- Merged sources:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/phase49m-20260603T17105/merged/hybrid-merged-sources.json`
- Dedupe report:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/phase49m-20260603T17105/dedupe/hybrid-dedupe-report.json`
- Consensus report:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/phase49m-20260603T17105/consensus/hybrid-consensus-report.json`
- Combined manifest:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49m/phase49m-20260603T17105/manifest/hybrid-search-consensus-e2e-manifest.json`
- QA:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49m/phase49m-20260603T17105/qa/hybrid-search-consensus-e2e-qa.json`
- Report:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49m/phase49m-20260603T17105/reports/phase49m-report.json`

Screenshots, Sharp derivatives, and extraction outputs were uploaded only under
the private Phase 49M generated-assets prefix. No screenshot or extraction
artifact was committed.

## Phase49N Readiness

Phase 49N is ready only as a search provider readiness gate. It is not
production, external beta, paid production, broad-media readiness, broad
crawling, or arbitrary capture approval.

## Blocked Scope

Production, external beta, paid production, broad media, public SearXNG, other
paid providers, broad crawling, arbitrary URL capture, public artifacts, signed
URLs as source of truth, and final delivery remain blocked.
