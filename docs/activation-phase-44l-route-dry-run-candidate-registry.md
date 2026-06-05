# Phase 44L Candidate Registry

Phase 44L registers five candidate dry-run paths and selects exactly one.

Selected:

- `candidate-noop-sidecar-handshake`: approved as the future no-op route dry-run candidate. It validates protocol metadata only and does not invoke tools, media, workers, or sidecars in Phase 44L.

Eligible but not selected:

- `candidate-metadata-route-validation`: route manifest and plan snapshot validation only.
- `candidate-private-artifact-scope-validation`: private artifact scope validation only.

Not approved:

- `candidate-duckdb-metadata-report-route`: deferred because it would become a real tool route candidate.
- `candidate-sharp-thumbnail-route`: deferred because it would process image artifacts.

Real tool-route candidates remain blocked until a later explicit approval phase after the no-op route dry-run passes.
