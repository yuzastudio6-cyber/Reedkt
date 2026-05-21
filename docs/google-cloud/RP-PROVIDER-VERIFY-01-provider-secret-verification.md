# RP-PROVIDER-VERIFY-01 Provider Secret Verification

## Purpose

RP-PROVIDER-VERIFY-01 adds safe local scripts for checking ReeditPro provider secrets stored in Google Secret Manager.

These scripts are verification helpers only. They do not create secrets, deploy Cloud Run, call generation endpoints, upload or download media, spend credits, mutate Supabase, or print secret values.

## Scripts

```text
scripts/gcp/verify-provider-secret-versions.sh
scripts/gcp/verify-openai-key.safe.sh
scripts/gcp/verify-provider-secrets.safe.sh
```

All scripts default to:

```text
PROJECT_ID=reeditpro
```

You can override the project with:

```bash
PROJECT_ID=reeditpro bash scripts/gcp/verify-provider-secrets.safe.sh
```

or:

```bash
bash scripts/gcp/verify-provider-secrets.safe.sh reeditpro
```

## Required Provider Secrets

The verification set is:

- `reeditpro-prod-openai-api-key`
- `reeditpro-prod-wan-api-key`
- `reeditpro-prod-hailuo-api-key`
- `reeditpro-prod-veo-vertex-config`
- `reeditpro-prod-lyria-api-key`
- `reeditpro-prod-mirelo-api-key`
- `reeditpro-prod-mmaudio-api-key`

## What The Scripts Prove

`verify-provider-secret-versions.sh` proves only that each Secret Manager reference exists and has at least one enabled version.

`verify-provider-secrets.safe.sh` proves that each latest enabled payload is non-empty without printing values.

`verify-openai-key.safe.sh` reads the OpenAI secret into memory and calls the safe non-generation models list endpoint:

```text
GET https://api.openai.com/v1/models
```

This checks OpenAI auth/list behavior only. It does not generate images, video, audio, text, or embeddings.

## What The Scripts Do Not Prove

A Secret Manager version existing does not prove:

- the key is valid
- the key has the right provider permissions
- the key belongs to the right billing account
- the provider account is enabled for generation
- model-specific routes are available
- future worker IAM is complete

Provider validity must be checked through safe provider auth endpoints whenever those endpoints are officially documented and configured.

## Provider Endpoint Status

OpenAI has a configured safe auth/list endpoint for this milestone.

Wan, Hailuo, Veo, Lyria, Mirelo SFX V1.5, and MMAudio V2 are reported as:

```text
secret present, real endpoint verification pending
```

until official safe non-generation verification endpoints are documented and configured.

## Expensive Tests

Expensive generation tests must require explicit future flags and backend/worker gates. They must not run by default.

Future generation verification must still enforce:

- approved plan snapshot
- approved credit estimate
- credit reservation
- provider route validation
- prompt/manifest readiness
- storage/provenance requirements
- QA and retry/refund policy

## Secret Safety Rules

Never paste provider keys into:

- ChatGPT
- Codex
- GitHub
- logs
- screenshots
- `.env.example`
- frontend code
- database rows
- worker payloads

The scripts print only secret reference names and status. They must not print payload values, signed URLs, service-role keys, provider keys, or Authorization headers.

Run scripts from a trusted backend/developer terminal only.
