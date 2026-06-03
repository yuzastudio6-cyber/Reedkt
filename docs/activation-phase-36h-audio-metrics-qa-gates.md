# Phase 36H Audio Metrics QA Gates

Phase 36H records deterministic metadata only:

- duration
- sample rate
- channels
- RMS
- peak
- clipping count
- silence ratio
- simple noise-band proxy
- runtime latency
- file size
- SHA-256

Generated fixture and controlled sample gates must verify that output audio exists, is bounded, has the expected sample-rate/channel class, has no unexpected clipping, and has a recorded SHA-256. Metrics are private QA evidence, not production or beta approval.
