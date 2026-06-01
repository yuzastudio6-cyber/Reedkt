# VLM Hallucination Safety QA Policy

Phase 39C VLM output is treated as fallible QA metadata. The runtime must flag uncertainty and manual review when fixture contents are ambiguous, crowded, low-confidence, or unsafe for automatic caption/safe-zone decisions.

Hard blockers include invalid JSON, invented provider/tool actions, claims of real-media processing, public URL output, secret/path disclosure, low required-label recall, unsafe lower-third recommendations on conflict fixtures, or overconfident labels on ambiguous fixtures.

Passing Phase 39C does not make VLM output user-facing or production-authoritative.
