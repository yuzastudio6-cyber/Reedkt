# AI Graphics Invalid Case Owner Approval

Decision: `tool_route_ai_graphics_metadata_local_fixture_owner_approved_with_warnings`

Invalid case owner approval result: `accepted_with_warnings`.

The owner accepts invalid-case metadata evidence as a fail-safe gate-status input. A future gate-status packet may record invalid-case rejection behavior, but it must not repair, execute, render, upload, or route invalid fixtures.

Invalid cases must fail closed when required placeholders, owner/capability ids, scoped manifests, private artifact refs, checksum placeholders, or no-execution assertions are missing.
