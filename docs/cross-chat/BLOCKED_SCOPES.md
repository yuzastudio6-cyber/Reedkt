# Blocked Scopes

The post-merge source-of-truth verification keeps these scopes blocked:

- production release
- external beta
- paid production
- general worker execution
- tool execution
- route execution
- provider calls
- media processing and broad media runtime
- Track B media tool runtime, including OpenCV, PyAV, PySceneDetect, Sharp/libvips, PaddleOCR, PaddlePaddle, DuckDB, and Polars
- Sound/Music/Audio runtimes, including DeepFilterNet, FFmpeg/FFprobe audio execution, AudioFlux, Signalsmith Stretch, Lyria, Mirelo, MMAudio, internal SFX library execution, and Demucs
- AI Tools creative graphics execution
- AI image generation and AI image editing runtimes
- creative graphics provider/model calls
- Track A runtime execution
- Docker, Cloud Run, or Cloud Build mutation
- Supabase writes, SQL, migrations, reset, repair, or production promotion
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- beta or production unlocks

Blocked means no owner should treat the frozen-batch merge or this verification as runtime/product execution approval.

The `SOUND_MUSIC_AUDIO` TOOL-STUDY-0 completion is docs/diagnostics only. Demucs remains blocked pending provenance/legal/human approval, RNNoise is not active, and tool-route execution remains blocked until remaining owner studies and separate route execution gates pass.

The `AI_TOOLS_CREATIVE_GRAPHICS` TOOL-STUDY-0 completion is docs/diagnostics only. AI image generation planning, AI image editing planning, style transfer planning, thumbnails/covers/posters, title cards, lower thirds, overlays, typography/layout/composition metadata, brand/visual style metadata, graphic asset QA metadata, design prompt-to-intent routing, and creative graphics route/cost metadata do not unlock provider/model calls, image generation, image editing, workers, tools, routes, public artifacts, signed URLs, Supabase writes, beta, or production.
