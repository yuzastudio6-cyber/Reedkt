# Phase 39C-SG Noninteractive GCP Auth Preflight

The auth preflight is the first gate for Phase 39C-SG-AUTH-RERUN. It runs safe gcloud diagnostics with prompts disabled and records only sanitized metadata.

Allowed auth paths, in order:

1. Existing active gcloud account that can print an access token without prompting.
2. Existing `auth/impersonate_service_account` gcloud config.
3. `REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT`, passed as `--impersonate-service-account`.
4. `REEDITPRO_GCP_ACCESS_TOKEN_FILE` or configured `auth/access_token_file`.
5. `CLOUDSDK_AUTH_ACCESS_TOKEN`.
6. `REEDITPRO_GCP_WIF_CREDENTIAL_FILE` or `GOOGLE_APPLICATION_CREDENTIALS` for an already supplied WIF credential.
7. Attached service account in a Google-managed environment.

The preflight checks the active account email, project, sanitized config, token validity with output redirected/redacted, Cloud Build list access, Artifact Registry repository describe access, Cloud Run job list access, generated-assets bucket describe access, QA bucket describe access, and QA bucket IAM policy read access.

If any required auth or permission probe fails, Cloud Build, import smoke, model copy, and generated runtime are not attempted.

Primary policy references:

- Google Cloud gcloud authentication docs: https://docs.cloud.google.com/docs/authentication/gcloud
- Google Cloud service-account impersonation docs: https://docs.cloud.google.com/docs/authentication/use-service-account-impersonation
- IAM service-account impersonation docs: https://docs.cloud.google.com/iam/docs/service-account-impersonation
- gcloud global flags reference: https://docs.cloud.google.com/sdk/gcloud/reference
