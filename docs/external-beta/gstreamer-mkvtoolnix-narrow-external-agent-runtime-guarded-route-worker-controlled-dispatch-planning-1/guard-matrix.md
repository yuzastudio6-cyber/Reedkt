# Guard Matrix

| Guard | Required value |
| --- | --- |
| Future confirmation gate | `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_DISPATCH_EXECUTION=true` |
| Source route id | `externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource` |
| Source route path | `/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary` |
| Fixture class | `registered_noop_source_route_worker_controlled_dispatch_contract_only` |
| Route execution | `blocked_until_future_confirmed_execution_packet` |
| Worker dispatch | `blocked_until_future_confirmed_execution_packet` |
| Worker execution | `blocked_until_future_confirmed_execution_packet` |
| Tool execution | `blocked` |
| Media processing | `blocked` |
| Public artifacts | `blocked` |
| External beta unlock | `blocked` |
| Production/final delivery unlock | `blocked` |

The future execution packet must preserve false flags for tool execution, media processing, public artifacts, and production unlocks even if it validates a controlled dispatch envelope.
