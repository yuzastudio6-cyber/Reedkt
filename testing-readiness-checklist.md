# Testing Readiness Checklist

## Repo Readiness

- [ ] `package.json` includes `dev`, `build`, `lint`, `preview`, and `test:readiness`.
- [ ] `README.md` and `AGENTS.md` describe safe local development boundaries.
- [ ] Required product/planning docs exist or missing docs are reported as warnings.
- [ ] Old contradictory copy does not claim production execution is ready.

## Frontend Readiness

- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run lint` passes.
- [ ] Vite dev can be started manually.
- [ ] Chat editor loads without import crashes.
- [ ] Detailed and Developer planning cards can render collapsed.

## Mock Planning Readiness

- [ ] Mock `EditPlan` exists.
- [ ] Source sequence exists.
- [ ] Aspect ratio gate exists.
- [ ] Source cleanup exists.
- [ ] Trim review exists.
- [ ] Master timing exists.
- [ ] Caption/visual cue timing exists.
- [ ] SoundSync transition timing exists.
- [ ] Timing validation exists.
- [ ] Visual/layout/render/tool plans exist.
- [ ] Editing agent execution exists.
- [ ] Async reconciliation exists.
- [ ] Agent QA/fallback exists.
- [ ] Credit estimate exists.
- [ ] Planner validation exists.
- [ ] Planner regression exists.

## Supabase Readiness

- [ ] Active migrations exist under `supabase/migrations`.
- [ ] RLS migration exists.
- [ ] Storage migration exists.
- [ ] Manual SQL test files exist under `database/test-sql`.
- [ ] Codex does not run migrations for this milestone.
- [ ] Local/staging manual testing remains required.

## Tool Readiness

- [ ] Browser-safe preview tools are classified separately from production execution.
- [ ] Worker-only tools remain worker/runtime candidates.
- [ ] AudioFlux is the launch audio analysis candidate.
- [ ] Signalsmith Stretch is the launch stretch/pitch candidate.
- [ ] FFmpeg remains LGPL Configuration until reviewed.
- [ ] VapourSynth remains worker-only and plugins require separate review.
- [ ] Sharp + libvips has dependency/security/LGPL review notes.
- [ ] Essentia and Rubber Band are not launch defaults.
- [ ] Provider models remain separate from open-source tools.

## Safety Readiness

- [ ] No real API keys are committed.
- [ ] Service role is not exposed to frontend code.
- [ ] No real provider calls are implemented.
- [ ] No production tool execution is implemented.
- [ ] No cloud deployment is implemented.
- [ ] No Stripe or billing runtime is implemented.
- [ ] No mobile work is implemented.
