# Edit Level QA Readiness Policy

RP08 readiness statuses are mock/local planning indicators:

- `ready_for_mock_planning`: baseline QA policy can be represented without runtime tools.
- `ready_with_warnings`: stronger QA policy can be represented, but some future context is unavailable.
- `blocked_by_future_runtime_gate`: studio-level policy depends on future runtime systems before final readiness.

Normal is `ready_for_mock_planning`, Premium is `ready_with_warnings`, and Ultra Premium is `blocked_by_future_runtime_gate`.

This readiness policy does not block or start production execution. No planner, worker, render, Supabase, provider, Qwen, Qwen2.5-VL, DeepSeek, file-byte, external-fetch, or credit operation runs.
