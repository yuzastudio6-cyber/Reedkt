# SOUND-OSS-TOOLS-3 Controlled Dependency Install

Create a controlled dependency-install packet from SOUND-OSS-TOOLS-2 only after explicit dependency mutation approval. Do not process media, run audio tools, run FFmpeg/ffprobe, run Demucs/RNNoise, call providers/models, run workers/routes, mutate Supabase, run SQL, create signed URLs/public artifacts, unlock beta/production, claim install completion, claim runtime readiness, claim dry_run_passed, or claim generated_local_fixture_passed.

## Required Sources

Read first:
- docs/sound-music-audio-open-source-tool-approved-install-plan.md
- docs/sound-music-audio-open-source-tool-dependency-change-forecast.md
- docs/sound-music-audio-open-source-tool-install-command-plan.md
- docs/sound-music-audio-open-source-tool-binary-import-proof-plan.md
- docs/sound-music-audio-open-source-tool-ci-rollback-plan.md
- docs/sound-music-audio-open-source-tool-install-exclusion-report.md
- docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md

## Rules

- Allow only the approved 16-tool install-plan subset.
- Document every expected package file and lockfile change before mutation.
- Keep blocked, deferred, reference-only, handoff-only, provider, internal, Demucs, RNNoise, Essentia, pyrubberband, and rubberband_cli entries out of install scope.
- Require rollback verification for every dependency class.
- Permit install commands only if the SOUND-OSS-TOOLS-3 prompt explicitly approves dependency mutation.
- Prohibit proof commands that process media or claim runtime readiness.

Expected next decision: `sound_oss_tools_3_controlled_dependency_install_ready_for_import_proof_plan` if controlled install planning and allowed dependency mutation pass.
