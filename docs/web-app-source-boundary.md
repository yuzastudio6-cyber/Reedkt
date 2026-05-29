# Web App Source Boundary

The web app is a browser product surface. It can request, display, review, and
approve work through approved backend APIs, but it must not own privileged
runtime behavior.

## Forbidden Direct Imports Or Ownership

- server workers
- service-role secrets
- model weights
- `gcloud` code
- Docker build logic
- provider execution
- Cloud Run job execution
- heavy tool runtime
- direct private GCS mutation
- raw tool execution

## Allowed Later

The web app may call approved backend APIs, use browser-safe shared types, and
render server-owned job, artifact, QA, and export state. Those calls must not
move secrets, worker execution, model policy, private artifact mutation, or
provider execution into browser code.

## Transitional Source Layout

The current active source remains at root `src` for Phase 44B. Future movement
should first separate browser UI from `src/backend` contracts and server build
entrypoints.
