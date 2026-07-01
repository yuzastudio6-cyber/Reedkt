# Registered No-Op Source Contract

Source implementation ID: `source-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-1`

Route source ID: `externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource`

Route source path: `/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary`

Route owner: `backend_service_role_only`

Route registration mode: `source_declared_registered_but_runtime_disabled`

Route runtime mode: `disabled_registered_noop_source_contract_only`

Worker source mode: `source_declared_not_dispatched`

Future dry-run confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN=true`

Accepted response shape:

- `status: accepted_registered_noop_source_contract`
- `runtimeEnabled: false`
- `routeRegisteredAtRuntime: false`
- `routeExecution: false`
- `workerDispatch: false`
- `workerExecution: false`
- `toolExecution: false`

This packet does not add a production route handler or route file. It only adds source-level metadata and validators for a later confirmation-gated registered no-op dry run.
