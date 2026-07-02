# Production Cost Control Policy

Cost controls prevent runaway GPU, render, provider, and worker usage. M17 adds static policies for concurrency, timeouts, retries, rate limits, kill switches, and budget placeholders.

Production execution is not enabled by these policies. GPU jobs, providers, final export, and public delivery remain kill-switched until human approvals pass.

Any future launch must approve budgets per workspace/day, worker type, tier, retry policy, and incident response.
