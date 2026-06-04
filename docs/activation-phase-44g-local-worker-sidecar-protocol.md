# Phase 44G Local Worker Sidecar Protocol

The protocol defines metadata-only messages for `sidecar_hello`, `controller_hello`, plan snapshot validation, artifact scope validation, blocked execution response, and shutdown.

`execution_request` exists in the schema only so Phase 44G can prove it is blocked. No raw chat prompt, arbitrary media path, signed URL source of truth, or secret value is allowed in protocol messages.

The shared TypeScript protocol library lives under `src/lib/track-b/local-worker-sidecar/` and is intentionally pure: no server imports, filesystem scans, subprocess execution, provider calls, media processing, or Track A imports.
