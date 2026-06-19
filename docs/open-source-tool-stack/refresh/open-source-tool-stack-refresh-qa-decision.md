# Open-Source Tool Stack Refresh QA Decision

Decision: `open_source_tool_stack_refresh_qa_passed_with_warnings`.

Allowed decision states:

- `open_source_tool_stack_refresh_qa_passed_with_warnings`
- `open_source_tool_stack_refresh_qa_passed`
- `blocked_pending_refresh_qa_fixes`
- `blocked_pending_canonical_draft_separation_review`
- `blocked_pending_tool_count_conflict_review`
- `blocked_pending_runtime_readiness_claim_review`

This QA accepts PR #534 with warnings because canonical counts and draft evidence are separated and no runtime, beta, production, public artifact, signed URL, Supabase, GCS, route, tool, Worker, or provider execution is claimed.
