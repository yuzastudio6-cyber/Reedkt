# No-Op Source Contract

The source contract is backend-source validation only.

Source implementation ID: `source-gstreamer-mkvtoolnix-narrow-route-worker-noop-1`

Route source ID: `externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeNoopSource`

Route source path: `/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/noop-boundary`

Route owner: `backend_service_role_only`

Route registration mode: `source_declared_not_registered`

Route runtime mode: `disabled_noop_source_contract_only`

Worker source mode: `source_declared_not_dispatched`

Future dry-run confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_NOOP_SOURCE_DRY_RUN=true`

Source idempotency key: `gstreamer-mkvtoolnix:narrow-route-worker-noop-source-implementation-1:boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1:gstreamer-mkvtoolnix:narrow-external-agent-route-worker-boundary-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:gst_controlled_generated_fixture_pipeline_v1:boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1:source-gstreamer-mkvtoolnix-narrow-route-worker-noop-1`

Default source state:

- Server feature flag present: `false`
- Server feature flag enabled: `false`
- Production route file created: `false`
- Route registered: `false`
- Route enabled: `false`
- Route execution: `false`
- Worker dispatch: `false`
- Worker execution: `false`
- Worker process start: `false`
- Worker lease claim: `false`
- Persistent job queue write: `false`
- GStreamer execution: `false`
- MKVToolNix execution: `false`
- Media processing: `false`

The source contract returns response shape `accepted_noop_source_contract` with `runtimeEnabled: false`, `routeExecution: false`, `workerDispatch: false`, `workerExecution: false`, and `toolExecution: false`.
