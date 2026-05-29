# ReeditPro Web App Boundary

`apps/web` is the launch path for ReeditPro.

## Owns

- web UI
- editor shell
- project dashboard
- upload flow
- timeline UI
- artifact review UI
- QA report UI
- private export review UI
- browser capability profile later

## Must Not Own

- server workers
- service role secrets
- model weights
- Cloud Run job execution logic
- heavy AI tools
- provider calls

## Phase 44A Status

Phase 44A only creates the web boundary. The current web app implementation is not moved here yet, and this directory must not gain server-only runtime code, privileged storage access, model execution, provider calls, or desktop framework dependencies.
