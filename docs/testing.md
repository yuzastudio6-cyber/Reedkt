# Testing

## Current Test Modes

The current repo uses `tsx` smoke scripts as its test foundation.

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```

`npm run test:e2e` is an offline mocked backend-runtime smoke. It starts the Express app on a random local port and verifies health, production CORS behavior, security headers, sanitized errors, and protected-route authentication blocking. It does not run browser automation, call providers, process media, deploy infrastructure, or require credentials.

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

## Future Browser E2E Slice

Formal Playwright browser E2E is not added in this foundation slice to avoid dependency and lockfile changes. The next test slice should add Playwright deliberately, keep the default mode mocked/offline, and support optional staging mode only when Supabase and deployment credentials are supplied securely.
