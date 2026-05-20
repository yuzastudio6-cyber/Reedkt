# StoryTiming Milestone Roadmap

## Purpose

This roadmap sequences StoryTiming implementation. RP-TIMING-01 is architecture and documentation only. It consolidates existing timing concepts and defines the future Master Timing Map without creating contracts, tables, services, UI, workers, or migrations.

## Milestones

| Milestone | Purpose | Creates | Does not create | Depends on | Next |
| --- | --- | --- | --- | --- | --- |
| RP-TIMING-01 - StoryTiming Consolidation + Master Timing Map Architecture | Audit distributed timing and define StoryTiming as the master timing coordinator. | Architecture docs, existing timing audit, system boundaries, roadmap, render manifest plan, QA plan. | No contracts, tables, services, UI, workers, migrations, provider calls, or rendering. | Existing planning, edit quality, Stroke Motion, music, SFX, generation, render, review, and QA docs/types. | RP-TIMING-02 |
| RP-TIMING-02 - TypeScript StoryTiming Contracts | Add shared TS contracts for master timing maps, anchors, events, dependencies, conflicts, QA checks, and render manifest shapes. | `src/types/storytiming.ts` or equivalent exports and mock record examples. | No Supabase migration, services, UI, or real media analysis. | RP-TIMING-01 architecture. | RP-TIMING-03 |
| RP-TIMING-03 - Supabase Migration: StoryTiming Master Tables | Add reviewed local migration for StoryTiming tables. | Local migration `202605190002_storytiming_master_tables.sql` with master maps, segments, anchors, events, dependencies, conflicts, resolutions, QA checks, render manifests, manifest tracks/events, and simple views. | No remote Supabase execution, real workers, backend services, UI, rendering, or provider integrations. | RP-TIMING-02 contracts and migration review. | RP-TIMING-04 |
| RP-TIMING-04 - Mock StoryTiming Planner | Compile existing distributed timing records into a deterministic mock Master Timing Map. | Mock service/orchestrator, scenarios, in-memory records. | No real transcript alignment, beat detection, render execution, or media processing. | RP-TIMING-02/03. | RP-TIMING-05 |
| RP-TIMING-05 - Caption + Cut Timing Integration | Connect edit segment, transcript text, caption, pacing, cut, pause, and phrase timing into StoryTiming events. | Mock transcript anchors, caption timing plans/events, cut timing plans/events, pause preservation, J-cut/L-cut hints, caption/cut conflicts, and focused QA. | No real transcript alignment, UI, render changes, music/SFX integration, or signature timing integration. | RP-TIMING-04. | RP-TIMING-06 |
| RP-TIMING-06 - Music Beat + SFX Timing Integration | Connect music cues, mock beat grids, ducking, SFX event plans, trims, alignments, mix timing, ambience, and voice safety. | Mock music/SFX anchors/events, beat grids, ducking timing plans, SoundSync dependencies, conflicts, QA checks, scenarios, and orchestration. | No AudioFlux, FFmpeg, real beat detection, provider calls, rendering, or audio processing. | RP-TIMING-04/05 and existing SoundSync music/SFX layers. | RP-TIMING-07 |
| RP-TIMING-07 - Signature Animation Timing Integration | Connect Stroke Motion, Graphic Design / VisualExplain, and Real Motion timing into the StoryTiming master map. | Signature timing plans, Stroke Motion start/beat/complete events, Graphic reveal/hide events, Real Motion enter/move/settle/exit events, signature SFX dependencies, overlay conflicts, mock scenarios, and focused signature QA. | No real animation/render worker, provider calls, media processing, UI, migrations, or Supabase execution. | RP-TIMING-04/05/06 and existing signature/SoundSync records. | RP-TIMING-08 |
| RP-TIMING-08 - Timing QA Engine | Run cross-system QA over the Master Timing Map and decide preview/render readiness. | Mock full QA report, category scores, readiness decision, adjustment recommendations, render readiness checks, QA scenarios, and chat-ready summaries. | No real media inspection, UI, render workers, provider calls, migrations, or Supabase execution. | RP-TIMING-05/06/07. | RP-TIMING-09 |
| RP-TIMING-09 - Chat-Native Timing Review UI | Show timing conflicts, protected pauses, cue timing, QA scores, readiness, recommendations, and render manifest placeholders inside chat. | Inline timing review cards, optional chat flow, compact mock actions, and review documentation. | No separate timeline dashboard, backend mutation, real rendering, or real editing execution. | RP-TIMING-08. | RP-TIMING-10 |
| RP-TIMING-10 - Render Timing Manifest + Worker Readiness | Produce a worker-readable manifest from approved/mock-ready StoryTiming records. | Render manifest builder services, tracks, manifest event payloads, dependency maps, layer-order rules, worker input records, validation, mock scenarios, and handoff docs. | No FFmpeg, Remotion, real rendering, uploads, cloud storage, provider calls, or export execution. | RP-TIMING-08/09 and render architecture. | Future render worker implementation |

## Guardrails

- Do not duplicate existing timing systems.
- Do not remove existing timing fields.
- Do not claim timing is missing.
- StoryTiming consolidates and coordinates distributed timing.
- Speech meaning, emotional pauses, and viewer comprehension remain protected.
- Music, SFX, and signature animation timing must not override speech meaning unless the approved edit is intentionally music-driven.
- Future migrations should connect existing planning, edit quality, music, SFX, signature, generation, render, review, and QA timing records.

## Implementation Order Rationale

Contracts come before migrations so the application model is clear. Mock planning comes before UI so the UI has stable data to show. Timing QA comes before render manifests so workers receive timing that has already been checked. Render manifests come after chat review so approved timing can be frozen before execution.
