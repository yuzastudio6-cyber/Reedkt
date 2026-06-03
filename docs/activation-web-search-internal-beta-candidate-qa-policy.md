# Phase 49P Web Search Internal Beta Candidate QA Policy

Mandatory QA gates:
- `phase_evidence_chain`
- `provider_readiness`
- `ui_api_gating`
- `regression_suite`
- `secret_safety`
- `cost_storage_policy`
- `artifact_privacy`
- `failure_policy`
- `readiness_docs_consistency`
- `blocked_features`

Every gate must pass before `webSearchInternalBetaCandidateReady=true`.

The QA decision must keep blocked:
- production
- external beta
- paid production
- broad media
- public SearXNG
- broad crawling
- arbitrary URL capture
- public artifacts
- signed URLs as source of truth
- raw Brave response storage
- Brave snippet storage
- other paid providers
- CAPTCHA, login, and paywall bypass
- unrestricted provider execution
