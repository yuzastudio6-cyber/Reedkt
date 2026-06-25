# QA, Fallback, And Logging Review

The contract records required QA gate linkage and fail-safe fallback actions. Failed or missing QA blocks preview/final export and requests user review; it does not silently retry or substitute tools.

Only sanitized logging summaries are allowed. Raw worker logs, secrets, signed URLs, private payloads, and raw prompts remain blocked.
