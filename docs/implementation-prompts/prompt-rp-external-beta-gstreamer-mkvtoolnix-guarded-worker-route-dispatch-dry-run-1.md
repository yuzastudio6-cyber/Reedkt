# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-DRY-RUN-1

## Summary

Continue from `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-READINESS-1`.

Goal: run a confirmation-gated route/dispatch dry-run metadata packet for GStreamer/MKVToolNix. The dry-run may construct and validate route/dispatch envelopes, idempotency keys, approved snapshot references, job references, manifest schema references, QA schema references, cleanup policy references, retry policy references, and non-public artifact policy references.

## Required Gate

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_DRY_RUN=true`

## Boundaries

No real route execution, worker process execution, worker lease claim, persistent queue write, GStreamer execution, MKVToolNix execution, Docker execution, FFmpeg/FFprobe execution, Remotion execution, private/user media processing, Supabase mutation, SQL execution, provider/model call, signed/public artifact creation, final render/export, broad external beta unlock, paid production unlock, or production unlock is allowed unless a later packet separately approves and gates that scope.

Product-ready end-to-end local OSS tools remains `0`.
