# Sound Music Audio Tool Study

Owner: `SOUND_MUSIC_AUDIO`

Status: `metadata_study_complete_no_execution`

Decision: Sound/Music audio capability routing can proceed to a future tool-route execution unlock audit, but audio analysis, cleanup, SFX/music generation, provider calls, model downloads, broad media, render/export, and production routes remain blocked.

## Source Evidence

- `soundsync-audio-pipeline-planning.md`
- `audio-settings-catalog.md`
- `docs/production-audio-sound-foundation.md`
- `docs/google-cloud-audio-worker-plan.md`
- `docs/lyria-worker-plan.md`
- `docs/lyria-integration-adapter.md`
- `docs/activation-track-b-tool-route-manifest-reports/track_b_tool_route_manifest.json`
- `server/tool-registry/production-tool-profiles.ts`

## Capability Classification

| Capability | Best Use | Avoid | Inputs | Outputs | Readiness |
| --- | --- | --- | --- | --- | --- |
| FFmpeg / ffprobe audio boundary | Loudness, trim/silence cleanup, audio extraction, mux/export handoff planning | Unreviewed codec flags, arbitrary paths, final export without Track A | approved private audio/media refs | private audio metadata | planning and readiness evidence only |
| AudioFlux | Beat, onset, rhythm, energy curve, SoundSync cue analysis | Pretending analysis has run, speech-unsafe beat overrides | approved private audio refs | timing map metadata | launch candidate planning only |
| Signalsmith Stretch | Moderate music stretch and pitch fit planning | Extreme stretch, Rubber Band replacement claims beyond plan | approved private audio/music refs | stretch plan metadata | launch candidate planning only |
| DeepFilterNet | Voice cleanup evidence and bounded audio QA | Broad arbitrary media, production cleanup, unapproved models | approved private audio refs | private cleanup QA metadata | restricted historical evidence; route execution blocked |
| Demucs | Future source/stem separation review | Runtime, model download, broad media, production, unsupported provenance | approved future review metadata | none yet | blocked pending provenance |
| Lyria / SFX providers | Future music/SFX generation after approval | Provider calls, secret access, generated assets in this phase | approved prompt snapshots in future only | private generated audio refs in future only | provider execution blocked |

## Routing Contract Notes

- Sound/Music audio owns audio planning and future audio-worker handoffs; it does not own Track A final render/export, Track B media-data QA, provider gateway setup, storage signing, or public artifact delivery.
- Speech clarity outranks beat alignment, SFX, and music energy.
- AudioFlux replaces Essentia as the launch SoundSync analysis candidate; Signalsmith Stretch replaces Rubber Band for launch stretch/pitch planning.
- Demucs remains blocked until provenance and model-weight review are complete.

## Blocked Runtime Gates

- `audioProcessingAllowed`: `false`
- `providerExecutionAllowed`: `false`
- `toolExecutionAllowed`: `false`
- `routeExecutionAllowed`: `false`
- `generatedAssets`: `false`
- `publicArtifactsAllowed`: `false`
- `generatedLocalFixturePassedClaimed`: `false`

Next required action: include this owner in `TOOL-ROUTE-EXECUTION-UNLOCK-0: tool-route execution unlock repo audit, no execution`.
