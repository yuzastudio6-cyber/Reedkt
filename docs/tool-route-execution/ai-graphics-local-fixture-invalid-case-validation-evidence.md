# AI Graphics Local Fixture Invalid Case Validation Evidence

Decision: `tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings`

Invalid-case validation passed for all 13 accepted tools. The invalid template requires fail-closed handling for missing placeholder source-of-truth fields, including approved plan snapshot, scoped tool-call manifest, private artifact reference, and checksum placeholder.

The expected invalid result is `fail_closed_missing_required_placeholder`. No fallback route, fallback tool, provider call, or worker path is approved when required metadata is absent.
