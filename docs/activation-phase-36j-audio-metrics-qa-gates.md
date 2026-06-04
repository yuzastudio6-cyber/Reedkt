# Phase 36J Audio Metrics QA Gates

Required controlled stretch gates:

- `controlled-stretch-expand-110`: `1.10x`, duration tolerance `+/-2%`
- `controlled-stretch-contract-090`: `0.90x`, duration tolerance `+/-2%`
- `controlled-stretch-expand-125`: `1.25x`, warning-capable stress fixture, duration tolerance `+/-3%`

Reports record duration, sample rate, channels, RMS, peak, clipping count, silence ratio, transient proxy, deterministic noise-band proxy, latency, hashes, and privacy status. Required outputs must be finite, non-silent, 48 kHz mono, within duration tolerance, and must not materially introduce clipping.
