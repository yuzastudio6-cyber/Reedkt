# Phase 44J Failure Policy

Phase 44J fail-closed fixtures cover:

- Missing capability manifest.
- Route version mismatch.
- Artifact mismatch.
- Cost hard block.
- Blocked route execution.
- Raw chat execution.
- Public artifact request.
- Provider call request.
- Broad media request.
- VLM route.
- Demucs route.
- Sidecar protocol mismatch.
- Frontend secret request.

No failure fixture may fall back to raw execution, arbitrary subprocesses, public output, provider calls, or runtime execution.
