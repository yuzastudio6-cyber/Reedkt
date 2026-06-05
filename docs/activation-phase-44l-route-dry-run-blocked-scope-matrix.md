# Phase 44L Blocked Scope Matrix

Phase 44L keeps the following scopes blocked:

- Future dry-run execution until Phase 44M.
- Live route execution.
- Worker execution.
- Local sidecar execution.
- Tool execution.
- Media/audio/OCR/VLM/model runtime.
- Provider calls.
- Docker, Cloud Build, Cloud Run, GPU jobs, GCP, and IAM mutation.
- Public artifacts and public output.
- Broad media and arbitrary media.
- Raw chat execution.
- Arbitrary paths and arbitrary GCS prefixes.
- Frontend service-role secrets.
- VLM routes.
- Demucs routes.
- Product-wide internal beta.
- External beta.
- Paid production.
- Production.
- Track A.

Any request for a blocked scope must fail closed and require a separate approval phase.
