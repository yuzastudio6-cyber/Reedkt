# Queued Job Runtime Route Invocation

Route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/invoke`

Handoff route source: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/enqueue`

Runtime route delegate: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`

The route validates approved snapshot metadata, creates a local mock queue item through the #2120 handoff service, reads the queued `runtimeRouteBody`, and delegates that body to the #2113 existing guarded generated-fixture runtime route bridge.

Runtime scope remains generated fixture only:

- GStreamer: `completed_controlled_generated_fixture_only`
- MKVToolNix: `completed_controlled_generated_fixture_only`
- Media processing: `controlled_generated_fixture_only`
- Private media processing: `false`
- User media processing: `false`

Readiness: `ready_for_generated_fixture_queued_job_runtime_qa_rollup`
