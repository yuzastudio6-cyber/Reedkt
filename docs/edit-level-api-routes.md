# Edit Level API Routes

RP-EDITLEVEL-03 adds Edit Level mock local route metadata and mock-router handlers. Because the current API route domain union does not include an Edit Level domain, these routes intentionally use the existing planning domain.

The routes cover profiles, compatibility normalization, UI cards, recommendation create/get/list, selection save/get/update/clear, tool routing summary, Qwen routing summary, QA profile summary, estimate summary, fallback summary, readiness create/get, application log append/list, and repository summary.

Every route is `runtimeMode: mock` and `status: mock_ready`. There is no production HTTP route, no deployed backend route, no Supabase route handler, no service-role mutation, no provider/model call, no media worker, no render/export, no progress update, and no credit spend.

Mock route responses return repository results with side-effect flags proving no runtime implementation was triggered. Production persistence and backend-only behavior remain future work.

Recommended next prompt: `RP-EDITLEVEL-04 - UI Cards + Recommendation`.
