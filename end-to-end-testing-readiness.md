# End-to-End Testing Readiness

## Purpose

This document explains whether ReeditPro is ready for local and staging testing without enabling production execution.

It separates:

- frontend mock planning tests
- TypeScript, build, and lint checks
- schema and migration review
- Supabase local/staging tests
- provider mock tests
- cloud/runtime readiness tests
- production blockers

This milestone is audit and readiness tooling only. It does not run providers, tools, Supabase, SQL, Google Cloud, real media processing, billing, or rendering.

## Testing Readiness Layers

| Layer | What it checks |
| --- | --- |
| `repo_integrity` | Required docs, source folders, and audit records exist. |
| `package_scripts` | `dev`, `build`, `lint`, `preview`, and `test:readiness` are available. |
| `frontend_build` | Build is expected to run with `npm.cmd run build`. |
| `frontend_lint` | Lint is expected to run with `npm.cmd run lint`. |
| `mock_edit_plan` | The mock `EditPlan` includes all major planning layers. |
| `required_user_gates` | Source order, output frame, cleanup, timing, and credit gates are represented. |
| `planner_validation` | Planner validation checks hard product rules. |
| `planner_regression` | Demo scenarios preserve hard rules across the planning stack. |
| `tool_registry` | Open-source tools remain separate from provider models. |
| `launch_tool_stack` | AudioFlux, Signalsmith Stretch, FFmpeg LGPL, VapourSynth, and Sharp + libvips readiness is represented. |
| `provider_safety` | Basic/Pro no Veo, Premium fallback-only Veo, no default 1080P, and no transparent AI-video default are preserved. |
| `supabase_migrations` | Migration files are present for manual local/staging testing. |
| `rls_storage_policy` | RLS and storage policy readiness are represented in repo files. |
| `approved_snapshot` | Future workers execute approved snapshots, not raw chat. |
| `credit_estimate` | Credit estimate and approval boundaries are visible before execution. |
| `worker_runtime` | Worker/runtime plans are mock-only and approved-snapshot based. |
| `editing_agent_execution` | Future work graph is planned but not executed. |
| `async_reconciliation` | Future asset checkback and merge policy is represented. |
| `agent_qa_fallback` | QA/fallback policy exists before real execution. |
| `no_secret_leakage` | Placeholder env files must not contain real-looking secrets. |
| `no_real_execution` | No providers, tools, Supabase, SQL, cloud, rendering, billing, or workers run. |

## Testing Goals

The readiness layer verifies that:

- build and lint can be run locally
- the mock plan can be created
- major plan layers exist in the mock `EditPlan`
- required gates block future approval/execution paths when unresolved
- provider/tool execution is not accidentally enabled
- Supabase migrations and manual SQL test files are available but not executed
- RLS/storage, approved snapshot, and credit protections are represented
- no real secrets are present in `.env.example`
- there is no unlimited AI editing claim
- Basic/Pro cannot use Veo
- Veo is never primary/default
- generated routes do not default to 1080P
- AI-video background policy stays frame/panel matched

## Non-Goals

RP-TEST-01 does not:

- run Supabase locally or remotely
- run SQL or migrations
- call OpenAI, GPT-Image-2, Wan, Hailuo, Veo, Lyria, Mirelo, MMAudio, or any provider
- execute FFmpeg, VapourSynth, AudioFlux, Signalsmith Stretch, Sharp/libvips, OpenCV, Playwright, D3, ECharts, MapLibre, Turf, or Lottie as production tools
- deploy Google Cloud
- implement Stripe or billing
- render video or process real media
- create production secrets or environment variables

## Current Readiness Conclusion

ReeditPro is ready to add static/local frontend readiness checks. Real end-to-end production testing remains blocked until Supabase local/staging validation, backend runtime wiring, auth/profile bootstrap, storage policies, worker boundaries, provider mocks, and rendering boundaries are explicitly tested in later milestones.
