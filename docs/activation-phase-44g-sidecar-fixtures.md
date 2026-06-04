# Phase 44G Sidecar Fixtures

Phase 44G uses generated mock fixtures only:

- `fixture-sidecar-handshake-valid`
- `fixture-plan-snapshot-valid-but-execution-blocked`
- `fixture-artifact-scope-valid-private`
- `fixture-deny-raw-chat-execution`
- `fixture-deny-arbitrary-path`
- `fixture-deny-public-artifact`
- `fixture-deny-demucs-route`
- `fixture-deny-vlm-route`
- `fixture-protocol-version-mismatch`

The optional no-op child-process handshake is skipped by policy and does not block Phase 44G. Real sidecar execution remains blocked.
