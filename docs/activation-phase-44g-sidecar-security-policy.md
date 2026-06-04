# Phase 44G Sidecar Security Policy

Phase 44G does not execute a sidecar process. Future command execution must use allowlisted adapters only, explicit executable paths, explicit argv arrays, no shell by default, bounded timeout, bounded stdout/stderr, controlled cwd, scrubbed environment, and no inherited sensitive env by default.

Secrets must never cross frontend/shared protocol code or IPC. Service-role secrets, provider keys, environment dumps, arbitrary filesystem access, public output, provider calls, Demucs, VLM, and disabled route entries remain blocked.

Any future Electron bridge must use context isolation, a narrow preload API, no direct Node access from renderer, and allowlisted commands. No Electron or Tauri shell is added in this phase.
