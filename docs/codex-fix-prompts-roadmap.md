# Codex Fix Prompts Roadmap

## Merge Readiness Note

RP-MERGE-AUDIT-00 documents that merge state is `path_divergence_risk`, not clean or merged. Before staging future prompt work, read `docs/repo-merge-integrity-audit.md`, `docs/repo-path-divergence-audit.md`, and `docs/repo-next-safe-staging-plan.md`.

## Completed / Partially Completed

### RP-FIX-06 Auth Profile Workspace Bootstrap

Status: partially fixed.

Implemented:

- frontend-safe Supabase anon client;
- auth session/user helpers;
- profile bootstrap;
- workspace and membership bootstrap;
- current workspace context;
- hook and compact status card;
- runtime boundary docs.

Still open:

- backend service-role bootstrap fallback;
- full auth pages;
- deployed storage/upload runtime;
- production Supabase validation.

### RP-FIX-07 Storage Upload Pipeline Readiness

Status: partially fixed.

Implemented:

- active storage bucket constants;
- upload purpose mapping;
- storage path builder;
- upload validation;
- frontend-safe storage client helpers;
- upload plan service;
- mock media/reference/generated/audio/thumbnail record creation;
- source upload order flow;
- mock upload scenarios and orchestrator;
- storage schema/bucket/runtime docs;
- local storage policy readiness migration.

Still open:

- deployed buckets and storage policies;
- backend signed upload/download routes;
- production profile/brand asset storage policy;
- real upload UI;
- Supabase local/staging validation.

### RP-FIX-08 Backend API Runtime Boundary

Status: partially fixed.

Implemented:

- API runtime contracts and response envelopes;
- route registry across auth, projects, media, planning, credits, jobs, generation, render, music, SFX, StoryTiming, storage, providers, admin, and Stripe;
- mock API router for safe local flows;
- frontend API client defaulting to mock mode;
- backend-required and disabled route metadata for privileged/provider/payment/admin operations;
- backend API route map, runtime boundary, and mock runtime docs.

Still open:

- deployed backend transport;
- service-role handlers;
- signed storage upload/download handlers;
- credit ledger runtime;
- provider gateway;
- Stripe/payment runtime;
- worker queue and render execution.

### RP-FIX-09 Credit Runtime Approval Gate

Status: partially fixed.

Implemented:

- credit runtime types;
- mock estimate runtime service;
- approval gate checks for approved plan, approved estimate, reservation, scope, expiration, and available credits;
- mock reservation, spend, release, and refund skeletons;
- generation/render/music/SFX/provider/worker credit gate helpers;
- mock credit scenarios and orchestrator;
- backend API gate routes and mock handlers;
- credit runtime, reservation, and generation gate docs.

Still open:

- deployed backend ledger runtime;
- transactional reserve/spend/release/refund enforcement;
- Stripe checkout, purchase, webhook, and subscription integration;
- production wallet balance validation;
- real worker/provider/render execution behind the gate.

### RP-FIX-10 Job Orchestration Runtime

Status: partially fixed.

Implemented:

- job runtime types;
- job gate service;
- mock queue service;
- dependency chain service;
- mock worker dispatch service;
- job event, retry/recovery, and chat summary services;
- mock job runtime scenarios and orchestrator;
- job API route metadata and mock handlers;
- job runtime readiness docs.

Still open:

- deployed backend queue transport;
- service-role job mutations;
- Cloud Run or worker runtime dispatch;
- worker leases, locks, and heartbeat enforcement;
- real render worker skeleton;
- provider/render execution behind backend secrets.

### RP-FIX-11 Backend Runtime Transport And Worker Lease Skeleton

Status: partially fixed.

Implemented:

- backend runtime envelope and transport types;
- worker lease types;
- mock runtime envelope service and transport placeholders;
- mock worker lease claim, heartbeat, renew, release, complete, fail, cancel, and stale recovery;
- idempotency helpers and worker runtime registry;
- local-only worker lease/runtime message migration;
- route metadata and mock handlers for runtime/lease flows;
- mock runtime/lease scenarios and orchestrators;
- runtime transport, worker lease, heartbeat/recovery, idempotency, and Cloud Run placeholder docs.

