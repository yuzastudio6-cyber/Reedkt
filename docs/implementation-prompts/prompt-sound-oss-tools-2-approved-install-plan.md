# SOUND-OSS-TOOLS-2 Approved Install Plan

Create an install-planning packet from SOUND-OSS-TOOLS-1 only. Do not install tools, mutate dependencies, change `package-lock.json`, execute tools, process media, run FFmpeg/ffprobe, run Demucs/RNNoise, call providers/models, run workers/routes, mutate Supabase, run SQL, create signed URLs/public artifacts, unlock beta/production, claim `dry_run_passed`, claim `generated_local_fixture_passed`, claim install completion, or claim runtime readiness.

## Required Sources

Read first:
- `docs/sound-music-audio-open-source-tool-license-provenance-approval.md`
- `docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md`
- `docs/sound-music-audio-open-source-tool-license-blocked-deferred-register.md`
- `docs/sound-music-audio-open-source-tool-license-risk-register.md`
- `docs/cross-chat-tool-ownership-registry.md`
- `docs/sound-music-audio-cross-chat-duplicate-risk-register.md`

## Planning Requirements

- Plan exact dependency/package/system changes for only the approved install-plan subset.
- Include package-lock expectations, CI impact, rollback plan, and proof gates.
- Keep blocked/deferred/reference/handoff tools out of install scope unless a later owner/legal source-of-truth clears them.
- Define proof commands as future plans only; do not run imports, binaries, audio processing, or media processing in this prompt.
- Preserve Supabase, provider, worker, route, media, artifact, beta, and production blockers.

## Expected Decision

`sound_oss_tools_2_approved_install_plan_ready_for_install_approval` if planning is complete; otherwise create a blocker prompt with the exact unresolved evidence gap.
