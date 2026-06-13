# Read First For All Owners

PR #350 has completed frozen-batch merge execution and post-merge source-of-truth verification.

Current coordination facts:

1. The frozen batch of 27 PRs is merged and verified with `mergedAt`.
2. Source branches for all 27 frozen PRs still exist.
3. Key milestone reports are reachable from the merged branch chain.
4. Runtime, worker/tool/route, provider, Supabase write, public artifact, signed URL, raw prompt, production, external beta, and paid production scopes remain blocked.
5. `TRACK_B_MEDIA_PROCESSING` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-track-b-media-processing` as docs/diagnostics only.
6. `SOUND_MUSIC_AUDIO` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-sound-music-audio-clean` as docs/diagnostics only.
7. `AI_TOOLS_CREATIVE_GRAPHICS` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-ai-tools-creative-graphics-clean` as docs/diagnostics only.
8. `TRACK_A_RENDER_EXPORT` TOOL-STUDY-0 is complete on branch `codex/rp-tool-study-0-track-a-render-export-clean` as docs/diagnostics only.
9. All TOOL-STUDY-0 owner studies are complete only after their diagnostics pass; tool-route execution remains blocked pending a separate route-unlock readiness check and explicit route execution gate.
10. `TOOL_STUDY_0_ROLLUP` records docs/diagnostics completeness as `true` but route-unlock readiness remains `blocked_pending_owner_study_merge` until PR #367, #373, #376, and #379 merge into source-of-truth.

Read `docs/github-merge-hygiene/post-merge-source-of-truth-verification.md` before building on merged milestone evidence.

Track B study completion does not unlock runtime, media processing, provider calls, workers, tools, routes, Supabase writes, public artifacts, signed URLs, internal beta, external beta, paid production, production, or raw prompt execution.

Sound/Music/Audio study completion also does not unlock DeepFilterNet, FFmpeg, AudioFlux, Signalsmith Stretch, Demucs, Lyria, Mirelo, MMAudio, internal SFX library runtime, provider calls, audio processing, media processing, workers, routes, public artifacts, signed URLs, beta, or production.

AI Tools Creative Graphics study completion also does not unlock provider/model calls, image generation, image editing, style transfer runtime, creative graphics execution, workers, tools, routes, public artifacts, signed URLs, Supabase writes, beta, or production.

Track A Render/Export study completion also does not unlock render/export execution, Remotion rendering, mux/transcode execution, caption burn-in output, private GCS uploads, manifest writes, public delivery, signed URLs, workers, tools, routes, Supabase writes, beta, or production.

TOOL-STUDY-0 completion rollup does not merge PRs and does not unlock tool-route execution. Its current output is docs/diagnostics complete with merged source-of-truth still pending.

<!-- SECOND_CONTROLLED_CANDIDATE_APPROVAL_STATUS -->

SECOND_CONTROLLED_CANDIDATE_APPROVAL:

- Decision: `approved_for_future_second_controlled_candidate_dry_run`.
- Approved future candidate: `controlled-tool:second_fixture_report_validation`.
- Fixture/route: `valid_sound_music_audio_metadata_route_candidate` / `metadata-route:sound_music_audio`.
- Owner lane: `SOUND_MUSIC_AUDIO`.
- Actual candidate execution remains future and separately approved.
- Broad tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.
