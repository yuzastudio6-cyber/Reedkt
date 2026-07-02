# Audio Milestone Roadmap

## Purpose

This roadmap sequences ReeditPro audio and SoundSync Music Intelligence work. It is documentation only and does not create migrations, integrations, Google Cloud resources, generated music, rendering, Stripe, uploads, or mobile screens.

## RP-AUDIO-01 - SoundSync Music Intelligence Architecture

Create the professional architecture docs for SoundSync Music Intelligence, Reference Music DNA, Lyria Pro prompt planning, audio library/licensing, and the audio roadmap.

No migration. No provider integration. No API keys.

## RP-AUDIO-02 - TypeScript Audio/Music Contracts

Add TypeScript contracts for music context analysis, cue sheets, reference music DNA, Lyria Pro prompt plans, generated music assets, music QA, mix/ducking plans, SFX assets, and library promotion status.

## RP-AUDIO-03 - Supabase Migration: Music Intelligence Tables

Create database tables for music context, music cue sheets, cue prompts, reference music DNA, generated track metadata, music QA, mix plans, SFX provenance, and library promotion candidates.

Do this only after contracts are agreed.

## RP-AUDIO-04 - Mock Music Director + Cue Sheet Planner

Implement a mock SoundSync Music Director service that creates deterministic cue sheets from chat-native project context without calling Lyria Pro.

RP-AUDIO-04 introduces local services, scenarios, and a mock orchestrator for music context analysis, language/culture planning, Reference Music DNA, cue sheets, cues, and mix guidance. It stops before Lyria prompt building, generation requests, provider calls, rendering, or Supabase runtime work.

## RP-AUDIO-05 - Lyria Pro Prompt Builder

Implement prompt and negative prompt builders for Lyria Pro. Keep output local/mock and approval-gated.

RP-AUDIO-05 creates mock Lyria Pro prompt plans, timestamped prompt segments, negative prompts, and validation warnings from SoundSync cue sheets. It stops before credit estimation, generation requests, provider calls, Google Cloud workers, and real audio generation.

## RP-AUDIO-06 - Reference Video Music DNA System

Implement mock Reference Music DNA extraction records and chat cards. No real copyrighted audio copying or provider calls.

## RP-AUDIO-07 - Music QA + Mix Planning

Implement mock QA and mix/ducking planners for generated or selected music cues.

## RP-AUDIO-08 - Chat-Native Music Plan UI

Add inline chat cards for Music Context Analysis, Music Cue Sheet, Lyria Prompt Preview, Music Credit Estimate, Music Generation Progress, Music QA Result, and Music Revision Options.

## RP-AUDIO-09 - Lyria Pro Worker Skeleton

Add a worker skeleton that accepts job IDs and validates approval/credit reservation boundaries, but does not call real Lyria Pro unless explicitly authorized in a later task.

## RP-AUDIO-10 - Real Lyria Integration Later

Integrate real Lyria Pro generation only after secure runtime, secret management, credit gates, QA, storage, and worker orchestration are ready.

This milestone must not start automatically after RP-AUDIO-09.
