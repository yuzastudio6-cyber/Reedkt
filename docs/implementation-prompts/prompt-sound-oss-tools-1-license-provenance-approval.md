# SOUND-OSS-TOOLS-1 License/Provenance Approval

## Summary
Perform a docs/diagnostics-only license and provenance approval packet for SOUND_MUSIC_AUDIO open-source candidates using SOUND-OSS-TOOLS-0 as the source of truth.

Do not install tools, mutate dependencies, change `package-lock.json`, run audio/media tools, run FFmpeg/ffprobe, download model weights, run providers/models, execute workers/routes, mutate Supabase, run SQL, create signed URLs, create public artifacts, unlock beta/production, claim `dry_run_passed`, claim `generated_local_fixture_passed`, claim install completion, or claim runtime readiness.

## Required Source Reads
- `docs/cross-chat-tool-ownership-registry.md`
- `docs/sound-music-audio-cross-chat-duplicate-risk-register.md`
- `docs/sound-music-audio-open-source-tool-stack-inventory.md`
- `docs/sound-music-audio-open-source-tool-candidate-matrix.md`
- `docs/sound-music-audio-open-source-tool-install-proof-roadmap.md`
- `docs/sound-music-audio-open-source-tool-gap-register.md`
- `docs/sound-music-audio-open-source-tool-install-blocked-register.md`
- `docs/sound-oss-tools-0-stack-inventory-validation-results.md`

## Approval Work
- Classify each SOUND-owned candidate license and provenance status as `approved`, `needs_review`, `blocked`, or `not_applicable`.
- Classify model-weight, provider/internal, GPL/AGPL/commercial, Docker/GPU, and non-SOUND-owner risks.
- Keep Demucs, RNNoise, Rubber Band, and Essentia blocked unless source-of-truth evidence explicitly clears the blocker.
- Keep FFmpeg/ffprobe/Remotion/Track A/B/Provider/Supabase/Worker-owned tools as reference or handoff only.
- Create the next prompt for an approved install plan only if license/provenance approval passes; otherwise create a blocker-fix prompt.

## Validation
- Run SOUND-OSS-TOOLS-1 diagnostics if added.
- Run `npm run sound-oss-tools-0:diagnostics`.
- Run `npm run cross-chat-tool-ownership:diagnostics`.
- Run `git diff --check` and `git diff --cached --check`.
- Run changed/staged-file scans for secrets, DB/Supabase URLs, signed URL/public artifact markers, raw provider output, unsafe runtime true flags, install-complete claims, execution-ready claims, `dry_run_passed`, and `generated_local_fixture_passed`.

## Expected Decision
`sound_oss_tools_1_license_provenance_approval_ready_for_install_plan`

If blocked, use `sound_oss_tools_1_blocked_<reason>` and keep all install/execution gates closed.
