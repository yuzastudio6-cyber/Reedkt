# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-IMPLEMENTATION-1

Implement the next guarded source milestone after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-PLAN-1`.

Source-of-truth requirements:

- Use #2104 / merge `4ecaa50cf35098b63e4ac2d61c8ddb72c516ab02` as the accepted handler-contract QA rollup source.
- Use #2103 / merge `a2a207634c9312b63c7d20e5b67ee5c960662e20` as the accepted fail-closed handler contract source.
- Use #2100 / merge `340f6f405a2307e364ecd15d7219fdb66a824c81` as the disabled/backend-required route metadata source.
- Keep #577 excluded.

Allowed next work:

- Source-only fail-closed handler registration metadata or adapter wiring that remains disabled/backend-required.
- Diagnostics and safety scans that prove route execution and worker dispatch remain blocked.

Still blocked:

- Runtime route execution.
- Worker dispatch, worker process start, worker lease claim, and persistent queue write.
- GStreamer/MKVToolNix tool execution.
- Docker, FFmpeg/FFprobe, Remotion, media processing, Supabase, SQL, provider/model calls, signed/public artifacts, final render/export, broad external beta, paid production, and production unlock.
