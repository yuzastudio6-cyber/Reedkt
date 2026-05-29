# Web App Boundary

`apps/web` is the canonical web product boundary for ReeditPro.

## May Own

- React UI
- routing
- editor shell UI
- project dashboard UI
- upload UI
- timeline UI
- transcript/caption display UI
- artifact review UI
- QA report UI
- private export review UI
- browser capability profile UI later

## Must Not Own

- server workers
- gcloud logic
- service role secrets
- provider calls
- model weights
- Docker build logic
- Cloud Run job execution
- heavy AI execution
- direct private GCS mutation logic
- raw tool execution

## API Boundary

The web app may call approved backend APIs later. It must not import server
worker internals, service-role clients, model files, provider execution modules,
or heavy tool runtimes directly.
