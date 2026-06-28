# GPAC/MP4Box Artifact Policy

The future worker lane must keep generated evidence and user/private media boundaries separate.

Artifact rules:
- Generated proof fixtures stay local unless a later guarded packet approves a private storage prefix.
- Private/user media requires a named source, checksum, purpose, retention rule, cleanup rule, and owner authorization in the execution packet.
- Public artifacts are blocked.
- Signed URLs are blocked as source-of-truth.
- The worker must emit a manifest before any downstream QA or product surface consumes an artifact.
- The manifest must include file names, byte counts, SHA-256 checksums, source class, command template id, and cleanup status.
- Artifact cleanup must be recorded even on failure.

Current artifact status:
- Committed media artifacts: `none`
- Generated artifacts committed: `none`
- Public artifacts: `blocked`
- Signed URLs: `blocked`
- Product runtime artifact handoff: `blocked_pending_worker_integration_plan`
