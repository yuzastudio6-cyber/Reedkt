# Mock vs Real Status

## Real / Implemented In Frontend

- Vite/React app shell.
- React Router routes.
- Chat-native editor UI.
- Inline planning cards.
- Demo scenarios.
- Frontend package install metadata and lazy-loader wrappers for browser-safe tools.
- Local TypeScript contracts.
- Static docs and local SQL migration files.

## Mock-Only

- Backend services in `src/backend/`.
- Mock database and mock orchestrators.
- Edit planning outputs.
- Credit estimates and approval state.
- Job orchestration.
- Worker runtime plan.
- Production readiness report.
- Music Director planning.
- Music QA/mix planning.
- Lyria prompt planning.
- Lyria provider adapter and worker skeleton.
- Generation requests/assets behavior.
- Render/preview/export behavior.

## Local Schema Only

- Supabase migrations `202605130001` through `202605130008`.
- Supabase schema review docs.
- Supabase health checks SQL.
- Supabase e2e mock scenario SQL/docs.

These have not been confirmed against a local or remote Supabase project in this audit.

## Not Connected

- Live Supabase project.
- Supabase Auth.
- Supabase Storage.
- OpenAI/GPT APIs.
- GPT-Image-2.
- Lyria.
- Wan/Hailuo/Veo providers.
- Google Cloud.
- Stripe.
- Real rendering.
- Real uploads.
- Real transcription/visual/audio analysis.

## Needs Deployment Later

- Supabase migrations to the `reeditpro` project.
- Auth/profile bootstrap.
- Storage buckets and policies.
- Backend API routes.
- Google Cloud or secure worker runtime.
- Secret Manager.
- Provider clients.
- Render/export workers.
- Stripe checkout/webhook services.

## Plain Truth

The repo is a strong frontend/mock planning prototype with substantial local schema architecture. It is not yet a connected production app.
