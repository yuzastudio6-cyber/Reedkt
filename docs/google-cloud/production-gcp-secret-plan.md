# Production GCP Secret Plan

## Purpose

Milestone 3 defines Secret Manager placeholder names only. It does not commit secret values, create secret versions, print secret payloads, or call providers.

## Placeholder Names

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PROVIDER_GATEWAY_SHARED_SECRET`
- `WORKER_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `SFX_PROVIDER_API_KEY`
- `MUSIC_PROVIDER_API_KEY`
- `MODEL_WEIGHT_ACCESS_TOKEN`
- `HUGGINGFACE_TOKEN`

Optional placeholders are created only as names so later milestones can decide whether to add versions and IAM access.

## Rules

- Frontend code must never read Secret Manager values.
- Worker payloads must never contain raw secret values.
- Logs must not include secret values or signed URLs.
- Database rows may store secret reference names only when needed.
- Provider/model-weight secrets require separate approval before worker access.
