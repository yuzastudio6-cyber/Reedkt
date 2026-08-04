# Project Edit Brief Visual Intelligence Projection

The Project Edit Brief visual panel is a read-only consumer of WeEditPro Visual Intelligence evidence. New analysis is owned by Head Intelligence and dispatched by Orchestra through the provider-neutral `visual_intelligence` capability. The browser cannot select a provider, sample frames, upload visual bytes, call a model, or promote local state into evidence.

The former Qwen2.5-VL marker beta is retired. Its two browser-configurable endpoints, live-readiness option, frame sampler, Analyze button, and browser-to-model request path are absent from active source. Existing marker metadata with the historical Qwen runtime identities remains readable for audit only; it cannot drive planning, cuts, approval, QA, repair, cost, or delivery.

Browser-local marker metadata is never sufficient current authority, even if it claims `runtimeSource: visual_intelligence_authenticated_read`. The read-only marker adapter rejects that self-attestation. Until a separate request-matched authenticated report projection is wired from the canonical backend, the panel stays in `Awaiting Orchestra` state instead of inventing a report identity or falling back to a browser model call.
