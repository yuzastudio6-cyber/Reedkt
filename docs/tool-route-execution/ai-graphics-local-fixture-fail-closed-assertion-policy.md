# AI Graphics Local Fixture Fail-Closed Assertion Policy

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

Future local fixture validation must fail closed when any fixture requests behavior outside metadata/manifest scope. This includes missing placeholders, unaccepted tools, unaccepted capabilities, unsafe artifact refs, raw prompt fallback, runtime instructions, or broad worker handoff claims.

Approved fail-closed outcomes:

- `fail_closed_missing_required_placeholder`;
- `fail_closed_unaccepted_tool_or_capability`;
- `fail_closed_unsafe_artifact_scope`;
- `blocked_unsafe_runtime_or_artifact_request`;
- `blocked_unapproved_worker_handoff`;

Fail-closed validation must not repair fixtures by guessing defaults, running imports, executing local fixtures, executing routes/tools/workers, creating artifacts, or calling provider/model runtimes. It must produce only static pass/fail evidence in a later separately approved execution lane.
