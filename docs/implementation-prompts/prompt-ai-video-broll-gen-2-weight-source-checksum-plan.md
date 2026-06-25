# AI-VIDEO-BROLL-GEN-2 Weight Source / Checksum Plan Prompt

Goal: create a planning-only weight source and checksum packet for the Gate 1 eligible AI video B-roll candidates.

Use Gate 1 as the source of truth:

- `docs/ai-video-broll-generation-license-provenance-approval.md`
- `docs/ai-video-broll-generation-license-provenance-evidence-matrix.md`
- `docs/ai-video-broll-generation-weight-source-eligibility-decision.md`
- `docs/ai-video-broll-generation-license-blocker-register.md`

Eligible candidates:

- Wan / Wan2.1 family.
- LTX / LTX-Video only with exact version split.
- Mochi 1 fallback/research.

Blocked candidate:

- HunyuanVideo until legal, territory, commercial, and output-use review is accepted.

This prompt must not download weights, install runtimes, run inference, generate video, run Docker, call GCP, mutate Supabase, execute SQL, create storage objects, create signed URLs, call providers, dispatch workers, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

Exit criteria:

- Each eligible candidate has exact upstream source URL, model identifier, license URL, model card URL, expected checksum strategy, private local/cache storage expectation, owner mapping, and blocked runtime flags.
- LTX has an exact chosen version or an explicit split matrix that prevents license conflation.
- Mochi excludes unreviewed direct/magnet/mirror paths unless separately approved.
- Hunyuan remains blocked.
- Next prompt is dependency/runtime install planning only if weight sources/checksum plans are accepted.
