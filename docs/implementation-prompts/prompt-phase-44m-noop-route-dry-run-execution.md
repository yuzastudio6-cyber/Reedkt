# Prompt Phase 44M No-Op Route Dry-Run Execution

Implement Phase 44M as a guarded no-op route dry-run execution using the Phase 44L approval packet.

Use only `candidate-noop-sidecar-handshake`. Validate the approved plan snapshot, route manifest version, metadata-only artifact scopes, operator checklist, rollback policy, and confirmation variables before any no-op dry-run starts.

Do not execute tools, workers, real sidecars, media/audio/OCR/VLM/model runtimes, providers, Docker, Cloud Build, Cloud Run, GCP/IAM mutation, public output, broad media, production, beta, or Track A.

The dry-run must produce only safe JSON/Markdown metadata reports and must fail closed if route execution becomes real, if runtime/tool execution is requested, if artifact scope is public or arbitrary, if raw chat execution is requested, or if VLM/Demucs/provider/public/broad-media scopes appear.
