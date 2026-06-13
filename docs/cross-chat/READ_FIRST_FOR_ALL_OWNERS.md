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
8. Remaining TOOL-STUDY-0 owner study before any tool-route execution unlock: `TRACK_A_RENDER_EXPORT`.

Read `docs/github-merge-hygiene/post-merge-source-of-truth-verification.md` before building on merged milestone evidence.

Track B study completion does not unlock runtime, media processing, provider calls, workers, tools, routes, Supabase writes, public artifacts, signed URLs, internal beta, external beta, paid production, production, or raw prompt execution.

Sound/Music/Audio study completion also does not unlock DeepFilterNet, FFmpeg, AudioFlux, Signalsmith Stretch, Demucs, Lyria, Mirelo, MMAudio, internal SFX library runtime, provider calls, audio processing, media processing, workers, routes, public artifacts, signed URLs, beta, or production.

AI Tools Creative Graphics study completion also does not unlock provider/model calls, image generation, image editing, style transfer runtime, creative graphics execution, workers, tools, routes, public artifacts, signed URLs, Supabase writes, beta, or production.
