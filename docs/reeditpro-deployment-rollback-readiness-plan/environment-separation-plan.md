# Environment Separation Plan

Required future environments:

- `local_development`: developer-only metadata and mock-safe verification.
- `internal_staging`: future internal validation after deployment, model, security, cost, storage, observability, backend, worker, and delivery gates are approved.
- `production`: future paid production only after all go/no-go gates pass.

No external users, production data, Supabase/GCS writes, public artifacts, signed URLs, or production traffic are authorized by this plan.
