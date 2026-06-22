# Sound/Music/Audio Owner Expansion Report

## Stack Context

- Base branch: `codex/reeditpro-tool-calling-all-owner-stack-reconciliation-1`.
- Evidence source: merged PR #636 `SOUND-RUNTIME-MEDIA-GATE-0`.
- Tool-calling source of truth remains the existing production registry, study cards, adapter registry, command policies, fixture/probe/export layers, refresh gate, and all-owner reconciliation stack.

## PR #636 Evidence Summary

- PR #636 inventories all 65 SOUND candidate matrix labels.
- It records 13 pinned Python requirements and 16 approved install-plan tools as install evidence only.
- It keeps model-weight, GPU, FFmpeg/ffprobe, pydub media operation, audioread file-open, Supabase, signed/public artifact, billing, beta, and production gates blocked.
- Its next owner prompts are `SOUND-RUNTIME-MEDIA-GATE-1`, `SOUND-RUNTIME-MEDIA-GATE-2`, and `SOUND-RUNTIME-MEDIA-GATE-3`.

## First-Class Coverage

- Current first-class SOUND-related tools are represented through live registry imports: `audioflux`, `signalsmith_stretch`, `deepfilternet`, `rnnoise`, `demucs`, `librosa`, `soundtouch`, `rubber_band`, `essentia`, `faster_whisper`, and `whisper_cpp`.
- Existing study cards and planning-only adapter contracts remain the coverage source for those tools.
- This milestone does not add or duplicate first-class study cards or adapter contracts.

## Candidate And Blocked Tools

- Owner-inventory and install-plan-only candidates remain non-selectable until SOUND owner gates produce registry-ready proof.
- CPU install-plan candidates are candidates for SOUND gate reconciliation, not runtime tools.
- Model-weight and provenance-sensitive tools remain blocked until owner review clears model source, license, checksum, storage, cost, and GPU policy.
- Provider/API-only SFX/music surfaces remain separated from local OSS tool-calling execution.
- Candidate-only study cards may now document selected owner-evidence candidates, but they do not change runtime selectability or first-class registry status.

## Duplicate-Risk Notes

- Existing SOUND docs, SFX services, SoundSync cue planning, workers, provider adapters, production registry, worker router, QA policy, fallback policy, safe-command policy, fixture/probe layers, Supabase tables, SQL, and migrations are not duplicated.
- Owner lane labels are evidence metadata only and must not become runtime ranking dimensions.

## Recommendation

- Proceed with `SOUND-RUNTIME-MEDIA-GATE-1` before registry expansion for install-plan-only candidates.
- Prepare `REEDITPRO-TOOL-CALLING-SOUND-OWNER-CANDIDATE-STUDY-CARDS-1` only after current owner install evidence is reconciled and only as planning metadata.
- Keep `SOUND-RUNTIME-MEDIA-GATE-2` and `SOUND-RUNTIME-MEDIA-GATE-3` as blockers for model-weight/provenance-sensitive and media-policy-sensitive tools.
- After PR #640, use the Sound Runtime Gate 1 reconciliation layer to track Gate 1A and Gate 1B readiness without promoting or executing candidates.

Decision target: `reeditpro_tool_calling_sound_music_audio_owner_expansion_1_ready_for_sound_candidate_study_or_runtime_gate_reconciliation`
