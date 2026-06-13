# TOOL-ROUTE-2 Next Phase Plan

Next phase: `TOOL_ROUTE_3`

Readiness: `ready_for_TOOL_ROUTE_3_generated_local_fixture_contract_tests`

Prompt: `docs/implementation-prompts/prompt-tool-route-3-generated-local-fixture-contract-tests.md`

Required before execution:

- Use TOOL-ROUTE-2 generated/local fixture catalog as the only source of fixture contracts.
- Run contract tests against synthetic local manifests only.
- Keep all runtime/tool/worker/provider/route execution flags false.
- Keep Supabase, SQL, GCS, public artifact, signed URL, beta, production, and final render/export paths blocked.
- Require owner review before any future fixture execution phase.

Blocked scope:

- No real provider/model calls.
- No worker claim/lease writes or runtime job execution.
- No web search, browser capture, map rendering, media processing, audio generation, or Track A render/export.
- No Supabase mutation, SQL, migrations, schema/RLS change, storage transfer, public artifacts, signed URLs, beta, or production.

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
