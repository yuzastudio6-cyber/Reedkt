# Command Template Allowlist

This handoff does not authorize runtime execution. It defines the only command shape that a later explicit dry-run packet may use.

## Allowed Future Dry-Run Command Shape

```bash
REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_DRY_RUN=true npm run rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-dry-run-1
```

## Required Input Restrictions

- route path must equal `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`
- worker source must equal `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`
- fixture scope must remain `controlled_generated_fixture_only`
- raw caller command strings are forbidden
- arbitrary private/user media paths are forbidden
- public URLs as source-of-truth are forbidden
- signed URLs as source-of-truth are forbidden
- worker registration broadening is forbidden
- final render/export is forbidden
- production unlock is forbidden

## Explicitly Not Allowed In This Handoff

Route execution in this handoff phase: `false`

External agent runtime invocation in this handoff phase: `false`

Real worker dispatch in this handoff phase: `false`

Worker process started in this handoff phase: `false`

Worker execution in this handoff phase: `false`

Worker lease claim in this handoff phase: `false`

Persistent job queue write in this handoff phase: `false`

GStreamer execution in this handoff phase: `false`

MKVToolNix execution in this handoff phase: `false`

FFmpeg/FFprobe execution in this handoff phase: `false`

Docker execution in this handoff phase: `false`

Supabase mutation in this handoff phase: `false`

SQL execution in this handoff phase: `false`

Public artifact creation in this handoff phase: `false`

Final render/export in this handoff phase: `false`