Still open:

- deployed backend API/runtime;
- transactional service-role lease claims;
- durable idempotency enforcement;
- Cloud Run/PubSub/Supabase Edge deployment;
- real worker/provider/render execution;
- production worker lease recovery and side-effect reconciliation.

### RP-FIX-12 Production Backend Runtime Scaffold

Status: partially fixed.

Implemented:

- Cloud Run API service selected as first backend runtime target;
- mock-only Node HTTP server scaffold;
- health, readiness, runtime status, route registry, and mock API transport endpoints;
- server-only env presence checks with no secret values;
- Vite SSR server build and Dockerfile scaffold;
- Cloud Run plan, local dev docs, deployment checklist, and readiness audit.

Still open:

- Cloud Run deployment;
- Secret Manager binding;
- service account IAM review;
- request auth and rate limiting;
- real service-role handlers;
- Stripe webhooks;
- provider and render workers;
- monitoring and production incident controls.

### RP-FIX-14 Project SFX Workflow Integration

Status: partially fixed.

Implemented:

- project-level SFX integration service;
- project SFX status service;
- project SFX orchestrator and scenarios;
- SFX project API route metadata and mock handlers;
- editor chat project SFX status panel;
- mock flow from SFX Director to provider route, prompt plan, credit gate, mock generation request, mock job, mock worker, provider adapter, trim/hit alignment, mix, QA, and project/library decision.

Still open:

- real Mirelo/MMAudio provider execution;
- Secret Manager provider key wiring;
- Cloud Run worker deployment;
- real storage/audio outputs;
- credit spend/refund after worker completion;
- production provenance and reuse review.

### RP-FIX-15 Real SFX Provider Execution Readiness

Status: partially fixed.

Implemented:

- backend-only SFX provider readiness service;
- readiness scenarios and mock orchestrator;
- `sfx.providerReadiness.check` route metadata and mock handler;
- structured readiness result with provider mode, runtime mode, block reasons, warnings, required backend capabilities, and safe next step;
- docs for readiness-only real provider execution preparation.

Still open:

- live Mirelo/MMAudio transport;
- Secret Manager value resolution;
- Cloud Run worker deployment;
- private storage output writes;
- real provider response parsing;
- credit spend/refund finalization;
- production provenance and terms review.

### RP-EDITLEVEL-00 Existing Edit Level Surface Audit

Status: docs/report/smoke audit completed.

Implemented:

- existing Basic/Pro/Premium edit-level surface inventory;
- future Normal/Premium/Ultra Premium product contract audit;
- tool routing and Qwen 3.7/Qwen2.5-VL routing audits;
- Project setup, Edit Session, Edit Brief, Edit Preference/DNA, Source Understanding, QA, credit estimate, and render budget audits;
- reuse vs new build plan, blocker list, beta decision register, and milestone roadmap;
- `smoke:edit-level-surface-audit`.

Still open:

- runtime `EditLevelProfile` and resolver;
- level-aware Qwen/tool/source-understanding/QA/estimate profiles;
- UI label migration and approved snapshot compatibility;
- durable persistence and production gates.

### RP-EDITLEVEL-01 Edit Level Product Contract + Architecture

Status: docs/status/smoke architecture completed.

Implemented:

- Normal, Premium, and Ultra Premium product contract;
- future `EditLevelProfile` architecture;
- legacy basic/pro/premium compatibility;
- level-aware tool routing and Qwen 3.7/Qwen2.5-VL routing architecture;
- level-aware source understanding, Edit Brief, Edit Preference/DNA, QA profile, estimate/budget, fallback/degraded capability, UI recommendation, backend service, and integration architecture;
- internal testing plan and RP-EDITLEVEL-02 types/fixtures handoff;
- `smoke:edit-level-architecture`.

Still open:

- repositories, API routes, UI behavior, persistence, runtime workers, model calls, render/export, and credit execution;
- final `needs_product_value` credit/render/revision/variant budget values.

### RP-EDITLEVEL-02 Edit Level Types, Profiles, and Mock Fixtures

