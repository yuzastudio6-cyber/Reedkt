# Result Schema, QA, And Fallback Review

The dry-run uses result schema `trackb-media-oss-tool-call-result.v1` and preserves required fields for tool ID, status, approved snapshot, edit plan, idempotency, artifact IDs, QA gates, fallback policy, and sanitized log summary.

Signed URLs, public URLs, raw prompts, raw chat, and provider prompts remain forbidden result fields. Required QA gate linkage remains render asset integrity, render timeline integrity, and final delivery. The fallback policy blocks preview/final export and requests user review with zero retry attempts before review.
