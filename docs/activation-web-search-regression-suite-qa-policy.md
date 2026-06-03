# Phase 49O QA Policy

Mandatory QA gates:
- `phase49n_evidence`
- `provider_failure_modes`
- `capture_failure_modes`
- `browser_processing_failure_modes`
- `artifact_privacy_failures`
- `api_ui_gating_regression`
- `production_beta_blocking`
- `fail_closed_integrity`
- `artifact_privacy`

Phase49P readiness is allowed only when every required scenario is present, every scenario passes, Phase 49N private evidence is verified, private artifact uploads succeed, and all blocked feature flags remain false.

Failures block Phase49P readiness with exact reasons.
