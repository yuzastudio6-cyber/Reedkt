# AI Graphics Local Fixture Worker Handoff Validation Requirements

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

Future validation may inspect worker handoff placeholders only. It must require each accepted AI graphics fixture to declare:

- placeholder approved plan snapshot id;
- placeholder scoped tool-call manifest id;
- accepted tool and capability id;
- private artifact manifest placeholder;
- checksum placeholder;
- worker handoff expectation;
- blocked worker execution flag.

Worker handoff validation does not approve Worker Runtime execution, job claims, leases, queues, broad service-role handlers, route dispatch, actual tool execution, or provider/model runtime. Worker Runtime remains separately gated by `WORKER_RUNTIME_JOBS`.
