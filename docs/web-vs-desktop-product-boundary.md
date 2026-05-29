# Web vs Desktop Product Boundary

## Web

Web is the cloud-first launch path. It owns browser UI, editor shell, dashboard, upload, timeline UI, artifact review, QA report UI, private export review UI, and later browser capability profile.

Web does not own server workers, service role secrets, model weights, Cloud Run job execution logic, heavy AI tools, provider calls, desktop runtime, or local hardware scans.

## Desktop

Desktop is future/planned. It can eventually own a desktop shell, install capability wizard, local worker bridge, local cache, and local preview tools.

Desktop must not own an active Mac/Windows runtime, Tauri/Electron packages, local AI execution, installer scripts, or hardware scan execution in Phase 44A.

## Shared Backend Runtime

The shared backend/runtime remains common. Server owns activation runtime, workers, Cloud Run job orchestration, tool execution, private artifacts, model policies, cost, security, and readiness.

Future desktop can eventually use local compute where safe and approved, but cloud-backed editing remains the primary path for heavy tools.
