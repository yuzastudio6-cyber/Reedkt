# AI Graphics Invalid Case Validation QA

Decision: `tool_route_ai_graphics_metadata_local_fixture_validation_qa_passed_with_warnings`

Invalid case validation from PR #464 is accepted with warnings. QA confirms missing placeholder source-of-truth fields fail closed instead of falling back to route execution, actual tool execution, worker execution, provider/model runtime, raw prompt execution, public artifacts, or signed URLs.

The reviewed invalid result remains `fail_closed_missing_required_placeholder`.
