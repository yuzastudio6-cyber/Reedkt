# Phase 44D Web Capability Source Research

Accessed: 2026-06-04

Phase 44D uses official browser API documentation as source evidence and records only coarse availability metadata.

- MDN WebCodecs: browser encode/decode API evidence; media processing remains blocked.
- MDN WebGPU and GPU.requestAdapter: secure-context and limited-availability evidence; adapter identity is redacted.
- MDN SharedArrayBuffer: shared memory requires cross-origin isolation for usable worker sharing.
- MDN hardwareConcurrency and deviceMemory: values are bucketed and exact values are not persisted.
- MDN StorageManager.estimate: quota/usage estimates are approximate and bucketed; persistence is not requested.
- MDN OffscreenCanvas: availability is recorded only.
- MDN Network Information API: optional coarse connection data only; no speed test or endpoint ping.

Sources:

- https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
- https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- https://developer.mozilla.org/docs/Web/API/GPU/requestAdapter
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
