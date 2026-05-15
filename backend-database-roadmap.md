# Backend Database Roadmap

## Purpose

This roadmap sequences future ReeditPro backend/database work after RP-DB-01. It is documentation only and does not create migrations, APIs, AI calls, Stripe integration, storage, Google Cloud services, rendering, or mobile screens.

## Phase 1: Documentation Foundation

- Finish RP-DB-01 architecture docs.
- Keep Supabase target as `reeditpro`.
- Keep all work docs-only.

## Phase 2: Supabase Project Setup

- Confirm the active Supabase project is `reeditpro`.
- Add local Supabase config only after credentials and project refs are verified.
- Do not use Yuza Studio Supabase resources.

## Phase 3: Core Migrations

Create initial migrations for:

- Account/workspace tables.
- Projects/chat tables.
- Media tables.
- Intent/planning tables.
- Credits tables.

Add RLS policies before using with real user data.

## Phase 4: Chat Persistence

- Persist chat sessions, messages, attachments, and inline card payloads.
- Store source clip ordering from chat attachments.
- Keep chat as the primary editor surface.

## Phase 5: Media Storage And Analysis

- Add Supabase Storage or Google Cloud Storage integration.
- Create upload records and media assets.
- Add transcript, scene, visual, and audio analysis jobs.
- Do not call expensive AI before approval gates are designed.

## Phase 6: Intent-Led Planner

- Implement intent analysis.
- Create edit plans and segments.
- Build Source Sequence Map and Recommended Edit Structure.
- Add signature routing records.
- Ensure video type/workflow context does not force signature systems.

## Phase 7: Professional Edit Quality Engine

- Add edit quality profile, pacing, cuts, transitions, audio environment, ambience, music, SFX, captions, and edit quality checks.
- Enforce the rule that Basic edits are professional clean edits, not low-quality edits.

## Phase 8: Credit Ledger

- Implement credit wallets, ledger entries, estimates, and reservations.
- Add weekly bonus credit grants.
- Add purchase placeholders before Stripe.
- Enforce reserve/spend/refund flow.

## Phase 9: Approval Gate

- Add approval records.
- Require plan and credit approval before generation.
- Block generation jobs without active reservation.

## Phase 10: Job Orchestration

- Add jobs, dependencies, events, agent runs, and agent outputs.
- Implement orchestrator service.
- Add retry, idempotency, and dependency behavior.

## Phase 11: Google Cloud Worker Bridge

- Connect database jobs to future Google Cloud workers.
- Use Cloud Run, Cloud Run Jobs, Pub/Sub, Cloud Storage, Secret Manager, and Artifact Registry as needed.
- Workers should load job context from Supabase by ID and write status/results back.

## Phase 12: Stroke Motion V1

- Implement Stroke Motion tables.
- Support `spoken_story_mode`.
- Support `source_reading_mode` and required `meaning_expansion`.
- Prefer deterministic renderer specs such as SVG, Lottie, or Remotion when possible.

## Phase 13: Future Signature Systems

- Implement Graphic Design / VisualExplain plans.
- Implement Real Motion plans.
- Implement SoundSync plans.
- Keep all systems segment-routed and approval-gated.

## Phase 14: Generation Provider Layer

- Add provider registry.
- Add generation requests and generated assets.
- Integrate providers behind worker services only.
- Keep provider secrets out of Supabase.

## Phase 15: Preview, QA, And Revisions

- Add render jobs, renders, preview reviews, comments, revision requests, approval records, and QA reports.
- Return preview to chat.
- Add revision estimates when needed.

## Phase 16: Export

- Implement export records and final render/export jobs.
- Add export QA.
- Do not publish to social platforms until a later explicit milestone.

## Phase 17: Stripe And Billing

- Add Stripe only after credit ledger rules are implemented.
- Subscription remains software access.
- Credits pay for generation/rendering/editing usage.

## Phase 18: Production Hardening

- Add monitoring, audit logs, rate limits, abuse prevention, cost controls, backup strategy, and operational dashboards.

## Phase 19: Mobile Companion Later

- Build mobile only after web product and backend are stable.
- Keep mobile as companion for upload, review, comments, approvals, export monitoring, and status.

