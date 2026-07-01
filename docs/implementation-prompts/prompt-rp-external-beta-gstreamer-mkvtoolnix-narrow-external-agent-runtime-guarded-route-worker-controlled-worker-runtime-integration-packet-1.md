# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-1

Implement the next confirmation-gated route-worker runtime integration packet after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PLANNING-1`.

Required sources:

- `#2028` narrow controlled worker queue integration.
- `#2036` narrow controlled worker dispatch dry-run.
- `#2044` narrow controlled worker runtime execution packet.
- `#2047` narrow controlled worker runtime QA rollup.
- `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PLANNING-1`.

Required confirmation gate:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_RUNTIME_INTEGRATION_PACKET=true`

Required future boundary:

- Use only the accepted generated-fixture runtime source envelope.
- Preserve idempotency keys, job ID, worker lease reference, queue item reference, route source ID, artifact manifest, QA report, checksums, and cleanup policy.
- Do not use private/user media unless a later approval packet explicitly authorizes it.
- Do not create public artifacts or signed URLs.
- Do not unlock broad external beta, paid production, production, or final delivery/export.
- Do not run Supabase mutation, SQL, service-role route mutation, provider/model calls, FFmpeg/FFprobe, Remotion, or Docker push/deploy.

The implementation packet must fail closed if the confirmation gate is absent or the source envelope does not match the accepted generated-fixture evidence.
