# Phase 36M Audio/Timing Beta Gate Criteria

The gate can pass only when committed safe reports prove:

- Phase 36H DeepFilterNet source/runtime hardening, generated 48 kHz fixture, bounded controlled speech cleanup, and private artifact policy passed.
- Phase 36I Signalsmith Stretch source/runtime, generated timing/stretch fixtures, QA metrics, and private artifact policy passed.
- Phase 36J Signalsmith controlled real-media timing/stretch sample passed for exactly one approved private bounded sample/window.
- Phase 36K keeps Demucs blocked with `blocked_pending_training_data_provenance` and does not approve Phase 36L.
- Phase 36M privacy/storage, rollback/blocker, support checklist, smoke/report CLI, and metadata-only private upload pass.

Private JSON metadata verification from Phase 36H/36I/36J private prefixes is preferred. If unavailable but committed manifests are complete, it is a warning, not a blocker. Phase 36M metadata-only private upload is required for a passing execution decision.
