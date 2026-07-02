# Codex Fix Prompts Roadmap

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

## Recommended Next Prompt

`RP-FIX-16 - Cloud Run And Secret Manager Runtime Binding`

Goal: prepare the backend runtime deployment and Secret Manager binding path needed before any future real provider transport can be enabled, without adding real provider calls or exposing secrets.
