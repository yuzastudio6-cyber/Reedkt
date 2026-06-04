# Phase 44D Web Capability Fixtures

Phase 44D uses generated/mock fixtures only.

Fixtures:

- `fixture-modern-web-high`
- `fixture-mid-web-no-webgpu`
- `fixture-low-capability-mobile`
- `fixture-cross-origin-not-isolated`
- `fixture-insecure-context`

The fixtures validate coarse capability buckets, blocked reasons, warnings, and route planning hints. WebGPU and WebCodecs presence produces planning hints only. Missing cross-origin isolation warns that shared memory/thread paths are unavailable. Insecure context fails closed. Low compute or storage prefers server worker planning.

No live browser profile is uploaded, no media is processed, no network benchmark is performed, and no route execution is enabled.
