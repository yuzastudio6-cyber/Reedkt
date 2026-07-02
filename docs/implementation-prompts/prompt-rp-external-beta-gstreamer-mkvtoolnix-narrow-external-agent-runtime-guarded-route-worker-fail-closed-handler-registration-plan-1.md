# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-PLAN-1

Plan the next guarded source milestone after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-QA-ROLLUP-1`.

Source-of-truth requirements:

- Use #2103 / merge `a2a207634c9312b63c7d20e5b67ee5c960662e20` as the accepted fail-closed handler contract source.
- Keep #2100 / merge `340f6f405a2307e364ecd15d7219fdb66a824c81` as the disabled/backend-required route metadata source.
- Keep #577 excluded.

Allowed next work:

- Source-only planning for fail-closed handler registration.
- Diagnostics and safety scans that prove registration remains non-executing unless a later guarded packet explicitly enables it.

Still blocked:

- Route execution.
- Worker dispatch, worker process start, worker lease claim, and persistent queue write.
- GStreamer/MKVToolNix tool execution.
- Docker, FFmpeg/FFprobe, Remotion, media processing, Supabase, SQL, provider/model calls, signed/public artifacts, final render/export, broad external beta, paid production, and production unlock.
