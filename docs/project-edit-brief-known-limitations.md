# Project Edit Brief Known Limitations

Edit Brief is optional. Chat remains default. Marker Chat is marker-scoped. Attachments are metadata-only. Plan hints are not execution. Production ready: false. Owner approval pending. No migration. No Supabase command.

## Limitations

- Edit Brief state is mock/browser-local and fixture-backed.
- Marker attachments are labels, notes, and metadata-only URLs; no uploads or signed URLs exist.
- Marker Chat uses deterministic local rules by default. Backend-only Qwen 3.7 Max beta can be verified through the live server route with owner config, but it is not production rollout and never exposes secrets to browser code.
- QA/conflict detection is deterministic mock metadata and does not auto-fix markers.
- Plan Hints are planner-input metadata only; no real edit planner runs and no edit plan record is created.
- Export Settings are session-level mock metadata only; no render/export/progress job starts.
- Supabase persistence, production HTTP routes, worker queues, media processing, credits, monitoring, and privacy/legal gates remain blocked.

## Source Video Context Limitation

Context-aware Marker Chat is documented but not implemented. Source video understanding packages, marker context packages, context retrieval, and context-aware Qwen prompt wiring remain future milestones. Current Marker Chat still uses marker-scoped local intent or backend-gated Qwen beta without raw video context. No runtime execution, no worker, no render, no credits, no media processing, no upload/file-byte read, no provider call, no Supabase command, and no migration are enabled by RP-VIDEOCTX-00.

RP-VIDEOCTX-00R documents that Qwen2.5-VL is the future visual/video understanding specialist and Qwen 3.7 Max remains the Marker Chat reasoning brain. This does not enable Qwen2.5-VL calls, Qwen 3.7 Max prompt runtime changes, DeepSeek calls, media workers, raw frame/video access, render/export, credits, Supabase persistence, migrations, or production rollout.

## RP-MEDIA-01 Local Preview Limitation

The Brief video shell can now play a user-selected local browser video through an object URL. That video remains component/browser state only: it is not uploaded, persisted, stored as a media asset, read by backend code, analyzed by workers, sent to Qwen2.5-VL/Qwen 3.7 Max/DeepSeek/providers, rendered/exported, or charged. Browser metadata may inform duration, dimensions, aspect ratio, marker defaults, and Export Settings recommendations; frame rate is not detected and defaults to 30 fps.

## RP-QWENVL-BETA-01 Visual Context Limitation

Analyze Visual Context can sample resized frames from the browser-local preview and request the backend-only Qwen2.5-VL beta route. It stores structured visual summary metadata only. It does not upload the full video, persist raw frames, read backend media bytes, run media tools/workers/render/export, spend credits, run Supabase CLI, create migrations, use DeepSeek, use Qwen 3.7 Max for visual analysis, or make Marker Chat fully context-aware yet.