Status: mock-safe type/profile foundation completed.

Implemented:

- public `src/types/edit-level.ts` contract and barrel export;
- Normal, Premium, and Ultra Premium deterministic profile fixtures;
- source-aware legacy basic/pro/premium compatibility mappers;
- profile, summary, UI-card, and recommendation fixture mappers;
- request/response-only backend contracts;
- mock scenarios and orchestrator flows;
- type contract docs and `smoke:edit-level-types`.

Still open:

- RP-EDITLEVEL-03 mock repository/API/client layer, now complete as mock-only;
- RP-EDITLEVEL-04 UI cards/recommendation behavior, which may be pulled earlier if visible level selection is needed;
- runtime migration, persistence, live Qwen/tool execution, render/export, and credit execution.

## Recommended Next Prompt

`RP-FIX-16 - Cloud Run And Secret Manager Runtime Binding`

Goal: prepare the backend runtime deployment and Secret Manager binding path needed before any future real provider transport can be enabled, without adding real provider calls or exposing secrets.

Completed follow-up: `RP-EDITLEVEL-03 - Mock Repository + API/Client Layer`.

Result: mock-safe repository and API/client layer for RP-EDITLEVEL-02 fixtures while preserving legacy basic/pro/premium compatibility and avoiding production routes, migrations, providers, media workers, render/export, and credit execution.

### RP-EDITLEVEL-03 Mock Repository + API/Client Layer

Status: complete as mock-only access boundary.

Added:

- repository types and side-effect flags;
- MockDatabase collections and fixture-backed mock repository operations;
- disabled Supabase skeleton;
- mock local planning-domain route metadata and handlers;
- browser-safe client wrapper with separated mock adapter;
- repository/API/client docs, scenarios, orchestrators, and smokes.

Not added:

- runtime edit-level migration or `basic | pro | premium` rename;
- visible UI behavior or `ChatNativeEditor` changes;
- production HTTP routes, Supabase reads/writes, migrations, provider/model calls, media workers, render/export, progress, or credit spend.

Recommended edit-level prompt: `RP-EDITLEVEL-04 - UI Cards + Recommendation`.

### RP-EDITLEVEL-04 UI Cards + Recommendation

Status: complete as visible mock/local UI layer.

Added:

- browser-safe UI adapter over the mock Edit Level client;
- Normal/Premium/Ultra Premium card components;
- recommendation banner, selected summary, tool-depth summary, estimate notice, and boundary notice;
- `/projects/new`, editor setup card, and planning context display; Edit Brief summary remains focused on optional user direction;
- docs, smoke coverage, and focused Playwright coverage.

Not added:

- runtime edit-level migration or `basic | pro | premium` rename;
- `ChatNativeEditor` runtime behavior changes;
- live planner/tool routing, provider/model calls, media workers, render/export, progress, migrations, Supabase, or credit spend.

Recommended edit-level prompt: `RP-EDITLEVEL-05 - Level-Aware Tool Capability Router`.

### RP-EDITLEVEL-05 Level-Aware Tool Capability Router

Status: complete as mock/local router.

Added:

- public router types and side-effect flags;
- deterministic capability registry and level packages;
- browser-safe UI adapter and summaries;
- backend mock registry, routing, readiness, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible capability summary/list/fallback UI;
- docs, smoke coverage, and focused Playwright coverage.

Not added:

- runtime edit-level migration or `basic | pro | premium` rename;
- `ChatNativeEditor` runtime behavior changes;
- production HTTP routes, provider/model calls, media workers, render/export, progress, migrations, Supabase, or credit spend.

Recommended edit-level prompt: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.

### RP-EDITLEVEL-06 Level-Aware Source Video Understanding Routing

Status: complete as mock/local router.

Added:

- public source-understanding types and no-execution side-effect flags;
- deterministic source layer registry and level packages;
- marker context windows and future Qwen context policy by level;
- browser-safe UI adapter and summaries;
- backend mock registry, routing, marker, Qwen, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible source-depth summary/list/marker/fallback UI;
- docs, smoke coverage, and focused Playwright coverage.

Not added:

