# Phase 36I Audio Metrics QA Gates

Required metrics:
- input/output duration and duration ratio
- sample rate and channel count
- RMS and peak
- clipping count
- silence ratio
- dominant frequency where meaningful
- transient count proxy for click fixtures
- runtime latency
- SHA-256 hashes

Blocking failures:
- output duration outside fixture tolerance
- output silent or invalid
- sample rate/channel mismatch
- clipping materially worse
- source/build/runtime verification failed
- private artifact upload failed without an explicit policy exception

Perceptual quality is not production-approved by this phase. The click-track fixture may carry a stress warning if objective metrics pass.
