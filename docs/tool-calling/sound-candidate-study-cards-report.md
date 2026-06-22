# Sound Candidate Study Cards Report

## Summary

- Added 18 candidate-only Sound/Music/Audio and SFX/SoundSync study cards from PR #641 / PR #636 evidence.
- Cards are isolated from runtime capability selection and are not first-class `ProductionToolId` study cards.
- No adapter contracts, command intents, fixture plans, controlled probes, execution paths, package installs, package-lock changes, Supabase files, SQL, migrations, signed URLs, public artifacts, beta, or production unlocks are added.

## Candidate Cards Added

- `soundfile_libsndfile`
- `sox`
- `aubio`
- `mmaudio`
- `pydub`
- `audioread`
- `pyloudnorm`
- `basic_pitch`
- `crepe`
- `torchcrepe`
- `spleeter`
- `open_unmix`
- `asteroid`
- `speechbrain_enhancement`
- `sfx_director`
- `soundsync`
- `sound_cue_manifest`
- `music_ducking_loudness_qa`

## Owner Gates Preserved

- License/provenance blocked: `soundfile_libsndfile`, `sox`, `aubio`.
- Media-policy blocked: `pydub`, `audioread`, `sound_cue_manifest`.
- Model/provenance blocked: `mmaudio`, `basic_pitch`, `crepe`, `torchcrepe`, `spleeter`, `open_unmix`, `asteroid`, `speechbrain_enhancement`.
- Install-plan only: `pyloudnorm`.
- Owner planning surfaces only: `sfx_director`, `soundsync`, `music_ducking_loudness_qa`.

## Evidence

- PR #636 `SOUND-RUNTIME-MEDIA-GATE-0` runtime inventory, install strategy, model/GPU policy, media runtime policy, and owner handoff evidence.
- PR #641 Sound/Music/Audio owner expansion matrix and report.
- No requested candidate was missing from current PR #641 / PR #636 evidence.

## Recommendation

- Do not promote candidate-only SOUND tools yet.
- Wait for `SOUND-RUNTIME-MEDIA-GATE-1`, `SOUND-RUNTIME-MEDIA-GATE-2`, and `SOUND-RUNTIME-MEDIA-GATE-3` before registry or execution expansion.
- Next tool-calling milestone after owner proof: `REEDITPRO-TOOL-CALLING-SOUND-RUNTIME-GATE-1-RECONCILIATION`.

Decision target: `reeditpro_tool_calling_sound_candidate_study_cards_1_ready_for_sound_runtime_gate_1_reconciliation`
