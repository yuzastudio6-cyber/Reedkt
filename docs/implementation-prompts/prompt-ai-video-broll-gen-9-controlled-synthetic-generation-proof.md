# AI-VIDEO-BROLL-GEN-9 Controlled Synthetic Generation Proof Prompt

Goal: attempt a controlled tiny synthetic generation proof only if all source-of-truth, runtime, owner, and safety gates pass again. The input must be the AI-VIDEO-BROLL-GEN-8 non-user-media tabletop object fixture. No user media, project media, public artifact, signed URL, provider call, worker dispatch, Supabase mutation, SQL, credit mutation, beta, or production is allowed.

Use Gate 8 as the source of truth:

- `docs/ai-video-broll-generation-controlled-synthetic-generation-plan.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-owner-gate-register.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-result.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Before any inference-like action, the prompt must prove:

- repo tracked/staged state is clean;
- private Wan 1.3B cache exists outside the repo at the recorded revision;
- no network model fetch is required;
- the synthetic fixture contains no people, faces, minors, public figures, brands, logos, readable text, copyrighted characters, user media, or audio;
- CPU generation remains blocked;
- local or owner-approved GPU memory estimate is within the Gate 8 envelope;
- estimated runtime is within the Gate 8 envelope;
- no Docker/GCP/Cloud Run path is used unless a later prompt explicitly approves it;
- no Supabase, SQL, storage upload, signed URL, public artifact, credit, provider, worker, FFmpeg, final render, or beta path is touched.

Stop before execution and report blocked if any target, owner gate, platform requirement, runtime estimate, or private cache isolation check fails.

If proof execution is allowed by that future prompt, it must remain local, tiny, synthetic, private, and non-user-media. It must write only to an approved temporary proof directory outside the repository, clean up or explicitly report any temporary files, and avoid final render/export. Passing the proof must still not claim `dry_run_passed`, `generated_local_fixture_passed`, beta, production, or runtime readiness.

Expected next output:

- controlled proof result doc;
- proof metadata/manifest doc if any temporary artifact is created;
- cleanup/rollback report;
- diagnostics script;
- no tracked model weights or generated media in the repository.
