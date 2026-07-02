# Qwen Live Beta Known Failures

Known blocked states:
- `blocked_runtime_disabled`: beta runtime flag is absent.
- `blocked_missing_project_config`: Google Cloud project identity is absent.
- `blocked_missing_secret_reference`: API-key Secret Manager reference is absent.
- `blocked_secret_access_denied`: Secret Manager access failed or returned unusable data.
- `blocked_missing_endpoint`: Qwen endpoint is absent.
- `blocked_missing_model_id`: Qwen model ID is absent.
- `blocked_frontend_boundary`: frontend/server boundary checks failed.
- `failed_redaction_check`: redaction did not mask a synthetic secret-like token.

Fallback success is not live success. RP-QWEN-BETA-02 is complete only when doctor, live provider smoke, live Marker Chat smoke, frontend boundary, build/lint, and requested QA pass with real provider evidence.
