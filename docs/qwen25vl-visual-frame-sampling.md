# Qwen2.5-VL Visual Frame Sampling

Browser frame sampling uses the local `HTMLVideoElement` and canvas. Point markers sample `t-2s`, `t`, and `t+2s`; range markers sample start, midpoint, and end. The default cap is 5 frames and the absolute cap is 9.

Frames are resized to a small JPEG payload before request submission. The current cap targets the existing 1 MB server JSON limit: 120 KB per frame and 850 KB total. If sampling fails or produces no valid frames, the UI shows fallback and does not call Qwen2.5-VL with empty data.

Sampled frames are request-only. They are not stored in marker metadata, MockDatabase, Supabase, storage, or provider diagnostics.
