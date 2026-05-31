# Production Architecture Freeze

This is the Prompt 1 production architecture contract for ReeditPro. It freezes ownership boundaries before deeper backend, database, worker, provider, render, storage, credit, or tool implementation begins.

This document is architecture-only. It does not implement production backend execution, service-role writes, provider calls, rendering, Stripe, migrations, Cloud Run deployment, worker execution, real storage uploads, package installation, or tool execution.

## Architecture Principle

ReeditPro is chat-native, but execution is record-native.

The frontend may collect intent, uploads, approvals, preview actions, and revision actions. The backend must turn those actions into structured records. Workers execute approved snapshots and trusted record IDs, not raw chat text.

Expensive or sensitive work requires all applicable records and gates first: approved edit plan, approved credit estimate, reserved credits, idempotency key, approved snapshot, job claim, storage-ready inputs, timing/frame context, and runtime readiness.

## Layer Boundaries

### Frontend / Vite / React

Allowed:

- Chat UI, upload UI, edit setup UI, inline planning cards, approval UI, preview UI, and revision UI.
- Frontend-safe Supabase anon reads/writes where RLS allows them.
- Calls to authenticated backend API routes.
- Display of backend-generated signed URL access, readiness status, credit estimates, plans, approvals, previews, revisions, and export status.

Not allowed:

- Service-role Supabase access or service-role keys.
- Provider keys, direct provider calls, or provider SDKs.
- Direct worker calls.
- Production Remotion, FFmpeg, Playwright, OpenCV, MapLibre, browser-capture, map, chart, or other tool execution.
- Credit ledger mutation, credit reservation/spend/refund mutation, or Stripe calls.
- Signed URL creation.
- Production render/export execution.
- Creation of canonical storage records without backend validation.

### Backend API / Cloud Run Service

Allowed:

- Authenticated API routes, workspace/project authorization, request validation, and audit logging.
- Service-role writes through audited backend paths.
- Idempotency checks and duplicate request rejection.
- Approved snapshot creation and validation.
- Upload intent creation, signed URL creation, and canonical storage object validation.
- Credit estimate approval checks, credit reserve/spend/release/refund mutation, and credit gate enforcement.
- Job creation, dependency checks, worker claim APIs, and worker heartbeat APIs.
- Provider gateway orchestration, provider attempt tracking, and provider webhook/checkback handling.
- Render/export job orchestration and render readiness checks.

Not allowed:

- Bypassing approval, credit, idempotency, storage, worker claim, or QA gates.
- Storing raw secrets in Supabase.
- Executing provider calls without approved snapshot and credit reservation when credits apply.
- Sending raw chat as the worker instruction.
- Returning service-role-only data, secrets, provider payloads, or signed URL internals to the frontend.

### Supabase

Allowed:

- Source-of-truth records for users, workspaces, projects, media, chat, planning, approved snapshots, credits, jobs, events, generation, render, QA, revisions, exports, storage object records, and audit events.
- RLS-scoped reads/writes for normal user-safe records.
- Append-only audit, ledger, and event records.
- Backend/service-role writes for privileged mutation paths.

Not allowed:

- Raw provider API keys, service-role keys, or long-lived signed URLs as source-of-truth values.
- Mutable approved snapshots except allowed status/audit fields.
- Direct user mutation of worker, provider, render, credit ledger, credit reservation, approved snapshot, or final export execution state.
- Unredacted provider payloads or secrets in rows.

### Storage

Allowed:

- Canonical private object paths for source media, generated assets, previews, exports, thumbnails, QA artifacts, and worker temp files.
- Backend-created upload intents and temporary signed URL events.
- Worker/backend writes after authorization, approved snapshot, job, and storage gates pass.

Rules:

- Canonical storage records store bucket/path only.
- Signed URLs are temporary events, not source-of-truth records.
- Source media is private by default.
- Generated assets are private by default.
- Worker-temp objects must have cleanup policy.
- The frontend must not invent storage canonical records without backend validation.

### Workers

Allowed:

- Execute approved snapshots only.
- Claim jobs, heartbeat, renew/release claims, and complete/fail/cancel jobs through backend-safe paths.
- Read canonical storage object references.
- Read secrets only from Secret Manager or secure runtime.
- Write sanitized job events, generated asset records, QA reports, render outputs, provider attempts, and export outputs through backend/service-role paths.

Not allowed:

- Executing raw chat.
- Using signed URLs as source-of-truth inputs.
- Logging secrets, service-role keys, provider keys, private credentials, or unredacted payloads.
- Bypassing credits, tier policy, storage readiness, timing/frame context, or QA gates.
- Silently changing the approved plan or improvising unapproved fallback.

### Provider Gateway

Allowed:

- Future backend-only routing to AI, image, video, music, SFX, and other providers.
- Normalize provider requests and responses.
- Store sanitized provider attempts and webhook/checkback summaries.
- Enforce model, tier, credit, approval, storage, prompt, and QA gates.

Not allowed:

- Frontend provider calls.
- Raw provider secrets in the database.
- Provider output becoming final truth without QA and approved asset reconciliation.
- Veo as a default or primary path.
- Provider calls before approval and reservation when credits apply.

### Render Pipeline

Allowed:

