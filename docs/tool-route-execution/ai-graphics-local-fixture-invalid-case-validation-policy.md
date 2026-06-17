# AI Graphics Local Fixture Invalid Case Validation Policy

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

Future invalid case validation must prove fail-closed behavior for missing or malformed metadata-only requirements. The approved invalid case families are:

- missing approved plan snapshot placeholder;
- missing scoped tool-call manifest placeholder;
- missing accepted capability id;
- missing private artifact scope;
- missing checksum placeholder;
- missing QA, observability, or cleanup reference;
- missing worker handoff expectation.

Invalid cases must not trigger fallback to raw prompt text, generated route instructions, actual tool execution, worker execution, provider/model calls, public artifacts, or signed URL delivery. The expected result for every invalid case is a local/static validation failure with no runtime side effect.
