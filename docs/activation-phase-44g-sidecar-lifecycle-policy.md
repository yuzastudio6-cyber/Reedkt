# Phase 44G Sidecar Lifecycle Policy

Lifecycle states are `uninitialized`, `handshake_pending`, `ready_metadata_only`, `validation_only`, `execution_blocked`, `shutting_down`, `terminated`, and `error`.

Startup and shutdown bounds are recorded for future phases, but Phase 44G starts no long-running local process. Crash, retry, heartbeat, temp cleanup, and artifact cleanup policies all fail closed and require future execution approval before they can run.
