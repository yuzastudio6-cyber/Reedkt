# AI-VIDEO-BROLL-GEN-2 Weight Source / Checksum Plan Prompt

Goal: define approved future model weight source, version, checksum, storage/cache, cleanup, and manifest expectations for the selected open-source AI video B-roll model candidates.

This prompt must not download weights, clone model repositories, install runtimes, run inference, generate video, run Docker, call GCP, mutate Supabase, execute SQL, create storage objects, create signed URLs, call providers, dispatch workers, mutate credits, or unlock beta/production.

Inputs:

- AI-VIDEO-BROLL-GEN-1 license/provenance approval result.
- `docs/ai-video-broll-generation-weight-download-storage-policy.md`
- `docs/production-model-weight-readiness-plan.md`
- `docs/production-gpu-model-weight-policy.md`

Exit criteria:

- Each candidate has planned source, version, checksum algorithm, local cache policy, private storage policy, cleanup requirement, and blocked public/signed artifact policy.
- No model file is committed, downloaded, mounted, cached, or marked available.
- Next prompt remains runtime/GPU owner review unless source/checksum conflicts block.
