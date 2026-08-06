# Backend-Local Journey Authority

Status: local/internal testing route restoration with owner-scoped authority

The older project edit-session, Edit Brief, and local edit-plan routes support the bounded browser testing journey. They are mounted by `server/app.ts` only when `isExplicitLocalInternalTestRuntime(env)` passes. They are not mounted in production or in a runtime whose worker mode is disabled or cloud-hosted.

## Mounted local/internal routes

- `POST /v1/projects/:projectId/edit-sessions`
- `GET /v1/projects/:projectId/edit-sessions`
- `GET /v1/edit-sessions/:editSessionId`
- `POST /v1/edit-sessions/:editSessionId/lifecycle-checkpoints`
- `POST /v1/projects/:projectId/edit-sessions/:editSessionId/local-brief`
- `GET /v1/projects/:projectId/edit-sessions/:editSessionId/local-brief`
- `POST /v1/projects/:projectId/edit-sessions/:editSessionId/local-edit-plans`
- `GET /v1/local-edit-plans/:planId`

The local services authorize the requested workspace and scope in-memory records by authenticated owner plus workspace. A plan, brief, or edit session belonging to another local-test identity is not returned even when its public identity is known.

## Local plan authority

The local plan response contains `authorityBoundary` with classification `legacy_local_preview_only`. It explicitly grants none of the following:

- canonical plan publication;
- approved snapshot creation;
- credit reservation or spend;
- tool, provider, worker, or render execution.

The boundary requires the canonical planning handoff and internal canonical publication path for later execution authority. Exact local-plan content can replay to the same record, while the same owner/workspace/plan identity with changed content fails with `IDEMPOTENCY_CONFLICT`.

This is a scoped unsafe-action blocker, not a blanket stop. Local preview contract testing plus canonical handoff preparation and inspection remain allowed forward-progress lanes.

## Evidence

`npm run smoke:backend-local-journey-authority` proves:

- the routes are available in the explicit local/internal runtime;
- the routes are absent when that runtime gate is closed;
- edit-session, brief, and plan records are owner/workspace scoped;
- changed plan replay is rejected;
- local-plan authority cannot be interpreted as canonical execution authority.

This slice adds no frontend behavior, provider call, Supabase action, billing or wallet mutation, deployment, public delivery, production render, Motion Studio work, or production-readiness claim.
