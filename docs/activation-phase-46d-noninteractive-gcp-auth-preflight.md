# Phase 46D Noninteractive GCP Auth Preflight

The Phase 46D auth preflight checks existing noninteractive GCP access without printing secrets.

Supported auth paths, in order:

- existing active noninteractive `gcloud` account
- configured `auth/impersonate_service_account`
- `REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT`
- `REEDITPRO_GCP_ACCESS_TOKEN_FILE` or configured `auth/access_token_file`
- `CLOUDSDK_AUTH_ACCESS_TOKEN`
- `REEDITPRO_GCP_WIF_CREDENTIAL_FILE` or `GOOGLE_APPLICATION_CREDENTIALS`
- attached service account in a Google-managed environment

The preflight records only pass/fail state, active principal email, sanitized config, and redacted command summaries. Access-token output is redirected/suppressed and recorded as `not_printed`.

If all noninteractive paths fail, Codex must not attempt browser login or create service-account keys. The operator must refresh auth outside Codex, configure scoped impersonation, provide a short-lived token file/env, provide WIF credentials, or run from an attached-service-account environment.
