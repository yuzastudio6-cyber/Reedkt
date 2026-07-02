# Track A Tool Lane Next Action Plan

## Immediate Tool Work

1. Continue GStreamer/MKVToolNix through `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1`.
2. Continue GPAC/MP4Box through `TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-CONFIRMED-EXECUTION-1`.
3. Do not open new Revideo or Remotion work in this lane.

## GPAC/MP4Box Gate

Required gate before any GPAC/MP4Box guarded dispatch retry:

`REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true`

If the gate is absent, the accepted result remains:

`blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation`

The confirmed scaffold packet has now pinned the exact route, worker target, approved snapshot fixture, private artifact manifest, cleanup policy, command allowlist, rollback policy, and residue readback checks. The next execution packet must use that pinned contract before any route or worker dispatch path is exercised.

## Boundaries

No broad service-role handlers, raw chat execution, arbitrary user media, unapproved media sources, signed/public artifact creation, broad external beta, production, paid production, or final delivery/export is authorized by this realignment.
