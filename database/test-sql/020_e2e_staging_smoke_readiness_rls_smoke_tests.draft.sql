-- Prompt 18 E2E staging smoke readiness RLS smoke tests.
-- Draft-only. Do not run against local, staging, or remote Supabase until a later
-- validation prompt explicitly approves the environment, fixture IDs, and schema target.
--
-- Rules:
-- - Synthetic fixture records only.
-- - No production data.
-- - No credentials.
-- - No signed URLs, provider keys, service-role keys, Stripe keys, or raw secrets.
-- - No provider, worker, render, tool, media, storage transfer, or credit execution.
-- - Readiness smoke must not create execution records.

begin;

-- Planned cases:
--
-- 1. Workspace/project fixture scoping.
--    - A workspace member can read only the synthetic project-scoped fixture rows
--      allowed by policy.
--    - A non-member cannot read another workspace smoke fixture.
--
-- 2. Approved snapshot fixture scoping.
--    - Synthetic approved snapshot fixture references the smoke project.
--    - Non-member access is denied.
--
-- 3. Credit fixture scoping.
--    - Synthetic estimate and reservation references stay project-scoped.
--    - Normal users cannot mutate ledger/reservation/refund rows directly.
--
-- 4. Job/render/QA/tool/provider fixture scoping.
--    - Synthetic job, worker, render, QA, tool, and provider readiness records
--      are visible only where RLS allows project-scoped reads.
--    - No claim, execution, provider attempt, render job, tool execution, or QA
--      execution record is created by readiness smoke alone.
--
-- 5. Audit/observability fixture scoping.
--    - Synthetic audit/observability preview records, if present in a future
--      schema, are workspace/project scoped and append-only.
--    - Normal users cannot write production audit, rate-limit, abuse, cost-control,
--      alert, or production-unlock records directly.
--
-- 6. Secret and signed URL safety.
--    - No fixture stores signed URLs, provider keys, service-role keys, Stripe
--      keys, raw credentials, or private env values.
--
-- 7. Cleanup.
--    - All synthetic fixture data can be removed without touching production data.

rollback;
