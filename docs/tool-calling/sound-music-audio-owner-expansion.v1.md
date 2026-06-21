# Sound/Music/Audio Owner Expansion v1

## Purpose

This milestone reconciles Reeditpro tool-calling coverage against merged Sound/Music/Audio and SFX/SoundSync owner evidence. It consumes PR #636 `SOUND-RUNTIME-MEDIA-GATE-0` as owner evidence and records how SOUND candidates relate to the current first-class registry, study cards, adapter contracts, safe command plans, fixture planning, controlled probes, and fixture-bound proof.

## Boundary

- This layer is docs, diagnostics, and reconciliation metadata only.
- It does not execute tools, process audio, process media, run workers, call providers, download models, mutate Supabase, run SQL, create migrations, create signed URLs, create public artifacts, unlock beta/production, or mutate `package-lock.json`.
- It does not promote owner-inventory tools to `ProductionToolId`.
- It does not add controlled probes, fixture-bound probes, execution adapters, package dependencies, Docker changes, or requirements changes.

## Evidence Consumed

- PR #636 `SOUND-RUNTIME-MEDIA-GATE-0` inventories 65 SOUND candidate labels.
- PR #636 records 13 pinned Python requirements and 16 approved install-plan tools as install evidence only.
- PR #636 keeps model-weight, GPU, FFmpeg/ffprobe, pydub media operation, audioread file-open, Supabase, signed/public artifact, billing, beta, and production gates blocked.
- Open or draft SOUND/SFX/SoundSync PRs from the unmerged-owner overlay remain candidate evidence only.

## Coverage Rules

- First-class registry tools such as `audioflux`, `signalsmith_stretch`, `deepfilternet`, `rnnoise`, `demucs`, `librosa`, `soundtouch`, `rubber_band`, `essentia`, `faster_whisper`, and `whisper_cpp` are marked from live `server/tool-registry` and existing study/adapter layers.
- Owner-inventory and install-plan-only tools such as `soundfile`, `libsndfile`, `sox`, `aubio`, `audioread`, `pydub`, `pyloudnorm`, `basic_pitch`, `crepe`, `spleeter`, `open_unmix`, `asteroid`, and `speechbrain_enhancement` stay non-selectable until SOUND owner gates produce registry-ready proof.
- SFX/SoundSync surfaces such as `mmaudio_v2`, `sfx_director_tool`, `soundsync_cue_planning`, cue manifests, and music ducking/mix QA remain owner planning surfaces or provider/API-only surfaces unless first-class registry evidence exists.
- Governance-sensitive tools including Demucs, RNNoise, Rubber Band, Essentia, DeepFilterNet, faster-whisper, whisper.cpp, and model/provenance-sensitive candidates remain blocked according to their model, license, runtime, or media policy gates.

## Next Milestones

- `SOUND-RUNTIME-MEDIA-GATE-1`: CPU worker install plan, no media execution.
- `SOUND-RUNTIME-MEDIA-GATE-2`: model weight owner review, no download.
- `SOUND-RUNTIME-MEDIA-GATE-3`: media policy owner handoff, no execution.
- `REEDITPRO-TOOL-CALLING-SOUND-OWNER-CANDIDATE-STUDY-CARDS-1`: planning-only study cards after owner evidence is current.
