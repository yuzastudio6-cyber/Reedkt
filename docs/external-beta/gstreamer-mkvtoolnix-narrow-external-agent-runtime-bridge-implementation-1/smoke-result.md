# Narrow External-Agent Runtime Bridge Smoke Result

Smoke script: `smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1`

The smoke verifies:

- valid source-derived bridge input returns `ready_for_narrow_external_agent_runtime_bridge_qa_rollup`;
- all four approved command templates are accepted;
- missing required references fail closed;
- mismatched dry-run or handoff evidence fails closed;
- any Docker network other than `none` fails closed;
- unapproved command templates fail closed;
- raw command and public URL source inputs fail closed;
- route, worker dispatch, GStreamer execution, Supabase mutation, and final export requests fail closed;
- safety flags remain false;
- product-ready end-to-end local OSS tools remains `0`.

No route, worker, tool, media, Docker, Supabase, SQL, signed/public artifact, final export, or unlock path is executed by the smoke.
