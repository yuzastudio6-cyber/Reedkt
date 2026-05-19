# SFX Milestone Roadmap

## Purpose

This roadmap sequences future SoundSync SFX Director work. RP-SFX-01 is documentation only and must not create contracts, migrations, backend services, UI, provider integrations, secrets, workers, uploads, rendering, Stripe, or mobile screens.

## Milestones

### RP-SFX-01 - SoundSync SFX Director Architecture

Create the architecture docs for professional SFX decisions, provider roles, prompt strategies, timing, trim, mix, QA, library growth, and approval rules.

### RP-SFX-02 - TypeScript SFX Contracts

Add typed SFX Director contracts for decision states, target layers, provider routing, prompt adapters, timing/trim metadata, mix plans, QA actions, and library candidate metadata.

### RP-SFX-03 - Supabase Migration: SFX Director Tables

Create reviewed local Supabase migration or draft migration for SFX Director records, linked to approved snapshots, edit plans, generated assets, QA reports, and credit estimates.

### RP-SFX-04 - Mock SFX Director Service

Implement deterministic mock SFX planning that detects opportunities, chooses needed/optional/not-needed/avoid states, classifies edit-layer targets, recommends timing anchors and volume profiles, and creates mock provider routes without provider calls.

### RP-SFX-05 - Provider Prompt Adapters: Mirelo + MMAudio

Implement mock-only prompt adapters for Mirelo SFX V1.5, MMAudio V, and internal library search. Keep real provider calls blocked.

### RP-SFX-06 - SFX Timing, Trim + Hit Alignment Planner

Implement mock-only duration planning, waveform/transient analysis metadata, trim ranges, hit offsets, frame-aware placement, pre-roll, tail, and timing validation. No real audio processing happens.

### RP-SFX-07 - SFX Volume, Mix + Ducking Planner

Implement mock-only volume profiles, target gain hints, fades, voice/music ducking, sidechain intent, EQ, stereo width, room/reverb match, mix validation, and the `run_sfx_qa` handoff. No real audio processing happens.

### RP-SFX-08 - SFX QA + Regeneration Decision

Implement mock SFX QA checks, scoring, issue generation, regeneration decisions, adjustment decisions, future library replacement recommendations, remove-SFX decisions, and chat-ready summaries. Actions include use, use with mix adjustment, trim again, lower volume, regenerate, replace with library, remove SFX, or ask user.

### RP-SFX-09 - Generated SFX Library Growth

Implement mock project-only SFX asset decisions, internal library search records, usage records, provenance review, privacy/licensing reuse policy, library candidate evaluation, usage learning, and future library-first routing. No real promotion or storage happens.

### RP-SFX-10 - Chat-Native SFX Plan UI

Add mock chat-native cards only when needed: SFX Director Plan, Event, Provider Route, Prompt Preview, Timing/Trim Plan, Mix Plan, QA Result, Library Candidate, Credit Estimate, Progress, and Revision Options. Keep SFX inside chat, not a separate dashboard.

### RP-SFX-11 - SFX Worker Skeleton

Add mock worker skeletons for provider dispatch, approval/credit gates, internal-library match, mock Mirelo/MMAudio runtime responses, waveform analysis, trim/hit alignment, mix, QA, usage records, library-growth metadata, and worker events. No real provider calls until explicitly approved.

### RP-SFX-12 - Mirelo + MMAudio Provider Adapter Layer

Add mock-first provider adapter contracts, config/runtime modes, request builders, response parsers, safety gates, mock Mirelo/MMAudio/internal-library clients, disabled real-client placeholders, worker integration, and scenarios. Real provider calls stay blocked until a later milestone with approved backend security, Secret Manager, storage, retries, QA, terms, and cost controls.

## Guardrails

- No random SFX.
- No SFX for every source action by default.
- No expensive SFX generation before approval and credit reservation.
- No real provider calls until a dedicated real-integration milestone.
- Provider secrets stay out of source control, frontend, database rows, logs, and payloads.
- Generated SFX starts project-only and becomes reusable only after QA/provenance review.
