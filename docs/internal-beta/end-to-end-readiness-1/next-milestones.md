# ReEditPro Internal Beta Next Milestones

Decision: `blocked_pending_backend_worker_render_storage_billing_and_tool_runtime_gates`

## Ordered Milestones

1. `RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS`
   - Produce reviewed schema/migration/RLS/private bucket readiness without remote mutation.
2. `RP-BACKEND-01-APPROVED-SNAPSHOT-JOB-QUEUE-SKELETON`
   - Add backend-only approved snapshot and job queue skeletons.
3. `RP-CREDITS-01-INTERNAL-CREDIT-LEDGER`
   - Add internal credit estimate, reservation, release, refund, and audit ledger.
4. `RP-STORAGE-01-PRIVATE-ARTIFACT-BUCKETS`
   - Add private storage policy, manifest, checksum, retention, and cleanup contracts.
5. `RP-RENDER-01-REMOTION-WORKER-SKELETON`
   - Add a guarded render worker skeleton for private preview/export only.
6. `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1`
   - Review bounded GPAC/MP4Box install-source evidence before runtime planning.
7. `RP-INTERNAL-BETA-E2E-1`
   - Prove upload to plan to approval to worker to private preview/export to QA to cleanup.

## Deferred Post-Beta Expansion

- FILM remains blocked until AI Graphics / Worker accepts model runtime, model weights, GPU execution, and ML dependency ownership.
- VapourSynth remains blocked until owner-approved package source and native/plugin policy are resolved.
- Revideo remains evaluation-only/non-core until owner approval.
- SAM2, BiRefNet, Real-ESRGAN, and other GPU/model tools require current-source retargeting, visual review, private artifact policy, and worker runtime gates.

## Unlock Policy

Internal beta unlock requires the end-to-end lane to pass with private artifacts and strict gates. External beta, paid production, broad media, public artifacts, signed URL source-of-truth, and final delivery/export remain blocked until separate readiness reviews approve them.
