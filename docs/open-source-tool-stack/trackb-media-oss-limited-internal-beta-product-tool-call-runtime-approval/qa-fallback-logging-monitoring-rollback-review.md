# QA, Fallback, Logging, Monitoring, And Rollback Review

The next gate must bind each product tool-call dry-run to QA gates, fallback policy, sanitized logging, monitoring, and rollback.

Allowed fallback actions remain `block_preview`, `block_final_export`, and `request_user_review`. Automatic retries before user review remain `0` until a later explicit runtime policy expands them.

Logs must stay sanitized and must not expose raw prompts, raw chat, private payloads, public URLs, signed URLs, secrets, or provider prompt content.
