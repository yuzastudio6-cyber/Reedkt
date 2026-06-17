# SOUND-OSS-TOOLS-4 Binary/Import Proof

## Summary

Run a metadata and dependency-environment proof pass from the merged SOUND-OSS-TOOLS-3 branch after it lands. This prompt may prove package metadata, imports, and binary availability for the exact pinned direct packages in `server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt`, but it must not process audio/media, execute ReeditPro tools, run workers/routes, call providers/models, touch Supabase, run SQL, create artifacts, create signed/public URLs, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Required Source Audit

- Read SOUND-OSS-TOOLS-3 result, change log, rollback report, diagnostic, and requirements manifest.
- Read SOUND-OSS-TOOLS-2/1/0 source evidence and PR #418 ownership registry.
- Stop if the exact manifest contains any package outside the SOUND-OSS-TOOLS-3 approved direct package set.
- Keep `pydub_effects` and `ebu_r128_pyloudnorm` as alias-covered by `pydub` and `pyloudnorm`.
- Keep `signalsmith_stretch` as optional source/binary planning only.
- Keep Demucs, RNNoise, Essentia, pyrubberband, rubberband-cli, FFmpeg, and ffprobe outside SOUND-owned proof unless a later owner handoff explicitly changes the source of truth.

## Proof Limits

- Import checks are limited to package import/version metadata for the pinned Python packages.
- Binary checks are limited to metadata/availability checks that do not process media.
- No sample audio, private project payload, user data, generated asset, or final export may be created or inspected.
- No Supabase environment, storage bucket, SQL migration, service-role path, or signed URL may be used.
- No runtime readiness, beta readiness, production readiness, install-complete runtime claim, dry-run pass, or generated-local-fixture pass may be recorded.

## Expected Output

- Add SOUND-OSS-TOOLS-4 docs and diagnostics only.
- Record each proof as passed, failed, or blocked, with exact evidence.
- On pass, recommend `SOUND-OSS-TOOLS-5: audio fixture proof plan, no media processing`.
- On blocker, create `SOUND-OSS-TOOLS-4-FIX: fix binary/import proof blocker, no media processing`.
