# TRACK_A_RENDER_EXPORT Internal Beta Gap Map

Status: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

This map records what is ready as documentation, what needs owner review, and what remains blocked before internal beta, external beta, or production.

| Area | Current Status | Evidence Exists | Gap | Before Internal Beta | Wait External Beta | Wait Production |
| --- | --- | --- | --- | --- | --- | --- |
| Owner routing contract | ready | yes | Owner review still needed before TOOL-ROUTE-1. | Confirm Track A contract in route dry-run planning. | N/A | N/A |
| Final composition planning | ready-with-warnings | yes | Candidate-only; no runtime approval. | Define schema validation and fixture examples. | Runtime execution evidence. | Scale, rollback, SLO, audit. |
| Private preview planning | ready-with-warnings | yes | Private artifact and review UX policy not executed. | Add private preview fixture plan and review QA gate. | Signed delivery policy if ever allowed. | Access-control and retention hardening. |
| Render manifest policy | ready-with-warnings | yes | Manifest is docs-only and not wired to worker runtime. | Define manifest schema and checksum enforcement. | Controlled worker dry-run. | Production renderer SLO and rollback. |
| Export manifest policy | blocked | partial | Export delivery policy, billing, storage, and QA are not approved. | Keep export execution blocked. | Private delivery review. | Production export delivery. |
| Caption burn-in preview route | ready-with-warnings | yes | libass/FFmpeg/Remotion execution remains blocked. | Define caption burn-in fixture contract. | Controlled caption/render worker review. | Production subtitle/burn-in path. |
| Overlay composition handoff | ready-with-warnings | yes | Alpha/bounds QA is policy-only. | Add fixture validator and collision QA. | Controlled preview execution. | Production composition QA. |
| AI Tools asset intake | ready-with-warnings | yes | AI Tools manifests are planning-only. | Owner review with AI Tools study. | Controlled graphics fixture route. | Production dependency/security review. |
| Map overlay intake | ready-with-warnings | yes | Map rendering/live tiles are blocked. | Owner review with MAP_GEOSPATIAL. | Controlled local map fixture route. | Production tile/data policy. |
| Web evidence visual intake | ready-with-warnings | yes | Browser capture/search execution is blocked. | Owner review with WEB_SEARCH_CAPTURE. | Controlled capture fixture route. | Production source review/retention. |
| Track B media analysis intake | blocked | partial | Track B owner study still pending. | Dispatch TRACK_B_MEDIA_PROCESSING owner study. | Controlled media analysis route. | Production media runtime. |
| Sound/music audio intake | blocked | partial | Sound owner study still pending. | Dispatch SOUND_MUSIC_AUDIO owner study. | Controlled audio cue route. | Production audio mix/render path. |
| Worker Runtime execution | blocked | yes | WORKER-1 is deterministic dry-run only. | TOOL-ROUTE-1 route dry-run planning only. | Worker runtime controlled execution approval. | Transactional backend runtime. |
| Supabase milestone sync | blocked | yes | `server/activation/supabase-milestone-sync` is missing on this branch. | None in Track A study. | Separate Supabase owner path if needed. | Production metadata policy. |

## Decision

TOOL-ROUTE-1 readiness: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`.

Internal beta is not unlocked by this packet. Track A runtime, render/export execution, public artifacts, signed URL delivery, billing, Supabase mutation, and production remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
