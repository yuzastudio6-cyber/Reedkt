# Batch 1 Install/Proof Scope Policy

Decision: `blocked_pending_package_lock_sync_review`.

This packet is documentation and diagnostics only. Dependency install, package-lock mutation, tool execution, route execution, worker execution, provider execution, media/audio/render/image/browser/map processing, Supabase writes, SQL, GCS upload, public artifact creation, signed URL source-of-truth use, raw prompt execution, PR merge, beta unlock, and production unlock remain blocked.

Allowed now: documentation/report generation, diagnostics validation, and non-mutating package-lock status inspection.

Supabase classification: update required `no write`, environment touched `none`, SQL `none`, migration `no`.
