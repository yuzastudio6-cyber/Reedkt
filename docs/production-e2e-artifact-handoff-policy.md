# Production E2E Artifact Handoff Policy

The E2E artifact store is in-memory and mock-safe. It records which stage produced each artifact, which downstream stages consumed it, and whether required artifact types are present before downstream validation.

All artifacts must be private. Signed URLs and raw URL-like source-of-truth values are rejected. Source media and proxy media are immutable and must never be overwritten by downstream stages.

Final export artifacts, when mocked or created by a future safe local-dev path, remain private until a later delivery/share policy explicitly creates a shareable URL.