- Remotion as the final compositor.
- Render manifests built from approved snapshots and approved timing/frame context.
- Preview render jobs and final export jobs.
- Future FFmpeg postprocess in worker runtime.
- QA before export.

Not allowed:

- Rendering before approved snapshot.
- Rendering without required assets ready.
- Final export with blocking QA.
- Provider clips owning the whole final video unless a future approved render strategy explicitly allows it.
- Changing frame, aspect ratio, layout, timing, or required assets after approval without a new snapshot.

### Open-Source Tool Execution

Allowed:

- Future backend/worker execution only.
- Tool call intent records, readiness checks, runtime profiles, QA requirements, license/compliance status, and tool-specific workers after future prompts.

Not allowed:

- Frontend production tool execution.
- Installing all tools now.
- Calling tools directly from chat.
- Bypassing approval, credits, approved snapshots, worker claims, or storage readiness.
- Treating the planning registry as production readiness.

## Golden Execution Flow

Required future production flow:

```text
user chat/upload
-> media/upload records
-> source order records
-> media readiness/probe
-> intent analysis
-> edit plan
-> segment plans
-> signature/tool/render planning
-> credit estimate
-> approval
-> credit reservation
-> approved snapshot
-> job creation
-> worker claim
-> worker/tool/provider/render execution
-> generated asset/storage records
-> QA
-> preview
-> revision or export
```

## Absolute Gates

These conditions must block execution:

- No approved edit plan.
- No approved credit estimate.
- No active credit reservation when credits apply.
- No approved snapshot.
- No idempotency key for mutation.
- Missing workspace/project authorization.
- Missing media readiness.
- Missing storage object records.
- Missing timing/frame context.
- Missing tool/provider runtime readiness.
- Missing worker claim.
- Blocking QA.
- Unresolved revision requiring approval.
- Tool license/compliance block.
- Provider secret missing.
- Unsupported tier/model/tool route.

## Data Ownership Rules

| Data | Owning layer | Notes |
| --- | --- | --- |
| Chat messages | Supabase, via frontend/backend allowed writes | Frontend may submit; backend persists when privileged behavior is needed. |
| Intent analysis | Backend API / Supabase | Created from structured inputs, not raw chat alone. |
| Source clip order | Backend API / Supabase | Frontend may request order changes; backend validates project access. |
| Edit plan | Backend API / Supabase | Must remain structured and approval-aware. |
| Credit estimate | Backend API / Supabase | Estimate approval is required before reservation. |
| Approved snapshot | Backend API / Supabase | Backend-only creation; immutable execution contract. |
| Generation request | Backend API / Supabase | Created only after approved snapshot/gates where required. |
| Tool call intent | Backend API / Supabase | Intent only until future worker tool execution is approved. |
| Provider request attempt | Provider gateway / Supabase | Sanitized attempts only; no raw secrets. |
| Render job | Backend API / Supabase | Orchestrates worker/render path; does not execute in frontend. |
| Generated asset | Worker/backend / Supabase/storage | Private artifact with canonical storage object record. |
| QA report | Worker/backend / Supabase | Blocks export when required issues are unresolved. |
| Preview review | Frontend request, backend/Supabase record | User feedback creates structured review/revision records. |
| Revision request | Frontend request, backend/Supabase record | Material changes require new plan/snapshot approval. |
| Final export | Backend/worker / Supabase/storage | Requires approved snapshot, ready assets, QA pass, and export gates. |
| Audit event | Backend/worker / Supabase | Append-only, sanitized, no secrets. |

## Naming Convention

| Category | Convention |
| --- | --- |
| Branches | `codex/rp-foundation-<nn>-<slug>` for foundation milestones; later production prompts should use `codex/rp-prod-<nn>-<slug>`. |
| PR titles | `[foundation] Prompt <n> <short name>` for foundation prompts. |
| Docs | Lowercase kebab-case under `docs/`, with implementation records under `docs/implementation-prompts/`. |
| Migrations | Timestamped Supabase migrations in `supabase/migrations/YYYYMMDDNNNN_<slug>.sql` after migration review. |
| Backend services | PascalCase service names ending in `Service`, for example `ApprovedSnapshotService`. |
| Worker adapters | Snake_case lane names ending in `_worker`, for example `media_probe_worker`. |
| Tool adapters | Snake_case tool names plus `_adapter`, for example `ffmpeg_probe_adapter`. |
| Route IDs | Dot-separated domain/action IDs, for example `snapshots.createApproved` or `worker.claim.create`. |
| Job types | Snake_case action nouns, for example `media_probe`, `provider_asset`, `remotion_render`. |
| Status values | Lowercase snake_case with explicit terminal states, for example `pending`, `ready`, `blocked`, `running`, `succeeded`, `failed`, `cancelled`. |
| Audit events | Dot-separated domain outcome names, for example `gate.plan_approval.failed` or `worker.claim.created`. |

## Future Prompt Contract

Every future implementation prompt must state:

- What layer it touches.
- What production capability it enables.
- What remains blocked.
- Whether migrations are added.
- Whether service-role writes are added.
- Whether workers execute.
- Whether providers execute.
- Whether rendering executes.
- Whether credits are mutated.
- Validation run.
- Branch and PR details.

Any future prompt that changes these boundaries must update this file, `PRODUCTION_FOUNDATION_STATUS.md`, `docs/source-of-truth-map.md`, and the relevant implementation prompt record.
