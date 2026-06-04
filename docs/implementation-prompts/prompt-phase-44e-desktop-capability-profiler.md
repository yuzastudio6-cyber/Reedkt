# Phase 44E Desktop Capability Profiler

Implement Track B Phase 44E as a metadata-only desktop capability profiler.

Use Phase 44D web capability profiler evidence as the schema and privacy baseline. Do not execute tools, workers, media/audio/OCR/VLM/model runtimes, providers, Docker, Cloud Build, Cloud Run, GCP/IAM mutation, beta, production, broad media, public output, or Track A.

Required output:

- desktop-safe schema
- coarse privacy policy
- generated/mock fixture profiles
- route planning hints only
- safe report CLIs
- smoke tests
- docs/readiness updates

Desktop profile data must be coarse, session-scoped, and non-identifying. No persistent device ids, exact serials, exact GPU ids, exact local paths, or raw private metadata may be stored.
