# Runtime Integration Implementation Envelope

Runtime integration implementation ID: `runtime-integration-implementation-gstreamer-mkvtoolnix-narrow-controlled-worker-1`

Runtime integration source ID: `externalBeta.gstreamerMkvtoolnix.narrowControlledWorkerRuntimeIntegrationImplementation1`

Runtime integration source path: `server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-implementation-1.ts`

Runtime integration mode: `metadata_only_generated_fixture_source_envelope`

Route binding mode: `deferred_no_route_registration`

Worker dispatch mode: `deferred_no_worker_dispatch`

Worker lease mode: `deferred_no_worker_lease_claim`

Accepted source class: `generated_fixture_only_narrow_controlled_worker_runtime_source`

Generated fixture evidence accepted: `true`

Worker lease reference: `lease-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1-not-claimed`

Queue item reference: `mock-queue-gstreamer-mkvtoolnix-narrow-controlled-worker-1-not-written`

The envelope is intentionally a source contract only. It validates the previous generated-fixture runtime source chain and exposes a reusable metadata shape for a later guarded route/worker runtime packet. The later packet must provide its own explicit confirmation gate before any route registration, route invocation, worker dispatch, worker execution, lease claim, persistent queue write, tool execution, Docker execution, media processing, Supabase mutation, SQL, signed/public artifact creation, or export.
