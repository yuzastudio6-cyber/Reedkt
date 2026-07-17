# Provider Config And Secret Boundary

## RP-API-03 Update

Backend route effects now explicitly block provider/model/media calls and secret access in mock runtime. Provider config remains readiness metadata only; no Qwen, DeepSeek, Lyria, Mirelo, MMAudio, OpenAI, Stripe, or Google Cloud secret is read or invoked.

Implementation date: 2026-06-18.

RP-MODEL-02 adds a mock/local provider configuration boundary for ReeditPro. It records expected secret names, frontend-safe config names, provider runtime gates, readiness summaries, and metadata-only inventory reports.

## Backend-Only Secret Names

Expected provider and runtime secret names are defined in `src/types/provider-config.ts` and `src/backend/provider-config/provider-secret-registry.ts`. They include Qwen, DeepSeek, Lyria, Mirelo, MMAudio, Supabase service-role/database, Stripe, and Google Cloud runtime secrets.

These are names only. RP-MODEL-02 does not add values, `.env` files, Secret Manager values, service account JSON, provider keys, connection strings, or endpoint credentials.

## Frontend-Safe Config

The only frontend-safe public config names are:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_REEDITPRO_AUTH_MODE`
- `VITE_REEDITPRO_API_BASE_URL`
- `VITE_REEDITPRO_API_MODE`
- `VITE_REEDITPRO_API_TRANSPORT`
- `VITE_REEDITPRO_MOCK_MODE`

Frontend/browser code must never reference backend/provider secret names as runtime config.

## Current Status

The registry and readiness services are mock/local only. They do not call Qwen, DeepSeek, Lyria, Mirelo, MMAudio, OpenAI, Supabase service-role APIs, Stripe, Google Cloud, workers, renderers, or providers.

RP-MODEL-03 consumes this boundary for the Qwen reasoning adapter skeleton. The skeleton does not read Qwen secret values, inspect Secret Manager, or create provider requests.

RP-MODEL-04 consumes this boundary for the DeepSeek coding adapter skeleton. The skeleton does not read DeepSeek secret values, inspect Secret Manager, create provider requests, or execute generated code.

## Verification

RP-MODEL-02 verification on 2026-06-18 passed:

- `npm run smoke:provider-config`
- `npm run smoke:model-routing`
- all RP-PREF smokes through `npm run smoke:edit-preference-qa`
- `npm run build`
- `npm run lint`
- `npm run check:frontend-boundary`
- `PLAYWRIGHT_PORT=<fresh> npm run qa:internal-testing`
- `PLAYWRIGHT_PORT=<fresh> npm run qa:editor`
- `PLAYWRIGHT_PORT=<fresh> npm run qa:viewport`
- requested Playwright specs for internal testing, edit preferences, editor keyboard, and screenshots

Supabase migration count remained `26`. The worktree stayed intentionally dirty and unstaged.
