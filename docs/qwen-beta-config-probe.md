# Qwen Beta Config Probe

`probe:qwen-beta-config` is a metadata-only helper for unblocking live Qwen 3.7 Max verification.

It exists because the live verifier can authenticate to Google Cloud in GitHub Actions, while local developer machines may not have non-interactive `gcloud` credentials. The probe reports the current Qwen workflow variable coverage and lists only matching Secret Manager resource names for Qwen/DashScope/reasoning candidates.

## Command

```bash
REEDITPRO_CONFIRM_QWEN_BETA_CONFIG_PROBE=PROBE_REEDITPRO_QWEN_BETA_CONFIG \
GOOGLE_CLOUD_PROJECT_ID=reeditpro \
npm run probe:qwen-beta-config
```

The recommended path is the manual GitHub workflow:

```bash
gh workflow run qwen-beta-config-probe.yml \
  --repo yuzastudio6-cyber/Reedkt \
  --ref codex/reeditpro-web-ui-shell \
  -f confirm_qwen_beta_config_probe=PROBE_REEDITPRO_QWEN_BETA_CONFIG
```

## What It May Inspect

- GitHub workflow environment values for `QWEN_REASONING_*`, including masked backend-only `QWEN_REASONING_API_KEY` when used for internal testing.
- Google Secret Manager secret metadata names returned by `gcloud secrets list`.
- Exact-match status between configured Secret Manager reference names and discovered secret names.

## What It Must Not Do

- No `gcloud secrets versions access`.
- No secret payload read.
- No secret value print.
- No Qwen provider call.
- No Supabase command.
- No worker, render, media, credit, beta, or production runtime behavior.

## Expected Use

If `Qwen Live Beta Verification` fails at `unlock:qwen-beta:strict`, run this probe. When required `QWEN_REASONING_*` variables are missing, the probe completes successfully as a diagnostic report even if Secret Manager list permission is unavailable, because the variable layer is already the first blocker. Then set either the backend-only GitHub/CI secret or the Secret Manager reference:

- `QWEN_REASONING_API_KEY` as a masked backend-only secret for internal testing, or `QWEN_REASONING_API_KEY_SECRET` for Secret Manager
- `QWEN_REASONING_BASE_URL` or `QWEN_REASONING_BASE_URL_SECRET`
- `QWEN_REASONING_MODEL_ID` or `QWEN_REASONING_MODEL_ID_SECRET`

The probe reports only configured booleans for `QWEN_REASONING_API_KEY`; it must not print the secret value.

After those variables point to owner-approved values, rerun `Qwen Live Beta Verification`. Passing this probe alone does not prove a live Qwen call; it only proves the metadata gate is ready for the live verifier.