- runtime edit-level migration or `basic | pro | premium` rename;
- `ChatNativeEditor` runtime behavior changes;
- source-understanding tool execution, Qwen/Qwen2.5-VL calls, provider/model calls, media extraction, transcript/audio/graphic workers, render/export, progress, migrations, Supabase, uploads, external fetches, file-byte reads, or credit spend.

### RP-EDITLEVEL-07 Level-Aware Qwen Planning Profile

Status: complete as mock/local Qwen planning profile policy.

Added:

- public Qwen planning types and no-execution side-effect flags;
- deterministic Qwen reasoning, planning pass, prompt context, structured output, Marker Chat, Preference DNA, QA explanation, fallback, and estimate-only policies by level;
- browser-safe UI adapter and summaries;
- backend mock registry, profile, prompt, structured output, fallback, usage, validation, summary services, contracts, scenarios, and orchestrator;
- visible Qwen planning summary/dimension/fallback/usage-estimate UI;
- docs, smoke coverage, and focused Playwright coverage.

Not added:

- runtime edit-level migration or `basic | pro | premium` rename;
- `ChatNativeEditor` runtime behavior changes;
- Qwen/Qwen2.5-VL/DeepSeek calls, provider/model calls, real planner execution, edit-plan creation, media workers, render/export, progress, migrations, Supabase, uploads, external fetches, file-byte reads, or credit spend.

### RP-EDITLEVEL-08 Level-Aware QA Gates

Status: complete as mock/local QA gate policy.

Added:

- public QA gate types and no-execution side-effect flags;
- exactly 30 deterministic QA gate definitions;
- Normal baseline QA, Premium stronger creative QA, and Ultra Premium studio-level strict QA packages;
- browser-safe UI adapter and summaries;
- backend mock registry, routing, readiness, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible QA summary/list/readiness/fallback UI;
- docs, smoke coverage, and focused Playwright coverage.

Not added:

- runtime edit-level migration or `basic | pro | premium` rename;
- `ChatNativeEditor` runtime behavior changes;
- QA tool execution, Qwen/Qwen2.5-VL/DeepSeek calls, provider/model calls, real planner execution, edit-plan creation, media workers, render/export, progress, migrations, Supabase, uploads, external fetches, file-byte reads, or credit spend.

Follow-up completed by `RP-EDITLEVEL-09 - Level-Aware Estimates: Time, Credits, Render Budget`.

### RP-EDITLEVEL-09 Level-Aware Estimates

Status: complete as mock/local estimate policy.

Added:

- public estimate types and no-execution side-effect flags;
- exactly 15 deterministic estimate item definitions;
- Normal 20-45 minutes / 1.0x, Premium 45-90 minutes / 2.0x, and Ultra Premium 90-180 minutes / 4.0x packages;
- future render, revision, variant, storage, and worker budget metadata;
- browser-safe UI adapter and summaries;
- backend mock item registry, package, time, credit, render, revision, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible estimate summary/item/credit/render/revision/boundary UI;
- docs, smoke coverage, and focused Playwright coverage.

Not added:

- runtime edit-level migration or `basic | pro | premium` rename;
- `ChatNativeEditor` runtime behavior changes;
- credit reservation/spend/records, real planner execution, edit-plan creation, provider/model calls, media workers, progress, render/export, migrations, Supabase, uploads, external fetches, file-byte reads, or production billing.

Recommended edit-level prompt: `RP-EDITLEVEL-10 - End-to-End Internal Testing + Playwright Coverage`.

### RP-CREDITPOLICY-01 Credit Policy Lock

Status: complete as policy/types/docs/constants only.

Added:

- `1 credit = $0.10` and `100 credits = $10` constants/docs;
- product edit-level service fee floors and percentages for Normal/Premium/Ultra Premium;
- revised estimate and export lock copy;
- no-silent-recovery billing rules;
- policy-only tool-cost metering with `serviceFeeIncluded = false`;
- smoke coverage.

Not added:

- live billing, Stripe, Supabase migration, wallet mutation, provider/model calls, render/export charging, credit reservation/spend execution, production settlement, or runtime edit-level migration.
