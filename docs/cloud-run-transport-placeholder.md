# Cloud Run Transport Placeholder

RP-FIX-11 represents Cloud Run transport as a contract only.

## Future Shape

- Cloud Run API service for authenticated backend routes.
- Cloud Run Jobs or worker services for long-running generation/render work.
- Pub/Sub or Cloud Tasks for queue dispatch.
- Secret Manager for provider keys and service credentials.
- Supabase service-role access only inside backend/worker runtimes.

## Current Behavior

`sendCloudRunServiceEnvelopePlaceholder` and `sendCloudRunJobEnvelopePlaceholder` return backend-required responses. They do not call Google Cloud, Pub/Sub, providers, renderers, Supabase Edge, Stripe, or storage.

RP-FIX-12 adds `Dockerfile.backend` and a mock-only Node server build as the first Cloud Run API scaffold. The image is not deployed and contains no secrets.

## Safety

No Cloud Run service account, provider credential, or service-role value belongs in frontend code, Vite env vars, database rows, logs, or mock payloads.
