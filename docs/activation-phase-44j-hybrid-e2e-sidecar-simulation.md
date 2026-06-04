# Phase 44J Sidecar Simulation

Sidecar simulation reuses the Phase 44G pure validators from `src/lib/track-b/local-worker-sidecar/`.

Validated objects:

- Synthetic plan snapshots.
- Synthetic artifact scopes.
- Blocked execution response.

Every sidecar result returns execution blocked. Phase 44J starts no sidecar process, opens no subprocess, runs no shell command, executes no worker, scans no filesystem, and sends no secrets over IPC.

Actual local sidecar runtime remains blocked until a later explicit approval phase.
