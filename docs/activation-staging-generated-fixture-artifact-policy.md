# Activation Staging Generated-Fixture Artifact Policy

Phase 25 artifacts are private staging evidence only.

- Source fixture, proxy, analysis, transcript, preview, final export, and QA
  artifacts stay under `activation-fixtures/phase25/<run-id>/`.
- Signed URLs are not source of truth.
- Public ACLs and public bucket access are forbidden.
- Generated fixture artifacts may be retained in private GCS for debugging.
- Local generated media is temporary and should be removed after execution.
- Real user media remains blocked until a later explicit approval phase.
