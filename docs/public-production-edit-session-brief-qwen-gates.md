# Public Production Gates: Edit Sessions, Edit Brief, Qwen Marker Chat

Status: implemented, remote schema applied/verified, and deployed to Cloud Run as a production-gated public beta server path. Live deployed-route verification passed for auth fail-closed behavior, production readiness, Qwen Marker Chat live provider execution, durable idempotency replay, sanitized persistence, monitoring gates, and rollback switches.

## Scope

- Reuses existing durable roots: `edit_sessions`, `edit_briefs`, and `edit_cues`.
- Does not create `project_edit_sessions` or `project_edit_briefs`.
- Adds normalized child persistence for Edit Chat messages, sources, memory, snapshots, versions, previews, revisions, events, approvals, Marker Chat, marker intents, confirmations, revisions, application logs, export settings, durable rate limits, observability events, and Qwen provider-attempt audits.
- Mounts server-backed routes under `/v1/projects/:projectId/edit-sessions/...` and `/v1/edit-briefs/...`.
- Keeps browser mock clients available for local mode.

## Production Gates

- Authentication: `requireAuth` fails closed in `production` and `cloud_run`; no mock user fallback.
- Authorization: `requireProjectAccess` checks `workspace_members`, `projects`, `edit_sessions`, `edit_briefs`, and `edit_cues`.
- Roles: viewers can read; editors/admins/owners can write; admin/owner actions are reserved for archive/admin flows.
- Persistence: server-side Supabase repositories require an injected service-role client.
- Qwen: live provider calls stay backend-only and require runtime/Secret Manager gates.
- Rate limits: production write routes use durable `production_route_rate_limits`.
- Idempotency: production write routes use `api_idempotency_keys`.
- Observability: sanitized route/repository/provider events store no raw prompts, provider payloads, secrets, auth headers, signed URLs, or local file paths.

## Verification - 2026-06-26

- Local Supabase migration validation passed with `supabase db reset --local --no-seed`.
- Generated Supabase types were refreshed with the local schema and cover the production gate tables.
- Local RLS/Data API grant audit passed for the 24-table production/auth/rate/observability gate set, including service-role-only idempotency.
- Remote staging branch `reeditpro-internal-staging-clean` received `20260626162800_public_production_edit_session_brief_qwen_gates` and passed table/RLS/grant audit for 24 checked production/auth/rate/observability tables.
- Active remote project received `20260626163138_public_production_edit_session_brief_qwen_gates` and passed the same table/RLS/grant audit.
- Production auth/workspace, Supabase repository, durable Qwen gate, and observability smokes passed.
- Live Qwen owner-config verification passed: `doctor:qwen-beta`, `smoke:qwen-live-provider`, and `smoke:qwen-marker-chat-live` all passed with `runtimeSource: qwen_live`, `fallbackUsed: false`, no secret printing, no `gcloud`, and no render/worker/credit activity.
- Build, server build, lint, frontend boundary, `qa:user-facing-editing`, `qa:internal-testing`, `qa:editor`, and `qa:viewport` passed when Playwright wrappers were run on isolated ports.

## Deployed Verification - 2026-06-26

- Cloud Run service: `reeditpro-api`.
- Public base URL: `https://reeditpro-api-390722338345.us-central1.run.app`.
- Serving revision after monitoring/rollback drill: `reeditpro-api-00024-xgs`.
- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-api:public-beta-20260626-prodserver-06`.
- Cloud Build: `295c7833-cc99-42c5-827f-14ff0263c162`.
- Image digest: `sha256:36d8fe530c5d62febb5085560b313ef027c02de0b84c06a26329f8156bf98ce1`.
- `npm run check:production-beta-live-route` passed: `/health` and `/health/readiness` return production/cloud mode, `mockOnly: false`, rollback flags are not forced, Qwen readiness requires a bearer token, and invalid bearer tokens are rejected.
- `GOOGLE_CLOUD_PROJECT_ID=reeditpro npm run check:production-qwen-live-route` passed: authenticated readiness is `ready_live_beta`, runtime source is `qwen_live`, fallback was not used, provider/Qwen calls were made, marker-scoped user/assistant/intent records persisted, durable idempotency replay returned, and no secret value, authorization header, raw provider payload, worker, render, or credit effect was exposed.
- `npm run configure:production-api-monitoring` and `npm run check:production-monitoring-gates` passed: one enabled email channel, two Qwen log metrics, and four enabled alert policies are configured for API 5xx, API p95 latency, Qwen fallback, and Qwen secret/provider failure.
- `REEDITPRO_CONFIRM_ROLLBACK_DRILL=true npm run check:production-rollback-drill -- --execute` passed: Qwen fallback, Edit Brief read-only, global write-disable, and restore flags were each observed through `/health/readiness`.

## Remaining Caveats

The deployed production-gated public beta path is verified and operationally gated. Full media/render/credit production remains intentionally disabled, and broader product rollout should stay scoped to owner-approved beta users plus continued user-flow QA. The local shell readiness checker remains blocked unless production env and Supabase CLI context are injected locally; deployed Cloud Run verification is now the source of truth for the live runtime.

## References

- Supabase RLS and API security: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/api/securing-your-api
- Supabase Data API grants change: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- Cloud Run monitoring and IAM: https://docs.cloud.google.com/run/docs/monitoring and https://docs.cloud.google.com/run/docs/securing/managing-access
- Secret Manager best practices: https://docs.cloud.google.com/secret-manager/docs/best-practices

Production-gated public beta path ready: true for the verified server routes above. Full media/render/credit production remains gated separately.
