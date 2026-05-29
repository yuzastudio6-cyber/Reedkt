# Testing

## Current Test Modes

The current repo uses `tsx` smoke scripts as its test foundation.

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:e2e:browser
```

`npm run test:e2e` is an offline mocked backend-runtime smoke. It starts the Express app on a random local port and verifies health, production CORS behavior, security headers, sanitized errors, and protected-route authentication blocking. It does not run browser automation, call providers, process media, deploy infrastructure, or require credentials.

`npm run test:e2e:browser` is the mocked Playwright browser E2E suite. It starts the local Vite frontend and local Express backend, opens Chromium, verifies the app shell and main routes, calls backend health/readiness through Playwright's request context, and confirms protected/provider routes fail safely without auth or execution.

Headed browser mode:

```bash
npm run test:e2e:browser:headed
```

Install the Chromium browser binary before the first browser E2E run:

```bash
npx playwright install chromium
```

## Existing Smoke Commands

Useful targeted checks include:

```bash
npm run smoke:api
npm run smoke:prod-foundation
npm run smoke:prod-hardening
npm run smoke:beta-readiness
```

## Optional Live Runtime Testing

Live backend testing requires human-provided Supabase credentials and explicit staging approval. Required server-only values include:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`
- `BACKEND_URL`

Provider credentials, GCP credentials, model weights, Docker images, and media-processing jobs are not part of the offline test suite.

## Mocked Browser E2E Environment

Playwright config supplies safe local defaults:

- `NODE_ENV=test`
- `E2E_RUNTIME_MODE=mock`
- `API_ALLOW_MOCK_WITHOUT_SUPABASE=true`
- `WORKER_RUNTIME_MODE=mock`
- `STORAGE_MODE=local`
- `FRONTEND_URL=http://127.0.0.1:5173`
- `BACKEND_URL=http://127.0.0.1:8787`
- `VITE_REEDITPRO_API_BASE_URL=http://127.0.0.1:8787`
- `VITE_REEDITPRO_API_MODE=mock`
- `VITE_E2E_BROWSER_TEST=true`

The browser suite must not require Supabase credentials, provider keys, cloud credentials, real media, real workers, public URLs, or Reddit OAuth/API.

## Future Live Browser E2E

Live staging browser E2E remains a future controlled slice. It requires explicit deployment, Supabase credentials, staging URLs, rollback steps, and human approval before any real backend, worker, provider, storage, or media path is exercised.
