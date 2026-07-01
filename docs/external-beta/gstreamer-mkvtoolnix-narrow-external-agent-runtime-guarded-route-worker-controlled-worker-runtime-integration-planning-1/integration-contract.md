# Integration Contract

This planning packet defines the next narrow route-worker runtime integration packet without creating or executing the route/worker path in this phase.

Future packet name: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-1`

Future confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_RUNTIME_INTEGRATION_PACKET=true`

Future source class: `generated_fixture_only_narrow_controlled_worker_runtime_source`

Required future envelope fields:

- approved snapshot reference or explicit generated-fixture source envelope
- route source ID
- source idempotency key
- worker job ID
- worker idempotency key
- worker lease reference
- queue item reference
- runtime packet source run ID
- guarded runtime run ID
- artifact manifest checksums
- QA report checksums
- cleanup policy

The future packet may only promote the accepted #2044/#2047 generated-fixture runtime evidence into route/worker integration metadata. It must not start broad route execution, live worker dispatch, persistent queue writes, private/user media handling, signed URL creation, public artifact creation, final render/export, external beta expansion, or paid production.

GStreamer readiness: `ready_for_guarded_narrow_route_worker_runtime_integration_packet`

MKVToolNix readiness: `ready_for_guarded_narrow_route_worker_runtime_integration_packet`

External-agent route/worker boundary readiness: `ready_for_guarded_narrow_route_worker_runtime_integration_packet`

Product-ready end-to-end local OSS tools: `0`
