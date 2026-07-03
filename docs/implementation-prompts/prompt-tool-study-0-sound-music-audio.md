# Implementation Prompt: TOOL-STUDY-0 SOUND_MUSIC_AUDIO

Continue from branch `codex/rp-tool-study-0-sound-music-audio-clean`, based on PR #367 `codex/rp-tool-study-0-track-b-media-processing`.

Implement or revalidate only the `SOUND_MUSIC_AUDIO` docs/diagnostics owner study. Do not execute audio tools, media tools, workers, routes, providers/models, browser capture, map rendering, Supabase, SQL, GCS uploads, public artifacts, signed URLs, dependency mutation, raw prompts, beta unlock, or production unlock.

Use only these confirmations for diagnostics:

```bash
REEDITPRO_CONFIRM_TOOL_STUDY_0_SOUND_MUSIC_AUDIO=true
REEDITPRO_CONFIRM_TOOL_STUDY_DOCS_ONLY=true
REEDITPRO_CONFIRM_TOOL_STUDY_DIAGNOSTICS_ONLY=true
REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY=true
```

Required artifacts:

- `docs/tool-studies/sound-music-audio-source-of-truth-audit.json`
- `docs/tool-studies/sound-music-audio-tool-study.md`
- `docs/tool-studies/sound-music-audio-capability-map.md`
- `docs/tool-studies/sound-music-audio-tool-combination-map.md`
- `docs/tool-studies/sound-music-audio-routing-policy.md`
- `docs/tool-studies/sound-music-audio-handoff-contract.md`
- `docs/tool-studies/sound-music-audio-internal-beta-gap-map.md`
- `docs/tool-studies/sound-music-audio-blocked-use-register.md`
- `scripts/validation/tool-study-sound-music-audio-diagnostics.mjs`
- package script `tool-study:sound-music-audio:diagnostics`

The study must cover DeepFilterNet, FFmpeg/FFprobe loudness and normalization planning, AudioFlux candidate metadata, Signalsmith Stretch, SoundSync cue planning, music ducking/mix/QA, Lyria planning, Mirelo SFX V1.5, MMAudio V2, internal SFX library planning, Demucs blocked review, and audio cost/capacity metadata.

Explicitly keep:

- `routeExecutionAllowed: false`
- `runtimeExecutionAllowed: false`
- `workerExecutionAllowed: false`
- `providerExecutionAllowed: false`
- `toolExecutionAllowed: false`
- `audioProcessingAllowed: false`
- `mediaProcessingAllowed: false`
- Demucs blocked pending provenance/legal/human approval
- RNNoise not active
- Signed URLs are never source of truth
- Supabase update required: `no write`
- SQL executed: `none`
- Migration deployed: `no`

Cross-chat docs should mark `SOUND_MUSIC_AUDIO` complete only after diagnostics pass, keep `AI_TOOLS_CREATIVE_GRAPHICS` and `TRACK_A_RENDER_EXPORT` pending, and keep tool-route execution blocked.

Next recommended phase after this passes: `TOOL-STUDY-0 - AI_TOOLS_CREATIVE_GRAPHICS`.
