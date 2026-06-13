# TOOL-STUDY-0 Track B Media Processing Capability Routing Study

Use this prompt only after PR #350 post-merge source-of-truth verification has passed.

## Scope

Implement or revalidate a docs/diagnostics-only owner study for `TRACK_B_MEDIA_PROCESSING`.

Do not execute tools, workers, routes, providers, media processing, Supabase writes, SQL, GCS uploads, public artifacts, signed URLs, dependency installs, raw prompts, beta unlocks, or production unlocks.

## Owned Tools

Cover only:

- OpenCV
- PyAV
- PySceneDetect
- Sharp/libvips
- DuckDB
- Polars
- PaddleOCR
- PaddlePaddle
- Track B route/capability manifest metadata
- Track B cost/capacity metadata
- Track B owned benchmark/sidecar metadata

## Related But Not Owned

- DeepFilterNet, Signalsmith Stretch, and Demucs belong to `SOUND_MUSIC_AUDIO`.
- Creative/image generation tools belong to `AI_TOOLS_CREATIVE_GRAPHICS`.
- Final render/export belongs to `TRACK_A_RENDER_EXPORT`.

## Required Safety

Keep all execution flags false:

- `routeExecutionAllowed`
- `runtimeExecutionAllowed`
- `workerExecutionAllowed`
- `providerExecutionAllowed`
- `toolExecutionAllowed`
- `mediaProcessingAllowed`
- `supabaseWritesAllowed`
- `dependencyMutationAllowed`
- `rawPromptExecutionAllowed`

Signed URLs are never source of truth. Public artifacts remain blocked.

## Next Phase

After this study passes diagnostics, keep `SOUND_MUSIC_AUDIO`, `AI_TOOLS_CREATIVE_GRAPHICS`, and `TRACK_A_RENDER_EXPORT` owner studies pending before any TOOL-ROUTE execution unlock.
